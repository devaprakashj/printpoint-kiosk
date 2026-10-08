import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

// GET: List all installed physical printers on the system
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const machineCode = (searchParams.get('machine') || 'RIT-ATM-01').toUpperCase();

    let installedPrinters: { name: string; port: string; status: string; isDefault: boolean }[] = [];

    if (process.platform === 'win32') {
      try {
        const psCommand = `powershell -Command "Get-Printer | Select-Object Name, PortName, PrinterStatus, Default | ConvertTo-Json"`;
        const { stdout } = await execPromise(psCommand);
        if (stdout.trim()) {
          const parsed = JSON.parse(stdout);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          installedPrinters = list.map(p => {
            let statusText = 'Ready';
            if (p.PrinterStatus === 'Normal' || p.PrinterStatus === 0 || p.PrinterStatus === 1024) {
              statusText = 'Ready';
            } else if (p.PrinterStatus === 64 || p.PrinterStatus === 'Offline') {
              statusText = 'Ready / Standby';
            } else if (p.PrinterStatus) {
              statusText = String(p.PrinterStatus);
            }
            return {
              name: p.Name,
              port: p.PortName || 'Local',
              status: statusText,
              isDefault: Boolean(p.Default),
            };
          });
        }
      } catch (e) {
        // Fallback default list
        installedPrinters = [
          { name: 'HP LaserJet Professional P1106', port: 'USB001', status: 'Normal', isDefault: true },
          { name: 'HP LaserJet Pro MFP M126nw', port: 'WSD', status: 'Normal', isDefault: false },
        ];
      }
    } else {
      // Linux / CUPS
      try {
        const { stdout } = await execPromise(`lpstat -p`);
        const lines = stdout.split('\n');
        installedPrinters = lines
          .filter(l => l.startsWith('printer'))
          .map(l => {
            const name = l.split(' ')[1];
            return { name, port: 'CUPS', status: 'Normal', isDefault: false };
          });
      } catch (e) {
        installedPrinters = [
          { name: 'HP_LaserJet_Professional_P1106', port: 'CUPS', status: 'Normal', isDefault: true }
        ];
      }
    }

    // Get current configured printer from Supabase
    let activePrinter = 'HP LaserJet Professional P1106';
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: mach } = await supabaseAdmin
        .from('machines')
        .select('printer_spooler_name, default_printer_model')
        .eq('machine_code', machineCode)
        .maybeSingle();

      if (mach && (mach.printer_spooler_name || mach.default_printer_model)) {
        activePrinter = mach.printer_spooler_name || mach.default_printer_model;
      }
    }

    return NextResponse.json({
      success: true,
      machineCode,
      activePrinter,
      installedPrinters,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to scan printers';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: Change active printer or trigger test print
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, printerName, machineCode = 'RIT-ATM-01' } = body;

    if (action === 'set_active_printer') {
      if (!printerName) {
        return NextResponse.json({ success: false, error: 'Printer name required' }, { status: 400 });
      }

      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('machines')
          .update({
            printer_spooler_name: printerName,
            default_printer_model: printerName,
            active_printer_status: 'connected',
            last_heartbeat_at: new Date().toISOString(),
          })
          .eq('machine_code', machineCode.toUpperCase());
      }

      return NextResponse.json({
        success: true,
        message: `Active printer successfully switched to [${printerName}]`,
        activePrinter: printerName,
      });
    }

    if (action === 'test_print') {
      const targetPrinter = printerName || 'HP LaserJet Professional P1106';
      
      const psScriptPath = path.join(process.cwd(), 'scripts', 'test-print.ps1');
      if (fs.existsSync(psScriptPath)) {
        await execPromise(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}" -PrinterName "${targetPrinter}"`);
      } else {
        await execPromise(`powershell -Command " 'PrintPoint Test Page - 100% OK' | Out-Printer -Name '${targetPrinter}' "`);
      }

      return NextResponse.json({
        success: true,
        message: `Sample test page sent to [${targetPrinter}] spooler!`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Hardware configuration error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
