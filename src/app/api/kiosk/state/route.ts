import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory real-time state cache for Kiosk display screens
const kioskScreenStates: Record<
  string,
  { currentScreen: string; isScannerActive: boolean; updatedAt: number }
> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machineCode, currentScreen, isScannerActive } = body;

    if (!machineCode) {
      return NextResponse.json({ success: false, error: 'machineCode is required' }, { status: 400 });
    }

    const cleanCode = String(machineCode).trim().toUpperCase();
    const active = isScannerActive !== undefined ? Boolean(isScannerActive) : currentScreen === 'scan_qr';

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

    // Default to inactive/home if not set or stale (> 3 minutes)
    if (!state || Date.now() - state.updatedAt > 180000) {
      return NextResponse.json({
        success: true,
        machineCode: cleanCode,
        currentScreen: 'home',
        isScannerActive: false,
        isStale: true,
      });
    }

    return NextResponse.json({
      success: true,
      machineCode: cleanCode,
      currentScreen: state.currentScreen,
      isScannerActive: state.isScannerActive,
      ageSeconds: Math.round((Date.now() - state.updatedAt) / 1000),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to fetch kiosk state';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
