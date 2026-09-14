import { NextResponse } from 'next/server';
import { getAllExpenses, createExpense, getExpenseKPIs } from '@/lib/repositories/expenses';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeKpis = searchParams.get('kpis') === 'true';

    const expenses = await getAllExpenses();

    if (includeKpis) {
      const kpis = await getExpenseKPIs();
      return NextResponse.json({ success: true, expenses, kpis });
    }

    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    console.error('Failed to get expenses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, amount, payment_method, date, notes } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { success: false, error: 'Title and amount are required' },
        { status: 400 }
      );
    }

    const expense = await createExpense({
      title: title.trim(),
      category: category || 'Others',
      amount: Number(amount) || 0,
      payment_method: payment_method || 'Cash',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
