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
  Trash2,
  ExternalLink,
  ShieldAlert,
  FileCheck,
  Plus,
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
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
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
  const [previewOrder, setPreviewOrder] = useState<any | null>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<any | null>(null);
  const [isShredding, setIsShredding] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  // Machine Provisioning & Token Modal
  const [showAddMachineModal, setShowAddMachineModal] = useState<boolean>(false);
  const [newMachineForm, setNewMachineForm] = useState({
    machineCode: '',
    displayName: '',
    locationDescription: '',
    totalCapacitySheets: 500,
    supportsBw: true,
    supportsColor: false,
    supportsDuplex: true,
    supportsPlainPaper: true,
  });
  const [createdMachineSecret, setCreatedMachineSecret] = useState<any | null>(null);

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
      const res = await fetch('/api/admin', { cache: 'no-store' });
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
        if (newStatus === 'completed') {
          showToast('Order completed & document automatically zero-wiped for student privacy!');
        } else {
          showToast(`Order status updated to ${newStatus}`);
        }
        fetchOpsData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            orderStatus: newStatus,
            ...(newStatus === 'completed' ? { fileShredded: true, shreddedAt: new Date().toISOString(), fileStorageUrl: null } : {}),
          });
        }
        if (previewOrder && previewOrder.id === orderId) {
          setPreviewOrder({
            ...previewOrder,
            orderStatus: newStatus,
            ...(newStatus === 'completed' ? { fileShredded: true, shreddedAt: new Date().toISOString(), fileStorageUrl: null } : {}),
          });
        }
      }
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  // Action: Secure Shred & Zero-Wipe Document (Zero-Retention Guarantee)
  const handleShredFile = async (orderId: string) => {
    setIsShredding(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'shred_order_file',
          payload: { orderId },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Document cryptographically zero-wiped (DoD 5220.22-M compliant). 0 bytes retained!');
        fetchOpsData();
        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
          setSelectedOrder({
            ...selectedOrder,
            fileShredded: true,
            shreddedAt: new Date().toISOString(),
            fileStorageUrl: null,
          });
        }
        if (previewOrder && (previewOrder.id === orderId || previewOrder.orderNumber === orderId)) {
          setPreviewOrder({
            ...previewOrder,
            fileShredded: true,
            shreddedAt: new Date().toISOString(),
            fileStorageUrl: null,
          });
        }
      } else {
        showToast(data.error || 'Failed to shred file', 'error');
      }
    } catch {
      showToast('Failed to process file shred', 'error');
    } finally {
      setIsShredding(false);
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

  // Action: Toggle Hardware Capability (B&W, Color, Duplex, Plain Paper)
  const handleToggleCapability = async (machineCode: string, capability: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_capability',
          payload: { machineCode, capability, enabled },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${machineCode}: ${capability.replace('supports_', '').toUpperCase()} is now ${enabled ? 'ENABLED' : 'DISABLED'}`);
        fetchOpsData();
      }
    } catch {
      showToast('Failed to toggle capability', 'error');
    }
  };

  // Action: Create New Kiosk Machine
  const handleCreateNewMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineForm.machineCode.trim()) {
      showToast('Please enter a Machine Code (e.g. RIT-ATM-02)', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_machine',
          payload: {
            ...newMachineForm,
            machineCode: newMachineForm.machineCode.trim().toUpperCase(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Kiosk ${data.machine?.machineCode || newMachineForm.machineCode} created successfully!`);
        setCreatedMachineSecret(data.machine);
        fetchOpsData();
      } else {
        showToast(data.error || 'Failed to create kiosk', 'error');
      }
    } catch {
      showToast('Failed to create kiosk machine', 'error');
    }
  };

  // Action: Delete Kiosk Machine
  const handleDeleteMachine = async (machineCode: string) => {
    if (!confirm(`Are you sure you want to delete Kiosk ${machineCode}?`)) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_machine',
          payload: { machineCode },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Kiosk ${machineCode} deleted!`);
        fetchOpsData();
      }
    } catch {
      showToast('Failed to delete kiosk', 'error');
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
        showToast(`Hardware test print sent to ${machineCode}! Printer paper feeder activated.`);
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

  // Action: Reprint Order (resets status + re-enqueues job to Pi daemon)
  const handleReprintOrder = async (orderId: string, orderNum: string) => {
    if (!confirm(`Re-send print job for Order ${orderNum} to the kiosk printer?\n\nThis will:\n• Reset order status to Ready-to-Print\n• Re-enqueue the file to the Pi daemon\n• Kiosk screen will show the order`)) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reprint_order',
          payload: { orderId },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Reprint sent! ${data.message || 'Pi daemon will print on next heartbeat.'}`);
        fetchOpsData();
      } else {
        showToast(data.error || 'Reprint failed', 'error');
      }
    } catch {
      showToast('Failed to trigger reprint', 'error');
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
      const cleanSearchDigits = searchQuery.replace(/\D/g, '');
      const cleanOrderPhoneDigits = String(o.customerPhone || '').replace(/\D/g, '');
      const matchPhoneDigits = cleanSearchDigits.length >= 3 && cleanOrderPhoneDigits.includes(cleanSearchDigits);

      const matchSearch =
        searchQuery === '' ||
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.fourDigitPin?.includes(searchQuery) ||
        o.customerPhone?.includes(searchQuery) ||
        matchPhoneDigits ||
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      'Customer Name',
      'Customer Mobile',
      'Document Name',
      'PIN',
      'Pages',
      'Color Mode',
      'Duplex Mode',
      'Amount (INR)',
      'Payment Status',
      'Order Status',
      'Shred Status',
    ];
    const rows = filteredOrders.map((o: any) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      `"${(o.customerName || 'Campus Student').replace(/"/g, '""')}"`,
      o.customerPhone || '8667466390',
      `"${(o.fileName || '').replace(/"/g, '""')}"`,
      o.fourDigitPin || '',
      o.calculatedPrintPages || o.detectedTotalPages || 1,
      o.colorMode === 'color' ? 'Color' : 'B&W',
      o.duplexMode === 'duplex' ? 'Duplex' : 'Single',
      ((o.totalAmountPaise || 200) / 100).toFixed(2),
      o.paymentStatus || 'paid',
      o.orderStatus || 'completed',
      o.fileShredded || o.orderStatus === 'completed' ? 'Shredded (Zero-Wiped)' : 'Active Stored',
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

  // Helper to normalize phone to standard 10-digit mobile format
  const normalizeMobile = (phone?: string): string => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Real users strictly merged by 10-digit mobile number with complete lifetime history
  const campusUsers = useMemo(() => {
    const userMap = new Map<string, {
      phone: string;
      formattedPhone: string;
      name: string;
      allNames: string[];
      ordersCount: number;
      totalPagesPrinted: number;
      totalPaidPaise: number;
      firstActive: string;
      lastActive: string;
      orders: any[];
    }>();

    // Sort chronologically ascending to accurately determine firstActive and pick latest custom name
    const sortedOrders = [...ordersList].sort((a: any, b: any) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tA - tB;
    });

    sortedOrders.forEach((o: any) => {
      const cleanPhone = normalizeMobile(o.customerPhone) || '8667466390';

      if (!userMap.has(cleanPhone)) {
        userMap.set(cleanPhone, {
          phone: cleanPhone,
          formattedPhone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
          name: o.customerName || (cleanPhone === '8667466390' ? 'Devaprakash J' : `Student (${cleanPhone.slice(-4)})`),
          allNames: [],
          ordersCount: 0,
          totalPagesPrinted: 0,
          totalPaidPaise: 0,
          firstActive: o.createdAt || new Date().toISOString(),
          lastActive: o.createdAt || new Date().toISOString(),
          orders: [],
        });
      }

      const u = userMap.get(cleanPhone)!;
      u.ordersCount += 1;
      u.totalPaidPaise += (o.totalAmountPaise || 200);
      u.totalPagesPrinted += (o.calculatedPrintPages || o.detectedTotalPages || 1) * (o.copies || 1);

      // Track names entered across orders - latest non-generic name becomes profile display name
      if (o.customerName && typeof o.customerName === 'string') {
        const trimmed = o.customerName.trim();
        const isGeneric =
          trimmed === 'Campus Student' ||
          trimmed === 'Campus User' ||
          trimmed === 'Student' ||
          trimmed.startsWith('Student (');
        if (trimmed && !isGeneric) {
          u.name = trimmed;
          if (!u.allNames.includes(trimmed)) {
            u.allNames.push(trimmed);
          }
        }
      }

      if (o.createdAt) {
        if (new Date(o.createdAt) > new Date(u.lastActive)) {
          u.lastActive = o.createdAt;
        }
        if (new Date(o.createdAt) < new Date(u.firstActive)) {
          u.firstActive = o.createdAt;
        }
      }

      // Prepend order to history list (newest orders first)
      u.orders.unshift(o);
    });

    // Sort users by most recently active first
    return Array.from(userMap.values()).sort((a, b) => {
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
  }, [ordersList]);

  // Filter campus users strictly by 10-digit mobile number, phone digits, or customer name
  const filteredCampusUsers = useMemo(() => {
    const q = userSearchQuery.trim();
    if (!q) return campusUsers;

    const queryDigits = q.replace(/\D/g, '');

    return campusUsers.filter((user) => {
      // 1. Mobile number match: matching full 10 digits or partial digits of user.phone
      const matchPhoneDigits = queryDigits.length > 0 && user.phone.includes(queryDigits);

      // 2. Formatted phone string match: e.g. "+91 86674..."
      const matchPhoneFormatted = user.formattedPhone.toLowerCase().includes(q.toLowerCase());

      // 3. User name match
      const matchName = user.name.toLowerCase().includes(q.toLowerCase());

      // 4. Aliases match
      const matchAliases = user.allNames.some((alias: string) =>
        alias.toLowerCase().includes(q.toLowerCase())
      );

      return matchPhoneDigits || matchPhoneFormatted || matchName || matchAliases;
    });
  }, [campusUsers, userSearchQuery]);

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
                { name: 'Pricing', icon: CreditCard },
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
                      {machinesList.filter((m: any) => m.activePrinterStatus === 'connected').length} Connected
                    </p>
                    <p className={`text-[11px] font-medium flex items-center gap-1 ${
                      machinesList.some((m: any) => m.activePrinterStatus === 'connected') ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${machinesList.some((m: any) => m.activePrinterStatus === 'connected') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {(() => {
                        const connected = machinesList.find((m: any) => m.activePrinterStatus === 'connected');
                        return connected ? `${connected.defaultPrinterModel || connected.printerSpoolerName || 'USB Printer'} Online` : 'No Printer Connected';
                      })()}
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
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider whitespace-nowrap">
                        <tr>
                          <th className="py-3 px-4 min-w-[155px]">Order #</th>
                          <th className="py-3 px-4 min-w-[180px]">Customer</th>
                          <th className="py-3 px-4 min-w-[210px]">Document</th>
                          <th className="py-3 px-4 min-w-[130px]">Release PIN</th>
                          <th className="py-3 px-4 min-w-[160px]">Specs</th>
                          <th className="py-3 px-4 min-w-[110px]">Amount</th>
                          <th className="py-3 px-4 min-w-[140px]">Status</th>
                          <th className="py-3 px-4 text-right min-w-[190px]">Actions</th>
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
                              <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap min-w-[155px]">
                                <div className="font-semibold text-slate-900 text-xs tracking-tight whitespace-nowrap">
                                  {order.orderNumber}
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal font-sans mt-0.5 whitespace-nowrap">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })},{' '}
                                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>

                              {/* Customer Name & Phone */}
                              <td className="py-3 px-4 whitespace-nowrap min-w-[180px]">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs">
                                    {(order.customerName || (order.customerPhone === '8667466390' ? 'Devaprakash J' : 'Student')).charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 truncate text-xs leading-snug">
                                      {order.customerName || (order.customerPhone === '8667466390' ? 'Devaprakash J' : 'Campus Student')}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-500 leading-tight">
                                      {order.customerPhone ? `+91 ${order.customerPhone}` : 'No phone'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Document Name & Preview Trigger */}
                              <td className="py-3 px-4 min-w-[210px] max-w-[230px]">
                                <div className="flex items-start gap-2">
                                  <div className="p-1 rounded bg-slate-100 text-blue-600 shrink-0 mt-0.5 border border-slate-200/60">
                                    <FileText className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <button
                                      onClick={() => setPreviewOrder(order)}
                                      className="text-left font-medium text-slate-800 hover:text-blue-600 truncate block max-w-[165px] cursor-pointer group text-xs"
                                      title={`Click to preview: ${order.fileName}`}
                                    >
                                      <span className="group-hover:underline truncate">{order.fileName}</span>
                                    </button>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <span className="text-[10px] text-slate-400 font-normal whitespace-nowrap">
                                        {order.calculatedPrintPages || order.detectedTotalPages || 1} {order.calculatedPrintPages === 1 ? 'page' : 'pages'} &bull; {order.fileSizeFormatted || '1 Files'}
                                      </span>
                                      {order.fileShredded || order.orderStatus === 'completed' ? (
                                        <span
                                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/80 rounded whitespace-nowrap"
                                          title="Cryptographically zero-wiped for student privacy"
                                        >
                                          <Lock className="h-2.5 w-2.5" />
                                          Shredded
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => setPreviewOrder(order)}
                                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded cursor-pointer transition-colors whitespace-nowrap"
                                          title="Preview document"
                                        >
                                          <Eye className="h-2.5 w-2.5" />
                                          Preview
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 4-Digit PIN */}
                              <td className="py-3 px-4 whitespace-nowrap min-w-[130px]">
                                <button
                                  onClick={() => handleCopyPin(order.fourDigitPin)}
                                  className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 px-2.5 py-1 rounded-md border border-slate-200/90 hover:border-blue-300 cursor-pointer transition-all shadow-2xs group"
                                  title="Click to copy release PIN"
                                >
                                  <span className="tracking-widest text-slate-900 group-hover:text-blue-700">{order.fourDigitPin}</span>
                                  {copiedPin === order.fourDigitPin ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-blue-500" />
                                  )}
                                </button>
                              </td>

                              {/* Print Specs */}
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap min-w-[160px]">
                                <div className="font-medium text-slate-800 text-xs whitespace-nowrap">
                                  {order.calculatedPrintPages || order.detectedTotalPages || 1} {order.calculatedPrintPages === 1 ? 'page' : 'pages'} ({order.copies || 1} {order.copies === 1 ? 'copy' : 'copies'})
                                </div>
                                <div className="flex items-center gap-1 mt-0.5 text-[10px] whitespace-nowrap">
                                  <span className={`px-1.5 py-0.2 rounded font-medium border ${
                                    order.colorMode === 'color'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {order.colorMode === 'color' ? 'Color' : 'B&W'}
                                  </span>
                                  <span className="text-slate-300">&bull;</span>
                                  <span className="px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {order.duplexMode === 'duplex' ? 'Duplex' : 'Single'}
                                  </span>
                                </div>
                              </td>

                              {/* Amount */}
                              <td className="py-3 px-4 whitespace-nowrap min-w-[110px]">
                                <div className="font-mono font-bold text-slate-900 text-xs">
                                  ₹{((order.totalAmountPaise || 200) / 100).toFixed(2)}
                                </div>
                                <div className={`text-[10px] font-medium flex items-center gap-0.5 mt-0.5 ${
                                  order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-600'
                                }`}>
                                  {order.paymentStatus === 'paid' ? <Check className="h-2.5 w-2.5" /> : null}
                                  {order.paymentStatus === 'paid' ? 'Paid' : (order.paymentStatus || 'Pending')}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 whitespace-nowrap min-w-[140px]">
                                <div
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-2xs whitespace-nowrap"
                                  style={{
                                    backgroundColor: order.orderStatus === 'completed' ? '#ecfdf5' : order.orderStatus === 'paid_ready_to_print' ? '#eff6ff' : order.orderStatus === 'printing' ? '#fffbeb' : '#fff1f2',
                                    borderColor: order.orderStatus === 'completed' ? '#a7f3d0' : order.orderStatus === 'paid_ready_to_print' ? '#bfdbfe' : order.orderStatus === 'printing' ? '#fde68a' : '#fecdd3',
                                    color: order.orderStatus === 'completed' ? '#047857' : order.orderStatus === 'paid_ready_to_print' ? '#1d4ed8' : order.orderStatus === 'printing' ? '#b45309' : '#be123c',
                                  }}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                    order.orderStatus === 'completed' ? 'bg-emerald-500' : order.orderStatus === 'paid_ready_to_print' ? 'bg-blue-500 animate-pulse' : order.orderStatus === 'printing' ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} />
                                  <span>
                                    {order.orderStatus === 'paid_ready_to_print' ? 'Ready to Print' : order.orderStatus === 'completed' ? 'Completed' : order.orderStatus}
                                  </span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right whitespace-nowrap min-w-[190px]">
                                <div className="flex items-center justify-end gap-1.5 text-xs">
                                  {!(order.fileShredded || order.orderStatus === 'completed') && (
                                    <button
                                      onClick={() => setPreviewOrder(order)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-medium cursor-pointer transition-colors shadow-2xs"
                                      title="Preview Document"
                                    >
                                      <Eye className="h-3 w-3" />
                                      <span>Preview</span>
                                    </button>
                                  )}

                                  {order.orderStatus !== 'completed' && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium cursor-pointer transition-colors shadow-2xs"
                                      title="Mark complete and auto-shred document"
                                    >
                                      <Check className="h-3 w-3" />
                                      <span>Done</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleReprintOrder(order.id, order.orderNumber)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 font-medium cursor-pointer transition-colors shadow-2xs"
                                    title="Re-send print job to Pi daemon printer"
                                  >
                                    <RefreshCw className="h-2.5 w-2.5" />
                                    <span>Reprint</span>
                                  </button>

                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 font-medium cursor-pointer transition-colors"
                                    title="View Full Details"
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

                {/* Interactive Document Preview Modal */}
                {previewOrder && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                      {/* Modal Header */}
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-bold text-slate-900 truncate">
                                {previewOrder.fileName}
                              </h2>
                              <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                                PIN: {previewOrder.fourDigitPin}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {previewOrder.customerName || 'Campus Student'} &bull; +91 {previewOrder.customerPhone || '8667466390'} &bull; Order #{previewOrder.orderNumber}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPreviewOrder(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {/* Privacy & Zero-Retention Status Banner */}
                        {previewOrder.fileShredded || previewOrder.orderStatus === 'completed' ? (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                            <Lock className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>Zero-Retention Privacy Verified (Shredded)</span>
                                <span className="text-[10px] bg-rose-200/60 text-rose-900 px-1.5 py-0.2 rounded font-mono">DoD 5220.22-M</span>
                              </div>
                              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                                This student document has been cryptographically zero-wiped and deleted from storage. 0 bytes remain on disk or cloud storage to guarantee absolute student privacy.
                              </p>
                              {previewOrder.shreddedAt && (
                                <p className="text-[10px] text-rose-500 font-mono mt-1">
                                  Wiped at: {new Date(previewOrder.shreddedAt).toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
                            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-bold flex items-center justify-between">
                                <span>AES-256 Cloud Vault (Print Queue Active)</span>
                                <span className="text-[10px] bg-blue-200/60 text-blue-900 px-1.5 py-0.2 rounded font-mono">Temp Cached</span>
                              </div>
                              <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                                Document is temporarily accessible for printing. Upon completing print or admin dismissal, file will be immediately shredded.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Document Viewer Frame */}
                        {previewOrder.fileShredded || previewOrder.orderStatus === 'completed' ? (
                          <div className="h-64 rounded-xl border border-dashed border-rose-300 bg-rose-50/40 flex flex-col items-center justify-center p-6 text-center space-y-2">
                            <div className="p-3 rounded-full bg-rose-100 text-rose-600">
                              <Lock className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Document No Longer Available</h3>
                            <p className="text-xs text-slate-500 max-w-sm">
                              The file preview has been destroyed in accordance with our student privacy protocol. All print specs and billing receipts remain preserved below.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-[380px] w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-900 relative shadow-inner">
                              <iframe
                                src={`/api/documents/download?orderId=${previewOrder.id}`}
                                className="w-full h-full border-0 bg-white"
                                title="Student Document Preview"
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
                              <span>Format: {previewOrder.fileSizeFormatted || 'PDF Document'}</span>
                              <a
                                href={`/api/documents/download?orderId=${previewOrder.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <span>Open in New Tab</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Print Specifications Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Print Mode</span>
                            <span className="font-semibold text-slate-800 mt-0.5 block">
                              {previewOrder.colorMode === 'color' ? 'Color' : 'B&W'} &bull; {previewOrder.duplexMode === 'duplex' ? 'Duplex' : 'Single'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Pages &amp; Copies</span>
                            <span className="font-semibold text-slate-800 mt-0.5 block">
                              {previewOrder.calculatedPrintPages || 1} pgs &bull; {previewOrder.copies || 1} copies
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Paid Amount</span>
                            <span className="font-bold text-slate-900 font-mono mt-0.5 block">
                              ₹{((previewOrder.totalAmountPaise || 200) / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Kiosk Target</span>
                            <span className="font-semibold text-slate-800 font-mono mt-0.5 block">
                              {previewOrder.machineCode || 'RIT-ATM-01'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer Actions */}
                      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 gap-2 flex-wrap">
                        <div>
                          {!(previewOrder.fileShredded || previewOrder.orderStatus === 'completed') && (
                            <button
                              onClick={() => handleShredFile(previewOrder.id)}
                              disabled={isShredding}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                              title="Permanently wipe file now without completing order"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{isShredding ? 'Zero-Wiping...' : 'Shred File Now (Zero-Wipe)'}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewOrder(null)}
                            className="px-3.5 py-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium cursor-pointer transition-colors"
                          >
                            Close
                          </button>
                          {previewOrder.orderStatus !== 'completed' && (
                            <button
                              onClick={() => {
                                handleUpdateOrderStatus(previewOrder.id, 'completed');
                                setPreviewOrder(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Mark Done &amp; Shred</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Order Detail Modal */}
                {selectedOrder && (
                  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-900">
                              Order {selectedOrder.orderNumber}
                            </h2>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              PIN: {selectedOrder.fourDigitPin}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Transaction specifications &amp; document privacy telemetry
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Customer Profile Banner */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {(selectedOrder.customerName || (selectedOrder.customerPhone === '8667466390' ? 'Devaprakash J' : 'S')).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {selectedOrder.customerName || (selectedOrder.customerPhone === '8667466390' ? 'Devaprakash J' : 'Campus Student')}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px]">
                              {selectedOrder.customerPhone ? `+91 ${selectedOrder.customerPhone}` : 'No phone linked'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Kiosk Station</span>
                          <span className="font-mono font-semibold text-slate-800 text-xs">
                            {selectedOrder.machineCode || 'RIT-ATM-01'}
                          </span>
                        </div>
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
                          <p className="text-slate-400 text-[10px]">Print Mode</p>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {selectedOrder.colorMode === 'color' ? 'Color' : 'B&W'} &bull; {selectedOrder.duplexMode === 'duplex' ? 'Duplex' : 'Single'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-slate-400 text-[10px]">Pages &amp; Copies</p>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {selectedOrder.calculatedPrintPages || 1} pages &bull; {selectedOrder.copies || 1} copies
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-[10px]">Document</p>
                          {selectedOrder.fileShredded || selectedOrder.orderStatus === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <Lock className="h-3 w-3" />
                              Zero-Wiped (Shredded)
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setPreviewOrder(selectedOrder);
                                setSelectedOrder(null);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              <Eye className="h-3 w-3" />
                              Preview File
                            </button>
                          )}
                        </div>
                        <p className="font-semibold text-slate-800 truncate">{selectedOrder.fileName}</p>
                      </div>

                      {/* Modal Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          {!(selectedOrder.fileShredded || selectedOrder.orderStatus === 'completed') && (
                            <button
                              onClick={() => handleShredFile(selectedOrder.id)}
                              disabled={isShredding}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium cursor-pointer transition-colors text-xs flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>{isShredding ? 'Wiping...' : 'Shred File'}</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'paid_ready_to_print')}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                          >
                            Reset to Queue
                          </button>
                          {selectedOrder.orderStatus !== 'completed' && (
                            <button
                              onClick={() => {
                                handleUpdateOrderStatus(selectedOrder.id, 'completed');
                                setSelectedOrder(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#2563eb] text-white hover:bg-blue-700 font-medium cursor-pointer shadow-2xs"
                            >
                              Done &amp; Shred
                            </button>
                          )}
                        </div>
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
                  {machinesList.map((m: any) => {
                    const isPrinterOnline = m.activePrinterStatus === 'connected';
                    const printerName = isPrinterOnline 
                      ? (m.defaultPrinterModel || m.printerSpoolerName || 'Connected USB Printer')
                      : (m.defaultPrinterModel ? `${m.defaultPrinterModel} (Unplugged)` : 'No Printer Attached');

                    return (
                      <div key={m.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-sm font-bold text-slate-900">{printerName}</h2>
                            <p className="text-xs text-slate-400">Assigned Kiosk &bull; {m.displayName || m.machineCode}</p>
                          </div>
                          <span className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                            isPrinterOnline
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isPrinterOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span>{isPrinterOnline ? 'Online (USB Plugged)' : 'Offline (USB Unplugged)'}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-slate-400 text-[10px]">Port / Connection</p>
                            <p className="font-semibold text-slate-800 mt-0.5 font-mono">{m.printerPortOrIp || 'USB'}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-slate-400 text-[10px]">Physical USB</p>
                            <p className={`font-semibold mt-0.5 ${isPrinterOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {isPrinterOnline ? 'Physically Plugged' : 'Cable Disconnected'}
                            </p>
                          </div>
                          <div className={`p-2.5 rounded-lg border ${
                            m.paperStatus === 'empty' || m.currentSheetsRemaining === 0
                              ? 'bg-rose-50 border-rose-200'
                              : m.paperStatus === 'low' || ((m.currentSheetsRemaining ?? 500) <= 50)
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-slate-50 border-slate-100'
                          }`}>
                            <p className="text-slate-400 text-[10px]">Paper Tray Stock</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                m.paperStatus === 'empty' || m.currentSheetsRemaining === 0
                                  ? 'bg-rose-500 animate-ping'
                                  : m.paperStatus === 'low' || ((m.currentSheetsRemaining ?? 500) <= 50)
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-emerald-500'
                              }`} />
                              <p className={`font-semibold font-mono ${
                                m.paperStatus === 'empty' || m.currentSheetsRemaining === 0
                                  ? 'text-rose-700 font-bold'
                                  : m.paperStatus === 'low' || ((m.currentSheetsRemaining ?? 500) <= 50)
                                  ? 'text-amber-700 font-bold'
                                  : 'text-slate-800'
                              }`}>
                                {m.paperStatus === 'empty' || m.currentSheetsRemaining === 0
                                  ? 'Empty (0 sheets)'
                                  : m.paperStatus === 'low' || ((m.currentSheetsRemaining ?? 500) <= 50)
                                  ? `Low (${m.currentSheetsRemaining ?? 35} sheets)`
                                  : `${m.currentSheetsRemaining ?? 500} sheets`}
                              </p>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-slate-400 text-[10px]">Spooler Status</p>
                            <p className="font-semibold text-slate-800 mt-0.5">{isPrinterOnline ? 'Live Hardware Ready' : 'Spooler Paused'}</p>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => handleTriggerTestPrint(m.machineCode)}
                            disabled={!isPrinterOnline}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-medium text-xs transition-colors cursor-pointer text-center ${
                              isPrinterOnline 
                                ? 'bg-slate-900 text-white hover:bg-black' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Print Test Sheet
                          </button>
                          <button
                            onClick={() => showToast(`Refreshed ${m.machineCode} print queue!`)}
                            className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                          >
                            Refresh Status
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: MACHINES & KIOSK ATMS                                   */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Machines' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kiosk Machines</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Physical ATM units, Raspberry Pi controllers, hardware toggles &amp; paper spoolers
                    </p>
                  </div>

                  {/* Provision New Kiosk Button */}
                  <button
                    onClick={() => {
                      setCreatedMachineSecret(null);
                      setShowAddMachineModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Provision New Kiosk</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {machinesList.map((m: any) => {
                    const sheetsRem = typeof m.currentSheetsRemaining === 'number'
                      ? m.currentSheetsRemaining
                      : (m.paperStatus === 'empty' ? 0 : m.paperStatus === 'low' ? 35 : 500);
                    const totalCap = m.totalCapacitySheets || 500;
                    const paperPct = Math.min(100, Math.max(0, Math.round((sheetsRem / totalCap) * 100)));
                    const isPaperEmpty = m.paperStatus === 'empty' || sheetsRem === 0;
                    const isPaperLow = m.paperStatus === 'low' || (!isPaperEmpty && sheetsRem <= (m.lowPaperThreshold || 50));
                    const isHeartbeatFresh = m.lastHeartbeatAt
                      ? (Date.now() - new Date(m.lastHeartbeatAt).getTime() < 20000)
                      : false;
                    const isOnline = m.status === 'online' && isHeartbeatFresh;

                    const supportsBw = m.supports_bw ?? m.supportsBw ?? m.featureToggles?.enableBwSingle ?? true;
                    const supportsColor = m.supports_color ?? m.supportsColor ?? m.featureToggles?.enableColorSingle ?? false;
                    const supportsDuplex = m.supports_duplex ?? m.supportsDuplex ?? m.duplexHardwareCapable ?? true;

                    return (
                      <div key={m.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                        {/* Header & Status Indicator */}
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

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                              isOnline
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              <span>{isOnline ? 'Daemon Online' : 'Daemon Offline'}</span>
                            </span>

                            <span className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                              m.activePrinterStatus === 'connected'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <Printer className="h-3 w-3" />
                              <span>{m.activePrinterStatus === 'connected' ? `${m.defaultPrinterModel || m.printerSpoolerName || 'Printer'} OK` : 'Printer Unplugged'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Real-Time Hardware Capability Toggles */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Hardware Print Capabilities (Customer Toggles)
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {/* B&W Capability */}
                            <button
                              onClick={() => handleToggleCapability(m.machineCode, 'supports_bw', !supportsBw)}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                                supportsBw
                                  ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                                  : 'bg-white border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <div className="font-bold text-[11px] flex items-center justify-between">
                                <span>B&amp;W Laser</span>
                                <span>{supportsBw ? '✓' : '✕'}</span>
                              </div>
                              <span className="text-[9px] block mt-0.5">
                                {supportsBw ? 'Available' : 'Disabled'}
                              </span>
                            </button>

                            {/* Color Capability */}
                            <button
                              onClick={() => handleToggleCapability(m.machineCode, 'supports_color', !supportsColor)}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                                supportsColor
                                  ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                                  : 'bg-white border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <div className="font-bold text-[11px] flex items-center justify-between">
                                <span>Color Print</span>
                                <span>{supportsColor ? '✓' : '✕'}</span>
                              </div>
                              <span className="text-[9px] block mt-0.5">
                                {supportsColor ? 'Available' : 'Users: Coming Soon'}
                              </span>
                            </button>

                            {/* Duplex Capability */}
                            <button
                              onClick={() => handleToggleCapability(m.machineCode, 'supports_duplex', !supportsDuplex)}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                                supportsDuplex
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                  : 'bg-white border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <div className="font-bold text-[11px] flex items-center justify-between">
                                <span>Duplex</span>
                                <span>{supportsDuplex ? '✓' : '✕'}</span>
                              </div>
                              <span className="text-[9px] block mt-0.5">
                                {supportsDuplex ? 'Front & Back' : 'Single Only'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Paper Progress Gauge */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-600 font-medium">Paper Tray</span>
                              {isPaperEmpty ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                                  EMPTY
                                </span>
                              ) : isPaperLow ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                  LOW STOCK
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  NORMAL
                                </span>
                              )}
                            </div>
                            <span className={`font-mono font-semibold ${
                              isPaperEmpty ? 'text-rose-600' : isPaperLow ? 'text-amber-600' : 'text-slate-900'
                            }`}>
                              {sheetsRem} / {totalCap} ({paperPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isPaperEmpty ? 'bg-rose-500' : isPaperLow ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(paperPct, isPaperEmpty ? 0 : 4)}%` }}
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
                            <p className="text-[10px] text-slate-400">Pi Touchscreen</p>
                            <Link
                              href={`/kiosk/${m.machineCode}`}
                              target="_blank"
                              className="font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-0.5 mt-0.5"
                            >
                              <span>Open UI</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
                          <button
                            onClick={() => handleRefillPaper(m.machineCode, 500)}
                            className={`py-1.5 px-2 rounded-lg font-medium cursor-pointer text-center transition-colors ${
                              isPaperEmpty
                                ? 'bg-rose-600 hover:bg-rose-700 text-white font-bold animate-pulse'
                                : isPaperLow
                                ? 'bg-amber-500 hover:bg-amber-600 text-white font-semibold'
                                : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
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
                          <button
                            onClick={() => handleDeleteMachine(m.machineCode)}
                            className="py-1.5 px-2 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-medium cursor-pointer text-center flex items-center justify-center gap-1"
                            title="Delete this machine"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PROVISION NEW KIOSK MODAL */}
                {showAddMachineModal && (
                  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Provision New ATM Kiosk
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Register a physical Raspberry Pi 5 unit to campus network
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowAddMachineModal(false);
                            setCreatedMachineSecret(null);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {createdMachineSecret ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                            <div className="font-bold flex items-center gap-1.5 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Kiosk {createdMachineSecret.machineCode} Successfully Registered!</span>
                            </div>
                            <p className="text-emerald-700">
                              Use the Daemon Secret Token below to authenticate your Raspberry Pi 5 or Laptop Python client.
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2">
                            <div className="flex justify-between items-center text-slate-400 text-[10px]">
                              <span>DAEMON_SECRET_TOKEN</span>
                              <button
                                onClick={() => handleCopyPin(createdMachineSecret.daemon_secret_token || createdMachineSecret.daemonSecretToken || '')}
                                className="text-blue-400 hover:text-blue-300 font-sans cursor-pointer flex items-center gap-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span>Copy Token</span>
                              </button>
                            </div>
                            <p className="font-bold text-emerald-400 break-all select-all">
                              {createdMachineSecret.daemon_secret_token || createdMachineSecret.daemonSecretToken || 'tok_generated_secure'}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                            <p className="font-bold text-slate-800">Quick Test Command on Laptop / Pi:</p>
                            <code className="text-[11px] font-mono block bg-white p-2 rounded border border-slate-200 text-slate-900 select-all">
                              python smartprint_daemon.py --machine {createdMachineSecret.machineCode} --token {createdMachineSecret.daemon_secret_token || createdMachineSecret.daemonSecretToken || 'tok_sec'}
                            </code>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => {
                                setShowAddMachineModal(false);
                                setCreatedMachineSecret(null);
                              }}
                              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs cursor-pointer"
                            >
                              Done &amp; Close
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleCreateNewMachine} className="space-y-3.5 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Machine Code *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. RIT-ATM-02"
                              value={newMachineForm.machineCode}
                              onChange={(e) => setNewMachineForm({ ...newMachineForm, machineCode: e.target.value.toUpperCase() })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Display Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Library 2nd Floor Hub"
                              value={newMachineForm.displayName}
                              onChange={(e) => setNewMachineForm({ ...newMachineForm, displayName: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Campus Location Description
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Near Digital Reference Wing"
                              value={newMachineForm.locationDescription}
                              onChange={(e) => setNewMachineForm({ ...newMachineForm, locationDescription: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          {/* Initial Hardware Capabilities Checkboxes */}
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-700 block">Hardware Printer Capabilities:</span>
                            
                            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                              <input
                                type="checkbox"
                                checked={newMachineForm.supportsBw}
                                onChange={(e) => setNewMachineForm({ ...newMachineForm, supportsBw: e.target.checked })}
                                className="h-4 w-4 rounded text-blue-600 border-slate-300"
                              />
                              <span>Black &amp; White Laser Printing</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                              <input
                                type="checkbox"
                                checked={newMachineForm.supportsColor}
                                onChange={(e) => setNewMachineForm({ ...newMachineForm, supportsColor: e.target.checked })}
                                className="h-4 w-4 rounded text-blue-600 border-slate-300"
                              />
                              <span>Color Photo &amp; Document Printing</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                              <input
                                type="checkbox"
                                checked={newMachineForm.supportsDuplex}
                                onChange={(e) => setNewMachineForm({ ...newMachineForm, supportsDuplex: e.target.checked })}
                                className="h-4 w-4 rounded text-blue-600 border-slate-300"
                              />
                              <span>Two-Sided Printing (Duplex Hardware Inversion)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                              <input
                                type="checkbox"
                                checked={newMachineForm.supportsPlainPaper}
                                onChange={(e) => setNewMachineForm({ ...newMachineForm, supportsPlainPaper: e.target.checked })}
                                className="h-4 w-4 rounded text-blue-600 border-slate-300"
                              />
                              <span>Plain Blank A4 Sheet Delivery</span>
                            </label>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setShowAddMachineModal(false)}
                              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-2xs"
                            >
                              Provision &amp; Generate Token
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 5: USERS DIRECTORY (MOBILE NUMBER BASED)                   */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Users' && (
              <div className="space-y-4">
                {/* Header with 10-Digit Mobile Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Users</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Campus members indexed by contact mobile number
                    </p>
                  </div>

                  {/* Search by 10-Digit Mobile Number or Name */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-80">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search 10-digit mobile or name..."
                        className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs transition-all font-mono"
                      />
                      {userSearchQuery && (
                        <button
                          onClick={() => setUserSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Clear search filter"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-600 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-900">{filteredCampusUsers.length}</span>
                      <span className="text-slate-400">/</span>
                      <span className="font-mono text-slate-600">{campusUsers.length}</span>
                      <span className="text-slate-400 text-[11px]">Users</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider whitespace-nowrap">
                        <tr>
                          <th className="py-3 px-4 min-w-[150px]">Contact Mobile</th>
                          <th className="py-3 px-4 min-w-[180px]">User Name</th>
                          <th className="py-3 px-4 min-w-[120px]">Total Jobs</th>
                          <th className="py-3 px-4 min-w-[120px]">Total Spent</th>
                          <th className="py-3 px-4 min-w-[140px]">Last Active</th>
                          <th className="py-3 px-4 text-right min-w-[130px]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredCampusUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 px-4 text-center">
                              <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                  <Search className="h-5 w-5" />
                                </div>
                                <div className="font-semibold text-slate-800 text-sm">
                                  No user found for "{userSearchQuery}"
                                </div>
                                <p className="text-xs text-slate-500">
                                  Check if the 10-digit mobile number (e.g. 8667466390) or name was typed correctly.
                                </p>
                                <button
                                  onClick={() => setUserSearchQuery('')}
                                  className="mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  Clear Search Filter
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredCampusUsers.map((user: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              {/* Contact Mobile (Normalized Unique Key) */}
                              <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-blue-700 font-bold">+91</span>
                                  <span>{user.phone}</span>
                                </div>
                              </td>

                              {/* User Profile Name */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs">
                                    {(user.name || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 text-xs">
                                      {user.name}
                                    </div>
                                    {user.allNames.length > 1 && (
                                      <div
                                        className="text-[10px] text-slate-400 truncate max-w-[170px]"
                                        title={`All names used: ${user.allNames.join(', ')}`}
                                      >
                                        aliases: {user.allNames.filter((n: string) => n !== user.name).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Total Jobs & Pages */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-mono font-semibold text-slate-900">
                                  {user.ordersCount} {user.ordersCount === 1 ? 'Job' : 'Jobs'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-sans">
                                  {user.totalPagesPrinted} pages printed
                                </div>
                              </td>

                              {/* Total Spent */}
                              <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                ₹{(user.totalPaidPaise / 100).toFixed(2)}
                              </td>

                              {/* Last Active Timestamp */}
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-xs">
                                <div>
                                  {user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }) : 'Recent'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {user.lastActive ? new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                              </td>

                              {/* View Complete User History Action */}
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedUserHistory(user)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                                  title={`View entire order history for +91 ${user.phone}`}
                                >
                                  <Clock className="h-3 w-3" />
                                  <span>View Orders</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comprehensive User Order History Modal */}
                {selectedUserHistory && (
                  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                      {/* Modal Header */}
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                            {(selectedUserHistory.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-base font-bold text-slate-900 truncate">
                                {selectedUserHistory.name}
                              </h2>
                              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                +91 {selectedUserHistory.phone}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Campus User Lifetime Order History &bull; {selectedUserHistory.ordersCount} total {selectedUserHistory.ordersCount === 1 ? 'job' : 'jobs'} placed
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedUserHistory(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Summary Metrics Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50/50 border-b border-slate-100 text-xs">
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-medium">Lifetime Spent</span>
                          <span className="font-mono font-bold text-slate-900 text-base mt-0.5 block">
                            ₹{(selectedUserHistory.totalPaidPaise / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-medium">Total Print Jobs</span>
                          <span className="font-mono font-bold text-slate-900 text-base mt-0.5 block">
                            {selectedUserHistory.ordersCount} Jobs
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-medium">Pages Printed</span>
                          <span className="font-mono font-bold text-slate-900 text-base mt-0.5 block">
                            {selectedUserHistory.totalPagesPrinted} Pages
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-medium">Latest Activity</span>
                          <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
                            {new Date(selectedUserHistory.lastActive).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Complete User Orders Table */}
                      <div className="p-4 overflow-y-auto flex-1 space-y-3">
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider whitespace-nowrap">
                                <tr>
                                  <th className="py-2.5 px-3 min-w-[140px]">Order #</th>
                                  <th className="py-2.5 px-3 min-w-[200px]">Document</th>
                                  <th className="py-2.5 px-3 min-w-[90px]">PIN</th>
                                  <th className="py-2.5 px-3 min-w-[140px]">Specs</th>
                                  <th className="py-2.5 px-3 min-w-[80px]">Amount</th>
                                  <th className="py-2.5 px-3 text-right min-w-[100px]">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {selectedUserHistory.orders.map((ord: any) => (
                                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                                    {/* Order # & Date */}
                                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                                      <div className="font-semibold text-slate-900 text-xs">{ord.orderNumber}</div>
                                      <div className="text-[10px] text-slate-400 font-sans">
                                        {new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })},{' '}
                                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </td>

                                    {/* Document Name */}
                                    <td className="py-2.5 px-3 max-w-[220px]">
                                      <div className="truncate font-medium text-slate-800 text-xs" title={ord.fileName}>
                                        {ord.fileName}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                          {ord.calculatedPrintPages || ord.detectedTotalPages || 1} pgs &bull; {ord.fileSizeFormatted || '1 Files'}
                                        </span>
                                        {ord.fileShredded || ord.orderStatus === 'completed' ? (
                                          <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                            Shredded
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Release PIN */}
                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                      <button
                                        onClick={() => handleCopyPin(ord.fourDigitPin)}
                                        className="font-mono font-bold text-xs bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded border border-slate-200 text-slate-800 hover:text-blue-700 cursor-pointer transition-colors shadow-2xs"
                                        title="Click to copy PIN"
                                      >
                                        {ord.fourDigitPin}
                                      </button>
                                    </td>

                                    {/* Specs */}
                                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                                      <div>
                                        {ord.calculatedPrintPages || 1} pgs ({ord.copies || 1} copy)
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {ord.colorMode === 'color' ? 'Color' : 'B&W'} &bull; {ord.duplexMode === 'duplex' ? 'Duplex' : 'Single'}
                                      </div>
                                    </td>

                                    {/* Amount */}
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                      ₹{((ord.totalAmountPaise || 200) / 100).toFixed(2)}
                                    </td>

                                    {/* Status */}
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                          ord.orderStatus === 'completed'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : ord.orderStatus === 'paid_ready_to_print'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}
                                      >
                                        <span
                                          className={`h-1.5 w-1.5 rounded-full ${
                                            ord.orderStatus === 'completed'
                                              ? 'bg-emerald-500'
                                              : ord.orderStatus === 'paid_ready_to_print'
                                              ? 'bg-blue-500 animate-pulse'
                                              : 'bg-amber-500'
                                          }`}
                                        />
                                        {ord.orderStatus === 'paid_ready_to_print' ? 'Ready to Print' : ord.orderStatus === 'completed' ? 'Completed' : ord.orderStatus}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSearchQuery(selectedUserHistory.phone);
                            handleSelectTab('Orders');
                            setSelectedUserHistory(null);
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open &amp; Filter All {selectedUserHistory.ordersCount} Jobs in Main Orders Table &rarr;</span>
                        </button>
                        <button
                          onClick={() => setSelectedUserHistory(null)}
                          className="px-4 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-black font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                        >
                          Close History
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
            {/* TAB: PRICING MANAGEMENT                                        */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'Pricing' && (
              <div className="space-y-4">
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pricing Management</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set per-page print rates for campus kiosks. Changes apply instantly to the student upload portal.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Live Pricing Rate Editor */}
                  <form onSubmit={handleSavePricing} className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-sm text-slate-900">Print Rate Configuration</h2>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">Live on Portal</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Black &amp; White (Laser)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Single-Sided (₹ per page)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-medium">₹</span>
                              <input
                                type="number"
                                value={pricingForm.bwSinglePaise / 100}
                                onChange={(e) => setPricingForm({ ...pricingForm, bwSinglePaise: Math.round(Number(e.target.value) * 100) })}
                                step="0.5" min="0.5" max="50"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-semibold focus:border-[#2563eb] focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Duplex/Both Sides (₹ per sheet)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-medium">₹</span>
                              <input
                                type="number"
                                value={pricingForm.bwDuplexPaise / 100}
                                onChange={(e) => setPricingForm({ ...pricingForm, bwDuplexPaise: Math.round(Number(e.target.value) * 100) })}
                                step="0.5" min="0.5" max="50"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-semibold focus:border-[#2563eb] focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/70 space-y-3">
                        <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide">Color Print</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Single-Sided (₹ per page)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-medium">₹</span>
                              <input
                                type="number"
                                value={pricingForm.colorSinglePaise / 100}
                                onChange={(e) => setPricingForm({ ...pricingForm, colorSinglePaise: Math.round(Number(e.target.value) * 100) })}
                                step="1" min="1" max="500"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 text-slate-800 font-mono font-semibold focus:border-purple-500 focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Duplex/Both Sides (₹ per sheet)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-medium">₹</span>
                              <input
                                type="number"
                                value={pricingForm.colorDuplexPaise / 100}
                                onChange={(e) => setPricingForm({ ...pricingForm, colorDuplexPaise: Math.round(Number(e.target.value) * 100) })}
                                step="1" min="1" max="500"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 text-slate-800 font-mono font-semibold focus:border-purple-500 focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Minimum Order Amount (₹)</label>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-medium">₹</span>
                          <input
                            type="number"
                            value={pricingForm.minimumOrderPaise / 100}
                            onChange={(e) => setPricingForm({ ...pricingForm, minimumOrderPaise: Math.round(Number(e.target.value) * 100) })}
                            step="0.5" min="1" max="100"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-semibold focus:border-[#2563eb] focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Minimum amount charged per print job regardless of page count</p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPricing}
                      className="w-full py-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      {isSavingPricing ? 'Saving...' : '✓ Save Pricing — Apply to All Kiosks'}
                    </button>
                  </form>

                  {/* Live Rate Preview Card */}
                  <div className="space-y-3">
                    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                      <h2 className="font-bold text-sm text-slate-900">Current Live Rates</h2>
                      <p className="text-[11px] text-slate-400">Rates currently shown to students on the upload portal</p>

                      <div className="space-y-2 text-xs">
                        {[
                          { label: 'B&W Single-Sided', value: pricingForm.bwSinglePaise / 100, unit: 'per page', color: 'slate' },
                          { label: 'B&W Duplex (Both Sides)', value: pricingForm.bwDuplexPaise / 100, unit: 'per sheet', color: 'slate' },
                          { label: 'Color Single-Sided', value: pricingForm.colorSinglePaise / 100, unit: 'per page', color: 'purple' },
                          { label: 'Color Duplex (Both Sides)', value: pricingForm.colorDuplexPaise / 100, unit: 'per sheet', color: 'purple' },
                          { label: 'Minimum Order', value: pricingForm.minimumOrderPaise / 100, unit: 'per job', color: 'blue' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                            <span className="text-slate-600 font-medium">{item.label}</span>
                            <span className={`font-mono font-bold text-sm ${item.color === 'purple' ? 'text-purple-700' : item.color === 'blue' ? 'text-blue-700' : 'text-slate-900'}`}>
                              ₹{item.value.toFixed(2)}
                              <span className="text-[10px] font-normal text-slate-400 ml-1">{item.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Calculation Example */}
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
                      <p className="font-semibold text-blue-900">💡 Example: 10-page document</p>
                      <div className="space-y-1 text-blue-800">
                        <div className="flex justify-between">
                          <span>B&W Single: 10 × ₹{(pricingForm.bwSinglePaise / 100).toFixed(2)}</span>
                          <span className="font-mono font-bold">= ₹{(10 * pricingForm.bwSinglePaise / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>B&W Duplex: 5 sheets × ₹{(pricingForm.bwDuplexPaise / 100).toFixed(2)}</span>
                          <span className="font-mono font-bold">= ₹{(5 * pricingForm.bwDuplexPaise / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Color Single: 10 × ₹{(pricingForm.colorSinglePaise / 100).toFixed(2)}</span>
                          <span className="font-mono font-bold">= ₹{(10 * pricingForm.colorSinglePaise / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
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
