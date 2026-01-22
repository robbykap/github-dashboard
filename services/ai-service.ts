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

// Load prompt template from prompts directory
async function loadPrompt(name: string): Promise<string> {
  const promptPath = join(process.cwd(), 'prompts', `${name}.md`);
  return readFile(promptPath, 'utf-8');
}

// Keywords that signal user is ready to create the issue
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

// Detect if user wants to create the issue now
export async function detectReadiness(text: string, apiKey: string): Promise<boolean> {
  if (!text || !text.trim()) return false;

  const textLower = text.toLowerCase();

  // Quick keyword check (fast path)
  for (const keyword of READY_KEYWORDS) {
    if (textLower.includes(keyword)) {
      console.log(`[READINESS_DETECTED] Keyword match: '${keyword}'`);
      return true;
    }
  }

  // LLM fallback for implicit signals
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
    // Fail open for common ready phrases
    const isReady = ['ready', 'create', 'make'].some((phrase) =>
      textLower.includes(phrase)
    );
    if (isReady) {
      console.log('[READINESS_DETECTED] Fallback match');
    }
    return isReady;
  }
}

// Summarize a pull request
export async function summarizePullRequest(
  title: string,
  body: string,
  files: PRFileSummary[],
  apiKey: string
): Promise<SummarizePRResponse> {
  const filesText = files
    .slice(0, MAX_ITEMS.PR_FILES)
    .map((f) => `- ${f.filename} (${f.status}): +${f.additions}/-${f.deletions}`)
    .join('\n');

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

  try {
    return JSON.parse(content);
  } catch {
    return { summary: content, code_updates: '' };
  }
}

// Summarize an issue
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

// Prioritize a list of issues
export async function prioritizeIssues(
  issues: Array<{ id: number; title: string }>,
  apiKey: string
): Promise<number[]> {
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
    return issues.map((i) => i.id);
  }
}

// Extract issue details from conversation history
export async function extractIssueDetailsFromConversation(
  messages: ChatMessage[],
  apiKey: string
): Promise<ExtractedIssueDetails | null> {
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
      // Filter out null/empty values
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

// Chat for issue creation with tool calls
export async function chatIssueCreation(
  conversationHistory: ChatMessage[],
  userMessage: string,
  apiKey: string,
  currentPreviewData?: IssuePreviewData | null
): Promise<ChatIssueResponse> {
  const systemPrompt = await loadPrompt('chat_issue_creation');
  const isReady = await detectReadiness(userMessage, apiKey);

  const tools: OpenAITool[] = [
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

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // Force specific tool based on readiness
  const toolChoice = isReady
    ? { type: 'function' as const, function: { name: 'signal_issue_ready' } }
    : { type: 'function' as const, function: { name: 'update_preview' } };

  const openai = getOpenAIClient(apiKey);
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    max_tokens: TOKEN_LIMITS.CHAT,
    messages,
    tools,
    tool_choice: toolChoice,
    parallel_tool_calls: false,
  });

  const message = response.choices[0]?.message;
  let previewData: IssuePreviewData = currentPreviewData ? { ...currentPreviewData } : {};

  // Handle tool calls
  if (message?.tool_calls) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== 'function' || !('function' in toolCall)) continue;
      const funcName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      // Terminal state - issue is ready
      if (funcName === 'signal_issue_ready') {
        return {
          status: 'ready',
          issue_data: args,
        };
      }

      // Update preview - merge with existing data
      if (funcName === 'update_preview') {
        for (const [key, value] of Object.entries(args)) {
          if (value || (Array.isArray(value) && !(key in previewData))) {
            (previewData as Record<string, unknown>)[key] = value;
          } else if (!(key in previewData)) {
            (previewData as Record<string, unknown>)[key] = value;
          }
        }
        console.log(`[PREVIEW_MERGE] Updated fields: ${Object.keys(args).join(', ')}`);
      }
    }
  }

  // Preview fallback if not ready and no preview data
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

  // Get conversational content
  let messageContent = message?.content?.trim() || '';

  // Generate conversational follow-up if needed
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
