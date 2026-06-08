-- ============================================================
-- MokineVeto — PostgreSQL JSONB Schema (v2 — document store)
-- Approche "document store" : chaque collection = une table
-- avec colonne JSONB. Compatible avec JsonCollection locale.
-- ============================================================
-- Version: 2.0 — May 2026

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Tables JSONB (une par collection) ──────────────────────

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email   ON users ((lower(data->>'email')));
CREATE INDEX        IF NOT EXISTS idx_users_role    ON users ((data->>'role'));

CREATE TABLE IF NOT EXISTS animals (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_animals_owner  ON animals ((data->>'ownerId'));
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals ((data->>'status'));

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointments_owner  ON appointments ((data->>'petOwnerId'));
CREATE INDEX IF NOT EXISTS idx_appointments_vet    ON appointments ((data->>'veterinarianId'));
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments ((data->>'status'));

CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consultations_farmer ON consultations ((data->>'farmerId'));
CREATE INDEX IF NOT EXISTS idx_consultations_vet    ON consultations ((data->>'veterinarianId'));
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations ((data->>'status'));

CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_vet    ON prescriptions ((data->>'veterinarianId'));
CREATE INDEX IF NOT EXISTS idx_prescriptions_animal ON prescriptions ((data->>'animalId'));

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_vendor   ON products ((data->>'vendorId'));
CREATE INDEX IF NOT EXISTS idx_products_category ON products ((data->>'category'));

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer  ON orders ((data->>'buyerId'));
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders ((data->>'status'));

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments ((data->>'userId'));

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications ((data->>'userId'));

CREATE TABLE IF NOT EXISTS health_records (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_records_animal ON health_records ((data->>'animalId'));

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_owner    ON alerts ((data->>'ownerId'));
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts ((data->>'severity'));

CREATE TABLE IF NOT EXISTS agenda (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agenda_vet ON agenda ((data->>'vetId'));

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_vet ON invoices ((data->>'vetId'));

CREATE TABLE IF NOT EXISTS kyc (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_vendor ON kyc ((data->>'vendorId'));

CREATE TABLE IF NOT EXISTS sales_points (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms ((data->>'ownerId'));

CREATE TABLE IF NOT EXISTS farm_members (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_farm_members_farm   ON farm_members ((data->>'farmId'));
CREATE INDEX IF NOT EXISTS idx_farm_members_user   ON farm_members ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_farm_members_token  ON farm_members ((data->>'token'));

CREATE TABLE IF NOT EXISTS sanitary_alerts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sanitary_alerts_severity ON sanitary_alerts ((data->>'severity'));

CREATE TABLE IF NOT EXISTS iot_devices (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iot_devices_owner  ON iot_devices ((data->>'ownerId'));
CREATE INDEX IF NOT EXISTS idx_iot_devices_animal ON iot_devices ((data->>'animalId'));

CREATE TABLE IF NOT EXISTS sensor_readings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_animal ON sensor_readings ((data->>'animalId'));
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device ON sensor_readings ((data->>'deviceId'));

CREATE TABLE IF NOT EXISTS iot_alerts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iot_alerts_device ON iot_alerts ((data->>'deviceId'));
CREATE INDEX IF NOT EXISTS idx_iot_alerts_owner  ON iot_alerts ((data->>'ownerId'));

-- ─── Ancien schéma relationnel (conservé pour référence) ────

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE,
    email CITEXT UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('farmer', 'veterinarian', 'vendor', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(10),
    verification_code_expires_at TIMESTAMP,
    language VARCHAR(10) DEFAULT 'fr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Farmer Profile
CREATE TABLE farmer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farm_name VARCHAR(200) NOT NULL,
    farm_location VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    farming_area_hectares DECIMAL(10, 2),
    primary_animal_types TEXT[], -- Array: ['bovin', 'ovin', 'caprin', 'volaille']
    total_animals INTEGER DEFAULT 0,
    years_in_farming INTEGER,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmer_profiles_user_id ON farmer_profiles(user_id);

-- Veterinarian Profile
CREATE TABLE veterinarian_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE,
    specialization VARCHAR(100),
    clinic_name VARCHAR(200),
    clinic_address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    service_radius_km INTEGER DEFAULT 50,
    languages_spoken TEXT[], -- Array: ['fr', 'fulfude', 'hausa']
    availability_hours JSON, -- {"monday": ["09:00", "18:00"], ...}
    consultation_rate_currency VARCHAR(3) DEFAULT 'XAF',
    consultation_rate_amount DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vet_profiles_user_id ON veterinarian_profiles(user_id);
CREATE INDEX idx_vet_profiles_license ON veterinarian_profiles(license_number);

-- Vendor Profile
CREATE TABLE vendor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    business_registration VARCHAR(100),
    business_address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    business_type VARCHAR(50), -- 'agrovet', 'pharmacy', 'supplier'
    delivery_available BOOLEAN DEFAULT false,
    service_radius_km INTEGER DEFAULT 20,
    bank_account_holder VARCHAR(100),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_profiles_user_id ON vendor_profiles(user_id);

-- ============================================================================
-- ANIMALS & HEALTH
-- ============================================================================

CREATE TABLE animals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    animal_type VARCHAR(50) NOT NULL CHECK (animal_type IN ('bovin', 'ovin', 'caprin', 'volaille')),
    breed VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('M', 'F', 'unknown')),
    photo_url VARCHAR(500),
    qr_code VARCHAR(100) UNIQUE,
    current_health_status VARCHAR(50) DEFAULT 'healthy' CHECK (current_health_status IN ('healthy', 'sick', 'weak', 'deceased')),
    weight_kg DECIMAL(10, 2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animals_farmer_id ON animals(farmer_id);
CREATE INDEX idx_animals_animal_type ON animals(animal_type);
CREATE INDEX idx_animals_health_status ON animals(current_health_status);

-- Animal Health Records
CREATE TABLE animal_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('vaccination', 'medication', 'treatment', 'observation', 'consultation')),
    record_date TIMESTAMP NOT NULL,
    product_name VARCHAR(200),
    dosage VARCHAR(200),
    frequency VARCHAR(100),
    duration_days INTEGER,
    notes TEXT,
    recorded_by_id UUID REFERENCES users(id),
    is_locked BOOLEAN DEFAULT true, -- After 24h, can't modify
    locked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_records_animal_id ON animal_health_records(animal_id);
CREATE INDEX idx_health_records_record_type ON animal_health_records(record_type);
CREATE INDEX idx_health_records_record_date ON animal_health_records(record_date DESC);

-- ============================================================================
-- CONSULTATIONS & COMMUNICATIONS
-- ============================================================================

CREATE TABLE consultation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES animals(id),
    veterinarian_id UUID REFERENCES veterinarian_profiles(id),
    request_status VARCHAR(50) DEFAULT 'open' CHECK (request_status IN ('open', 'accepted', 'in_progress', 'completed', 'rejected')),
    description TEXT NOT NULL,
    symptom_severity VARCHAR(50) CHECK (symptom_severity IN ('mild', 'moderate', 'severe')),
    urgency_level VARCHAR(50) DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'urgent')),
    media_urls TEXT[], -- Array of S3 URLs for photos/videos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consultation_requests_farmer_id ON consultation_requests(farmer_id);
CREATE INDEX idx_consultation_requests_veterinarian_id ON consultation_requests(veterinarian_id);
CREATE INDEX idx_consultation_requests_status ON consultation_requests(request_status);
CREATE INDEX idx_consultation_requests_created_at ON consultation_requests(created_at DESC);

-- Consultation Chat Messages
CREATE TABLE consultation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message_text TEXT NOT NULL,
    media_urls TEXT[], -- Array of S3 URLs
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consultation_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX idx_consultation_messages_sender_id ON consultation_messages(sender_id);
CREATE INDEX idx_consultation_messages_created_at ON consultation_messages(created_at DESC);
CREATE INDEX idx_consultation_messages_is_read ON consultation_messages(is_read);

-- ============================================================================
-- PRESCRIPTIONS & ORDONNANCES
-- ============================================================================

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultation_requests(id),
    veterinarian_id UUID NOT NULL REFERENCES veterinarian_profiles(id),
    animal_id UUID NOT NULL REFERENCES animals(id),
    prescription_number VARCHAR(50) UNIQUE,
    prescription_json JSONB NOT NULL, -- Structured prescription data
    pdf_url VARCHAR(500),
    signature_pin_hash VARCHAR(255), -- Hash of 4-digit PIN
    signed_at TIMESTAMP,
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMP,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX idx_prescriptions_veterinarian_id ON prescriptions(veterinarian_id);
CREATE INDEX idx_prescriptions_animal_id ON prescriptions(animal_id);
CREATE INDEX idx_prescriptions_signed_at ON prescriptions(signed_at DESC);

-- ============================================================================
-- MARKETPLACE
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100) NOT NULL CHECK (category IN ('vaccine', 'antiparasitic', 'antibiotic', 'supplement', 'equipment', 'other')),
    description TEXT,
    photo_url VARCHAR(500),
    price_xaf DECIMAL(10, 2) NOT NULL,
    price_currency VARCHAR(3) DEFAULT 'XAF',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    stock_alert_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id),
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id),
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'prepared', 'shipped', 'delivered', 'cancelled')),
    total_amount_xaf DECIMAL(10, 2) NOT NULL,
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('pickup', 'delivery')),
    delivery_address VARCHAR(500),
    delivery_date DATE,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50), -- 'mobile_money', 'bank_transfer', 'cash'
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price_xaf DECIMAL(10, 2) NOT NULL,
    subtotal_xaf DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- ALERTS & NOTIFICATIONS
-- ============================================================================

CREATE TABLE animal_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('health_symptom', 'vaccination_due', 'treatment_reminder', 'behavior_change', 'mortality')),
    severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    alert_description TEXT NOT NULL,
    photo_url VARCHAR(500),
    temperature_celsius DECIMAL(5, 2),
    observation_date TIMESTAMP NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animal_alerts_animal_id ON animal_alerts(animal_id);
CREATE INDEX idx_animal_alerts_alert_type ON animal_alerts(alert_type);
CREATE INDEX idx_animal_alerts_severity ON animal_alerts(severity);
CREATE INDEX idx_animal_alerts_resolved ON animal_alerts(resolved);

-- Push Notifications
CREATE TABLE push_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    related_entity_type VARCHAR(50), -- 'animal', 'order', 'consultation'
    fcm_token VARCHAR(500),
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_push_notifications_is_sent ON push_notifications(is_sent);
CREATE INDEX idx_push_notifications_is_read ON push_notifications(is_read);
CREATE INDEX idx_push_notifications_created_at ON push_notifications(created_at DESC);

-- ============================================================================
-- AI & QUESTIONNAIRE
-- ============================================================================

CREATE TABLE ai_questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id),
    animal_id UUID NOT NULL REFERENCES animals(id),
    animal_type VARCHAR(50) NOT NULL,
    responses_json JSONB NOT NULL, -- Full questionnaire responses
    severity_score INTEGER CHECK (severity_score BETWEEN 0 AND 10),
    severity_level VARCHAR(50) CHECK (severity_level IN ('mild', 'moderate', 'severe')),
    probable_diagnosis VARCHAR(200),
    diagnosis_confidence DECIMAL(5, 2), -- 0.0 to 1.0
    recommendation VARCHAR(200), -- 'self_care', 'veterinarian_recommended', 'urgent_vet'
    pdf_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_responses_farmer_id ON ai_questionnaire_responses(farmer_id);
CREATE INDEX idx_ai_responses_animal_id ON ai_questionnaire_responses(animal_id);
CREATE INDEX idx_ai_responses_created_at ON ai_questionnaire_responses(created_at DESC);

-- ============================================================================
-- PAYMENTS & TRANSACTIONS
-- ============================================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'refund', 'commission', 'withdrawal')),
    amount_xaf DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF',
    payment_method VARCHAR(50), -- 'mobile_money', 'bank', 'wallet'
    payment_provider VARCHAR(100), -- 'orange_money', 'mtn', 'moov'
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed')),
    external_reference VARCHAR(100), -- Provider's transaction ID
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- ANALYTICS & TRACKING
-- ============================================================================

CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON user_activity_logs(action);

-- ============================================================================
-- ADMIN & SUPPORT
-- ============================================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    assigned_to_admin_id UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ============================================================================
-- TIMESTAMPS TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_animals_updated_at BEFORE UPDATE ON animals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_requests_updated_at BEFORE UPDATE ON consultation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

CREATE VIEW v_dashboard_farmer_stats AS
SELECT 
    fp.id,
    fp.user_id,
    COUNT(DISTINCT a.id) as total_animals,
    COUNT(DISTINCT CASE WHEN a.current_health_status = 'sick' THEN a.id END) as sick_animals,
    COUNT(DISTINCT cr.id) as total_consultations,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount_xaf), 0) as total_spent_xaf
FROM farmer_profiles fp
LEFT JOIN animals a ON fp.id = a.farmer_id
LEFT JOIN consultation_requests cr ON fp.id = cr.farmer_id
LEFT JOIN orders o ON fp.id = o.farmer_id
GROUP BY fp.id, fp.user_id;

CREATE VIEW v_dashboard_veterinarian_stats AS
SELECT
    vp.id,
    vp.user_id,
    COUNT(DISTINCT cr.id) as total_consultations,
    COUNT(DISTINCT CASE WHEN cr.request_status = 'completed' THEN cr.id END) as completed_consultations,
    COUNT(DISTINCT p.id) as total_prescriptions,
    COUNT(DISTINCT CASE WHEN cr.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN cr.id END) as consultations_last_30_days
FROM veterinarian_profiles vp
LEFT JOIN consultation_requests cr ON vp.id = cr.veterinarian_id
LEFT JOIN prescriptions p ON vp.id = p.veterinarian_id
GROUP BY vp.id, vp.user_id;

CREATE VIEW v_dashboard_vendor_stats AS
SELECT
    vp.id,
    vp.user_id,
    COUNT(DISTINCT p.id) as total_products,
    SUM(CASE WHEN p.is_active THEN 1 ELSE 0 END) as active_products,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount_xaf), 0) as total_sales_xaf,
    COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.id END) as orders_last_30_days
FROM vendor_profiles vp
LEFT JOIN products p ON vp.id = p.vendor_id
LEFT JOIN orders o ON vp.id = o.vendor_id
GROUP BY vp.id, vp.user_id;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_animals_created_at ON animals(created_at DESC);
CREATE INDEX idx_consultation_requests_animal_id ON consultation_requests(animal_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_prescriptions_prescription_number ON prescriptions(prescription_number);

-- ============================================================================
-- SETTINGS & CONFIGURATION  (v3 — added 2026-06)
-- ============================================================================

-- JSONB collection (used by document-store layer)
CREATE TABLE IF NOT EXISTS settings (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key ON settings ((data->>'key'));
CREATE INDEX        IF NOT EXISTS idx_settings_group ON settings ((data->>'group'));

-- Relational version (alternative for direct SQL queries)
CREATE TABLE IF NOT EXISTS app_settings (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT         NOT NULL,
  group_name  VARCHAR(50)  DEFAULT 'general',
  label       VARCHAR(255),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO app_settings (key, value, group_name, label) VALUES
  ('app_name',                    'Mokine',           'brand',    'Nom de l''application'),
  ('business_name',               'CM TRU GROUP',     'business', 'Raison sociale'),
  ('business_address',            'Garoua, Cameroun', 'business', 'Adresse'),
  ('business_phone',              '678758976',        'business', 'Téléphone'),
  ('business_email',              'infos@trugroup.cm','business', 'Email'),
  ('support_email',               'infos@trugroup.cm','business', 'Email support'),
  ('currency',                    'XAF',              'payment',  'Devise'),
  ('country_code',                'CM',               'payment',  'Code pays'),
  ('easy_transact_service_code',  'DEPOSIT',          'payment',  'Code service Easy Transact')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ============================================================================
-- SUBSCRIPTION PLANS  (v3 — added 2026-06)
-- ============================================================================

-- JSONB collection
CREATE TABLE IF NOT EXISTS subscription_plans (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans ((data->>'slug'));

-- Relational version
CREATE TABLE IF NOT EXISTS sub_plans (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(50)    NOT NULL UNIQUE,
  name         VARCHAR(100)   NOT NULL,
  price        DECIMAL(12,2)  NOT NULL DEFAULT 0,
  price_label  VARCHAR(20),
  currency     VARCHAR(3)     NOT NULL DEFAULT 'XAF',
  period       VARCHAR(50),
  period_days  INTEGER        NOT NULL DEFAULT 30,
  description  TEXT,
  features     JSONB          DEFAULT '[]',
  badge        VARCHAR(50),
  color        VARCHAR(100),
  is_active    BOOLEAN        NOT NULL DEFAULT TRUE,
  sort_order   INTEGER        NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ    DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    DEFAULT NOW()
);

INSERT INTO sub_plans (slug, name, price, price_label, currency, period, period_days, description, features, badge, color, sort_order) VALUES
  ('gratuit',    'Gratuit',    0,     '0',      'XAF', 'par mois',    30,  'Parfait pour découvrir.',                     '["5 prédiagnostics image","5 prédiagnostics texte","Fonctionnalités de base","Support standard"]',          NULL,       'border-gray-200',   1),
  ('standard',   'Standard',   5000,  '5.000',  'XAF', 'par mois',    30,  'Accès illimité pour usage régulier.',         '["Images illimitées","Texte illimité","Voix illimité","Support prioritaire"]',                              'Populaire','border-green-400',  2),
  ('premium',    'Premium',    12000, '12.000', 'XAF', 'par 3 mois',  90,  'Meilleur rapport qualité-prix.',             '["Tout Standard","Avant-premières","Support 24/7","Consultation vétérinaire prioritaire"]',                  NULL,       'border-blue-400',   3),
  ('entreprise', 'Entreprise', 45000, '45.000', 'XAF', 'par an',      365, 'Solution complète pour professionnels.',     '["Tout Premium","Assistance dédiée","Facturation personnalisée","Accès API"]',                              NULL,       'border-purple-400', 4)
ON CONFLICT (slug) DO UPDATE SET
  price = EXCLUDED.price, period_days = EXCLUDED.period_days,
  features = EXCLUDED.features, updated_at = NOW();

-- ============================================================================
-- PAYMENT TRANSACTIONS (Easy Transact)  (v3 — added 2026-06)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                     SERIAL PRIMARY KEY,
  user_id                TEXT          REFERENCES users(id) ON DELETE SET NULL,
  vendor_reference       VARCHAR(100)  NOT NULL UNIQUE,
  plan_slug              VARCHAR(50),
  amount                 DECIMAL(12,2) NOT NULL,
  currency               VARCHAR(3)    NOT NULL DEFAULT 'XAF',
  payment_method         VARCHAR(50)   DEFAULT 'mobile_money',
  payor_name             VARCHAR(255),
  phone_number           VARCHAR(30),
  country_code           VARCHAR(5),
  gateway                VARCHAR(50)   DEFAULT 'easy_transact',
  gateway_ref            VARCHAR(255),
  checkout_url           TEXT,
  status                 VARCHAR(30)   NOT NULL DEFAULT 'INITIATED'
                           CHECK (status IN ('INITIATED','PENDING','COMPLETED','FAILED','CANCELLED')),
  webhook_payload        JSONB,
  created_at             TIMESTAMPTZ   DEFAULT NOW(),
  completed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user   ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_vendor ON payment_transactions(vendor_reference);

-- ============================================================================
-- CONTRIBUTIONS & API PLANS  (v3 — added 2026-06)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contributions (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions ((data->>'userId'));

CREATE TABLE IF NOT EXISTS api_subscriptions (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_subs_user ON api_subscriptions ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_api_subs_plan ON api_subscriptions ((data->>'planId'));

CREATE TABLE IF NOT EXISTS api_plans (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_plans_slug ON api_plans ((data->>'slug'));

-- ============================================================================
-- END OF SCHEMA v3
-- schema: mokine_prod | charset: UTF-8 | timezone: UTC
-- Apply with: psql -U mokine_user -d mokine -f schema.sql
-- ============================================================================
