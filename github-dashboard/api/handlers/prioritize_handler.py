from typing import Dict, Any

from services.ai_service import prioritize_issues


def handle_prioritize(request_data: Dict[str, Any]) -> Dict[str, Any]:
    issues = request_data.get('issues', [])
    priorities = prioritize_issues(issues)
    return {'priorities': priorities}
