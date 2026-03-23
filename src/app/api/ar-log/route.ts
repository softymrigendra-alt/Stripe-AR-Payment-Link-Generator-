import { NextRequest, NextResponse } from 'next/server';
import { getLogEntries, updateLogEntryStatus } from '@/lib/ar-log';
import { ARLogEntry } from '@/types';

export async function GET() {
  const entries = await getLogEntries();
  return NextResponse.json({ entries });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body as { id: string; status: ARLogEntry['status'] };

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses: ARLogEntry['status'][] = ['ACTIVE', 'PAID', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const updated = await updateLogEntryStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
