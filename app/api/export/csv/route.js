import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Parser } from '@json2csv/plainjs';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    await connectDB();

    let query = { user: session.user.id };

    if (status) {
      query.paymentStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });

    // Flatten data for CSV
    const flattenedData = invoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      customerPhone: invoice.customer.phone,
      customerAddress: invoice.customer.address,
      subtotal: invoice.subtotal,
      gstRate: invoice.gstRate,
      gstAmount: invoice.gstAmount,
      shippingCharges: invoice.shippingCharges,
      total: invoice.total,
      paymentStatus: invoice.paymentStatus,
      createdAt: invoice.createdAt.toISOString(),
      items: invoice.items.map((item) => `${item.name} (${item.sku}) x${item.quantity}`).join('; '),
    }));

    const fields = [
      { label: 'Invoice Number', value: 'invoiceNumber' },
      { label: 'Customer Name', value: 'customerName' },
      { label: 'Customer Phone', value: 'customerPhone' },
      { label: 'Customer Address', value: 'customerAddress' },
      { label: 'Items', value: 'items' },
      { label: 'Subtotal', value: 'subtotal' },
      { label: 'GST Rate (%)', value: 'gstRate' },
      { label: 'GST Amount', value: 'gstAmount' },
      { label: 'Shipping Charges', value: 'shippingCharges' },
      { label: 'Total', value: 'total' },
      { label: 'Payment Status', value: 'paymentStatus' },
      { label: 'Date', value: 'createdAt' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flattenedData);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="invoices-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
