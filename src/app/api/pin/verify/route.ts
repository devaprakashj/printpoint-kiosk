import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, machineCode } = body;

    if (!pin || String(pin).trim().length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 4-digit PIN' },
        { status: 400 }
      );
    }

    const cleanPin = String(pin).trim();
    let order: any = null;
    let machine: any = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      // 1. Fetch Target Machine if provided
      if (machineCode) {
        const { data: mData } = await supabaseAdmin
          .from('machines')
          .select('*')
          .eq('machine_code', machineCode.toUpperCase())
          .single();
        machine = mData;
      }

      // 2. Fetch Order by 4-digit PIN
      const { data: oData } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('four_digit_pin', cleanPin)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (oData) {
        if (oData.order_status === 'completed') {
          return NextResponse.json(
            { 
              success: false, 
              error: `Security Alert: PIN #${cleanPin} has already been used and fulfilled. Single-use PINs cannot be reused.` 
            },
            { status: 400 }
          );
        }
        if (oData.payment_status !== 'paid') {
          return NextResponse.json(
            { 
              success: false, 
              error: `Payment is still pending for PIN #${cleanPin}. Please complete the payment on your mobile first.` 
            },
            { status: 400 }
          );
        }
        if (new Date(oData.pin_expires_at).getTime() <= Date.now()) {
          return NextResponse.json(
            { 
              success: false, 
              error: `PIN #${cleanPin} has expired (PINs are valid for 24 hours). Please generate a fresh print order.` 
            },
            { status: 400 }
          );
        }

        order = {
          id: oData.id,
          orderNumber: oData.order_number,
          fileName: oData.file_name,
          fileSizeFormatted: oData.file_size_formatted,
          fileStorageUrl: oData.file_storage_url,
          detectedTotalPages: oData.detected_total_pages,
          selectedPageRanges: oData.selected_page_ranges,
          calculatedPrintPages: oData.calculated_print_pages,
          calculatedSheets: oData.calculated_sheets,
          copies: oData.copies,
          colorMode: oData.color_mode,
          duplexMode: oData.duplex_mode,
          paperSize: oData.paper_size,
          totalAmountRupees: `₹${(oData.total_amount_paise / 100).toFixed(2)}`,
          paymentStatus: oData.payment_status,
          orderStatus: oData.order_status,
          machineCode: oData.machine_code,
          fourDigitPin: oData.four_digit_pin,
        };
      }
    }

    if (!order) {
      const dbOrder = db.getOrderByPin(cleanPin) || db.findAnyOrderByPin(cleanPin);
      if (dbOrder) {
        if (dbOrder.orderStatus === 'completed') {
          return NextResponse.json(
            { 
              success: false, 
              error: `Security Alert: PIN #${cleanPin} has already been used and fulfilled. Single-use PINs cannot be reused.` 
            },
            { status: 400 }
          );
        }
        order = {
          ...dbOrder,
          totalAmountRupees: `₹${((dbOrder.totalAmountPaise || 200) / 100).toFixed(2)}`,
        };
      }
      if (machineCode && !machine) {
        machine = db.getMachineByCode(machineCode);
      }
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Invalid 4-digit PIN. Please check your payment receipt and try again.' },
        { status: 404 }
      );
    }

    // STRICT HARDWARE GUARD: Check physical paper stock before permitting print execution
    if (machine) {
      const requiredSheets = order.calculatedSheets || 1;
      const currentStock = machine.current_sheets_remaining ?? machine.currentSheetsRemaining ?? 500;
      const machineName = machine.display_name || machine.displayName || machineCode;

      if (currentStock < requiredSheets) {
        return NextResponse.json(
          {
            success: false,
            insufficientStock: true,
            requiredSheets,
            currentStock,
            machineName,
            error: `⚠️ Insufficient Paper in Kiosk: This print job requires ${requiredSheets} physical A4 sheets, but ${machineName} only has ${currentStock} sheets in the tray. Please use another nearby campus kiosk or request a paper refill. Your secret PIN #${cleanPin} remains 100% safe and valid.`,
          },
          { status: 400 }
        );
      }

      // Low Paper Alert to Manager if threshold reached
      const threshold = machine.low_paper_threshold || machine.lowPaperThreshold || 50;
      const managerPhone = machine.manager_phone || machine.managerPhone || '8667466390';
      if (currentStock <= threshold && managerPhone) {
        const { sendDirectWhatsAppMessage } = await import('@/lib/whatsapp');
        sendDirectWhatsAppMessage({
          phone: managerPhone,
          pin: 'ALERT',
          orderNumber: `LOW-PAPER-${machine.machine_code || machine.machineCode}`,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PIN Verified Successfully',
      order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
