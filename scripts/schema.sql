-- SQL Schema for UperAI Tables in Supabase
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    name TEXT,
    email TEXT UNIQUE,
    profile_image TEXT,
    role TEXT DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security) if desired, or disable/bypass for admin role
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow service role full access" ON public.users TO service_role USING (true) WITH CHECK (true);

-- 2. Stocks Table
CREATE TABLE IF NOT EXISTS public.stocks (
    id TEXT PRIMARY KEY,
    ticker TEXT UNIQUE,
    name TEXT,
    price DOUBLE PRECISION,
    change TEXT,
    market_cap TEXT,
    pe_ratio TEXT,
    div_yield TEXT,
    roe TEXT
);

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for stocks" ON public.stocks FOR SELECT USING (true);
CREATE POLICY "Allow service role full access" ON public.stocks TO service_role USING (true) WITH CHECK (true);

-- 3. News Table
CREATE TABLE IF NOT EXISTS public.news (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    author TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Allow service role full access" ON public.news TO service_role USING (true) WITH CHECK (true);

-- 4. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    type TEXT,
    message TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert access for feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON public.feedback TO service_role USING (true) WITH CHECK (true);

-- 5. Logs Table
CREATE TABLE IF NOT EXISTS public.logs (
    id TEXT PRIMARY KEY,
    email TEXT,
    action TEXT,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access" ON public.logs TO service_role USING (true) WITH CHECK (true);
