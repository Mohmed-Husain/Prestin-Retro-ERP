import { NextResponse } from 'next/server';
import { getAllPayments, recordPayment } from '@/lib/repositories/payments';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || undefined;
    const payments = await getAllPayments(customerId);
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.customer_id || !body.amount) {
      return NextResponse.json({ success: false, error: 'Customer ID and amount are required' }, { status: 400 });
    }
    const payment = await recordPayment({
      customer_id: body.customer_id,
      amount: Number(body.amount),
      method: body.method || 'Cash',
      date: body.date || new Date().toISOString().split('T')[0],
      notes: body.notes || '',
      reference: body.reference || '',
    });
    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
