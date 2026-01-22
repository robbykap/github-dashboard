import 'server-only';

import { Octokit } from '@octokit/rest';

// Create an Octokit instance with the given access token
export function createOctokit(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

// GraphQL endpoint
export const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// Execute a GraphQL query
export async function executeGraphQL<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<{ success: boolean; data?: T; errors?: unknown[] }> {
  try {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      return { success: false, errors: result.errors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('GraphQL query error:', error);
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
    };
  }
}

// GraphQL Queries
export const GRAPHQL_QUERIES = {
  LIST_REPOSITORY_PROJECTS: `
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
  `,

  GET_PROJECT_FIELDS: `
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
  `,

  ADD_ISSUE_TO_PROJECT: `
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
  `,

  UPDATE_PROJECT_FIELD: `
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
  `,
};
