import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// In-memory real-time state cache for Kiosk display screens
const kioskScreenStates: Record<
  string,
  { currentScreen: string; isScannerActive: boolean; updatedAt: number }
> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machineCode, currentScreen, isScannerActive, clearActiveOrder, clearScanAlert } = body;

    if (!machineCode) {
      return NextResponse.json({ success: false, error: 'machineCode is required' }, { status: 400 });
    }

    const cleanCode = String(machineCode).trim().toUpperCase();
    const active = isScannerActive !== undefined ? Boolean(isScannerActive) : currentScreen === 'scan_qr';

    if (clearActiveOrder) {
      db.clearMachineLiveActiveOrder(cleanCode);
    }
    if (clearScanAlert) {
      db.clearMachineLiveScanAlert(cleanCode);
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
    let liveActiveOrder = db.getMachineLiveActiveOrder(cleanCode) || null;
    const scanAlert = db.getMachineLiveScanAlert(cleanCode) || null;

    // ─── SUPABASE FALLBACK ─────────────────────────────────────────────────────
    // On Vercel serverless, each request may hit a DIFFERENT container instance.
    // Pi's /api/pin/release sets in-memory state in one container but the kiosk
    // browser polls /api/kiosk/state hitting a different container → state is lost.
    // Fix: query Supabase (shared DB) for recently scanned printing orders as the
    // authoritative source across all serverless instances.
    if (!liveActiveOrder && isSupabaseConfigured && supabaseAdmin) {
      try {
        const cutoffTime = new Date(Date.now() - 180000).toISOString(); // Last 3 minutes
        const { data: recentOrder } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('machine_code', cleanCode)
          .eq('order_status', 'printing')
          .not('pin_used_at', 'is', null)
          .gte('pin_used_at', cutoffTime)
          .order('pin_used_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentOrder) {
          const totalPaise = recentOrder.total_amount_paise || 200;
          liveActiveOrder = {
            id: recentOrder.id,
            orderNumber: recentOrder.order_number,
            fileName: recentOrder.file_name,
            pages: recentOrder.calculated_print_pages || 1,
            sheets: recentOrder.calculated_sheets || 1,
            copies: recentOrder.copies || 1,
            colorMode: recentOrder.color_mode || 'bw',
            duplexMode: recentOrder.duplex_mode || 'simplex',
            paperSize: recentOrder.paper_size || 'A4',
            fourDigitPin: recentOrder.four_digit_pin,
            amount: totalPaise % 100 === 0 ? `${totalPaise / 100}` : (totalPaise / 100).toFixed(2),
            totalAmountPaise: totalPaise,
            orderStatus: recentOrder.order_status,
            releasedAt: recentOrder.pin_used_at || recentOrder.created_at,
          };
          // Cache it in-memory to reduce DB polling on subsequent requests
          db.setMachineLiveActiveOrder(cleanCode, liveActiveOrder);
        }
      } catch {
        // Supabase query failed silently – UI will retry next poll
      }
    }

    // Default to active ready_to_scan for autonomous kiosk
    if (!state || Date.now() - state.updatedAt > 180000) {
      return NextResponse.json({
        success: true,
        machineCode: cleanCode,
        currentScreen: 'ready_to_scan',
        isScannerActive: true,
        activeOrder: liveActiveOrder,
        scanAlert: scanAlert,
        isStale: true,
      });
    }

    return NextResponse.json({
      success: true,
      machineCode: cleanCode,
      currentScreen: state.currentScreen,
      isScannerActive: state.isScannerActive,
      activeOrder: liveActiveOrder,
      scanAlert: scanAlert,
      ageSeconds: Math.round((Date.now() - state.updatedAt) / 1000),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to fetch kiosk state';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

