import express from 'express';
import axios from 'axios';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a smart customer service assistant for a Tunisian business.
You reply in the same language the customer uses — Darija, French, or Arabic.
You are helpful, concise, and friendly.
If the customer asks about pricing, appointments, location, or hours, ask them to wait and say a human agent will assist them shortly.
If the customer seems angry or says "problème", "مشكل", "pas content", "مش راضي", always say a human agent will take over.
Never make up specific prices or information you don't have.
Keep replies short — maximum 3 sentences.`;

function needsHumanHandover(message) {
  const triggers = [
    'problème', 'problem', 'مشكل', 'pas content', 'مش راضي',
    'agent', 'human', 'بشر', 'parler avec', 'je veux parler',
    'not happy', 'angry', 'escalate'
  ];
  const lower = message.toLowerCase();
  return triggers.some(trigger => lower.includes(trigger));
}

async function getAIReply(message) {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ],
    model: 'llama-3.3-70b-versatile',
    max_tokens: 200,
  });
  return completion.choices[0].message.content;
}

async function replyViaChatwoot(conversationId, message) {
  const headers = { api_access_token: process.env.CHATWOOT_API_TOKEN };
  const baseUrl = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}`;
  await axios.post(
    `${baseUrl}/conversations/${conversationId}/messages`,
    { content: message, message_type: 'outgoing', private: false },
    { headers }
  );
}

// Chatwoot outgoing webhook
app.post('/chatwoot-webhook', async (req, res) => {
  res.sendStatus(200);

  const event = req.body;

  // Only handle incoming messages from customers, ignore bot/agent replies
  if (event.message_type !== 'incoming') return;
  if (event.conversation?.meta?.sender?.type === 'agent') return;

  const text = event.content;
  const conversationId = event.conversation?.id;

  if (!text || !conversationId) return;

  console.log(`New message in conversation ${conversationId}: ${text}`);

  try {
    if (needsHumanHandover(text)) {
      console.log('Human handover triggered');
      await replyViaChatwoot(conversationId, 'Un agent va vous répondre dans quelques minutes. وكيل سيرد عليك قريباً.');
      return;
    }

    const reply = await getAIReply(text);
    console.log(`AI reply: ${reply}`);
    await replyViaChatwoot(conversationId, reply);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
});

// Keep webhook verification for Meta (in case needed)
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Repondly bot running on port ${process.env.PORT}`);
});
