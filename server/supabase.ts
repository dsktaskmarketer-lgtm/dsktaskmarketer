import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Production environment variable resolution (supports Docker, Cloud Run, Render, Vercel)
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

// Privileged Service Role Key (SERVER ONLY - NEVER EXPOSED TO CLIENT)
const serviceRoleKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY || 
  process.env.SUPABASE_SECRET_KEY || 
  '';

// Public/Anon Key fallback for standard queries if service role is absent
const anonKey = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_KEY || 
  '';

const activeServerKey = serviceRoleKey || anonKey;

export const isServerSupabaseConfigured = Boolean(supabaseUrl && activeServerKey);
export const hasServiceRolePrivilege = Boolean(supabaseUrl && serviceRoleKey);

if (isServerSupabaseConfigured) {
  console.log(`[Supabase Server] Initialized. Privileged Service Role: ${hasServiceRolePrivilege ? 'ENABLED (Server-only bypass)' : 'DISABLED (Anon fallback)'}`);
} else {
  console.log('[Supabase Server] Credentials not detected. Running with local storage engine.');
}

export const supabaseServer: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(supabaseUrl, activeServerKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

/**
 * Verifies a Supabase JWT access token on the server and returns the verified user.
 */
export async function verifySupabaseToken(tokenOrHeader?: string) {
  if (!tokenOrHeader || !supabaseServer) {
    return null;
  }

  let token = tokenOrHeader.trim();
  if (token.startsWith('Bearer ')) {
    token = token.substring(7).trim();
  }

  if (!token || !token.includes('.')) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.warn('[Supabase Auth] Token verification exception:', err);
    return null;
  }
}

/**
 * Privileged task synchronization to Supabase public.tasks table using service role.
 * Only invoked by authenticated admin endpoints on the server.
 */
export async function syncTaskToSupabase(task: any): Promise<{ success: boolean; error?: string }> {
  if (!supabaseServer || !task) {
    return { success: false, error: 'Supabase server not configured' };
  }

  try {
    const payload: Record<string, any> = {
      title: task.title,
      partner_name: task.partnerName || 'Partner',
      description: task.description || '',
      reward_amount: Number(task.rewardAmount) || 100,
      currency: task.currency || 'INR',
      affiliate_url: task.affiliateUrl || '',
      eligibility: task.eligibility || '',
      steps: Array.isArray(task.steps) ? task.steps : [],
      proof_requirements: Array.isArray(task.proofRequirements) ? task.proofRequirements : [],
      terms: task.terms || '',
      affiliate_disclosure: task.affiliateDisclosure || 'DSK TaskMarketer receives financial affiliate compensation from partner for qualified consumer actions.',
      active: task.isActive !== undefined ? Boolean(task.isActive) : (task.active !== undefined ? Boolean(task.active) : true),
      updated_at: new Date().toISOString(),
    };

    if (task.categoryId) payload.category_id = task.categoryId;
    if (task.campaignId) payload.campaign_id = task.campaignId;
    if (task.startsCount !== undefined) payload.starts_count = Number(task.startsCount);
    if (task.completionsCount !== undefined) payload.completions_count = Number(task.completionsCount);

    // If ID is valid UUID, include it; if text ID like tsk_cards_01, check if column accepts text or matches
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(task.id);
    if (isUuid) {
      payload.id = task.id;
    }

    // Try update first by matching id or title/partner
    let query = supabaseServer.from('tasks');
    let updateRes;
    if (isUuid) {
      updateRes = await query.update(payload).eq('id', task.id);
    } else {
      updateRes = await query.update(payload).eq('title', task.title);
    }

    if (updateRes.error) {
      console.warn('[Supabase Sync] Task update note:', updateRes.error.message);
      return { success: false, error: updateRes.error.message };
    }

    console.log(`[Supabase Sync] Task "${task.title}" (${task.id}) synchronized successfully`);
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Sync] Exception updating task in Supabase:', err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Privileged task deletion from Supabase public.tasks table.
 */
export async function deleteTaskFromSupabase(taskId: string): Promise<boolean> {
  if (!supabaseServer || !taskId) return false;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taskId);
    if (isUuid) {
      await supabaseServer.from('tasks').delete().eq('id', taskId);
    }
    return true;
  } catch {
    return false;
  }
}
