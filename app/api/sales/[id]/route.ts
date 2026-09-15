import { NextResponse } from 'next/server';
import { getSaleById, updateSaleStatus, updateSale, deleteSale } from '@/lib/repositories/sales';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await getSaleById(id);
    if (!sale) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Quick status toggle
    if (body.status && Object.keys(body).length === 1) {
      const updated = await updateSaleStatus(id, body.status);
      return NextResponse.json({ success: true, sale: updated });
    }

    // Full invoice edit
    const { items, ...saleData } = body;
    const updated = await updateSale(id, saleData, items);
    return NextResponse.json({ success: true, sale: updated });
  } catch (error: any) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSale(id);
    return NextResponse.json({ success: true, message: 'Invoice deleted and stock restored successfully' });
  } catch (error: any) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
