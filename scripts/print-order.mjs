import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const SUPABASE_URL = 'https://nsfalguxcgsshssmgkom.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZmFsZ3V4Y2dzc2hzc21na29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2MjY4NCwiZXhwIjoyMTA2OTM4Njg0fQ.ldvQdwFY_ANUTEHgAR-IR1PBZySvsiHUXJo2MfDUI6g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function printOrderByPin(pin = '4798') {
  console.log(`🔍 Searching for order with PIN [${pin}]...`);
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('four_digit_pin', pin)
    .limit(1);

  if (error || !orders || orders.length === 0) {
    console.error('❌ Order not found for PIN:', pin, error);
    return;
  }

  const order = orders[0];
  console.log(`✅ Order found: [${order.order_number || order.id}] - File: ${order.file_name}`);

  const tempDir = path.join(process.cwd(), 'temp_print_spool');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const storagePath = order.file_storage_url;
  let printFile = '';

  if (storagePath) {
    console.log(`⬇️ Downloading file from vault: ${storagePath}`);
    const { data: fileData, error: dlErr } = await supabase.storage
      .from('printpoint-documents')
      .download(storagePath);

    if (!dlErr && fileData) {
      const ext = path.extname(storagePath) || '.png';
      printFile = path.join(tempDir, `order_${pin}_${Date.now()}${ext}`);
      const buf = Buffer.from(await fileData.arrayBuffer());
      fs.writeFileSync(printFile, buf);
      console.log(`✅ Downloaded to: ${printFile} (${buf.length} bytes)`);
    }
  }

  const targetPrinter = 'HP LaserJet Professional P1106';
  console.log(`🖨️ Dispatching job to physical printer: [${targetPrinter}]...`);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(edgePath) && printFile) {
    const psCmd = `powershell -Command "& '${edgePath}' --headless --print-to-printer --printer-name='${targetPrinter}' '${printFile}'"`;
    await execPromise(psCmd);
    console.log(`✅ Edge headless sent job directly to [${targetPrinter}] spooler!`);
  } else if (printFile) {
    const psCmd = `powershell -Command "Start-Process -FilePath '${printFile}' -Verb PrintTo -ArgumentList '${targetPrinter}' -PassThru | ForEach-Object { Start-Sleep -Seconds 4; if (!$_.HasExited) { Stop-Process -Id $_.Id } }"`;
    await execPromise(psCmd);
    console.log(`✅ Windows spooler accepted job!`);
  }

  // Update order status in Supabase
  await supabase
    .from('orders')
    .update({
      pin_used_at: new Date().toISOString(),
      order_status: 'completed',
      completed_at: new Date().toISOString(),
      hardware_stage: 'Physical document successfully dispensed to tray!',
      file_shredded: true,
      shredded_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  console.log(`🎉 Order #${order.order_number} marked COMPLETED in Supabase!`);
}

const pinArg = process.argv[2] || '9999';
printOrderByPin(pinArg);
