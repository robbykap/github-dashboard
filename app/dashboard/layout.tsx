'use client';

import { Header, MainNav } from '@/components/layout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState<'repos' | 'activity'>('repos');
  const router = useRouter();

  const handleViewChange = (view: 'repos' | 'activity') => {
    setActiveView(view);
    if (view === 'activity') {
      router.push('/dashboard/activity');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gh-bg">
      <Header />
      <MainNav activeView={activeView} onViewChange={handleViewChange} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
