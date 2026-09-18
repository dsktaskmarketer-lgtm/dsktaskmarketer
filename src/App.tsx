import React, { useState, useEffect } from 'react';
import { 
  fetchMe, 
  loginUser, 
  registerUser, 
  updateProfile,
  fetchTasks, 
  fetchCategories, 
  startTask,
  submitTaskProof,
  fetchSubmissions,
  updateSubmissionStatus,
  fetchRewards,
  fetchReferrals,
  fetchWithdrawals,
  requestWithdrawal,
  updateWithdrawalStatus,
  fetchCommunityLinks,
  saveCommunityLink,
  deleteCommunityLink,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchTickets,
  createTicket,
  replyTicket,
  updateTicketStatus,
  fetchAdminMetrics,
  fetchAdminUsers,
  toggleUserStatus,
  saveTask,
  toggleTaskActive,
  fetchPlatformSettings,
  updatePlatformSettings,
  fetchCampaigns,
  createCampaign,
  updateCampaignStatus,
  removeStoredToken
} from './services/api';
import { 
  User, 
  WalletSummary, 
  Task, 
  TaskCategory, 
  TaskSubmission, 
  RewardLedgerItem, 
  Withdrawal, 
  SocialLink, 
  NotificationItem, 
  SupportTicket, 
  PlatformSettings,
  ReferralRecord,
  Campaign
} from './types';

// Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskStartModal } from './components/TaskStartModal';
import { TaskSubmitModal } from './components/TaskSubmitModal';

// Public Views
import { HomeView } from './views/HomeView';
import { PublicTasksView } from './views/PublicTasksView';
import { PublicTaskPageView } from './views/PublicTaskPageView';
import { AboutView } from './views/AboutView';
import { HowItWorksView } from './views/HowItWorksView';
import { PublicReferView } from './views/PublicReferView';
import { CommunityView } from './views/CommunityView';
import { FaqView } from './views/FaqView';
import { ContactView } from './views/ContactView';
import { LegalViews } from './views/LegalViews';
import { AuthViews } from './views/AuthViews';

// User Views
import { UserDashboardView } from './views/user/UserDashboardView';
import { UserTasksView } from './views/user/UserTasksView';
import { UserSubmissionsView } from './views/user/UserSubmissionsView';
import { UserEarningsView } from './views/user/UserEarningsView';
import { UserReferralsView } from './views/user/UserReferralsView';
import { UserWithdrawalsView } from './views/user/UserWithdrawalsView';
import { UserWalletView } from './views/user/UserWalletView';
import { UserProfileView } from './views/user/UserProfileView';
import { UserSupportView } from './views/user/UserSupportView';

// Client (Advertiser) Views
import { ClientDashboardView } from './views/client/ClientDashboardView';
import { ClientCampaignsView } from './views/client/ClientCampaignsView';
import { ClientCreateCampaignView } from './views/client/ClientCreateCampaignView';
import { ClientSubmissionsView } from './views/client/ClientSubmissionsView';
import { ClientWalletView } from './views/client/ClientWalletView';

// Admin Views
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminTasksView } from './views/admin/AdminTasksView';
import { AdminSubmissionsView } from './views/admin/AdminSubmissionsView';
import { AdminRewardsView } from './views/admin/AdminRewardsView';
import { AdminWithdrawalsView } from './views/admin/AdminWithdrawalsView';
import { AdminUsersView } from './views/admin/AdminUsersView';
import { AdminClientsView } from './views/admin/AdminClientsView';
import { AdminCampaignsView } from './views/admin/AdminCampaignsView';
import { AdminCommunityView } from './views/admin/AdminCommunityView';
import { AdminSupportView } from './views/admin/AdminSupportView';
import { AdminSettingsView } from './views/admin/AdminSettingsView';
import { AdminLoginView } from './views/admin/AdminLoginView';
import { AdminAccessDeniedView } from './views/admin/AdminAccessDeniedView';
import { AdminReferralsView } from './views/admin/AdminReferralsView';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';

export default function App() {
  // Navigation & Session State
  const [currentView, setCurrentView] = useState<string>('home');
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });
  const [adminTab, setAdminTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab');
      if (t && ['overview', 'users', 'tasks', 'submissions', 'wallet', 'withdrawals', 'referrals', 'settings'].includes(t)) {
        return t as AdminTab;
      }
    }
    return 'overview';
  });
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Referral code captured from URL or stored
  const [initialReferralCode, setInitialReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref') || params.get('referral') || params.get('referrer');
      let pathRef: string | null = null;
      if (window.location.pathname.startsWith('/ref/')) {
        pathRef = window.location.pathname.split('/ref/')[1]?.split('?')[0]?.replace(/\/$/, '') || null;
      }
      const code = (refParam || pathRef || localStorage.getItem('dsk_referral_code') || '').trim().toUpperCase();
      if (code) {
        localStorage.setItem('dsk_referral_code', code);
        return code;
      }
    }
    return '';
  });

  // Platform Data
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    const cachedLogo = typeof window !== 'undefined' ? localStorage.getItem('dsk_custom_logo') : null;
    return {
      platformName: 'DSK TaskMarketer',
      companyName: 'Digital Success Key',
      tagline: 'Complete Tasks • Earn Rewards',
      logoUrl: cachedLogo || '',
      minWithdrawal: 200,
      maxWithdrawal: 25000,
      referralRewardAmount: 50,
      referralQualifyingCondition: 'First verified and approved financial task completion',
      referralPendingPeriodDays: 7,
      referralEnabled: true,
      whatsappSupportNumber: '+91 98765 43210',
      whatsappSupportLink: 'https://wa.me/919876543210',
      supportEmail: 'support@dsk-taskmarketer.com',
      supportHours: 'Monday - Saturday: 9:30 AM - 6:30 PM IST',
      maintenanceMode: false,
      complianceDisclaimer: 'DSK TaskMarketer is an affiliate marketing platform that provides performance-based rewards for verified customer actions.',
      affiliateDisclosureText: 'DSK TaskMarketer receives financial affiliate compensation from partner institutions for qualified consumer actions.'
    };
  });
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [rewards, setRewards] = useState<RewardLedgerItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Admin Data
  const [adminMetrics, setAdminMetrics] = useState<any>({
    totalUsers: 0,
    activeTasks: 0,
    pendingSubmissions: 0,
    totalRewardsPaid: 0,
    pendingWithdrawals: 0
  });
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);

  // Modal State
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [startTaskItem, setStartTaskItem] = useState<Task | null>(null);
  const [submitTaskItem, setSubmitTaskItem] = useState<Task | null>(null);
  const [taskStartedInfo, setTaskStartedInfo] = useState<{ referenceId: string; affiliateUrl: string; instructions: string } | null>(null);

  // Initialize Data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [st, cats, tlist, links, campList] = await Promise.all([
        fetchPlatformSettings().catch(() => settings),
        fetchCategories().catch(() => []),
        fetchTasks().catch(() => []),
        fetchCommunityLinks().catch(() => []),
        fetchCampaigns().catch(() => [])
      ]);
      const cachedLogo = typeof window !== 'undefined' ? localStorage.getItem('dsk_custom_logo') : null;
      const finalSettings: PlatformSettings = {
        ...st,
        logoUrl: st?.logoUrl || cachedLogo || ''
      };
      setSettings(finalSettings);
      setCategories(cats);
      setTasks(tlist);
      setSocialLinks(links);
      setCampaigns(campList);

      // Attempt to load current user
      try {
        const meData = await fetchMe();
        if (meData.user) {
          setUser(meData.user);
          setWallet(meData.wallet);
          setUnreadNotifications(meData.unreadNotifications || 0);
          await loadUserData(meData.user);
        } else {
          // If guest arrived with referral code, route directly to Register (Requirement 5)
          if (initialReferralCode) {
            setCurrentView('register');
          }
        }
      } catch (err) {
        // Guest visitor session active
        if (initialReferralCode) {
          setCurrentView('register');
        }
      }
    } catch (e) {
      console.error('Initial data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (currentUser: User) => {
    try {
      const [subs, rews, withdr, refs, notifs, tkts, camps] = await Promise.all([
        fetchSubmissions().catch(() => []),
        fetchRewards().catch(() => []),
        fetchWithdrawals().catch(() => []),
        fetchReferrals().catch(() => []),
        fetchNotifications().catch(() => []),
        fetchTickets().catch(() => []),
        fetchCampaigns().catch(() => [])
      ]);
      setSubmissions(Array.isArray(subs) ? subs : []);
      setRewards(Array.isArray(rews) ? rews : []);
      setWithdrawals(Array.isArray(withdr) ? withdr : []);
      setCampaigns(Array.isArray(camps) ? camps : []);
      
      const parsedRefs = Array.isArray(refs)
        ? refs
        : (refs && Array.isArray((refs as any).history)
            ? (refs as any).history
            : (refs && Array.isArray((refs as any).referrals) ? (refs as any).referrals : []));
      setReferrals(parsedRefs);

      setNotifications(Array.isArray(notifs) ? notifs : []);
      setTickets(Array.isArray(tkts) ? tkts : []);

      if (currentUser.role === 'admin') {
        loadAdminData();
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const loadAdminData = async () => {
    try {
      const [metrics, uList, wList, cList] = await Promise.all([
        fetchAdminMetrics().catch(() => ({})),
        fetchAdminUsers().catch(() => []),
        fetchWithdrawals(true).catch(() => []),
        fetchCampaigns().catch(() => [])
      ]);
      setAdminMetrics(metrics);
      setAdminUsers(uList);
      setAdminWithdrawals(wList);
      setCampaigns(cList);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Deep-link listener for referral links, task links, and /admin routes
  useEffect(() => {
    const handleUrlRoute = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      setCurrentPath(pathname);

      // Handle dedicated admin routes
      if (pathname.startsWith('/admin')) {
        if (pathname === '/admin/login') {
          return;
        }
        const t = params.get('tab');
        if (t && ['overview', 'users', 'tasks', 'submissions', 'wallet', 'withdrawals', 'referrals', 'settings'].includes(t)) {
          setAdminTab(t as AdminTab);
        }
        return;
      }

      // 1. Referral Link Detection (Requirement 5)
      const refParam = params.get('ref') || params.get('referral') || params.get('referrer');
      let pathRef: string | null = null;
      if (pathname.startsWith('/ref/')) {
        pathRef = pathname.split('/ref/')[1]?.split('?')[0]?.replace(/\/$/, '') || null;
      }
      const refCode = (refParam || pathRef || '').trim().toUpperCase();
      if (refCode) {
        setInitialReferralCode(refCode);
        localStorage.setItem('dsk_referral_code', refCode);
        // Requirement 5: Open Registration page directly if user is not logged in
        if (!user) {
          setCurrentView('register');
        }
      }

      // 2. Public task links (?task=... or ?campaign=... or /task/...)
      const taskParam = params.get('task') || params.get('campaign');
      let pathTaskId: string | null = null;
      if (pathname.startsWith('/task/')) {
        pathTaskId = pathname.split('/task/')[1]?.split('?')[0]?.replace(/\/$/, '') || null;
      }
      const targetId = taskParam || pathTaskId;
      if (targetId) {
        setSelectedTaskId(targetId);
        setCurrentView('task-detail');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, [user]);

  const handleNavigate = (view: string, id?: string) => {
    if (view === 'task-detail' || view === 'task') {
      if (id) {
        setSelectedTaskId(id);
        setCurrentView('task-detail');
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('task', id);
          window.history.pushState({}, '', url.toString());
        }
        return;
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.search.includes('task=') || window.location.search.includes('campaign='))) {
        const url = new URL(window.location.href);
        url.searchParams.delete('task');
        url.searchParams.delete('campaign');
        window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
    setCurrentView(view);
  };

  // Admin specific navigation and session handlers
  const handleAdminTabChange = (tab: AdminTab) => {
    setAdminTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.pathname = '/admin';
      if (tab === 'overview') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleAdminInternalNavigate = (view: string) => {
    const mapping: Record<string, AdminTab> = {
      'admin-dashboard': 'overview',
      'admin-tasks': 'tasks',
      'admin-campaigns': 'tasks',
      'admin-submissions': 'submissions',
      'admin-rewards': 'wallet',
      'admin-withdrawals': 'withdrawals',
      'admin-users': 'users',
      'admin-clients': 'users',
      'admin-referrals': 'referrals',
      'admin-settings': 'settings'
    };
    if (mapping[view]) {
      handleAdminTabChange(mapping[view]);
    } else {
      handleAdminTabChange('overview');
    }
  };

  const handleAdminLoginSuccess = async (adminUser: User) => {
    setUser(adminUser);
    setWallet({
      totalEarnings: 0,
      availableBalance: 0,
      pendingRewards: 0,
      referralRewards: 0,
      completedTasks: 0
    });

    if (adminUser.mustChangeCredentials) {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin/login');
      }
      setCurrentPath('/admin/login');
      return;
    }

    await loadUserData(adminUser);
    await loadAdminData();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin');
    }
    setCurrentPath('/admin');
    setAdminTab('overview');
  };

  const handleAdminLogout = () => {
    removeStoredToken();
    setUser(null);
    setWallet(null);
    setAdminMetrics({
      totalUsers: 0,
      activeTasks: 0,
      pendingSubmissions: 0,
      totalRewardsPaid: 0,
      pendingWithdrawals: 0
    });
    setAdminUsers([]);
    setAdminWithdrawals([]);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/login');
    }
    setCurrentPath('/admin/login');
  };

  const handleNavigateToUserApp = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setCurrentPath('/');
    setCurrentView(user ? (user.role === 'admin' ? 'dashboard' : 'dashboard') : 'home');
  };

  // Strict RBAC Route Guarding
  useEffect(() => {
    if (!loading) {
      const isProtectedUserRoute = ['dashboard', 'tasks', 'submissions', 'earnings', 'referrals', 'withdrawals', 'profile', 'support'].includes(currentView);
      const isClientRoute = currentView.startsWith('client-');
      const isAdminRoute = currentView.startsWith('admin-');

      if (!user) {
        if (isProtectedUserRoute || isClientRoute || isAdminRoute) {
          setCurrentView('login');
        }
      } else if (user.role === 'user') {
        if (isAdminRoute || isClientRoute) {
          setCurrentView('dashboard');
        }
      } else if (user.role === 'client') {
        if (isAdminRoute) {
          setCurrentView('client-dashboard');
        }
      }
    }
  }, [user, currentView, loading]);

  // Auth Handlers
  const handleLogin = async (email: string, pass: string) => {
    const data = await loginUser(email, pass);
    setUser(data.user);
    setWallet(data.wallet);
    await loadUserData(data.user);
    if (data.user.role === 'admin') {
      if (data.user.mustChangeCredentials) {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/admin/login');
        }
        setCurrentPath('/admin/login');
      } else {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/admin');
        }
        setCurrentPath('/admin');
        setAdminTab('overview');
      }
    } else if (data.user.role === 'client') {
      setCurrentView('client-dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleRegister = async (formData: { name: string; email: string; phone: string; pass: string; role: 'user' | 'client'; referralCode?: string }) => {
    const data = await registerUser({
      name: formData.name,
      email: formData.email,
      mobile: formData.phone,
      password: formData.pass,
      confirmPassword: formData.pass,
      role: formData.role,
      referralCode: formData.referralCode
    });
    setUser(data.user);
    setWallet(data.wallet);
    await loadUserData(data.user);
    if (data.user.role === 'client') {
      setCurrentView('client-dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setWallet(null);
    setSubmissions([]);
    setRewards([]);
    setWithdrawals([]);
    setReferrals([]);
    setNotifications([]);
    setTickets([]);
    setCampaigns([]);
    setCurrentView('home');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setCurrentPath('/');
  };

  // Task & Submission Handlers
  const handleStartTask = async (task: Task) => {
    if (!user) {
      setDetailTask(null);
      setCurrentView('login');
      return;
    }
    try {
      const info = await startTask(task.id);
      setStartTaskItem(task);
      setTaskStartedInfo(info);
      setDetailTask(null);
    } catch (e: any) {
      alert(e.message || 'Could not start task');
    }
  };

  const handleSubmitProof = async (submissionData: {
    taskId: string;
    completedDate: string;
    proofApplicationId?: string;
    screenshotUrl?: string;
    userNote?: string;
  }) => {
    const sub = await submitTaskProof(submissionData);
    setSubmissions(prev => [sub, ...prev]);
    setSubmitTaskItem(null);
    if (user) {
      const meData = await fetchMe();
      setWallet(meData.wallet);
    }
  };

  const handleUpdateSubmissionStatus = async (
    submissionId: string, 
    status: any, 
    rejectionReason?: string, 
    adminNote?: string
  ) => {
    await updateSubmissionStatus(submissionId, status, adminNote, rejectionReason);
    const updated = await fetchSubmissions();
    setSubmissions(updated);
    if (user?.role === 'admin') {
      await loadAdminData();
    }
  };

  // Client Campaign Actions
  const handleCreateCampaign = async (campaignData: Partial<Campaign>) => {
    const newCamp = await createCampaign(campaignData);
    setCampaigns(prev => [newCamp, ...prev]);
    setCurrentView('client-campaigns');
  };

  const handleUpdateCampaignStatus = async (campaignId: string, status: Campaign['status'], rejectionReason?: string) => {
    const updated = await updateCampaignStatus(campaignId, status, rejectionReason);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? updated : c));
    const tlist = await fetchTasks();
    setTasks(tlist);
  };

  const handleClientReviewSubmission = async (
    submissionId: string,
    status: 'approved' | 'rejected',
    note?: string
  ) => {
    await updateSubmissionStatus(submissionId, status, note, status === 'rejected' ? note : undefined);
    const updated = await fetchSubmissions();
    setSubmissions(updated);
  };

  // Withdrawal Handlers
  const handleRequestWithdrawal = async (data: {
    amount: number;
    paymentMethod: 'upi' | 'bank_transfer';
    upiId?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    accountHolderName?: string;
  }) => {
    const payoutDetails = {
      upiId: data.upiId,
      bankAccount: data.bankAccountNumber,
      ifsc: data.bankIfsc,
      accountHolderName: data.accountHolderName
    };
    const newWth = await requestWithdrawal(data.amount, data.paymentMethod, payoutDetails);
    setWithdrawals(prev => [newWth, ...prev]);
    if (user) {
      const meData = await fetchMe();
      if (meData?.wallet) {
        setWallet(meData.wallet);
      }
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string, payoutRef?: string, note?: string) => {
    await updateWithdrawalStatus(withdrawalId, 'completed', payoutRef, note);
    if (user?.role === 'admin') {
      await loadAdminData();
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string, reason: string, note?: string) => {
    await updateWithdrawalStatus(withdrawalId, 'rejected', undefined, note, reason);
    if (user?.role === 'admin') {
      await loadAdminData();
    }
  };

  const handleUpdateWithdrawalStatus = async (
    withdrawalId: string, 
    status: any, 
    payoutRef?: string, 
    note?: string, 
    rejectionReason?: string
  ) => {
    await updateWithdrawalStatus(withdrawalId, status, payoutRef, note, rejectionReason);
    if (user?.role === 'admin') {
      await loadAdminData();
    }
  };

  // User Profile Handlers
  const handleUpdateProfile = async (profileData: any) => {
    const updated = await updateProfile(profileData);
    setUser(updated);
  };

  // Support Handlers
  const handleCreateTicket = async (ticketData: { subject: string; category: string; message: string }) => {
    const newT = await createTicket(ticketData);
    setTickets(prev => [newT, ...prev]);
  };

  const handleReplyTicket = async (ticketId: string, message: string) => {
    const updated = await replyTicket(ticketId, message);
    setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
  };

  // Notifications Handlers
  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
  };

  // Admin Task Handlers
  const handleCreateTask = async (taskData: any) => {
    const created = await saveTask(taskData);
    setTasks(prev => [created, ...prev]);
  };

  const handleUpdateTask = async (taskData: any) => {
    const updated = await saveTask(taskData);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    await toggleTaskActive(taskId, false);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, active: false } : t));
  };

  const handleSaveSettings = async (newSettings: PlatformSettings) => {
    const updated = await updatePlatformSettings(newSettings);
    setSettings(updated);
  };

  // Adapter Mappings for Views
  const userWalletMapped = wallet || {
    totalEarnings: 0,
    availableBalance: 0,
    pendingRewards: 0,
    referralRewards: 0,
    completedTasks: 0
  };

  const userWithdrawalsMapped = (Array.isArray(withdrawals) ? withdrawals : []).map(w => ({
    id: w.id,
    userId: w.userId,
    userName: w.userName || user?.name || '',
    userEmail: w.userEmail || user?.email || '',
    amount: w.amount,
    paymentMethod: (w.payoutDetails?.upiId ? 'upi' : 'bank_transfer') as any,
    status: w.status as any,
    payoutReference: w.payoutReference,
    rejectionReason: w.rejectionReason,
    adminNote: w.adminNote,
    paidAmount: w.paidAmount || w.amount,
    paidDate: w.paidDate,
    requestedAt: w.requestedAt,
    processedAt: w.processedAt,
    payoutDetails: w.payoutDetails,
    auditLogs: w.auditLogs || []
  }));

  const userRewardsMapped = (Array.isArray(rewards) ? rewards : []).map(r => ({
    id: r.id,
    userId: r.userId,
    amount: r.amount,
    type: r.type,
    status: (r.status === 'approved' || r.status === 'credited' ? 'approved' : r.status === 'pending' ? 'pending' : 'cancelled') as any,
    description: r.description,
    createdAt: r.createdAt
  }));

  const userReferralsMapped = (Array.isArray(referrals) ? referrals : []).map(r => ({
    id: r.id,
    referredUserId: r.referredUserId,
    referredUserName: r.referredUserName,
    rewardAmount: r.rewardAmount,
    rewardStatus: (r.status === 'reward_credited' ? 'rewarded' : r.status === 'eligible' ? 'task_completed' : 'registered') as any,
    createdAt: r.createdAt
  }));

  const userTicketsMapped = (Array.isArray(tickets) ? tickets : []).map(t => ({
    id: t.id,
    userId: t.userId,
    userName: t.userName,
    userEmail: t.userEmail,
    subject: t.subject,
    category: t.category,
    message: t.messages?.[0]?.message || '',
    adminResponse: t.messages?.find(m => m.senderRole === 'admin')?.message,
    status: (t.status === 'resolved' || t.status === 'closed' ? 'resolved' : t.status === 'in_progress' ? 'in_progress' : 'open') as any,
    createdAt: t.createdAt
  }));

  const adminSettingsMapped = {
    minimumWithdrawalLimit: settings.minWithdrawal,
    referralRewardAmount: settings.referralRewardAmount,
    supportEmail: settings.supportEmail,
    whatsappNumber: settings.whatsappSupportNumber,
    whatsappSupportLink: settings.whatsappSupportLink,
    supportHours: settings.supportHours,
    affiliateDisclosure: settings.affiliateDisclosureText,
    complianceDisclaimer: settings.complianceDisclaimer
  };

  const userProfileMapped: any = user ? {
    ...user,
    phone: (user as any).phone || user.mobile || '',
    upiId: (user as any).upiId || user.payoutDetails?.upiId || '',
    bankAccountNumber: (user as any).bankAccountNumber || user.payoutDetails?.bankAccount || '',
    bankIfsc: (user as any).bankIfsc || user.payoutDetails?.ifsc || '',
    accountHolderName: (user as any).accountHolderName || user.payoutDetails?.accountHolderName || user.name || ''
  } : {
    id: 'guest',
    name: 'Guest User',
    email: '',
    mobile: '',
    phone: '',
    upiId: '',
    bankAccountNumber: '',
    bankIfsc: '',
    accountHolderName: 'Guest User',
    role: 'user',
    status: 'active',
    referralCode: '',
    createdAt: new Date().toISOString()
  };

  // 1. DEDICATED ADMIN LOGIN ROUTE (/admin/login)
  if (currentPath === '/admin/login') {
    return (
      <AdminLoginView
        currentUser={user}
        settings={settings}
        forceFirstTimeSetup={Boolean(user?.role === 'admin' && user?.mustChangeCredentials)}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onNavigateToUserApp={handleNavigateToUserApp}
        onLogoutCurrentUser={handleLogout}
      />
    );
  }

  // 2. DEDICATED ADMIN PORTAL ROUTE (/admin or /admin/*)
  if (currentPath.startsWith('/admin')) {
    // Show spinner if still evaluating auth status
    if (loading) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-xs font-mono text-slate-400">Authenticating Administrative Clearance...</p>
        </div>
      );
    }

    // If guest visitor, redirect to /admin/login
    if (!user) {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/admin/login');
      }
      return (
        <AdminLoginView
          currentUser={null}
          settings={settings}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onNavigateToUserApp={handleNavigateToUserApp}
          onLogoutCurrentUser={handleLogout}
        />
      );
    }

    // If authenticated normal user, show 403 Forbidden Access Denied
    if (user.role !== 'admin') {
      return (
        <AdminAccessDeniedView
          user={user}
          onReturnToUserApp={handleNavigateToUserApp}
          onLogoutAndGoToAdminLogin={() => {
            handleLogout();
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/admin/login');
            }
            setCurrentPath('/admin/login');
          }}
        />
      );
    }

    // Enforce First-Time Credential Setup: Block access to admin dashboard until setup is completed
    if (user.mustChangeCredentials) {
      if (typeof window !== 'undefined' && currentPath !== '/admin/login') {
        window.history.replaceState({}, '', '/admin/login');
      }
      return (
        <AdminLoginView
          currentUser={user}
          settings={settings}
          forceFirstTimeSetup={true}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onNavigateToUserApp={handleNavigateToUserApp}
          onLogoutCurrentUser={handleLogout}
        />
      );
    }

    // Verified Administrator -> Dedicated Admin Portal Layout
    return (
      <AdminLayout
        user={user}
        settings={settings}
        activeTab={adminTab}
        pendingWithdrawalsCount={adminWithdrawals.filter(w => w.status === 'requested' || w.status === 'under_audit').length}
        pendingSubmissionsCount={submissions.filter(s => s.status === 'under_verification' || s.status === 'submitted').length}
        onTabChange={handleAdminTabChange}
        onAdminLogout={handleAdminLogout}
        onNavigateToUserApp={handleNavigateToUserApp}
      >
        {adminTab === 'overview' && (
          <AdminDashboardView
            metrics={adminMetrics}
            recentSubmissions={submissions}
            recentWithdrawals={adminWithdrawals}
            tasks={tasks}
            settings={settings}
            onNavigate={handleAdminInternalNavigate}
            onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
            onProcessWithdrawal={handleProcessWithdrawal}
            onUpdateWithdrawalStatus={handleUpdateWithdrawalStatus}
            onUpdateSettings={handleSaveSettings}
            onRefresh={loadAdminData}
          />
        )}

        {adminTab === 'users' && (
          <AdminUsersView
            users={adminUsers}
            onToggleUserStatus={async (uid) => {
              await toggleUserStatus(uid);
              await loadAdminData();
            }}
          />
        )}

        {adminTab === 'tasks' && (
          <AdminTasksView
            tasks={tasks}
            categories={categories}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onNavigate={handleAdminInternalNavigate}
          />
        )}

        {adminTab === 'submissions' && (
          <AdminSubmissionsView
            submissions={submissions}
            tasks={tasks}
            onUpdateStatus={handleUpdateSubmissionStatus}
            onRefresh={loadAdminData}
          />
        )}

        {adminTab === 'wallet' && (
          <AdminRewardsView
            rewards={rewards as any}
            users={adminUsers}
            onGrantBonus={async (uid, amt, desc) => {
              alert(`Bonus of ₹${amt} processed for user ${uid}`);
            }}
          />
        )}

        {adminTab === 'withdrawals' && (
          <AdminWithdrawalsView
            withdrawals={adminWithdrawals}
            onProcessWithdrawal={handleProcessWithdrawal}
            onRejectWithdrawal={handleRejectWithdrawal}
            onUpdateStatus={handleUpdateWithdrawalStatus}
            onRefresh={loadAdminData}
          />
        )}

        {adminTab === 'referrals' && (
          <AdminReferralsView onRefresh={loadAdminData} />
        )}

        {adminTab === 'settings' && (
          <AdminSettingsView
            settings={settings}
            onUpdateSettings={handleSaveSettings}
          />
        )}
      </AdminLayout>
    );
  }

  // 3. PUBLIC & USER APP (/)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors">
      {/* Universal Header */}
      <Header
        user={user}
        wallet={wallet}
        unreadCount={unreadNotifications}
        notifications={notifications}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        settings={settings}
      />

      {/* Main View Router */}
      <main className="flex-grow">
        {/* PUBLIC TASK / CAMPAIGN VIEW */}
        {currentView === 'task-detail' && selectedTaskId && (
          <PublicTaskPageView
            taskId={selectedTaskId}
            tasks={tasks}
            categories={categories}
            user={user}
            onNavigate={handleNavigate}
            onStartTask={handleStartTask}
            onSubmitProof={(t) => {
              if (!user) {
                setCurrentView('login');
              } else {
                setSubmitTaskItem(t);
              }
            }}
          />
        )}

        {/* PUBLIC VIEWS */}
        {currentView === 'home' && (
          <HomeView
            user={user}
            tasks={tasks}
            categories={categories}
            socialLinks={socialLinks}
            settings={settings}
            onNavigate={handleNavigate}
            onViewTask={(t) => handleNavigate('task-detail', t.id)}
            onStartTask={handleStartTask}
          />
        )}

        {currentView === 'available-tasks' && (
          <PublicTasksView
            tasks={tasks}
            categories={categories}
            onViewTask={(t) => handleNavigate('task-detail', t.id)}
            onStartTask={handleStartTask}
          />
        )}

        {currentView === 'how-it-works' && (
          <HowItWorksView
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'refer-earn' && (
          <PublicReferView
            settings={settings}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'community' && (
          <CommunityView
            socialLinks={socialLinks}
          />
        )}

        {currentView === 'about' && (
          <AboutView
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'faq' && (
          <FaqView
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'contact' && (
          <ContactView
            settings={settings}
            user={user}
            onSubmitTicket={handleCreateTicket}
            onNavigate={setCurrentView}
          />
        )}

        {(currentView === 'terms' || currentView === 'privacy' || currentView === 'affiliate-disclosure' || currentView === 'financial-disclaimer') && (
          <LegalViews
            type={currentView as any}
            settings={settings}
            onNavigate={setCurrentView}
          />
        )}

        {(currentView === 'login' || currentView === 'register' || currentView === 'forgot-password') && (
          <AuthViews
            mode={currentView as any}
            initialReferralCode={initialReferralCode}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSwitchMode={(mode) => setCurrentView(mode)}
          />
        )}

        {/* USER AUTHENTICATED VIEWS */}
        {user && currentView === 'dashboard' && (
          <UserDashboardView
            user={user}
            wallet={userWalletMapped}
            tasks={tasks}
            categories={categories}
            submissions={submissions}
            withdrawals={userWithdrawalsMapped as any}
            rewards={userRewardsMapped as any}
            onRequestWithdrawal={handleRequestWithdrawal}
            onNavigate={setCurrentView}
            onViewTask={(t) => setDetailTask(t)}
            onStartTask={handleStartTask}
            onSubmitProof={(t) => setSubmitTaskItem(t)}
          />
        )}

        {user && currentView === 'tasks' && (
          <UserTasksView
            tasks={tasks}
            categories={categories}
            activities={[]}
            onViewTask={(t) => setDetailTask(t)}
            onStartTask={handleStartTask}
            onSubmitProof={(t) => setSubmitTaskItem(t)}
          />
        )}

        {user && currentView === 'submissions' && (
          <UserSubmissionsView
            submissions={submissions}
            tasks={tasks}
            onOpenSubmitModal={() => setSubmitTaskItem(tasks[0] || null)}
          />
        )}

        {user && currentView === 'earnings' && (
          <UserEarningsView
            wallet={userWalletMapped}
            rewards={userRewardsMapped}
            onNavigate={setCurrentView}
          />
        )}

        {user && currentView === 'referrals' && (
          <UserReferralsView
            user={userProfileMapped}
            referrals={userReferralsMapped}
            settings={adminSettingsMapped as any}
          />
        )}

        {user && (currentView === 'wallet' || currentView === 'withdrawals') && (
          <UserWalletView
            user={userProfileMapped}
            wallet={userWalletMapped}
            withdrawals={userWithdrawalsMapped as any}
            rewards={userRewardsMapped as any}
            onRequestWithdrawal={handleRequestWithdrawal}
            onNavigate={setCurrentView}
          />
        )}

        {user && currentView === 'profile' && (
          <UserProfileView
            user={userProfileMapped}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {user && currentView === 'support' && (
          <UserSupportView
            tickets={userTicketsMapped}
            settings={adminSettingsMapped as any}
            onNavigate={setCurrentView}
          />
        )}

        {/* CLIENT (ADVERTISER) WORKSPACE (Role Guarded) */}
        {user?.role === 'client' && currentView === 'client-dashboard' && (
          <ClientDashboardView
            user={user}
            campaigns={campaigns}
            submissions={submissions}
            onNavigate={setCurrentView}
          />
        )}

        {user?.role === 'client' && currentView === 'client-campaigns' && (
          <ClientCampaignsView
            user={user}
            campaigns={campaigns}
            categories={categories}
            onCreateCampaignClick={() => setCurrentView('client-create-campaign')}
            onUpdateStatus={(id, status) => handleUpdateCampaignStatus(id, status)}
          />
        )}

        {user?.role === 'client' && currentView === 'client-create-campaign' && (
          <ClientCreateCampaignView
            user={user}
            categories={categories}
            onCreateCampaign={handleCreateCampaign}
            onCancel={() => setCurrentView('client-campaigns')}
          />
        )}

        {user?.role === 'client' && currentView === 'client-submissions' && (
          <ClientSubmissionsView
            user={user}
            campaigns={campaigns}
            submissions={submissions}
            onReviewSubmission={handleClientReviewSubmission}
          />
        )}

        {user?.role === 'client' && currentView === 'client-wallet' && (
          <ClientWalletView
            user={user}
            wallet={wallet}
          />
        )}
      </main>

      {/* Universal Compliance Footer */}
      <Footer
        settings={settings}
        onNavigate={setCurrentView}
      />

      {/* MODALS */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          category={categories.find(c => c.id === detailTask.categoryId)}
          onClose={() => setDetailTask(null)}
          onStartTask={handleStartTask}
          onSubmitProof={(t) => {
            setDetailTask(null);
            setSubmitTaskItem(t);
          }}
          isLoggedIn={!!user}
        />
      )}

      {startTaskItem && taskStartedInfo && (
        <TaskStartModal
          task={startTaskItem}
          trackingId={taskStartedInfo.referenceId}
          onClose={() => {
            setStartTaskItem(null);
            setTaskStartedInfo(null);
          }}
          onSubmitProof={() => {
            const t = startTaskItem;
            setStartTaskItem(null);
            setTaskStartedInfo(null);
            setSubmitTaskItem(t);
          }}
        />
      )}

      {submitTaskItem && (
        <TaskSubmitModal
          task={submitTaskItem}
          onClose={() => setSubmitTaskItem(null)}
          onSubmit={handleSubmitProof}
        />
      )}
    </div>
  );
}
