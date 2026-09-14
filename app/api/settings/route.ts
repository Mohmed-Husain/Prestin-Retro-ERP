import { NextResponse } from 'next/server';
import { getFactorySettings, updateFactorySetting } from '@/lib/repositories/settings';
import { syncManager } from '@/lib/sync';

export async function GET() {
  try {
    const settings = await getFactorySettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await updateFactorySetting(key, value);
      }
    }
    syncManager.invalidateCache('Metadata');
    return NextResponse.json({ success: true, message: 'Settings saved to Google Sheets' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
