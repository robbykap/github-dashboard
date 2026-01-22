'use client';

import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex border-b border-gh-border ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            border-b-2 -mb-px
            ${
              activeTab === tab.id
                ? 'text-gh-text-bright border-gh-accent'
                : 'text-gh-text-muted border-transparent hover:text-gh-text hover:border-gh-border'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TabContentProps {
  children: ReactNode;
  className?: string;
}

export function TabContent({ children, className = '' }: TabContentProps) {
  return <div className={`py-4 ${className}`}>{children}</div>;
}
