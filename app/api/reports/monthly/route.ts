import { NextResponse } from 'next/server';
import { getMonthlyReportsData } from '@/lib/repositories/reports';

export async function GET() {
  try {
    const data = await getMonthlyReportsData();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Failed to get monthly reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch report metrics' },
      { status: 500 }
    );
  }
}
