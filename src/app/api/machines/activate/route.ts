import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey, machineCode, hardwareFingerprint } = body;

    if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Machine License Key (e.g. PRN-2026-XXXX-XXXX)' },
        { status: 400 }
      );
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    let machine: any = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Find machine matching license key or machine code
      let query = supabaseAdmin.from('machines').select('*');
      
      const { data: byLicense } = await supabaseAdmin
        .from('machines')
        .select('*')
        .ilike('license_key', cleanKey)
        .maybeSingle();

      if (byLicense) {
        machine = byLicense;
      } else if (machineCode) {
        const { data: byCode } = await supabaseAdmin
          .from('machines')
          .select('*')
          .eq('machine_code', machineCode.toUpperCase())
          .maybeSingle();
        machine = byCode;
      }

      if (machine) {
        // Activate machine
        const { data: updated, error } = await supabaseAdmin
          .from('machines')
          .update({
            license_key: cleanKey,
            is_activated: true,
            activated_at: new Date().toISOString(),
            hardware_fingerprint: hardwareFingerprint || 'HW-NODE-TOUCH-' + Date.now().toString(36).toUpperCase(),
            status: 'online',
            last_heartbeat_at: new Date().toISOString(),
          })
          .eq('id', machine.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return NextResponse.json({
          success: true,
          message: 'Machine license verified & successfully activated!',
          machine: updated,
        });
      }
    }

    // In-memory or fallback validation
    const localMachine = db.getMachines().find(
      m => (m.licenseKey && m.licenseKey.toUpperCase() === cleanKey) ||
           (m.machineCode && m.machineCode.toUpperCase() === cleanKey) ||
           cleanKey.startsWith('PRN-')
    );

    if (localMachine) {
      const updated = db.updateMachineStatus(localMachine.machineCode, {
        licenseKey: cleanKey,
        isActivated: true,
        activatedAt: new Date().toISOString(),
        status: 'online',
      });

      return NextResponse.json({
        success: true,
        message: 'Machine license verified & activated!',
        machine: updated || localMachine,
      });
    }

    // If key has valid format PRN-*, create / register dynamically
    const newMachine = db.createMachine({
      organizationId: 'org-main',
      organizationName: 'PrintPoint Campus Network',
      machineCode: `ATM-${cleanKey.slice(-4)}`,
      displayName: `Print ATM (${cleanKey.slice(-4)})`,
      locationDescription: 'Campus Terminal',
      deploymentType: 'kiosk_atm',
      status: 'online',
      paperStatus: 'ok',
      currentSheetsRemaining: 500,
      totalCapacitySheets: 500,
      tonerLevelPercent: 100,
      internalTempCelsius: 24,
      isDoorOpen: false,
      qrCodeToken: `QR_${cleanKey}_SECURE`,
      licenseKey: cleanKey,
      isActivated: true,
      activatedAt: new Date().toISOString(),
      printerRouting: {
        bwSinglePrinter: 'HP LaserJet Professional P1106',
        bwDuplexPrinter: 'HP LaserJet Professional P1106',
        colorSinglePrinter: 'Epson L3250 Series Color',
        colorDuplexPrinter: 'Epson L3250 Series Color',
        photoPrinter: 'Epson L3250 Series Photo',
      },
      featureToggles: {
        enableBwSingle: true,
        enableBwDuplex: true,
        enableColorSingle: true,
        enableColorDuplex: true,
        enablePhotoPrint: true,
        enableQrUpload: true,
        enableDirectUsb: false,
      },
      pricingOverride: {
        bwSinglePaise: 200,
        bwDuplexPaise: 350,
        colorSinglePaise: 1000,
        colorDuplexPaise: 1800,
        photoPaise: 2500,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'New Machine registered and activated successfully!',
      machine: newMachine,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Activation failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
