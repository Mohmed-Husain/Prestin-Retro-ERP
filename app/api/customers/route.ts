import { NextResponse } from 'next/server';
import { getAllCustomers, createCustomer, getCustomerKPIs } from '@/lib/repositories/customers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeKpis = searchParams.get('kpis') === 'true';

    const customers = await getAllCustomers();

    if (includeKpis) {
      const kpis = await getCustomerKPIs();
      return NextResponse.json({ success: true, customers, kpis });
    }

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error('Failed to get customers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer Name and Phone are required' },
        { status: 400 }
      );
    }

    const customer = await createCustomer({
      name: body.name.trim(),
      phone: body.phone.trim(),
      gst: body.gst || '',
      address: body.address || '',
      tier: body.tier || 'Regular',
      credit_limit: Number(body.credit_limit) || 100000,
      contact_person: body.contact_person || '',
      email: body.email || '',
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
