import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateOrderPrice } from '@/lib/pricingEngine';
import { ColorMode, DuplexMode } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      machineCode,
      totalPages = 1,
      pageRangeStr = 'all',
      copies = 1,
      colorMode = 'bw',
      duplexMode = 'simplex',
    } = body;

    let organizationId = 'org-rit-chennai';
    let machineId: string | undefined = undefined;

    if (machineCode) {
      const machine = db.getMachineByCode(machineCode);
      if (machine) {
        organizationId = machine.organizationId;
        machineId = machine.id;
      }
    }

    const pricingRule = db.getPricingRule(organizationId, machineId);
    const result = calculateOrderPrice({
      pricingRule,
      totalPages: Math.max(1, Number(totalPages)),
      pageRangeStr: String(pageRangeStr || 'all'),
      copies: Math.max(1, Number(copies)),
      colorMode: colorMode as ColorMode,
      duplexMode: duplexMode as DuplexMode,
    });

    return NextResponse.json({
      success: true,
      pricingRule,
      calculation: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
