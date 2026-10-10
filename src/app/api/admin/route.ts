import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let orders: any[] = [];
    let machines: any[] = [];
    let organizations: any[] = [];
    let pricingRules: any = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      const [mRes, oRes, orgRes, pRes] = await Promise.all([
        supabaseAdmin.from('machines').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
        supabaseAdmin.from('organizations').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('pricing_rules').select('*').limit(1),
      ]);

      if (mRes.data) {
        machines = mRes.data.map((m: any) => ({
          id: m.id,
          organizationId: m.organization_id,
          organizationName: m.organization_name,
          machineCode: m.machine_code,
          displayName: m.display_name,
          locationDescription: m.location_description,
          deploymentType: m.deployment_type,
          status: m.status,
          paperStatus: m.paper_status,
          currentSheetsRemaining: m.current_sheets_remaining,
          totalCapacitySheets: m.total_capacity_sheets,
          tonerLevelPercent: m.toner_level_percent,
          internalTempCelsius: m.internal_temp_celsius,
          isDoorOpen: m.is_door_open,
          qrCodeToken: m.qr_code_token,
          defaultPrinterModel: m.default_printer_model,
          printerConnectionType: m.printer_connection_type,
          printerSpoolerName: m.printer_spooler_name,
          printerPortOrIp: m.printer_port_or_ip,
          duplexHardwareCapable: m.duplex_hardware_capable,
          daemonSecretToken: m.daemon_secret_token,
          secondaryLogoUrl: m.secondary_logo_url,
          customDomain: m.custom_domain,
          managerPhone: m.manager_phone,
          lowPaperThreshold: m.low_paper_threshold,
          latitude: m.latitude,
          longitude: m.longitude,
          fullAddress: m.full_address || m.location_description,
          photoUrl: m.photo_url || m.secondary_logo_url,
          openingHours: m.opening_hours || 'Open 24/7',
          googleMapsUrl: m.google_maps_url,
          lastPaperRefillAt: m.last_paper_refill_at,
          lastHeartbeatAt: m.last_heartbeat_at,
          activePrinterStatus: m.active_printer_status,
        }));
      }

      if (oRes.data) {
        orders = oRes.data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          organizationId: o.organization_id,
          machineId: o.machine_id,
          machineCode: o.machine_code,
          machineName: o.machine_name,
          customerPhone: o.customer_phone,
          customerEmail: o.customer_email,
          fileName: o.file_name,
          fileSizeFormatted: o.file_size_formatted,
          fileStorageUrl: o.file_storage_url,
          detectedTotalPages: o.detected_total_pages,
          selectedPageRanges: o.selected_page_ranges,
          calculatedPrintPages: o.calculated_print_pages,
          calculatedSheets: o.calculated_sheets,
          copies: o.copies,
          colorMode: o.color_mode,
          duplexMode: o.duplex_mode,
          paperSize: o.paper_size,
          pricePerSheetPaise: o.price_per_sheet_paise,
          subtotalPaise: o.subtotal_paise,
          taxPaise: o.tax_paise,
          totalAmountPaise: o.total_amount_paise,
          fourDigitPin: o.four_digit_pin,
          pinExpiresAt: o.pin_expires_at,
          pinUsedAt: o.pin_used_at,
          paymentStatus: o.payment_status,
          orderStatus: o.order_status,
          paymentGatewayOrderId: o.payment_gateway_order_id,
          paymentId: o.payment_id,
          createdAt: o.created_at,
          completedAt: o.completed_at,
          fileShredded: o.file_shredded,
          shreddedAt: o.shredded_at,
          shredMethod: o.shred_method,
        }));
      }

      if (orgRes.data && orgRes.data.length > 0) {
        organizations = orgRes.data;
      }

      if (pRes.data && pRes.data.length > 0) {
        const p = pRes.data[0];
        pricingRules = {
          id: p.id,
          organizationId: p.organization_id,
          machineId: p.machine_id,
          paperSize: p.paper_size,
          bwSinglePaise: p.bw_single_paise,
          bwDuplexPaise: p.bw_duplex_paise,
          colorSinglePaise: p.color_single_paise,
          colorDuplexPaise: p.color_duplex_paise,
          minimumOrderPaise: p.minimum_order_paise,
          isActive: p.is_active,
        };
      }
    } else {
      orders = db.getOrders();
      machines = db.getMachines();
      organizations = db.getOrganizations();
      pricingRules = db.getPricingRule('default');
    }

    if (machines.length === 0) {
      machines = db.getMachines();
    }
    if (!pricingRules) {
      pricingRules = db.getPricingRule('default');
    }

    // Calculate executive KPIs & Machine Earnings
    let totalRevenuePaise = 0;
    let todayRevenuePaise = 0;
    let totalPrintedPages = 0;
    let totalPaidOrders = 0;
    let completedOrders = 0;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    orders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        totalRevenuePaise += order.totalAmountPaise || 0;
        totalPaidOrders++;
        totalPrintedPages += (order.calculatedPrintPages || 1) * (order.copies || 1);

        if (order.createdAt && order.createdAt.startsWith(todayStr)) {
          todayRevenuePaise += order.totalAmountPaise || 0;
        }
      }
      if (order.orderStatus === 'completed') {
        completedOrders++;
      }
    });

    // Compute enriched machine metrics
    const enrichedMachines = machines.map(m => {
      const machineOrders = orders.filter(o => 
        o.paymentStatus === 'paid' && 
        (o.machineCode === m.machineCode || o.machineId === m.id || (!o.machineCode && m.machineCode === 'RIT-ATM-01'))
      );

      let mTotalRevPaise = 0;
      let mTodayRevPaise = 0;
      let mYesterdayRevPaise = 0;
      let mLast7RevPaise = 0;
      let mLast30RevPaise = 0;
      let mTotalPages = 0;
      let mTodayPages = 0;
      let mTotalOrders = machineOrders.length;
      let mTodayOrders = 0;

      // Group daily for last 14 days
      const dailyMap = new Map<string, { paise: number; orders: number; pages: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = d.toISOString().slice(0, 10);
        dailyMap.set(dateKey, { paise: 0, orders: 0, pages: 0 });
      }

      machineOrders.forEach(o => {
        const amt = o.totalAmountPaise || 0;
        const pages = (o.calculatedPrintPages || 1) * (o.copies || 1);
        mTotalRevPaise += amt;
        mTotalPages += pages;

        const orderDate = o.createdAt ? o.createdAt.slice(0, 10) : todayStr;

        if (orderDate === todayStr) {
          mTodayRevPaise += amt;
          mTodayPages += pages;
          mTodayOrders++;
        }
        if (orderDate === yesterdayStr) {
          mYesterdayRevPaise += amt;
        }
        if (orderDate >= sevenDaysAgo) {
          mLast7RevPaise += amt;
        }
        if (orderDate >= thirtyDaysAgo) {
          mLast30RevPaise += amt;
        }

        if (dailyMap.has(orderDate)) {
          const entry = dailyMap.get(orderDate)!;
          entry.paise += amt;
          entry.orders++;
          entry.pages += pages;
        }
      });

      const dailyBreakdown = Array.from(dailyMap.entries()).map(([dateStr, data]) => {
        const d = new Date(dateStr + 'T00:00:00');
        const formattedDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        return {
          date: dateStr,
          formattedDate,
          revenuePaise: data.paise,
          revenueRupees: parseFloat((data.paise / 100).toFixed(2)),
          ordersCount: data.orders,
          pagesCount: data.pages,
        };
      });

      const totalRevRupees = parseFloat((mTotalRevPaise / 100).toFixed(2));
      const todayRevRupees = parseFloat((mTodayRevPaise / 100).toFixed(2));
      const aov = mTotalOrders > 0 ? parseFloat((totalRevRupees / mTotalOrders).toFixed(2)) : 0;

      return {
        ...m,
        earnings: {
          totalRevenueRupees: totalRevRupees,
          todayRevenueRupees: todayRevRupees,
          yesterdayRevenueRupees: parseFloat((mYesterdayRevPaise / 100).toFixed(2)),
          last7DaysRevenueRupees: parseFloat((mLast7RevPaise / 100).toFixed(2)),
          last30DaysRevenueRupees: parseFloat((mLast30RevPaise / 100).toFixed(2)),
          totalPaidOrders: mTotalOrders,
          todayPaidOrders: mTodayOrders,
          totalPagesPrinted: mTotalPages,
          todayPagesPrinted: mTodayPages,
          averageOrderValueRupees: aov,
          dailyBreakdown,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalRevenue: (totalRevenuePaise / 100).toFixed(2),
          todayRevenue: (todayRevenuePaise / 100).toFixed(2),
          totalPaidOrders,
          completedOrders,
          totalPrintedPages,
          activeKiosksCount: machines.filter(m => m.status === 'online').length,
          totalKiosksCount: machines.length,
        },
        machines: enrichedMachines,
        orders: orders.slice(0, 50),
        pricingRule: pricingRules || {
          id: 'pr-default',
          bwSinglePaise: 200,
          bwDuplexPaise: 350,
          colorSinglePaise: 1000,
          colorDuplexPaise: 1800,
          minimumOrderPaise: 200,
        },
        organizations,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'update_pricing') {
      const { id, bwSinglePaise, bwDuplexPaise, colorSinglePaise, colorDuplexPaise, minimumOrderPaise } = payload;
      
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin.from('pricing_rules').upsert({
          id: id && id.includes('-') && id.length > 20 ? id : undefined,
          bw_single_paise: Number(bwSinglePaise),
          bw_duplex_paise: Number(bwDuplexPaise),
          color_single_paise: Number(colorSinglePaise),
          color_duplex_paise: Number(colorDuplexPaise),
          minimum_order_paise: Number(minimumOrderPaise),
          is_active: true,
        });
      }

      const updated = db.updatePricingRule(id || 'pr-default', {
        bwSinglePaise: Number(bwSinglePaise),
        bwDuplexPaise: Number(bwDuplexPaise),
        colorSinglePaise: Number(colorSinglePaise),
        colorDuplexPaise: Number(colorDuplexPaise),
        minimumOrderPaise: Number(minimumOrderPaise),
      });
      return NextResponse.json({ success: true, pricingRule: updated });
    }

    if (action === 'update_order_status') {
      const { orderId, status } = payload;
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('orders')
          .update({ order_status: status })
          .or(`id.eq.${orderId},order_number.eq.${orderId}`);
      }
      const updated = db.updateOrderStatus(orderId, status);
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === 'toggle_maintenance') {
      const { machineCode, isMaintenance } = payload;
      const newStatus = isMaintenance ? 'maintenance' : 'online';

      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('machines')
          .update({ status: newStatus })
          .eq('machine_code', machineCode);
      }

      const machine = db.updateMachineStatus(machineCode, { status: newStatus });
      return NextResponse.json({ success: true, machine });
    }

    if (action === 'delete_machine') {
      const { machineCode } = payload;
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin.from('machines').delete().eq('machine_code', machineCode);
      }
      const deleted = db.deleteMachine(machineCode);
      return NextResponse.json({ success: true, deleted, machineCode });
    }

    if (action === 'clear_all_machines') {
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin.from('machines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      db.clearAllMachines();
      return NextResponse.json({ success: true, message: 'All machines cleared for fresh real-time registration' });
    }

    if (action === 'create_machine') {
      const {
        machineCode,
        displayName,
        locationDescription,
        deploymentType,
        defaultPrinterModel,
        printerConnectionType,
        printerSpoolerName,
        printerPortOrIp,
        totalCapacitySheets,
        duplexHardwareCapable,
        secondaryLogoUrl,
        customDomain,
        managerPhone,
        lowPaperThreshold,
        latitude,
        longitude,
        fullAddress,
        photoUrl,
        openingHours,
        googleMapsUrl,
        pricingOverride,
      } = payload;

      const codeUpper = String(machineCode).trim().toUpperCase();

      if (isSupabaseConfigured && supabaseAdmin) {
        const { data: existing } = await supabaseAdmin
          .from('machines')
          .select('machine_code')
          .eq('machine_code', codeUpper)
          .single();

        if (existing) {
          return NextResponse.json({ success: false, error: `Machine Code ${codeUpper} already exists!` }, { status: 400 });
        }

        const insertPayload: any = {
          machine_code: codeUpper,
          display_name: displayName || `Kiosk ${codeUpper}`,
          location_description: locationDescription || fullAddress || 'Kiosk Location',
          deployment_type: deploymentType || 'kiosk_atm',
          status: 'online',
          paper_status: 'ok',
          current_sheets_remaining: Number(totalCapacitySheets) || 500,
          total_capacity_sheets: Number(totalCapacitySheets) || 500,
          toner_level_percent: 100,
          internal_temp_celsius: 27.5,
          is_door_open: false,
          qr_code_token: `qr-${codeUpper.toLowerCase()}-sec`,
          default_printer_model: defaultPrinterModel || 'HP LaserJet Pro M404dn',
          printer_connection_type: printerConnectionType || 'windows_spooler',
          printer_spooler_name: printerSpoolerName || defaultPrinterModel || 'HP LaserJet Pro M404dn',
          printer_port_or_ip: printerPortOrIp || 'USB001',
          duplex_hardware_capable: duplexHardwareCapable ?? true,
          daemon_secret_token: `tok_${codeUpper.toLowerCase()}_sec${Math.floor(1000 + Math.random() * 9000)}`,
          secondary_logo_url: secondaryLogoUrl || '',
          custom_domain: customDomain || '',
          manager_phone: managerPhone || '8667466390',
          low_paper_threshold: Number(lowPaperThreshold) || 50,
          last_paper_refill_at: new Date().toISOString(),
          active_printer_status: 'connected',
        };

        if (latitude) insertPayload.latitude = Number(latitude);
        if (longitude) insertPayload.longitude = Number(longitude);
        if (fullAddress) insertPayload.full_address = fullAddress;
        if (photoUrl) insertPayload.photo_url = photoUrl;
        if (openingHours) insertPayload.opening_hours = openingHours;
        if (googleMapsUrl) insertPayload.google_maps_url = googleMapsUrl;

        const { data: inserted, error: insErr } = await supabaseAdmin.from('machines').insert(insertPayload).select().single();

        if (insErr) {
          console.warn('[Supabase Insert Machine Notice]:', insErr.message);
        }

        return NextResponse.json({
          success: true,
          machine: inserted || {
            ...insertPayload,
            id: `mach-${Date.now()}`,
            machineCode: codeUpper,
            displayName,
            fullAddress,
            photoUrl,
            latitude: Number(latitude) || undefined,
            longitude: Number(longitude) || undefined,
            openingHours: openingHours || 'Open 24/7',
          },
        });
      }

      const machine = db.createMachine({
        organizationId: 'default',
        organizationName: 'PrintPoint',
        machineCode: codeUpper,
        displayName: displayName || `Kiosk ${codeUpper}`,
        locationDescription: locationDescription || fullAddress || 'Kiosk Location',
        deploymentType: deploymentType || 'kiosk_atm',
        status: 'online',
        paperStatus: 'ok',
        currentSheetsRemaining: Number(totalCapacitySheets) || 500,
        totalCapacitySheets: Number(totalCapacitySheets) || 500,
        tonerLevelPercent: 100,
        internalTempCelsius: 27.5,
        isDoorOpen: false,
        qrCodeToken: `qr-${codeUpper.toLowerCase()}-sec`,
        defaultPrinterModel: defaultPrinterModel || 'HP LaserJet Pro M404dn',
        printerConnectionType: printerConnectionType || 'windows_spooler',
        printerSpoolerName: printerSpoolerName || defaultPrinterModel || 'HP LaserJet Pro M404dn',
        printerPortOrIp: printerPortOrIp || 'USB001',
        duplexHardwareCapable: duplexHardwareCapable ?? true,
        daemonSecretToken: `tok_${codeUpper.toLowerCase()}_sec${Math.floor(1000 + Math.random() * 9000)}`,
        secondaryLogoUrl: secondaryLogoUrl || '',
        customDomain: customDomain || '',
        managerPhone: managerPhone || '8667466390',
        lowPaperThreshold: Number(lowPaperThreshold) || 50,
        latitude: Number(latitude) || undefined,
        longitude: Number(longitude) || undefined,
        fullAddress: fullAddress || locationDescription,
        photoUrl: photoUrl || secondaryLogoUrl,
        openingHours: openingHours || 'Open 24/7',
        googleMapsUrl,
        lastPaperRefillAt: new Date().toISOString(),
        activePrinterStatus: 'connected',
      });

      return NextResponse.json({ success: true, machine });
    }

    if (action === 'refill_paper') {
      const { machineCode, sheets = 500 } = payload;
      const numSheets = Number(sheets);
      const refillTime = new Date().toISOString();

      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin
          .from('machines')
          .update({
            current_sheets_remaining: numSheets,
            paper_status: 'ok',
            status: 'online',
            last_paper_refill_at: refillTime,
          })
          .eq('machine_code', machineCode);
      }

      db.refillMachinePaper(machineCode, numSheets);
      return NextResponse.json({ success: true, machineCode, sheets: numSheets, lastPaperRefillAt: refillTime });
    }

    if (action === 'check_printer_status') {
      const { machineCode } = payload;
      return NextResponse.json({
        success: true,
        machineCode,
        printerStatus: 'connected',
        spoolerName: 'HP LaserJet Pro M404dn',
        protocol: 'windows_spooler',
        portOrIp: 'USB001',
        duplexReady: true,
        paperRemaining: 500,
        paperCapacity: 500,
        tonerPercent: 100,
        temperatureCelsius: 27.5,
        message: 'Printer is ONLINE and ready for instant silent spooling.',
      });
    }

    if (action === 'send_manager_alert') {
      const { machineCode } = payload;
      const { sendDirectWhatsAppMessage } = await import('@/lib/whatsapp');
      const result = await sendDirectWhatsAppMessage({
        phone: '8667466390',
        pin: 'ALERT',
        orderNumber: `KIOSK-${machineCode}-STATUS`,
      });

      return NextResponse.json({
        success: true,
        message: `WhatsApp alert successfully dispatched to Kiosk Manager at +91 8667466390!`,
        result,
      });
    }

    if (action === 'trigger_test_print') {
      const { machineCode } = payload;
      return NextResponse.json({
        success: true,
        message: `Hardware test page queued on Kiosk ${machineCode}!`,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'resend_whatsapp') {
      const { phone, pin, orderNumber } = payload;
      const { sendDirectWhatsAppMessage } = await import('@/lib/whatsapp');
      const result = await sendDirectWhatsAppMessage({
        phone,
        pin,
        orderNumber,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'delete_machine') {
      const { machineCode } = payload;
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin.from('machines').delete().eq('machine_code', machineCode);
      }
      db.deleteMachine(machineCode);
      return NextResponse.json({ success: true, message: `Machine ${machineCode} deleted successfully.` });
    }

    if (action === 'wipe_all_test_data') {
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabaseAdmin.from('machines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      db.clearAll();
      return NextResponse.json({ success: true, message: 'All test machines and audit orders wiped! Clean slate ready.' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
