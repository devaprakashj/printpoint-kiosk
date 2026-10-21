import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';
import { getDocumentDownloadUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      machineCode,
      daemonSecretToken,
      cpuTempCelsius,
      ramUsagePercent,
      attachedPrinters,
      currentSheetsRemaining,
      tonerLevelPercent,
      isDoorOpen,
      osPlatform,
      uptimeSeconds,
    } = body;

    if (!machineCode) {
      return NextResponse.json(
        { success: false, error: 'machineCode is required' },
        { status: 400 }
      );
    }

    const cleanCode = String(machineCode).trim().toUpperCase();
    console.log(`[HEARTBEAT RECEIVED] machine=${cleanCode}, osPlatform=${osPlatform}, token=${daemonSecretToken ? 'YES' : 'NO'}`);

    // STRICT CHECK: The kiosk web UI display screen is NOT a hardware Python daemon.
    // Only genuine Python / hardware daemons (with daemonSecretToken OR a real OS platform like Windows/Linux)
    // are allowed to register the machine as online!
    const isHardwareDaemon = Boolean(
      daemonSecretToken ||
      (osPlatform && osPlatform !== 'kiosk-terminal-display' && !osPlatform.toLowerCase().includes('browser'))
    );

    if (!isHardwareDaemon) {
      console.log(`[HEARTBEAT REJECTED] Not a hardware daemon: osPlatform=${osPlatform}`);
      return NextResponse.json({
        success: false,
        error: 'Only the physical hardware Python daemon can send heartbeat telemetry. Kiosk display screens cannot set machine to online.',
      }, { status: 403 });
    }

    const nowIso = new Date().toISOString();
    let targetMachine: any = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Find machine
      const { data: existing } = await supabaseAdmin
        .from('machines')
        .select('*')
        .eq('machine_code', cleanCode)
        .maybeSingle();

      if (existing) {
        targetMachine = existing;

        // Detect any physical printer hardware, ignoring virtual software spoolers (OneNote/PDF/Fax/XPS)
        const physicalPrinter = Array.isArray(attachedPrinters)
          ? attachedPrinters.find((p: any) => {
              const name = String(p.name || '');
              const isVirtual = /onenote|pdf|xps|fax|root print queue|microsoft print to pdf/i.test(name);
              return !isVirtual && Boolean(p.connected);
            }) || attachedPrinters[0]
          : null;
        
        const isPrinterConnected = Boolean(physicalPrinter?.connected);
        const printerStatusValue = isPrinterConnected ? 'connected' : 'offline';

        const isPowerOff = Boolean(body.powerOff || body.status === 'offline');

        const updateData: any = {
          status: isPowerOff ? 'offline' : 'online',
          last_heartbeat_at: isPowerOff ? new Date(0).toISOString() : nowIso,
          internal_temp_celsius: typeof cpuTempCelsius === 'number' ? cpuTempCelsius : existing.internal_temp_celsius || 28,
          toner_level_percent: typeof tonerLevelPercent === 'number' ? tonerLevelPercent : existing.toner_level_percent || 100,
          is_door_open: typeof isDoorOpen === 'boolean' ? isDoorOpen : false,
          active_printer_status: isPowerOff ? 'offline' : printerStatusValue,
        };

        if (physicalPrinter?.name && isPrinterConnected) {
          updateData.default_printer_model = physicalPrinter.name;
          updateData.printer_spooler_name = physicalPrinter.name;
          if (physicalPrinter.port) updateData.printer_port_or_ip = physicalPrinter.port;
        }

        if (typeof currentSheetsRemaining === 'number') {
          updateData.current_sheets_remaining = currentSheetsRemaining;
        }
        if (body.paperStatus) {
          updateData.paper_status = body.paperStatus;
        }

        await supabaseAdmin
          .from('machines')
          .update(updateData)
          .eq('id', existing.id);
      }
    }

    // Always update local in-memory DB as well
    const memMachine = db.getMachines().find(
      (m: any) => m.machineCode?.toUpperCase() === cleanCode
    );

    if (memMachine) {
      targetMachine = targetMachine || memMachine;
      const physicalPrinter = Array.isArray(attachedPrinters)
        ? attachedPrinters.find((p: any) => {
            const name = String(p.name || '');
            const isVirtual = /onenote|pdf|xps|fax|root print queue|microsoft print to pdf/i.test(name);
            return !isVirtual && Boolean(p.connected);
          }) || attachedPrinters[0]
        : null;
      const isPrinterConnected = Boolean(physicalPrinter?.connected);
      const isPowerOff = Boolean(body.powerOff || body.status === 'offline');

      db.updateMachineStatus(cleanCode, {
        status: isPowerOff ? 'offline' : 'online',
        lastHeartbeatAt: isPowerOff ? new Date(0).toISOString() : nowIso,
        internalTempCelsius: typeof cpuTempCelsius === 'number' ? cpuTempCelsius : 28,
        tonerLevelPercent: typeof tonerLevelPercent === 'number' ? tonerLevelPercent : 100,
        activePrinterStatus: isPowerOff ? 'offline' : (isPrinterConnected ? 'connected' : 'offline'),
        defaultPrinterModel: (isPrinterConnected && physicalPrinter?.name) ? physicalPrinter.name : memMachine.defaultPrinterModel,
        printerSpoolerName: (isPrinterConnected && physicalPrinter?.name) ? physicalPrinter.name : memMachine.printerSpoolerName,
        printerPortOrIp: physicalPrinter?.port || memMachine.printerPortOrIp || 'USB',
        ...(typeof currentSheetsRemaining === 'number' ? { currentSheetsRemaining } : {}),
        ...(body.paperStatus ? { paperStatus: body.paperStatus } : {}),
      });
    }

    // Dead-man switch: Mark any machine with heartbeat older than 75 seconds as 'offline'
    const cutoffTime = new Date(Date.now() - 75 * 1000).toISOString();
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin
        .from('machines')
        .update({ status: 'offline', active_printer_status: 'offline' })
        .lt('last_heartbeat_at', cutoffTime)
        .eq('status', 'online');
    }

    // Update in-memory machines dead-man switch
    const allMemMachines = db.getMachines();
    allMemMachines.forEach((m: any) => {
      if (m.lastHeartbeatAt && new Date(m.lastHeartbeatAt).getTime() < Date.now() - 75 * 1000) {
        m.status = 'offline';
        m.activePrinterStatus = 'offline';
      }
    });

    // Fetch any queued hardware print jobs for this machine ONLY if request is from the hardware daemon
    const pendingJobs = isHardwareDaemon ? db.popHardwareJobs(cleanCode) : [];

    // Also check Supabase for any orders marked as 'printing' for this machine (bridges localhost:3000 and Vercel)
    if (isHardwareDaemon && isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: supaPending } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('machine_code', cleanCode)
          .eq('order_status', 'printing')
          .order('created_at', { ascending: true })
          .limit(5);

        if (supaPending && supaPending.length > 0) {
          for (const ord of supaPending) {
            if (pendingJobs.some((j: any) => j.orderId === ord.id)) continue;
            let downloadUrl = '';
            if (ord.file_storage_url) {
              downloadUrl = await getDocumentDownloadUrl(ord.file_storage_url, 300);
            }
            pendingJobs.push({
              orderId: ord.id,
              orderNumber: ord.order_number,
              fileName: ord.file_name || 'Document.pdf',
              fileStorageUrl: ord.file_storage_url,
              downloadUrl: downloadUrl,
              pages: ord.calculated_print_pages || 1,
              sheets: ord.calculated_sheets || 1,
              copies: ord.copies || 1,
              colorMode: ord.color_mode || 'bw',
              duplexMode: ord.duplex_mode || 'single',
              paperSize: ord.paper_size || 'A4',
              pageRanges: ord.selected_page_ranges || 'all',
              pin: ord.four_digit_pin || 'N/A',
              releasedAt: ord.pin_used_at || new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn('[HEARTBEAT] Supabase pending jobs error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Heartbeat acknowledged for ${cleanCode}`,
      timestamp: nowIso,
      status: 'online',
      jobs: pendingJobs,
      config: {
        machineCode: cleanCode,
        displayName: targetMachine?.displayName || targetMachine?.display_name || cleanCode,
        supportsBw: targetMachine?.supports_bw ?? targetMachine?.featureToggles?.enableBwSingle ?? true,
        supportsColor: targetMachine?.supports_color ?? targetMachine?.featureToggles?.enableColorSingle ?? false,
        supportsDuplex: targetMachine?.supports_duplex ?? targetMachine?.duplexHardwareCapable ?? true,
        supportsPlainPaper: targetMachine?.supports_plain_paper ?? true,
        currentSheetsRemaining: targetMachine?.current_sheets_remaining ?? targetMachine?.currentSheetsRemaining ?? 500,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to process kiosk heartbeat';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
