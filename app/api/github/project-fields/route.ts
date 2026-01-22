import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProjectFields } from '@/services/github-service';
import { z } from 'zod';

const requestSchema = z.object({
  project_id: z.string().min(1),
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

    const { project_id } = parsed.data;

    const result = await getProjectFields(session.accessToken, project_id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get project fields error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
