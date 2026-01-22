'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GitHubIssue } from '@/types/github';
import type { SummarizeIssueResponse, SummarizePRResponse, PRFileSummary } from '@/types/ai';

interface UseRepositoryIssuesOptions {
  repoFullName: string | null;
  state?: 'open' | 'closed' | 'all';
}

interface UseRepositoryIssuesReturn {
  issues: GitHubIssue[];
  pullRequests: GitHubIssue[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  summarizeIssue: (issue: GitHubIssue) => Promise<SummarizeIssueResponse>;
  summarizePR: (pr: GitHubIssue, repoFullName: string) => Promise<SummarizePRResponse>;
}

export default function useRepositoryIssues({
  repoFullName,
  state = 'open',
}: UseRepositoryIssuesOptions): UseRepositoryIssuesReturn {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    if (!repoFullName) {
      setIssues([]);
      setPullRequests([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/github/issues?repo=${encodeURIComponent(repoFullName)}&state=${state}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch issues');
      }

      const data = await res.json();
      setIssues(data.issues || []);
      setPullRequests(data.pull_requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [repoFullName, state]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const summarizeIssue = async (issue: GitHubIssue): Promise<SummarizeIssueResponse> => {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'issue',
        title: issue.title,
        body: issue.body || '',
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to summarize issue');
    }

    return res.json();
  };

  const summarizePR = async (
    pr: GitHubIssue,
    repoName: string
  ): Promise<SummarizePRResponse> => {
    // For now, we don't fetch PR files - this would require additional API call
    // In a production app, you'd fetch the files first
    const files: PRFileSummary[] = [];

    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'pr',
        title: pr.title,
        body: pr.body || '',
        files,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to summarize PR');
    }

    return res.json();
  };

  return {
    issues,
    pullRequests,
    loading,
    error,
    refresh: fetchIssues,
    summarizeIssue,
    summarizePR,
  };
}
