import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export async function runSupabaseMigration() {
  const dbPassword = process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || 'Sabith@93945307';
  const client = new pg.Client({
    host: 'db.iiujqngtjbqtjyuejnaw.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('[Supabase Migration] Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('[Supabase Migration] Connected successfully.');

    // 1. Extensions
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    // 2. Enum Types
    await client.query(`
      DO $$ BEGIN
          CREATE TYPE user_role_enum AS ENUM ('user', 'client', 'admin');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
          CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'pending');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
          CREATE TYPE campaign_status_enum AS ENUM ('draft', 'pending_approval', 'active', 'paused', 'completed', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
          CREATE TYPE submission_status_enum AS ENUM ('pending_review', 'under_verification', 'approved', 'rejected', 'resubmission_required');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
          CREATE TYPE withdrawal_status_enum AS ENUM ('pending', 'approved', 'paid', 'rejected', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
          CREATE TYPE transaction_type_enum AS ENUM ('task_reward', 'referral_reward', 'withdrawal', 'reversal', 'bonus');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Profiles Table
    await client.query(`
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
    `);

    // 4. Categories Table
    await client.query(`
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
    `);

    // 5. Campaigns Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.campaigns (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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
          status campaign_status_enum NOT NULL DEFAULT 'active',
          rejection_reason TEXT,
          total_budget NUMERIC(12, 2) DEFAULT 0,
          target_completions INTEGER DEFAULT 100,
          completions_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          approved_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 6. Tasks Table (Uses TEXT PRIMARY KEY so both custom IDs and UUIDs work seamlessly)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tasks (
          id TEXT PRIMARY KEY,
          campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
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
          affiliate_disclosure TEXT NOT NULL DEFAULT 'DSK TaskMarketer receives financial affiliate compensation from partner institution for qualified consumer actions.',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          display_order INTEGER NOT NULL DEFAULT 0,
          starts_count INTEGER NOT NULL DEFAULT 0,
          completions_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 7. Task Participants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.task_participants (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
          user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
          reference_id TEXT NOT NULL,
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 8. Submissions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.submissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
          campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
          user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    `);

    // 9. RLS & Functions
    await client.query(`
      ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.task_participants ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS BOOLEAN AS $$
      BEGIN
          RETURN (
              (auth.jwt() ->> 'role') = 'service_role' OR
              (auth.jwt() ->> 'email') IN ('admin@dsktaskmarketer.com', 'dsktaskmarketer@gmail.com', 'dsabithkumar4@gmail.com') OR
              EXISTS (
                  SELECT 1 FROM public.profiles
                  WHERE id = auth.uid() AND role = 'admin'
              )
          );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Drop existing policies if any to ensure clean recreation
      DROP POLICY IF EXISTS "Public can view active tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
      DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

      -- Task policies
      CREATE POLICY "Public can view active tasks" ON public.tasks
          FOR SELECT USING (active = TRUE OR public.is_admin());

      CREATE POLICY "Admins can manage tasks" ON public.tasks
          FOR ALL USING (public.is_admin());

      -- Category policies
      CREATE POLICY "Public can view active categories" ON public.categories
          FOR SELECT USING (active = TRUE OR public.is_admin());

      CREATE POLICY "Admins can manage categories" ON public.categories
          FOR ALL USING (public.is_admin());
    `);

    // 10. Seed Categories if empty
    await client.query(`
      INSERT INTO public.categories (id, name, slug, icon, description, active, display_order)
      VALUES 
        ('cat_cards', 'Credit Cards', 'credit-cards', 'CreditCard', 'Verified reward programs on bank credit card applications', true, 1),
        ('cat_banking', 'Banking Accounts', 'banking', 'Landmark', 'Digital zero-balance and premier savings account onboarding', true, 2),
        ('cat_demat', 'Demat & Trading', 'demat-investment', 'TrendingUp', 'Stock broking, discount demat, and wealth management platforms', true, 3),
        ('cat_loans', 'Personal Loans', 'loans', 'Banknote', 'Verified digital personal loan and instant credit line offers', true, 4),
        ('cat_insurance', 'Insurance', 'insurance', 'ShieldCheck', 'Health, life, and motor insurance quote & issuance verification', true, 5),
        ('cat_apps', 'Fintech Apps', 'financial-apps', 'Smartphone', 'Credit score monitors, UPI wallets, and savings apps', true, 6),
        ('cat_other', 'Special Offers', 'other-affiliates', 'Sparkles', 'Specialized partner offers and referral rewards', true, 7)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Reload PostgREST schema cache so Supabase immediately recognizes the new tables
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('[Supabase Migration] PostgREST schema cache reload signal dispatched.');

    console.log('[Supabase Migration] Schema successfully migrated!');
  } catch (err: any) {
    console.error('[Supabase Migration] Migration error:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.includes('migrate-supabase')) {
  runSupabaseMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
