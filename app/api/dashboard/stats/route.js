import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get all stats in parallel
    const [
      totalSales,
      monthlyRevenue,
      lastMonthRevenue,
      pendingAmount,
      paidAmount,
      totalInvoices,
      totalProducts,
      lowStockProducts,
    ] = await Promise.all([
      // Total sales (all time)
      Invoice.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(session.user.id) } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // This month revenue
      Invoice.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(session.user.id),
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Last month revenue
      Invoice.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(session.user.id),
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Pending amount
      Invoice.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(session.user.id),
            paymentStatus: 'Pending',
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Paid amount
      Invoice.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(session.user.id),
            paymentStatus: 'Paid',
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Total invoices
      Invoice.countDocuments({ user: session.user.id }),

      // Total products
      Product.countDocuments({ user: session.user.id }),

      // Low stock products
      Product.countDocuments({
        user: session.user.id,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      }),
    ]);

    // Get recent invoices
    const recentInvoices = await Invoice.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNumber customer.name total paymentStatus createdAt');

    // Get monthly data for chart (last 6 months)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const monthlyData = await Invoice.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(session.user.id),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const stats = {
      totalSales: totalSales[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      totalInvoices,
      totalProducts,
      lowStockProducts,
      recentInvoices,
      monthlyData: monthlyData.map((item) => ({
        month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        revenue: item.total,
        invoices: item.count,
      })),
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
