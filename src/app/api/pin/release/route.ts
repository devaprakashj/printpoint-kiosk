import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { shredDocument, getDocumentDownloadUrl } from '@/lib/storage';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, pin, machineCode } = body;

    let order: any = null;
    let targetMachineCode = machineCode;
    const completedAt = new Date().toISOString();

    if (isSupabaseConfigured && supabaseAdmin) {
      let query = supabaseAdmin.from('orders').select('*');
      if (pin) {
        query = query.eq('four_digit_pin', String(pin).trim());
      } else if (orderId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
        if (isUuid) {
          query = query.eq('id', orderId);
        } else {
          query = query.eq('order_number', orderId);
        }
      }

      const { data: oData } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (oData) {
        order = oData;
        targetMachineCode = machineCode || oData.machine_code;

        // Set PIN as active/printing and used (Do not shred storage file yet; file is shredded upon hardware job-ack confirmation)
        await supabaseAdmin
          .from('orders')
          .update({
            order_status: 'printing',
            payment_status: 'paid',
            pin_used_at: completedAt,
          })
          .eq('id', oData.id);

        // Decrement machine paper count in Supabase
        if (targetMachineCode) {
          const { data: mData } = await supabaseAdmin
            .from('machines')
            .select('current_sheets_remaining')
            .eq('machine_code', targetMachineCode)
            .single();

          if (mData) {
            const newSheets = Math.max(0, (mData.current_sheets_remaining || 500) - (oData.calculated_sheets || 1));
            await supabaseAdmin
              .from('machines')
              .update({
                current_sheets_remaining: newSheets,
                paper_status: newSheets <= 50 ? (newSheets === 0 ? 'empty' : 'low') : 'ok',
              })
              .eq('machine_code', targetMachineCode);
          }
        }
      }
    }

    // Always update in-memory DB as well (set to 'printing', NOT 'completed' - completion waits for CUPS confirmation)
    const targetKey = order?.id || orderId || pin;
    if (targetKey) {
      db.updateOrderStatus(targetKey, 'printing', {
        paymentStatus: 'paid',
        pinUsedAt: completedAt,
      });
    }

    if (pin) {
      const memByPin = db.findAnyOrderByPin(pin);
      if (memByPin) {
        db.updateOrderStatus(memByPin.id, 'printing', {
          paymentStatus: 'paid',
          pinUsedAt: completedAt,
        });
      }
    }

    // Enqueue print job to real hardware daemon queue
    const finalOrder = order || (pin ? db.findAnyOrderByPin(pin) : db.getOrderById(targetKey));
    const targetMachine = targetMachineCode || finalOrder?.machineCode || 'RIT-ATM-01';

    const storagePath = finalOrder?.file_storage_url || finalOrder?.fileStorageUrl || '';
    let downloadUrl = '';
    if (storagePath) {
      try {
        downloadUrl = await getDocumentDownloadUrl(storagePath, 300);
      } catch {}
    }

    const jobPayload = {
      orderId: finalOrder?.id || `job-${Date.now()}`,
      orderNumber: finalOrder?.orderNumber || finalOrder?.order_number || (pin ? `PIN-${pin}` : `ORD-${Date.now()}`),
      fileName: finalOrder?.fileName || finalOrder?.file_name || 'Campus_Document.pdf',
      fileStorageUrl: storagePath,
      downloadUrl: downloadUrl,
      pages: finalOrder?.calculatedPrintPages || finalOrder?.calculated_print_pages || 1,
      sheets: finalOrder?.calculatedSheets || finalOrder?.calculated_sheets || 1,
      copies: finalOrder?.copies || 1,
      colorMode: finalOrder?.colorMode || finalOrder?.color_mode || 'bw',
      duplexMode: finalOrder?.duplexMode || finalOrder?.duplex_mode || 'single',
      paperSize: finalOrder?.paperSize || finalOrder?.paper_size || 'A4',
      pin: pin || 'N/A',
      releasedAt: completedAt,
    };

    db.enqueueHardwareJob(targetMachine, jobPayload);
    db.setHardwareJobStatus(jobPayload.orderId, 'spooling', 'Dispatched to CUPS print daemon');
    if (jobPayload.orderNumber) db.setHardwareJobStatus(jobPayload.orderNumber, 'spooling', 'Dispatched to CUPS print daemon');
    if (pin) db.setHardwareJobStatus(String(pin).trim(), 'spooling', 'Dispatched to CUPS print daemon');

    // Notify live kiosk UI screen of the scanned active order
    db.setMachineLiveActiveOrder(targetMachine, {
      id: finalOrder?.id || jobPayload.orderId,
      orderNumber: jobPayload.orderNumber,
      fileName: jobPayload.fileName,
      pages: jobPayload.pages,
      sheets: jobPayload.sheets,
      copies: jobPayload.copies,
      colorMode: jobPayload.colorMode,
      duplexMode: jobPayload.duplexMode,
      paperSize: jobPayload.paperSize,
      fourDigitPin: pin || finalOrder?.fourDigitPin || finalOrder?.four_digit_pin,
      totalAmountPaise: finalOrder?.totalAmountPaise || finalOrder?.total_amount_paise || (jobPayload.sheets * 200),
      orderStatus: 'printing',
      releasedAt: completedAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Print job dispatched to CUPS hardware spooler. Printing in progress.',
      orderId: order?.id || orderId,
      orderStatus: 'printing',
      deliveryConfirmed: false,
      secureFileShredded: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
