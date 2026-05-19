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
  
  // Check if WhatsApp configuration is available
  const phoneNumberId = botConfig.whatsappPhoneNumberId;
  const token = botConfig.whatsappToken;
  const ownerPhone = business.ownerPhone;
  
  if (!phoneNumberId || !token || !ownerPhone) {
    console.log(`[Handover] WhatsApp not configured for business ${business.id}. Manual notification required.`);
    return false;
  }
  
  // Build notification message in French
  const message = buildHandoverMessage(business.name, crmNote, reason);
  
  try {
    // Send via WhatsApp Graph API (like backup)
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: ownerPhone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`[Handover] WhatsApp notification sent to ${ownerPhone}`);
    return true;
  } catch (error) {
    console.error(`[Handover] Failed to send WhatsApp notification:`, error.response?.data || error.message);
    console.log(`[Handover] MANUAL ACTION REQUIRED: Send to ${ownerPhone}: ${message}`);
    return false;
  }
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
