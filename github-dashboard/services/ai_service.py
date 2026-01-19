import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from openai import OpenAI

from utils.text import sanitize_chat_message, detect_structured_content_leakage, get_conversational_fallback
from config.constants import (
    SUMMARY_MAX_TOKENS,
    ISSUE_MAX_TOKENS,
    PRIORITIZE_MAX_TOKENS,
    EXTRACT_DETAILS_MAX_TOKENS,
    CHAT_MAX_TOKENS,
    MAX_ISSUES_TO_PRIORITIZE
)

def llm_detect_readiness(text: str, api_key: str) -> bool:
    """
    Uses a very small LLM call to detect whether the user intends
    to create the GitHub issue now.
    """
    if not text or not text.strip():
        return False

    # Quick keyword check first (fast path - catches 90% of cases)
    ready_keywords = [
        "create the ticket",
        "make the ticket",
        "create the issue",
        "make the issue",
        "generate the ticket",
        "generate the issue",
        "i'm ready",
        "im ready",
        "ready to create",
        "looks good",
        "that's enough",
        "thats enough",
        "good enough",
        "let's create",
        "lets create"
    ]

    text_lower = text.lower()
    for keyword in ready_keywords:
        if keyword in text_lower:
            print(f"[READINESS_DETECTED] Keyword match: '{keyword}'")
            return True

    # If no keyword match, use LLM as fallback
    prompt = f"""Does the user want to create/finalize the GitHub issue NOW?

User message: "{text}"

Common signals:
- Direct: "create it", "make the ticket", "I'm ready"
- Implicit: "looks good", "that's enough", repeated "I'll decide later"
- Dismissive: "no", "later", "skip" (when asked for more details)

Answer ONLY: yes or no"""

    try:
        response = _call_openai_chat(
            [{"role": "user", "content": prompt}],
            max_tokens=10,  # Increased from 5 for better detection
            api_key=api_key
        )
        is_ready = response.strip().lower().startswith("yes")
        if is_ready:
            print(f"[READINESS_DETECTED] LLM detected: {response.strip()}")
        return is_ready
    except Exception:
        # Fail open for common ready phrases
        is_ready = any(phrase in text_lower for phrase in ["ready", "create", "make"])
        if is_ready:
            print(f"[READINESS_DETECTED] Fallback match")
        return is_ready



def _load_prompt(name: str) -> str:
    """Load a prompt template from the prompts directory."""
    prompt_path = Path(__file__).parent.parent / 'prompts' / f'{name}.md'
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()


def summarize_pull_request(
    title: str,
    body: str,
    files: List[Dict[str, Any]],
    api_key: str
) -> Dict[str, str]:
    files_text = "\n".join([
        f"- {f['filename']} ({f['status']}): +{f['additions']}/-{f['deletions']}"
        for f in files
    ])

    prompt = _load_prompt('summarize_pr').format(
        title=title,
        body=body,
        file_count=len(files),
        files_text=files_text
    )
    return _call_openai(prompt, max_tokens=SUMMARY_MAX_TOKENS, api_key=api_key)


def summarize_issue(title: str, body: str, api_key: str) -> Dict[str, str]:
    prompt = _load_prompt('summarize_issue').format(title=title, body=body)
    return _call_openai(prompt, max_tokens=ISSUE_MAX_TOKENS, api_key=api_key)


def get_summary(
    title: str,
    body: str,
    files: Optional[List[Dict[str, Any]]] = None,
    is_pr: bool = False
) -> Dict[str, str]:
    api_key = os.environ.get('OPENAI_API_KEY', '')

    try:
        if is_pr and files:
            return summarize_pull_request(title, body, files, api_key)
        else:
            return summarize_issue(title, body, api_key)
    except Exception as e:
        if is_pr:
            return {"summary": f"Summary unavailable: {str(e)}", "code_updates": ""}
        else:
            return {"issue_type": "unknown", "summary": f"Summary unavailable: {str(e)}"}


def prioritize_issues(issues: List[Dict[str, Any]]) -> List[int]:
    api_key = os.environ.get('OPENAI_API_KEY', '')

    issues_text = "\n".join([
        f"ID:{issue['id']} - {issue['title']}"
        for issue in issues[:MAX_ISSUES_TO_PRIORITIZE]
    ])

    prompt = _load_prompt('prioritize_issues').format(issues_text=issues_text)

    try:
        result = _call_openai(prompt, max_tokens=PRIORITIZE_MAX_TOKENS, api_key=api_key)
        return result if isinstance(result, list) else [issue['id'] for issue in issues]
    except Exception:
        return [issue['id'] for issue in issues]


def extract_issue_details_from_conversation(messages: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """
    Extract issue details from conversation history using AI.
    Used as fallback when AI doesn't explicitly update preview.
    """
    api_key = os.environ.get('OPENAI_API_KEY', '')

    # Get last few messages for context - use more messages for better context
    recent_messages = messages[-10:] if len(messages) > 10 else messages

    conversation_text = "\n".join([
        f"{msg['role']}: {msg['content']}"
        for msg in recent_messages
        if msg.get('content')
    ])

    prompt = _load_prompt('extract_issue_details').format(conversation_text=conversation_text)

    try:
        result = _call_openai(prompt, max_tokens=EXTRACT_DETAILS_MAX_TOKENS, api_key=api_key)
        if isinstance(result, dict):
            # Filter out null values and empty strings
            return {k: v for k, v in result.items() if v is not None and v != "" and v != []}
        return None
    except Exception as e:
        print(f"Error extracting issue details: {e}")
        return None


def chat_issue_creation(
    conversation_history: List[Dict[str, str]],
    user_message: str,
    current_preview_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    api_key = os.environ.get('OPENAI_API_KEY', '')
    system_prompt = _load_prompt('chat_issue_creation')

    is_ready = llm_detect_readiness(user_message, api_key)

    tools = [
        {
            "type": "function",
            "function": {
                "name": "update_preview",
                "description": "Update the live issue preview.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "issue_type": {
                            "type": "string",
                            "enum": ["bug", "feature", "enhancement", "documentation", "question"]
                        },
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                        "labels": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["low", "medium", "high", "critical"]
                        }
                    },
                    "required": ["title", "body"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "signal_issue_ready",
                "description": "Signal that the issue is ready to be created.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "issue_type": {
                            "type": "string",
                            "enum": ["bug", "feature", "enhancement", "documentation", "question"]
                        },
                        "title": {"type": "string"},
                        "body": {"type": "string"},
                        "labels": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["low", "medium", "high", "critical"]
                        }
                    },
                    "required": ["issue_type", "title", "body", "labels"]
                }
            }
        }
    ]

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    # 🔑 CRITICAL FIX: never force preview once user is ready
    response = _call_openai_chat_with_tools(
        messages,
        tools,
        max_tokens=CHAT_MAX_TOKENS,
        api_key=api_key,
        is_ready=is_ready
    )

    # Initialize preview_data with current data if available (for merging)
    preview_data = current_preview_data.copy() if current_preview_data else {}

    # --- TOOL HANDLING ---
    if response.get("tool_calls"):
        for tool_call in response["tool_calls"]:
            func = tool_call["function"]["name"]
            args = json.loads(tool_call["function"]["arguments"])

            # 🚨 TERMINAL STATE — HARD RETURN
            if func == "signal_issue_ready":
                return {
                    "status": "ready",
                    "issue_data": args
                }

            if func == "update_preview":
                # 🔑 CRITICAL: Merge new data with existing data to preserve fields
                # Only update fields that have meaningful values
                for key, value in args.items():
                    # Update if value is truthy OR if replacing None/empty with something
                    if value or (value == [] and key not in preview_data):
                        preview_data[key] = value
                    # Keep existing value if new value is None/empty and we have existing data
                    elif key not in preview_data:
                        preview_data[key] = value

                print(f"[PREVIEW_MERGE] Updated fields: {list(args.keys())}")
                print(f"[PREVIEW_STATE] Current preview keys: {list(preview_data.keys())}")

    # --- PREVIEW FALLBACK (ONLY IF NOT READY) ---
    if not preview_data and not is_ready:
        extracted = extract_issue_details_from_conversation(messages)
        preview_data = extracted or {
            "title": "",
            "body": "",
            "issue_type": None,
            "labels": [],
            "priority": None
        }

    # --- CONVERSATIONAL CONTENT ---
    message_content = response.get("content", "").strip()

    if message_content:
        sanitized = sanitize_chat_message(message_content, preview_data)
        if sanitized:
            message_content = sanitized
        else:
            message_content = get_conversational_fallback(preview_data)

    # 🚨 CRITICAL FIX: NO SECOND CALL IF READY
    if not message_content and not is_ready:
        conversation_prompt = f"""
Provide a natural conversational follow-up to help refine a GitHub issue.

Current title: {preview_data.get('title')}
Last user message: {user_message}

Respond conversationally only. No questions if the user appears finished.
"""
        try:
            message_content = _call_openai_chat(
                [{"role": "user", "content": conversation_prompt}],
                max_tokens=120,
                api_key=api_key
            )
        except Exception:
            message_content = "Let me know if you'd like to adjust anything."

    # --- FINAL RETURN ---
    return {
        "status": "continue",
        "message": message_content,
        "preview_data": preview_data,
        "tool_calls": response.get("tool_calls", [])
    }


def _call_openai(prompt: str, max_tokens: int, api_key: str) -> Any:
    messages = [{"role": "user", "content": prompt}]
    content = _call_openai_chat(messages, max_tokens, api_key)
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return content


def _call_openai_chat(messages: List[Dict[str, str]], max_tokens: int, api_key: str) -> str:
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=max_tokens,
        messages=messages
    )
    return response.choices[0].message.content


def _call_openai_chat_with_tools(
    messages: List[Dict[str, str]],
    tools: List[Dict],
    max_tokens: int,
    api_key: str,
    is_ready: bool = False
) -> Dict[str, Any]:
    client = OpenAI(api_key=api_key)

    # Determine tool_choice strategy
    if is_ready:
        # Force the AI to call update_preview specifically
        # This ensures the live preview always updates
        tool_choice_param = {"type": "function", "function": {"name": "signal_issue_ready"}}
    else:
        # Let AI choose which tool to call (or none)
        tool_choice_param = {"type": "function", "function": {"name": "update_preview"}}

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=max_tokens,
        messages=messages,
        tools=tools,
        tool_choice=tool_choice_param,
        parallel_tool_calls=False  # Disable to ensure text content is included with tool calls
    )

    message = response.choices[0].message
    result = {
        'content': message.content or '',
        'tool_calls': []
    }

    if message.tool_calls:
        for tool_call in message.tool_calls:
            result['tool_calls'].append({
                'id': tool_call.id,
                'type': 'function',
                'function': {
                    'name': tool_call.function.name,
                    'arguments': tool_call.function.arguments
                }
            })

    return result
