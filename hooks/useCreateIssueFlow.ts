'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, IssuePreviewData, FlowState } from '@/types/ai';
import type { GitHubProjectV2Field } from '@/types/github';

interface UseCreateIssueFlowOptions {
  selectedRepo: string | null;
}

interface UseCreateIssueFlowReturn {
  flowState: FlowState;
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  issueData: IssuePreviewData | null;
  livePreviewData: IssuePreviewData | null;
  configExpanded: boolean;
  projects: Array<{ id: string; title: string }>;
  selectedProject: string;
  projectFields: GitHubProjectV2Field[];
  fieldValues: Record<string, string | number>;
  assignees: string[];
  createdIssueUrl: string;
  setInputValue: (value: string) => void;
  setConfigExpanded: (expanded: boolean) => void;
  setAssignees: (assignees: string[]) => void;
  handleSendMessage: () => Promise<void>;
  handleApprovePreview: () => void;
  handleRejectPreview: () => void;
  handleProjectSelect: (projectId: string) => Promise<void>;
  handleFieldChange: (fieldId: string, value: string | number) => void;
  handleCreateIssue: () => Promise<void>;
  handleSkipProject: () => Promise<void>;
  startNewConversation: () => void;
}

export default function useCreateIssueFlow({
  selectedRepo,
}: UseCreateIssueFlowOptions): UseCreateIssueFlowReturn {
  const [flowState, setFlowState] = useState<FlowState>('chatting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [issueData, setIssueData] = useState<IssuePreviewData | null>(null);
  const [livePreviewData, setLivePreviewData] = useState<IssuePreviewData | null>(null);
  const [configExpanded, setConfigExpanded] = useState(true);
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectFields, setProjectFields] = useState<GitHubProjectV2Field[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});
  const [assignees, setAssignees] = useState<string[]>([]);
  const [createdIssueUrl, setCreatedIssueUrl] = useState('');

  useEffect(() => {
    if (selectedRepo) {
      startNewConversation();
    }
  }, [selectedRepo]);

  const startNewConversation = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          "Hi! I'll help you create a GitHub issue. What would you like to report or request?",
      },
    ]);
    setConversationHistory([]);
    setFlowState('chatting');
    setIssueData(null);
    setLivePreviewData(null);
    setCreatedIssueUrl('');
    setInputValue('');
    setProjects([]);
    setSelectedProject('');
    setProjectFields([]);
    setFieldValues({});
    setAssignees([]);
    setConfigExpanded(true);
  }, []);

  const fetchProjects = async () => {
    if (!selectedRepo) return;

    try {
      const res = await fetch('/api/github/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: selectedRepo }),
      });

      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = inputValue.trim();

    if (!trimmedMessage || isLoading || !selectedRepo) {
      return;
    }

    const userMessage = trimmedMessage;
    setInputValue('');

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_history: conversationHistory,
          message: userMessage,
          current_preview_data: livePreviewData,
        }),
      });

      const data = await res.json();

      if (data.status === 'ready') {
        setIssueData(data.issue_data);
        setFlowState('editing_fields');
        setConfigExpanded(true);

        const assistantMessage =
          "Great! I've prepared the issue. You can review it in the preview and configure project settings below.";

        setMessages([
          ...newMessages,
          { role: 'assistant', content: assistantMessage },
        ]);

        setConversationHistory([
          ...conversationHistory,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantMessage },
        ]);

        await fetchProjects();
      } else if (data.status === 'continue') {
        setLivePreviewData(
          data.preview_data ||
            livePreviewData || {
              title: '',
              body: '',
              labels: [],
              issue_type: null,
              priority: null,
            }
        );

        const assistantMessage = data.message || "I'm thinking...";

        setMessages([
          ...newMessages,
          { role: 'assistant', content: assistantMessage },
        ]);

        setConversationHistory([
          ...conversationHistory,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantMessage },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content:
              data.message || 'Sorry, there was an error processing your request.',
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, there was an error communicating with the server.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePreview = () => {
    setFlowState('editing_fields');
    setConfigExpanded(true);
  };

  const handleRejectPreview = () => {
    setFlowState('chatting');
    setIssueData(null);

    const assistantMessage = 'What changes would you like to make to the issue?';
    setMessages([...messages, { role: 'assistant', content: assistantMessage }]);
    setConversationHistory([
      ...conversationHistory,
      { role: 'assistant', content: assistantMessage },
    ]);
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProject(projectId);
    setProjectFields([]);
    setFieldValues({});

    if (!projectId) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/github/project-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await res.json();
      if (data.success) {
        setProjectFields(data.fields || []);
      }
    } catch (error) {
      console.error('Error fetching project fields:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string | number) => {
    setFieldValues({
      ...fieldValues,
      [fieldId]: value,
    });
  };

  const handleCreateIssue = async () => {
    if (!selectedRepo || !issueData) return;

    setFlowState('creating');
    setIsLoading(true);

    try {
      const res = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: selectedRepo,
          title: issueData.title,
          body: issueData.body,
          labels: issueData.labels || [],
          assignees: assignees,
          project_id: selectedProject || undefined,
          field_values: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setCreatedIssueUrl(result.issue_url);
        setFlowState('completed');
        setMessages([
          ...messages,
          {
            role: 'assistant',
            content: `Issue #${result.issue_number} created successfully!${
              selectedProject ? ' Added to project.' : ''
            }`,
          },
        ]);
      } else {
        setFlowState('editing_fields');
        setMessages([
          ...messages,
          {
            role: 'assistant',
            content: `Error creating issue: ${result.error}\n\nWould you like to try again?`,
          },
        ]);
      }
    } catch (error) {
      console.error('Create issue error:', error);
      setFlowState('editing_fields');
      setMessages([
        ...messages,
        {
          role: 'assistant',
          content: 'Error creating issue. Please try again.',
        },
      ]);
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
    startNewConversation,
  };
}
