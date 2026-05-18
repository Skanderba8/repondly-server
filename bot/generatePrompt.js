import { PrismaClient } from '@prisma/client';

/**
 * Generate a system prompt for a business based on their configuration,
 * products, services, schedules, and FAQs.
 */
export async function generatePrompt(businessId, prisma) {
  try {
    // Fetch business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        businessType: true,
        botMode: true,
        languages: true,
        tone: true,
        ownerPhone: true,
        chatwootInboxId: true,
        chatwootAgentId: true,
      },
    });

    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }

    // Fetch products (if bot mode includes orders)
    let products = [];
    if (business.botMode === 'ORDERS' || business.botMode === 'BOTH') {
      products = await prisma.product.findMany({
        where: { businessId, available: true },
        select: { name: true, description: true, price: true },
      });
    }

    // Fetch services (if bot mode includes appointments)
    let services = [];
    if (business.botMode === 'APPOINTMENTS' || business.botMode === 'BOTH') {
      services = await prisma.service.findMany({
        where: { businessId, available: true },
        select: { name: true, description: true, durationMinutes: true, price: true },
      });
    }

    // Fetch schedules
    const schedules = await prisma.schedule.findMany({
      where: { businessId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Format schedules
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduleText = schedules
      .filter(s => !s.closed)
      .map(s => `${dayNames[s.dayOfWeek]}: ${s.openTime} - ${s.closeTime}`)
      .join('\n');

    // Fetch FAQs
    const faqs = await prisma.faq.findMany({
      where: { businessId },
      select: { question: true, answer: true },
    });

    // Fetch bot config
    let botConfig = await prisma.botConfig.findUnique({
      where: { businessId },
    });

    // Create bot config if it doesn't exist
    if (!botConfig) {
      botConfig = await prisma.botConfig.create({
        data: { businessId },
      });
    }

    // Build required fields lists
    const requiredOrderFields = botConfig.requiredOrderFields || [];
    const requiredAppointmentFields = botConfig.requiredAppointmentFields || [];
    const handoverTriggers = botConfig.handoverTriggers || [];

    // Build the system prompt
    let prompt = `You are an AI assistant for ${business.name}, a ${business.businessType || 'business'}.`;

    if (business.tone) {
      prompt += `\n\nTone: ${business.tone}`;
    }

    if (business.languages && business.languages.length > 0) {
      prompt += `\n\nLanguages: ${business.languages.join(', ')}. Respond in the customer's language when possible.`;
    }

    // Add business hours
    if (scheduleText) {
      prompt += `\n\nBusiness Hours:\n${scheduleText}`;
    }

    // Add products
    if (products.length > 0) {
      prompt += `\n\nProducts:\n`;
      products.forEach(p => {
        prompt += `- ${p.name}`;
        if (p.description) prompt += `: ${p.description}`;
        prompt += ` (${p.price} DT)\n`;
      });
    }

    // Add services
    if (services.length > 0) {
      prompt += `\n\nServices:\n`;
      services.forEach(s => {
        prompt += `- ${s.name}`;
        if (s.description) prompt += `: ${s.description}`;
        prompt += ` (${s.durationMinutes} min, ${s.price} DT)\n`;
      });
    }

    // Add FAQs
    if (faqs.length > 0) {
      prompt += `\n\nFAQs:\n`;
      faqs.forEach(f => {
        prompt += `Q: ${f.question}\nA: ${f.answer}\n\n`;
      });
    }

    // Add JSON envelope instructions
    prompt += `\n\nIMPORTANT: You must always respond in a JSON envelope format with this exact structure:\n`;
    prompt += `{\n`;
    prompt += `  "reply": "your message to the customer",\n`;
    prompt += `  "action": null\n`;
    prompt += `}\n\n`;

    // Add action instructions based on bot mode
    if (business.botMode === 'ORDERS' || business.botMode === 'BOTH') {
      prompt += `When a customer wants to place an order, collect all required fields (${requiredOrderFields.join(', ') || 'name, phone, location, items'}) before firing the action. Confirm the order with the customer before submitting.\n\n`;
      prompt += `When the order is confirmed, respond with:\n`;
      prompt += `{\n`;
      prompt += `  "reply": "Confirmation message",\n`;
      prompt += `  "action": {\n`;
      prompt += `    "type": "order_complete",\n`;
      prompt += `    "data": {\n`;
      prompt += `      "customer_name": "...",\n`;
      prompt += `      "phone": "...",\n`;
      prompt += `      "location": "...",\n`;
      prompt += `      "items": [{"name": "...", "qty": 1, "price": 10}],\n`;
      prompt += `      "total": 20,\n`;
      prompt += `      "notes": "..."\n`;
      prompt += `    }\n`;
      prompt += `  }\n`;
      prompt += `}\n\n`;
    }

    if (business.botMode === 'APPOINTMENTS' || business.botMode === 'BOTH') {
      prompt += `When a customer wants to book an appointment, collect all required fields (${requiredAppointmentFields.join(', ') || 'name, phone, service, date, time'}) before firing the action. Confirm the appointment with the customer before submitting.\n\n`;
      prompt += `When the appointment is confirmed, respond with:\n`;
      prompt += `{\n`;
      prompt += `  "reply": "Confirmation message",\n`;
      prompt += `  "action": {\n`;
      prompt += `    "type": "appointment_complete",\n`;
      prompt += `    "data": {\n`;
      prompt += `      "customer_name": "...",\n`;
      prompt += `      "phone": "...",\n`;
      prompt += `      "service": "...",\n`;
      prompt += `      "date": "...",\n`;
      prompt += `      "time": "..."\n`;
      prompt += `    }\n`;
      prompt += `  }\n`;
      prompt += `}\n\n`;
    }

    // Add handover instructions
    prompt += `Escalate to human handover when:\n`;
    prompt += `- Customer is angry or frustrated\n`;
    prompt += `- Customer asks for a refund\n`;
    prompt += `- Customer asks something outside your scope\n`;
    prompt += `- Customer explicitly asks for a human\n`;
    if (handoverTriggers.length > 0) {
      prompt += `- Customer mentions: ${handoverTriggers.join(', ')}\n`;
    }
    prompt += `\n`;
    prompt += `When escalating, respond with:\n`;
    prompt += `{\n`;
    prompt += `  "reply": "I'll connect you with a human agent.",\n`;
    prompt += `  "action": {\n`;
    prompt += `    "type": "human_handover",\n`;
    prompt += `    "data": {\n`;
    prompt += `      "reason": "reason for escalation"\n`;
    prompt += `    }\n`;
    prompt += `  }\n`;
    prompt += `}\n\n`;

    // Add collection instructions
    const collectInstructions = [];
    if (botConfig.collectName) collectInstructions.push('name');
    if (botConfig.collectPhone) collectInstructions.push('phone');
    if (botConfig.collectLocation) collectInstructions.push('location');
    
    if (collectInstructions.length > 0) {
      prompt += `Always collect the following information from customers: ${collectInstructions.join(', ')}.\n\n`;
    }

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
