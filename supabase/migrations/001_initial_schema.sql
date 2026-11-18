-- PostPilot Supabase Database Schema
-- Multi-Account X Publishing & Scheduling Platform

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. X Accounts Table (Secure multi-account storage)
CREATE TABLE IF NOT EXISTS public.x_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    x_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    profile_image_url TEXT,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    connection_status TEXT NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'expired', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_x_account UNIQUE (user_id, x_user_id)
);

-- 3. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'partially_published', 'published', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Publishing Batches Table
CREATE TABLE IF NOT EXISTS public.publishing_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial_failure', 'failed')),
    total_operations INTEGER NOT NULL DEFAULT 0,
    successful_operations INTEGER NOT NULL DEFAULT 0,
    failed_operations INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Post Targets Table (Each post targeting an X account)
CREATE TABLE IF NOT EXISTS public.post_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    x_account_id UUID NOT NULL REFERENCES public.x_accounts(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.publishing_batches(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    x_post_id TEXT,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance querying and scheduling
CREATE INDEX IF NOT EXISTS idx_x_accounts_user_id ON public.x_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_post_targets_user_id ON public.post_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_post_id ON public.post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_account ON public.post_targets(x_account_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_status_scheduled ON public.post_targets(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_batches_user_id ON public.publishing_batches(user_id);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_x_accounts_updated_at ON public.x_accounts;
CREATE TRIGGER trigger_x_accounts_updated_at BEFORE UPDATE ON public.x_accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON public.posts;
CREATE TRIGGER trigger_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_post_targets_updated_at ON public.post_targets;
CREATE TRIGGER trigger_post_targets_updated_at BEFORE UPDATE ON public.post_targets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_publishing_batches_updated_at ON public.publishing_batches;
CREATE TRIGGER trigger_publishing_batches_updated_at BEFORE UPDATE ON public.publishing_batches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto create profile on auth signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_batches ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- X Accounts Policies
CREATE POLICY "Users can view own X accounts"
    ON public.x_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own X accounts"
    ON public.x_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own X accounts"
    ON public.x_accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own X accounts"
    ON public.x_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Posts Policies
CREATE POLICY "Users can view own posts"
    ON public.posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- Post Targets Policies
CREATE POLICY "Users can view own post targets"
    ON public.post_targets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own post targets"
    ON public.post_targets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own post targets"
    ON public.post_targets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own post targets"
    ON public.post_targets FOR DELETE
    USING (auth.uid() = user_id);

-- Publishing Batches Policies
CREATE POLICY "Users can view own publishing batches"
    ON public.publishing_batches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own publishing batches"
    ON public.publishing_batches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own publishing batches"
    ON public.publishing_batches FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own publishing batches"
    ON public.publishing_batches FOR DELETE
    USING (auth.uid() = user_id);

