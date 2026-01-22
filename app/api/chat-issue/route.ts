import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { chatIssueCreation } from '@/services/ai-service';
import { z } from 'zod';

const requestSchema = z.object({
  conversation_history: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  message: z.string().min(1),
  current_preview_data: z
    .object({
      title: z.string().optional(),
      body: z.string().optional(),
      issue_type: z.enum(['bug', 'feature', 'enhancement', 'documentation', 'question']).nullable().optional(),
      labels: z.array(z.string()).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
    })
    .nullable()
    .optional(),
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

    const { conversation_history, message, current_preview_data } = parsed.data;

    const result = await chatIssueCreation(
      conversation_history,
      message,
      session.openaiApiKey,
      current_preview_data
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat issue error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
