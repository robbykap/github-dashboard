'use client';

import { LoadingOverlay } from '@/components/ui';
import PRItem from './PRItem';
import type { GitHubIssue } from '@/types/github';
import type { SummarizePRResponse } from '@/types/ai';

interface PRListProps {
  pullRequests: GitHubIssue[];
  repoFullName: string;
  loading?: boolean;
  emptyMessage?: string;
  onSummarize?: (pr: GitHubIssue, repoFullName: string) => Promise<SummarizePRResponse>;
}

export default function PRList({
  pullRequests,
  repoFullName,
  loading = false,
  emptyMessage = 'No pull requests found',
  onSummarize,
}: PRListProps) {
  if (loading) {
    return <LoadingOverlay message="Loading pull requests..." />;
  }

  if (pullRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gh-text-muted">
        <svg className="w-12 h-12 mb-4 opacity-50" fill="currentColor" viewBox="0 0 16 16">
          <path
            fillRule="evenodd"
            d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
          />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gh-border">
      {pullRequests.map((pr) => (
        <PRItem key={pr.id} pr={pr} repoFullName={repoFullName} onSummarize={onSummarize} />
      ))}
    </div>
  );
}
