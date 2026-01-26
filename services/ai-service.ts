/**
 * AI Service
 *
 * This service handles all AI-powered features using OpenAI's GPT models.
 * It provides:
 * - Issue/PR summarization
 * - Issue prioritization
 * - Conversational issue creation (chat-to-issue flow)
 *
 * Key concepts:
 * - Prompt templates: Loaded from /prompts/*.md at runtime
 * - Tool calling: OpenAI returns structured data via function calls
 * - Hybrid detection: Keyword matching + LLM fallback for user intent
 *
 * Related files:
 * - lib/openai.ts: OpenAI client factory and token limits
 * - types/ai.ts: Type definitions for all AI features
 * - prompts/*.md: Prompt templates
 * - hooks/useCreateIssueFlow.ts: Client-side flow that calls these functions
 */

import 'server-only';

import { readFile } from 'fs/promises';
import { join } from 'path';
import { getOpenAIClient, DEFAULT_MODEL, TOKEN_LIMITS, MAX_ITEMS } from '@/lib/openai';
import type {
  ChatMessage,
  IssuePreviewData,
  ChatIssueResponse,
  SummarizeIssueResponse,
  SummarizePRResponse,
  PRFileSummary,
  ExtractedIssueDetails,
  OpenAITool,
} from '@/types/ai';

// =============================================================================
// PROMPT LOADING
// =============================================================================

/**
 * Load a prompt template from the prompts directory.
 * Prompts are markdown files with placeholders like {title}, {body}.
 */
async function loadPrompt(name: string): Promise<string> {
  const promptPath = join(process.cwd(), 'prompts', `${name}.md`);
  return readFile(promptPath, 'utf-8');
}

// =============================================================================
// READINESS DETECTION
// =============================================================================

/**
 * Keywords that signal the user wants to create the issue NOW.
 * These are checked first (fast path) before calling the LLM.
 */
const READY_KEYWORDS = [
  'create the ticket',
  'make the ticket',
  'create the issue',
  'make the issue',
  'generate the ticket',
  'generate the issue',
  "i'm ready",
  'im ready',
  'ready to create',
  'looks good',
  "that's enough",
  'thats enough',
  'good enough',
  "let's create",
  'lets create',
];

/**
 * Detect if the user wants to create the issue now.
 *
 * Uses a two-phase approach:
 * 1. Fast keyword matching (no API call needed)
 * 2. LLM fallback for nuanced signals (costs tokens but catches more cases)
 *
 * Why hybrid? Users say "ready" in many ways:
 * - Explicit: "create the issue", "I'm ready"
 * - Implicit: "looks good", "that's all", dismissing further questions
 *
 * @param text - The user's message
 * @param apiKey - OpenAI API key
 * @returns true if user wants to create the issue
 */
export async function detectReadiness(text: string, apiKey: string): Promise<boolean> {
  if (!text || !text.trim()) return false;

  const textLower = text.toLowerCase();

  // Phase 1: Quick keyword check (fast path - no API call)
  for (const keyword of READY_KEYWORDS) {
    if (textLower.includes(keyword)) {
      console.log(`[READINESS_DETECTED] Keyword match: '${keyword}'`);
      return true;
    }
  }

  // Phase 2: LLM fallback for implicit signals
  const prompt = `Does the user want to create/finalize the GitHub issue NOW?

User message: "${text}"

Common signals:
- Direct: "create it", "make the ticket", "I'm ready"
- Implicit: "looks good", "that's enough", repeated "I'll decide later"
- Dismissive: "no", "later", "skip" (when asked for more details)

Answer ONLY: yes or no`;

  try {
    const openai = getOpenAIClient(apiKey);
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: TOKEN_LIMITS.READINESS_DETECT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content || '';
    const isReady = content.trim().toLowerCase().startsWith('yes');
    if (isReady) {
      console.log(`[READINESS_DETECTED] LLM detected: ${content.trim()}`);
    }
    return isReady;
  } catch (error) {
    // Fail open for common ready phrases if LLM call fails
    const isReady = ['ready', 'create', 'make'].some((phrase) =>
      textLower.includes(phrase)
    );
    if (isReady) {
      console.log('[READINESS_DETECTED] Fallback match');
    }
    return isReady;
  }
}

// =============================================================================
// SUMMARIZATION FUNCTIONS
// =============================================================================

/**
 * Summarize a pull request.
 *
 * Takes the PR title, body, and changed files, returns a structured summary.
 * Useful for the activity feed to show what a PR does at a glance.
 *
 * @param title - PR title
 * @param body - PR description/body
 * @param files - Array of changed files with stats
 * @param apiKey - OpenAI API key
 */
export async function summarizePullRequest(
  title: string,
  body: string,
  files: PRFileSummary[],
  apiKey: string
): Promise<SummarizePRResponse> {
  // Format file changes for the prompt (limit to prevent token overflow)
  const filesText = files
    .slice(0, MAX_ITEMS.PR_FILES)
    .map((f) => `- ${f.filename} (${f.status}): +${f.additions}/-${f.deletions}`)
    .join('\n');

  // Load and fill prompt template
  const promptTemplate = await loadPrompt('summarize_pr');
  const prompt = promptTemplate
    .replace('{title}', title)
    .replace('{body}', body || 'No description provided')
    .replace('{file_count}', files.length.toString())
    .replace('{files_text}', filesText);

  const openai = getOpenAIClient(apiKey);
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    max_tokens: TOKEN_LIMITS.SUMMARY,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0]?.message?.content || '';

  // Parse JSON response, fall back to raw text if parsing fails
  try {
    return JSON.parse(content);
  } catch {
    return { summary: content, code_updates: '' };
  }
}

/**
 * Summarize an issue.
 *
 * Returns a short summary and classifies the issue type (bug, feature, etc.)
 *
 * @param title - Issue title
 * @param body - Issue description/body
 * @param apiKey - OpenAI API key
 */
export async function summarizeIssue(
  title: string,
  body: string,
  apiKey: string
): Promise<SummarizeIssueResponse> {
  const promptTemplate = await loadPrompt('summarize_issue');
  const prompt = promptTemplate
    .replace('{title}', title)
    .replace('{body}', body || 'No description provided');

  const openai = getOpenAIClient(apiKey);
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    max_tokens: TOKEN_LIMITS.ISSUE,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0]?.message?.content || '';

  try {
    return JSON.parse(content);
  } catch {
    return { issue_type: 'unknown', summary: content };
  }
}

// =============================================================================
// PRIORITIZATION
// =============================================================================

/**
 * Prioritize a list of issues using AI.
 *
 * Returns the issue IDs in priority order (most important first).
 * Falls back to original order if AI fails.
 *
 * @param issues - Array of {id, title} objects
 * @param apiKey - OpenAI API key
 * @returns Array of issue IDs in priority order
 */
export async function prioritizeIssues(
  issues: Array<{ id: number; title: string }>,
  apiKey: string
): Promise<number[]> {
  // Limit input to prevent token overflow
  const limitedIssues = issues.slice(0, MAX_ITEMS.ISSUES_TO_PRIORITIZE);
  const issuesText = limitedIssues
    .map((issue) => `ID:${issue.id} - ${issue.title}`)
    .join('\n');

  const promptTemplate = await loadPrompt('prioritize_issues');
  const prompt = promptTemplate.replace('{issues_text}', issuesText);

  try {
    const openai = getOpenAIClient(apiKey);
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: TOKEN_LIMITS.PRIORITIZE,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : issues.map((i) => i.id);
  } catch {
    // Fail gracefully - return original order
    return issues.map((i) => i.id);
  }
}

// =============================================================================
// ISSUE DETAIL EXTRACTION
// =============================================================================

/**
 * Extract structured issue details from conversation history.
 *
 * This is a fallback for when tool calls don't provide preview data.
 * It reads the conversation and extracts title, body, labels, etc.
 *
 * @param messages - Conversation history
 * @param apiKey - OpenAI API key
 */
export async function extractIssueDetailsFromConversation(
  messages: ChatMessage[],
  apiKey: string
): Promise<ExtractedIssueDetails | null> {
  // Only look at recent messages to stay within token limits
  const recentMessages = messages.slice(-10);
  const conversationText = recentMessages
    .filter((msg) => msg.content)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n');

  const promptTemplate = await loadPrompt('extract_issue_details');
  const prompt = promptTemplate.replace('{conversation_text}', conversationText);

  try {
    const openai = getOpenAIClient(apiKey);
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: TOKEN_LIMITS.EXTRACT_DETAILS,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content);

    if (typeof parsed === 'object' && parsed !== null) {
      // Filter out null/empty values for cleaner data
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) {
          filtered[k] = v;
        }
      }
      return filtered as unknown as ExtractedIssueDetails;
    }
    return null;
  } catch (error) {
    console.error('Error extracting issue details:', error);
    return null;
  }
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

/**
 * Define the tools (functions) that OpenAI can call during chat.
 *
 * Tool calling is how we get STRUCTURED data from the LLM instead of free text.
 * The AI "calls" these functions with typed arguments, which we then handle.
 *
 * Tools:
 * 1. update_preview - Incrementally update the issue preview
 * 2. signal_issue_ready - Terminal state: issue is ready to create
 */
function createIssueCreationTools(): OpenAITool[] {
  return [
    {
      type: 'function',
      function: {
        name: 'update_preview',
        description: 'Update the live issue preview.',
        parameters: {
          type: 'object',
          properties: {
            issue_type: {
              type: 'string',
              enum: ['bug', 'feature', 'enhancement', 'documentation', 'question'],
            },
            title: { type: 'string' },
            body: { type: 'string' },
            labels: {
              type: 'array',
              items: { type: 'string' },
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
          },
          required: ['title', 'body'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'signal_issue_ready',
        description: 'Signal that the issue is ready to be created.',
        parameters: {
          type: 'object',
          properties: {
            issue_type: {
              type: 'string',
              enum: ['bug', 'feature', 'enhancement', 'documentation', 'question'],
            },
            title: { type: 'string' },
            body: { type: 'string' },
            labels: {
              type: 'array',
              items: { type: 'string' },
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
          },
          required: ['issue_type', 'title', 'body', 'labels'],
        },
      },
    },
  ];
}

// =============================================================================
// TOOL HANDLING HELPERS
// =============================================================================

/**
 * Merge new preview data into existing preview data.
 *
 * Only overwrites fields that have meaningful values.
 * This preserves previously gathered information while adding new details.
 *
 * @param existing - Current preview data (may be empty)
 * @param updates - New data from tool call
 * @returns Merged preview data
 */
function mergePreviewData(
  existing: IssuePreviewData,
  updates: Record<string, unknown>
): IssuePreviewData {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    // Only update if new value is truthy, OR if the key doesn't exist yet
    if (value || (Array.isArray(value) && !(key in existing))) {
      (merged as Record<string, unknown>)[key] = value;
    } else if (!(key in existing)) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  console.log(`[PREVIEW_MERGE] Updated fields: ${Object.keys(updates).join(', ')}`);
  return merged;
}

/**
 * Process tool calls from OpenAI response.
 *
 * Returns:
 * - { ready: true, data } if signal_issue_ready was called
 * - { ready: false, preview } if update_preview was called
 *
 * @param toolCalls - Tool calls from OpenAI response
 * @param currentPreview - Current preview data to merge with
 */
function processToolCalls(
  toolCalls: Array<{
    type: string;
    function?: { name: string; arguments: string };
  }>,
  currentPreview: IssuePreviewData
): { ready: true; data: IssuePreviewData } | { ready: false; preview: IssuePreviewData } {
  let preview = { ...currentPreview };

  for (const toolCall of toolCalls) {
    if (toolCall.type !== 'function' || !toolCall.function) continue;

    const funcName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    // Terminal state: issue is ready to be created
    if (funcName === 'signal_issue_ready') {
      return { ready: true, data: args };
    }

    // Update preview: merge new data with existing
    if (funcName === 'update_preview') {
      preview = mergePreviewData(preview, args);
    }
  }

  return { ready: false, preview };
}

// =============================================================================
// MAIN CHAT FUNCTION
// =============================================================================

/**
 * Chat for issue creation with tool calls.
 *
 * This is the main orchestration function for conversational issue creation.
 * It:
 * 1. Checks if user is ready to create (hybrid keyword + LLM detection)
 * 2. Sends conversation to OpenAI with tool definitions
 * 3. Processes tool calls to update preview or signal completion
 * 4. Returns response for the client to display
 *
 * Flow states:
 * - 'continue': Keep chatting, preview_data may be updated
 * - 'ready': Issue is complete, issue_data contains final values
 *
 * @param conversationHistory - Previous messages in the conversation
 * @param userMessage - The new message from the user
 * @param apiKey - OpenAI API key
 * @param currentPreviewData - Current preview data (if any)
 */
export async function chatIssueCreation(
  conversationHistory: ChatMessage[],
  userMessage: string,
  apiKey: string,
  currentPreviewData?: IssuePreviewData | null
): Promise<ChatIssueResponse> {
  // Load the system prompt that defines the AI's behavior
  const systemPrompt = await loadPrompt('chat_issue_creation');

  // Check if user wants to create the issue now
  const isReady = await detectReadiness(userMessage, apiKey);

  // Get tool definitions
  const tools = createIssueCreationTools();

  // Build the messages array for OpenAI
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // ---------------------------------------------------------------------------
  // TOOL CHOICE STRATEGY
  // ---------------------------------------------------------------------------
  // Force specific tool based on readiness detection:
  // - If ready: Force signal_issue_ready to finalize
  // - If not ready: Force update_preview to keep building
  //
  // This ensures consistent behavior rather than letting the AI choose.
  const toolChoice = isReady
    ? { type: 'function' as const, function: { name: 'signal_issue_ready' } }
    : { type: 'function' as const, function: { name: 'update_preview' } };

  // ---------------------------------------------------------------------------
  // CALL OPENAI
  // ---------------------------------------------------------------------------
  const openai = getOpenAIClient(apiKey);
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    max_tokens: TOKEN_LIMITS.CHAT,
    messages,
    tools,
    tool_choice: toolChoice,
    parallel_tool_calls: false, // Process tools one at a time
  });

  const message = response.choices[0]?.message;
  let previewData: IssuePreviewData = currentPreviewData ? { ...currentPreviewData } : {};

  // ---------------------------------------------------------------------------
  // PROCESS TOOL CALLS
  // ---------------------------------------------------------------------------
  if (message?.tool_calls) {
    const result = processToolCalls(message.tool_calls, previewData);

    // If issue is ready, return immediately with final data
    if (result.ready) {
      return {
        status: 'ready',
        issue_data: result.data,
      };
    }

    // Otherwise, update preview data
    previewData = result.preview;
  }

  // ---------------------------------------------------------------------------
  // FALLBACK: EXTRACT FROM CONVERSATION
  // ---------------------------------------------------------------------------
  // If we don't have preview data yet and user isn't ready,
  // try to extract details from the conversation history
  if (Object.keys(previewData).length === 0 && !isReady) {
    const extracted = await extractIssueDetailsFromConversation(messages, apiKey);
    previewData = extracted || {
      title: '',
      body: '',
      issue_type: null,
      labels: [],
      priority: null,
    };
  }

  // ---------------------------------------------------------------------------
  // GENERATE CONVERSATIONAL RESPONSE
  // ---------------------------------------------------------------------------
  let messageContent = message?.content?.trim() || '';

  // If no content and not ready, generate a follow-up message
  if (!messageContent && !isReady) {
    const conversationPrompt = `
Provide a natural conversational follow-up to help refine a GitHub issue.

Current title: ${previewData.title || 'Not set'}
Last user message: ${userMessage}

Respond conversationally only. No questions if the user appears finished.`;

    try {
      const followUp = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        max_tokens: 120,
        messages: [{ role: 'user', content: conversationPrompt }],
      });
      messageContent = followUp.choices[0]?.message?.content || "Let me know if you'd like to adjust anything.";
    } catch {
      messageContent = "Let me know if you'd like to adjust anything.";
    }
  }

  // ---------------------------------------------------------------------------
  // RETURN RESPONSE
  // ---------------------------------------------------------------------------
  return {
    status: 'continue',
    message: messageContent,
    preview_data: previewData,
    tool_calls: message?.tool_calls
      ?.filter((tc): tc is typeof tc & { type: 'function'; function: { name: string; arguments: string } } =>
        tc.type === 'function' && 'function' in tc
      )
      .map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
  };
}
