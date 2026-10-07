export type OrganizationStatus = 'active' | 'suspended' | 'pending';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  status: OrganizationStatus;
  createdAt: string;
}

export type MachineStatus = 'online' | 'busy' | 'paper_low' | 'paper_empty' | 'maintenance' | 'offline';
export type PaperStatus = 'ok' | 'low' | 'empty' | 'unknown';
export type MachineDeploymentType = 'kiosk_atm' | 'xerox_shop';

export interface Machine {
  id: string;
  organizationId: string;
  organizationName: string;
  machineCode: string; // e.g. "RIT-ATM-01"
  displayName: string;
  locationDescription: string;
  deploymentType: MachineDeploymentType;
  status: MachineStatus;
  paperStatus: PaperStatus;
  currentSheetsRemaining: number;
  totalCapacitySheets: number;
  tonerLevelPercent: number;
  internalTempCelsius: number;
  isDoorOpen: boolean;
  qrCodeToken: string;
  ipAddress?: string;
  defaultPrinterModel?: string;
  // Hardware Printer Configuration
  printerConnectionType?: 'windows_spooler' | 'usb_raw' | 'network_ipp' | 'cups_linux';
  printerSpoolerName?: string;
  printerPortOrIp?: string;
  duplexHardwareCapable?: boolean;
  paperTrayCapacity?: number;
  daemonSecretToken?: string;
  // Branding & Domain Mapping
  secondaryLogoUrl?: string; // Campus / College / Shop 2nd Logo
  customDomain?: string; // Custom Subdomain or Domain
  managerPhone?: string; // Kiosk Manager's WhatsApp number for alerts
  lowPaperThreshold?: number; // Alert threshold (default 50)
  // Location & Geolocation Mapping (Qwikprint standard)
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
  photoUrl?: string;
  openingHours?: string;
  googleMapsUrl?: string;
  lastPaperRefillAt?: string;
  lastTestPrintAt?: string;
  lastHeartbeatAt?: string;
  activePrinterStatus?: 'connected' | 'offline' | 'paper_jam' | 'door_open';
  pricingOverride?: {
    bwSinglePaise: number;
    bwDuplexPaise: number;
    colorSinglePaise: number;
    colorDuplexPaise: number;
  };
  earnings?: MachineEarningsMetrics;
}

export interface MachineDailyEarning {
  date: string;
  formattedDate: string;
  revenuePaise: number;
  revenueRupees: number;
  ordersCount: number;
  pagesCount: number;
}

export interface MachineEarningsMetrics {
  totalRevenueRupees: number;
  todayRevenueRupees: number;
  yesterdayRevenueRupees: number;
  last7DaysRevenueRupees: number;
  last30DaysRevenueRupees: number;
  totalPaidOrders: number;
  todayPaidOrders: number;
  totalPagesPrinted: number;
  todayPagesPrinted: number;
  averageOrderValueRupees: number;
  dailyBreakdown: MachineDailyEarning[];
}


export interface PricingRule {
  id: string;
  organizationId: string;
  machineId?: string | null; // null means default for org
  paperSize: 'A4' | 'A3';
  bwSinglePaise: number;     // e.g. 200 = ₹2.00
  bwDuplexPaise: number;     // e.g. 350 = ₹3.50 per sheet
  colorSinglePaise: number;  // e.g. 1000 = ₹10.00
  colorDuplexPaise: number;  // e.g. 1800 = ₹18.00 per sheet
  minimumOrderPaise: number;
  isActive: boolean;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'created' | 'paid_ready_to_print' | 'printing' | 'completed' | 'failed' | 'refunded';
export type ColorMode = 'bw' | 'color';
export type DuplexMode = 'simplex' | 'duplex';

export interface PrintOrder {
  id: string;
  orderNumber: string; // e.g. "ORD-20261006-0042"
  organizationId: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Document details
  fileName: string;
  fileSizeFormatted: string;
  fileStorageUrl?: string;
  detectedTotalPages: number;
  selectedPageRanges: string; // "all" or "1-5, 8"
  calculatedPrintPages: number;
  calculatedSheets: number;
  
  // Settings
  copies: number;
  colorMode: ColorMode;
  duplexMode: DuplexMode;
  paperSize: 'A4' | 'A3';
  
  // Financials
  pricePerSheetPaise: number;
  subtotalPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  
  // Release Code (4-Digit PIN)
  fourDigitPin: string; // e.g. "7392"
  pinExpiresAt: string; // ISO String
  pinUsedAt?: string;
  
  // Statuses
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentGatewayOrderId?: string;
  paymentId?: string;
  
  // Timestamps & Privacy Shredding
  createdAt: string;
  completedAt?: string;
  fileShredded?: boolean;
  shreddedAt?: string;
  shredMethod?: string; // e.g., "DoD 5220.22-M Zero-Wipe"
}

export interface SensorTelemetry {
  machineCode: string;
  timestamp: string;
  paperLevelPercent: number;
  doorOpen: boolean;
  temperatureCelsius: number;
  cpuLoadPercent: number;
  ramUsagePercent: number;
}
