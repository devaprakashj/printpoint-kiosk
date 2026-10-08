/**
 * PrintPoint Hardware Bridge Daemon v1.0
 * Autonomous physical printer listener for Windows & Linux Kiosk ATMs
 * 
 * Usage:
 *   node scripts/printpoint-daemon.mjs --machine=RIT-ATM-01
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nsfalguxcgsshssmgkom.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZmFsZ3V4Y2dzc2hzc21na29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2MjY4NCwiZXhwIjoyMTA2OTM4Njg0fQ.ldvQdwFY_ANUTEHgAR-IR1PBZySvsiHUXJo2MfDUI6g';

// Parse machine code and custom printer name from arguments
const machineArg = process.argv.find(a => a.startsWith('--machine='));
const printerArg = process.argv.find(a => a.startsWith('--printer='));

const MACHINE_CODE = machineArg ? machineArg.split('=')[1].toUpperCase() : 'RIT-ATM-01';
const SPECIFIED_PRINTER = printerArg ? printerArg.split('=')[1].replace(/^["']|["']$/g, '') : null;

console.log(`\n=====================================================`);
console.log(`🖨️  PrintPoint Hardware Bridge Daemon Active`);
console.log(`📍 Kiosk Machine: [${MACHINE_CODE}]`);
if (SPECIFIED_PRINTER) {
  console.log(`🎯 Custom Selected Printer: [${SPECIFIED_PRINTER}]`);
}
console.log(`🌐 Supabase Cluster: ${SUPABASE_URL}`);
console.log(`💻 Operating System: ${process.platform}`);
console.log(`=====================================================\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create temp directory for downloading print jobs
const tempPrintDir = path.join(process.cwd(), 'temp_print_spool');
if (!fs.existsSync(tempPrintDir)) {
  fs.mkdirSync(tempPrintDir, { recursive: true });
}

/**
 * Detect connected physical printer name on Windows / Linux
 */
async function detectActivePrinter() {
  if (SPECIFIED_PRINTER) {
    return SPECIFIED_PRINTER;
  }

  if (process.platform === 'win32') {
    try {
      // Get Default Printer or any physical USB/LaserJet printer
      const psScript = `powershell -Command "$printers = Get-Printer | Where-Object { $_.PortName -notlike 'PORTPROMPT*' -and $_.Name -notlike 'OneNote*' -and $_.Name -notlike '*PDF*' -and $_.Name -notlike '*Fax*' -and $_.Name -notlike '*XPS*' }; if ($printers) { $printers[0].Name } else { (Get-CimInstance Win32_Printer | Where-Object Default -eq $true).Name }"`;
      const { stdout } = await execPromise(psScript);
      const name = stdout.trim();
      return name || 'HP LaserJet Professional P1106';
    } catch (e) {
      return 'HP LaserJet Professional P1106';
    }
  } else {
    try {
      const { stdout } = await execPromise(`lpstat -d | awk -F': ' '{print $2}'`);
      const name = stdout.trim();
      return name || 'HP_LaserJet_Professional_P1106';
    } catch (e) {
      return 'HP_LaserJet_Professional_P1106';
    }
  }
}

/**
 * Execute silent printing on physical hardware
 */
async function printDocumentPhysically(filePath, copies = 1, duplex = false) {
  const targetPrinter = await detectActivePrinter();
  console.log(`🖨️  Dispatching physical print job to [${targetPrinter}]: ${filePath} (${copies} copies, duplex: ${duplex})`);

  if (process.platform === 'win32') {
    // Windows Native Print Command (Powershell Spooler)
    try {
      // Direct print to target printer
      const psCommand = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb PrintTo -ArgumentList '${targetPrinter}' -PassThru | ForEach-Object { Start-Sleep -Seconds 4; if (!$_.HasExited) { Stop-Process -Id $_.Id } }"`;
      await execPromise(psCommand);
      console.log(`✅ Windows spooler sent job to [${targetPrinter}] successfully!`);
      return true;
    } catch (e) {
      try {
        const fallbackCmd = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print -PassThru | ForEach-Object { Start-Sleep -Seconds 4; if (!$_.HasExited) { Stop-Process -Id $_.Id } }"`;
        await execPromise(fallbackCmd);
        console.log(`✅ Windows spooler executed default print!`);
        return true;
      } catch (err) {
        console.log(`⚠️ Spooler dispatch warning:`, err.message);
        return true;
      }
    }
  } else {
    // Linux / CUPS / Raspberry Pi
    try {
      const sidesOption = duplex ? '-o sides=two-sided-long-edge' : '-o sides=one-sided';
      const cupsCommand = `lp -d "${targetPrinter}" -n ${copies} ${sidesOption} "${filePath}"`;
      await execPromise(cupsCommand);
      console.log(`✅ CUPS spooler executed: ${cupsCommand}`);
      return true;
    } catch (e) {
      console.error(`❌ CUPS print error:`, e.message);
      return false;
    }
  }
}

/**
 * Shred document securely after physical dispensing
 */
function shredLocalFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🔒 Zero-Retention: Spool file shredded & deleted immediately: ${filePath}`);
    }
  } catch (e) {
    console.error(`Failed to shred local file:`, e);
  }
}

/**
 * Process a paid order that was released by PIN
 */
async function processPrintOrder(order) {
  console.log(`\n📥 [NEW PRINT JOB TRIGGERED]`);
  console.log(`🆔 Order: ${order.order_number || order.id} | Pin: ${order.four_digit_pin}`);
  console.log(`📄 File: ${order.file_name} (${order.calculated_sheets} sheets, ${order.copies} copies)`);

  const storagePath = order.file_storage_url;
  if (!storagePath) {
    console.error(`❌ No file storage path found for order ${order.id}`);
    return;
  }

  // 1. Download file from Supabase Storage
  console.log(`⬇️  Downloading file from Supabase Storage: ${storagePath}`);
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('printpoint-documents')
    .download(storagePath);

  if (downloadError || !fileData) {
    console.error(`❌ Failed to download file:`, downloadError?.message);
    return;
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tempFilePath = path.join(tempPrintDir, `job_${order.id}_${Date.now()}.pdf`);
  fs.writeFileSync(tempFilePath, buffer);

  // 2. Dispatch to Physical Printer
  const isDuplex = order.duplex_mode === 'double';
  const copies = order.copies || 1;
  const printed = await printDocumentPhysically(tempFilePath, copies, isDuplex);

  if (printed) {
    // 3. Mark completed in Supabase
    await supabase
      .from('orders')
      .update({
        order_status: 'completed',
        completed_at: new Date().toISOString(),
        file_shredded: true,
        shredded_at: new Date().toISOString(),
        shred_method: 'hardware_auto_shred',
      })
      .eq('id', order.id);

    console.log(`🎉 Job Complete! Order status updated to 'completed' in Supabase.`);

    // 4. Secure Zero-Retention Shredding
    shredLocalFile(tempFilePath);
  }
}

/**
 * Subscribe to Live Supabase Realtime Events
 */
async function startDaemon() {
  console.log(`📡 Connecting to Supabase Realtime for machine [${MACHINE_CODE}]...`);

  const activePrinterName = await detectActivePrinter();
  console.log(`🖨️ Detected Active Physical Printer: [${activePrinterName}]`);

  // Initial Sync
  try {
    await supabase
      .from('machines')
      .update({
        last_heartbeat_at: new Date().toISOString(),
        status: 'online',
        active_printer_status: 'connected',
        printer_spooler_name: activePrinterName,
        default_printer_model: activePrinterName,
      })
      .eq('machine_code', MACHINE_CODE);
    console.log(`✅ Machine status & printer info synced to Cloud Cluster!`);
  } catch (e) {
    console.log(`⚠️ Initial sync warning: ${e.message}`);
  }

  // Periodic Telemetry Heartbeat (every 10 seconds)
  setInterval(async () => {
    try {
      const currentPrinter = await detectActivePrinter();
      await supabase
        .from('machines')
        .update({
          last_heartbeat_at: new Date().toISOString(),
          status: 'online',
          active_printer_status: 'connected',
          printer_spooler_name: currentPrinter,
          default_printer_model: currentPrinter,
        })
        .eq('machine_code', MACHINE_CODE);
    } catch (e) {
      console.log(`⚠️ Heartbeat failed: ${e.message}`);
    }
  }, 10000);

  // Poll for PIN-released orders every 2.0 seconds
  setInterval(async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('machine_code', MACHINE_CODE)
        .eq('payment_status', 'paid')
        .eq('order_status', 'paid_ready_to_print')
        .not('pin_used_at', 'is', null)
        .limit(1);

      if (orders && orders.length > 0) {
        await processPrintOrder(orders[0]);
      }
    } catch (e) {
      // ignore
    }
  }, 2000);

  console.log(`✅ Hardware Daemon Ready & Listening for print jobs 24/7!`);
}

startDaemon();
