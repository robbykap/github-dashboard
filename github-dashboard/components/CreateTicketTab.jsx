function CreateTicketTab({ repos, selectedRepo }) {
    const {
        flowState,
        messages,
        conversationHistory,
        inputValue,
        isLoading,
        messagesEndRef,
        issueData,
        livePreviewData,
        configExpanded,
        projects,
        selectedProject,
        projectFields,
        fieldValues,
        assignees,
        createdIssueUrl,
        setInputValue,
        setConfigExpanded,
        setAssignees,
        handleSendMessage,
        handleApprovePreview,
        handleRejectPreview,
        handleProjectSelect,
        handleFieldChange,
        handleCreateIssue,
        handleSkipProject,
        startNewConversation
    } = useCreateIssueFlow(selectedRepo);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!selectedRepo) {
        return (
            <div className="create-ticket-tab">
                <div className="card">
                    <p className="text-muted">Please select a repository from the sidebar to create a ticket.</p>
                </div>
            </div>
        );
    }

    if (flowState === 'completed') {
        return (
            <div className="create-ticket-tab">
                <div className="card">
                    <div className="chat-header">
                        <h3>Ticket Created Successfully!</h3>
                    </div>
                    <div className="issue-actions">
                        <a
                            href={createdIssueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            View Issue on GitHub →
                        </a>
                        <button
                            className="btn btn-secondary"
                            onClick={startNewConversation}
                        >
                            Create New Ticket
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="create-ticket-tab">
            <ProgressSteps currentStep={flowState} />

            <div className="ticket-creation-grid">
                <ChatInterface
                    messages={messages}
                    inputValue={inputValue}
                    isLoading={isLoading}
                    flowState={flowState}
                    messagesEndRef={messagesEndRef}
                    onInputChange={setInputValue}
                    onSendMessage={handleSendMessage}
                    onNewTicket={startNewConversation}
                    onKeyPress={handleKeyPress}
                />

                <div className="preview-column">
                    <div className="unified-preview-container">
                        <LiveIssuePreview
                            conversationHistory={conversationHistory}
                            messages={messages}
                            previewData={flowState === 'chatting' ? livePreviewData : issueData}
                            flowState={flowState}
                            onApprove={handleApprovePreview}
                            onReject={handleRejectPreview}
                        />
                    </div>

                    {(flowState === 'editing_fields' || flowState === 'creating') && (
                        <CollapsibleSection
                            title="⚙️ Configure Project Settings (Optional)"
                            isExpanded={configExpanded}
                            onToggle={() => setConfigExpanded(!configExpanded)}
                        >
                            <ProjectFieldsForm
                                projects={projects}
                                selectedProject={selectedProject}
                                projectFields={projectFields}
                                fieldValues={fieldValues}
                                assignees={assignees}
                                onProjectSelect={handleProjectSelect}
                                onFieldChange={handleFieldChange}
                                onAssigneesChange={setAssignees}
                                onSubmit={handleCreateIssue}
                                onCancel={() => handleRejectPreview()}
                                onSkip={handleSkipProject}
                                isLoading={isLoading || flowState === 'creating'}
                            />
                        </CollapsibleSection>
                    )}
                </div>
            </div>
        </div>
    );
}
