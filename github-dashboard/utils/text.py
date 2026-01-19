import re
from typing import List, Optional, Dict


def strip_markdown_code_blocks(text: str) -> str:
    pattern = r'```(?:html)?\s*(.*?)\s*```'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text.strip()


def extract_mentioned_users(text: Optional[str]) -> List[str]:
    if not text:
        return []

    mentions = re.findall(r'@([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})', text)

    seen = set()
    unique_mentions = []
    for mention in mentions:
        if mention not in seen:
            seen.add(mention)
            unique_mentions.append(mention)
    return unique_mentions


def sanitize_chat_message(message: str, preview_data: Optional[Dict] = None) -> Optional[str]:
    """
    Remove structured preview content that may have leaked into conversational messages.

    This function detects and removes common patterns where the AI includes
    preview content directly in chat messages instead of keeping messages conversational.

    Args:
        message: The AI's chat message to sanitize
        preview_data: Optional preview data to detect exact content leakage

    Returns:
        Sanitized message with structured content removed, or None if too much was removed
    """
    if not message or not message.strip():
        return message

    original_message = message

    # Pattern 1: Remove structured field patterns (e.g., "Issue Type: Feature Request")
    # Matches: "Field Name: Value" patterns common in structured data
    structured_fields = [
        r'Issue\s+Type\s*:\s*[^\n]+',
        r'Title\s*:\s*[^\n]+',
        r'Description\s*:\s*[^\n]+',
        r'Requirements\s*:\s*',
        r'Priority\s*:\s*[^\n]+',
        r'Labels\s*:\s*[^\n]+',
    ]

    for pattern in structured_fields:
        message = re.sub(pattern, '', message, flags=re.IGNORECASE)

    # Pattern 2: Remove bullet point sections that look like structured data
    # Matches multi-line bulleted lists that typically come from preview content
    message = re.sub(r'(?:^|\n)[\s]*[-*•]\s+[^\n]+(?:\n[\s]*[-*•]\s+[^\n]+){2,}', '', message, flags=re.MULTILINE)

    # Pattern 3: If preview_data exists, remove any exact matches of preview content
    if preview_data:
        if preview_data.get('title'):
            # Remove the exact title if it appears standalone
            title_escaped = re.escape(preview_data['title'])
            message = re.sub(rf'(?:^|\n)\s*{title_escaped}\s*(?:\n|$)', '\n', message)

        if preview_data.get('body'):
            # Remove large chunks of the body if they appear (first 200 chars as detection)
            body_preview = preview_data['body'][:200]
            if body_preview in message:
                # This indicates major content leakage - remove everything before conversational part
                parts = message.split(body_preview)
                if len(parts) > 1:
                    # Keep only the last part which should be conversational
                    message = parts[-1]

    # Pattern 4: Remove markdown headers that look like field names
    message = re.sub(r'#{1,3}\s*(Issue Type|Title|Description|Requirements|Priority)\s*\n', '', message, flags=re.IGNORECASE)

    # Clean up excessive whitespace/newlines left by removals
    message = re.sub(r'\n\s*\n\s*\n+', '\n\n', message)
    message = message.strip()

    # If we've removed too much (>80% of content), the message was mostly structured data
    # Return None to signal that fallback is needed
    if len(message) < len(original_message) * 0.2 and len(original_message) > 50:
        return None

    return message


def detect_structured_content_leakage(message: str) -> bool:
    """
    Detect if a message contains structured preview content instead of conversation.

    Returns True if the message appears to contain leaked preview content.
    """
    if not message:
        return False

    # Count how many structured field indicators appear
    structured_indicators = [
        r'Issue\s+Type\s*:',
        r'Title\s*:',
        r'Description\s*:',
        r'Requirements\s*:',
        r'Priority\s*:',
    ]

    matches = 0
    for pattern in structured_indicators:
        if re.search(pattern, message, re.IGNORECASE):
            matches += 1

    # If 2+ structured fields appear, it's likely leaked content
    return matches >= 2


def get_conversational_fallback(preview_data: Optional[Dict] = None) -> str:
    """
    Generate a safe, conversational fallback message when sanitization fails.
    """
    if preview_data and preview_data.get('title'):
        return "I've updated the preview with your issue details. How does it look?"
    else:
        return "Let me know what else you'd like to add to the issue."
