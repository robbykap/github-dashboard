# GitHub Dashboard

**An AI-Powered GitHub Intelligence Platform**

A full-stack developer productivity tool that leverages Large Language Models to transform how developers interact with GitHub issues, pull requests, and project management workflows.

---

## Overview

GitHub Dashboard is an intelligent GitHub management platform that combines conversational AI with real-time collaboration tools. Built with a modern Python backend and React frontend, it delivers enterprise-grade features including AI-assisted issue creation, automated code summarization, and smart priority ranking—all through an intuitive, developer-first interface.

---

## Key Features

### Conversational Issue Creation
Transform natural language into structured GitHub issues through an intelligent chat interface. The system employs OpenAI's function calling capabilities to progressively build issue details while maintaining a natural conversation flow, complete with live preview updates.

### AI-Powered Summarization Engine
Automatically generates concise, actionable summaries for issues and pull requests. The summarization engine analyzes code diffs, file changes, and discussion context to surface the most relevant information, reducing review time and improving team velocity.

### Intelligent Priority Ranking
Machine learning-driven prioritization that automatically ranks issues based on severity, security implications, and business impact. The system applies a weighted scoring model (bugs > security > features > documentation) to surface critical items first.

### GitHub Projects v2 Integration
Deep integration with GitHub's GraphQL API enables seamless project board management. Supports dynamic field introspection, custom field assignment, and automated issue-to-project linking—bringing modern project management directly into the workflow.

### Personal Activity Dashboard
A unified view of your GitHub footprint across all repositories. Track open pull requests, pending issues, and collaboration metrics with intelligent filtering that excludes drafts, archived repos, and stale items.

---

## Technical Architecture

### Backend Services
- **Python 3** HTTP server with modular request routing
- **RESTful API** design with dedicated handlers per feature domain
- **OpenAI GPT-4o-mini** integration for all AI-powered features
- **GitHub REST & GraphQL API** dual-protocol support
- **JSON-based caching layer** for optimized API consumption

### Frontend Application
- **React 18** with functional components and custom hooks
- **State machine pattern** for complex workflow management
- **Real-time preview system** with incremental updates
- **Markdown rendering** with XSS protection via DOMPurify
- **Zero build configuration** — runs directly in browser

### AI/ML Implementation
- **Tool-based orchestration** using OpenAI function calling
- **Hybrid readiness detection** combining keyword matching with LLM fallback
- **Structured output parsing** for reliable JSON extraction
- **Token budget management** for cost-optimized inference
- **Prompt engineering** with dedicated templates per feature

---

## Core Technologies

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3, OpenAI API, GitHub REST API, GitHub GraphQL API |
| **Frontend** | React 18, Babel, Marked.js, DOMPurify |
| **AI/ML** | GPT-4o-mini, Function Calling, Prompt Engineering |
| **Integration** | GitHub Projects v2, OAuth, Webhooks |

---

## System Design Highlights

**Modular Handler Architecture**
Clean separation of concerns with dedicated request handlers for each API domain, enabling independent testing and maintainability.

**Merge-Based State Updates**
Intelligent state management that merges incremental updates without data loss, preventing race conditions in real-time collaborative features.

**Fail-Safe AI Orchestration**
Graceful degradation with keyword-based fallbacks when AI services are unavailable, ensuring uninterrupted user experience.

**Dynamic Schema Introspection**
Runtime discovery of GitHub Project custom fields, enabling the UI to adapt to any project configuration without code changes.

---

## Getting Started

### Prerequisites
- Python 3.8+
- GitHub Personal Access Token
- OpenAI API Key

### Configuration
```bash
export GITHUB_API="your_github_token"
export OPENAI_API_KEY="your_openai_key"
export PORT=8080  # optional
```

### Launch
```bash
cd github-dashboard
python server.py
```

The application will automatically open in your default browser.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat-issue` | POST | Conversational issue creation |
| `/api/summarize` | POST | AI-powered issue/PR summarization |
| `/api/prioritize` | POST | Intelligent issue ranking |
| `/api/my-activity` | POST | Personal activity feed |
| `/api/create-issue` | POST | Direct issue creation |
| `/api/get-projects` | POST | GitHub Projects v2 discovery |
| `/api/get-project-fields` | POST | Dynamic field introspection |

---

## Project Structure

```
github-dashboard/
├── server.py                 # HTTP server entry point
├── api/
│   ├── routes.py            # Request routing dispatcher
│   └── handlers/            # Feature-specific handlers
├── services/
│   ├── ai_service.py        # OpenAI integration layer
│   └── github_api.py        # GitHub API wrapper
├── components/              # React UI components
│   ├── hooks/               # Custom React hooks
│   ├── issues/              # Issue/PR components
│   └── shared/              # Reusable components
├── prompts/                 # AI prompt templates
└── utils/                   # Shared utilities
```

---

## License

MIT License

---

*Built with a focus on developer experience, AI-first design principles, and production-ready architecture.*
