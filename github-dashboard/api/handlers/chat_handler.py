from typing import Dict, Any

from services.ai_service import chat_issue_creation


def handle_chat_issue(request_data: Dict[str, Any]) -> Dict[str, Any]:
    conversation_history = request_data.get('conversation_history', [])
    user_message = request_data.get('message', '').strip()
    current_preview_data = request_data.get('current_preview_data', None)

    if not user_message:
        return {
            "status": "error",
            "message": "Please provide a message."
        }

    response = chat_issue_creation(conversation_history, user_message, current_preview_data)
    return response
