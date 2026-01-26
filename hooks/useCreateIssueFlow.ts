/**
 * Issue Creation Flow Hook
 *
 * This hook manages the state machine for conversational issue creation.
 * Users chat with an AI assistant to describe their issue, and the AI
 * progressively builds a structured issue that can be created on GitHub.
 *
 * Flow States:
 * 1. chatting - User is describing the issue in conversation
 * 2. editing_fields - Issue is ready, user configures project/assignees
 * 3. creating - API call in progress to create the issue
 * 4. completed - Issue created successfully
 *
 * Related files:
 * - services/ai-service.ts: AI logic for chat and issue extraction
 * - components/chat/ChatInterface.tsx: UI that uses this hook
 * - components/preview/LiveIssuePreview.tsx: Preview panel
 * - types/ai.ts: Type definitions (ChatMessage, IssuePreviewData, FlowState)
 *
 * @see docs/ARCHITECTURE.md for system overview
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, IssuePreviewData, FlowState } from '@/types/ai';
import type { GitHubProjectV2Field } from '@/types/github';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Options passed to the hook
 */
interface UseCreateIssueFlowOptions {
  /** The currently selected repository (format: "owner/repo") */
  selectedRepo: string | null;
}

/**
 * Everything returned by the hook for components to use
 */
interface UseCreateIssueFlowReturn {
  // State
  /** Current flow state (chatting, editing_fields, creating, completed) */
  flowState: FlowState;
  /** All messages in the conversation (for display) */
  messages: ChatMessage[];
  /** Current value of the input field */
  inputValue: string;
  /** Whether an API call is in progress */
  isLoading: boolean;
  /** Ref to scroll to bottom of messages */
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  /** Final issue data (when ready to create) */
  issueData: IssuePreviewData | null;
  /** Live preview data (updates as user chats) */
  livePreviewData: IssuePreviewData | null;
  /** Whether the config panel is expanded */
  configExpanded: boolean;

  // GitHub Projects v2 data
  /** Available projects for the repository */
  projects: Array<{ id: string; title: string }>;
  /** Currently selected project ID */
  selectedProject: string;
  /** Custom fields for the selected project */
  projectFields: GitHubProjectV2Field[];
  /** Current values for project custom fields */
  fieldValues: Record<string, string | number>;
  /** Selected assignees for the issue */
  assignees: string[];

  // Result
  /** URL of the created issue (after completion) */
  createdIssueUrl: string;

  // Setters
  setInputValue: (value: string) => void;
  setConfigExpanded: (expanded: boolean) => void;
  setAssignees: (assignees: string[]) => void;

  // Handlers
  /** Send the current input as a message */
  handleSendMessage: () => Promise<void>;
  /** User approves the preview and moves to editing_fields */
  handleApprovePreview: () => void;
  /** User rejects the preview and goes back to chatting */
  handleRejectPreview: () => void;
  /** User selects a project (fetches project fields) */
  handleProjectSelect: (projectId: string) => Promise<void>;
  /** User changes a project field value */
  handleFieldChange: (fieldId: string, value: string | number) => void;
  /** Create the issue on GitHub */
  handleCreateIssue: () => Promise<void>;
  /** Skip project selection and create issue directly */
  handleSkipProject: () => Promise<void>;
  /** Reset everything for a new conversation */
  startNewConversation: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Main hook for managing the issue creation flow.
 *
 * @param options - Configuration including the selected repository
 * @returns All state and handlers needed by the UI
 */
export default function useCreateIssueFlow({
  selectedRepo,
}: UseCreateIssueFlowOptions): UseCreateIssueFlowReturn {
  // ---------------------------------------------------------------------------
  // FLOW STATE
  // ---------------------------------------------------------------------------
  // The main state machine: chatting → editing_fields → creating → completed

  /** Current state in the flow */
  const [flowState, setFlowState] = useState<FlowState>('chatting');

  // ---------------------------------------------------------------------------
  // CONVERSATION STATE
  // ---------------------------------------------------------------------------

  /** Messages shown in the UI (includes welcome message) */
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /** Conversation history sent to the API (excludes welcome message) */
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  /** Current input field value */
  const [inputValue, setInputValue] = useState('');

  /** Loading state for API calls */
  const [isLoading, setIsLoading] = useState(false);

  /** Ref for auto-scrolling to newest message */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // ISSUE DATA STATE
  // ---------------------------------------------------------------------------

  /** Final issue data (set when AI signals ready) */
  const [issueData, setIssueData] = useState<IssuePreviewData | null>(null);

  /** Live preview data (updates progressively during chat) */
  const [livePreviewData, setLivePreviewData] = useState<IssuePreviewData | null>(null);

  /** URL of created issue (set after successful creation) */
  const [createdIssueUrl, setCreatedIssueUrl] = useState('');

  // ---------------------------------------------------------------------------
  // PROJECT CONFIGURATION STATE
  // ---------------------------------------------------------------------------

  /** Whether the config panel is expanded */
  const [configExpanded, setConfigExpanded] = useState(true);

  /** Available GitHub Projects for this repo */
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);

  /** Currently selected project ID */
  const [selectedProject, setSelectedProject] = useState('');

  /** Custom fields for the selected project */
  const [projectFields, setProjectFields] = useState<GitHubProjectV2Field[]>([]);

  /** Values for project custom fields */
  const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});

  /** Selected assignees (GitHub usernames) */
  const [assignees, setAssignees] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * When repository changes, reset and start a new conversation.
   * This ensures we don't carry state from a previous repo.
   */
  useEffect(() => {
    if (selectedRepo) {
      startNewConversation();
    }
  }, [selectedRepo]);

  // ---------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ---------------------------------------------------------------------------

  /**
   * Reset all state and start a fresh conversation.
   * Called when repo changes or user wants to create another issue.
   */
  const startNewConversation = useCallback(() => {
    // Reset to welcome message
    setMessages([
      {
        role: 'assistant',
        content:
          "Hi! I'll help you create a GitHub issue. What would you like to report or request?",
      },
    ]);
    setConversationHistory([]);

    // Reset flow state
    setFlowState('chatting');
    setIssueData(null);
    setLivePreviewData(null);
    setCreatedIssueUrl('');
    setInputValue('');

    // Reset project config
    setProjects([]);
    setSelectedProject('');
    setProjectFields([]);
    setFieldValues({});
    setAssignees([]);
    setConfigExpanded(true);
  }, []);

  /**
   * Fetch available GitHub Projects for the selected repository.
   * Called when issue is ready to allow user to add to a project.
   */
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

  // ---------------------------------------------------------------------------
  // MESSAGE HANDLING
  // ---------------------------------------------------------------------------

  /**
   * Send the current input as a message to the AI.
   * This is the main interaction point during the 'chatting' phase.
   *
   * The response from /api/chat-issue can be:
   * - status: 'continue' - Keep chatting, update preview
   * - status: 'ready' - Issue is complete, move to editing_fields
   */
  const handleSendMessage = async () => {
    const trimmedMessage = inputValue.trim();

    // Validate before sending
    if (!trimmedMessage || isLoading || !selectedRepo) {
      return;
    }

    const userMessage = trimmedMessage;
    setInputValue('');

    // Optimistically add user message to UI
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Call the chat API
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

      // Handle 'ready' response: Issue is complete
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

        // Fetch projects for the configuration step
        await fetchProjects();
      }
      // Handle 'continue' response: Keep chatting
      else if (data.status === 'continue') {
        // Update live preview with any new data
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
      }
      // Handle error response
      else {
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

  // ---------------------------------------------------------------------------
  // PREVIEW HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * User approves the issue preview and moves to field editing.
   * This is called from the preview panel when user clicks "Approve".
   */
  const handleApprovePreview = () => {
    setFlowState('editing_fields');
    setConfigExpanded(true);
  };

  /**
   * User rejects the preview and goes back to chatting.
   * This allows them to provide more details or corrections.
   */
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

  // ---------------------------------------------------------------------------
  // PROJECT CONFIGURATION HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * User selects a GitHub Project.
   * This triggers fetching the project's custom fields for configuration.
   */
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

  /**
   * User changes a project custom field value.
   */
  const handleFieldChange = (fieldId: string, value: string | number) => {
    setFieldValues({
      ...fieldValues,
      [fieldId]: value,
    });
  };

  // ---------------------------------------------------------------------------
  // ISSUE CREATION
  // ---------------------------------------------------------------------------

  /**
   * Create the issue on GitHub.
   * This is called when user clicks "Create Issue" in the config panel.
   *
   * The API creates the issue and optionally:
   * - Adds it to a project
   * - Sets project custom field values
   * - Assigns users
   */
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
        // Success! Show completion message
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
        // Error creating issue - go back to editing
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

  /**
   * Skip project configuration and create the issue directly.
   * Useful when user doesn't want to add to a project.
   */
  const handleSkipProject = async () => {
    setSelectedProject('');
    setFieldValues({});
    await handleCreateIssue();
  };

  // ---------------------------------------------------------------------------
  // RETURN ALL STATE AND HANDLERS
  // ---------------------------------------------------------------------------

  return {
    // Flow state
    flowState,
    messages,
    inputValue,
    isLoading,
    messagesEndRef,

    // Issue data
    issueData,
    livePreviewData,
    createdIssueUrl,

    // Project configuration
    configExpanded,
    projects,
    selectedProject,
    projectFields,
    fieldValues,
    assignees,

    // Setters
    setInputValue,
    setConfigExpanded,
    setAssignees,

    // Handlers
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
