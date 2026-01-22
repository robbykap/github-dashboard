'use client';

import { useState } from 'react';
import { Badge, LabelBadge, Button, Spinner } from '@/components/ui';
import type { GitHubIssue } from '@/types/github';
import type { SummarizeIssueResponse } from '@/types/ai';

interface IssueItemProps {
  issue: GitHubIssue;
  onSummarize?: (issue: GitHubIssue) => Promise<SummarizeIssueResponse>;
}

export default function IssueItem({ issue, onSummarize }: IssueItemProps) {
  const [summary, setSummary] = useState<SummarizeIssueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSummarize = async () => {
    if (summary || !onSummarize) return;

    setLoading(true);
    try {
      const result = await onSummarize(issue);
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
          {issue.state === 'open' ? (
            <svg className="w-4 h-4 text-gh-success" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              <path
                fillRule="evenodd"
                d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gh-purple" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z" />
              <path
                fillRule="evenodd"
                d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gh-text-bright hover:text-gh-accent"
            >
              {issue.title}
            </a>
            {issue.labels.map((label) => (
              <LabelBadge key={label.id} name={label.name} color={label.color} />
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-gh-text-muted">
            <span>#{issue.number}</span>
            <span>opened {timeAgo(issue.created_at)}</span>
            <span>by {issue.user.login}</span>
            {issue.comments > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M2.75 2.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 01.75.75v2.19l2.72-2.72a.75.75 0 01.53-.22h4.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25H2.75zM1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0113.25 12H9.06l-2.573 2.573A1.457 1.457 0 014 13.543V12H2.75A1.75 1.75 0 011 10.25v-7.5z"
                  />
                </svg>
                {issue.comments}
              </span>
            )}
          </div>

          {expanded && summary && (
            <div className="mt-3 p-3 bg-gh-bg-tertiary rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getIssueTypeVariant(summary.issue_type)}>
                  {summary.issue_type}
                </Badge>
              </div>
              <p className="text-sm text-gh-text">{summary.summary}</p>
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

function getIssueTypeVariant(issueType: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'pink' {
  switch (issueType) {
    case 'bug':
      return 'danger';
    case 'feature':
      return 'success';
    case 'enhancement':
      return 'info';
    case 'documentation':
      return 'purple';
    case 'question':
      return 'warning';
    default:
      return 'default';
  }
}
