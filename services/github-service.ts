import 'server-only';

import { createOctokit, executeGraphQL, GRAPHQL_QUERIES } from '@/lib/github';
import type {
  GitHubRepository,
  GitHubIssue,
  GitHubPRFile,
  GitHubProjectV2,
  GitHubProjectV2Field,
  CreateIssueResponse,
  GetProjectsResponse,
  GetProjectFieldsResponse,
  ActivityItem,
} from '@/types/github';

const MAX_PR_FILES = 30;
const MAX_PATCH_SIZE = 2000;

// Get authenticated user
export async function getUser(accessToken: string) {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

// Get user's repositories
export async function getUserRepos(accessToken: string): Promise<GitHubRepository[]> {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: 'updated',
  });
  return data as GitHubRepository[];
}

// Get issues for a repository
export async function getRepositoryIssues(
  accessToken: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubIssue[]> {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: 100,
    sort: 'updated',
  });
  return data as GitHubIssue[];
}

// Get pull requests for a repository
export async function getRepositoryPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
) {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state,
    per_page: 100,
    sort: 'updated',
  });
  return data;
}

// Fetch PR files
export async function fetchPRFiles(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPRFile[]> {
  try {
    const octokit = createOctokit(accessToken);
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: MAX_PR_FILES,
    });

    return data.map((file) => ({
      filename: file.filename,
      status: file.status as GitHubPRFile['status'],
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch?.slice(0, MAX_PATCH_SIZE),
      sha: file.sha,
      blob_url: file.blob_url,
      raw_url: file.raw_url,
      contents_url: file.contents_url,
    }));
  } catch (error) {
    console.error('Error fetching PR files:', error);
    return [];
  }
}

// Get user's activity (issues and PRs authored by the user)
export async function fetchMyActivity(accessToken: string): Promise<ActivityItem[]> {
  try {
    const user = await getUser(accessToken);
    const username = user.login;

    if (!username) {
      console.error('Could not get username');
      return [];
    }

    const octokit = createOctokit(accessToken);
    const { data } = await octokit.search.issuesAndPullRequests({
      q: `author:${username} is:open`,
      per_page: 100,
      sort: 'updated',
    });

    // Add repository info and is_pr flag to each item
    return data.items.map((item) => {
      const isPR = 'pull_request' in item;
      let repository = undefined;

      if (item.repository_url) {
        const parts = item.repository_url.split('/');
        repository = {
          name: parts[parts.length - 1],
          full_name: `${parts[parts.length - 2]}/${parts[parts.length - 1]}`,
          owner: { login: parts[parts.length - 2] },
        };
      }

      return {
        ...(item as GitHubIssue),
        is_pr: isPR,
        repository,
      } as ActivityItem;
    });
  } catch (error) {
    console.error('Error fetching my activity:', error);
    return [];
  }
}

// Create a new issue
export async function createIssue(
  accessToken: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels?: string[],
  assignees?: string[]
): Promise<CreateIssueResponse> {
  try {
    const octokit = createOctokit(accessToken);
    const { data } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
      assignees,
    });

    return {
      success: true,
      issue_url: data.html_url,
      issue_number: data.number,
      issue_data: data as GitHubIssue,
    };
  } catch (error) {
    console.error('Error creating issue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get repository projects
export async function getRepositoryProjects(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GetProjectsResponse> {
  const result = await executeGraphQL<{
    repository: {
      projectsV2: {
        nodes: GitHubProjectV2[];
      };
    };
  }>(accessToken, GRAPHQL_QUERIES.LIST_REPOSITORY_PROJECTS, { owner, repo });

  if (result.success && result.data) {
    return {
      success: true,
      projects: result.data.repository?.projectsV2?.nodes || [],
    };
  }

  return {
    success: false,
    errors: result.errors,
  };
}

// Get project fields
export async function getProjectFields(
  accessToken: string,
  projectId: string
): Promise<GetProjectFieldsResponse> {
  const result = await executeGraphQL<{
    node: {
      fields: {
        nodes: GitHubProjectV2Field[];
      };
    };
  }>(accessToken, GRAPHQL_QUERIES.GET_PROJECT_FIELDS, { projectId });

  if (result.success && result.data) {
    return {
      success: true,
      fields: result.data.node?.fields?.nodes || [],
    };
  }

  return {
    success: false,
    errors: result.errors,
  };
}

// Format field value for GraphQL mutation
function formatFieldValue(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    // Check if it's a single select option ID
    if (value.startsWith('PVTSSOO_') || value.startsWith('PVTIO_')) {
      return { singleSelectOptionId: value };
    }
    // Check if it's a date format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { date: value };
    }
    // Otherwise treat as text
    return { text: value };
  }
  if (typeof value === 'number') {
    return { number: value };
  }
  return { text: String(value) };
}

// Add issue to project with custom field values
export async function addIssueToProjectWithFields(
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number,
  projectId: string,
  fieldValues: Record<string, string | number>
): Promise<{ success: boolean; item_id?: string; error?: string }> {
  try {
    // Get issue node ID
    const octokit = createOctokit(accessToken);
    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    const issueNodeId = issue.node_id;
    if (!issueNodeId) {
      return { success: false, error: 'Could not get issue node ID' };
    }

    // Add issue to project
    const addResult = await executeGraphQL<{
      addProjectV2ItemById: {
        item: { id: string };
      };
    }>(accessToken, GRAPHQL_QUERIES.ADD_ISSUE_TO_PROJECT, {
      projectId,
      contentId: issueNodeId,
    });

    if (!addResult.success || !addResult.data) {
      return {
        success: false,
        error: 'Failed to add issue to project',
      };
    }

    const itemId = addResult.data.addProjectV2ItemById.item.id;

    // Update field values
    for (const [fieldId, value] of Object.entries(fieldValues)) {
      const formattedValue = formatFieldValue(value);
      const updateResult = await executeGraphQL(
        accessToken,
        GRAPHQL_QUERIES.UPDATE_PROJECT_FIELD,
        {
          projectId,
          itemId,
          fieldId,
          value: formattedValue,
        }
      );

      if (!updateResult.success) {
        console.warn(`Failed to update field ${fieldId}:`, updateResult.errors);
      }
    }

    return { success: true, item_id: itemId };
  } catch (error) {
    console.error('Error adding issue to project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
