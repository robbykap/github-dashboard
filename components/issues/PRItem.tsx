'use client';

import { useState } from 'react';
import { Badge, LabelBadge, Button, Spinner } from '@/components/ui';
import type { GitHubIssue } from '@/types/github';
import type { SummarizePRResponse } from '@/types/ai';

interface PRItemProps {
  pr: GitHubIssue; // PRs come through issues API with pull_request field
  repoFullName: string;
  onSummarize?: (pr: GitHubIssue, repoFullName: string) => Promise<SummarizePRResponse>;
}

export default function PRItem({ pr, repoFullName, onSummarize }: PRItemProps) {
  const [summary, setSummary] = useState<SummarizePRResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSummarize = async () => {
    if (summary || !onSummarize) return;

    setLoading(true);
    try {
      const result = await onSummarize(pr, repoFullName);
      setSummary(result);
      setExpanded(true);
    } catch (error) {
      console.error('Failed to summarize:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 border-b border-gh-border hover:bg-gh-bg-tertiary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {pr.state === 'open' ? (
            <svg className="w-4 h-4 text-gh-success" fill="currentColor" viewBox="0 0 16 16">
              <path
                fillRule="evenodd"
                d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gh-purple" fill="currentColor" viewBox="0 0 16 16">
              <path
                fillRule="evenodd"
                d="M5 3.254V3.25v.005a.75.75 0 110-.005v.004zm.45 1.9a2.25 2.25 0 10-1.95.218v5.256a2.25 2.25 0 101.5 0V7.123A5.735 5.735 0 009.25 9h1.378a2.251 2.251 0 100-1.5H9.25a4.25 4.25 0 01-3.8-2.346zM12.75 9a.75.75 0 100-1.5.75.75 0 000 1.5zm-8.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={pr.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gh-text-bright hover:text-gh-accent"
            >
              {pr.title}
            </a>
            {pr.labels.map((label) => (
              <LabelBadge key={label.id} name={label.name} color={label.color} />
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-gh-text-muted">
            <span>#{pr.number}</span>
            <span>opened {timeAgo(pr.created_at)}</span>
            <span>by {pr.user.login}</span>
            {pr.comments > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M2.75 2.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 01.75.75v2.19l2.72-2.72a.75.75 0 01.53-.22h4.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25H2.75zM1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0113.25 12H9.06l-2.573 2.573A1.457 1.457 0 014 13.543V12H2.75A1.75 1.75 0 011 10.25v-7.5z"
                  />
                </svg>
                {pr.comments}
              </span>
            )}
          </div>

          {expanded && summary && (
            <div className="mt-3 p-3 bg-gh-bg-tertiary rounded-md">
              <p className="text-sm text-gh-text mb-2">{summary.summary}</p>
              {summary.code_updates && (
                <div className="mt-2 pt-2 border-t border-gh-border">
                  <p className="text-xs text-gh-text-muted mb-1">Code Changes:</p>
                  <p className="text-sm text-gh-text">{summary.code_updates}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {onSummarize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSummarize}
              disabled={loading || !!summary}
            >
              {loading ? (
                <Spinner size="sm" />
              ) : summary ? (
                <span
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                >
                  {expanded ? 'Hide' : 'Show'}
                </span>
              ) : (
                'Summarize'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
