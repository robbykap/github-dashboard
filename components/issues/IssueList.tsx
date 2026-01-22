'use client';

import { LoadingOverlay } from '@/components/ui';
import IssueItem from './IssueItem';
import type { GitHubIssue } from '@/types/github';
import type { SummarizeIssueResponse } from '@/types/ai';

interface IssueListProps {
  issues: GitHubIssue[];
  loading?: boolean;
  emptyMessage?: string;
  onSummarize?: (issue: GitHubIssue) => Promise<SummarizeIssueResponse>;
}

export default function IssueList({
  issues,
  loading = false,
  emptyMessage = 'No issues found',
  onSummarize,
}: IssueListProps) {
  if (loading) {
    return <LoadingOverlay message="Loading issues..." />;
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gh-text-muted">
        <svg className="w-12 h-12 mb-4 opacity-50" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          <path
            fillRule="evenodd"
            d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
          />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gh-border">
      {issues.map((issue) => (
        <IssueItem key={issue.id} issue={issue} onSummarize={onSummarize} />
      ))}
    </div>
  );
}
