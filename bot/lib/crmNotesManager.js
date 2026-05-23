/**
 * CRM Notes Manager Module
 * Simplified to write collected fields as a note to Chatwoot conversation.
 * Removes complex AI extraction logic.
 */

/**
 * Write collected fields as a note to Chatwoot conversation.
 * @param {object} prisma - Prisma client
 * @param {string} businessId - Business ID
 * @param {number} chatwootConversationId - Chatwoot conversation ID
 * @param {object} collectedData - Collected fields from conversation
 * @param {string} accountId - Chatwoot account ID
 * @param {string} apiToken - Chatwoot API token
 * @returns {Promise<boolean>} - True if note written successfully
 */
export async function writeCollectedFieldsNote(prisma, businessId, chatwootConversationId, collectedData, accountId, apiToken) {
  try {
    // Build note content from collected data
    let noteContent = '📋 Informations collectées:\n\n';
    
    const fieldLabels = {
      name: 'Nom',
      phone: 'Téléphone',
      email: 'Email',
      service: 'Service souhaité',
      product: 'Produit souhaité',
      delivery: 'Mode de livraison',
      location: 'Localisation',
      budget: 'Budget',
      notes: 'Notes libres'
    };

    for (const [field, value] of Object.entries(collectedData)) {
      if (value && fieldLabels[field]) {
        noteContent += `${fieldLabels[field]}: ${value}\n`;
      }
    }

    // Write note to Chatwoot
    const url = `${process.env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${chatwootConversationId}/messages`;
    const token = (apiToken || process.env.CHATWOOT_API_TOKEN).trim();

    await axios.post(url, 
      { content: noteContent, message_type: 'outgoing', private: true },
      { 
        headers: { 
          'api_access_token': token,
          'api-access-token': token,
          'Authorization': `Bearer ${token}`
        } 
      }
    );

    console.log(`[CRM Notes] Note written for conversation ${chatwootConversationId}`);
    return true;
  } catch (error) {
    console.error(`[CRM Notes] Error writing note for conversation ${chatwootConversationId}:`, error.message);
    return false;
  }
}

/**
 * Get CRM note for a conversation (legacy support).
 * @param {object} prisma - Prisma client
 * @param {string} businessId - Business ID
 * @param {number} chatwootConversationId - Chatwoot conversation ID
 * @returns {object|null} - CRM note or null
 */
export async function getCRMNote(prisma, businessId, chatwootConversationId) {
  try {
    return await prisma.conversationCRMNote.findUnique({
      where: {
        businessId_chatwootConversationId: {
          businessId,
          chatwootConversationId,
        },
      },
    });
  } catch (error) {
    console.error(`[CRM Notes] Error getting notes for conversation ${chatwootConversationId}:`, error);
    return null;
  }
}
