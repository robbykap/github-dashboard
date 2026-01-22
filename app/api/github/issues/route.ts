import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getRepositoryIssues,
  createIssue,
  addIssueToProjectWithFields,
} from '@/services/github-service';
import { z } from 'zod';

const createIssueSchema = z.object({
  repo: z.string().regex(/^[^/]+\/[^/]+$/, 'Must be in format owner/repo'),
  title: z.string().min(1),
  body: z.string(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  project_id: z.string().optional(),
  field_values: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const state = (searchParams.get('state') as 'open' | 'closed' | 'all') || 'open';

    if (!repo) {
      return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Invalid repo format. Use owner/repo' },
        { status: 400 }
      );
    }

    const issues = await getRepositoryIssues(session.accessToken, owner, repoName, state);

    // Separate issues from PRs
    const pureIssues = issues.filter((i) => !i.pull_request);
    const pullRequests = issues.filter((i) => i.pull_request);

    return NextResponse.json({ issues: pureIssues, pull_requests: pullRequests });
  } catch (error) {
    console.error('Get issues error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createIssueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { repo, title, body: issueBody, labels, assignees, project_id, field_values } =
      parsed.data;

    const [owner, repoName] = repo.split('/');

    // Create the issue
    const result = await createIssue(
      session.accessToken,
      owner,
      repoName,
      title,
      issueBody,
      labels,
      assignees
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Add to project if specified
    if (project_id && result.issue_number) {
      const projectResult = await addIssueToProjectWithFields(
        session.accessToken,
        owner,
        repoName,
        result.issue_number,
        project_id,
        field_values || {}
      );

      if (!projectResult.success) {
        console.warn('Failed to add issue to project:', projectResult.error);
        // Don't fail the request, just warn
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create issue error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
