/**
 * AI Service Type Definitions
 *
 * This file contains all TypeScript types for AI-powered features:
 * - Chat-based issue creation
 * - Issue and PR summarization
 * - Issue prioritization
 * - OpenAI tool calling
 *
 * These types are shared between:
 * - services/ai-service.ts (server-side logic)
 * - hooks/useCreateIssueFlow.ts (client-side state)
 * - API routes (request/response contracts)
 *
 * @see docs/TYPESCRIPT_BASICS.md for TypeScript pattern explanations
 */

// =============================================================================
// BASIC TYPES
// =============================================================================

/**
 * Types of GitHub issues we classify.
 * Used for tagging and organizing issues in the UI.
 */
export type IssueType = 'bug' | 'feature' | 'enhancement' | 'documentation' | 'question';

/**
 * Priority levels for issues.
 * Helps with triage and ordering in lists.
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// CHAT ISSUE CREATION TYPES
// =============================================================================

/**
 * A single message in the conversation.
 *
 * @property role - Who sent the message:
 *   - 'user': The human using the app
 *   - 'assistant': The AI assistant
 *   - 'system': System instructions (not shown to user)
 * @property content - The text content of the message
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Data for the live issue preview.
 *
 * All fields are optional because they're filled in progressively
 * as the user describes their issue in chat.
 *
 * @property title - Issue title (short summary)
 * @property body - Issue body (detailed description, markdown)
 * @property issue_type - Classification (bug, feature, etc.)
 * @property labels - GitHub labels to apply
 * @property priority - Urgency level
 */
export interface IssuePreviewData {
  title?: string;
  body?: string;
  issue_type?: IssueType | null;
  labels?: string[];
  priority?: Priority | null;
}

/**
 * Request body for POST /api/chat-issue
 *
 * @property conversation_history - Previous messages (for context)
 * @property message - The new user message
 * @property current_preview_data - Current preview state (for merging)
 */
export interface ChatIssueRequest {
  conversation_history: ChatMessage[];
  message: string;
  current_preview_data?: IssuePreviewData | null;
}

/**
 * Response from POST /api/chat-issue
 *
 * @property status - Flow state:
 *   - 'continue': Keep chatting, preview may be updated
 *   - 'ready': Issue is complete, ready to create
 * @property message - Assistant's response (when continuing)
 * @property preview_data - Updated preview (when continuing)
 * @property issue_data - Final issue data (when ready)
 * @property tool_calls - Raw tool calls from OpenAI (for debugging)
 */
export interface ChatIssueResponse {
  status: 'continue' | 'ready';
  message?: string;
  preview_data?: IssuePreviewData;
  issue_data?: IssuePreviewData;
  tool_calls?: ToolCall[];
}

/**
 * A tool call from OpenAI's function calling feature.
 *
 * When we ask OpenAI to call tools, it returns these structured calls
 * instead of (or in addition to) free text.
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string, needs parsing
  };
}

// =============================================================================
// SUMMARIZATION TYPES
// =============================================================================

/**
 * Request body for issue summarization.
 */
export interface SummarizeIssueRequest {
  title: string;
  body: string;
}

/**
 * Response from issue summarization.
 *
 * @property issue_type - Classified type or 'unknown' if uncertain
 * @property summary - Short summary of the issue
 */
export interface SummarizeIssueResponse {
  issue_type: IssueType | 'unknown';
  summary: string;
}

/**
 * Request body for PR summarization.
 */
export interface SummarizePRRequest {
  title: string;
  body: string;
  files: PRFileSummary[];
}

/**
 * Summary of a file changed in a PR.
 *
 * @property filename - Path to the file
 * @property status - Change type: 'added', 'modified', 'removed'
 * @property additions - Lines added
 * @property deletions - Lines removed
 * @property changes - Total lines changed (optional)
 * @property patch - The actual diff (optional, can be large)
 */
export interface PRFileSummary {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes?: number;
  patch?: string;
}

/**
 * Response from PR summarization.
 *
 * @property summary - High-level summary of the PR
 * @property code_updates - Technical description of code changes
 */
export interface SummarizePRResponse {
  summary: string;
  code_updates: string;
}

// =============================================================================
// PRIORITIZATION TYPES
// =============================================================================

/**
 * Request body for issue prioritization.
 */
export interface PrioritizeIssuesRequest {
  issues: PrioritizeIssueInput[];
}

/**
 * Minimal issue data needed for prioritization.
 * We only send ID and title to minimize token usage.
 */
export interface PrioritizeIssueInput {
  id: number;
  title: string;
}

/**
 * Response from prioritization.
 * Array of issue IDs in priority order (most important first).
 */
export type PrioritizeIssuesResponse = number[];

// =============================================================================
// ISSUE EXTRACTION TYPES
// =============================================================================

/**
 * Structured issue details extracted from conversation.
 *
 * This is used as a fallback when tool calls don't provide preview data.
 * Same shape as IssuePreviewData but named differently for clarity.
 */
export interface ExtractedIssueDetails {
  title?: string;
  body?: string;
  issue_type?: IssueType | null;
  labels?: string[];
  priority?: Priority | null;
}

// =============================================================================
// OPENAI TOOL DEFINITION TYPES
// =============================================================================

/**
 * Definition of a tool (function) that OpenAI can call.
 *
 * OpenAI's function calling feature lets us define "tools" that the AI
 * can invoke with structured arguments, instead of returning free text.
 *
 * @see https://platform.openai.com/docs/guides/function-calling
 */
export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, OpenAIToolProperty>;
      required: string[];
    };
  };
}

/**
 * Property definition for a tool parameter.
 *
 * @property type - JSON Schema type ('string', 'number', 'array', etc.)
 * @property description - Help text for the AI
 * @property enum - Allowed values (for string enums)
 * @property items - Array item type (for arrays)
 */
export interface OpenAIToolProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
}

// =============================================================================
// FLOW STATE
// =============================================================================

/**
 * States in the issue creation flow (state machine).
 *
 * The flow progresses: chatting → editing_fields → creating → completed
 *
 * - 'chatting': User is describing the issue in conversation
 * - 'preview': (Legacy) Showing preview for approval
 * - 'editing_fields': Issue ready, user configures project/assignees
 * - 'creating': API call in progress to create issue
 * - 'completed': Issue created successfully, show link
 */
export type FlowState =
  | 'chatting'
  | 'preview'
  | 'editing_fields'
  | 'creating'
  | 'completed';
