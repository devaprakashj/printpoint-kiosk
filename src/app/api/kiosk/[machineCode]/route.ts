import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { machineCode: string } }
) {
  const { machineCode } = params;
  const machine = db.getMachineByCode(machineCode);

  if (!machine) {
    return NextResponse.json(
      { success: false, error: 'Machine not found' },
      { status: 404 }
    );
  }

  const pricingRule = db.getPricingRule(machine.organizationId, machine.id);

  return NextResponse.json({
    success: true,
    machine,
    pricingRule,
  });
}
