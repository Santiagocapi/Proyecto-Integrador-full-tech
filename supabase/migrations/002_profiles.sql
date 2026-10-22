
-- 1. Perfiles de usuarios y roles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    zip TEXT,
    role TEXT NOT NULL DEFAULT 'comprador'
        CHECK (role IN ('comprador', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
