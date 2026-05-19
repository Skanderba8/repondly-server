/**
 * Information Extractor Module
 * Performs deep extraction of conversation intelligence using AI.
 * Runs in background to analyze full conversation history.
 */

import Groq from 'groq-sdk';

/**
 * Perform deep extraction of conversation intelligence.
 * Analyzes full conversation history to extract comprehensive customer information.
 * @param {string} conversationHistory - Full conversation history
 * @param {string} businessName - Business name for context
 * @returns {Promise<object>} - Extracted intelligence data
 */
export async function extractConversationIntelligence(conversationHistory, businessName) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = buildExtractionPrompt(businessName);
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: conversationHistory }
      ],
    });

    const response = completion.choices[0].message.content.trim();
    return parseExtractionResponse(response);
  } catch (error) {
    console.error('[Deep Extraction] Error:', error.message);
    return {};
  }
}

/**
 * Build the extraction prompt for AI.
 * @param {string} businessName - Business name
 * @returns {string} - Extraction prompt
 */
function buildExtractionPrompt(businessName) {
  return `You are a CRM intelligence assistant for ${businessName}. Analyze the conversation and extract comprehensive customer information.

Extract the following fields and return as JSON:
{
  "customerName": "Full name if mentioned",
  "customerPhone": "Phone number if mentioned",
  "customerEmail": "Email if mentioned",
  "customerLocation": "Location/city if mentioned",
  "preferredLanguage": "ar/fr/en",
  
  "serviceOfInterest": "What service/product they want",
  "budget": "Budget mentioned (if any)",
  "orderIntent": "yes/no/interested",
  "urgency": "high/medium/low",
  "purchaseStage": "awareness/consideration/decision",
  "objections": ["list of concerns"],
  "preferences": ["list of preferences"],
  
  "needsSummary": "2-3 sentence summary of customer needs",
  "importantContext": "Key context about their situation",
  "painPoints": ["list of pain points"],
  "customRequests": ["list of special requests"],
  "sentiment": "positive/neutral/negative/frustrated",
  "frustrationLevel": 0-10,
  
  "businessActions": ["appointment_requested", "quote_requested", "order_requested", "support_requested", "follow_up_needed"]
}

Rules:
- If a field is not mentioned in the conversation, omit it (don't use null).
- Be specific and factual based only on the conversation.
- For sentiment, analyze the tone and emotional content.
- For frustration level, 0 = calm, 10 = extremely frustrated.
- Business actions should be based on explicit requests or strong intent.

Return ONLY valid JSON, no additional text.`;
}

/**
 * Parse the AI extraction response.
 * @param {string} response - AI response
 * @returns {object} - Parsed extraction data
 */
function parseExtractionResponse(response) {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonString);
    }
    return {};
  } catch (error) {
    console.error('[Deep Extraction] Parse error:', error.message);
    return {};
  }
}

/**
 * Trigger deep extraction in background (non-blocking).
 * @param {object} prisma - Prisma client
 * @param {string} businessId - Business ID
 * @param {number} chatwootConversationId - Chatwoot conversation ID
 * @param {array} history - Conversation history
 * @param {string} businessName - Business name
 */
export async function triggerDeepExtraction(prisma, businessId, chatwootConversationId, history, businessName) {
  // Run asynchronously without blocking
  setImmediate(async () => {
    try {
      // Convert history to string format
      const historyText = history
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      
      // Perform deep extraction
      const extraction = await extractConversationIntelligence(historyText, businessName);
      
      // Update CRM notes with deep extraction
      if (Object.keys(extraction).length > 0) {
        const { updateCRMNotes } = await import('./crmNotesManager.js');
        await updateCRMNotes(prisma, businessId, chatwootConversationId, extraction);
        console.log(`[Deep Extraction] Updated CRM notes for conversation ${chatwootConversationId}`);
      }
    } catch (error) {
      console.error(`[Deep Extraction] Error for conversation ${chatwootConversationId}:`, error);
    }
  });
}
