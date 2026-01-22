'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ActivityItem } from '@/types/github';

interface UseActivitySummariesReturn {
  activity: ActivityItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  summarizeItem: (item: ActivityItem) => Promise<{ summary: string; issue_type?: string; code_updates?: string }>;
}

export default function useActivitySummaries(): UseActivitySummariesReturn {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/github/activity');

      if (!res.ok) {
        throw new Error('Failed to fetch activity');
      }

      const data = await res.json();
      setActivity(data.activity || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const summarizeItem = async (
    item: ActivityItem
  ): Promise<{ summary: string; issue_type?: string; code_updates?: string }> => {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: item.is_pr ? 'pr' : 'issue',
        title: item.title,
        body: item.body || '',
        files: [], // Would need PR files for full summary
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to summarize');
    }

    const result = await res.json();

    // Update the activity item with the summary
    setActivity((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, summary: result } : a))
    );

    return result;
  };

  return {
    activity,
    loading,
    error,
    refresh: fetchActivity,
    summarizeItem,
  };
}
