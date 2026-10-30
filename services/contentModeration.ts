/**
 * Content Moderation Service
 * Detects and blocks insults, inappropriate / messy words, offensive slurs, and adult / explicit content.
 */

// Normalized lists of inappropriate, offensive, insulting, and adult terms
const BLOCKED_PATTERNS = [
  // Profanities & Vulgarities
  /\bf+u+c+k+(e+r+|i+n+g+|e+d+|s+)?\b/i,
  /\bs+h+i+t+(t+y+|t+e+r+|s+)?\b/i,
  /\bb+i+t+c+h+(e+s+|y+)?\b/i,
  /\ba+s+s+h+o+l+e+(s+)?\b/i,
  /\ba+s+s+(h+e+a+d+|w+i+p+e+)?\b/i,
  /\bb+a+s+t+a+r+d+(s+)?\b/i,
  /\bd+a+m+n+\b/i,
  /\bc+r+a+p+\b/i,
  
  // Insults & Derogatory terms
  /\bd+i+c+k+(h+e+a+d+)?\b/i,
  /\bc+o+c+k+(s+u+c+k+e+r+)?\b/i,
  /\bp+u+s+s+y+\b/i,
  /\bw+h+o+r+e+(s+)?\b/i,
  /\bs+l+u+t+(s+)?\b/i,
  /\br+e+t+a+r+d+(e+d+)?\b/i,
  /\bi+d+i+o+t+(i+c+|s+)?\b/i,
  /\bs+t+u+p+i+d+\b/i,
  /\bl+o+s+e+r+(s+)?\b/i,
  /\bm+o+r+o+n+(s+)?\b/i,
  /\bd+u+m+b+a+s+s+\b/i,
  /\bc+u+n+t+(s+)?\b/i,
  /\bf+a+g+g+o+t+(s+)?\b/i,
  /\bf+a+g+(s+)?\b/i,
  /\bn+i+g+g+(a+|e+r+)(s+)?\b/i,

  // Adult, Sexual & NSFW terms
  /\bp+o+r+n+(o+|o+g+r+a+p+h+y+)?\b/i,
  /\bx+x+x+\b/i,
  /\bn+u+d+e+(s+)?\b/i,
  /\bn+a+k+e+d+\b/i,
  /\bs+e+x+(y+|u+a+l+)?\b/i,
  /\be+r+o+t+i+c+\b/i,
  /\bo+r+g+a+s+m+(s+)?\b/i,
  /\bm+a+s+t+u+r+b+a+t+(e+|i+o+n+)\b/i,
  /\bb+l+o+w+j+o+b+(s+)?\b/i,
  /\bh+e+n+t+a+i+\b/i,
  /\bb+o+o+b+s?\b/i,
  /\bv+a+g+i+n+a+\b/i,
  /\bp+e+n+i+s+\b/i,
  /\bc+u+m+(m+i+n+g+)?\b/i,
  /\be+j+a+c+u+l+a+t+e+\b/i,
];

// Leetspeak normalizer (e.g. '@' -> 'a', '$' -> 's', '1' -> 'i', '0' -> 'o', '3' -> 'e', etc.)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[$5]/g, 's')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[3]/g, 'e')
    .replace(/[+]/g, 't')
    .replace(/[\*\_\-\.\s]/g, ''); // strip masking characters like f*ck or f-u-c-k
}

export interface ModerationResult {
  isClean: boolean;
  message?: string;
  flaggedWord?: string;
}

/**
 * Validates text against insults, inappropriate messy words, and adult content.
 */
export function validateSafeContent(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { isClean: true };
  }

  // 1. Direct regex check on raw text
  for (const pattern of BLOCKED_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        isClean: false,
        message: 'Inappropriate, offensive, or adult content is not permitted in InterviewX. Please keep all language professional.',
        flaggedWord: match[0],
      };
    }
  }

  // 2. Normalized check (catches leetspeak and masked words like f*ck, b!tch, a$$hole)
  const normalized = normalizeText(text);
  const normalizedBlockedWords = [
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
    'whore', 'slut', 'retard', 'faggot', 'nigger', 'nigga', 'porn', 'xxx',
    'blowjob', 'hentai', 'vagina', 'penis', 'orgasm', 'masturbat', 'cum'
  ];

  for (const word of normalizedBlockedWords) {
    if (normalized.includes(word)) {
      return {
        isClean: false,
        message: 'Inappropriate or offensive language detected. Please use respectful and professional terms.',
        flaggedWord: word,
      };
    }
  }

  return { isClean: true };
}
