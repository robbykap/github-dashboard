const { useState, useEffect, useRef } = React;

function useCreateIssueFlow(selectedRepo) {
    const [flowState, setFlowState] = useState('chatting');
    const [messages, setMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [issueData, setIssueData] = useState(null);
    const [livePreviewData, setLivePreviewData] = useState(null);
    const [configExpanded, setConfigExpanded] = useState(true);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [projectFields, setProjectFields] = useState([]);
    const [fieldValues, setFieldValues] = useState({});
    const [assignees, setAssignees] = useState([]);
    const [createdIssueUrl, setCreatedIssueUrl] = useState('');

    useEffect(() => {
        if (!selectedRepo) return;
        startNewConversation();
    }, [selectedRepo]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const startNewConversation = () => {
        setMessages([{
            role: 'assistant',
            content: "Hi! I'll help you create a GitHub issue. What would you like to report or request?"
        }]);
        setConversationHistory([]);
        setFlowState('chatting');
        setIssueData(null);
        setCreatedIssueUrl('');
        setInputValue('');
        setProjects([]);
        setSelectedProject('');
        setProjectFields([]);
        setFieldValues({});
        setAssignees([]);
        setConfigExpanded(true);
    };

    const handleSendMessage = async () => {
        const trimmedMessage = inputValue.trim();

        if (!trimmedMessage || trimmedMessage.length === 0 || isLoading || !selectedRepo) {
            return;
        }

        const userMessage = trimmedMessage;
        setInputValue('');

        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_history: conversationHistory,
                    message: userMessage,
                    current_preview_data: livePreviewData
                })
            });

            const data = await response.json();

            if (data.status === 'ready') {
                setIssueData(data.issue_data);
                setFlowState('editing_fields'); // Skip 'preview' state, go directly to config
                setConfigExpanded(true);

                const assistantMessage = 'Great! I\'ve prepared the issue. You can review it in the preview and configure project settings below.';

                setMessages([...newMessages, {
                    role: 'assistant',
                    content: assistantMessage
                }]);

                setConversationHistory([
                    ...conversationHistory,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: assistantMessage }
                ]);

                await fetchProjects();
            } else if (data.status === 'continue') {
                // ALWAYS set preview data to ensure it never disappears
                // Use fallback to previous data or empty structure if new data is missing
                setLivePreviewData(data.preview_data || livePreviewData || {
                    title: '',
                    body: '',
                    labels: [],
                    issue_type: null,
                    priority: null
                });

                const assistantMessage = data.message || 'I\'m thinking...';

                setMessages([...newMessages, {
                    role: 'assistant',
                    content: assistantMessage
                }]);

                const newHistory = [
                    ...conversationHistory,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: assistantMessage }
                ];

                setConversationHistory(newHistory);
            } else {
                setMessages([...newMessages, {
                    role: 'assistant',
                    content: data.message || 'Sorry, there was an error processing your request.'
                }]);
            }
        } catch (error) {
            setMessages([...newMessages, {
                role: 'assistant',
                content: 'Sorry, there was an error communicating with the server.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const projectsResponse = await fetch('/api/get-projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo: selectedRepo })
            });

            const projectsData = await projectsResponse.json();

            if (projectsData.success) {
                setProjects(projectsData.projects || []);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleApprovePreview = () => {
        setFlowState('editing_fields');
        setConfigExpanded(true);
    };

    const handleRejectPreview = () => {
        setFlowState('chatting');
        setIssueData(null);
        setMessages([...messages, {
            role: 'assistant',
            content: 'What changes would you like to make to the issue?'
        }]);
        setConversationHistory([
            ...conversationHistory,
            { role: 'assistant', content: 'What changes would you like to make to the issue?' }
        ]);
    };

    const handleProjectSelect = async (projectId) => {
        setSelectedProject(projectId);
        setProjectFields([]);
        setFieldValues({});

        if (!projectId) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/get-project-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: projectId })
            });

            const data = await response.json();

            if (data.success) {
                setProjectFields(data.fields || []);
            }
        } catch (error) {
            console.error('Error fetching project fields:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (fieldId, value) => {
        setFieldValues({
            ...fieldValues,
            [fieldId]: value
        });
    };

    const handleCreateIssue = async () => {
        setFlowState('creating');
        setIsLoading(true);

        try {
            const response = await fetch('/api/create-issue-with-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo: selectedRepo,
                    title: issueData.title,
                    body: issueData.body,
                    labels: issueData.labels || [],
                    assignees: assignees,
                    project_id: selectedProject,
                    field_values: fieldValues
                })
            });

            const result = await response.json();

            if (result.success) {
                setCreatedIssueUrl(result.issue_url);
                setFlowState('completed');
                setMessages([...messages, {
                    role: 'assistant',
                    content: `✓ Issue #${result.issue_number} created successfully!${selectedProject ? ' Added to project.' : ''}`
                }]);
            } else {
                setFlowState('editing_fields');
                setMessages([...messages, {
                    role: 'assistant',
                    content: `Error creating issue: ${result.error}\n\nWould you like to try again?`
                }]);
            }
        } catch (error) {
            setFlowState('editing_fields');
            setMessages([...messages, {
                role: 'assistant',
                content: 'Error creating issue. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipProject = async () => {
        setSelectedProject('');
        setFieldValues({});
        await handleCreateIssue();
    };

    return {
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
    };
}
