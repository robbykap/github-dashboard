'use client';

interface MainNavProps {
  activeView: 'repos' | 'activity';
  onViewChange: (view: 'repos' | 'activity') => void;
}

export default function MainNav({ activeView, onViewChange }: MainNavProps) {
  return (
    <nav className="bg-gh-bg-secondary border-b border-gh-border">
      <div className="flex px-6">
        <button
          onClick={() => onViewChange('repos')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
            ${
              activeView === 'repos'
                ? 'text-gh-text-bright border-gh-accent'
                : 'text-gh-text-muted border-transparent hover:text-gh-text hover:border-gh-border'
            }
          `}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path
              fillRule="evenodd"
              d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"
            />
          </svg>
          Repositories
        </button>

        <button
          onClick={() => onViewChange('activity')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
            ${
              activeView === 'activity'
                ? 'text-gh-text-bright border-gh-accent'
                : 'text-gh-text-muted border-transparent hover:text-gh-text hover:border-gh-border'
            }
          `}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path
              fillRule="evenodd"
              d="M1.5 1.75a.75.75 0 00-1.5 0v12.5c0 .414.336.75.75.75h14.5a.75.75 0 000-1.5H1.5V1.75zm14.28 2.53a.75.75 0 00-1.06-1.06L10 7.94 7.53 5.47a.75.75 0 00-1.06 0L3.22 8.72a.75.75 0 001.06 1.06L7 7.06l2.47 2.47a.75.75 0 001.06 0l5.25-5.25z"
            />
          </svg>
          My Activity
        </button>
      </div>
    </nav>
  );
}
