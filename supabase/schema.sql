-- ==========================================================
-- PRINTPOINT CLUSTER DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- 100% Free Tier Ready for 500,000+ Orders & Kiosks
-- ==========================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZATIONS TABLE (Colleges, Libraries, Xerox Networks)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KIOSK MACHINES TABLE (Physical Terminals & Xerox Stations)
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    organization_name TEXT,
    machine_code TEXT UNIQUE NOT NULL, -- e.g. "RIT-ATM-01"
    display_name TEXT NOT NULL,
    location_description TEXT,
    deployment_type TEXT DEFAULT 'kiosk_atm' CHECK (deployment_type IN ('kiosk_atm', 'xerox_shop')),
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'busy', 'paper_low', 'paper_empty', 'maintenance', 'offline')),
    paper_status TEXT DEFAULT 'ok' CHECK (paper_status IN ('ok', 'low', 'empty', 'unknown')),
    current_sheets_remaining INT DEFAULT 500,
    total_capacity_sheets INT DEFAULT 500,
    toner_level_percent INT DEFAULT 100,
    internal_temp_celsius NUMERIC DEFAULT 28.0,
    is_door_open BOOLEAN DEFAULT FALSE,
    qr_code_token TEXT,
    ip_address TEXT,
    default_printer_model TEXT DEFAULT 'HP LaserJet Pro M404dn',
    printer_connection_type TEXT DEFAULT 'windows_spooler',
    printer_spooler_name TEXT DEFAULT 'HP LaserJet Pro M404dn',
    printer_port_or_ip TEXT DEFAULT 'USB001',
    duplex_hardware_capable BOOLEAN DEFAULT TRUE,
    daemon_secret_token TEXT,
    secondary_logo_url TEXT,
    custom_domain TEXT,
    manager_phone TEXT DEFAULT '8667466390',
    low_paper_threshold INT DEFAULT 50,
    last_paper_refill_at TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
    active_printer_status TEXT DEFAULT 'connected',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DYNAMIC PRICING RULES TABLE
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    paper_size TEXT DEFAULT 'A4',
    bw_single_paise INT DEFAULT 200,     -- ₹2.00
    bw_duplex_paise INT DEFAULT 350,     -- ₹3.50
    color_single_paise INT DEFAULT 1000, -- ₹10.00
    color_duplex_paise INT DEFAULT 1800, -- ₹18.00
    minimum_order_paise INT DEFAULT 200, -- ₹2.00
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRINT ORDERS & PIN TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- e.g. "ORD-20261007-0042"
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    machine_code TEXT NOT NULL,
    machine_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    file_name TEXT NOT NULL,
    file_size_formatted TEXT,
    file_storage_url TEXT, -- Cloudflare R2 Storage Key (e.g. "orders/uuid/doc.pdf")
    detected_total_pages INT DEFAULT 1,
    selected_page_ranges TEXT DEFAULT 'all',
    calculated_print_pages INT DEFAULT 1,
    calculated_sheets INT DEFAULT 1,
    copies INT DEFAULT 1,
    color_mode TEXT DEFAULT 'bw' CHECK (color_mode IN ('bw', 'color')),
    duplex_mode TEXT DEFAULT 'simplex' CHECK (duplex_mode IN ('simplex', 'duplex')),
    paper_size TEXT DEFAULT 'A4',
    price_per_sheet_paise INT DEFAULT 200,
    subtotal_paise INT NOT NULL,
    tax_paise INT DEFAULT 0,
    total_amount_paise INT NOT NULL,
    four_digit_pin VARCHAR(4) NOT NULL,
    pin_expires_at TIMESTAMPTZ NOT NULL,
    pin_used_at TIMESTAMPTZ,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT DEFAULT 'created' CHECK (order_status IN ('created', 'paid_ready_to_print', 'printing', 'completed', 'failed', 'refunded')),
    payment_gateway_order_id TEXT,
    payment_id TEXT,
    file_shredded BOOLEAN DEFAULT FALSE,
    shredded_at TIMESTAMPTZ,
    shred_method TEXT DEFAULT 'DoD 5220.22-M Cryptographic Zero-Wipe',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. INDEXES FOR ULTRA-FAST KIOSK PIN LOOKUPS (< 10ms)
CREATE INDEX IF NOT EXISTS idx_orders_pin ON orders(four_digit_pin);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(machine_code);

