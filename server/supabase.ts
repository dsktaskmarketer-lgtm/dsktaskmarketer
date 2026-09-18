import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Task } from '../src/types';

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
 * Maps a Supabase tasks row into the standardized Task application interface.
 */
export function mapRowToTask(row: any): Task {
  return {
    id: String(row.id),
    campaignId: row.campaign_id || undefined,
    categoryId: row.category_id || 'cat_cards',
    partnerName: row.partner_name || 'Partner',
    title: row.title || 'Campaign Task',
    rewardAmount: Number(row.reward_amount) || 0,
    currency: row.currency || 'INR',
    description: row.description || '',
    eligibility: row.eligibility || '',
    steps: Array.isArray(row.steps) ? row.steps : [],
    proofRequirements: Array.isArray(row.proof_requirements) ? row.proof_requirements : [],
    terms: row.terms || '',
    affiliateUrl: row.affiliate_url || '',
    affiliateDisclosure: row.affiliate_disclosure || 'DSK TaskMarketer receives financial affiliate compensation from partner institution for qualified consumer actions.',
    active: Boolean(row.active),
    isActive: Boolean(row.active),
    displayOrder: Number(row.display_order) || 0,
    startsCount: Number(row.starts_count) || 0,
    completionsCount: Number(row.completions_count) || 0,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Loads tasks directly from the Supabase database.
 * Supports public and admin filters (category, search, active).
 */
export async function loadTasksFromSupabase(filter?: {
  admin?: boolean;
  category?: string;
  search?: string;
}): Promise<Task[]> {
  if (!supabaseServer) {
    return [];
  }

  try {
    let query = supabaseServer
      .from('tasks')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Non-admin callers only see active tasks
    if (!filter?.admin) {
      query = query.eq('active', true);
    }

    if (filter?.category && filter.category !== 'all') {
      query = query.eq('category_id', filter.category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase DB] Error loading tasks:', error);
      return [];
    }

    let tasks = (data || []).map(mapRowToTask);

    if (filter?.search && typeof filter.search === 'string') {
      const q = filter.search.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.partnerName.toLowerCase().includes(q)
      );
    }

    return tasks;
  } catch (err) {
    console.error('[Supabase DB] Exception loading tasks:', err);
    return [];
  }
}

/**
 * Retrieves a single task from Supabase by its unique ID.
 */
export async function getTaskByIdFromSupabase(taskId: string): Promise<Task | null> {
  if (!supabaseServer || !taskId) return null;
  try {
    const { data, error } = await supabaseServer
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToTask(data);
  } catch (err) {
    console.error(`[Supabase DB] Exception retrieving task ${taskId}:`, err);
    return null;
  }
}

/**
 * Stores (creates or updates) a task in the Supabase database.
 * Privileged operation using service role.
 */
export async function saveTaskToSupabase(task: Partial<Task>): Promise<{ success: boolean; task?: Task; error?: string }> {
  if (!supabaseServer || !task) {
    return { success: false, error: 'Supabase database is not configured' };
  }

  try {
    const id = task.id || `tsk_${Date.now()}`;
    const isActive = task.isActive !== undefined ? Boolean(task.isActive) : (task.active !== undefined ? Boolean(task.active) : true);

    const payload: Record<string, any> = {
      id,
      title: task.title || 'Financial Campaign Task',
      partner_name: task.partnerName || 'Partner',
      category_id: task.categoryId || 'cat_cards',
      campaign_id: task.campaignId || null,
      description: task.description || '',
      reward_amount: Number(task.rewardAmount) || 0,
      currency: task.currency || 'INR',
      affiliate_url: task.affiliateUrl || '',
      eligibility: task.eligibility || '',
      steps: Array.isArray(task.steps) ? task.steps : [],
      proof_requirements: Array.isArray(task.proofRequirements) ? task.proofRequirements : [],
      terms: task.terms || '',
      affiliate_disclosure: task.affiliateDisclosure || 'DSK TaskMarketer receives financial affiliate compensation from partner institution for qualified consumer actions.',
      active: isActive,
      display_order: Number(task.displayOrder) || 0,
      starts_count: Number(task.startsCount) || 0,
      completions_count: Number(task.completionsCount) || 0,
      updated_at: new Date().toISOString()
    };

    if (task.createdAt) {
      payload.created_at = task.createdAt;
    }

    const { data, error } = await supabaseServer
      .from('tasks')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase DB] Error saving task:', error.message);
      return { success: false, error: error.message };
    }

    const savedTask = mapRowToTask(data);
    console.log(`[Supabase DB] Successfully saved task ${savedTask.id} ("${savedTask.title}") in Supabase`);
    return { success: true, task: savedTask };
  } catch (err: any) {
    console.error('[Supabase DB] Exception saving task in Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Database error saving task' };
  }
}

/**
 * Toggles or deletes a task in the Supabase database.
 */
export async function deleteTaskFromSupabase(taskId: string, soft = true): Promise<boolean> {
  if (!supabaseServer || !taskId) return false;
  try {
    if (soft) {
      const { error } = await supabaseServer
        .from('tasks')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      return !error;
    } else {
      const { error } = await supabaseServer
        .from('tasks')
        .delete()
        .eq('id', taskId);
      return !error;
    }
  } catch (err) {
    console.error(`[Supabase DB] Exception removing task ${taskId}:`, err);
    return false;
  }
}

/**
 * Records a task start in Supabase (participants and counter).
 */
export async function recordTaskStartInSupabase(taskId: string, userId?: string, referenceId?: string): Promise<boolean> {
  if (!supabaseServer || !taskId) return false;
  try {
    // 1. Insert participant row
    if (referenceId) {
      const isUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
      await supabaseServer.from('task_participants').insert({
        task_id: taskId,
        user_id: isUuid ? userId : null,
        reference_id: referenceId,
        started_at: new Date().toISOString()
      });
    }

    // 2. Increment starts_count
    const { data: current } = await supabaseServer
      .from('tasks')
      .select('starts_count')
      .eq('id', taskId)
      .maybeSingle();

    if (current) {
      const newCount = (Number(current.starts_count) || 0) + 1;
      await supabaseServer
        .from('tasks')
        .update({ starts_count: newCount, updated_at: new Date().toISOString() })
        .eq('id', taskId);
    }

    return true;
  } catch (err) {
    console.warn('[Supabase DB] Note recording task start in Supabase:', err);
    return false;
  }
}

/**
 * Backward-compatible helper for server endpoints.
 */
export async function syncTaskToSupabase(task: any): Promise<{ success: boolean; error?: string }> {
  return saveTaskToSupabase(task);
}

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
