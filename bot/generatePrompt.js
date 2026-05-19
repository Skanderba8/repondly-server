import { PrismaClient } from '@prisma/client';
import { buildSystemPrompt } from './lib/promptBuilder.js';

/**
 * Generate a system prompt for a business based on their configuration,
 * products, services, schedules, and FAQs.
 * Now uses the new promptBuilder module for generalized prompts.
 */
export async function generatePrompt(businessId, prisma) {
  try {
    // Fetch business with all relations
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        botConfig: true,
        products: {
          where: { available: true },
        },
        services: {
          where: { available: true },
        },
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        faqs: true,
      },
    });

    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }

    // If business hasn't completed configuration, return null to prevent bot from replying
    if (!business.hasConfiguredBot) {
      return null;
    }

    // Create bot config if it doesn't exist
    if (!business.botConfig) {
      business.botConfig = await prisma.botConfig.create({
        data: { businessId },
      });
    }

    // Build the system prompt using the new prompt builder
    const prompt = buildSystemPrompt(business);

    // Save the generated prompt to bot config
    await prisma.botConfig.update({
      where: { businessId },
      data: {
        systemPrompt: prompt,
        needsRegen: false,
        lastGeneratedAt: new Date(),
      },
    });

    return prompt;
  } catch (error) {
    console.error(`[generatePrompt] Error for business ${businessId}:`, error);
    throw error;
  }
}
