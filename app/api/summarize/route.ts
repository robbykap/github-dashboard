import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { summarizeIssue, summarizePullRequest } from '@/services/ai-service';
import { z } from 'zod';

const issueSchema = z.object({
  type: z.literal('issue'),
  title: z.string(),
  body: z.string(),
});

const prSchema = z.object({
  type: z.literal('pr'),
  title: z.string(),
  body: z.string(),
  files: z.array(
    z.object({
      filename: z.string(),
      status: z.string(),
      additions: z.number(),
      deletions: z.number(),
      changes: z.number().optional(),
      patch: z.string().optional(),
    })
  ),
});

const requestSchema = z.union([issueSchema, prSchema]);

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your API key in settings.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.type === 'pr') {
      const result = await summarizePullRequest(data.title, data.body, data.files, session.openaiApiKey);
      return NextResponse.json(result);
    } else {
      const result = await summarizeIssue(data.title, data.body, session.openaiApiKey);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
