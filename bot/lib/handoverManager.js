/**
 * Handover Manager Module
 * Handles human handover detection, WhatsApp notifications, and bot pause logic.
 * Uses WhatsApp Graph API directly (like backup) for owner notifications.
 */

import axios from 'axios';

/**
 * Check if a message triggers human handover.
 * @param {string} message - The customer message
 * @param {object} botConfig - Business bot configuration
 * @param {object} extraction - Current extraction data (includes sentiment)
 * @returns {boolean} - True if handover should be triggered
 */
export function needsHumanHandover(message, botConfig, extraction) {
  const lowerMessage = message.toLowerCase();
  
  // Check configured handover triggers
  const configuredTriggers = botConfig?.handoverTriggers || [];
  if (configuredTriggers.length > 0) {
    const triggerMatch = configuredTriggers.some(trigger => 
      lowerMessage.includes(trigger.toLowerCase())
    );
    if (triggerMatch) return true;
  }
  
  // Default triggers (from backup, generalized)
  const defaultTriggers = [
    'problème', 'problem', 'مشكل', 'pas content', 'مش راضي',
    'agent', 'human', 'بشر', 'parler avec', 'je veux parler',
    'not happy', 'angry', 'escalate', 'موظف', 'responsable', 'manager',
    'refund', 'remboursement', 'complaint', 'plainte'
  ];
  
  const defaultTriggerMatch = defaultTriggers.some(trigger => 
    lowerMessage.includes(trigger)
  );
  if (defaultTriggerMatch) return true;
  
  // Sentiment-based trigger (high frustration)
  if (extraction?.sentiment === 'frustrated') return true;
  if (extraction?.frustrationLevel && extraction.frustrationLevel >= 7) return true;
  
  return false;
}

/**
 * Send WhatsApp notification to business owner about handover.
 * @param {object} business - Business object with phone and WhatsApp config
 * @param {object} crmNote - CRM note with customer information
 * @param {string} reason - Reason for handover
 * @returns {Promise<boolean>} - True if notification sent successfully
 */
export async function notifyOwnerViaWhatsApp(business, crmNote, reason) {
  const botConfig = business.botConfig || {};
  
  // Priority: handoverPhone (BotConfig) > ownerPhone (Business) > OWNER_PHONE (env)
  const targetPhone = botConfig.handoverPhone || business.ownerPhone || process.env.OWNER_PHONE;
  
  if (!targetPhone) {
    console.log(`[Handover] No phone configured for business ${business.id}. Manual notification required.`);
    return false;
  }
  
  // Build notification message
  const message = `🔔 Repondly — ${business.name}: un client attend votre réponse. Ouvrez Chatwoot pour répondre.\n\n` +
    (crmNote?.customerName ? `Client: ${crmNote.customerName}\n` : '') +
    (crmNote?.customerPhone ? `Téléphone: ${crmNote.customerPhone}\n` : '') +
    (crmNote?.serviceOfInterest ? `Intérêt: ${crmNote.serviceOfInterest}\n` : '') +
    `Sujet: ${reason}`;
  
  // Try WhatsApp API if configured
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;
  
  if (whatsappApiUrl && whatsappApiToken) {
    try {
      const formattedPhone = targetPhone.replace(/[\s\-\+]/g, '');
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
      console.log(`[Handover] WhatsApp notification sent to ${targetPhone}`);
      return true;
    } catch (error) {
      console.error(`[Handover] Failed to send WhatsApp:`, error.message);
    }
  }
  
  // Fallback: log for manual action
  console.log(`[Handover] MANUAL ACTION REQUIRED: Send to ${targetPhone}: ${message}`);
  return false;
}

/**
 * Build handover notification message in French.
 * @param {string} businessName - Business name
 * @param {object} crmNote - CRM note with customer info
 * @param {string} reason - Handover reason
 * @returns {string} - Formatted message
 */
function buildHandoverMessage(businessName, crmNote, reason) {
  let message = `⚠️ Intervention requise - ${businessName}\n\n`;
  
  if (crmNote?.customerName) {
    message += `Client: ${crmNote.customerName}\n`;
  }
  
  if (crmNote?.customerPhone) {
    message += `Téléphone: ${crmNote.customerPhone}\n`;
  }
  
  if (crmNote?.customerLocation) {
    message += `Localisation: ${crmNote.customerLocation}\n`;
  }
  
  message += `\nSujet: ${reason}\n`;
  
  if (crmNote?.needsSummary) {
    message += `Résumé de la demande: ${crmNote.needsSummary}\n`;
  }
  
  if (crmNote?.sentiment) {
    message += `Sentiment: ${crmNote.sentiment}\n`;
  }
  
  if (crmNote?.urgency) {
    message += `Urgence: ${crmNote.urgency}\n`;
  }
  
  if (crmNote?.serviceOfInterest) {
    message += `Service/Produit d'intérêt: ${crmNote.serviceOfInterest}\n`;
  }
  
  return message;
}

/**
 * Update CRM note with handover status.
 * @param {object} prisma - Prisma client
 * @param {string} businessId - Business ID
 * @param {number} chatwootConversationId - Chatwoot conversation ID
 * @param {string} status - Handover status ('in_progress', 'completed')
 * @returns {Promise<object>} - Updated CRM note
 */
export async function updateHandoverStatus(prisma, businessId, chatwootConversationId, status) {
  try {
    return await prisma.conversationCRMNote.update({
      where: {
        businessId_chatwootConversationId: {
          businessId,
          chatwootConversationId,
        },
      },
      data: {
        humanHandoverStatus: status,
      },
    });
  } catch (error) {
    console.error(`[Handover] Error updating status for conversation ${chatwootConversationId}:`, error);
    throw error;
  }
}
