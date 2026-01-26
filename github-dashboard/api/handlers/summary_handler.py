import os
from typing import Dict, Any, List

from utils.cache import load_cache, save_cache
from utils.text import extract_mentioned_users
from services.github_api import fetch_pr_files
from services.ai_service import get_summary


def handle_summarize(request_data: Dict[str, Any]) -> Dict[str, Any]:
    issue_id = str(request_data.get('id', ''))
    cache = load_cache()

    if issue_id and issue_id in cache:
        return cache[issue_id]

    issue_title = request_data.get('title', '')
    issue_body = request_data.get('body', '')
    is_pr = request_data.get('is_pr', False)
    pr_url = request_data.get('pr_url', '')
    repo_full_name = request_data.get('repo', '')

    mentioned_users = extract_mentioned_users(issue_body)
    files: List[Dict[str, Any]] = []

    if is_pr and pr_url and repo_full_name:
        github_token = os.environ.get('GITHUB_API', '')
        files = fetch_pr_files(pr_url, repo_full_name, github_token)

    summary = get_summary(issue_title, issue_body, files, is_pr)

    response_data = {
        'summary': summary,
        'files': files,
        'mentioned_users': mentioned_users
    }

    if issue_id:
        cache[issue_id] = response_data
        save_cache(cache)

    return response_data
