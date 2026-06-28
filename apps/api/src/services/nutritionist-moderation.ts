// Server-side guardrails for the AI Nutritionist chat.
//
// Profanity / abuse is detected here deterministically rather than being left to
// the model, so an abusive turn always hard-ends the session regardless of what
// the model decides to return (and without spending an AI call). Off-topic
// handling stays prompt-driven (the model appends [END_SESSION]) because it
// needs semantic judgement the model is better suited for.

// Stems matched as a word *prefix*, so inflections are caught too
// ("fuck" -> "fucking", "fucked"; "shit" -> "shitty"). These never begin common
// benign words. Note "ass" is intentionally absent ("class", "pass", "assess").
const PROFANITY_STEMS = [
  "fuck",
  "motherfuck",
  "shit",
  "bullshit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "slut",
  "whore",
  "wank",
];

// Matched as whole tokens only — these can appear inside benign words
// (e.g. "dick" in surnames, "piss" in "pistachio") so we don't prefix-match.
const PROFANITY_WORDS = [
  "fk",
  "fuk",
  "stfu",
  "twat",
  "retard",
  "douche",
  "prick",
  "dick",
  "piss",
  "bastard",
];

// Multi-word abusive phrases, matched against the full normalized string.
const PROFANITY_PHRASES = ["jerk off", "screw you", "shut up"];

// High-confidence stems that essentially never occur inside benign words. These
// are also matched against a space-stripped version of the message to catch
// spaced-out evasion like "F U C K". (Kept separate from PROFANITY_STEMS so
// food terms such as "shiitake" can't trip a space-stripped "shit" match.)
const SPACED_EVASION_STEMS = ["fuck", "motherfuck", "asshole", "cunt", "bitch", "nigger", "faggot"];

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

// Lowercase, undo common leetspeak, collapse runs of 3+ repeated letters
// ("shiiiit" -> "shit") while leaving genuine double letters intact ("shiitake"
// stays "shiitake"), and reduce every non-letter run to a single space so word
// boundaries are reliable.
const normalize = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[013457@$]/g, (c) => LEET_MAP[c] ?? c)
    .replace(/([a-z])\1{2,}/g, "$1")
    .replace(/[^a-z]+/g, " ")
    .trim();

/**
 * Returns true when the user's message contains profanity or abusive language.
 * Matching is resilient to casing, leetspeak, repeated letters, common
 * inflections, and spaced-out evasion, while avoiding benign-word false
 * positives.
 */
export const detectChatAbuse = (message: string): boolean => {
  const normalized = normalize(message);
  if (!normalized) return false;

  const tokens = normalized.split(" ");
  const tokenHit = tokens.some(
    (token) =>
      PROFANITY_WORDS.includes(token) || PROFANITY_STEMS.some((stem) => token.startsWith(stem)),
  );
  if (tokenHit) return true;

  if (PROFANITY_PHRASES.some((phrase) => normalized.includes(phrase))) return true;

  const despaced = normalized.replace(/ /g, "");
  return SPACED_EVASION_STEMS.some((stem) => despaced.includes(stem));
};

// Firm, polite closing shown when a session is ended because of abuse.
export const CHAT_ABUSE_CLOSING_MESSAGE =
  "I'm here to help with your nutrition and food logs in a respectful conversation, so I'm ending this session here. You're welcome to start a new chat whenever you'd like to talk about your meals.";

// Fallbacks for when the model returns an empty response (e.g. it emitted only
// the [END_SESSION] tag, which is stripped server-side).
export const EMPTY_CHAT_REPLY_FALLBACK =
  "Thanks for chatting! Feel free to start a new session whenever you have more questions about your meals.";

export const EMPTY_CHAT_WELCOME_FALLBACK =
  "Hello! I'm your AI Nutritionist. Ask me anything about your meals and nutrition for the last few days.";

/**
 * Guarantees a non-empty, trimmed string so it never fails the contract's
 * `content: z.string().min(1)` validation. Falls back to a friendly default
 * when the model returns nothing.
 */
export const ensureNonEmptyChatContent = (
  content: string,
  fallback: string = EMPTY_CHAT_REPLY_FALLBACK,
): string => {
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};
