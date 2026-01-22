// AI Service Types

export type IssueType = 'bug' | 'feature' | 'enhancement' | 'documentation' | 'question';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Chat Issue Creation Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface IssuePreviewData {
  title?: string;
  body?: string;
  issue_type?: IssueType | null;
  labels?: string[];
  priority?: Priority | null;
}

export interface ChatIssueRequest {
  conversation_history: ChatMessage[];
  message: string;
  current_preview_data?: IssuePreviewData | null;
}

export interface ChatIssueResponse {
  status: 'continue' | 'ready';
  message?: string;
  preview_data?: IssuePreviewData;
  issue_data?: IssuePreviewData;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// Summarization Types
export interface SummarizeIssueRequest {
  title: string;
  body: string;
}

export interface SummarizeIssueResponse {
  issue_type: IssueType | 'unknown';
  summary: string;
}

export interface SummarizePRRequest {
  title: string;
  body: string;
  files: PRFileSummary[];
}

export interface PRFileSummary {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes?: number;
  patch?: string;
}

export interface SummarizePRResponse {
  summary: string;
  code_updates: string;
}

// Prioritization Types
export interface PrioritizeIssuesRequest {
  issues: PrioritizeIssueInput[];
}

export interface PrioritizeIssueInput {
  id: number;
  title: string;
}

export type PrioritizeIssuesResponse = number[];

// Extract Issue Details Types
export interface ExtractedIssueDetails {
  title?: string;
  body?: string;
  issue_type?: IssueType | null;
  labels?: string[];
  priority?: Priority | null;
}

// OpenAI Tool Definitions
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

export interface OpenAIToolProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
}

// Flow State for Issue Creation
export type FlowState =
  | 'chatting'      // In conversation
  | 'preview'       // Showing preview
  | 'editing_fields' // Configuring project fields
  | 'creating'      // Creating the issue
  | 'completed';    // Issue created successfully
