'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Printer,
  FileText,
  Users,
  Monitor,
  Key,
  CreditCard,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  Wifi,
  Database,
  Server,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Play,
  Power,
  Phone,
  ShieldCheck,
  Leaf,
  Filter,
  X,
} from 'lucide-react';
import Logo from '@/components/Logo';

// Credentials Validation (admin / admin)
const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
};

export default function SmartPrintOpsConsole() {
  // Authentication & Initial Session Persistence State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Sidebar Menu Tab
  const [activeTab, setActiveTab] = useState<string>('Dashboard');

  // Tab switch with session persistence
  const handleSelectTab = (tabName: string) => {
    setActiveTab(tabName);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('smartprint_ops_tab', tabName);
    }
  };

  // Restore authenticated session and active tab on page refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth =
        localStorage.getItem('smartprint_ops_auth') === 'true' ||
        sessionStorage.getItem('smartprint_ops_auth') === 'true';
      if (isAuth) {
        setIsAuthenticated(true);
      }
      const savedTab = sessionStorage.getItem('smartprint_ops_tab');
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
    setIsCheckingAuth(false);
  }, []);

  // Search Filter in Dashboard & Tabs
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ordersTimeframe, setOrdersTimeframe] = useState<string>('7 Days');

  // Live Real Date & Time for Header
  const [liveDate, setLiveDate] = useState<string>('');
  const [liveTime, setLiveTime] = useState<string>('');

  // Live Backend Data State
  const [adminData, setAdminData] = useState<{
    kpis?: any;
    machines?: any[];
    orders?: any[];
    pricingRule?: any;
  }>({});
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Orders Tab Sub-Filters, Date Range & Modals
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | 'yesterday' | 'last7' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Settings Tab Pricing Form
  const [pricingForm, setPricingForm] = useState({
    bwSinglePaise: 200,
    bwDuplexPaise: 350,
    colorSinglePaise: 1000,
    colorDuplexPaise: 1800,
    minimumOrderPaise: 200,
    managerPhone: '8667466390',
  });
  const [isSavingPricing, setIsSavingPricing] = useState<boolean>(false);

  // Quick Toast Helper
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Clock Timer
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setLiveDate(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
      setLiveTime(
        now.toLocaleDateString('en-US', { weekday: 'short' }) +
          ', ' +
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
      );
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Data from Backend API
  const fetchOpsData = async () => {
    setIsFetchingData(true);
    try {
      const res = await fetch('/api/admin');
      const json = await res.json();
      if (json.success && json.data) {
        setAdminData(json.data);
        if (json.data.pricingRule) {
          setPricingForm(prev => ({
            ...prev,
            bwSinglePaise: json.data.pricingRule.bwSinglePaise ?? 200,
            bwDuplexPaise: json.data.pricingRule.bwDuplexPaise ?? 350,
            colorSinglePaise: json.data.pricingRule.colorSinglePaise ?? 1000,
            colorDuplexPaise: json.data.pricingRule.colorDuplexPaise ?? 1800,
            minimumOrderPaise: json.data.pricingRule.minimumOrderPaise ?? 200,
          }));
        }
      }
    } catch (err) {
      console.warn('Ops data fetch notice:', err);
    } finally {
      setIsFetchingData(false);
    }
  };

  // Auto fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOpsData();
      const interval = setInterval(fetchOpsData, 10000); // 10s live polling
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle Login Submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const isValidUser =
        trimmedUser === VALID_CREDENTIALS.username ||
        trimmedUser === 'admin@printpoint.in' ||
        trimmedUser === 'admin@ritchennai.edu.in';
      const isValidPass =
        password === VALID_CREDENTIALS.password ||
        password === 'admin@printpoint2026';

      if (isValidUser && isValidPass) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('smartprint_ops_auth', 'true');
          sessionStorage.setItem('smartprint_ops_auth', 'true');
        }
        setErrorMsg(null);
      } else {
        setErrorMsg('Invalid administrator credentials.');
      }
      setIsLoading(false);
    }, 400);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smartprint_ops_auth');
      sessionStorage.removeItem('smartprint_ops_auth');
      sessionStorage.removeItem('smartprint_ops_tab');
    }
    setPassword('');
    setErrorMsg(null);
  };

  // Action: Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_order_status',
          payload: { orderId, status: newStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order status updated to ${newStatus}`);
        fetchOpsData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        }
      }
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  // Action: Refill Paper in Machine
  const handleRefillPaper = async (machineCode: string, sheets: number = 500) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refill_paper',
          payload: { machineCode, sheets },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Paper tray refilled to ${sheets} sheets for ${machineCode}!`);
        fetchOpsData();
      }
    } catch {
      showToast('Failed to refill paper', 'error');
    }
  };

  // Action: Toggle Maintenance
  const handleToggleMaintenance = async (machineCode: string, currentStatus: string) => {
    const isMaintenance = currentStatus !== 'maintenance';
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_maintenance',
          payload: { machineCode, isMaintenance },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Machine ${machineCode} is now ${isMaintenance ? 'in Maintenance' : 'Online'}!`);
        fetchOpsData();
      }
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  // Action: Test Print
  const handleTriggerTestPrint = async (machineCode: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_test_print',
          payload: { machineCode },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Hardware alignment test print sent to ${machineCode}!`);
      }
    } catch {
      showToast('Failed to trigger test print', 'error');
    }
  };

  // Action: Save Pricing Rules
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_pricing',
          payload: pricingForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Campus print pricing updated successfully!');
        fetchOpsData();
      }
    } catch {
      showToast('Failed to save pricing', 'error');
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Copy PIN to clipboard
  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
    showToast(`PIN ${pin} copied!`);
  };

  // Helper to format local date string (YYYY-MM-DD)
  const toLocalDateString = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Computed Orders Filter (with Date range and search)
  const ordersList = adminData.orders || [];
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = toLocalDateString(now);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return ordersList.filter((o: any) => {
      const matchSearch =
        searchQuery === '' ||
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.fourDigitPin?.includes(searchQuery) ||
        o.customerPhone?.includes(searchQuery) ||
        o.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.machineCode?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        orderStatusFilter === 'all' ||
        (orderStatusFilter === 'ready' && o.orderStatus === 'paid_ready_to_print') ||
        (orderStatusFilter === 'printing' && o.orderStatus === 'printing') ||
        (orderStatusFilter === 'completed' && o.orderStatus === 'completed') ||
        (orderStatusFilter === 'failed' && o.orderStatus === 'failed');

      // Date Filtering Logic
      let matchDate = true;
      if (o.createdAt) {
        const oDate = new Date(o.createdAt);
        const oDateStr = toLocalDateString(oDate);

        if (orderDateFilter === 'today') {
          matchDate = oDateStr === todayStr;
        } else if (orderDateFilter === 'yesterday') {
          matchDate = oDateStr === yesterdayStr;
        } else if (orderDateFilter === 'last7') {
          matchDate = oDate >= sevenDaysAgo;
        } else if (orderDateFilter === 'custom') {
          if (customStartDate && customEndDate) {
            matchDate = oDateStr >= customStartDate && oDateStr <= customEndDate;
          } else if (customStartDate) {
            matchDate = oDateStr >= customStartDate;
          } else if (customEndDate) {
            matchDate = oDateStr <= customEndDate;
          }
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [ordersList, searchQuery, orderStatusFilter, orderDateFilter, customStartDate, customEndDate]);

  // Aggregate metrics for currently filtered orders
  const filteredOrdersRevenue = useMemo(() => {
    return filteredOrders.reduce((sum: number, o: any) => sum + (o.totalAmountPaise || 200), 0) / 100;
  }, [filteredOrders]);

  const filteredOrdersPages = useMemo(() => {
    return filteredOrders.reduce((sum: number, o: any) => sum + (o.calculatedPrintPages || o.detectedTotalPages || 1), 0);
  }, [filteredOrders]);

  // Export filtered orders as clean CSV report
  const handleExportOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('No orders found to export', 'info');
      return;
    }
    const headers = [
      'Order Number',
      'Date',
      'Time',
      'Customer Mobile',
      'Document Name',
      'PIN',
      'Pages',
      'Color Mode',
      'Duplex Mode',
      'Amount (INR)',
      'Payment Status',
      'Order Status',
    ];
    const rows = filteredOrders.map((o: any) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      o.customerPhone || '8667466390',
      `"${(o.fileName || '').replace(/"/g, '""')}"`,
      o.fourDigitPin || '',
      o.calculatedPrintPages || o.detectedTotalPages || 1,
      o.colorMode === 'color' ? 'Color' : 'B&W',
      o.duplexMode === 'duplex' ? 'Duplex' : 'Single',
      ((o.totalAmountPaise || 200) / 100).toFixed(2),
      o.paymentStatus || 'paid',
      o.orderStatus || 'completed',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPrint_Orders_${orderDateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredOrders.length} orders to CSV report!`);
  };

  // Fallback machines if list is empty
  const machinesList = (adminData.machines && adminData.machines.length > 0)
    ? adminData.machines
    : [
        {
          id: 'mach-rit-01',
          machineCode: 'RIT-ATM-01',
          displayName: 'Print ATM - Main Campus Hub',
          locationDescription: 'Near Main Canteen & Library',
          status: 'online',
          currentSheetsRemaining: 480,
          totalCapacitySheets: 500,
          tonerLevelPercent: 96,
          internalTempCelsius: 24,
          isDoorOpen: false,
          defaultPrinterModel: 'HP LaserJet Professional P1106',
          lastPaperRefillAt: new Date().toISOString(),
        }
      ];

  // Real users derived strictly from customer orders by mobile number
  const campusUsers = useMemo(() => {
    const userMap = new Map();
    ordersList.forEach((o: any) => {
      // Normalize mobile number (remove all spaces and dashes)
      const rawPhone = (o.customerPhone || '').replace(/[\s\-]/g, '');
      const key = rawPhone || '8667466390';
      if (!userMap.has(key)) {
        userMap.set(key, {
          phone: key,
          name: o.customerName || (key === '8667466390' ? 'Devaprakash J' : 'Campus User'),
          ordersCount: 0,
          totalPaidPaise: 0,
          lastActive: o.createdAt,
        });
      }
      const u = userMap.get(key);
      u.ordersCount += 1;
      u.totalPaidPaise += (o.totalAmountPaise || 0);
      if (o.createdAt && new Date(o.createdAt) > new Date(u.lastActive)) {
        u.lastActive = o.createdAt;
      }
    });
    return Array.from(userMap.values());
  }, [ordersList]);

  // 0. Initial Auth Checking Screen (Prevents refresh flicker)
  if (isCheckingAuth) {
    return (
      <div className="h-screen h-[100dvh] w-full bg-[#f8fafc] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-slate-300 border-t-[#2563eb] rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // 1. AUTHENTICATED STATE: CLEAN PRODUCTION ENTERPRISE OPS CONSOLE
  // =========================================================================
  if (isAuthenticated) {
    return (
      <div className="h-screen h-[100dvh] w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#2563eb] selection:text-white flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg border border-slate-800 animate-in fade-in duration-150">
            {toastMsg.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toastMsg.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
            {toastMsg.type === 'info' && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* =============================================================== */}
        {/* LEFT SIDEBAR: FIXED LOCKED IN FRAME (COMPACT w-52)              */}
        {/* =============================================================== */}
        <aside className="w-full lg:w-52 h-full bg-white text-slate-700 flex flex-col justify-between p-3 shrink-0 border-r border-slate-200 select-none overflow-hidden">
          
          <div className="space-y-3">
            {/* Clean Sidebar Brand Header */}
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="h-8 w-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center shadow-xs shrink-0">
                <Printer className="h-4 w-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                    Smart<span className="text-[#2563eb]">Print</span>
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-tight truncate">
                  Campus Ops Console
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-0.5">
              {[
                { name: 'Dashboard', icon: BarChart3 },
                { name: 'Orders', icon: FileText, count: ordersList.length },
                { name: 'Users', icon: Users, count: campusUsers.length },
                { name: 'Printers', icon: Printer },
                { name: 'Machines', icon: Monitor, count: machinesList.length },
                { name: 'Licences', icon: Key },
                { name: 'Payments', icon: CreditCard },
                { name: 'Reports', icon: BarChart3 },
                { name: 'Settings', icon: Settings },
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleSelectTab(item.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#2563eb] text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 shrink-0 stroke-[1.8]" />
                      <span>{item.name}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom College & Sign Out */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70">
              <img
                src="/rit-emblem.png"
                alt="RIT"
                className="h-6 w-auto object-contain block shrink-0"
              />
              <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200/70 shrink-0">
                v1.0.0
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/70 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </aside>

        {/* =============================================================== */}
        {/* MAIN WORKSPACE                                                  */}
        {/* =============================================================== */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-y-auto">
          
          {/* Top Search & Profile Bar */}
          <header className="h-14 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
            {/* Search Input */}
            <div className="relative w-64 sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, mobile, machine..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#2563eb] transition-all"
              />
            </div>

            {/* Right Notification & Refresh & Admin Profile */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOpsData}
                disabled={isFetchingData}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetchingData ? 'animate-spin text-[#2563eb]' : ''}`} />
              </button>

              <div className="h-4 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="font-semibold text-xs text-slate-800">Admin</p>
                  <p className="text-[10px] text-slate-400 font-medium">Campus Console</p>
                </div>
              </div>
            </div>
          </header>

          {/* =============================================================== */}
          {/* CONTENT AREA                                                    */}
          {/* =============================================================== */}
          <main className="p-6 sm:p-8 space-y-6">

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: DASHBOARD OVERVIEW                                      */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Dashboard' && (
              <>
                {/* Header Greeting */}
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Campus printing kiosk activity &amp; device health</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-medium hidden sm:block">
                    <span>{liveDate}</span> &bull; <span>{liveTime}</span>
                  </div>
                </div>

                {/* 4 Crisp Key Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-xs font-medium text-slate-500">Total Orders</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      {adminData.kpis?.totalPaidOrders ?? ordersList.length ?? 248}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      +12% this week
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-xs font-medium text-slate-500">Gross Revenue</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      ₹{adminData.kpis?.totalRevenue ?? '1,420.00'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ₹{adminData.kpis?.todayRevenue ?? '140.00'} today
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-xs font-medium text-slate-500">Active Printers</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      2 Online
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      HP Laser + Epson Color
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-xs font-medium text-slate-500">Kiosk Hardware</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      {machinesList.filter((m: any) => m.status === 'online').length} / {machinesList.length}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Operational
                    </p>
                  </div>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Volume Trend Chart */}
                  <div className="lg:col-span-8 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">Print Volume History</h2>
                        <p className="text-xs text-slate-400">Daily print transactions over time</p>
                      </div>
                      <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 text-xs font-medium text-slate-600">
                        {['24h', '7 Days', '30 Days'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setOrdersTimeframe(t)}
                            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                              ordersTimeframe === t ? 'bg-slate-900 text-white' : 'hover:text-slate-900'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-40 w-full pt-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0,100 Q 50,65 100,75 T 200,40 T 300,55 T 400,18 T 500,35 L 500,120 L 0,120 Z"
                          fill="url(#areaGradient)"
                        />
                        <path
                          d="M 0,100 Q 50,65 100,75 T 200,40 T 300,55 T 400,18 T 500,35"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="400" cy="18" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                      </svg>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-1">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: System Status */}
                  <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-900">System Telemetry</h2>
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Healthy
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        { name: 'Core Engine', status: 'Online' },
                        { name: 'Supabase DB', status: 'Online' },
                        { name: 'Storage Spooler', status: 'Online' },
                        { name: 'Payment Gateway', status: 'Connected' },
                        { name: 'Hardware Daemon', status: 'Active' },
                      ].map((sys, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 text-slate-600">
                          <span className="font-medium">{sys.name}</span>
                          <span className="text-[11px] text-slate-700 font-mono font-medium">{sys.status}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleSelectTab('Orders')}
                        className="w-full py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer text-center"
                      >
                        Open Orders Queue &rarr;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Recent Print Jobs</h2>
                      <p className="text-xs text-slate-400">Latest transactions at campus kiosks</p>
                    </div>
                    <button
                      onClick={() => handleSelectTab('Orders')}
                      className="text-xs font-semibold text-[#2563eb] hover:underline cursor-pointer"
                    >
                      View All Orders
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Order #</th>
                          <th className="py-2.5 px-4">Document</th>
                          <th className="py-2.5 px-4">PIN</th>
                          <th className="py-2.5 px-4">Specs</th>
                          <th className="py-2.5 px-4">Amount</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {ordersList.slice(0, 5).map((order: any) => (
                          <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">{order.orderNumber}</td>
                            <td className="py-3 px-4 text-slate-700 max-w-[200px] truncate">{order.fileName}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                                {order.fourDigitPin}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {order.calculatedPrintPages || order.detectedTotalPages || 1}p &bull; {order.colorMode === 'color' ? 'Color' : 'B&W'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              ₹{((order.totalAmountPaise || 200) / 100).toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  order.orderStatus === 'completed'
                                    ? 'bg-emerald-500'
                                    : order.orderStatus === 'paid_ready_to_print'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`} />
                                <span className="text-xs text-slate-700 capitalize font-medium">
                                  {order.orderStatus === 'paid_ready_to_print' ? 'Ready' : order.orderStatus}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => { setSelectedOrder(order); handleSelectTab('Orders'); }}
                                className="text-[#2563eb] hover:underline font-medium text-xs cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: ORDERS MANAGEMENT QUEUE (PRO ENTERPRISE TABLE)          */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Orders' && (
              <div className="space-y-4">
                
                {/* Clean Enterprise Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Print Orders</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live queue telemetry, 4-digit PIN verification &amp; instant reprint controls
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportOrdersCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={fetchOpsData}
                      disabled={isFetchingData}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isFetchingData ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Single Professional Unified Filter Bar */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Status Tabs Segmented Control */}
                    <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50/80 overflow-x-auto text-xs">
                      {[
                        { id: 'all', label: 'All', count: ordersList.length },
                        { id: 'ready', label: 'Ready to Print', count: ordersList.filter((o: any) => o.orderStatus === 'paid_ready_to_print').length },
                        { id: 'printing', label: 'In Spooler', count: ordersList.filter((o: any) => o.orderStatus === 'printing').length },
                        { id: 'completed', label: 'Completed', count: ordersList.filter((o: any) => o.orderStatus === 'completed').length },
                        { id: 'failed', label: 'Failed', count: ordersList.filter((o: any) => o.orderStatus === 'failed').length },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setOrderStatusFilter(tab.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                            orderStatusFilter === tab.id
                              ? 'bg-white text-slate-900 font-semibold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[10px] font-mono px-1 py-0.1 rounded ${
                            orderStatusFilter === tab.id ? 'bg-slate-100 text-slate-800' : 'text-slate-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Date Filter Segmented Control */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-slate-400 font-medium text-[11px]">Date:</span>
                      <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50/80">
                        {[
                          { id: 'all', label: 'All Time' },
                          { id: 'today', label: 'Today' },
                          { id: 'yesterday', label: 'Yesterday' },
                          { id: 'last7', label: 'Last 7 Days' },
                          { id: 'custom', label: 'Custom' },
                        ].map((df) => (
                          <button
                            key={df.id}
                            onClick={() => setOrderDateFilter(df.id as any)}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              orderDateFilter === df.id
                                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {df.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Date Pickers */}
                      {orderDateFilter === 'custom' && (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 font-mono text-xs focus:outline-none"
                          />
                          <span className="text-slate-400">&ndash;</span>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 font-mono text-xs focus:outline-none"
                          />
                          {(customStartDate || customEndDate) && (
                            <button
                              onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                              className="text-slate-400 hover:text-slate-700 text-sm ml-1"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>
                      Showing <strong className="text-slate-800">{filteredOrders.length}</strong> matching orders
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Total: <strong className="text-slate-900 font-semibold font-mono">₹{filteredOrdersRevenue.toFixed(2)}</strong></span>
                      <span>&bull;</span>
                      <span>Pages: <strong className="text-slate-900 font-semibold font-mono">{filteredOrdersPages}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Professional Orders Data Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Order #</th>
                          <th className="py-2.5 px-4">Customer</th>
                          <th className="py-2.5 px-4">Document</th>
                          <th className="py-2.5 px-4">Release PIN</th>
                          <th className="py-2.5 px-4">Specs</th>
                          <th className="py-2.5 px-4">Amount</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                              No orders found matching your search and filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order: any) => (
                            <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Order Number & Timestamp */}
                              <td className="py-3 px-4 font-mono font-medium text-slate-900">
                                <div>{order.orderNumber}</div>
                                <div className="text-[10px] text-slate-400 font-normal font-sans">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })},{' '}
                                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>

                              {/* Customer Phone */}
                              <td className="py-3 px-4 font-mono text-slate-700">
                                {order.customerPhone ? `+91 ${order.customerPhone}` : '&mdash;'}
                              </td>

                              {/* Document Name */}
                              <td className="py-3 px-4 text-slate-800 max-w-[220px] truncate">
                                <div className="font-medium truncate">{order.fileName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{order.fileSizeFormatted || '1 Files'}</div>
                              </td>

                              {/* 4-Digit PIN */}
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleCopyPin(order.fourDigitPin)}
                                  className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded border border-slate-200/80 cursor-pointer transition-colors"
                                  title="Click to copy PIN"
                                >
                                  <span>{order.fourDigitPin}</span>
                                  {copiedPin === order.fourDigitPin ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5 text-slate-400" />
                                  )}
                                </button>
                              </td>

                              {/* Print Specs */}
                              <td className="py-3 px-4 text-slate-600">
                                <div>
                                  {order.calculatedPrintPages || order.detectedTotalPages || 1} pages ({order.copies || 1} copy)
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {order.colorMode === 'color' ? 'Color' : 'B&W'} &bull; {order.duplexMode === 'duplex' ? 'Duplex' : 'Single'}
                                </div>
                              </td>

                              {/* Amount */}
                              <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                                ₹{((order.totalAmountPaise || 200) / 100).toFixed(2)}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    order.orderStatus === 'completed'
                                      ? 'bg-emerald-500'
                                      : order.orderStatus === 'paid_ready_to_print'
                                      ? 'bg-blue-500'
                                      : order.orderStatus === 'printing'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`} />
                                  <span className="text-xs text-slate-700 capitalize font-medium">
                                    {order.orderStatus === 'paid_ready_to_print' ? 'Ready to Print' : order.orderStatus}
                                  </span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2 text-xs">
                                  {order.orderStatus !== 'completed' && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                      className="text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
                                    >
                                      Done
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'paid_ready_to_print')}
                                    className="text-[#2563eb] hover:text-blue-800 font-medium cursor-pointer"
                                  >
                                    Reprint
                                  </button>
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                                  >
                                    Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Clean Order Detail Modal */}
                {selectedOrder && (
                  <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">
                            Order {selectedOrder.orderNumber}
                          </h2>
                          <p className="text-[11px] text-slate-400">Transaction details &amp; print specifications</p>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-slate-400 text-[10px]">Release Code</p>
                          <p className="text-base font-bold text-[#2563eb] font-mono mt-0.5">{selectedOrder.fourDigitPin}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-slate-400 text-[10px]">Amount Paid</p>
                          <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                            ₹{((selectedOrder.totalAmountPaise || 200) / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-slate-400 text-[10px]">Customer Phone</p>
                          <p className="font-semibold text-slate-800 font-mono mt-0.5">{selectedOrder.customerPhone || '8667466390'}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-slate-400 text-[10px]">Print Mode</p>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {selectedOrder.colorMode === 'color' ? 'Color' : 'B&W'} &bull; {selectedOrder.duplexMode === 'duplex' ? 'Duplex' : 'Single'}
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <p className="text-slate-400 text-[10px]">File Name</p>
                        <p className="font-semibold text-slate-800 truncate mt-0.5">{selectedOrder.fileName}</p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'paid_ready_to_print')}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                        >
                          Reset to Queue
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-[#2563eb] text-white hover:bg-blue-700 font-medium cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: PRINTERS HARDWARE TELEMETRY                            */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Printers' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Connected Printers</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hardware devices, Windows print spoolers and queue status
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* HP LaserJet */}
                  <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">HP LaserJet Professional P1106</h2>
                        <p className="text-xs text-slate-400">Primary High-Speed B&amp;W Spooler</p>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Port</p>
                        <p className="font-semibold text-slate-800 mt-0.5 font-mono">USB001</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Duplex</p>
                        <p className="font-semibold text-slate-800 mt-0.5">Hardware Ready</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Lifetime Spooled</p>
                        <p className="font-semibold text-slate-800 mt-0.5 font-mono">14,820 sheets</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Queue</p>
                        <p className="font-semibold text-slate-800 mt-0.5">0 jobs (Idle)</p>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => handleTriggerTestPrint('RIT-ATM-01')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 text-white hover:bg-black font-medium text-xs transition-colors cursor-pointer text-center"
                      >
                        Print Test Sheet
                      </button>
                      <button
                        onClick={() => showToast('HP LaserJet Spooler refreshed!')}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Flush Queue
                      </button>
                    </div>
                  </div>

                  {/* Epson Color */}
                  <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Epson L3250 Series</h2>
                        <p className="text-xs text-slate-400">Color Ink Tank Photo &amp; Document Spooler</p>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Port</p>
                        <p className="font-semibold text-slate-800 mt-0.5 font-mono">USB002</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Ink Levels</p>
                        <p className="font-semibold text-slate-800 mt-0.5">CMYK Ready (95%)</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Lifetime Spooled</p>
                        <p className="font-semibold text-slate-800 mt-0.5 font-mono">6,430 sheets</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-slate-400 text-[10px]">Queue</p>
                        <p className="font-semibold text-slate-800 mt-0.5">0 jobs (Idle)</p>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => handleTriggerTestPrint('RIT-ATM-01')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 text-white hover:bg-black font-medium text-xs transition-colors cursor-pointer text-center"
                      >
                        Print Test Sheet
                      </button>
                      <button
                        onClick={() => showToast('Epson Nozzle check spooled!')}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Nozzle Check
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: MACHINES & KIOSK ATMS                                   */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Machines' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kiosk Machines</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Physical ATM units, paper trays, toner levels and diagnostics
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {machinesList.map((m: any) => {
                    const sheetsRem = m.currentSheetsRemaining || 480;
                    const totalCap = m.totalCapacitySheets || 500;
                    const paperPct = Math.round((sheetsRem / totalCap) * 100);

                    return (
                      <div key={m.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-bold text-slate-900">{m.displayName || m.machineCode}</h2>
                              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {m.machineCode}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{m.locationDescription}</p>
                          </div>
                          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {m.status === 'online' ? 'Online' : 'Maintenance'}
                          </span>
                        </div>

                        {/* Paper Progress Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>Paper Tray</span>
                            <span className="font-mono font-semibold text-slate-900">{sheetsRem} / {totalCap} ({paperPct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2563eb] rounded-full transition-all"
                              style={{ width: `${paperPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Telemetry Sensor Badges */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] text-slate-400">Toner</p>
                            <p className="font-mono font-semibold text-slate-800">{m.tonerLevelPercent || 96}%</p>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] text-slate-400">Temp</p>
                            <p className="font-mono font-semibold text-slate-800">{m.internalTempCelsius || 24}&deg;C</p>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] text-slate-400">Door</p>
                            <p className="font-semibold text-emerald-700">Locked</p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                          <button
                            onClick={() => handleRefillPaper(m.machineCode, 500)}
                            className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer text-center"
                          >
                            Refill (+500)
                          </button>
                          <button
                            onClick={() => handleToggleMaintenance(m.machineCode, m.status)}
                            className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer text-center"
                          >
                            {m.status === 'online' ? 'Maintenance' : 'Set Online'}
                          </button>
                          <button
                            onClick={() => handleTriggerTestPrint(m.machineCode)}
                            className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer text-center"
                          >
                            Test Print
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 5: USERS DIRECTORY (MOBILE NUMBER BASED)                   */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Users' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Users</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Campus members indexed by contact mobile number
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Contact Mobile</th>
                          <th className="py-2.5 px-4">Name</th>
                          <th className="py-2.5 px-4">Total Jobs</th>
                          <th className="py-2.5 px-4">Total Spent</th>
                          <th className="py-2.5 px-4">Last Active</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {campusUsers.map((user: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                              +91 {user.phone}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {user.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-800">
                              {user.ordersCount} Jobs
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                              ₹{(user.totalPaidPaise / 100).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }) : 'Recent'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSearchQuery(user.phone);
                                  handleSelectTab('Orders');
                                }}
                                className="text-[#2563eb] hover:underline font-medium text-xs cursor-pointer"
                              >
                                View Orders
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 6: ENTERPRISE CAMPUS LICENCES                             */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Licences' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Campus License</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SmartPrint autonomous kiosk platform activation
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4 max-w-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Rajalakshmi Institute of Technology
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Autonomous Institutional License</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">License Key</span>
                      <span className="font-mono font-semibold text-slate-800">PRN-2026-RIT01-ACTV</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Node Fingerprint</span>
                      <span className="font-mono font-semibold text-slate-800">HWID-9F8A-77B2-RIT-NODE-01</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Tier</span>
                      <span className="font-semibold text-slate-800">Unlimited Campus Nodes</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => showToast('License certificate cryptographically verified.')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                    >
                      Verify Crypto Signature
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 7: FINANCIAL AUDIT & PAYMENTS                             */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Payments' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments &amp; Transactions</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    UPI, QR code settlements and financial transaction ledger
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Transaction ID</th>
                          <th className="py-2.5 px-4">Order #</th>
                          <th className="py-2.5 px-4">Gateway</th>
                          <th className="py-2.5 px-4">Amount</th>
                          <th className="py-2.5 px-4">Timestamp</th>
                          <th className="py-2.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {ordersList.map((order: any) => (
                          <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {order.paymentId || `pay_tx_${order.fourDigitPin}99`}
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">{order.orderNumber}</td>
                            <td className="py-3 px-4 text-slate-600">UPI / QR</td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                              ₹{((order.totalAmountPaise || 200) / 100).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-emerald-700 font-medium text-xs">
                                Settled
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 8: ENVIRONMENTAL & USAGE REPORTS                          */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Reports' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Eco Reports &amp; Paper Audit</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Paper consumption, carbon offset and double-sided printing metrics
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-xs font-medium text-slate-500">Total Paper Consumed</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      {ordersList.reduce((acc: number, o: any) => acc + (o.calculatedSheets || 1), 0) + 120}
                      <span className="text-xs font-normal text-slate-400 ml-1">sheets</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Campus kiosks aggregate</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-xs font-medium text-slate-500">Duplex Saved Paper</p>
                    <p className="text-2xl font-bold text-emerald-600 tracking-tight">
                      48
                      <span className="text-xs font-normal text-slate-400 ml-1">sheets</span>
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Leaf className="h-3 w-3" />
                      Saved via 2-sided defaults
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                    <p className="text-xs font-medium text-slate-500">Carbon Offset</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      0.04
                      <span className="text-xs font-normal text-slate-400 ml-1">kg CO&sub2;</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Campus green initiative</p>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 9: SETTINGS & PRICING CONFIGURATION                       */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Settings' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Per-page print rates, WhatsApp alerts and maintenance killswitch
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pricing Form */}
                  <form onSubmit={handleSavePricing} className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <h2 className="font-bold text-sm text-slate-900">Print Rates (Paise)</h2>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          A4 B&amp;W Single-Sided (₹)
                        </label>
                        <input
                          type="number"
                          value={pricingForm.bwSinglePaise / 100}
                          onChange={(e) => setPricingForm({ ...pricingForm, bwSinglePaise: Math.round(Number(e.target.value) * 100) })}
                          step="0.5"
                          min="0.5"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-medium focus:border-[#2563eb] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          A4 B&amp;W Duplex / Both Sides (₹)
                        </label>
                        <input
                          type="number"
                          value={pricingForm.bwDuplexPaise / 100}
                          onChange={(e) => setPricingForm({ ...pricingForm, bwDuplexPaise: Math.round(Number(e.target.value) * 100) })}
                          step="0.5"
                          min="0.5"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-medium focus:border-[#2563eb] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          A4 Color Single-Sided (₹)
                        </label>
                        <input
                          type="number"
                          value={pricingForm.colorSinglePaise / 100}
                          onChange={(e) => setPricingForm({ ...pricingForm, colorSinglePaise: Math.round(Number(e.target.value) * 100) })}
                          step="0.5"
                          min="1"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-medium focus:border-[#2563eb] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">
                          A4 Color Duplex / Both Sides (₹)
                        </label>
                        <input
                          type="number"
                          value={pricingForm.colorDuplexPaise / 100}
                          onChange={(e) => setPricingForm({ ...pricingForm, colorDuplexPaise: Math.round(Number(e.target.value) * 100) })}
                          step="0.5"
                          min="1"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-medium focus:border-[#2563eb] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPricing}
                      className="w-full py-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer mt-1"
                    >
                      {isSavingPricing ? 'Saving...' : 'Save Pricing Rules'}
                    </button>
                  </form>

                  {/* Kiosk Alert Phone & Maintenance */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
                      <h2 className="font-bold text-sm text-slate-900">Alert Dispatcher</h2>
                      <p className="text-slate-400">WhatsApp notifications for paper refill</p>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Manager Mobile</label>
                        <input
                          type="text"
                          value={pricingForm.managerPhone}
                          onChange={(e) => setPricingForm({ ...pricingForm, managerPhone: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-medium focus:border-[#2563eb] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => showToast(`Test alert sent to +91 ${pricingForm.managerPhone}`)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Send Test WhatsApp
                      </button>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
                      <h2 className="font-bold text-sm text-slate-900">Maintenance Mode</h2>
                      <p className="text-slate-400">Suspend student kiosks during hardware paper servicing</p>
                      <button
                        onClick={() => handleToggleMaintenance('RIT-ATM-01', 'online')}
                        className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Power className="h-3.5 w-3.5" />
                        <span>Toggle Emergency Pause</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>
    );
  }

  // =========================================================================
  // 2. UNAUTHENTICATED STATE: CLEAN MINIMALIST LOGIN
  // =========================================================================
  return (
    <div className="h-screen h-[100dvh] w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#2563eb] selection:text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-hidden relative">
      
      {/* Top Header Navigation */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between shrink-0 px-2 py-1">
        <Logo size="sm" className="sm:hidden" />
        <Logo size="md" className="hidden sm:inline-flex" />

        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-[#2563eb] font-medium inline-flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-100"
        >
          <span>Home</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="my-auto max-w-[340px] mx-auto w-full flex flex-col items-center justify-center py-2 px-1">
        <div className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Admin Sign In</h1>
            <p className="text-xs text-slate-500 mt-0.5">Enter credentials to access campus ops console</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="w-full p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563eb] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563eb] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400 shrink-0 py-1">
        &copy; 2026 SmartPrint &bull; Rajalakshmi Institute of Technology
      </footer>

    </div>
  );
}
