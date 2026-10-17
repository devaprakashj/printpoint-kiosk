import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  req: NextRequest,
  { params }: { params: { machineCode: string } }
) {
  const { machineCode } = params;
  const cleanCode = String(machineCode).trim().toUpperCase();

  let machine: any = null;
  let pricingRule: any = null;

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: mData } = await supabaseAdmin
      .from('machines')
      .select('*')
      .eq('machine_code', cleanCode)
      .maybeSingle();

    if (mData) {
      const isHeartbeatFresh = Boolean(
        mData.last_heartbeat_at &&
        (Date.now() - new Date(mData.last_heartbeat_at).getTime() < 75000)
      );

      machine = {
        id: mData.id,
        organizationId: mData.organization_id || 'org-rit',
        organizationName: mData.organization_name || 'PrintPoint Campus Kiosk',
        machineCode: mData.machine_code || cleanCode,
        displayName: mData.display_name || 'Print ATM',
        locationDescription: mData.location_description || '',
        deploymentType: mData.deployment_type || 'kiosk_atm',
        status: isHeartbeatFresh ? (mData.status || 'online') : 'offline',
        paperStatus: mData.paper_status || 'ok',
        currentSheetsRemaining: mData.current_sheets_remaining ?? 500,
        totalCapacitySheets: mData.total_capacity_sheets ?? 500,
        tonerLevelPercent: mData.toner_level_percent ?? 100,
        internalTempCelsius: mData.internal_temp_celsius ?? 24,
        isDoorOpen: Boolean(mData.is_door_open),
        qrCodeToken: mData.qr_code_token || '',
        defaultPrinterModel: mData.default_printer_model || mData.printer_spooler_name || null,
        printerConnectionType: mData.printer_connection_type || 'windows_spooler',
        printerSpoolerName: mData.printer_spooler_name || mData.default_printer_model || null,
        printerPortOrIp: mData.printer_port_or_ip || 'USB001',
        duplexHardwareCapable: Boolean(mData.duplex_hardware_capable),
        daemonSecretToken: mData.daemon_secret_token,
        secondaryLogoUrl: mData.secondary_logo_url,
        customDomain: mData.custom_domain,
        managerPhone: mData.manager_phone || '8667466390',
        lowPaperThreshold: mData.low_paper_threshold ?? 50,
        fullAddress: mData.full_address || mData.location_description,
        openingHours: mData.opening_hours || 'Open 24/7',
        supportsBw: mData.supports_bw ?? true,
        supportsColor: mData.supports_color ?? false,
        supportsDuplex: mData.supports_duplex ?? Boolean(mData.duplex_hardware_capable),
        supportsPlainPaper: mData.supports_plain_paper ?? true,
        lastPaperRefillAt: mData.last_paper_refill_at,
        lastHeartbeatAt: mData.last_heartbeat_at,
        activePrinterStatus: isHeartbeatFresh ? (mData.active_printer_status || 'connected') : 'offline',
      };

      const { data: pData } = await supabaseAdmin
        .from('pricing_rules')
        .select('*')
        .eq('organization_id', machine.organizationId)
        .maybeSingle();

      if (pData) {
        pricingRule = {
          id: pData.id,
          organizationId: pData.organization_id,
          paperSize: pData.paper_size,
          bwSinglePaise: pData.bw_single_paise,
          bwDuplexPaise: pData.bw_duplex_paise,
          colorSinglePaise: pData.color_single_paise,
          colorDuplexPaise: pData.color_duplex_paise,
          minimumOrderPaise: pData.minimum_order_paise,
          isActive: pData.is_active,
        };
      }
    }
  }

  if (!machine) {
    machine = db.getMachineByCode(machineCode);
  }

  if (!machine) {
    return NextResponse.json(
      { success: false, error: 'Machine not found' },
      { status: 404 }
    );
  }

  if (!pricingRule) {
    pricingRule = db.getPricingRule(machine.organizationId, machine.id);
  }

  return NextResponse.json({
    success: true,
    machine,
    pricingRule,
  });
}
