import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Task, CampaignEnquiry, PartnerType } from '../src/types.ts';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

// Production environment variable resolution (supports Docker, Cloud Run, Render, Vercel)
const rawUrl = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';
const supabaseUrl = cleanEnv(rawUrl).replace(/\/$/, '');

// Privileged Service Role Key (SERVER ONLY - NEVER EXPOSED TO CLIENT)
const rawServiceRole = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY || 
  process.env.SUPABASE_SECRET_KEY || 
  '';
const serviceRoleKey = cleanEnv(rawServiceRole);

// Public/Anon Key fallback for standard queries if service role is absent
const rawAnon = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_KEY || 
  '';
const anonKey = cleanEnv(rawAnon);

const activeServerKey = serviceRoleKey || anonKey;

export const isServerSupabaseConfigured = Boolean(supabaseUrl && activeServerKey);
export const hasServiceRolePrivilege = Boolean(supabaseUrl && serviceRoleKey);

let clientInstance: SupabaseClient | null = null;

if (isServerSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, activeServerKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const keyHint = activeServerKey.length > 10 ? `${activeServerKey.slice(0, 6)}...${activeServerKey.slice(-4)}` : 'SET';
    console.log(`[Supabase Server] Connection configured successfully.`);
    console.log(`[Supabase Server] Target Project URL: ${supabaseUrl}`);
    console.log(`[Supabase Server] Auth Privilege Mode: ${hasServiceRolePrivilege ? 'SERVICE_ROLE (full RLS bypass)' : 'ANON_KEY (subject to RLS policies)'} [${keyHint}]`);
  } catch (initErr: any) {
    console.error('[Supabase Server] Client initialization failed:', initErr?.message || initErr);
    clientInstance = null;
  }
} else {
  console.warn('[Supabase Server] Credentials not detected. Running with local memory store.');
}

export const supabaseServer: SupabaseClient | null = clientInstance;

/**
 * Maps a Supabase tasks row into the standardized Task application interface.
 */
export function mapRowToTask(row: any): Task {
  const isActive = row.active !== undefined && row.active !== null 
    ? Boolean(row.active) 
    : (row.is_active !== undefined ? Boolean(row.is_active) : true);

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
    active: isActive,
    isActive: isActive,
    displayOrder: Number(row.display_order) || 0,
    startsCount: Number(row.starts_count) || 0,
    completionsCount: Number(row.completions_count) || 0,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Loads tasks directly from the Supabase database.
 * Supports public and admin filters (category, search, active).
 * Throws explicit errors so caller can return JSON HTTP 500 error instead of silent empty list.
 */
export async function loadTasksFromSupabase(filter?: {
  admin?: boolean;
  category?: string;
  search?: string;
}): Promise<Task[]> {
  if (!supabaseServer) {
    const err = new Error('Supabase server client is not initialized. Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or ANON key in environment variables.');
    console.error('[Supabase DB]', err.message);
    throw err;
  }

  try {
    let query = supabaseServer
      .from('tasks')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Non-admin callers see all active tasks (excluding explicitly deactivated tasks)
    if (!filter?.admin) {
      query = query.neq('active', false);
    }

    if (filter?.category && filter.category !== 'all') {
      query = query.eq('category_id', filter.category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase DB] Error querying public.tasks from Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(`Supabase query error (${error.code || 'DB_ERROR'}): ${error.message}`);
    }

    const rowCount = Array.isArray(data) ? data.length : 0;
    console.log(`[Supabase DB] Connection successful: retrieved ${rowCount} rows from public.tasks (admin=${Boolean(filter?.admin)}, category=${filter?.category || 'all'})`);

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
  } catch (err: any) {
    console.error('[Supabase DB] Exception in loadTasksFromSupabase:', err?.message || err);
    throw err;
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

/**
 * Validates whether an ID string is a valid UUID v4
 */
export function isUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Derives a deterministic UUID from any arbitrary ID string
 */
export function generateUuidFromId(id: string): string {
  if (isUuid(id)) return id;
  try {
    const hash = crypto.createHash('sha256').update(id).digest('hex');
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Permanently saves a Campaign Enquiry to Supabase.
 * Records are stored in public.campaigns table with full JSON metadata, ensuring durable cloud persistence.
 */
export async function saveEnquiryToSupabase(enquiry: CampaignEnquiry): Promise<{ success: boolean; error?: string }> {
  if (!supabaseServer) {
    return { success: false, error: 'Supabase server client not initialized.' };
  }

  try {
    const uuid = generateUuidFromId(enquiry.id);
    const partnerType = enquiry.partnerType || (enquiry.enquiryType as any) || 'partner';
    const campaignName = enquiry.businessName || enquiry.campaignName || enquiry.companyName || 'Campaign';

    const payload: Record<string, any> = {
      id: uuid,
      title: `[ENQUIRY:${String(partnerType).toUpperCase()}] ${campaignName}`,
      partner_name: enquiry.businessName || enquiry.companyName || enquiry.contactPerson || 'Advertiser',
      description: JSON.stringify(enquiry),
      reward_amount: Number(enquiry.rewardAmount || enquiry.rewardPerAction) || 50,
      currency: 'INR',
      affiliate_url: enquiry.trackingUrl || enquiry.affiliateUrl || '',
      eligibility: enquiry.eligibility || enquiry.targetAudience || '',
      steps: Array.isArray(enquiry.instructions) 
        ? enquiry.instructions 
        : (typeof enquiry.instructions === 'string' && enquiry.instructions.length > 0 ? [enquiry.instructions] : ['Follow task instructions']),
      proof_requirements: Array.isArray(enquiry.requiredProof) && enquiry.requiredProof.length > 0 
        ? enquiry.requiredProof 
        : ['Proof screenshot / Order ID'],
      terms: JSON.stringify({
        enquiryId: enquiry.id,
        partnerType: enquiry.partnerType,
        enquiryType: enquiry.enquiryType,
        businessName: enquiry.businessName || enquiry.company_brand_name || enquiry.companyName,
        contactPerson: enquiry.contactPerson || enquiry.contact_person_name,
        officialEmail: enquiry.officialEmail || enquiry.contact_email,
        phoneNumber: enquiry.phoneNumber || enquiry.contact_phone,
        whatsappNumber: enquiry.whatsappNumber || enquiry.contact_whatsapp,
        website: enquiry.website || enquiry.website_or_social,
        website_or_social: enquiry.website_or_social || enquiry.website,
        contact_person_name: enquiry.contact_person_name || enquiry.contactPerson,
        company_brand_name: enquiry.company_brand_name || enquiry.businessName || enquiry.companyName,
        contact_email: enquiry.contact_email || enquiry.officialEmail,
        contact_phone: enquiry.contact_phone || enquiry.phoneNumber,
        contact_whatsapp: enquiry.contact_whatsapp || enquiry.whatsappNumber,
        businessLocation: enquiry.businessLocation,
        trackingUrlArrangedByAdmin: enquiry.trackingUrlArrangedByAdmin,
        adminNotes: enquiry.adminNotes,
        followUpHistory: enquiry.followUpHistory,
        creatorPlatforms: enquiry.creatorPlatforms,
        status: enquiry.status,
        notes: enquiry.notes,
        aiSummary: enquiry.aiSummary
      }),
      status: enquiry.status === 'approved' ? 'active' : (enquiry.status === 'rejected' ? 'rejected' : 'pending_approval'),
      total_budget: Number(enquiry.totalBudget || enquiry.budget) || 0,
      target_completions: Number(enquiry.targetCompletions) || 100,
      created_at: enquiry.createdAt || new Date().toISOString(),
      updated_at: enquiry.updatedAt || new Date().toISOString()
    };

    const { error } = await supabaseServer
      .from('campaigns')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase DB] Error persisting enquiry to Supabase:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase DB] Successfully persisted enquiry ${enquiry.id} ("${enquiry.campaignName}") to Supabase campaigns table.`);
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase DB] Exception saving enquiry in Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save enquiry to Supabase' };
  }
}

/**
 * Loads persisted Campaign Enquiries from Supabase campaigns table.
 */
export async function loadEnquiriesFromSupabase(): Promise<CampaignEnquiry[]> {
  if (!supabaseServer) return [];

  try {
    const { data, error } = await supabaseServer
      .from('campaigns')
      .select('*')
      .ilike('title', '[ENQUIRY:%')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      return [];
    }

    const enquiries: CampaignEnquiry[] = [];

    for (const row of data) {
      try {
        if (row.description && typeof row.description === 'string' && row.description.startsWith('{')) {
          const parsed = JSON.parse(row.description);
          if (parsed && (parsed.campaignName || parsed.companyName || parsed.contactPerson)) {
            enquiries.push({
              ...parsed,
              id: parsed.id || row.id,
              status: parsed.status || (row.status === 'active' ? 'approved' : (row.status === 'rejected' ? 'rejected' : 'new')),
              createdAt: parsed.createdAt || row.created_at,
              updatedAt: parsed.updatedAt || row.updated_at
            });
            continue;
          }
        }

        // Fallback reconstruction from row fields
        let termsMeta: any = {};
        try {
          if (row.terms && row.terms.startsWith('{')) {
            termsMeta = JSON.parse(row.terms);
          }
        } catch {
          // ignore
        }

        const titleMatch = row.title.match(/\[ENQUIRY:([A-Z_]+)\]\s*(.*)/i);
        const pType = (termsMeta.partnerType || (titleMatch ? titleMatch[1].toLowerCase() : 'company')) as PartnerType;
        const cName = titleMatch ? titleMatch[2] : row.title;

        enquiries.push({
          id: termsMeta.enquiryId || row.id,
          partnerType: pType,
          enquiryType: pType,
          businessName: termsMeta.businessName || cName || row.partner_name || 'Business',
          campaignName: cName || 'Campaign Proposal',
          companyName: row.partner_name || 'Brand',
          productService: termsMeta.productService || 'Performance Marketing',
          category: row.category_id || 'General',
          objective: termsMeta.objective || 'Brand Growth & User Actions',
          targetAudience: row.eligibility || 'All eligible users',
          targetLocation: termsMeta.targetLocation || 'All India',
          rewardAmount: Number(row.reward_amount) || 50,
          totalBudget: Number(row.total_budget) || 0,
          targetCompletions: Number(row.target_completions) || 100,
          campaignDuration: termsMeta.campaignDuration || '30 Days',
          trackingUrl: row.affiliate_url || '',
          trackingUrlArrangedByAdmin: Boolean(termsMeta.trackingUrlArrangedByAdmin),
          eligibility: row.eligibility || 'All users',
          instructions: Array.isArray(row.steps) ? row.steps : [],
          requiredProof: Array.isArray(row.proof_requirements) ? row.proof_requirements : [],
          notes: termsMeta.notes || '',
          adminNotes: termsMeta.adminNotes || '',
          followUpHistory: termsMeta.followUpHistory || [],
          creatorPlatforms: termsMeta.creatorPlatforms || [],
          contactPerson: termsMeta.contact_person_name || termsMeta.contactPerson || row.partner_name,
          officialEmail: termsMeta.contact_email || termsMeta.officialEmail || '',
          phoneNumber: termsMeta.contact_phone || termsMeta.phoneNumber || '',
          whatsappNumber: termsMeta.contact_whatsapp || termsMeta.whatsappNumber || '',
          website: termsMeta.website_or_social || termsMeta.website || '',
          contact_person_name: termsMeta.contact_person_name || termsMeta.contactPerson || row.partner_name,
          company_brand_name: termsMeta.company_brand_name || termsMeta.businessName || row.title,
          contact_email: termsMeta.contact_email || termsMeta.officialEmail || '',
          contact_phone: termsMeta.contact_phone || termsMeta.phoneNumber || '',
          contact_whatsapp: termsMeta.contact_whatsapp || termsMeta.whatsappNumber || '',
          website_or_social: termsMeta.website_or_social || termsMeta.website || '',
          businessLocation: termsMeta.businessLocation || '',
          aiSummary: termsMeta.aiSummary || '',
          status: termsMeta.status || (row.status === 'active' ? 'approved' : (row.status === 'rejected' ? 'rejected' : 'new')),
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      } catch (rowErr) {
        console.warn('[Supabase DB] Error parsing enquiry row:', rowErr);
      }
    }

    console.log(`[Supabase DB] Restored ${enquiries.length} campaign enquiries from Supabase campaigns table.`);
    return enquiries;
  } catch (err: any) {
    console.warn('[Supabase DB] Note loading enquiries from Supabase:', err?.message || err);
    return [];
  }
}

/**
 * Check if email or mobile already exist in Supabase database/auth
 */
export async function checkDuplicatesInSupabase(
  email: string,
  mobile: string
): Promise<{ emailUsed: boolean; mobileUsed: boolean }> {
  let emailUsed = false;
  let mobileUsed = false;

  if (!clientInstance) {
    return { emailUsed, mobileUsed };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const digits = (mobile || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);

  try {
    // 1. Check email in profiles table
    if (cleanEmail) {
      const { data: profilesWithEmail, error: pEmailErr } = await clientInstance
        .from('profiles')
        .select('id, email')
        .ilike('email', cleanEmail)
        .limit(1);

      if (!pEmailErr && profilesWithEmail && profilesWithEmail.length > 0) {
        emailUsed = true;
      }
    }

    // 2. Check email in auth.users if service role is available
    if (!emailUsed && cleanEmail && clientInstance.auth?.admin) {
      try {
        const { data: authList, error: aErr } = await clientInstance.auth.admin.listUsers();
        if (!aErr && authList?.users) {
          const match = authList.users.some(
            (u: any) => (u.email || '').trim().toLowerCase() === cleanEmail
          );
          if (match) emailUsed = true;
        }
      } catch (authErr) {
        // Ignore if restricted
      }
    }

    // 3. Check mobile in profiles table
    if (last10 && last10.length === 10) {
      const { data: profilesWithMobile, error: pMobErr } = await clientInstance
        .from('profiles')
        .select('id, mobile')
        .not('mobile', 'is', null)
        .limit(500);

      if (!pMobErr && Array.isArray(profilesWithMobile)) {
        const match = profilesWithMobile.some((p: any) => {
          if (!p.mobile) return false;
          const pDigits = String(p.mobile).replace(/\D/g, '').slice(-10);
          return pDigits.length === 10 && pDigits === last10;
        });
        if (match) mobileUsed = true;
      }
    }
  } catch (err: any) {
    console.warn('[Supabase Duplicate Check] Error:', err?.message || err);
  }

  return { emailUsed, mobileUsed };
}

/**
 * Permanently delete all non-primary admin accounts from Supabase Auth and profiles
 */
export async function cleanupSupabaseAdminAccounts(
  primaryAdminEmail = 'dsktaskmarketer@gmail.com'
): Promise<{ deletedFromAuth: number; deletedFromProfiles: number }> {
  let deletedFromAuth = 0;
  let deletedFromProfiles = 0;

  if (!clientInstance) {
    return { deletedFromAuth, deletedFromProfiles };
  }

  const cleanPrimary = primaryAdminEmail.trim().toLowerCase();

  try {
    // 1. Delete non-primary admins from Supabase profiles table
    const { data: profilesToDelete, error: selErr } = await clientInstance
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .neq('email', cleanPrimary);

    if (!selErr && profilesToDelete && profilesToDelete.length > 0) {
      const idsToDelete = profilesToDelete.map(p => p.id);
      const { error: delErr } = await clientInstance
        .from('profiles')
        .delete()
        .in('id', idsToDelete);

      if (!delErr) {
        deletedFromProfiles = idsToDelete.length;
        console.log(`[Supabase Cleanup] Removed ${deletedFromProfiles} non-primary admin profiles.`);
      }
    }
  } catch (profErr: any) {
    console.warn('[Supabase Cleanup] Profile deletion notice:', profErr?.message || profErr);
  }

  // 2. Delete non-primary admin accounts from Supabase Auth (if service role)
  if (clientInstance.auth?.admin) {
    try {
      const { data: authList, error: authListErr } = await clientInstance.auth.admin.listUsers();
      if (!authListErr && authList?.users) {
        for (const u of authList.users) {
          const userEmail = (u.email || '').trim().toLowerCase();
          if (userEmail && userEmail !== cleanPrimary) {
            const role = u.user_metadata?.role || u.app_metadata?.role;
            const isKnownAdmin = role === 'admin' || 
              userEmail.startsWith('admin') || 
              userEmail.includes('honeybezx444') || 
              userEmail.includes('dsabithkumar');

            if (isKnownAdmin) {
              try {
                await clientInstance.auth.admin.deleteUser(u.id);
                deletedFromAuth++;
                console.log(`[Supabase Auth Cleanup] Deleted admin user from auth: ${userEmail}`);
              } catch (delAuthErr: any) {
                console.warn(`[Supabase Auth Cleanup] Could not delete user ${userEmail}:`, delAuthErr?.message);
              }
            }
          }
        }
      }
    } catch (authErr: any) {
      console.warn('[Supabase Auth Cleanup] Notice:', authErr?.message || authErr);
    }
  }

  return { deletedFromAuth, deletedFromProfiles };
}

/**
 * Permanently checks Supabase for existing Administrator Setup status.
 * Supabase is the primary source of truth.
 * Returns isFirstTimeSetup: false if ANY admin exists or setup was completed.
 */
export async function getAdminSetupStatusFromSupabase(): Promise<{
  isFirstTimeSetup: boolean;
  adminEmail?: string;
  adminId?: string;
  passwordHash?: string;
  salt?: string;
}> {
  if (!clientInstance) {
    return { isFirstTimeSetup: true };
  }

  try {
    // 1. Check public.platform_settings table for dedicated 'admin_setup' record
    const { data: setupSetting, error: sErr } = await clientInstance
      .from('platform_settings')
      .select('settings')
      .eq('id', 'admin_setup')
      .maybeSingle();

    if (!sErr && setupSetting?.settings) {
      const cfg = setupSetting.settings;
      if (cfg.admin_setup_completed === true || cfg.adminSetupCompleted === true) {
        console.log(`[Supabase Auth] Verified permanent admin setup from platform_settings: ${cfg.admin_email || cfg.adminEmail}`);
        return {
          isFirstTimeSetup: false,
          adminEmail: cfg.admin_email || cfg.adminEmail,
          adminId: cfg.admin_id || cfg.adminId,
          passwordHash: cfg.password_hash || cfg.passwordHash,
          salt: cfg.salt
        };
      }
    }

    // 2. Check public.platform_settings 'default' record
    const { data: defaultSetting, error: dErr } = await clientInstance
      .from('platform_settings')
      .select('settings')
      .eq('id', 'default')
      .maybeSingle();

    if (!dErr && defaultSetting?.settings) {
      const cfg = defaultSetting.settings;
      if (cfg.admin_setup_completed === true || cfg.adminSetupCompleted === true) {
        console.log(`[Supabase Auth] Verified permanent admin setup from default platform_settings.`);
        return {
          isFirstTimeSetup: false,
          adminEmail: cfg.admin_email || cfg.adminEmail || 'dsktaskmarketer@gmail.com',
          adminId: cfg.admin_id || cfg.adminId
        };
      }
    }

    // 3. Check public.profiles table for any user with role = 'admin'
    const { data: adminProfiles, error: pErr } = await clientInstance
      .from('profiles')
      .select('id, email, name, role')
      .eq('role', 'admin')
      .limit(1);

    if (!pErr && adminProfiles && adminProfiles.length > 0) {
      const admin = adminProfiles[0];
      console.log(`[Supabase Auth] Found verified administrator profile in Supabase profiles: ${admin.email}`);
      return {
        isFirstTimeSetup: false,
        adminEmail: admin.email,
        adminId: admin.id
      };
    }

    // 4. Check auth.users if service role is available
    if (clientInstance.auth?.admin) {
      try {
        const { data: authList, error: aErr } = await clientInstance.auth.admin.listUsers();
        if (!aErr && authList?.users && authList.users.length > 0) {
          const adminAuth = authList.users.find((u: any) => {
            const role = u.user_metadata?.role || u.app_metadata?.role;
            const email = (u.email || '').toLowerCase();
            return role === 'admin' || email === 'dsktaskmarketer@gmail.com' || email.startsWith('admin@');
          });
          if (adminAuth) {
            console.log(`[Supabase Auth] Found verified administrator in auth.users: ${adminAuth.email}`);
            return {
              isFirstTimeSetup: false,
              adminEmail: adminAuth.email,
              adminId: adminAuth.id
            };
          }
        }
      } catch (authListErr) {
        // Continue if service role not permitted
      }
    }
  } catch (err: any) {
    console.warn('[Supabase Auth] Note checking admin setup status:', err?.message || err);
  }

  return { isFirstTimeSetup: true };
}

/**
 * Permanently stores Administrator Setup status and credentials in Supabase.
 * Uses both platform_settings and profiles tables for indestructible cloud persistence.
 */
export async function saveAdminSetupStatusToSupabase(adminData: {
  email: string;
  passwordHash: string;
  salt: string;
  adminId?: string;
  name?: string;
}): Promise<boolean> {
  if (!clientInstance) {
    return false;
  }

  const cleanEmail = adminData.email.trim().toLowerCase();
  const adminId = adminData.adminId || 'admin_root_001';
  const adminName = adminData.name || 'DSK Platform Administrator';

  try {
    // 1. Permanently store in public.platform_settings ('admin_setup')
    const setupRecord = {
      admin_setup_completed: true,
      adminSetupCompleted: true,
      admin_id: adminId,
      admin_email: cleanEmail,
      password_hash: adminData.passwordHash,
      salt: adminData.salt,
      completed_at: new Date().toISOString()
    };

    const { error: setErr } = await clientInstance
      .from('platform_settings')
      .upsert({
        id: 'admin_setup',
        settings: setupRecord,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (setErr) {
      console.warn('[Supabase Auth] Warning writing to platform_settings admin_setup:', setErr.message);
    } else {
      console.log(`[Supabase Auth] Permanently stored admin setup status in Supabase platform_settings for: ${cleanEmail}`);
    }

    // 2. Also update 'default' platform settings to lock isFirstTimeSetup to false permanently
    try {
      const { data: currentDef } = await clientInstance
        .from('platform_settings')
        .select('settings')
        .eq('id', 'default')
        .maybeSingle();

      const existingSettings = currentDef?.settings || {};
      await clientInstance
        .from('platform_settings')
        .upsert({
          id: 'default',
          settings: {
            ...existingSettings,
            admin_setup_completed: true,
            adminSetupCompleted: true,
            admin_email: cleanEmail
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch {}

    // 3. Upsert admin profile in public.profiles table
    const profileUuid = generateUuidFromId(adminId);
    try {
      await clientInstance
        .from('profiles')
        .upsert({
          id: profileUuid,
          name: adminName,
          email: cleanEmail,
          mobile: '+91 98000 00000',
          role: 'admin',
          status: 'active',
          referral_code: 'DSKADMIN',
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
      console.log(`[Supabase Auth] Upserted admin profile into public.profiles: ${cleanEmail}`);
    } catch (profErr) {
      console.warn('[Supabase Auth] Note upserting admin profile:', profErr);
    }

    // 4. Create/update in auth.users if service role is available
    if (clientInstance.auth?.admin) {
      try {
        const { data: usersData } = await clientInstance.auth.admin.listUsers();
        const existing = usersData?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
        if (!existing) {
          await clientInstance.auth.admin.createUser({
            id: profileUuid,
            email: cleanEmail,
            email_confirm: true,
            user_metadata: { role: 'admin', name: adminName }
          });
        } else {
          await clientInstance.auth.admin.updateUserById(existing.id, {
            user_metadata: { role: 'admin', name: adminName }
          });
        }
      } catch (authErr) {
        // Non-fatal
      }
    }

    return true;
  } catch (err: any) {
    console.error('[Supabase Auth] Exception saving admin setup to Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Permanently stores a User account in Supabase.
 * Guarantees that user data and wallet records are durable across container restarts and Render redeployments.
 * Never deletes or duplicates user data.
 */
export async function saveUserToSupabase(user: any, rawPassword?: string): Promise<boolean> {
  if (!clientInstance || !user) {
    return false;
  }

  const cleanEmail = (user.email || '').trim().toLowerCase();
  if (!cleanEmail) return false;

  const uuid = generateUuidFromId(user.id || cleanEmail);

  try {
    // 1. Upsert into public.profiles
    const profilePayload: Record<string, any> = {
      id: uuid,
      name: user.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      mobile: user.mobile || null,
      role: user.role || 'user',
      status: user.status || 'active',
      referral_code: user.referralCode || null,
      referred_by: user.referredBy || null,
      profile_photo: user.profilePhoto || null,
      upi_id: user.payoutDetails?.upiId || null,
      bank_account: user.payoutDetails?.bankAccount || null,
      ifsc: user.payoutDetails?.ifsc || null,
      account_holder_name: user.payoutDetails?.accountHolderName || null,
      password_hash: user.passwordHash || null,
      salt: user.salt || null,
      updated_at: new Date().toISOString()
    };

    if (user.createdAt) {
      profilePayload.created_at = user.createdAt;
    }

    const { error: pErr } = await clientInstance
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'email' });

    if (pErr) {
      console.warn('[Supabase Auth] Note upserting to profiles table:', pErr.message);
    } else {
      console.log(`[Supabase Auth] Successfully saved profile to Supabase: ${cleanEmail}`);
    }

    // 2. Permanently sync to platform_settings ('persisted_users')
    // This provides 100% resilient user storage even across table schema constraints
    try {
      const { data: currentStore } = await clientInstance
        .from('platform_settings')
        .select('settings')
        .eq('id', 'persisted_users')
        .maybeSingle();

      const existingUsers: any[] = Array.isArray(currentStore?.settings?.users)
        ? currentStore.settings.users
        : [];

      // Avoid duplicates: update if exists, otherwise append
      const existingIdx = existingUsers.findIndex(
        (u: any) => u.id === user.id || u.email?.toLowerCase() === cleanEmail
      );

      const userRecord = {
        ...user,
        id: user.id || uuid,
        email: cleanEmail,
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        existingUsers[existingIdx] = {
          ...existingUsers[existingIdx],
          ...userRecord
        };
      } else {
        existingUsers.push(userRecord);
      }

      await clientInstance
        .from('platform_settings')
        .upsert({
          id: 'persisted_users',
          settings: { users: existingUsers },
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (storeErr) {
      console.warn('[Supabase Auth] Note updating persisted_users store:', storeErr);
    }

    // 3. Upsert into public.wallets
    try {
      await clientInstance
        .from('wallets')
        .upsert({
          user_id: uuid,
          total_earnings: Number(user.wallet?.totalEarnings) || 0,
          available_balance: Number(user.wallet?.availableBalance) || 0,
          pending_rewards: Number(user.wallet?.pendingRewards) || 0,
          referral_rewards: Number(user.wallet?.referralRewards) || 0,
          completed_tasks: Number(user.wallet?.completedTasks) || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch {}

    // 4. If rawPassword provided and service role is available, sync to auth.users
    if (rawPassword && clientInstance.auth?.admin) {
      try {
        const { data: usersData } = await clientInstance.auth.admin.listUsers();
        const existing = usersData?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
        if (!existing) {
          await clientInstance.auth.admin.createUser({
            id: uuid,
            email: cleanEmail,
            password: rawPassword,
            email_confirm: true,
            user_metadata: {
              name: user.name,
              mobile: user.mobile,
              role: user.role,
              referralCode: user.referralCode
            }
          });
        } else {
          await clientInstance.auth.admin.updateUserById(existing.id, {
            password: rawPassword,
            user_metadata: {
              name: user.name,
              mobile: user.mobile,
              role: user.role,
              referralCode: user.referralCode
            }
          });
        }
      } catch (authErr) {
        // Handled gracefully
      }
    }

    return true;
  } catch (err: any) {
    console.error('[Supabase Auth] Exception saving user to Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Loads all permanently stored Users from Supabase.
 * Merges data from profiles table and platform_settings persisted_users.
 */
export async function loadAllUsersFromSupabase(): Promise<any[]> {
  if (!clientInstance) return [];

  const usersMap = new Map<string, any>();

  try {
    // 1. Fetch from public.platform_settings ('persisted_users')
    const { data: settingData } = await clientInstance
      .from('platform_settings')
      .select('settings')
      .eq('id', 'persisted_users')
      .maybeSingle();

    if (settingData?.settings?.users && Array.isArray(settingData.settings.users)) {
      for (const u of settingData.settings.users) {
        if (u && u.email) {
          usersMap.set(u.email.toLowerCase(), u);
        }
      }
    }

    // 2. Fetch from public.profiles
    const { data: profiles, error: pErr } = await clientInstance
      .from('profiles')
      .select('*');

    if (!pErr && Array.isArray(profiles)) {
      for (const p of profiles) {
        const email = (p.email || '').toLowerCase();
        if (!email) continue;

        const existing = usersMap.get(email) || {};
        usersMap.set(email, {
          ...existing,
          id: p.id || existing.id,
          name: p.name || existing.name,
          email: p.email,
          mobile: p.mobile || existing.mobile,
          role: p.role || existing.role || 'user',
          status: p.status || existing.status || 'active',
          referralCode: p.referral_code || existing.referralCode,
          referredBy: p.referred_by || existing.referredBy,
          profilePhoto: p.profile_photo || existing.profilePhoto,
          passwordHash: p.password_hash || p.passwordHash || existing.passwordHash,
          salt: p.salt || existing.salt,
          payoutDetails: {
            upiId: p.upi_id || existing.payoutDetails?.upiId || '',
            bankAccount: p.bank_account || existing.payoutDetails?.bankAccount || '',
            ifsc: p.ifsc || existing.payoutDetails?.ifsc || '',
            accountHolderName: p.account_holder_name || existing.payoutDetails?.accountHolderName || p.name || ''
          },
          createdAt: p.created_at || existing.createdAt || new Date().toISOString()
        });
      }
    }

    const result = Array.from(usersMap.values());
    console.log(`[Supabase Auth] Loaded ${result.length} permanent user accounts from Supabase.`);
    return result;
  } catch (err: any) {
    console.warn('[Supabase Auth] Note loading users from Supabase:', err?.message || err);
    return Array.from(usersMap.values());
  }
}

/**
 * Searches for a user in Supabase by email, mobile, or ID.
 */
export async function findUserInSupabase(identifier: string): Promise<any | null> {
  if (!clientInstance || !identifier) return null;

  const clean = identifier.trim().toLowerCase();
  const digits = identifier.replace(/\D/g, '');
  const last10 = digits.slice(-10);

  try {
    // 1. Search platform_settings persisted_users
    const { data: settingData } = await clientInstance
      .from('platform_settings')
      .select('settings')
      .eq('id', 'persisted_users')
      .maybeSingle();

    if (settingData?.settings?.users && Array.isArray(settingData.settings.users)) {
      const match = settingData.settings.users.find((u: any) => {
        if (!u) return false;
        if (u.email && u.email.toLowerCase() === clean) return true;
        if (u.id === identifier) return true;
        if (last10 && last10.length === 10 && u.mobile) {
          const uMob = String(u.mobile).replace(/\D/g, '').slice(-10);
          if (uMob === last10) return true;
        }
        return false;
      });
      if (match) return match;
    }

    // 2. Search public.profiles table
    let profileQuery = clientInstance.from('profiles').select('*');
    if (clean.includes('@')) {
      profileQuery = profileQuery.ilike('email', clean);
    } else if (last10 && last10.length === 10) {
      profileQuery = profileQuery.or(`email.ilike.${clean},mobile.ilike.%${last10}%`);
    } else if (isUuid(identifier)) {
      profileQuery = profileQuery.eq('id', identifier);
    } else {
      profileQuery = profileQuery.ilike('email', clean);
    }

    const { data: profiles, error } = await profileQuery.limit(1);
    if (!error && profiles && profiles.length > 0) {
      const p = profiles[0];
      let userPasswordHash = p.password_hash || p.passwordHash;
      let userSalt = p.salt;

      // Fallback: If passwordHash/salt missing in profile row, check platform_settings 'persisted_users'
      if (!userPasswordHash || !userSalt) {
        try {
          const { data: settingData } = await clientInstance
            .from('platform_settings')
            .select('settings')
            .eq('id', 'persisted_users')
            .maybeSingle();

          if (settingData?.settings?.users && Array.isArray(settingData.settings.users)) {
            const pMatch = settingData.settings.users.find((u: any) => 
              u && (u.id === p.id || (u.email && u.email.toLowerCase() === p.email?.toLowerCase()))
            );
            if (pMatch?.passwordHash) {
              userPasswordHash = pMatch.passwordHash;
              userSalt = pMatch.salt;
            }
          }
        } catch {}
      }

      if (p.role === 'admin' && (!userPasswordHash || !userSalt)) {
        try {
          const { data: setupData } = await clientInstance
            .from('platform_settings')
            .select('settings')
            .eq('id', 'admin_setup')
            .maybeSingle();

          if (setupData?.settings?.password_hash || setupData?.settings?.passwordHash) {
            userPasswordHash = setupData.settings.password_hash || setupData.settings.passwordHash;
            userSalt = setupData.settings.salt;
          }
        } catch {}
      }

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        mobile: p.mobile,
        role: p.role,
        status: p.status,
        referralCode: p.referral_code,
        referredBy: p.referred_by,
        profilePhoto: p.profile_photo,
        passwordHash: userPasswordHash,
        salt: userSalt,
        payoutDetails: {
          upiId: p.upi_id || '',
          bankAccount: p.bank_account || '',
          ifsc: p.ifsc || '',
          accountHolderName: p.account_holder_name || p.name
        },
        createdAt: p.created_at
      };
    }

    // 3. Search Supabase Auth users via listUsers() as fallback
    try {
      const { data: authUsersData } = await clientInstance.auth.admin.listUsers();
      if (authUsersData?.users && authUsersData.users.length > 0) {
        const authMatch = authUsersData.users.find((u: any) => {
          if (!u) return false;
          if (u.email && u.email.trim().toLowerCase() === clean) return true;
          if (u.id === identifier) return true;
          const uMob = u.user_metadata?.mobile || u.phone;
          if (last10 && last10.length === 10 && uMob) {
            const uDigits = String(uMob).replace(/\D/g, '').slice(-10);
            if (uDigits === last10) return true;
          }
          return false;
        });

        if (authMatch) {
          return {
            id: authMatch.id,
            name: authMatch.user_metadata?.name || authMatch.email?.split('@')[0] || 'User',
            email: authMatch.email || '',
            mobile: authMatch.user_metadata?.mobile || authMatch.phone || '',
            role: authMatch.user_metadata?.role || 'user',
            status: 'active',
            referralCode: authMatch.user_metadata?.referralCode || '',
            createdAt: authMatch.created_at || new Date().toISOString()
          };
        }
      }
    } catch {}
  } catch (err) {
    console.warn('[Supabase Auth] Note finding user in Supabase:', err);
  }

  return null;
}
