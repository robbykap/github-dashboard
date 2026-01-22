// GitHub API Types

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  name?: string;
  email?: string;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
}

export interface GitHubLabel {
  id: number;
  node_id: string;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed';
  due_on: string | null;
}

export interface GitHubIssue {
  id: number;
  node_id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  state_reason?: 'completed' | 'reopened' | 'not_planned' | null;
  html_url: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
  repository?: {
    name: string;
    full_name: string;
    owner: { login: string };
  };
}

export interface GitHubPRFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  sha: string | null;
  blob_url: string;
  raw_url: string;
  contents_url: string;
}

export interface GitHubPullRequest {
  id: number;
  node_id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  draft: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
  repository?: {
    name: string;
    full_name: string;
    owner: { login: string };
  };
}

// GitHub Projects v2 Types
export interface GitHubProjectV2 {
  id: string;
  title: string;
  number: number;
  shortDescription: string | null;
}

export interface GitHubProjectV2FieldOption {
  id: string;
  name: string;
}

export interface GitHubProjectV2IterationConfig {
  id: string;
  title: string;
  startDate: string;
  duration: number;
}

export interface GitHubProjectV2Field {
  id: string;
  name: string;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT' | 'ITERATION';
  options?: GitHubProjectV2FieldOption[];
  configuration?: {
    iterations?: GitHubProjectV2IterationConfig[];
  };
}

// API Request/Response Types
export interface CreateIssueRequest {
  repo: string;
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  project_id?: string;
  field_values?: Record<string, string | number>;
}

export interface CreateIssueResponse {
  success: boolean;
  issue_url?: string;
  issue_number?: number;
  issue_data?: GitHubIssue;
  error?: string;
}

export interface GetProjectsResponse {
  success: boolean;
  projects?: GitHubProjectV2[];
  errors?: unknown[];
  error?: string;
}

export interface GetProjectFieldsResponse {
  success: boolean;
  fields?: GitHubProjectV2Field[];
  errors?: unknown[];
  error?: string;
}

export interface ActivityItem extends GitHubIssue {
  is_pr: boolean;
  summary?: {
    summary: string;
    code_updates?: string;
    issue_type?: string;
  };
}

// Utility Types
export type IssueState = 'open' | 'closed' | 'all';
export type IssueSort = 'created' | 'updated' | 'comments';
export type SortDirection = 'asc' | 'desc';
