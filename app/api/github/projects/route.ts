import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRepositoryProjects } from '@/services/github-service';
import { z } from 'zod';

const requestSchema = z.object({
  repo: z.string().regex(/^[^/]+\/[^/]+$/, 'Must be in format owner/repo'),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { repo } = parsed.data;
    const [owner, repoName] = repo.split('/');

    const result = await getRepositoryProjects(session.accessToken, owner, repoName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
