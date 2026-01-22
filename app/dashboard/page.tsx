'use client';

import { useState } from 'react';
import { Sidebar, RepoHeader } from '@/components/layout';
import { Tabs, TabContent, Button } from '@/components/ui';
import { IssueList, PRList } from '@/components/issues';
import { ChatInterface } from '@/components/chat';
import { LiveIssuePreview, ProjectFieldsForm } from '@/components/preview';
import { useCreateIssueFlow, useRepositoryIssues } from '@/hooks';
import type { GitHubRepository } from '@/types/github';

export default function DashboardPage() {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');

  const {
    flowState,
    messages,
    inputValue,
    isLoading,
    issueData,
    livePreviewData,
    selectedProject,
    fieldValues,
    createdIssueUrl,
    setInputValue,
    handleSendMessage,
    handleProjectSelect,
    handleFieldChange,
    handleCreateIssue,
    handleSkipProject,
    startNewConversation,
  } = useCreateIssueFlow({ selectedRepo: selectedRepo?.full_name || null });

  const {
    issues,
    pullRequests,
    loading: issuesLoading,
    summarizeIssue,
    summarizePR,
  } = useRepositoryIssues({ repoFullName: selectedRepo?.full_name || null });

  const tabs = [
    { id: 'create', label: 'Create Issue' },
    { id: 'view', label: 'View Issues' },
  ];

  return (
    <div className="flex h-full">
      <Sidebar selectedRepo={selectedRepo} onSelectRepo={setSelectedRepo} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <RepoHeader repo={selectedRepo} />

        {selectedRepo ? (
          <>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as 'create' | 'view')}
              className="px-6"
            />

            <TabContent className="flex-1 overflow-y-auto px-0 py-0">
              {activeTab === 'create' ? (
                <div className="flex h-full">
                  {/* Chat section */}
                  <div className="flex-1 flex flex-col border-r border-gh-border">
                    <ChatInterface
                      messages={messages}
                      inputValue={inputValue}
                      onInputChange={setInputValue}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                      disabled={flowState === 'creating' || flowState === 'completed'}
                      placeholder={
                        flowState === 'completed'
                          ? 'Issue created! Start a new conversation...'
                          : 'Describe your issue...'
                      }
                    />

                    {flowState === 'completed' && createdIssueUrl && (
                      <div className="p-4 border-t border-gh-border bg-gh-bg-secondary">
                        <div className="flex items-center justify-between">
                          <a
                            href={createdIssueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gh-accent hover:underline"
                          >
                            View created issue
                          </a>
                          <Button size="sm" onClick={startNewConversation}>
                            Create Another
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview section */}
                  <div className="w-96 flex flex-col p-4 space-y-4 overflow-y-auto bg-gh-bg-secondary/50">
                    <LiveIssuePreview
                      data={flowState === 'editing_fields' ? issueData : livePreviewData}
                    />

                    {flowState === 'editing_fields' && (
                      <ProjectFieldsForm
                        selectedRepo={selectedRepo.full_name}
                        onProjectSelect={handleProjectSelect}
                        onFieldChange={handleFieldChange}
                        onSubmit={handleCreateIssue}
                        onSkip={handleSkipProject}
                        isLoading={isLoading}
                        fieldValues={fieldValues}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gh-text-bright mb-4">
                      Open Issues ({issues.length})
                    </h3>
                    <IssueList
                      issues={issues}
                      loading={issuesLoading}
                      emptyMessage="No open issues in this repository"
                      onSummarize={summarizeIssue}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gh-text-bright mb-4">
                      Open Pull Requests ({pullRequests.length})
                    </h3>
                    <PRList
                      pullRequests={pullRequests}
                      repoFullName={selectedRepo.full_name}
                      loading={issuesLoading}
                      emptyMessage="No open pull requests in this repository"
                      onSummarize={summarizePR}
                    />
                  </div>
                </div>
              )}
            </TabContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gh-text-muted opacity-50"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"
                />
              </svg>
              <p className="text-gh-text-muted">
                Select a repository from the sidebar to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
