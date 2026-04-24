import express from 'express';
import axios from 'axios';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Conversation State ───────────────────────────────────────────────────────

const conversations = new Map();
const MAX_HISTORY = 12;

function getConversation(id) {
  if (!conversations.has(id)) {
    conversations.set(id, { history: [], greeted: false });
  }
  return conversations.get(id);
}

function addToHistory(id, role, content) {
  const conv = getConversation(id);
  conv.history.push({ role, content });
  if (conv.history.length > MAX_HISTORY) {
    conv.history.splice(0, conv.history.length - MAX_HISTORY);
  }
}

// ─── Language Detection ───────────────────────────────────────────────────────

function detectLanguage(text) {
  const arabicScript = /[\u0600-\u06FF]/;
  const englishPattern = /\b(i|you|he|she|we|they|the|is|are|was|were|have|has|do|does|what|how|when|where|why|hello|hi|hey|thanks|thank|please|want|need|can|could|would)\b/i;
  if (arabicScript.test(text)) return 'ar';
  if (englishPattern.test(text)) return 'en';
  return 'fr';
}

// ─── Welcome Messages ─────────────────────────────────────────────────────────

const WELCOME = {
  fr: `Bonjour et bienvenue chez Répondly ! 👋

Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?

*1️⃣ En savoir plus sur le service*
*2️⃣ Consulter les tarifs*
*3️⃣ Réserver un appel avec notre équipe*

Répondez avec le numéro ou décrivez votre besoin.`,

  ar: `أهلاً وسهلاً بك في Répondly ! 👋

أنا مساعدك الافتراضي. كيف يمكنني مساعدتك اليوم؟

*1️⃣ معرفة المزيد عن الخدمة*
*2️⃣ الاطلاع على الأسعار*
*3️⃣ حجز مكالمة مع فريقنا*

اختر رقماً أو اكتب سؤالك مباشرة.`,

  en: `Hello and welcome to Répondly! 👋

I'm your virtual assistant. How can I help you today?

*1️⃣ Learn more about the service*
*2️⃣ View pricing*
*3️⃣ Book a call with our team*

Reply with a number or describe what you need.`
};

// ─── System Prompts ───────────────────────────────────────────────────────────

const PROMPTS = {
  fr: `Tu es l'assistant WhatsApp professionnel de Répondly. Tu réponds UNIQUEMENT en français. Jamais en arabe, jamais en anglais, jamais en darija.

COMPRÉHENSION DES MESSAGES:
Les clients peuvent écrire en darija avec des lettres latines (ex: "bkadeh", "chnouma laswem", "kadeh soum", "9adeh", "chno", "nheb"). Comprends l'intention et réponds toujours en français professionnel.

FLUX DE CONVERSATION:
Tu guides le client étape par étape. Après chaque réponse, tu proposes toujours une suite logique:
- Après avoir expliqué le service → demande s'il veut voir les tarifs
- Après avoir donné les tarifs → propose de réserver un appel démo gratuit
- Après avoir répondu à une question → propose l'étape suivante naturellement

RÉPONDLY:
Plateforme tunisienne qui automatise le service client WhatsApp des entreprises.

FONCTIONNALITÉS:
- Réponses IA 24h/24 en arabe, français et darija
- Prise de rendez-vous directement sur WhatsApp
- Synchronisation automatique avec le calendrier
- Rappels automatiques pour les clients et l'entreprise
- Réponse automatique aux commentaires sur les réseaux sociaux
- Transfert vers un agent humain si besoin
- Notifications push instantanées
- Configuration complète gérée par notre équipe en 48h

TARIFS:
- 79 DT/mois (abonnement mensuel)
- 29 DT frais de mise en place (une seule fois)
- Essai gratuit 30 jours disponible
- Sans engagement, résiliation à tout moment
- Aucun frais caché, aucune facturation par message

POUR RÉSERVER UNE DÉMO:
Demande le prénom, le numéro WhatsApp et le type de business du client, puis dis-lui que l'équipe le contactera sous 24h.

STYLE: Maximum 3 phrases + 1 question de suivi. Professionnel et chaleureux. Ne jamais inventer d'informations.`,

  ar: `أنت المساعد الرسمي على واتساب لـ Répondly. تردّ فقط بالعربية الفصحى مع لمسة خفيفة من الدارجة التونسية. لا فرنسية ولا إنجليزية إطلاقاً.

مهم — فهم الرسائل:
افهم القصد من السياق وتردّ بشكل احترافي حتى لو كان السؤال مختصراً مثل "شمن؟" أو "قداش؟".

تدفق المحادثة:
تقود العميل خطوة بخطوة. بعد كل إجابة تقترح الخطوة التالية المنطقية:
- بعد شرح الخدمة → اسأل إن أراد معرفة الأسعار
- بعد الأسعار → اقترح حجز مكالمة ديمو مجانية
- بعد كل إجابة → اقترح الخطوة التالية بشكل طبيعي

ريبوندلي:
منصة تونسية تُؤتمت خدمة عملاء الواتساب للشركات.

المميزات:
- ردود ذكاء اصطناعي 24/7 بالعربية والفرنسية والدارجة
- حجز المواعيد مباشرة عبر الواتساب
- مزامنة تلقائية مع التقويم
- تذكيرات آلية للعملاء والشركة
- ردود تلقائية على تعليقات السوشيال ميديا
- تحويل للموظف البشري عند الحاجة
- إشعارات فورية
- إعداد كامل من فريقنا خلال 48 ساعة

الأسعار:
- 79 دينار في الشهر
- 29 دينار رسوم إعداد مرة واحدة فقط
- تجربة مجانية 30 يوم
- بدون عقد، إلغاء في أي وقت
- لا رسوم خفية

لحجز ديمو:
اطلب الاسم ورقم الواتساب ونوع النشاط التجاري، ثم أخبره أن الفريق سيتواصل معه خلال 24 ساعة.

الأسلوب: 3 جمل كحد أقصى + سؤال متابعة واحد. احترافي وودّي. لا تخترع أي معلومة.`,

  en: `You are the professional WhatsApp assistant for Répondly. Reply ONLY in English. Never in French or Arabic.

CONVERSATION FLOW:
Guide the client step by step. After each answer, always propose a natural next step:
- After explaining the service → ask if they want to see pricing
- After pricing → offer to book a free demo call
- After any answer → propose the next logical step

RÉPONDLY:
A Tunisian platform that automates WhatsApp customer service for businesses.

FEATURES:
- AI responses 24/7 in Arabic, French and Darija
- Appointment booking directly on WhatsApp
- Automatic calendar sync
- Automated reminders for clients and the business
- Automatic replies to social media comments
- Human handoff when needed
- Instant push notifications
- Full setup handled by our team in 48h

PRICING:
- 79 DT/month
- 29 DT one-time setup fee
- 30-day free trial
- No contracts, cancel anytime
- No hidden fees

TO BOOK A DEMO:
Ask for their first name, WhatsApp number and business type, then tell them the team will reach out within 24h.

STYLE: Max 3 sentences + 1 follow-up question. Professional and warm. Never make up information.`
};

// ─── Human Handover ───────────────────────────────────────────────────────────

const HANDOFF_TRIGGERS = [
  'problème', 'problem', 'مشكل', 'pas content', 'مش راضي',
  'agent', 'human', 'بشر', 'parler avec', 'je veux parler',
  'not happy', 'angry', 'escalate', 'موظف', 'responsable', 'manager'
];

const HANDOFF_REPLIES = {
  fr: "Bien sûr, un agent de notre équipe va prendre en charge votre conversation dans quelques instants. 🙏",
  ar: "بالتأكيد، سيتولى أحد موظفينا محادثتك خلال لحظات. 🙏",
  en: "Of course, a member of our team will take over your conversation shortly. 🙏"
};

function needsHumanHandover(message) {
  const lower = message.toLowerCase();
  return HANDOFF_TRIGGERS.some(trigger => lower.includes(trigger));
}

// ─── Groq API ─────────────────────────────────────────────────────────────────

async function getAIReply(conversationId, message, lang) {
  const conv = getConversation(conversationId);

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: PROMPTS[lang] },
      ...conv.history,
      { role: 'user', content: message }
    ],
    model: 'llama-3.3-70b-versatile',
    max_tokens: 200,
    temperature: 0.3,
  });

  const reply = completion.choices[0].message.content.trim();
  addToHistory(conversationId, 'user', message);
  addToHistory(conversationId, 'assistant', reply);

  return reply;
}

// ─── Chatwoot ─────────────────────────────────────────────────────────────────

async function replyViaChatwoot(conversationId, message) {
  const headers = { api_access_token: process.env.CHATWOOT_API_TOKEN };
  const baseUrl = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}`;
  await axios.post(
    `${baseUrl}/conversations/${conversationId}/messages`,
    { content: message, message_type: 'outgoing', private: false },
    { headers }
  );
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

app.post('/chatwoot-webhook', async (req, res) => {
  res.sendStatus(200);

  const event = req.body;

  if (event.message_type !== 'incoming') return;
  if (event.conversation?.meta?.sender?.type === 'agent') return;

  const text = event.content;
  const conversationId = event.conversation?.id;

  if (!text || !conversationId) return;

  const lang = detectLanguage(text);
  const conv = getConversation(conversationId);

  console.log(`[${conversationId}] [${lang}] Customer: ${text}`);

  try {
    if (needsHumanHandover(text)) {
      console.log(`[${conversationId}] Handover triggered`);
      await replyViaChatwoot(conversationId, HANDOFF_REPLIES[lang]);
      return;
    }

    // First message → send welcome menu
    if (!conv.greeted) {
      conv.greeted = true;
      await replyViaChatwoot(conversationId, WELCOME[lang]);
      // Also add the welcome to history so the AI has context
      addToHistory(conversationId, 'assistant', WELCOME[lang]);
      return;
    }

    // Subsequent messages → AI replies with full context
    const reply = await getAIReply(conversationId, text, lang);
    console.log(`[${conversationId}] Bot: ${reply}`);
    await replyViaChatwoot(conversationId, reply);
  } catch (err) {
    console.error(`[${conversationId}] Error:`, err.response?.data || err.message);
  }
});

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() })
})

app.listen(process.env.PORT, () => {
  console.log(`Repondly bot running on port ${process.env.PORT}`);
});