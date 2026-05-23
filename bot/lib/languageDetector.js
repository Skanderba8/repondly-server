/**
 * Language Detection Module
 * Detects language from text with support for mixed messages and confidence scoring.
 * Handles Arabic script, English patterns, and defaults to French.
 * Supports detection of Tunisian Darija (mixed Arabic/Latin characters).
 */

/**
 * Detect the primary language of a text message.
 * @param {string} text - The text to analyze
 * @returns {string} - Language code: 'ar', 'en', or 'fr'
 */
export function detectLanguage(text) {
  if (!text || text.length === 0) return 'fr';
  
  const lowerText = text.toLowerCase();
  
  // Arabic script detection (includes Arabic and Darija)
  const arabicScript = /[\u0600-\u06FF]/;
  if (arabicScript.test(text)) {
    // Check for mixed Arabizi (Arabic written with Latin characters)
    const arabiziPatterns = [
      /\b(3|7|9|2)\b/g, // Common Arabizi numbers (3=ain, 7=ha, 9=qaf, 2=hamza)
      /\b(ch|k|kh)\b/g,  // Common Arabizi patterns
    ];
    
    const hasArabizi = arabiziPatterns.some(pattern => pattern.test(lowerText));
    
    // If it has Arabic script, it's Arabic (could be MSA or Darija)
    // The response language will be determined by business config
    return 'ar';
  }
  
  // English common words detection
  const englishPattern = /\b(i|you|he|she|we|they|the|is|are|was|were|have|has|do|does|what|how|when|where|why|hello|hi|hey|thanks|thank|please|want|need|can|could|would)\b/i;
  if (englishPattern.test(lowerText)) {
    return 'en';
  }
  
  // Default to French
  return 'fr';
}

/**
 * Determine the response language based on detected language and business configuration.
 * @param {string} detectedLanguage - The language detected from the message
 * @param {object} botConfig - The business's bot configuration
 * @returns {string} - The language code to use for the response
 */
export function determineResponseLanguage(detectedLanguage, botConfig) {
  // If business has a primary language configured, use it
  if (botConfig?.primaryLanguage) {
    const primary = botConfig.primaryLanguage.toLowerCase();
    
    // If detected is Arabic and business allows Darija input but forces professional Arabic
    if (detectedLanguage === 'ar' && botConfig.forceProfessionalArabic) {
      return 'ar'; // Always respond in professional Arabic (MSA)
    }
    
    // If business has a primary language, respect it
    return primary;
  }
  
  // If detected is Arabic, respond in professional Arabic (never Darija)
  if (detectedLanguage === 'ar') {
    return 'ar';
  }
  
  // Otherwise, respond in the detected language
  return detectedLanguage;
}

/**
 * Check if text contains Tunisian Darija patterns (mixed Arabic/Latin).
 * This is for logging/tracking purposes, the actual understanding is left to the AI model.
 * @param {string} text - The text to analyze
 * @returns {boolean} - True if Darija patterns are detected
 */
export function containsDarija(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Common Darija patterns (Arabic written with Latin characters)
  const darijaPatterns = [
    // Nombres Arabizi (3=ain, 7=ha, 9=qaf, 2=hamza)
    /\b3[aouie]\b/,  // "3andi", "3andou", "3ando", "3alek"
    /\b7[aouie]\b/,  // "7bib", "7abib", "7lou", "7ta"
    /\b9[aouie]\b/,  // "9al", "9adeh", "9ahwa", "9rib"
    /\b2[aouie]\b/,  // "2ah", "2ref", "2in"
    
    // Verbes communs
    /\bnheb\b/,     // "نحب" (I want)
    /\bchnowa\b/,    // "شحال" (how much/what)
    /\bkifech\b/,    // "كيفش" (how)
    /\bfin\b/,       // "فين" (where)
    /\b3la\b/,       // "على" (on)
    /\bmen\b/,       // "من" (from)
    /\bwa9t[aou]?\b/, // "وقت", "وقتي", "وقتك" (time)
    /\bch7al\b/,     // "شحال" (how much)
    /\bbkadeh\b/,    // "بكادح" (how much)
    /\bfama\b/,      // "فام" (is there)
    /\bma\b/,        // "ما" (not)
    /\bmouch\b/,     // "موش" (not)
    /\bkan\b/,       // "كان" (was)
    
    // Pronoms
    /\bena\b/,       // "أنا" (I)
    /\binti\b/,      // "إنتي" (you)
    /\bhouwa\b/,     // "هو" (he)
    /\bhouma\b/,     // "هم" (they)
    /\bbrabi\b/,     // "بربي" (my brother)
    /\bmrigel\b/,    // "مرجل" (man)
    
    // Mots courants
    /\byes\b/,       // "شيء" (thing)
    /\bnormal\b/,    // "نورمال" (normal/ok)
    /\bsahit\b/,     // "صاحب" (friend)
    /\bwala\b/,      // "ولا" (or)
    /\bmta3\b/,      // "متى" (of/from)
    /\bwi\b/,        // "و" (and)
    /\bkima\b/,      // "كما" (like)
    /\brani\b/,      // "راني" (I am)
    /\b3aych\b/,     // "عايش" (living)
    /\bdirect\b/,    // "ديريكت" (direct)
    /\bslow\b/,      // "سلوي" (slow)
    /\bfast\b/,      // "فاست" (fast)
    
    // Expressions
    /\bchnou[aou]?\b/, // "شنو", "شنوة" (what)
    /\b3malt[aou]\b/,  // "عملت", "عملتي" (I did)
    /\bna7ki\b/,       // "نحكي" (speak)
    /\btfahem\b/,      // "تفهم" (understand)
    /\bmechi\b/,       // "مشي" (like/as if)
  ];
  
  return darijaPatterns.some(pattern => pattern.test(lowerText));
}

/**
 * Get language-specific instructions for the AI prompt.
 * @param {string} responseLanguage - The language to respond in
 * @param {object} botConfig - The business's bot configuration
 * @returns {string} - Language instructions for the system prompt
 */
export function getLanguageInstructions(responseLanguage, botConfig) {
  let instructions = '';
  
  // Darija understanding instructions
  if (botConfig?.allowDarijaInput) {
    instructions += `DARIJA UNDERSTANDING:\n`;
    instructions += `- You may receive messages in Tunisian Darija (Arabic dialect written with Latin characters or mixed script).\n`;
    instructions += `- Examples: "3andi mochkol" (I have a problem), "nheb نحجز" (I want to book), "price ch7al" (how much), "fama livraison?" (is there delivery).\n`;
    instructions += `- Understand the intent perfectly from Darija messages.\n\n`;
  }
  
  // Professional Arabic instruction
  if (responseLanguage === 'ar' && botConfig?.forceProfessionalArabic) {
    instructions += `ARABIC RESPONSE RULE:\n`;
    instructions += `- When responding in Arabic, ALWAYS use Modern Standard Arabic (professional, formal).\n`;
    instructions += `- NEVER respond in Darija or dialect, even if the customer writes in Darija.\n`;
    instructions += `- Use professional, clear Arabic that all Arabic speakers can understand.\n\n`;
  }
  
  // Language-specific response instruction
  instructions += `RESPONSE LANGUAGE:\n`;
  instructions += `- Respond in ${responseLanguage === 'ar' ? 'Modern Standard Arabic' : responseLanguage === 'en' ? 'English' : 'French'}.\n`;
  instructions += `- Match the customer's language preference when possible within business constraints.\n`;
  
  return instructions;
}
