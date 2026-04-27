import express from 'express';
import axios from 'axios';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
// Use limit to prevent memory issues with large webhooks
app.use(express.json({ limit: '10mb' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
function detectLanguage(text) {
  const arabicScript   = /[\u0600-\u06FF]/;
  const englishPattern = /\b(i|you|he|she|we|they|the|is|are|was|were|have|has|do|does|what|how|when|where|why|hello|hi|hey|thanks|thank|please|want|need|can|could|would)\b/i;
  if (arabicScript.test(text)) return 'ar';
  if (englishPattern.test(text)) return 'en';
  return 'fr';
}

function trimInput(text) {
  if (text.length <= MAX_INPUT_CHARS) return text;
  return text.slice(0, MAX_INPUT_CHARS) + '…';
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────
const WELCOME = {
  fr: `Bonjour et bienvenue chez Répondly ! 👋\n\nJe suis votre assistant virtuel.\n\nQue souhaitez-vous faire ?\n\n*1️⃣ En savoir plus*\n*2️⃣ Tarifs*\n*3️⃣ Démo gratuite*\n\nRépondez avec un numéro ou posez votre question.`,
  ar: `أهلاً وسهلاً بك في Répondly ! 👋\n\nأنا مساعدك الافتراضي.\n\nبماذا يمكنني مساعدتك ؟\n\n*1️⃣ معرفة المزيد*\n*2️⃣ الأسعار*\n*3️⃣ حجز ديمو*\n\nاختر رقماً أو اكتب سؤالك.`,
  en: `Hello and welcome to Répondly! 👋\n\nI'm your virtual assistant.\n\nWhat would you like to do?\n\n*1️⃣ Learn more*\n*2️⃣ View pricing*\n*3️⃣ Book a demo*\n\nReply with a number or type your question.`
};

const PROMPTS = {
  fr: `Tu es l'assistant WhatsApp de Répondly. Professionnel et concis. IA 24/7, RDV WhatsApp, setup 48h. Tarifs: Starter 49DT, Pro 99DT, Business 199DT.`,
  ar: `أنت مساعد Répondly على واتساب. ذكاء اصطناعي، مواعيد، إعداد 48 ساعة. الأسعار: 49، 99، 199 دينار.`,
  en: `You are the official Répondly WhatsApp assistant. AI 24/7, bookings, 48h setup. Pricing: Starter 49DT, Pro 99DT, Business 199DT.`
};

const HANDOFF_TRIGGERS = ['problème', 'problem', 'agent', 'human', 'بشر', 'parler avec'];
const HANDOFF_REPLIES = {
  fr: `Bien sûr ! 🙏 Un membre de notre équipe va vous rejoindre.`,
  ar: `بالتأكيد ! 🙏 سيتولى أحد موظفينا محادثتك.`,
  en: `Of course! 🙏 A member of our team will be with you.`
};

function needsHumanHandover(message) {
  const lower = message.toLowerCase();
  return HANDOFF_TRIGGERS.some(trigger => lower.includes(trigger));
}

// ─── CHATWOOT API ───────────────────────────────────────────────────────────
async function replyViaChatwoot(accountId, conversationId, message) {
  const url = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
  const token = process.env.CHATWOOT_API_TOKEN.trim();

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

async function assignToHuman(conversationId) {
  const agentId = parseInt(process.env.HANDOFF_AGENT_ID);
  if (!agentId) return;
  const baseUrl = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`;
  const headers = { 'api_access_token': process.env.CHATWOOT_API_TOKEN };
  try {
    await axios.post(`${baseUrl}/assignments`, { assignee_id: agentId }, { headers });
    await axios.post(`${baseUrl}/messages`, { content: `@human agent requested.`, message_type: 'outgoing', private: true }, { headers });
  } catch (err) {
    console.error(`[Handover Error]`, err.message);
  }
}

// ─── AI ENGINE ───────────────────────────────────────────────────────────────
async function getAIReply(conversationId, message, lang) {
  const conv    = getConversation(conversationId);
  const trimmed = trimInput(message);
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: MAX_REPLY_TOKENS,
    temperature: TEMPERATURE,
    messages: [{ role: 'system', content: PROMPTS[lang] }, ...conv.history, { role: 'user', content: trimmed }],
  });
  const reply = completion.choices.message.content.trim();
  addToHistory(conversationId, 'user', trimmed);
  addToHistory(conversationId, 'assistant', reply);
  return reply;
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
  const accountId = event.account?.id; // GET THE REAL ACCOUNT ID FROM DATA
  
  const senderType = event.sender ? event.sender.type : event.conversation?.meta?.sender?.type;

  if (event.message_type !== 'incoming' || senderType === 'agent' || !content) return;

  console.log(`[Acc: ${accountId} | Conv: ${conversationId}] Incoming: ${content}`);

  try {
    const lang = detectLanguage(content);
    const conv = getConversation(conversationId);

    if (conv.humanTookOver) return;

    if (!conv.greeted) {
      conv.greeted = true;
      saveState();
      await replyViaChatwoot(accountId, conversationId, WELCOME[lang]);
      return;
    }

    const reply = await getAIReply(conversationId, content, lang);
    await replyViaChatwoot(accountId, conversationId, reply);

  } catch (err) {
    console.error(`[Critical Error] Status: ${err.response?.status} | Msg: ${err.message}`);
  }
});

// ─── SERVER START ────────────────────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else res.sendStatus(403);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', activeConversations: conversations.size });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Répondly bot live on port ${PORT}`));