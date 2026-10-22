import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── LOCAL FALLBACK CACHE (single-instance dev only) ──────────────────────────
// On Vercel, multiple serverless containers each get their own copy of this
// object, so it can NOT reliably share state between Pi POSTs and browser GETs.
// All real persistence is done via Supabase `kiosk_states` below.
const localFallback: Record<string, {
  currentScreen: string;
  isScannerActive: boolean;
  isVerifying?: boolean;
  printProgress?: number;
  printStep?: number;
  activeOrder?: any;
  scanAlert?: any;
  updatedAt: number;
}> = {};

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
async function upsertKioskState(cleanCode: string, patch: Record<string, unknown>) {
  if (!isSupabaseConfigured || !supabaseAdmin) return;
  try {
    await supabaseAdmin.from('kiosk_states').upsert(
      { machine_code: cleanCode, updated_at: new Date().toISOString(), ...patch },
      { onConflict: 'machine_code' }
    );
  } catch {
    // Non-fatal – local fallback will still serve same-instance requests
  }
}

async function fetchKioskState(cleanCode: string) {
  if (!isSupabaseConfigured || !supabaseAdmin) return null;
  try {
    const { data } = await supabaseAdmin
      .from('kiosk_states')
      .select('*')
      .eq('machine_code', cleanCode)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      machineCode,
      currentScreen,
      isScannerActive,
      clearActiveOrder,
      clearScanAlert,
      activeOrder,
      scanAlert,
      isVerifying,
      printProgress,
      printStep,
    } = body;

    if (!machineCode) {
      return NextResponse.json({ success: false, error: 'machineCode is required' }, { status: 400 });
    }

    const cleanCode = String(machineCode).trim().toUpperCase();
    const active = isScannerActive !== undefined
      ? Boolean(isScannerActive)
      : (currentScreen === 'scan_qr' || currentScreen === 'ready_to_scan');

    // ── Build Supabase patch ──────────────────────────────────────────────────
    const patch: Record<string, unknown> = {
      current_screen: String(currentScreen || 'ready_to_scan'),
      is_scanner_active: active,
      is_verifying: isVerifying !== undefined ? Boolean(isVerifying) : false,
    };
    if (typeof printProgress === 'number') patch.print_progress = printProgress;
    if (typeof printStep === 'number') patch.print_step = printStep;
    if (activeOrder) patch.active_order = activeOrder;
    if (clearActiveOrder) patch.active_order = null;
    if (scanAlert) patch.scan_alert = scanAlert;
    if (clearScanAlert) patch.scan_alert = null;

    // ── Persist to Supabase (shared across all Vercel containers) ────────────
    await upsertKioskState(cleanCode, patch);

    // ── Also update local fallback (for single-instance dev) ─────────────────
    localFallback[cleanCode] = {
      currentScreen: String(currentScreen || 'ready_to_scan'),
      isScannerActive: active,
      isVerifying: isVerifying !== undefined ? Boolean(isVerifying) : false,
      printProgress: typeof printProgress === 'number' ? printProgress : undefined,
      printStep: typeof printStep === 'number' ? printStep : undefined,
      activeOrder: clearActiveOrder ? null : (activeOrder || localFallback[cleanCode]?.activeOrder),
      scanAlert: clearScanAlert ? null : (scanAlert || localFallback[cleanCode]?.scanAlert),
      updatedAt: Date.now(),
    };

    // ── Also keep legacy db helpers in sync ──────────────────────────────────
    if (activeOrder) db.setMachineLiveActiveOrder(cleanCode, activeOrder);
    if (clearActiveOrder) db.clearMachineLiveActiveOrder(cleanCode);
    if (scanAlert) db.setMachineLiveScanAlert(cleanCode, scanAlert);
    if (clearScanAlert) db.clearMachineLiveScanAlert(cleanCode);

    return NextResponse.json({
      success: true,
      machineCode: cleanCode,
      currentScreen: patch.current_screen,
      isScannerActive: patch.is_scanner_active,
      isVerifying: patch.is_verifying,
      printProgress: patch.print_progress,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to update kiosk state';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const machineCode = searchParams.get('machineCode') || 'RIT-ATM-01';
    const cleanCode = String(machineCode).trim().toUpperCase();

    // 1. Primary source: Supabase kiosk_states (shared across all Vercel instances)
    const sbState = await fetchKioskState(cleanCode);

    // 2. Secondary: local in-memory fallback (same-instance dev)
    const loc = localFallback[cleanCode];

    // Resolve the most recent state
    const sbAge = sbState?.updated_at ? Date.now() - new Date(sbState.updated_at).getTime() : Infinity;
    const locAge = loc ? Date.now() - loc.updatedAt : Infinity;
    const useSupabase = sbState && sbAge < locAge + 5000; // prefer Supabase unless local is much fresher

    const currentScreen = useSupabase ? (sbState!.current_screen || 'ready_to_scan') : (loc?.currentScreen || 'ready_to_scan');
    const isScannerActive = useSupabase ? Boolean(sbState!.is_scanner_active ?? true) : Boolean(loc?.isScannerActive ?? true);
    const isVerifying = useSupabase ? Boolean(sbState!.is_verifying) : Boolean(loc?.isVerifying);
    const printProgress = useSupabase ? (sbState!.print_progress ?? undefined) : loc?.printProgress;
    const printStep = useSupabase ? (sbState!.print_step ?? undefined) : loc?.printStep;
    const stateAge = Math.min(sbAge, locAge);
    const isStale = stateAge > 180000;

    // 3. Active order: prefer Supabase kiosk_states.active_order, then db helper, then Supabase orders query
    let liveActiveOrder: any =
      (useSupabase && sbState?.active_order) ||
      (loc?.activeOrder) ||
      db.getMachineLiveActiveOrder(cleanCode) ||
      null;

    // 4. Scan alert: prefer Supabase kiosk_states.scan_alert, then db helper
    let scanAlert: any =
      (useSupabase && sbState?.scan_alert) ||
      (loc?.scanAlert) ||
      db.getMachineLiveScanAlert(cleanCode) ||
      null;

    // 5. Supabase orders table fallback: catches paid_ready_to_print AND printing
    //    so the order_details screen appears immediately after scanning.
    if (!liveActiveOrder && isSupabaseConfigured && supabaseAdmin) {
      try {
        const cutoffTime = new Date(Date.now() - 300000).toISOString(); // Last 5 minutes
        const { data: recentOrder } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('machine_code', cleanCode)
          .in('order_status', ['paid_ready_to_print', 'printing'])
          .gte('created_at', cutoffTime)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentOrder) {
          const totalPaise = recentOrder.total_amount_paise || 200;
          liveActiveOrder = {
            id: recentOrder.id,
            orderNumber: recentOrder.order_number,
            fileName: recentOrder.file_name,
            fileSizeFormatted: recentOrder.file_size_formatted,
            pages: recentOrder.calculated_print_pages || 1,
            sheets: recentOrder.calculated_sheets || 1,
            copies: recentOrder.copies || 1,
            colorMode: recentOrder.color_mode || 'bw',
            duplexMode: recentOrder.duplex_mode || 'simplex',
            paperSize: recentOrder.paper_size || 'A4',
            fourDigitPin: recentOrder.four_digit_pin,
            downloadUrl: recentOrder.file_storage_url,
            selectedPageRanges: recentOrder.selected_page_ranges,
            calculatedPrintPages: recentOrder.calculated_print_pages,
            calculatedSheets: recentOrder.calculated_sheets,
            amount: totalPaise % 100 === 0 ? `${totalPaise / 100}` : (totalPaise / 100).toFixed(2),
            totalAmountPaise: totalPaise,
            totalAmountRupees: `₹${totalPaise % 100 === 0 ? totalPaise / 100 : (totalPaise / 100).toFixed(2)}`,
            orderStatus: recentOrder.order_status,
            releasedAt: recentOrder.pin_used_at || recentOrder.updated_at || recentOrder.created_at,
          };
          db.setMachineLiveActiveOrder(cleanCode, liveActiveOrder);
        }
      } catch {
        // Supabase query failed silently – UI will retry next poll
      }
    }

    if (isStale && !liveActiveOrder) {
      return NextResponse.json({
        success: true,
        machineCode: cleanCode,
        currentScreen: 'ready_to_scan',
        isScannerActive: true,
        activeOrder: null,
        scanAlert: null,
        isStale: true,
      });
    }

    return NextResponse.json({
      success: true,
      machineCode: cleanCode,
      currentScreen,
      isScannerActive,
      isVerifying,
      printProgress,
      printStep,
      activeOrder: liveActiveOrder,
      scanAlert,
      ageSeconds: Math.round(stateAge / 1000),
      source: useSupabase ? 'supabase' : 'local',
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to fetch kiosk state';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
