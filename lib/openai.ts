import 'server-only';

import OpenAI from 'openai';

// Cache for OpenAI clients by API key
const clientCache = new Map<string, OpenAI>();

// Create or get cached OpenAI client for a specific API key
export function getOpenAIClient(apiKey: string): OpenAI {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Return cached client if exists
  let client = clientCache.get(apiKey);
  if (!client) {
    client = new OpenAI({ apiKey });
    clientCache.set(apiKey, client);
  }
  return client;
}

// Default model to use
export const DEFAULT_MODEL = 'gpt-4o-mini';

// Token limits for different operations
export const TOKEN_LIMITS = {
  SUMMARY: 300,
  ISSUE: 200,
  PRIORITIZE: 200,
  EXTRACT_DETAILS: 500,
  CHAT: 600,
  READINESS_DETECT: 10,
} as const;

// Maximum items to process
export const MAX_ITEMS = {
  ISSUES_TO_PRIORITIZE: 50,
  PR_FILES: 30,
  PATCH_SIZE: 2000,
} as const;
