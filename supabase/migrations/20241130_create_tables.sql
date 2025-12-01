-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_type VARCHAR(20) CHECK (profile_type IN ('TAC', 'CLT', 'COMISSIONADO')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_type ON profiles(profile_type);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('frete', 'adiantamento', 'saldo', 'diesel', 'arla', 'pedagio', 'chapa', 'diaria', 'quebra_caixa', 'manutencao')),
  type VARCHAR(10) CHECK (type IN ('income', 'expense')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  description TEXT,
  proof_url TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Create fuel_logs table
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID,
  odometer INTEGER NOT NULL,
  liters DECIMAL(8,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  is_full_tank BOOLEAN DEFAULT FALSE,
  arla_liters DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fuel_user_vehicle ON fuel_logs(user_id, vehicle_id);
CREATE INDEX idx_fuel_full_tank ON fuel_logs(is_full_tank);

-- Create visual_inventory table
CREATE TABLE visual_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  ai_tags TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_user_id ON visual_inventory(user_id);
CREATE INDEX idx_inventory_tags ON visual_inventory USING GIN(ai_tags);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own fuel logs" ON fuel_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own fuel logs" ON fuel_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own inventory" ON visual_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own inventory" ON visual_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON profiles TO authenticated;
GRANT ALL ON profiles TO authenticated;

GRANT SELECT ON transactions TO authenticated;
GRANT ALL ON transactions TO authenticated;

GRANT SELECT ON fuel_logs TO authenticated;
GRANT ALL ON fuel_logs TO authenticated;

GRANT SELECT ON visual_inventory TO authenticated;
GRANT ALL ON visual_inventory TO authenticated;