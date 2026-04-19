import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import Store from '@/models/Store';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await connectDB();

    let query = { user: session.user.id };

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.paymentStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name sku'),
      Invoice.countDocuments(query),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    // Get store to generate invoice number
    const store = await Store.findOne({ user: session.user.id });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Generate invoice number
    const invoiceNumber = `${store.invoicePrefix}-${String(store.invoiceNumber).padStart(4, '0')}`;

    // Update invoice number counter
    store.invoiceNumber += 1;
    await store.save();

    // Process items and update stock
    const processedItems = [];
    for (const item of body.items) {
      const product = await Product.findOne({
        _id: item.productId,
        user: session.user.id,
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      // Update stock
      product.stock -= item.quantity;
      await product.save();

      processedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      });
    }

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = (subtotal * (body.gstRate || 0)) / 100;
    const shippingCharges = body.shippingCharges || 0;
    const total = subtotal + gstAmount + shippingCharges;

    const invoice = await Invoice.create({
      user: session.user.id,
      invoiceNumber,
      customer: body.customer,
      items: processedItems,
      subtotal,
      gstRate: body.gstRate || 0,
      gstAmount,
      shippingCharges,
      total,
      paymentStatus: body.paymentStatus || 'Pending',
      notes: body.notes,
    });

    const populatedInvoice = await Invoice.findById(invoice._id).populate(
      'items.product',
      'name sku'
    );

    return NextResponse.json(populatedInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
