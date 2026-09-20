// Centralized AI Model Configuration for NIRIKSHAK
// Primary: gemini-3.6-flash (Latest high-speed multimodal vision model)
// Fallback 1: gemini-3.1-flash-lite (Fast, lightweight vision model)
// Fallback 2: gemini-flash-latest (Dynamic stable fallback alias)

export const AI_MODELS = {
  PRIMARY: 'gemini-3.6-flash',
  FALLBACK: 'gemini-3.1-flash-lite',
  SECONDARY_FALLBACK: 'gemini-flash-latest',
} as const;

export const AI_CONFIG = {
  MAX_RETRIES: 2, // Retries for transient errors
  INITIAL_BACKOFF_MS: 1000,
  REQUEST_TIMEOUT_MS: 20000,
} as const;

