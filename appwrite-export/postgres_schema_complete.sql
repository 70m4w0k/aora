-- Migration tracking
CREATE TABLE migration_tracking (
    id SERIAL PRIMARY KEY,
    appwrite_collection VARCHAR(100) NOT NULL,
    migrated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    records_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Households (multi-tenant separation)
CREATE TABLE households (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member',
    xp_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(household_id, email)
);

-- Tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    recurrence JSONB,
    category VARCHAR(100),
    estimated_minutes INTEGER,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Task Completions (task_done)
CREATE TABLE task_completions (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    completed_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    xp_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Stores
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,
    store_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(100),
    unit_type VARCHAR(50),
    default_store_id INTEGER REFERENCES stores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Shopping Items
CREATE TABLE shopping_items (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    added_by INTEGER REFERENCES users(id),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2),
    store_id INTEGER REFERENCES stores(id),
    status VARCHAR(50) DEFAULT 'pending',
    purchased_at TIMESTAMP WITH TIME ZONE,
    purchased_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Expenses
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    store_id INTEGER REFERENCES stores(id),
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    receipt_url TEXT,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Expense Settlements
CREATE TABLE expense_settlements (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    settled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Price History
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    recorded_by INTEGER REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Plants
CREATE TABLE plants (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255),
    location VARCHAR(255),
    care_instructions TEXT,
    watering_frequency_days INTEGER,
    fertilizing_frequency_days INTEGER,
    last_watered_at TIMESTAMP WITH TIME ZONE,
    last_fertilized_at TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    health_status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Plant Events
CREATE TABLE plant_events (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    performed_by INTEGER REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    xp_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Plant Reminders
CREATE TABLE plant_reminders (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes BIGINT,
    uploaded_by INTEGER REFERENCES users(id),
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    created_by INTEGER REFERENCES users(id),
    is_all_day BOOLEAN DEFAULT FALSE,
    recurrence JSONB,
    reminder_minutes_before INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Habits Arcs
CREATE TABLE habits_arcs (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50),
    total_xp_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Habits Quests
CREATE TABLE habits_quests (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    arc_id INTEGER REFERENCES habits_arcs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quest_type VARCHAR(50),
    xp_reward INTEGER DEFAULT 0,
    required_completions INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Habits Quests Completions
CREATE TABLE habits_quests_completions (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    quest_id INTEGER REFERENCES habits_quests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    xp_earned INTEGER DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Habits Tiers
CREATE TABLE habits_tiers (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    arc_id INTEGER REFERENCES habits_arcs(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    tier_level INTEGER NOT NULL,
    required_xp INTEGER NOT NULL,
    reward_description TEXT,
    unlock_criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(arc_id, tier_level)
);

-- Habits Tiers Completions
CREATE TABLE habits_tiers_completions (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    tier_id INTEGER REFERENCES habits_tiers(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    xp_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE(tier_id, user_id)
);

-- Habits User Progress
CREATE TABLE habits_user_progress (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    arc_id INTEGER REFERENCES habits_arcs(id) ON DELETE CASCADE,
    current_xp INTEGER DEFAULT 0,
    current_tier_id INTEGER REFERENCES habits_tiers(id),
    arc_progress JSONB NOT NULL DEFAULT '{}',
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, arc_id)
);

-- Habits XP History
CREATE TABLE habits_xp_history (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    arc_id INTEGER REFERENCES habits_arcs(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    xp_source VARCHAR(100),
    source_id INTEGER,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Videos
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    appwrite_id VARCHAR(255) UNIQUE NOT NULL,
    household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    category VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_households_created ON households (created_at);
CREATE INDEX IF NOT EXISTS idx_users_household ON users (household_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users (created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_household ON tasks (household_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions (task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions (completed_by);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions (completed_at);
CREATE INDEX IF NOT EXISTS idx_stores_household ON stores (household_id);
CREATE INDEX IF NOT EXISTS idx_products_household ON products (household_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_shopping_items_household ON shopping_items (household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_status ON shopping_items (status);
CREATE INDEX IF NOT EXISTS idx_shopping_items_product ON shopping_items (product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_household ON expenses (household_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
CREATE INDEX IF NOT EXISTS idx_expense_settlements_household ON expense_settlements (household_id);
CREATE INDEX IF NOT EXISTS idx_expense_settlements_from_user ON expense_settlements (from_user_id);
CREATE INDEX IF NOT EXISTS idx_expense_settlements_status ON expense_settlements (status);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history (product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_store ON price_history (store_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history (recorded_at);
CREATE INDEX IF NOT EXISTS idx_plants_household ON plants (household_id);
CREATE INDEX IF NOT EXISTS idx_plants_health ON plants (health_status);
CREATE INDEX IF NOT EXISTS idx_plant_events_plant ON plant_events (plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_events_type ON plant_events (event_type);
CREATE INDEX IF NOT EXISTS idx_plant_events_date ON plant_events (performed_at);
CREATE INDEX IF NOT EXISTS idx_plant_reminders_plant ON plant_reminders (plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_reminders_due_date ON plant_reminders (due_date);
CREATE INDEX IF NOT EXISTS idx_plant_reminders_completed ON plant_reminders (is_completed);
CREATE INDEX IF NOT EXISTS idx_documents_household ON documents (household_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents (category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_events_household ON events (household_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events (created_by);
CREATE INDEX IF NOT EXISTS idx_habits_arcs_household ON habits_arcs (household_id);
CREATE INDEX IF NOT EXISTS idx_habits_arcs_active ON habits_arcs (is_active);
CREATE INDEX IF NOT EXISTS idx_habits_quests_arc ON habits_quests (arc_id);
CREATE INDEX IF NOT EXISTS idx_habits_quests_active ON habits_quests (is_active);
CREATE INDEX IF NOT EXISTS idx_habits_quests_completions_quest ON habits_quests_completions (quest_id);
CREATE INDEX IF NOT EXISTS idx_habits_quests_completions_user ON habits_quests_completions (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_habits_quests_completions_unique_daily
    ON habits_quests_completions (quest_id, user_id, (DATE(completed_at)));
CREATE INDEX IF NOT EXISTS idx_habits_tiers_arc ON habits_tiers (arc_id);
CREATE INDEX IF NOT EXISTS idx_habits_tiers_completions_tier ON habits_tiers_completions (tier_id);
CREATE INDEX IF NOT EXISTS idx_habits_tiers_completions_user ON habits_tiers_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_progress_user ON habits_user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_progress_arc ON habits_user_progress (arc_id);
CREATE INDEX IF NOT EXISTS idx_habits_xp_history_user ON habits_xp_history (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_xp_history_arc ON habits_xp_history (arc_id);
CREATE INDEX IF NOT EXISTS idx_habits_xp_history_date ON habits_xp_history (earned_at);
CREATE INDEX IF NOT EXISTS idx_videos_household ON videos (household_id);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos (category);

-- Helper Functions & Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;
