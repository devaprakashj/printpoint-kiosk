import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('machines')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
          const isHeartbeatFresh = Boolean(
            m.last_heartbeat_at &&
            (Date.now() - new Date(m.last_heartbeat_at).getTime() < 30000)
          );

          return {
            id: m.id,
            organizationId: m.organization_id || 'org-rit',
            organizationName: m.organization_name || 'PrintPoint Campus Kiosk',
            machineCode: m.machine_code || 'RIT-ATM-01',
            displayName: m.display_name || 'Print ATM',
            locationDescription: m.location_description || '',
            deploymentType: m.deployment_type || 'kiosk_atm',
            status: isHeartbeatFresh ? (m.status || 'online') : 'offline',
            paperStatus: m.paper_status || 'ok',
            currentSheetsRemaining: m.current_sheets_remaining ?? 500,
            totalCapacitySheets: m.total_capacity_sheets ?? 500,
            tonerLevelPercent: m.toner_level_percent ?? 100,
            internalTempCelsius: m.internal_temp_celsius ?? 24,
            isDoorOpen: Boolean(m.is_door_open),
            qrCodeToken: m.qr_code_token || '',
            defaultPrinterModel: m.default_printer_model || m.printer_spooler_name || 'HP LaserJet',
            printerConnectionType: m.printer_connection_type || 'windows_spooler',
            printerSpoolerName: m.printer_spooler_name || m.default_printer_model || 'HP LaserJet',
            printerPortOrIp: m.printer_port_or_ip || 'USB001',
            duplexHardwareCapable: Boolean(m.duplex_hardware_capable),
            daemonSecretToken: m.daemon_secret_token,
            secondaryLogoUrl: m.secondary_logo_url,
            customDomain: m.custom_domain,
            managerPhone: m.manager_phone || '8667466390',
            lowPaperThreshold: m.low_paper_threshold ?? 50,
            latitude: m.latitude,
            longitude: m.longitude,
            fullAddress: m.full_address || m.location_description,
            photoUrl: m.photo_url || m.secondary_logo_url,
            openingHours: m.opening_hours || 'Open 24/7',
            googleMapsUrl: m.google_maps_url,
            lastPaperRefillAt: m.last_paper_refill_at,
            lastHeartbeatAt: m.last_heartbeat_at,
            activePrinterStatus: isHeartbeatFresh ? (m.active_printer_status || 'connected') : 'offline',
          };
        });
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
