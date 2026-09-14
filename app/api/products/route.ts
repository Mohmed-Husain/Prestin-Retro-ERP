import { NextResponse } from 'next/server';
import { getAllProducts, createProduct, getInventoryKPIs } from '@/lib/repositories/products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeKpis = searchParams.get('kpis') === 'true';

    const products = await getAllProducts();

    if (includeKpis) {
      const kpis = await getInventoryKPIs();
      return NextResponse.json({ success: true, products, kpis });
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Failed to get products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.sku || !body.product_name) {
      return NextResponse.json(
        { success: false, error: 'SKU and Product Name are required' },
        { status: 400 }
      );
    }

    const product = await createProduct({
      sku: body.sku.trim().toUpperCase(),
      product_name: body.product_name.trim(),
      category: body.category || 'General',
      color: body.color || '',
      size: body.size || '',
      cost_price: Number(body.cost_price) || 0,
      selling_price: Number(body.selling_price) || 0,
      stock: Number(body.stock) || 0,
      min_stock: Number(body.min_stock) || 10,
      fabric_gsm: body.fabric_gsm || '',
      description: body.description || '',
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
