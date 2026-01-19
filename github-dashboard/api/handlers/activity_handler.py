from typing import Dict, Any

from services.github_api import fetch_my_activity


def handle_my_activity(request_data: Dict[str, Any]) -> Dict[str, Any]:
    token = request_data.get('token', '')
    items = fetch_my_activity(token)
    return {'items': items}
