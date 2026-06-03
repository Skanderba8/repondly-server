import express from 'express';
import axios from 'axios';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import cron from 'node-cron';
import crypto from 'crypto';
import { generatePrompt } from './generatePrompt.js';
import { detectLanguage, determineResponseLanguage, containsDarija } from './lib/languageDetector.js';
import { writeCollectedFieldsNote, getCRMNote } from './lib/crmNotesManager.js';
import { needsHumanHandover, notifyOwnerViaWhatsApp, updateHandoverStatus } from './lib/handoverManager.js';

dotenv.config();

// Debug: Check if environment variables are available
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('GROQ_API_KEY available:', !!process.env.GROQ_API_KEY);

const app = express();
// Use limit to prevent memory issues with large webhooks
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
// Enable CORS for all routes
app.use(cors());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const MAX_HISTORY      = 6;
const MAX_REPLY_TOKENS = 180;
const MAX_INPUT_CHARS  = 500;
const TEMPERATURE      = 0.3;

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

async function fetchConversationHistory(accountId, conversationId, apiToken) {
  const url = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
  const token = (apiToken || process.env.CHATWOOT_API_TOKEN).trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await axios.get(url, {
      headers: {
        'api_access_token': token,
        'api-access-token': token,
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const messages = response.data.payload || [];
    // Return max 6 messages, most recent first
    return messages.slice(-6).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })).reverse();
  } catch (err) {
    console.error(`[Chatwoot History Fetch Error]:`, err.message);
    return []; // Continue with empty history on failure
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
async function getAIReply(conversationId, message, systemPrompt, accountId, apiToken) {
  const trimmed = trimInput(message);
  
  // Fetch history from Chatwoot API
  const history = await fetchConversationHistory(accountId, conversationId, apiToken);
  
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: MAX_REPLY_TOKENS,
    temperature: TEMPERATURE,
    messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: trimmed }],
  });
  
  const reply = completion.choices[0].message.content.trim();
  return reply;
}

// ─── ACTION HANDLERS ──────────────────────────────────────────────────────────
async function handleHumanHandover(business, conversationId, reason, crmNote) {
  const { chatwootAccountId, chatwootAgentId, chatwootApiToken } = business;

  // 1. Send message to customer
  await replyViaChatwoot(chatwootAccountId, conversationId, "Je vous mets en contact avec notre équipe, un instant.", chatwootApiToken);

  // 2. Assign conversation to handover agent (HANDOFF_AGENT_ID from env)
  const handoffAgentId = process.env.HANDOFF_AGENT_ID || chatwootAgentId;
  await assignToHuman(chatwootAccountId, conversationId, handoffAgentId, chatwootApiToken);

  // 3. Set status to open
  await updateConversationStatus(chatwootAccountId, conversationId, 'open', chatwootApiToken);

  // 4. Notify owner via WhatsApp
  await notifyOwnerViaWhatsApp(business, crmNote, reason);

  // 5. Add structured note to Chatwoot
  const noteContent = `📋 Note Handover\n\n` +
    `Client: ${crmNote?.customerName || 'Non renseigné'}\n` +
    `Téléphone: ${crmNote?.customerPhone || 'Non renseigné'}\n` +
    `Langue détectée: ${crmNote?.preferredLanguage || 'FR'}\n` +
    `Résumé: ${crmNote?.needsSummary || reason}\n` +
    `Service/Produit: ${crmNote?.serviceOfInterest || 'Non spécifié'}`;
  await addNoteToChatwoot(chatwootAccountId, conversationId, noteContent, chatwootApiToken);
  
  // 6. Set ConversationLog.botEnabled = false
  await prisma.conversationLog.update({
    where: {
      businessId_chatwootConversationId: {
        businessId: business.id,
        chatwootConversationId: conversationId,
      },
    },
    data: { botEnabled: false },
  });
  
  // 7. Log to conversations_log
  await prisma.conversationLog.create({
    data: {
      businessId: business.id,
      chatwootConversationId: conversationId,
      status: 'HANDED_OVER',
      terminalAction: 'HANDOVER',
      actionData: { reason },
    },
  });

  // 8. Create Order record from CRM note data
  try {
    const orderType = (crmNote?.appointmentRequested || crmNote?.orderIntent?.toLowerCase().includes('rendez')) 
      ? 'APPOINTMENT' 
      : 'ORDER';
    const items = crmNote?.serviceOfInterest 
      ? [{ name: crmNote.serviceOfInterest }] 
      : null;
    await prisma.order.create({
      data: {
        businessId: business.id,
        type: orderType,
        clientName: crmNote?.customerName || null,
        clientPhone: crmNote?.customerPhone || null,
        items,
        notes: crmNote?.needsSummary || reason,
        chatwootConversationId: conversationId,
        status: 'PENDING',
      },
    });
  } catch (orderErr) {
    console.error(`[Bot] Failed to create Order record:`, orderErr.message);
  }

  return true;
}

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── WEBHOOK HANDLER ─────────────────────────────────────────────────────────
app.post('/chatwoot-webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] || req.headers['x-chatwoot-webhook-signature'];

  if (!verifyWebhookSignature(req.rawBody, signature)) {
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

    // Log every incoming message for analytics
    try {
      await prisma.messageLog.create({
        data: {
          businessId: business.id,
          chatwootConversationId: conversationId,
          content: content?.substring(0, 2000) || null,
          senderType: 'contact',
        },
      });
    } catch (logErr) {
      console.error(`[Bot] Failed to log message:`, logErr.message);
    }

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
    const aiResponse = await getAIReply(conversationId, content, systemPrompt, accountId, business.chatwootApiToken);
    
    // Send the reply to customer
    console.log(`[Bot] Reply: ${aiResponse}`);
    await replyViaChatwoot(accountId, conversationId, aiResponse, business.chatwootApiToken);
    
    // Check for handover intent (simple string check)
    const handoverPhrases = ['je vous mets en contact', 'notre équipe vous contactera'];
    const shouldHandover = handoverPhrases.some(phrase => aiResponse.toLowerCase().includes(phrase));
    
    if (shouldHandover) {
      console.log(`[Bot] Handover triggered for conversation ${conversationId}`);
      
      // Get current CRM note for handover context
      const crmNote = await prisma.conversationCRMNote.findUnique({
        where: {
          businessId_chatwootConversationId: {
            businessId: business.id,
            chatwootConversationId: conversationId,
          },
        },
      });
      
      await handleHumanHandover(business, conversationId, 'Bot initiated handover', crmNote);
      return;
    }

  } catch (err) {
    console.error(`[Critical Error] Status: ${err.response?.status} | Msg: ${err.message}`);
  }
});

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────
app.post('/api/test-message', async (req, res) => {
  try {
    const { conversationId, message, systemPrompt, accountId, apiToken } = req.body;
    console.log(`[API] Test message for conversation ${conversationId}`);
    
    // Get AI reply with provided system prompt
    const reply = await getAIReply(conversationId, message, systemPrompt, accountId, apiToken);
    
    res.json({ success: true, reply });
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
  res.json({ status: 'ok' });
});

// ─── PROMPT REGENERATION CRON JOB ─────────────────────────────────────────────
// Run every 5 minutes as safety net (immediate regen triggered on save)
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[Cron] Checking for businesses needing prompt regeneration (safety net)');
    
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