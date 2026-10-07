import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('machines')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Map postgres snake_case to frontend camelCase
        const machines = data.map((m: any) => ({
          id: m.id,
          organizationId: m.organization_id,
          organizationName: m.organization_name,
          machineCode: m.machine_code,
          displayName: m.display_name,
          locationDescription: m.location_description,
          deploymentType: m.deployment_type,
          status: m.status,
          paperStatus: m.paper_status,
          currentSheetsRemaining: m.current_sheets_remaining,
          totalCapacitySheets: m.total_capacity_sheets,
          tonerLevelPercent: m.toner_level_percent,
          internalTempCelsius: m.internal_temp_celsius,
          isDoorOpen: m.is_door_open,
          qrCodeToken: m.qr_code_token,
          defaultPrinterModel: m.default_printer_model,
          printerConnectionType: m.printer_connection_type,
          printerSpoolerName: m.printer_spooler_name,
          printerPortOrIp: m.printer_port_or_ip,
          duplexHardwareCapable: m.duplex_hardware_capable,
          daemonSecretToken: m.daemon_secret_token,
          secondaryLogoUrl: m.secondary_logo_url,
          customDomain: m.custom_domain,
          managerPhone: m.manager_phone,
          lowPaperThreshold: m.low_paper_threshold,
          latitude: m.latitude,
          longitude: m.longitude,
          fullAddress: m.full_address || m.location_description,
          photoUrl: m.photo_url || m.secondary_logo_url,
          openingHours: m.opening_hours || 'Open 24/7',
          googleMapsUrl: m.google_maps_url,
          lastPaperRefillAt: m.last_paper_refill_at,
          lastHeartbeatAt: m.last_heartbeat_at,
          activePrinterStatus: m.active_printer_status,
        }));
        return NextResponse.json({ success: true, machines });
      }
    }

    const machines = db.getMachines();
    return NextResponse.json({ success: true, machines });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch machines';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
