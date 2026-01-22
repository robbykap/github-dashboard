'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';
import type { GitHubRepository } from '@/types/github';

interface SidebarProps {
  selectedRepo: GitHubRepository | null;
  onSelectRepo: (repo: GitHubRepository) => void;
}

export default function Sidebar({ selectedRepo, onSelectRepo }: SidebarProps) {
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/github/repos');
      if (!res.ok) throw new Error('Failed to fetch repositories');
      const data = await res.json();
      setRepos(data.repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 bg-gh-bg-secondary border-r border-gh-border flex flex-col h-full">
      <div className="p-4 border-b border-gh-border">
        <input
          type="text"
          placeholder="Find a repository..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-sm text-gh-text placeholder-gh-text-muted focus:outline-none focus:ring-2 focus:ring-gh-accent focus:border-transparent"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : error ? (
          <div className="p-4 text-gh-danger text-sm">{error}</div>
        ) : filteredRepos.length === 0 ? (
          <div className="p-4 text-gh-text-muted text-sm">No repositories found</div>
        ) : (
          <ul className="py-2">
            {filteredRepos.map((repo) => (
              <li key={repo.id}>
                <button
                  onClick={() => onSelectRepo(repo)}
                  className={`
                    w-full px-4 py-2 text-left text-sm transition-colors
                    flex items-center gap-2
                    ${
                      selectedRepo?.id === repo.id
                        ? 'bg-gh-bg-tertiary text-gh-text-bright'
                        : 'text-gh-text hover:bg-gh-bg-tertiary/50'
                    }
                  `}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0 text-gh-text-muted"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"
                    />
                  </svg>
                  <span className="truncate">{repo.full_name}</span>
                  {repo.private && (
                    <svg
                      className="w-3 h-3 ml-auto flex-shrink-0 text-gh-warning"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4v2h-.25A1.75 1.75 0 002 7.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-5.5A1.75 1.75 0 0012.25 6H12V4a4 4 0 10-8 0zm6.5 2V4a2.5 2.5 0 00-5 0v2h5zM12 7.5h.25a.25.25 0 01.25.25v5.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-5.5a.25.25 0 01.25-.25H12z"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
