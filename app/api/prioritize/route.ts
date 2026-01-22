import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prioritizeIssues } from '@/services/ai-service';
import { z } from 'zod';

const requestSchema = z.object({
  issues: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
    })
  ),
});

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

    const { issues } = parsed.data;
    const prioritizedIds = await prioritizeIssues(issues, session.openaiApiKey);

    return NextResponse.json({ priority_order: prioritizedIds });
  } catch (error) {
    console.error('Prioritize error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
