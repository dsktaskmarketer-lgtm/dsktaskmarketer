import {
  User,
  WalletSummary,
  Task,
  TaskCategory,
  TaskSubmission,
  RewardLedgerItem,
  Withdrawal,
  ReferralRecord,
  SocialLink,
  NotificationItem,
  SupportTicket,
  PlatformSettings,
  Campaign,
  CampaignEnquiry,
  AIDraftTask,
  UserIncentivesOverview,
  AdminIncentivesOverview,
  IncentivePlanType,
  IncentivePlanConfig,
  IncentiveMilestone,
  IncentiveClaimRecord
} from '../types';
import { trafficOptimizer } from '../utils/trafficOptimizer';

const getNormalizedApiBase = () => {
  let base = '/api';
  if (typeof import.meta !== 'undefined') {
    const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      base = envUrl.trim();
    }
  }
  // In browser on HTTPS pages, if base is an insecure http:// or localhost URL, force relative /api to prevent Mixed Content security blocking
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (base.startsWith('http://localhost') || base.startsWith('http://127.0.0.1') || base.startsWith('http://')) {
      base = '/api';
    }
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const API_BASE = getNormalizedApiBase();

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const directToken = localStorage.getItem('dsk_auth_token');
  if (directToken) return directToken;

  // Search localStorage for active Supabase session token (sb-<project>-auth-token)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.access_token) {
            return parsed.access_token;
          }
        }
      }
    }
  } catch {}

  return null;
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dsk_auth_token', token);
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dsk_auth_token');
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-user-id'] = token;
  }
  return headers;
}

async function executeFetch<T>(
  url: string,
  options?: RequestInit,
  fallbackError = 'Request failed'
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    console.warn(`[Network Fetch Error] URL: ${url}, Error:`, netErr?.message || netErr);
    const detailMsg = netErr?.message && !netErr.message.includes('Failed to fetch') ? netErr.message : '';
    throw new Error(detailMsg || `Unable to connect to server. Please check your network connection.`);
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    let data: any = null;
    try {
      data = await res.json();
    } catch (parseErr: any) {
      if (!res.ok) {
        throw new Error(`${fallbackError} (HTTP ${res.status})`);
      }
      throw new Error(`Invalid response format from server.`);
    }

    if (!res.ok) {
      const serverMsg = data?.error || data?.message || data?.details;
      const err = new Error(serverMsg || `${fallbackError} (HTTP ${res.status})`);
      (err as any).fieldErrors = data?.fieldErrors;
      (err as any).status = res.status;
      throw err;
    }
    return data as T;
  }

  // Not JSON! Handle 404, 502, "Not Found", or HTML error pages gracefully
  const rawText = await res.text().catch(() => '');
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Endpoint not found (HTTP 404). Please ensure the backend service is running.`);
    } else if (res.status >= 500) {
      throw new Error(`Service temporarily unavailable (HTTP ${res.status}). Please try again in a moment.`);
    }
    // Extract non-HTML message if short, else fallback
    if (rawText && !rawText.includes('<') && rawText.trim().length <= 100) {
      throw new Error(`${fallbackError}: ${rawText.trim()}`);
    }
    throw new Error(`${fallbackError} (HTTP ${res.status})`);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(`Unexpected server response format.`);
  }
}

/**
 * Safe fetch wrapper with traffic optimization:
 * - Deduplicates concurrent identical requests
 * - Pauses redundant calls and provides short TTL caching for GET
 * - Invalidates cached queries on mutations (POST/PUT/PATCH/DELETE)
 */
export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackError = 'Request failed'
): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (!isGet) {
    // Invalidate cached query results on mutations
    trafficOptimizer.invalidateCache();
    return executeFetch<T>(url, options, fallbackError);
  }

  // Generate unique cache key for deduplication and short TTL
  const authHeader = (options?.headers as any)?.['Authorization'] || (options?.headers as any)?.['authorization'] || '';
  const cacheKey = `${url}::${authHeader}`;

  return trafficOptimizer.deduplicateRequest<T>(
    cacheKey,
    () => executeFetch<T>(url, options, fallbackError),
    2000 // 2-second micro-cache to prevent concurrent burst load
  );
}

export async function fetchMe(token?: string) {
  const authToken = token || getStoredToken();
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    headers['x-user-id'] = authToken;
  }
  return safeFetchJson<{ user: User | null; wallet: WalletSummary | null; unreadNotifications: number }>(
    `${API_BASE}/auth/me`,
    { headers },
    'Not authenticated'
  );
}

export async function fetchWallet(token?: string): Promise<WalletSummary | null> {
  const authToken = token || getStoredToken();
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    headers['x-user-id'] = authToken;
  }
  return safeFetchJson<WalletSummary>(
    `${API_BASE}/wallet`,
    { headers },
    'Failed to fetch wallet'
  );
}

export async function loginUser(identifier: string, password: string) {
  const data = await safeFetchJson<{ user: User; wallet: WalletSummary; token: string }>(
    `${API_BASE}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    },
    'Login failed'
  );
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function adminLogin(identifier: string, password: string) {
  const data = await safeFetchJson<{ success: boolean; user: User; token: string; role: string; mustChangeCredentials?: boolean }>(
    `${API_BASE}/auth/admin/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    },
    'Admin login failed'
  );
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function getAdminSetupStatus() {
  try {
    return await safeFetchJson<{ isFirstTimeSetup: boolean }>(
      `${API_BASE}/auth/admin/setup-status`,
      {},
      'Failed to get admin setup status'
    );
  } catch {
    return { isFirstTimeSetup: false };
  }
}

export async function initialAdminSetup(data: { email: string; password: string; confirmPassword?: string }) {
  const resData = await safeFetchJson<{ success: boolean; message: string; user: User; token: string }>(
    `${API_BASE}/auth/admin/initial-setup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
    'Failed to initialize administrator account'
  );
  if (resData.token) {
    setStoredToken(resData.token);
  }
  return resData;
}

export async function requestPasswordResetOtp(email: string, role: 'admin' | 'user' = 'user') {
  return safeFetchJson<{ success: boolean; message: string; devNote?: string }>(
    `${API_BASE}/auth/forgot-password/request-otp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    },
    'Failed to request verification code'
  );
}

export async function verifyOtpAndResetPassword(data: {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  role?: 'admin' | 'user';
}) {
  return safeFetchJson<{ success: boolean; message: string }>(
    `${API_BASE}/auth/forgot-password/verify-otp-reset`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    'Failed to reset password'
  );
}

export async function completeAdminSetup(data: { newEmail: string; newPassword: string }) {
  const resData = await safeFetchJson<{ success: boolean; message: string; user: User; token: string }>(
    `${API_BASE}/auth/admin/complete-setup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
    'Failed to finalize administrator setup'
  );
  if (resData.token) {
    setStoredToken(resData.token);
  }
  return resData;
}

export async function requestAdminPasswordReset(email: string) {
  return safeFetchJson<{ success: boolean; message: string }>(
    `${API_BASE}/auth/admin/forgot-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
    'Failed to request password reset'
  );
}

export async function submitAdminPasswordReset(data: { email: string; newPassword: string; token?: string }) {
  return safeFetchJson<{ success: boolean; message: string }>(
    `${API_BASE}/auth/admin/reset-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    'Failed to reset administrator password'
  );
}

export async function verifyAdminSession() {
  return safeFetchJson<{ verified: boolean; role: string; user: User }>(
    `${API_BASE}/auth/admin/verify`,
    {
      headers: getAuthHeaders(),
    },
    'Access denied. Administrator privileges required.'
  );
}

export async function registerUser(formData: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
  role?: 'user' | 'client';
}) {
  const data = await safeFetchJson<{ user: User; wallet: WalletSummary; token: string }>(
    `${API_BASE}/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    },
    'Registration failed'
  );
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function sendRegistrationOtp(formData: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword?: string;
  role?: 'user' | 'client';
  referralCode?: string;
}) {
  return safeFetchJson<{ success: boolean; message: string }>(
    `${API_BASE}/auth/register/send-otp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    },
    'Failed to dispatch registration verification code'
  );
}

export async function verifyRegistrationOtp(data: { email: string; otp: string }) {
  const res = await safeFetchJson<{ success: boolean; user: User; wallet?: WalletSummary; token: string; message: string }>(
    `${API_BASE}/auth/register/verify-otp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    'Verification failed'
  );
  if (res.token) {
    setStoredToken(res.token);
  }
  return res;
}

export async function resendRegistrationOtp(email: string) {
  return safeFetchJson<{ success: boolean; message: string }>(
    `${API_BASE}/auth/register/resend-otp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
    'Failed to resend verification code'
  );
}

export async function fetchSmtpConfig() {
  return safeFetchJson<{ configured: boolean; host?: string; port?: number; user?: string; from?: string; secure?: boolean }>(
    `${API_BASE}/admin/smtp-config`,
    { headers: getAuthHeaders() },
    'Failed to fetch SMTP configuration'
  );
}

export async function updateSmtpConfig(config: any) {
  return safeFetchJson<{ success: boolean; message: string }>(
    `${API_BASE}/admin/smtp-config`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    },
    'Failed to update SMTP configuration'
  );
}

export async function testSmtpConnection(testRecipient?: string) {
  return safeFetchJson<{ success: boolean; message: string; details?: any }>(
    `${API_BASE}/admin/smtp-test`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ testRecipient }),
    },
    'SMTP test failed'
  );
}

export async function logoutUser() {
  removeStoredToken();
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (e) {
    // Ignore network error on logout
  }
}

export async function updateProfile(data: Partial<User>) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

// ===================== CAMPAIGNS (ADVERTISER / CLIENT) =====================
export async function fetchCampaigns(status?: string, clientId?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (clientId) params.append('clientId', clientId);
  const res = await fetch(`${API_BASE}/campaigns?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.json() as Promise<Campaign[]>;
}

export async function createCampaign(campaignData: Partial<Campaign>) {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(campaignData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create campaign');
  return data as Campaign;
}

export async function updateCampaignStatus(campaignId: string, status: string, rejectionReason?: string) {
  const res = await fetch(`${API_BASE}/campaigns/${campaignId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, rejectionReason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update campaign status');
  return data as Campaign;
}

export async function reviewClientSubmission(submissionId: string, status: 'approved' | 'rejected', note?: string) {
  const res = await fetch(`${API_BASE}/client/submissions/${submissionId}/review`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, note }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to review submission');
  return data as TaskSubmission;
}

// ===================== TASKS =====================
export async function fetchTasks(category?: string, search?: string, admin = false) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  if (admin) params.append('admin', 'true');
  return safeFetchJson<Task[]>(`${API_BASE}/tasks?${params.toString()}`, {
    headers: getAuthHeaders()
  }, 'Failed to load tasks');
}

export async function fetchCategories() {
  return safeFetchJson<TaskCategory[]>(`${API_BASE}/categories`, {}, 'Failed to load categories');
}

export async function startTask(taskId: string) {
  return safeFetchJson<{ 
    success: boolean;
    referenceId: string; 
    affiliateUrl: string; 
    trackingUrl?: string;
    instructions: string 
  }>(
    `${API_BASE}/task-starts`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ taskId }),
    },
    'Failed to start task'
  );
}

// ===================== SUBMISSIONS =====================
export async function fetchSubmissions(status?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  const res = await fetch(`${API_BASE}/submissions?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return res.json() as Promise<TaskSubmission[]>;
}

export async function submitTaskProof(data: {
  taskId: string;
  proofApplicationId?: string;
  screenshotUrl?: string;
  userNote?: string;
  completedDate?: string;
}) {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || 'Failed to submit task proof');
  return resData as TaskSubmission;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
  adminNote?: string,
  rejectionReason?: string
) {
  const res = await fetch(`${API_BASE}/submissions/${submissionId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, adminNote, rejectionReason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update submission status');
  return data as TaskSubmission;
}

// ===================== REWARDS =====================
export async function fetchRewards(type?: string, status?: string) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  const res = await fetch(`${API_BASE}/rewards?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return res.json() as Promise<RewardLedgerItem[]>;
}

// ===================== REFERRALS =====================
export async function fetchReferrals() {
  const res = await fetch(`${API_BASE}/referrals`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return data.referrals as ReferralRecord[];
}

// ===================== WITHDRAWALS =====================
export async function fetchWithdrawals(all = false) {
  const params = new URLSearchParams();
  if (all) params.append('all', 'true');
  const res = await fetch(`${API_BASE}/withdrawals?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return res.json() as Promise<Withdrawal[]>;
}

export async function requestWithdrawal(amount: number, payoutMethod: string, payoutDetails: any) {
  const res = await fetch(`${API_BASE}/withdrawals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount, payoutMethod, payoutDetails }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Withdrawal request failed');
  return data as Withdrawal;
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: string,
  param3?: any,
  param4?: any,
  param5?: any,
  extra?: any
) {
  let adminNote: string | undefined;
  let rejectionReason: string | undefined;
  let paymentReference: string | undefined;
  let utrNumber: string | undefined;
  let paidAmount: number | undefined;
  let paidDate: string | undefined;

  if (param3 && typeof param3 === 'object') {
    adminNote = param3.adminNote || param3.note;
    rejectionReason = param3.rejectionReason || param3.reason;
    paymentReference = param3.paymentReference || param3.utrNumber || param3.payoutReference || param3.ref;
    utrNumber = paymentReference;
    paidAmount = param3.paidAmount;
    paidDate = param3.paidDate;
  } else {
    if (typeof param3 === 'string' && (status === 'paid' || status === 'completed' || status === 'processed')) {
      paymentReference = param3;
      utrNumber = param3;
      adminNote = typeof param4 === 'string' ? param4 : undefined;
    } else {
      adminNote = typeof param3 === 'string' ? param3 : undefined;
      rejectionReason = typeof param4 === 'string' ? param4 : undefined;
      paymentReference = typeof param5 === 'string' ? param5 : undefined;
      utrNumber = paymentReference;
    }
  }

  if (param4 && typeof param4 === 'object') {
    adminNote = adminNote || param4.adminNote || param4.note;
    rejectionReason = rejectionReason || param4.rejectionReason || param4.reason;
    paymentReference = paymentReference || param4.paymentReference || param4.utrNumber;
  }

  if (extra && typeof extra === 'object') {
    paymentReference = paymentReference || extra.paymentReference || extra.utrNumber;
    rejectionReason = rejectionReason || extra.rejectionReason;
    adminNote = adminNote || extra.adminNote;
  }

  const finalUtr = (paymentReference || utrNumber || '').toString().trim();

  const res = await fetch(`${API_BASE}/withdrawals/${withdrawalId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      status,
      adminNote,
      rejectionReason,
      paymentReference: finalUtr,
      utrNumber: finalUtr,
      payoutReference: finalUtr,
      paidAmount,
      paidDate
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update withdrawal');
  return data as Withdrawal;
}

export async function addAdminWalletReward(
  userId: string,
  amount: number,
  reason: string,
  idempotencyKey?: string
) {
  const res = await fetch(`${API_BASE}/admin/rewards`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId,
      amount,
      reason,
      idempotencyKey: idempotencyKey || `idemp_${Date.now()}_${Math.random()}`
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add wallet reward');
  return data;
}

// ===================== COMMUNITY & SOCIAL =====================
export async function fetchCommunityLinks(admin = false) {
  const params = new URLSearchParams();
  if (admin) params.append('admin', 'true');
  const res = await fetch(`${API_BASE}/community?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.json() as Promise<SocialLink[]>;
}

export async function saveCommunityLink(link: Partial<SocialLink>) {
  const method = link.id ? 'PUT' : 'POST';
  const url = link.id ? `${API_BASE}/community/${link.id}` : `${API_BASE}/community`;
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(link),
  });
  return res.json();
}

export async function deleteCommunityLink(id: string) {
  const res = await fetch(`${API_BASE}/community/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return res.json();
}

// ===================== NOTIFICATIONS =====================
export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeaders(),
  });
  return res.json() as Promise<NotificationItem[]>;
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  return res.json();
}

// ===================== SUPPORT TICKETS =====================
export async function fetchTickets(all = false) {
  const params = new URLSearchParams();
  if (all) params.append('all', 'true');
  const res = await fetch(`${API_BASE}/support/tickets?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return res.json() as Promise<SupportTicket[]>;
}

export async function createTicket(data: { category: string; subject: string; message: string }) {
  const res = await fetch(`${API_BASE}/support/tickets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || 'Failed to create support ticket');
  return resData as SupportTicket;
}

export async function replyTicket(ticketId: string, message: string) {
  const res = await fetch(`${API_BASE}/support/tickets/${ticketId}/reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  return res.json() as Promise<SupportTicket>;
}

export async function updateTicketStatus(ticketId: string, status: string, priority?: string) {
  const res = await fetch(`${API_BASE}/support/tickets/${ticketId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, priority }),
  });
  return res.json() as Promise<SupportTicket>;
}

// ===================== ADMIN OPERATIONS =====================
export async function fetchAdminMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin metrics');
  return res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json() as Promise<User[]>;
}

export async function fetchAdminReferrals() {
  const res = await fetch(`${API_BASE}/admin/referrals`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch referrals');
  return res.json();
}

export async function toggleUserStatus(userId: string, status?: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function saveTask(taskOrId: Partial<Task> | string, maybeData?: Partial<Task>) {
  let taskData: Partial<Task>;
  let taskId: string | undefined;

  if (typeof taskOrId === 'string') {
    taskId = taskOrId;
    taskData = { ...(maybeData || {}), id: taskId };
  } else {
    taskData = { ...taskOrId };
    taskId = taskData.id;
  }

  const method = taskId ? 'PUT' : 'POST';
  const url = taskId ? `${API_BASE}/tasks/${taskId}` : `${API_BASE}/tasks`;

  return safeFetchJson<Task>(
    url,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(taskData),
    },
    'Failed to save task'
  );
}

export async function toggleTaskActive(taskId: string, active?: boolean) {
  return safeFetchJson<{ success: boolean; active: boolean; isActive?: boolean }>(
    `${API_BASE}/tasks/${taskId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ active }),
    },
    'Failed to update task status'
  );
}

// ===================== PLATFORM SETTINGS =====================
export async function fetchPlatformSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  return res.json() as Promise<PlatformSettings>;
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  return res.json();
}

// ===================== AI TASK GENERATOR & BULK MANAGEMENT =====================

export interface AIGenerateTasksResponse {
  success: boolean;
  tasks: AIDraftTask[];
  error?: string;
  rawInput: string;
  canManualCreate: boolean;
  stats?: {
    totalDetected: number;
    successful: number;
    failed: number;
  };
}

export async function generateAITasks(prompt: string): Promise<AIGenerateTasksResponse> {
  return safeFetchJson<AIGenerateTasksResponse>(
    `${API_BASE}/admin/tasks/ai-generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ prompt }),
    },
    'Failed to generate tasks using AI'
  );
}

export async function bulkPublishAITasks(tasks: AIDraftTask[]): Promise<{
  success: boolean;
  count: number;
  tasks: Task[];
  errors?: string[];
}> {
  return safeFetchJson(
    `${API_BASE}/admin/tasks/ai-bulk-publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ tasks }),
    },
    'Failed to publish tasks'
  );
}

// ===================== CAMPAIGN ENQUIRIES (ADVERTISE WITH US) =====================

export async function assistCampaignEnquiryAI(message: string, currentDetails?: any): Promise<{
  success: boolean;
  data: any;
}> {
  return safeFetchJson(
    `${API_BASE}/partner/campaign-enquiry/ai-assist`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, currentDetails }),
    },
    'Failed to get campaign assistant recommendations'
  );
}

export async function submitCampaignEnquiry(data: Partial<CampaignEnquiry>): Promise<{
  success: boolean;
  message: string;
  enquiry: CampaignEnquiry;
}> {
  return safeFetchJson(
    `${API_BASE}/partner/campaign-enquiry`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    'Failed to submit campaign enquiry'
  );
}

export async function fetchCampaignEnquiries(status?: string, type?: string): Promise<{ enquiries: CampaignEnquiry[] }> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (type && type !== 'all') params.append('type', type);
  const query = params.toString() ? `?${params.toString()}` : '';
  return safeFetchJson(
    `${API_BASE}/admin/campaign-enquiries${query}`,
    {
      headers: getAuthHeaders(),
    },
    'Failed to load campaign enquiries'
  );
}

export async function fetchMyCampaignEnquiries(): Promise<{ enquiries: CampaignEnquiry[] }> {
  return safeFetchJson(
    `${API_BASE}/client/campaign-enquiries`,
    {
      headers: getAuthHeaders(),
    },
    'Failed to load your campaign enquiries'
  );
}

export async function updateCampaignEnquiry(
  id: string,
  updates: {
    status?: string;
    adminNotes?: string;
    trackingUrl?: string;
    trackingUrlArrangedByAdmin?: boolean;
    followUpNote?: string;
    followUpType?: 'call' | 'whatsapp' | 'email' | 'note' | 'status_change';
  }
): Promise<{ success: boolean; enquiry: CampaignEnquiry }> {
  return safeFetchJson(
    `${API_BASE}/admin/campaign-enquiries/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    },
    'Failed to update campaign enquiry'
  );
}

export async function convertCampaignEnquiryToTask(
  id: string,
  taskOverride?: Partial<Task>
): Promise<{ success: boolean; task: Task; enquiry: CampaignEnquiry }> {
  return safeFetchJson(
    `${API_BASE}/admin/campaign-enquiries/${id}/convert-to-task`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ taskOverride }),
    },
    'Failed to convert enquiry to task'
  );
}

export async function checkRegistrationDuplicates(params: { email?: string; mobile?: string }) {
  return safeFetchJson<{
    emailUsed: boolean;
    mobileUsed: boolean;
    emailError?: string;
    mobileError?: string;
  }>(
    `${API_BASE}/auth/check-duplicates`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Failed to check duplicate credentials'
  );
}

export async function cleanupAdminAccounts() {
  return safeFetchJson<{
    success: boolean;
    message: string;
    deletedLocalAdmins: number;
    deletedFromSupabaseProfiles: number;
    deletedFromSupabaseAuth: number;
    admins: User[];
  }>(
    `${API_BASE}/admin/users/cleanup-admins`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    },
    'Failed to clean up admin accounts'
  );
}

// ==================== Monthly Incentives API ====================
export async function fetchUserIncentives(month?: string, userId?: string): Promise<UserIncentivesOverview> {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (userId) params.append('userId', userId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return safeFetchJson<UserIncentivesOverview>(
    `${API_BASE}/incentives${query}`,
    {
      headers: getAuthHeaders(),
    },
    'Failed to load monthly incentive data'
  );
}

export async function claimUserIncentive(
  planType: IncentivePlanType,
  milestoneId: string,
  month?: string,
  userId?: string
): Promise<{ success: boolean; message: string; claim: IncentiveClaimRecord; wallet?: WalletSummary }> {
  return safeFetchJson(
    `${API_BASE}/incentives/claim`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ planType, milestoneId, month, userId }),
    },
    'Failed to claim milestone bonus'
  );
}

export async function fetchAdminIncentives(month?: string): Promise<AdminIncentivesOverview> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return safeFetchJson<AdminIncentivesOverview>(
    `${API_BASE}/admin/incentives${query}`,
    {
      headers: getAuthHeaders(),
    },
    'Failed to load admin incentives data'
  );
}

export async function updateAdminIncentivePlan(
  planType: IncentivePlanType,
  updates: Partial<IncentivePlanConfig>
): Promise<{ success: boolean; plan: IncentivePlanConfig }> {
  return safeFetchJson(
    `${API_BASE}/admin/incentives/plans/${planType}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    },
    'Failed to update incentive plan'
  );
}

export async function createAdminIncentiveMilestone(
  planType: IncentivePlanType,
  data: { target: number; bonusAmount: number; title?: string; description?: string }
): Promise<{ success: boolean; milestone: IncentiveMilestone }> {
  return safeFetchJson(
    `${API_BASE}/admin/incentives/plans/${planType}/milestones`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
    'Failed to create incentive milestone'
  );
}

export async function updateAdminIncentiveMilestone(
  planType: IncentivePlanType,
  milestoneId: string,
  data: Partial<IncentiveMilestone>
): Promise<{ success: boolean; milestone: IncentiveMilestone }> {
  return safeFetchJson(
    `${API_BASE}/admin/incentives/plans/${planType}/milestones/${milestoneId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
    'Failed to update incentive milestone'
  );
}

export async function deleteAdminIncentiveMilestone(
  planType: IncentivePlanType,
  milestoneId: string
): Promise<{ success: boolean }> {
  return safeFetchJson(
    `${API_BASE}/admin/incentives/plans/${planType}/milestones/${milestoneId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
    'Failed to delete incentive milestone'
  );
}

export async function updateAdminIncentiveClaim(
  claimId: string,
  status: 'unlocked' | 'credited' | 'paid',
  adminNote?: string
): Promise<{ success: boolean; claim: IncentiveClaimRecord }> {
  return safeFetchJson(
    `${API_BASE}/admin/incentives/claims/${claimId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status, adminNote }),
    },
    'Failed to update claim status'
  );
}


