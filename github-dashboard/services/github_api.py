import json
import urllib.request
import urllib.error
from typing import Dict, List, Any

from config.constants import MAX_PR_FILES, MAX_PATCH_SIZE


def fetch_pr_files(pr_url: str, repo_full_name: str, github_token: str) -> List[Dict[str, Any]]:
    try:
        # Extract PR number from URL or use pr_url as API endpoint
        if 'pull/' in pr_url:
            pr_number = pr_url.split('pull/')[-1].split('/')[0].split('#')[0]
            api_url = f'https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}/files'
        else:
            # Assume pr_url is already the API URL
            api_url = pr_url

        req = urllib.request.Request(
            api_url,
            headers={'Authorization': f'token {github_token}'}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            files_data = json.loads(response.read().decode('utf-8'))

            # Extract relevant file information
            files = []
            for file in files_data[:MAX_PR_FILES]:
                files.append({
                    'filename': file.get('filename', ''),
                    'status': file.get('status', ''),
                    'additions': file.get('additions', 0),
                    'deletions': file.get('deletions', 0),
                    'changes': file.get('changes', 0),
                    'patch': file.get('patch', '')[:MAX_PATCH_SIZE]
                })
            return files
    except Exception as e:
        print(f"Error fetching PR files: {e}")
        return []


def fetch_my_activity(token: str) -> List[Dict[str, Any]]:
    try:
        # First, get the authenticated user's username
        print("\n" + "="*60)
        print("FETCHING MY ACTIVITY")
        print("="*60)

        user_req = urllib.request.Request(
            'https://api.github.com/user',
            headers={'Authorization': f'token {token}'}
        )
        with urllib.request.urlopen(user_req, timeout=10) as response:
            user_data = json.loads(response.read().decode('utf-8'))
            username = user_data.get('login', '')
            print(f"Authenticated user: {username}")

        if not username:
            print("ERROR: Could not get username")
            return []

        # Fetch user's issues (includes PRs)
        # Use search API to get issues created by user
        search_url = f'https://api.github.com/search/issues?q=author:{username}+is:open&per_page=100&sort=updated'
        print(f"Search URL: {search_url}")

        req = urllib.request.Request(
            search_url,
            headers={'Authorization': f'token {token}'}
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            search_data = json.loads(response.read().decode('utf-8'))
            items = search_data.get('items', [])
            total_count = search_data.get('total_count', 0)

            print(f"\nTotal items found: {total_count}")
            print(f"Items returned: {len(items)}")

            if len(items) == 0:
                print("\nNO ISSUES OR PRS FOUND!")
                print("This could mean:")
                print("  1. You have no open issues/PRs authored by you")
                print("  2. Your GitHub token doesn't have 'repo' scope")
                print("  3. The token is invalid or expired")
                print("\nTo fix: Go to https://github.com/settings/tokens")
                print("  - Create a new token with 'repo' scope")
                print("  - Update your GITHUB_API environment variable")
            else:
                print("\n" + "-"*60)
                print("ISSUES AND PRS:")
                print("-"*60)

            # Add repository info to each item
            for item in items:
                is_pr = 'pull_request' in item
                item_type = "PR" if is_pr else "Issue"

                # Extract repo info from repository_url
                if 'repository_url' in item:
                    repo_url = item['repository_url']
                    parts = repo_url.split('/')
                    item['repository'] = {
                        'name': parts[-1],
                        'full_name': f"{parts[-2]}/{parts[-1]}",
                        'owner': {'login': parts[-2]}
                    }

                    print(f"\n[{item_type}] {item['repository']['full_name']}#{item['number']}")
                    print(f"  Title: {item['title']}")
                    print(f"  URL: {item['html_url']}")

            print("\n" + "="*60 + "\n")
            return items

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"\nHTTP Error fetching my activity: {e.code}")
        print(f"Error details: {error_body}")
        return []
    except Exception as e:
        print(f"\nError fetching my activity: {e}")
        import traceback
        traceback.print_exc()
        return []


def create_issue(
    repo_full_name: str,
    title: str,
    body: str,
    labels: List[str],
    github_token: str,
    assignees: List[str] = None
) -> Dict[str, Any]:
    try:
        api_url = f'https://api.github.com/repos/{repo_full_name}/issues'

        issue_data = {
            'title': title,
            'body': body,
            'labels': labels
        }

        if assignees:
            issue_data['assignees'] = assignees

        request_body = json.dumps(issue_data).encode('utf-8')

        req = urllib.request.Request(
            api_url,
            data=request_body,
            headers={
                'Authorization': f'token {github_token}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return {
                'success': True,
                'issue_url': result.get('html_url', ''),
                'issue_number': result.get('number', 0),
                'issue_data': result
            }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"HTTP Error creating issue: {e.code}")
        print(f"Error details: {error_body}")
        return {
            'success': False,
            'error': f"HTTP {e.code}: {error_body}"
        }
    except Exception as e:
        print(f"Error creating issue: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def execute_graphql_query(query: str, variables: Dict[str, Any], github_token: str) -> Dict[str, Any]:
    """Execute a GraphQL query against GitHub's API"""
    try:
        request_body = json.dumps({
            'query': query,
            'variables': variables
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.github.com/graphql',
            data=request_body,
            headers={
                'Authorization': f'Bearer {github_token}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))

            if 'errors' in result:
                return {
                    'success': False,
                    'errors': result['errors']
                }

            return {
                'success': True,
                'data': result.get('data', {})
            }

    except Exception as e:
        print(f"Error executing GraphQL query: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_repository_projects(repo_full_name: str, github_token: str) -> Dict[str, Any]:
    """Get all Projects v2 for a repository"""
    owner, repo = repo_full_name.split('/')

    query = """
    query ListRepositoryProjects($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            id
            title
            number
            shortDescription
          }
        }
      }
    }
    """

    variables = {'owner': owner, 'repo': repo}
    result = execute_graphql_query(query, variables, github_token)

    if result['success']:
        projects = result['data'].get('repository', {}).get('projectsV2', {}).get('nodes', [])
        return {
            'success': True,
            'projects': projects
        }

    return result


def get_project_fields(project_id: str, github_token: str) -> Dict[str, Any]:
    """Get all custom fields for a project"""
    query = """
    query GetProjectFields($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field {
                id
                name
                dataType
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType
                options {
                  id
                  name
                }
              }
              ... on ProjectV2IterationField {
                id
                name
                dataType
                configuration {
                  iterations {
                    id
                    title
                    startDate
                    duration
                  }
                }
              }
            }
          }
        }
      }
    }
    """

    variables = {'projectId': project_id}
    result = execute_graphql_query(query, variables, github_token)

    if result['success']:
        fields = result['data'].get('node', {}).get('fields', {}).get('nodes', [])
        return {
            'success': True,
            'fields': fields
        }

    return result


def format_field_value(value: Any) -> Dict[str, Any]:
    """Format field value for GraphQL mutation"""
    if isinstance(value, str):
        # Check if it's a single select option ID (starts with specific prefix)
        if value.startswith('PVTSSOO_') or value.startswith('PVTIO_'):
            return {'singleSelectOptionId': value}
        # Check if it's a date format (YYYY-MM-DD)
        elif '-' in value and len(value) == 10:
            try:
                # Validate it's a date
                parts = value.split('-')
                if len(parts) == 3 and all(p.isdigit() for p in parts):
                    return {'date': value}
            except:
                pass
        # Otherwise treat as text
        return {'text': value}
    elif isinstance(value, (int, float)):
        return {'number': float(value)}
    else:
        return {'text': str(value)}


def add_issue_to_project_with_fields(
    repo_full_name: str,
    issue_number: int,
    project_id: str,
    field_values: Dict[str, Any],
    github_token: str
) -> Dict[str, Any]:
    """Add an issue to a project and set custom field values"""
    try:
        # First, get the issue's node ID
        api_url = f'https://api.github.com/repos/{repo_full_name}/issues/{issue_number}'
        req = urllib.request.Request(
            api_url,
            headers={'Authorization': f'token {github_token}'}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            issue_data = json.loads(response.read().decode('utf-8'))
            issue_node_id = issue_data.get('node_id')

        if not issue_node_id:
            return {
                'success': False,
                'error': 'Could not get issue node ID'
            }

        # Add issue to project
        add_mutation = """
        mutation AddIssueToProject($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: {
            projectId: $projectId
            contentId: $contentId
          }) {
            item {
              id
            }
          }
        }
        """

        add_result = execute_graphql_query(
            add_mutation,
            {'projectId': project_id, 'contentId': issue_node_id},
            github_token
        )

        if not add_result['success']:
            return add_result

        item_id = add_result['data']['addProjectV2ItemById']['item']['id']

        # Update field values
        update_mutation = """
        mutation UpdateProjectField(
          $projectId: ID!
          $itemId: ID!
          $fieldId: ID!
          $value: ProjectV2FieldValue!
        ) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: $value
          }) {
            projectV2Item {
              id
            }
          }
        }
        """

        for field_id, value in field_values.items():
            # Format value based on field type
            formatted_value = format_field_value(value)

            update_result = execute_graphql_query(
                update_mutation,
                {
                    'projectId': project_id,
                    'itemId': item_id,
                    'fieldId': field_id,
                    'value': formatted_value
                },
                github_token
            )

            if not update_result['success']:
                print(f"Warning: Failed to update field {field_id}: {update_result}")

        return {
            'success': True,
            'item_id': item_id
        }

    except Exception as e:
        print(f"Error adding issue to project: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }
