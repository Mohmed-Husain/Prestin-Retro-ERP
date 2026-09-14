import { NextResponse } from 'next/server';
import { getAllSales, createSale, getSalesKPIs } from '@/lib/repositories/sales';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeKpis = searchParams.get('kpis') === 'true';

    const sales = await getAllSales();

    if (includeKpis) {
      const kpis = await getSalesKPIs();
      return NextResponse.json({ success: true, sales, kpis });
    }

    return NextResponse.json({ success: true, sales });
  } catch (error: any) {
    console.error('Failed to get sales:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, date, subtotal, gst, total, status, items } = body;

    if (!customer_id || !items || !items.length) {
      return NextResponse.json(
        { success: false, error: 'Customer and at least one item are required' },
        { status: 400 }
      );
    }

    const sale = await createSale(
      {
        customer_id,
        date: date || new Date().toISOString().split('T')[0],
        subtotal: Number(subtotal) || 0,
        gst: Number(gst) || 0,
        total: Number(total) || 0,
        status: status || 'Unpaid',
      },
      items
    );

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create sale:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
