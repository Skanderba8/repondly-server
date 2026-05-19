import express from 'express';
import axios from 'axios';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import cron from 'node-cron';
import { generatePrompt } from './generatePrompt.js';
import { detectLanguage, determineResponseLanguage, containsDarija } from './lib/languageDetector.js';
import { updateCRMNotes } from './lib/crmNotesManager.js';
import { needsHumanHandover, notifyOwnerViaWhatsApp, updateHandoverStatus } from './lib/handoverManager.js';
import { triggerDeepExtraction } from './lib/informationExtractor.js';

dotenv.config();

// Debug: Check if environment variables are available
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('GROQ_API_KEY available:', !!process.env.GROQ_API_KEY);

const app = express();
// Use limit to prevent memory issues with large webhooks
app.use(express.json({ limit: '10mb' }));
// Enable CORS for all routes
app.use(cors());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const MAX_HISTORY      = 8;
const MAX_REPLY_TOKENS = 180;
const MAX_INPUT_CHARS  = 500;
const TEMPERATURE      = 0.3;

// ─── STATE MANAGEMENT ────────────────────────────────────────────────────────
const STATE_FILE = path.resolve('./conversations.json');

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch (e) {
    console.error('[State] Failed to load:', e.message);
  }
  return new Map();
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(Object.fromEntries(conversations)), 'utf-8');
  } catch (e) {
    console.error('[State] Failed to save:', e.message);
  }
}

const conversations = loadState();

function getConversation(id) {
  if (!conversations.has(id)) {
    conversations.set(id, {
      history: [],
      greeted: false,
      humanTookOver: false,
    });
  }
  return conversations.get(id);
}

function addToHistory(id, role, content) {
  const conv = getConversation(id);
  conv.history.push({ role, content });
  if (conv.history.length > MAX_HISTORY) {
    conv.history.splice(0, conv.history.length - MAX_HISTORY);
  }
  saveState();
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function trimInput(text) {
  if (text.length <= MAX_INPUT_CHARS) return text;
  return text.slice(0, MAX_INPUT_CHARS) + '…';
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────
// Welcome messages are now dynamic from business.greetingMessage
// System prompts are now generated dynamically via generatePrompt.js

// ─── CHATWOOT API ───────────────────────────────────────────────────────────
async function replyViaChatwoot(accountId, conversationId, message, apiToken) {
  const url = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
  const token = (apiToken || process.env.CHATWOOT_API_TOKEN).trim();

  try {
    await axios.post(url, 
      { content: message, message_type: 'outgoing', private: false },
      { 
        headers: { 
          'api_access_token': token,
          'api-access-token': token,
          'Authorization': `Bearer ${token}`
        } 
      }
    );
  } catch (err) {
    console.error(`[Chatwoot Send Error] Status: ${err.response?.status} | URL: ${url}`);
    throw err;
  }
}

async function addNoteToChatwoot(accountId, conversationId, note, apiToken) {
  const url = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
  const token = (apiToken || process.env.CHATWOOT_API_TOKEN).trim();

  try {
    await axios.post(url, 
      { content: note, message_type: 'outgoing', private: true },
      { 
        headers: { 
          'api_access_token': token,
          'api-access-token': token,
          'Authorization': `Bearer ${token}`
        } 
      }
    );
  } catch (err) {
    console.error(`[Chatwoot Note Error] Status: ${err.response?.status} | URL: ${url}`);
    throw err;
  }
}

async function updateConversationStatus(accountId, conversationId, status, apiToken) {
  const url = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}`;
  const token = (apiToken || process.env.CHATWOOT_API_TOKEN).trim();

  try {
    await axios.patch(url, 
      { status },
      { 
        headers: { 
          'api_access_token': token,
          'api-access-token': token,
          'Authorization': `Bearer ${token}`
        } 
      }
    );
  } catch (err) {
    console.error(`[Chatwoot Status Error] Status: ${err.response?.status} | URL: ${url}`);
    throw err;
  }
}

async function assignToHuman(accountId, conversationId, agentId, apiToken) {
  if (!agentId) return;
  const baseUrl = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}`;
  const token = (apiToken || process.env.CHATWOOT_API_TOKEN).trim();
  const headers = { 'api_access_token': token };
  try {
    await axios.post(`${baseUrl}/assignments`, { assignee_id: agentId }, { headers });
    await axios.post(`${baseUrl}/messages`, { content: `@human agent requested.`, message_type: 'outgoing', private: true }, { headers });
  } catch (err) {
    console.error(`[Handover Error]`, err.message);
  }
}

// ─── BUSINESS RESOLUTION ───────────────────────────────────────────────────────
async function resolveBusinessByInboxId(inboxId) {
  // First check ConnectedPage for inbox mapping
  const connectedPage = await prisma.connectedPage.findFirst({
    where: {
      chatwootInboxId: inboxId,
      active: true,
    },
    include: {
      business: {
        include: {
          botConfig: true,
        },
      },
    },
  });

  if (connectedPage && connectedPage.business.active) {
    return connectedPage.business;
  }

  // Fallback: check direct business inbox fields
  const business = await prisma.business.findFirst({
    where: { 
      active: true,
      OR: [
        { chatwootInboxId: inboxId },
        { whatsappInboxId: inboxId },
        { facebookInboxId: inboxId },
        { instagramInboxId: inboxId },
      ]
    },
    include: {
      botConfig: true,
    },
  });
  return business;
}

// ─── AI ENGINE ───────────────────────────────────────────────────────────────
async function getAIReply(conversationId, message, systemPrompt) {
  const conv    = getConversation(conversationId);
  const trimmed = trimInput(message);
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: MAX_REPLY_TOKENS,
    temperature: TEMPERATURE,
    messages: [{ role: 'system', content: systemPrompt }, ...conv.history, { role: 'user', content: trimmed }],
  });
  const reply = completion.choices[0].message.content.trim();
  addToHistory(conversationId, 'user', trimmed);
  addToHistory(conversationId, 'assistant', reply);
  return reply;
}

function parseJSONEnvelope(response) {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonString);
    }
    return { reply: response, action: null, extraction: null };
  } catch (e) {
    console.error('[JSON Parse Error]', e.message);
    return { reply: response, action: null, extraction: null };
  }
}

// ─── ACTION HANDLERS ──────────────────────────────────────────────────────────
async function handleOrderComplete(business, conversationId, data) {
  const { accountId, chatwootAgentId, ownerPhone, chatwootApiToken } = business;
  
  // Validate required fields
  const botConfig = business.botConfig;
  const requiredFields = botConfig?.requiredOrderFields || ['customer_name', 'phone', 'location', 'items'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    console.error(`[Order Complete] Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }

  // Format order summary
  const itemsList = data.items.map(item => `- ${item.name} x${item.qty}: ${item.price} DT`).join('\n');
  const summary = `🛍️ Nouvelle commande - ${business.name}\n\n` +
    `Client: ${data.customer_name}\n` +
    `📞 ${data.phone}\n` +
    `📍 ${data.location}\n\n` +
    `Commande:\n${itemsList}\n` +
    `Total: ${data.total} DT\n` +
    (data.notes ? `\nNotes: ${data.notes}` : '');

  // Add note to conversation
  await addNoteToChatwoot(accountId, conversationId, summary, chatwootApiToken);
  
  // Update conversation status to resolved
  await updateConversationStatus(accountId, conversationId, 'resolved', chatwootApiToken);
  
  // Notify owner
  await notifyOwner(ownerPhone, 'order', { businessName: business.name, ...data });
  
  // Log to conversations_log
  await prisma.conversationLog.create({
    data: {
      businessId: business.id,
      chatwootConversationId: conversationId,
      status: 'RESOLVED',
      terminalAction: 'ORDER',
      actionData: data,
    },
  });

  return true;
}

async function handleAppointmentComplete(business, conversationId, data) {
  const { accountId, chatwootAgentId, ownerPhone, chatwootApiToken } = business;
  
  // Validate required fields
  const botConfig = business.botConfig;
  const requiredFields = botConfig?.requiredAppointmentFields || ['customer_name', 'phone', 'service', 'date', 'time'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    console.error(`[Appointment Complete] Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }

  // Format appointment summary
  const summary = `📅 Nouveau rendez-vous - ${business.name}\n\n` +
    `Client: ${data.customer_name}\n` +
    `📞 ${data.phone}\n` +
    `Service: ${data.service}\n` +
    `Date: ${data.date} à ${data.time}`;

  // Add note to conversation
  await addNoteToChatwoot(accountId, conversationId, summary, chatwootApiToken);
  
  // Update conversation status to resolved
  await updateConversationStatus(accountId, conversationId, 'resolved', chatwootApiToken);
  
  // Notify owner
  await notifyOwner(ownerPhone, 'appointment', { businessName: business.name, ...data });
  
  // Log to conversations_log
  await prisma.conversationLog.create({
    data: {
      businessId: business.id,
      chatwootConversationId: conversationId,
      status: 'RESOLVED',
      terminalAction: 'APPOINTMENT',
      actionData: data,
    },
  });

  return true;
}

async function handleHumanHandover(business, conversationId, reason, crmNote) {
  const { accountId, chatwootAgentId, chatwootApiToken } = business;
  
  // Assign conversation to business owner's agent
  await assignToHuman(accountId, conversationId, chatwootAgentId, chatwootApiToken);
  
  // Set status to open
  await updateConversationStatus(accountId, conversationId, 'open', chatwootApiToken);
  
  // Notify owner via WhatsApp (new system)
  await notifyOwnerViaWhatsApp(business, crmNote, reason);
  
  // Update CRM note with handover status
  await updateHandoverStatus(prisma, business.id, conversationId, 'in_progress');
  
  // Log to conversations_log
  await prisma.conversationLog.create({
    data: {
      businessId: business.id,
      chatwootConversationId: conversationId,
      status: 'HANDED_OVER',
      terminalAction: 'HANDOVER',
      actionData: { reason },
    },
  });

  return true;
}

async function notifyOwner(phoneNumber, type, data) {
  // This function sends a WhatsApp message to the business owner
  // Uses WhatsApp Business API if configured, otherwise logs the message
  
  const messages = {
    order: `🛍️ Nouvelle commande - ${data.businessName}\n\nClient: ${data.customer_name}\n📞 ${data.phone}\n📍 ${data.location}\n\nCommande:\n${data.items.map(i => `- ${i.name} x${i.qty}: ${i.price} DT`).join('\n')}\nTotal: ${data.total} DT${data.notes ? `\n\nNotes: ${data.notes}` : ''}`,
    appointment: `📅 Nouveau rendez-vous - ${data.businessName}\n\nClient: ${data.customer_name}\n📞 ${data.phone}\nService: ${data.service}\nDate: ${data.date} à ${data.time}`,
    handover: `⚠️ Intervention requise - ${data.businessName}\n\n${data.customer_name || 'Un client'} a besoin d'aide.\nSujet: ${data.reason}`,
  };

  const message = messages[type] || `Notification: ${JSON.stringify(data)}`;
  
  // Log the message
  console.log(`[Notify Owner ${type}] To: ${phoneNumber} | Message: ${message}`);
  
  // Try to send via WhatsApp Business API if configured
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;
  
  if (whatsappApiUrl && whatsappApiToken && phoneNumber) {
    try {
      // Format phone number (remove +, spaces, dashes)
      const formattedPhone = phoneNumber.replace(/[\s\-\+]/g, '');
      
      await axios.post(`${whatsappApiUrl}/messages`, {
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      }, {
        headers: {
          'Authorization': `Bearer ${whatsappApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[Notify Owner ${type}] WhatsApp message sent successfully to ${phoneNumber}`);
    } catch (error) {
      console.error(`[Notify Owner ${type}] Failed to send WhatsApp message:`, error.response?.data || error.message);
      // Fallback: log the message for manual follow-up
      console.log(`[Notify Owner ${type}] MANUAL ACTION REQUIRED: Send to ${phoneNumber}: ${message}`);
    }
  } else {
    // No WhatsApp API configured, log for manual action
    console.log(`[Notify Owner ${type}] MANUAL ACTION REQUIRED: Send to ${phoneNumber}: ${message}`);
    console.log(`[Notify Owner ${type}] Configure WHATSAPP_API_URL and WHATSAPP_API_TOKEN to enable automatic sending`);
  }
}

// ─── WEBHOOK HANDLER ─────────────────────────────────────────────────────────
app.post('/chatwoot-webhook', async (req, res) => {
  const signature = req.headers['x-chatwoot-webhook-signature'];
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET;

  // 1. Signature Bypass for Nginx
  if (signature && secret && signature !== secret) {
    return res.sendStatus(401);
  }

  res.sendStatus(200);

  const event = req.body;
  const content = event.content;
  const conversationId = event.conversation?.id;
  const inboxId = event.conversation?.inbox_id;
  const accountId = event.account?.id;
  
  const senderType = event.sender ? event.sender.type : event.conversation?.meta?.sender?.type;

  if (event.message_type !== 'incoming' || senderType === 'agent' || !content) return;

  console.log(`[Acc: ${accountId} | Conv: ${conversationId} | Inbox: ${inboxId}] Incoming: ${content}`);

  try {
    // Resolve business by inbox ID
    const business = await resolveBusinessByInboxId(inboxId);
    
    if (!business) {
      console.log(`[Bot] No active business found for inbox ${inboxId}`);
      return;
    }

    const conv = getConversation(conversationId);

    if (conv.humanTookOver) return;

    // Check if bot is enabled via ConversationLog
    const log = await prisma.conversationLog.findFirst({
      where: { businessId: business.id, chatwootConversationId: conversationId }
    });
    if (log && !log.botEnabled) return; // bot paused by user

    // Detect language
    const detectedLanguage = detectLanguage(content);
    const responseLanguage = determineResponseLanguage(detectedLanguage, business.botConfig);
    
    // Log Darija detection for tracking
    if (containsDarija(content)) {
      console.log(`[Bot] Darija detected in message for conversation ${conversationId}`);
    }

    // Get or generate system prompt
    let systemPrompt = business.botConfig?.systemPrompt;
    if (!systemPrompt || business.botConfig?.needsRegen) {
      console.log(`[Bot] Generating prompt for business ${business.id}`);
      systemPrompt = await generatePrompt(business.id, prisma);
    }

    // Get AI reply with business-specific prompt
    const aiResponse = await getAIReply(conversationId, content, systemPrompt);
    
    // Parse JSON envelope
    const parsed = parseJSONEnvelope(aiResponse);
    
    // Send the reply to customer
    console.log(`[Bot] Reply: ${parsed.reply}`);
    await replyViaChatwoot(accountId, conversationId, parsed.reply, business.chatwootApiToken);
    
    // Update CRM notes with extraction data (if enabled)
    if (parsed.extraction && business.botConfig?.enableLiveExtraction) {
      try {
        await updateCRMNotes(prisma, business.id, conversationId, parsed.extraction);
        console.log(`[Bot] CRM notes updated for conversation ${conversationId}`);
      } catch (err) {
        console.error(`[Bot] Failed to update CRM notes:`, err.message);
      }
    }
    
    // Trigger deep extraction in background (if enabled)
    if (business.botConfig?.enableLiveExtraction && business.botConfig?.extractionDepth !== 'light') {
      triggerDeepExtraction(prisma, business.id, conversationId, conv.history, business.name);
    }
    
    // Get current CRM note for handover context
    const crmNote = await prisma.conversationCRMNote.findUnique({
      where: {
        businessId_chatwootConversationId: {
          businessId: business.id,
          chatwootConversationId: conversationId,
        },
      },
    });
    
    // Check for handover trigger
    const shouldHandover = needsHumanHandover(content, business.botConfig, parsed.extraction);
    console.log(`[Bot] Handover check: shouldHandover=${shouldHandover}, message="${content.toLowerCase()}", botConfig=${!!business.botConfig}`);
    if (shouldHandover) {
      console.log(`[Bot] Human handover triggered for conversation ${conversationId}`);
      await handleHumanHandover(business, conversationId, 'Customer requested human assistance or expressed frustration', crmNote);
      conv.humanTookOver = true;
      saveState();
      return;
    }
    
    // Handle action if present
    if (parsed.action) {
      console.log(`[Bot] Action detected: ${parsed.action.type}`);
      
      switch (parsed.action.type) {
        case 'order_complete':
          await handleOrderComplete(business, conversationId, parsed.action.data);
          break;
        case 'appointment_complete':
          await handleAppointmentComplete(business, conversationId, parsed.action.data);
          break;
        case 'human_handover':
          await handleHumanHandover(business, conversationId, parsed.action.data.reason, crmNote);
          conv.humanTookOver = true;
          saveState();
          break;
        default:
          console.log(`[Bot] Unknown action type: ${parsed.action.type}`);
      }
    }

  } catch (err) {
    console.error(`[Critical Error] Status: ${err.response?.status} | Msg: ${err.message}`);
  }
});

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────
app.post('/api/test-message', async (req, res) => {
  try {
    const { conversationId, message, systemPrompt } = req.body;
    console.log(`[API] Test message for conversation ${conversationId}`);
    
    // Get AI reply with provided system prompt
    const reply = await getAIReply(conversationId, message, systemPrompt);
    
    // Parse JSON envelope for actions
    const parsed = parseJSONEnvelope(reply);
    
    res.json({ success: true, reply: parsed.reply, action: parsed.action, extraction: parsed.extraction });
  } catch (err) {
    console.error('[API] Test message error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/regenerate-prompt/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    console.log(`[API] Regenerating prompt for business ${businessId}`);
    const prompt = await generatePrompt(businessId);
    res.json({ success: true, prompt });
  } catch (err) {
    console.error('[API] Prompt regeneration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', activeConversations: conversations.size });
});

// ─── PROMPT REGENERATION CRON JOB ─────────────────────────────────────────────
// Run every 30 seconds to check for businesses that need prompt regeneration
cron.schedule('*/30 * * * * *', async () => {
  try {
    console.log('[Cron] Checking for businesses needing prompt regeneration');
    
    const businessesNeedingRegen = await prisma.business.findMany({
      where: {
        active: true,
        botConfig: {
          needsRegen: true,
        },
      },
      include: {
        botConfig: true,
      },
    });

    console.log(`[Cron] Found ${businessesNeedingRegen.length} businesses needing regeneration`);

    for (const business of businessesNeedingRegen) {
      try {
        console.log(`[Cron] Regenerating prompt for business ${business.id}`);
        await generatePrompt(business.id, prisma);
      } catch (err) {
        console.error(`[Cron] Error regenerating prompt for business ${business.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[Cron] Error checking for prompt regeneration:', err);
  }
});

// ─── SERVER START ────────────────────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else res.sendStatus(403);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Répondly bot live on port ${PORT}`));