import { NextResponse } from 'next/server';
import { getDashboardKPIs } from '@/lib/repositories/reports';

export async function GET() {
  try {
    const kpis = await getDashboardKPIs();
    return NextResponse.json({ success: true, ...kpis });
  } catch (error: any) {
    console.error('Failed to get dashboard KPIs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
