import { NextResponse } from 'next/server';
import { getAllStockMovements, recordStockMovement } from '@/lib/repositories/stockMovements';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;

    const movements = await getAllStockMovements(productId);
    return NextResponse.json({ success: true, movements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const movement = await recordStockMovement(body);
    return NextResponse.json({ success: true, movement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
