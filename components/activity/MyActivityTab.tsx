'use client';

import { useState, useEffect } from 'react';
import { Card, LoadingOverlay, Tabs, TabContent } from '@/components/ui';
import ActivityItem from './ActivityItem';
import type { ActivityItem as ActivityItemType } from '@/types/github';

export default function MyActivityTab() {
  const [activity, setActivity] = useState<ActivityItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'issues' | 'prs'>('all');

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/github/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json();
      setActivity(data.activity || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (item: ActivityItemType) => {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: item.is_pr ? 'pr' : 'issue',
        title: item.title,
        body: item.body || '',
        files: [], // Would need to fetch PR files for full summary
      }),
    });

    if (!res.ok) throw new Error('Failed to summarize');
    return res.json();
  };

  const filteredActivity = activity.filter((item) => {
    if (filter === 'issues') return !item.is_pr;
    if (filter === 'prs') return item.is_pr;
    return true;
  });

  const issueCount = activity.filter((i) => !i.is_pr).length;
  const prCount = activity.filter((i) => i.is_pr).length;

  if (loading) {
    return <LoadingOverlay message="Loading your activity..." />;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gh-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-gh-text mb-4">{error}</p>
            <button
              onClick={fetchActivity}
              className="text-gh-accent hover:underline"
            >
              Try again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-b border-gh-border">
        <h2 className="text-xl font-semibold text-gh-text-bright mb-2">My Activity</h2>
        <p className="text-sm text-gh-text-muted">
          Your open issues and pull requests across all repositories
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: `All (${activity.length})` },
          { id: 'issues', label: `Issues (${issueCount})` },
          { id: 'prs', label: `Pull Requests (${prCount})` },
        ]}
        activeTab={filter}
        onChange={(id) => setFilter(id as 'all' | 'issues' | 'prs')}
        className="px-6"
      />

      <TabContent className="flex-1 overflow-y-auto px-0 py-0">
        {filteredActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gh-text-muted">
            <svg
              className="w-12 h-12 mb-4 opacity-50"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M1.5 1.75a.75.75 0 00-1.5 0v12.5c0 .414.336.75.75.75h14.5a.75.75 0 000-1.5H1.5V1.75zm14.28 2.53a.75.75 0 00-1.06-1.06L10 7.94 7.53 5.47a.75.75 0 00-1.06 0L3.22 8.72a.75.75 0 001.06 1.06L7 7.06l2.47 2.47a.75.75 0 001.06 0l5.25-5.25z"
              />
            </svg>
            <p>No {filter === 'all' ? 'activity' : filter} found</p>
          </div>
        ) : (
          <div className="divide-y divide-gh-border">
            {filteredActivity.map((item) => (
              <ActivityItem
                key={item.id}
                item={item}
                onSummarize={handleSummarize}
              />
            ))}
          </div>
        )}
      </TabContent>
    </div>
  );
}
