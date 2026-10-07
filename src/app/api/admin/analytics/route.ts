import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const orders = db.getOrders();
  const machines = db.getMachines();

  const totalRevenuePaise = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmountPaise, 0);

  const totalPagesPrinted = orders
    .filter(o => o.orderStatus === 'completed')
    .reduce((sum, o) => sum + o.calculatedPrintPages, 0);

  const totalSheetsPrinted = orders
    .filter(o => o.orderStatus === 'completed')
    .reduce((sum, o) => sum + o.calculatedSheets, 0);

  return NextResponse.json({
    success: true,
    stats: {
      totalRevenueRupees: (totalRevenuePaise / 100).toFixed(2),
      totalOrders: orders.length,
      paidOrders: orders.filter(o => o.paymentStatus === 'paid').length,
      totalPagesPrinted,
      totalSheetsPrinted,
      onlineMachinesCount: machines.filter(m => m.status === 'online').length,
      totalMachinesCount: machines.length,
    },
    recentOrders: orders.slice(0, 15),
  });
}
