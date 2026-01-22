import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchMyActivity } from '@/services/github-service';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activity = await fetchMyActivity(session.accessToken);

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
