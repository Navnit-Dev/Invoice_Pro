import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import * as XLSX from 'xlsx';
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

    // Flatten data for Excel
    const flattenedData = invoices.map((invoice) => ({
      'Invoice Number': invoice.invoiceNumber,
      'Customer Name': invoice.customer.name,
      'Customer Phone': invoice.customer.phone,
      'Customer Address': invoice.customer.address,
      'Items': invoice.items.map((item) => `${item.name} (${item.sku}) x${item.quantity}`).join('; '),
      'Subtotal': invoice.subtotal,
      'GST Rate (%)': invoice.gstRate,
      'GST Amount': invoice.gstAmount,
      'Shipping Charges': invoice.shippingCharges,
      'Total': invoice.total,
      'Payment Status': invoice.paymentStatus,
      'Date': invoice.createdAt.toISOString(),
    }));

    const ws = XLSX.utils.json_to_sheet(flattenedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

    // Auto-size columns
    const colWidths = {};
    flattenedData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const cellValue = String(row[key] || '');
        colWidths[key] = Math.max(colWidths[key] || 10, cellValue.length + 2);
      });
    });
    ws['!cols'] = Object.keys(colWidths).map((key) => ({ wch: colWidths[key] }));

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="invoices-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return NextResponse.json({ error: 'Failed to export Excel' }, { status: 500 });
  }
}
