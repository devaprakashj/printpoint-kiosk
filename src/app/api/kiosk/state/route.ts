import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// In-memory real-time state cache for Kiosk display screens
const kioskScreenStates: Record<
  string,
  { currentScreen: string; isScannerActive: boolean; updatedAt: number }
> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machineCode, currentScreen, isScannerActive, clearActiveOrder } = body;

    if (!machineCode) {
      return NextResponse.json({ success: false, error: 'machineCode is required' }, { status: 400 });
    }

    const cleanCode = String(machineCode).trim().toUpperCase();
    const active = isScannerActive !== undefined ? Boolean(isScannerActive) : currentScreen === 'scan_qr';

    if (clearActiveOrder) {
      db.clearMachineLiveActiveOrder(cleanCode);
    }

    kioskScreenStates[cleanCode] = {
      currentScreen: String(currentScreen || 'home'),
      isScannerActive: active,
      updatedAt: Date.now(),
    };

    return NextResponse.json({
      success: true,
      machineCode: cleanCode,
      currentScreen: kioskScreenStates[cleanCode].currentScreen,
      isScannerActive: kioskScreenStates[cleanCode].isScannerActive,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to update kiosk state';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const machineCode = searchParams.get('machineCode') || 'RIT-ATM-01';
    const cleanCode = String(machineCode).trim().toUpperCase();

    const state = kioskScreenStates[cleanCode];
    const liveActiveOrder = db.getMachineLiveActiveOrder(cleanCode) || null;

    // Default to active ready_to_scan for autonomous kiosk
    if (!state || Date.now() - state.updatedAt > 180000) {
      return NextResponse.json({
        success: true,
        machineCode: cleanCode,
        currentScreen: 'ready_to_scan',
        isScannerActive: true,
        activeOrder: liveActiveOrder,
        isStale: true,
      });
    }

    return NextResponse.json({
      success: true,
      machineCode: cleanCode,
      currentScreen: state.currentScreen,
      isScannerActive: state.isScannerActive,
      activeOrder: liveActiveOrder,
      ageSeconds: Math.round((Date.now() - state.updatedAt) / 1000),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to fetch kiosk state';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
