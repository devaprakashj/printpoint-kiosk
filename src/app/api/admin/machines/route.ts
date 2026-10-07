import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const machines = db.getMachines();
  const orders = db.getOrders();

  return NextResponse.json({
    success: true,
    machines,
    totalOrdersCount: orders.length,
    activeOrdersCount: orders.filter(o => o.orderStatus === 'paid_ready_to_print').length,
    completedOrdersCount: orders.filter(o => o.orderStatus === 'completed').length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, machineCode, sheets = 500, status } = body;

    if (!machineCode) {
      return NextResponse.json({ success: false, error: 'machineCode is required' }, { status: 400 });
    }

    if (action === 'refill') {
      db.refillMachinePaper(machineCode, Number(sheets));
    } else if (action === 'update_status' && status) {
      db.updateMachineStatus(machineCode, { status });
    } else if (action === 'toggle_door') {
      const machine = db.getMachineByCode(machineCode);
      if (machine) {
        db.updateMachineStatus(machineCode, { isDoorOpen: !machine.isDoorOpen });
      }
    } else if (action === 'save_hardware') {
      const { defaultPrinterModel, ipAddress } = body;
      db.updateMachineStatus(machineCode, { defaultPrinterModel, ipAddress });
    }

    const updated = db.getMachineByCode(machineCode);
    return NextResponse.json({ success: true, machine: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
