import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    let order: any = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (!error && data) {
        order = {
          id: data.id,
          orderNumber: data.order_number,
          machineCode: data.machine_code,
          machineName: data.machine_name,
          customerPhone: data.customer_phone,
          customerEmail: data.customer_email,
          fileName: data.file_name,
          fileSizeFormatted: data.file_size_formatted,
          fileStorageUrl: data.file_storage_url,
          detectedTotalPages: data.detected_total_pages,
          selectedPageRanges: data.selected_page_ranges,
          calculatedPrintPages: data.calculated_print_pages,
          calculatedSheets: data.calculated_sheets,
          copies: data.copies,
          colorMode: data.color_mode,
          duplexMode: data.duplex_mode,
          paperSize: data.paper_size,
          pricePerSheetPaise: data.price_per_sheet_paise,
          subtotalPaise: data.subtotal_paise,
          taxPaise: data.tax_paise,
          totalAmountPaise: data.total_amount_paise,
          totalAmountRupees: (data.total_amount_paise / 100).toFixed(2),
          fourDigitPin: data.four_digit_pin,
          pinExpiresAt: data.pin_expires_at,
          paymentStatus: data.payment_status,
          orderStatus: data.order_status,
          paymentGatewayOrderId: data.payment_gateway_order_id,
          createdAt: data.created_at,
          completedAt: data.completed_at,
        };
      }
    }

    if (!order) {
      const dbOrder = db.getOrderById(orderId);
      if (dbOrder) {
        order = {
          ...dbOrder,
          totalAmountRupees: ((dbOrder.totalAmountPaise || 200) / 100).toFixed(2),
        };
      }
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching order';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
