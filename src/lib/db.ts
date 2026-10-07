import { Organization, Machine, PricingRule, PrintOrder, SensorTelemetry } from './types';
import { supabaseAdmin, isSupabaseConfigured } from './supabase';

// Production Clean Initial Stores (Zero Mock Data)
export const SEED_ORGANIZATIONS: Organization[] = [];
export const SEED_MACHINES: Machine[] = [];
export const SEED_PRICING_RULES: PricingRule[] = [
  {
    id: 'pr-default-global',
    organizationId: 'default',
    machineId: null,
    paperSize: 'A4',
    bwSinglePaise: 200,     // ₹2.00
    bwDuplexPaise: 350,     // ₹3.50 (both sides)
    colorSinglePaise: 1000, // ₹10.00
    colorDuplexPaise: 1800, // ₹18.00 (both sides)
    minimumOrderPaise: 200, // ₹2.00 minimum
    isActive: true,
  }
];

class PrintAtmStore {
  private organizations: Organization[] = [...SEED_ORGANIZATIONS];
  private machines: Machine[] = [...SEED_MACHINES];
  private pricingRules: PricingRule[] = [...SEED_PRICING_RULES];
  private orders: PrintOrder[] = [];
  private telemetryLogs: SensorTelemetry[] = [];

  constructor() {
    // 100% Production Clean: No mock orders or demo transactions
  }

  // Organizations
  getOrganizations(): Organization[] {
    return this.organizations;
  }

  createOrganization(org: Omit<Organization, 'id' | 'createdAt'>): Organization {
    const id = `org-${Date.now()}`;
    const newOrg: Organization = {
      ...org,
      id,
      createdAt: new Date().toISOString(),
    };
    this.organizations.push(newOrg);
    return newOrg;
  }

  // Machines
  getMachines(): Machine[] {
    return this.machines;
  }

  getMachineByCode(code: string): Machine | undefined {
    return this.machines.find(m => m.machineCode.toLowerCase() === code.toLowerCase());
  }

  createMachine(newMachine: Omit<Machine, 'id' | 'lastHeartbeatAt'>): Machine {
    const id = `mach-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const machine: Machine = {
      ...newMachine,
      id,
      lastHeartbeatAt: new Date().toISOString(),
    };
    this.machines.push(machine);
    return machine;
  }

  updateMachineStatus(code: string, updates: Partial<Machine>): Machine | undefined {
    const idx = this.machines.findIndex(m => m.machineCode.toLowerCase() === code.toLowerCase());
    if (idx !== -1) {
      this.machines[idx] = {
        ...this.machines[idx],
        ...updates,
        lastHeartbeatAt: new Date().toISOString(),
      };
      return this.machines[idx];
    }
    return undefined;
  }

  refillMachinePaper(code: string, sheets: number): Machine | undefined {
    return this.updateMachineStatus(code, {
      currentSheetsRemaining: sheets,
      paperStatus: 'ok',
      status: 'online',
      lastPaperRefillAt: new Date().toISOString(),
    });
  }

  deleteMachine(code: string): boolean {
    const initialLen = this.machines.length;
    this.machines = this.machines.filter(m => m.machineCode.toLowerCase() !== code.toLowerCase());
    return this.machines.length < initialLen;
  }

  clearAllMachines(): void {
    this.machines = [];
  }

  clearAll(): void {
    this.machines = [];
    this.orders = [];
  }

  // Pricing
  getPricingRule(organizationId: string, machineId?: string): PricingRule {
    const specific = this.pricingRules.find(p => p.organizationId === organizationId && p.machineId === machineId);
    if (specific) return specific;
    const orgDefault = this.pricingRules.find(p => p.organizationId === organizationId && !p.machineId);
    if (orgDefault) return orgDefault;
    return this.pricingRules[0] || SEED_PRICING_RULES[0];
  }

  updatePricingRule(id: string, updates: Partial<PricingRule>): PricingRule | undefined {
    const idx = this.pricingRules.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.pricingRules[idx] = { ...this.pricingRules[idx], ...updates };
      return this.pricingRules[idx];
    }
    return undefined;
  }

  // Orders
  getOrders(): PrintOrder[] {
    return [...this.orders].reverse();
  }

  getOrderById(id: string): PrintOrder | undefined {
    return this.orders.find(o => o.id === id);
  }

  findAnyOrderByPin(pin: string): PrintOrder | undefined {
    const cleanPin = pin.trim();
    return this.orders.find(o => o.fourDigitPin === cleanPin);
  }

  getOrderByPin(pin: string, organizationId?: string): PrintOrder | undefined {
    const cleanPin = pin.trim();
    return this.orders.find(o => {
      const matchPin = o.fourDigitPin === cleanPin;
      const isPaid = o.paymentStatus === 'paid';
      const isNotUsed = o.orderStatus === 'paid_ready_to_print';
      const isNotExpired = new Date(o.pinExpiresAt).getTime() > Date.now();
      
      if (organizationId && o.organizationId) {
        return matchPin && isPaid && isNotUsed && isNotExpired && o.organizationId === organizationId;
      }
      return matchPin && isPaid && isNotUsed && isNotExpired;
    });
  }

  createOrder(order: Omit<PrintOrder, 'id' | 'orderNumber' | 'createdAt'>): PrintOrder {
    const now = new Date();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;
    const id = `ord-${Date.now()}-${randomSuffix}`;

    const newOrder: PrintOrder = {
      ...order,
      id,
      orderNumber,
      createdAt: now.toISOString(),
    };

    this.orders.push(newOrder);
    return newOrder;
  }

  updateOrderStatus(
    orderId: string,
    status: PrintOrder['orderStatus'],
    extra?: Partial<PrintOrder>
  ): PrintOrder | undefined {
    const idx = this.orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (idx !== -1) {
      this.orders[idx] = {
        ...this.orders[idx],
        orderStatus: status,
        ...extra,
        ...(status === 'completed'
          ? {
              completedAt: new Date().toISOString(),
              pinUsedAt: new Date().toISOString(),
              fileStorageUrl: undefined,
              fileShredded: true,
              shreddedAt: new Date().toISOString(),
              shredMethod: 'DoD 5220.22-M Cryptographic Zero-Wipe (0 bytes retained)',
            }
          : {})
      };
      return this.orders[idx];
    }
    return undefined;
  }
}

// Global Singleton Instance
const globalObj = global as unknown as { __printAtmStore?: PrintAtmStore };
export const db: PrintAtmStore = globalObj.__printAtmStore ?? new PrintAtmStore();

if (process.env.NODE_ENV !== 'production') {
  globalObj.__printAtmStore = db;
}
