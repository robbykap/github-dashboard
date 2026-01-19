import os
from typing import Dict, Any


def handle_get_config(request_data: Dict[str, Any] = None) -> Dict[str, Any]:
    github_token = os.environ.get('GITHUB_API', '')
    return {
        'github_token': github_token
    }
