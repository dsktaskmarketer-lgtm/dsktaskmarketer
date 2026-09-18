-- ==============================================================================
-- DSK TaskMarketer - Production Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('user', 'client', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status_enum AS ENUM ('draft', 'pending_approval', 'active', 'paused', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status_enum AS ENUM ('pending_review', 'under_verification', 'approved', 'rejected', 'resubmission_required');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE withdrawal_status_enum AS ENUM ('pending', 'approved', 'paid', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM ('task_reward', 'referral_reward', 'withdrawal', 'reversal', 'bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    role user_role_enum NOT NULL DEFAULT 'user',
    status user_status_enum NOT NULL DEFAULT 'active',
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    profile_photo TEXT,
    upi_id TEXT,
    account_holder_name TEXT,
    bank_account TEXT,
    ifsc TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Clients / Advertisers Table (Profiles with role = 'client')
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    website TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Task Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Sparkles',
    description TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Campaigns Table (Created by Clients or Admin)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    partner_name TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_amount NUMERIC(10, 2) NOT NULL CHECK (reward_amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    affiliate_url TEXT NOT NULL,
    eligibility TEXT NOT NULL DEFAULT '',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    proof_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    terms TEXT NOT NULL DEFAULT '',
    status campaign_status_enum NOT NULL DEFAULT 'pending_approval',
    rejection_reason TEXT,
    total_budget NUMERIC(12, 2) DEFAULT 0,
    target_completions INTEGER DEFAULT 100,
    completions_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Active Tasks Table (Derives from approved campaigns or admin tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    partner_name TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_amount NUMERIC(10, 2) NOT NULL CHECK (reward_amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    affiliate_url TEXT NOT NULL,
    eligibility TEXT NOT NULL DEFAULT '',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    proof_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    terms TEXT NOT NULL DEFAULT '',
    affiliate_disclosure TEXT NOT NULL DEFAULT 'DSK TaskMarketer receives financial affiliate compensation from partner for qualified consumer actions.',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    starts_count INTEGER NOT NULL DEFAULT 0,
    completions_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Task Participants / Starts
CREATE TABLE IF NOT EXISTS public.task_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    proof_application_id TEXT NOT NULL,
    screenshot_url TEXT,
    user_note TEXT,
    status submission_status_enum NOT NULL DEFAULT 'pending_review',
    admin_note TEXT,
    rejection_reason TEXT,
    reward_amount NUMERIC(10, 2) NOT NULL CHECK (reward_amount >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 10. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_earnings >= 0),
    available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
    pending_rewards NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pending_rewards >= 0),
    referral_rewards NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (referral_rewards >= 0),
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Wallet Transactions Ledger Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    type transaction_type_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'credited',
    reference_id TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 200),
    payout_method TEXT NOT NULL,
    upi_id TEXT,
    bank_account TEXT,
    ifsc TEXT,
    account_holder_name TEXT,
    status withdrawal_status_enum NOT NULL DEFAULT 'pending',
    payment_reference TEXT,
    paid_amount NUMERIC(10, 2),
    paid_date TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_note TEXT,
    rejection_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 13. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_name TEXT NOT NULL,
    referred_user_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered',
    reward_amount NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    settings JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role user_role_enum NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- WALLETS Policies (Strict: Read only for owner, modifications via backend/trigger)
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- SUBMISSIONS Policies
CREATE POLICY "Users can view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR EXISTS (
        SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.client_id = auth.uid()
    ));

CREATE POLICY "Users can insert own submissions" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins or Campaign Owners can update submissions" ON public.submissions
    FOR UPDATE USING (public.is_admin() OR EXISTS (
        SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.client_id = auth.uid()
    ));

-- TASKS Policies (Public read for active tasks, admin full control)
CREATE POLICY "Public can view active tasks" ON public.tasks
    FOR SELECT USING (active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage tasks" ON public.tasks
    FOR ALL USING (public.is_admin());

-- CAMPAIGNS Policies
CREATE POLICY "Clients can view their own campaigns" ON public.campaigns
    FOR SELECT USING (client_id = auth.uid() OR public.is_admin() OR status = 'active');

CREATE POLICY "Clients can insert campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Clients can update their own draft campaigns, Admins can update all" ON public.campaigns
    FOR UPDATE USING ((client_id = auth.uid() AND status IN ('draft', 'pending_approval')) OR public.is_admin());

-- WITHDRAWALS Policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
    FOR UPDATE USING (public.is_admin());

-- REFERRALS Policies
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (referrer_id = auth.uid() OR public.is_admin());

-- NOTIFICATIONS Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ==============================================================================
-- Triggers for Auth User Synchronization & Wallet Initializer
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_role user_role_enum := 'user';
    ref_code TEXT;
    referred_by_code TEXT;
BEGIN
    -- Check if designated initial administrator email
    IF LOWER(NEW.email) = 'admin@dsktaskmarketer.com' OR LOWER(NEW.email) = 'dsabithkumar3@gmail.com' OR LOWER(NEW.email) = 'dsabithkumar1@gmail.com' THEN
        initial_role := 'admin';
    ELSIF (NEW.raw_user_meta_data->>'role') = 'client' THEN
        initial_role := 'client';
    ELSE
        initial_role := 'user';
    END IF;

    -- Generate unique referral code: DSK + random 4 uppercase chars/digits
    ref_code := 'DSK' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
    referred_by_code := NEW.raw_user_meta_data->>'referralCode';

    -- Insert Profile
    INSERT INTO public.profiles (
        id,
        name,
        email,
        mobile,
        role,
        status,
        referral_code,
        referred_by
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Member'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
        initial_role,
        'active',
        ref_code,
        referred_by_code
    );

    -- Initialize Empty Wallet
    INSERT INTO public.wallets (
        user_id,
        total_earnings,
        available_balance,
        pending_rewards,
        referral_rewards,
        completed_tasks
    ) VALUES (
        NEW.id,
        0.00,
        0.00,
        0.00,
        0.00,
        0
    );

    -- If referred by someone, record in referrals table
    IF referred_by_code IS NOT NULL AND referred_by_code <> '' THEN
        INSERT INTO public.referrals (
            referrer_id,
            referred_user_id,
            referred_user_name,
            referred_user_email,
            status,
            reward_amount
        )
        SELECT 
            p.id,
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', 'Member'),
            NEW.email,
            'registered',
            50.00
        FROM public.profiles p
        WHERE p.referral_code = referred_by_code
        ON CONFLICT (referred_user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to strictly block privilege escalation on public.profiles
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent normal users from altering their role or status
    IF (NEW.role <> OLD.role OR NEW.status <> OLD.status) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only verified platform administrators can alter user roles or account status.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();

-- Trigger on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
