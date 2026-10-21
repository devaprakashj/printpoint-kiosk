import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { pin, orderId, orderNumber, qrData, machineCode } = body;

    // Parse qrData if provided
    if (qrData) {
      const trimmed = String(qrData).trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.orderId) orderId = parsed.orderId;
          if (parsed.orderNumber) orderNumber = parsed.orderNumber;
          if (parsed.pin || parsed.fourDigitPin) pin = parsed.pin || parsed.fourDigitPin;
        } catch {}
      } else if (trimmed.includes('pin=')) {
        try {
          const url = new URL(trimmed, 'http://localhost');
          pin = url.searchParams.get('pin');
        } catch {}
      } else if (/^\d{4}$/.test(trimmed)) {
        pin = trimmed;
      } else if (trimmed.startsWith('ord_') || trimmed.startsWith('ord-')) {
        orderId = trimmed;
      } else if (trimmed.startsWith('PP') || trimmed.startsWith('ORD-')) {
        orderNumber = trimmed;
      }
    }

    if (!pin && !orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Invalid QR Pass. No order identifier found.' },
        { status: 400 }
      );
    }

    const cleanPin = pin ? String(pin).trim() : '';
    const cleanOrderId = orderId ? String(orderId).trim() : '';
    const cleanOrderNumber = orderNumber ? String(orderNumber).trim() : '';

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

      // 2. Fetch Order by ID, Order Number, or 4-digit PIN
      let query = supabaseAdmin.from('orders').select('*');
      if (cleanOrderId) {
        query = query.eq('id', cleanOrderId);
      } else if (cleanOrderNumber) {
        query = query.eq('order_number', cleanOrderNumber);
      } else if (cleanPin) {
        query = query.eq('four_digit_pin', cleanPin);
      }

      const { data: oData } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (oData) {
        if (oData.order_status === 'completed') {
          return NextResponse.json(
            { 
              success: false, 
              alreadyUsed: true,
              order: oData,
              error: `Security Alert: PIN #${cleanPin} has already been used and fulfilled. Single-use PINs cannot be reused.` 
            },
            { status: 400 }
          );
        }
        // payment_status 'paid' is the correct column value after payment verification
        // order_status can be 'paid_ready_to_print', 'printing', etc.
        const isPaid = oData.payment_status === 'paid';
        const isReadyOrPrinting = ['paid_ready_to_print', 'printing', 'created'].includes(oData.order_status || '');
        if (!isPaid && !isReadyOrPrinting) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Payment is still pending for order #${oData.order_number || cleanPin}. Please complete the payment on your mobile first.` 
            },
            { status: 400 }
          );
        }
        // Only check expiry if pin_expires_at is actually set and valid
        if (oData.pin_expires_at) {
          const expiryTime = new Date(oData.pin_expires_at).getTime();
          if (!isNaN(expiryTime) && expiryTime > 0 && expiryTime <= Date.now()) {
            return NextResponse.json(
              { 
                success: false, 
                error: `QR Pass has expired (valid for 24 hours from order time). Please generate a new print order.` 
              },
              { status: 400 }
            );
          }
        }

        const totalPaise = oData.total_amount_paise || 200;
        const totalRupeesStr = (totalPaise % 100 === 0) ? `${totalPaise / 100}` : (totalPaise / 100).toFixed(2);
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
          copies: oData.copies || 1,
          colorMode: oData.color_mode,
          duplexMode: oData.duplex_mode,
          paperSize: oData.paper_size,
          amount: totalRupeesStr,
          totalAmountPaise: totalPaise,
          totalAmountRupees: `₹${totalRupeesStr}`,
          paymentStatus: oData.payment_status,
          orderStatus: oData.order_status,
          machineCode: oData.machine_code,
          fourDigitPin: oData.four_digit_pin,
        };
      }
    }

    if (!order) {
      let dbOrder: any = null;
      if (cleanOrderId) {
        dbOrder = db.getOrderById(cleanOrderId);
      } else if (cleanOrderNumber) {
        dbOrder = db.getOrderById(cleanOrderNumber);
      } else if (cleanPin) {
        dbOrder = db.getOrderByPin(cleanPin) || db.findAnyOrderByPin(cleanPin);
      }

      if (dbOrder) {
        if (dbOrder.orderStatus === 'completed') {
          return NextResponse.json(
            { 
              success: false, 
              error: `Security Alert: This print pass has already been used and fulfilled. Single-use passes cannot be reused.` 
            },
            { status: 400 }
          );
        }
        const memPaise = dbOrder.totalAmountPaise || 200;
        const memRupeesStr = (memPaise % 100 === 0) ? `${memPaise / 100}` : (memPaise / 100).toFixed(2);
        order = {
          ...dbOrder,
          copies: dbOrder.copies || 1,
          amount: memRupeesStr,
          totalAmountPaise: memPaise,
          totalAmountRupees: `₹${memRupeesStr}`,
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

    // STRICT HARDWARE GUARD: Check physical paper stock, online status & capability before permitting print execution
    if (machine) {
      const machineName = machine.display_name || machine.displayName || machineCode;
      const status = machine.status || 'online';

      // 1. Machine Status Check
      if (status === 'offline' || status === 'maintenance') {
        return NextResponse.json(
          {
            success: false,
            machineOffline: true,
            machineName,
            error: `⚠️ Kiosk Unavailable: ${machineName} is currently ${status === 'maintenance' ? 'under maintenance' : 'offline/powered off'}. You can release your secret PIN #${cleanPin} at any other online campus kiosk. Your PIN is 100% safe!`,
          },
          { status: 400 }
        );
      }

      // 2. Capability Matching Check (Color vs B&W Follow-Me Protection)
      const supportsColor = machine.supports_color ?? machine.featureToggles?.enableColorSingle ?? false;
      if (order.colorMode === 'color' && !supportsColor) {
        return NextResponse.json(
          {
            success: false,
            colorMismatch: true,
            machineName,
            error: `⚠️ Color Print Notice: Your order is configured for FULL COLOR, but ${machineName} is equipped with a High-Speed B&W Laser Printer only. Please release this PIN at a Color-capable kiosk (e.g. Library Hub). Your PIN #${cleanPin} is safe and has not been used!`,
          },
          { status: 400 }
        );
      }

      // 3. Physical Paper Tray Stock Guard
      const requiredSheets = order.calculatedSheets || 1;
      const currentStock = machine.current_sheets_remaining ?? machine.currentSheetsRemaining ?? 500;

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
