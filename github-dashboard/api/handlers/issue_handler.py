import os
from typing import Dict, Any

from services.github_api import (
    create_issue,
    get_repository_projects,
    get_project_fields,
    add_issue_to_project_with_fields
)


def handle_create_issue(request_data: Dict[str, Any]) -> Dict[str, Any]:
    repo = request_data.get('repo', '')
    title = request_data.get('title', '')
    body = request_data.get('body', '')
    labels = request_data.get('labels', [])
    assignees = request_data.get('assignees', [])

    github_token = os.environ.get('GITHUB_API', '')
    result = create_issue(repo, title, body, labels, github_token, assignees)
    return result


def handle_get_projects(request_data: Dict[str, Any]) -> Dict[str, Any]:
    repo = request_data.get('repo', '')

    github_token = os.environ.get('GITHUB_API', '')
    result = get_repository_projects(repo, github_token)
    return result


def handle_get_project_fields(request_data: Dict[str, Any]) -> Dict[str, Any]:
    project_id = request_data.get('project_id', '')

    github_token = os.environ.get('GITHUB_API', '')
    result = get_project_fields(project_id, github_token)
    return result


def handle_create_issue_with_project(request_data: Dict[str, Any]) -> Dict[str, Any]:
    repo = request_data.get('repo', '')
    title = request_data.get('title', '')
    body = request_data.get('body', '')
    labels = request_data.get('labels', [])
    assignees = request_data.get('assignees', [])
    project_id = request_data.get('project_id', '')
    field_values = request_data.get('field_values', {})

    github_token = os.environ.get('GITHUB_API', '')

    issue_result = create_issue(repo, title, body, labels, github_token, assignees)

    if not issue_result['success']:
        return issue_result

    issue_number = issue_result['issue_number']

    if project_id:
        project_result = add_issue_to_project_with_fields(
            repo,
            issue_number,
            project_id,
            field_values,
            github_token
        )

        if not project_result['success']:
            issue_result['project_warning'] = project_result.get('error', 'Failed to add to project')

    return issue_result
