import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { calculateOrderPrice } from '@/lib/pricingEngine';
import { ColorMode, DuplexMode } from '@/lib/types';
import { createRazorpayOrder } from '@/lib/razorpay';

export interface DocumentInput {
  name?: string;
  pages?: number;
  copies?: number;
  colorMode?: 'bw' | 'color';
  duplexMode?: 'simplex' | 'duplex';
  selectedPagesCount?: number;
  pageRangeStr?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      machineCode = 'RIT-ATM-01',
      documents = [],
      fileName = 'Document.pdf',
      fileSizeFormatted = '1.2 MB',
      totalPages = 1,
      pageRangeStr = 'all',
      copies = 1,
      colorMode = 'bw',
      duplexMode = 'simplex',
      customerPhone = '',
      customerName = '',
    } = body;

    let machine: any = null;
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: mData } = await supabaseAdmin
        .from('machines')
        .select('*')
        .eq('machine_code', String(machineCode).toUpperCase())
        .maybeSingle();
      if (mData) {
        machine = {
          id: mData.id,
          organizationId: mData.organization_id || 'default',
          machineCode: mData.machine_code,
          displayName: mData.display_name,
        };

        // STRICT OPERATIONAL CHECK: Machine MUST be online and NOT in maintenance
        const isHeartbeatFresh = Boolean(
          mData.last_heartbeat_at &&
          (Date.now() - new Date(mData.last_heartbeat_at).getTime() < 75000)
        );

        if (mData.status === 'maintenance') {
          return NextResponse.json({
            success: false,
            error: 'This Print ATM kiosk is currently under maintenance. Orders are temporarily paused.',
          }, { status: 400 });
        }

        if (!isHeartbeatFresh || mData.status === 'offline') {
          return NextResponse.json({
            success: false,
            error: 'This Print ATM kiosk is currently unavailable. Orders are temporarily paused. Please check back shortly or choose another kiosk.',
          }, { status: 400 });
        }

        if ((mData.current_sheets_remaining ?? 500) <= 0 || mData.paper_status === 'empty') {
          return NextResponse.json({
            success: false,
            error: 'Print ATM paper tray is empty. Please contact campus coordinator to refill paper.',
          }, { status: 400 });
        }

        // HARDWARE CAPABILITY ENFORCEMENT
        if (mData.supports_color === false) {
          const hasColor = Array.isArray(documents) && documents.some((d: any) => d.colorMode === 'color');
          if (hasColor || colorMode === 'color') {
            return NextResponse.json({
              success: false,
              error: 'Color printing is currently disabled by admin on this kiosk station.',
            }, { status: 400 });
          }
        }

        if (mData.supports_duplex === false) {
          const hasDuplex = Array.isArray(documents) && documents.some((d: any) => d.duplexMode === 'duplex');
          if (hasDuplex || duplexMode === 'duplex') {
            return NextResponse.json({
              success: false,
              error: 'Duplex (double-sided) printing is currently disabled on this kiosk station.',
            }, { status: 400 });
          }
        }

        if (mData.supports_bw === false) {
          const hasBw = Array.isArray(documents) && documents.some((d: any) => d.colorMode === 'bw');
          if (hasBw || colorMode === 'bw') {
            return NextResponse.json({
              success: false,
              error: 'B&W laser printing is currently disabled on this kiosk station.',
            }, { status: 400 });
          }
        }
      }
    }

    if (!machine) {
      machine = db.getMachineByCode(machineCode) || {
        id: 'mach-default',
        organizationId: 'default',
        machineCode: String(machineCode || 'RIT-ATM-01').toUpperCase(),
        displayName: 'PrintPoint Kiosk ATM',
      };
    }

    const pricingRule = db.getPricingRule(machine.organizationId, machine.id);

    let grandTotalPrintPages = 0;
    let grandTotalSheets = 0;
    let grandTotalPaise = 0;
    let primaryFileName = fileName;

    // Support both multi-document array and legacy single document payload
    if (Array.isArray(documents) && documents.length > 0) {
      primaryFileName = documents.map((d: DocumentInput) => d.name || 'Document.pdf').join(', ');
      
      documents.forEach((doc: DocumentInput) => {
        const docPages = Math.max(1, Math.min(1000, Math.floor(Number(doc.pages) || 1)));
        const effectivePages = doc.selectedPagesCount && doc.selectedPagesCount > 0 
          ? Math.min(docPages, Math.floor(Number(doc.selectedPagesCount)))
          : docPages;
        const docCopies = Math.max(1, Math.min(100, Math.floor(Number(doc.copies) || 1)));
        const docColor: ColorMode = doc.colorMode === 'color' ? 'color' : 'bw';
        const docDuplex: DuplexMode = doc.duplexMode === 'duplex' ? 'duplex' : 'simplex';

        const calc = calculateOrderPrice({
          pricingRule,
          totalPages: effectivePages,
          pageRangeStr: doc.pageRangeStr || 'all',
          copies: docCopies,
          colorMode: docColor,
          duplexMode: docDuplex,
        });

        grandTotalPrintPages += calc.totalPrintPages;
        grandTotalSheets += calc.totalSheets;
        grandTotalPaise += calc.totalAmountPaise;
      });
    } else {
      const sanitizedPages = Math.max(1, Math.min(1000, Math.floor(Number(totalPages) || 1)));
      const sanitizedCopies = Math.max(1, Math.min(100, Math.floor(Number(copies) || 1)));
      const sanitizedColor: ColorMode = colorMode === 'color' ? 'color' : 'bw';
      const sanitizedDuplex: DuplexMode = duplexMode === 'duplex' ? 'duplex' : 'simplex';

      const priceCalc = calculateOrderPrice({
        pricingRule,
        totalPages: sanitizedPages,
        pageRangeStr: String(pageRangeStr || 'all'),
        copies: sanitizedCopies,
        colorMode: sanitizedColor,
        duplexMode: sanitizedDuplex,
      });

      grandTotalPrintPages = priceCalc.totalPrintPages;
      grandTotalSheets = priceCalc.totalSheets;
      grandTotalPaise = priceCalc.totalAmountPaise;
    }

    // Minimum charge is 100 paise (₹1) as enforced by Razorpay
    const finalAmountPaise = Math.max(100, grandTotalPaise);

    // Generate secure 4-digit PIN (1000 - 9999)
    const fourDigitPin = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    const pinExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity

    const tempOrderId = `ord_${Date.now()}`;

    // Create real Razorpay order on Razorpay servers with the SERVER-CALCULATED amount
    const rzpOrder = await createRazorpayOrder({
      amountPaise: finalAmountPaise,
      receipt: tempOrderId,
      notes: {
        machineCode: machine.machineCode,
        machineName: machine.displayName,
        fileName: String(primaryFileName).substring(0, 30),
      },
    });

    const paymentGatewayOrderId = rzpOrder ? rzpOrder.id : `order_mock_${Date.now()}`;
    const orderNumber = `ORD-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    let newOrder: any = null;

    // Resolve primary print parameters from documents payload (or top-level fallbacks)
    const firstDoc = Array.isArray(documents) && documents.length > 0 ? documents[0] : null;
    const resolvedCopies = firstDoc?.copies ? Math.max(1, Number(firstDoc.copies)) : Math.max(1, Number(copies) || 1);
    const resolvedColorMode: ColorMode = (firstDoc?.colorMode || colorMode) === 'color' ? 'color' : 'bw';
    const resolvedDuplexMode: DuplexMode = (firstDoc?.duplexMode || duplexMode) === 'duplex' ? 'duplex' : 'simplex';
    const resolvedPageRanges = String(firstDoc?.pageRangeStr || pageRangeStr || 'all').trim();

    if (isSupabaseConfigured && supabaseAdmin) {
      const insertPayload: any = {
        order_number: orderNumber,
        machine_code: machine.machineCode,
        machine_name: machine.displayName,
        customer_phone: customerPhone ? String(customerPhone).trim().substring(0, 15) : undefined,
        file_name: String(primaryFileName),
        file_size_formatted: String(fileSizeFormatted),
        detected_total_pages: grandTotalPrintPages,
        selected_page_ranges: resolvedPageRanges,
        calculated_print_pages: grandTotalPrintPages,
        calculated_sheets: grandTotalSheets,
        copies: resolvedCopies,
        color_mode: resolvedColorMode,
        duplex_mode: resolvedDuplexMode,
        paper_size: 'A4',
        price_per_sheet_paise: grandTotalSheets > 0 ? Math.round(finalAmountPaise / grandTotalSheets) : 200,
        subtotal_paise: finalAmountPaise,
        tax_paise: 0,
        total_amount_paise: finalAmountPaise,
        four_digit_pin: fourDigitPin,
        pin_expires_at: pinExpiresAt,
        payment_status: 'pending',
        order_status: 'created',
        payment_gateway_order_id: paymentGatewayOrderId,
      };

      if (customerName) {
        insertPayload.customer_name = String(customerName).trim().substring(0, 50);
        insertPayload.customer_email = String(customerName).trim().substring(0, 50);
      }

      let insData: any = null;
      let insErr: any = null;

      const res = await supabaseAdmin.from('orders').insert(insertPayload).select().single();
      insData = res.data;
      insErr = res.error;

      // If failed due to customer_name column missing, retry with customer_email where name is stored
      if (insErr && insertPayload.customer_name) {
        delete insertPayload.customer_name;
        const retryRes = await supabaseAdmin.from('orders').insert(insertPayload).select().single();
        insData = retryRes.data;
        insErr = retryRes.error;
      }

      if (!insErr && insData) {
        const resolvedCustomerName = insData.customer_name || insData.customer_email || (customerName ? String(customerName).trim() : 'Customer');
        newOrder = {
          id: insData.id,
          orderNumber: insData.order_number,
          machineCode: insData.machine_code,
          machineName: insData.machine_name,
          customerPhone: insData.customer_phone,
          customerName: resolvedCustomerName,
          fileName: insData.file_name,
          fileSizeFormatted: insData.file_size_formatted,
          detectedTotalPages: insData.detected_total_pages,
          selectedPageRanges: insData.selected_page_ranges,
          calculatedPrintPages: insData.calculated_print_pages,
          calculatedSheets: insData.calculated_sheets,
          copies: insData.copies,
          colorMode: insData.color_mode,
          duplexMode: insData.duplex_mode,
          paperSize: insData.paper_size,
          pricePerSheetPaise: insData.price_per_sheet_paise,
          subtotalPaise: insData.subtotal_paise,
          taxPaise: insData.tax_paise,
          totalAmountPaise: insData.total_amount_paise,
          fourDigitPin: insData.four_digit_pin,
          pinExpiresAt: insData.pin_expires_at,
          paymentStatus: insData.payment_status,
          orderStatus: insData.order_status,
          paymentGatewayOrderId: insData.payment_gateway_order_id,
          createdAt: insData.created_at,
        };
      }
    }

    if (!newOrder) {
      newOrder = db.createOrder({
        organizationId: machine.organizationId,
        machineId: machine.id,
        machineCode: machine.machineCode,
        machineName: machine.displayName,
        customerPhone: customerPhone ? String(customerPhone).trim().substring(0, 15) : undefined,
        customerName: customerName ? String(customerName).trim().substring(0, 50) : 'Student',
        fileName: String(primaryFileName),
        fileSizeFormatted: String(fileSizeFormatted),
        detectedTotalPages: grandTotalPrintPages,
        selectedPageRanges: resolvedPageRanges,
        calculatedPrintPages: grandTotalPrintPages,
        calculatedSheets: grandTotalSheets,
        copies: resolvedCopies,
        colorMode: resolvedColorMode,
        duplexMode: resolvedDuplexMode,
        paperSize: 'A4',
        pricePerSheetPaise: grandTotalSheets > 0 ? Math.round(finalAmountPaise / grandTotalSheets) : 200,
        subtotalPaise: finalAmountPaise,
        taxPaise: 0,
        totalAmountPaise: finalAmountPaise,
        fourDigitPin,
        pinExpiresAt,
        paymentStatus: 'pending',
        orderStatus: 'created',
        paymentGatewayOrderId,
      });
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      serverCalculatedAmountPaise: finalAmountPaise,
      razorpayOrderId: paymentGatewayOrderId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TkshNTlCnY93w2',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

