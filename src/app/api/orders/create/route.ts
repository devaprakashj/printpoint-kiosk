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

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: insData, error: insErr } = await supabaseAdmin.from('orders').insert({
        order_number: orderNumber,
        machine_code: machine.machineCode,
        machine_name: machine.displayName,
        customer_phone: customerPhone ? String(customerPhone).trim().substring(0, 15) : undefined,
        file_name: String(primaryFileName),
        file_size_formatted: String(fileSizeFormatted),
        detected_total_pages: grandTotalPrintPages,
        selected_page_ranges: String(pageRangeStr || 'all'),
        calculated_print_pages: grandTotalPrintPages,
        calculated_sheets: grandTotalSheets,
        copies: Math.max(1, Number(copies) || 1),
        color_mode: (colorMode === 'color' ? 'color' : 'bw'),
        duplex_mode: (duplexMode === 'duplex' ? 'duplex' : 'simplex'),
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
      }).select().single();

      if (!insErr && insData) {
        newOrder = {
          id: insData.id,
          orderNumber: insData.order_number,
          machineCode: insData.machine_code,
          machineName: insData.machine_name,
          customerPhone: insData.customer_phone,
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
        fileName: String(primaryFileName),
        fileSizeFormatted: String(fileSizeFormatted),
        detectedTotalPages: grandTotalPrintPages,
        selectedPageRanges: String(pageRangeStr || 'all'),
        calculatedPrintPages: grandTotalPrintPages,
        calculatedSheets: grandTotalSheets,
        copies: Math.max(1, Number(copies) || 1),
        colorMode: (colorMode === 'color' ? 'color' : 'bw') as ColorMode,
        duplexMode: (duplexMode === 'duplex' ? 'duplex' : 'simplex') as DuplexMode,
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

