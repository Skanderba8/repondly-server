/**
 * CRM Notes Manager Module
 * Handles progressive update of CRM notes with extracted customer information.
 * Merges new extraction data with existing notes to avoid duplicates.
 */

/**
 * Update CRM notes with new extraction data.
 * @param {object} prisma - Prisma client
 * @param {string} businessId - Business ID
 * @param {number} chatwootConversationId - Chatwoot conversation ID
 * @param {object} extraction - New extraction data from AI
 * @returns {object} - Updated CRM note
 */
export async function updateCRMNotes(prisma, businessId, chatwootConversationId, extraction) {
  try {
    // Find or create CRM note
    let crmNote = await prisma.conversationCRMNote.findUnique({
      where: {
        businessId_chatwootConversationId: {
          businessId,
          chatwootConversationId,
        },
      },
    });

    if (!crmNote) {
      crmNote = await prisma.conversationCRMNote.create({
        data: {
          businessId,
          chatwootConversationId,
        },
      });
    }

    // Merge new extraction with existing data
    const updateData = mergeExtraction(crmNote, extraction);

    // Update the CRM note
    const updated = await prisma.conversationCRMNote.update({
      where: { id: crmNote.id },
      data: {
        ...updateData,
        lastExtractedAt: new Date(),
        extractionCount: { increment: 1 },
      },
    });

    return updated;
  } catch (error) {
    console.error(`[CRM Notes] Error updating notes for conversation ${chatwootConversationId}:`, error);
    throw error;
  }
}

/**
 * Merge new extraction data with existing CRM note.
 * Avoids duplicates and progressively improves the data.
 * @param {object} existing - Existing CRM note
 * @param {object} extraction - New extraction data
 * @returns {object} - Merged data for update
 */
function mergeExtraction(existing, extraction) {
  const updateData = {};

  // Identity fields - only update if empty
  if (extraction.customerName && !existing.customerName) {
    updateData.customerName = extraction.customerName;
  }
  if (extraction.customerPhone && !existing.customerPhone) {
    updateData.customerPhone = extraction.customerPhone;
  }
  if (extraction.customerEmail && !existing.customerEmail) {
    updateData.customerEmail = extraction.customerEmail;
  }
  if (extraction.customerLocation && !existing.customerLocation) {
    updateData.customerLocation = extraction.customerLocation;
  }
  if (extraction.preferredLanguage && !existing.preferredLanguage) {
    updateData.preferredLanguage = extraction.preferredLanguage;
  }

  // Commercial intent - update if new value is more specific
  if (extraction.serviceOfInterest && (!existing.serviceOfInterest || extraction.serviceOfInterest.length > existing.serviceOfInterest.length)) {
    updateData.serviceOfInterest = extraction.serviceOfInterest;
  }
  if (extraction.budget && !existing.budget) {
    updateData.budget = extraction.budget;
  }
  if (extraction.orderIntent && (!existing.orderIntent || existing.orderIntent === 'interested')) {
    updateData.orderIntent = extraction.orderIntent;
  }
  if (extraction.urgency && !existing.urgency) {
    updateData.urgency = extraction.urgency;
  }
  if (extraction.purchaseStage && (!existing.purchaseStage || extraction.purchaseStage !== 'initial')) {
    updateData.purchaseStage = extraction.purchaseStage;
  }

  // Objections - append if not duplicate
  if (extraction.objections && extraction.objections.length > 0) {
    const existingObjections = existing.objections || [];
    const newObjections = extraction.objections.filter(obj => !existingObjections.includes(obj));
    if (newObjections.length > 0) {
      updateData.objections = [...existingObjections, ...newObjections];
    }
  }

  // Preferences - append if not duplicate
  if (extraction.preferences && extraction.preferences.length > 0) {
    const existingPreferences = existing.preferences || [];
    const newPreferences = extraction.preferences.filter(pref => !existingPreferences.includes(pref));
    if (newPreferences.length > 0) {
      updateData.preferences = [...existingPreferences, ...newPreferences];
    }
  }

  // Conversation intelligence - evolve progressively
  if (extraction.needsSummary) {
    if (!existing.needsSummary || extraction.needsSummary.length > existing.needsSummary.length) {
      updateData.needsSummary = extraction.needsSummary;
    }
  }
  if (extraction.importantContext) {
    if (!existing.importantContext) {
      updateData.importantContext = extraction.importantContext;
    } else {
      // Append to existing context
      updateData.importantContext = `${existing.importantContext}\n${extraction.importantContext}`;
    }
  }

  // Pain points - append if not duplicate
  if (extraction.painPoints && extraction.painPoints.length > 0) {
    const existingPainPoints = existing.painPoints || [];
    const newPainPoints = extraction.painPoints.filter(pp => !existingPainPoints.includes(pp));
    if (newPainPoints.length > 0) {
      updateData.painPoints = [...existingPainPoints, ...newPainPoints];
    }
  }

  // Custom requests - append if not duplicate
  if (extraction.customRequests && extraction.customRequests.length > 0) {
    const existingCustomRequests = existing.customRequests || [];
    const newCustomRequests = extraction.customRequests.filter(req => !existingCustomRequests.includes(req));
    if (newCustomRequests.length > 0) {
      updateData.customRequests = [...existingCustomRequests, ...newCustomRequests];
    }
  }

  // Sentiment - update with latest
  if (extraction.sentiment) {
    updateData.sentiment = extraction.sentiment;
  }

  // Frustration level - update with latest
  if (extraction.frustrationLevel !== undefined) {
    updateData.frustrationLevel = extraction.frustrationLevel;
  }

  // Business actions - set flags
  if (extraction.businessActions) {
    if (extraction.businessActions.includes('appointment_requested')) {
      updateData.appointmentRequested = true;
    }
    if (extraction.businessActions.includes('quote_requested')) {
      updateData.quoteRequested = true;
    }
    if (extraction.businessActions.includes('order_requested')) {
      updateData.orderRequested = true;
    }
    if (extraction.businessActions.includes('support_requested')) {
      updateData.supportRequested = true;
    }
    if (extraction.businessActions.includes('follow_up_needed')) {
      updateData.followUpNeeded = true;
    }
  }

  return updateData;
}

/**
 * Get CRM note for a conversation.
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
