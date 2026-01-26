from api.handlers.summary_handler import handle_summarize
from api.handlers.activity_handler import handle_my_activity
from api.handlers.issue_handler import (
    handle_create_issue,
    handle_create_issue_with_project,
    handle_get_projects,
    handle_get_project_fields
)
from api.handlers.chat_handler import handle_chat_issue
from api.handlers.prioritize_handler import handle_prioritize
from api.handlers.config_handler import handle_get_config


ROUTE_MAP = {
    '/api/config': handle_get_config,
    '/api/summarize': handle_summarize,
    '/api/prioritize': handle_prioritize,
    '/api/my-activity': handle_my_activity,
    '/api/chat-issue': handle_chat_issue,
    '/api/create-issue': handle_create_issue,
    '/api/get-projects': handle_get_projects,
    '/api/get-project-fields': handle_get_project_fields,
    '/api/create-issue-with-project': handle_create_issue_with_project
}


def get_route_handler(path: str):
    return ROUTE_MAP.get(path)
