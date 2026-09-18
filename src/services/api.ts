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
  Campaign
} from '../types';

const API_BASE = '/api';

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

/**
 * Safe fetch wrapper that guarantees valid JSON parsing and human-readable error messages.
 * Prevents "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" if an endpoint returns HTML.
 */
export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackError = 'Request failed'
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(`Network error connecting to ${url}: ${netErr.message || 'Please check your connection.'}`);
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    let data: any = null;
    try {
      data = await res.json();
    } catch (parseErr: any) {
      if (!res.ok) {
        throw new Error(`${fallbackError} (${res.status} ${res.statusText})`);
      }
      throw new Error(`Failed to parse JSON response (${res.status})`);
    }

    if (!res.ok) {
      const serverMsg = data?.error || data?.message || data?.details;
      throw new Error(serverMsg || `${fallbackError} (${res.status})`);
    }
    return data as T;
  }

  // Not JSON! Handle HTML error responses (such as 404/502/500 proxy responses) gracefully
  const rawText = await res.text();
  let detail = '';
  if (rawText.includes('<html') || rawText.includes('<!DOCTYPE')) {
    detail = `API returned HTML page (${res.status} ${res.statusText}). Check API route: ${url}`;
  } else if (rawText.trim()) {
    detail = rawText.slice(0, 150);
  } else {
    detail = `HTTP ${res.status} ${res.statusText}`;
  }

  throw new Error(`${fallbackError}: ${detail}`);
}

export async function fetchMe(token?: string) {
  const authToken = token || getStoredToken();
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    headers['x-user-id'] = authToken;
  }
  const res = await fetch(`${API_BASE}/auth/me`, { headers });
  if (!res.ok) throw new Error('Not authenticated');
  const data = await res.json();
  return data as { user: User | null; wallet: WalletSummary | null; unreadNotifications: number };
}

export async function loginUser(identifier: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  if (data.token) {
    setStoredToken(data.token);
  }
  return data as { user: User; wallet: WalletSummary; token: string };
}

export async function adminLogin(identifier: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin login failed');
  if (data.token) {
    setStoredToken(data.token);
  }
  return data as { success: boolean; user: User; token: string; role: string; mustChangeCredentials?: boolean };
}

export async function getAdminSetupStatus() {
  const res = await fetch(`${API_BASE}/auth/admin/setup-status`);
  if (!res.ok) {
    return { isFirstTimeSetup: false };
  }
  return res.json() as Promise<{
    isFirstTimeSetup: boolean;
    defaultEmail?: string;
    defaultPassword?: string;
  }>;
}

export async function completeAdminSetup(data: { newEmail: string; newPassword: string }) {
  const res = await fetch(`${API_BASE}/auth/admin/complete-setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || 'Failed to finalize administrator setup');
  if (resData.token) {
    setStoredToken(resData.token);
  }
  return resData as { success: boolean; message: string; user: User; token: string };
}

export async function requestAdminPasswordReset(email: string) {
  const res = await fetch(`${API_BASE}/auth/admin/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
  return data as { success: boolean; message: string };
}

export async function submitAdminPasswordReset(data: { email: string; newPassword: string; token?: string }) {
  const res = await fetch(`${API_BASE}/auth/admin/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || 'Failed to reset administrator password');
  return resData as { success: boolean; message: string };
}

export async function verifyAdminSession() {
  const res = await fetch(`${API_BASE}/auth/admin/verify`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unauthorized' }));
    throw new Error(err.error || 'Access denied. Administrator privileges required.');
  }
  return res.json() as Promise<{ verified: boolean; role: string; user: User }>;
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
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  if (data.token) {
    setStoredToken(data.token);
  }
  return data as { user: User; wallet: WalletSummary; token: string };
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
  adminNote?: string,
  rejectionReason?: string,
  paymentReference?: string
) {
  const res = await fetch(`${API_BASE}/withdrawals/${withdrawalId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, adminNote, rejectionReason, paymentReference }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update withdrawal');
  return data as Withdrawal;
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
