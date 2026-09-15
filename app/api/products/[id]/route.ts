import { NextResponse } from 'next/server';
import { getProductById, updateProduct, updateProductStock, softDeleteProduct } from '@/lib/repositories/products';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
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

    // Check if this is a stock update/restock
    if (body.stockAdjustment !== undefined) {
      const { quantity, movementType = 'IN', reason = 'Manual Inventory Update' } = body;
      const numQty = Number(quantity);
      if (quantity === undefined || quantity === null || isNaN(numQty) || numQty <= 0) {
        return NextResponse.json({ success: false, error: 'A valid positive quantity is required' }, { status: 400 });
      }
      const updated = await updateProductStock(id, numQty, movementType, reason);
      return NextResponse.json({ success: true, product: updated });
    }

    // General updates
    const updated = await updateProduct(id, body);
    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await softDeleteProduct(id);
    return NextResponse.json({ success: true, message: 'Product archived successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
