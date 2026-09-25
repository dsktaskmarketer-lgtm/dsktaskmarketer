import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { 
  User, 
  Task, 
  TaskCategory, 
  Submission, 
  RewardTransaction, 
  WithdrawalRequest, 
  ReferralItem, 
  NotificationItem, 
  SupportTicket, 
  SocialMediaLink, 
  PlatformSettings,
  WalletSummary,
  Client,
  Campaign,
  CampaignEnquiry,
  CampaignEnquiryStatus,
  PartnerType,
  IncentivePlanType,
  IncentiveMilestone,
  IncentivePlanConfig,
  IncentiveClaimRecord,
  UserMonthlyPlanProgress,
  UserIncentivesOverview,
  AdminIncentivesOverview,
  AdminIncentiveUserItem
} from '../src/types.ts';
import { saveEnquiryToSupabase, loadEnquiriesFromSupabase } from './supabase.ts';

export class InMemoryDB {
  public users: (User & { passwordHash?: string; salt?: string })[] = [];
  public clients: Client[] = [];
  public campaigns: Campaign[] = [];
  public campaignEnquiries: CampaignEnquiry[] = [];
  public categories: TaskCategory[] = [];
  public tasks: Task[] = [];
  public taskStarts: { taskId: string; userId: string; referenceId: string; startedAt: string }[] = [];
  public submissions: Submission[] = [];
  public rewards: RewardTransaction[] = [];
  public withdrawals: WithdrawalRequest[] = [];
  public referrals: ReferralItem[] = [];
  public notifications: NotificationItem[] = [];
  public tickets: SupportTicket[] = [];
  public socialLinks: SocialMediaLink[] = [];
  public settings: PlatformSettings;
  public adminSetupCompleted: boolean = false;
  public incentivePlans: IncentivePlanConfig[] = [];
  public incentiveClaims: IncentiveClaimRecord[] = [];
  private storageFilePath: string;
  private settingsStoragePath: string;
  private tasksStoragePath: string;
  private usersStoragePath: string;
  private campaignsStoragePath: string;
  private enquiriesStoragePath: string;
  private submissionsStoragePath: string;
  private rewardsStoragePath: string;
  private withdrawalsStoragePath: string;
  private incentivesStoragePath: string;

  constructor() {
    this.storageFilePath = path.join(process.cwd(), '.data', 'admin_config.json');
    this.settingsStoragePath = path.join(process.cwd(), '.data', 'settings.json');
    this.tasksStoragePath = path.join(process.cwd(), '.data', 'tasks.json');
    this.usersStoragePath = path.join(process.cwd(), '.data', 'users.json');
    this.campaignsStoragePath = path.join(process.cwd(), '.data', 'campaigns.json');
    this.enquiriesStoragePath = path.join(process.cwd(), '.data', 'campaign_enquiries.json');
    this.submissionsStoragePath = path.join(process.cwd(), '.data', 'submissions.json');
    this.rewardsStoragePath = path.join(process.cwd(), '.data', 'rewards.json');
    this.withdrawalsStoragePath = path.join(process.cwd(), '.data', 'withdrawals.json');
    this.incentivesStoragePath = path.join(process.cwd(), '.data', 'incentives.json');

    // 1. Clean Standard Taxonomy: Real Financial Categories (No fake users, no fake tasks)
    this.categories = [
      { id: "cat_cards", name: "Credit Cards", slug: "credit-cards", icon: "CreditCard", description: "Verified reward programs on bank credit card applications", active: true },
      { id: "cat_banking", name: "Banking Accounts", slug: "banking", icon: "Landmark", description: "Digital zero-balance and premier savings account onboarding", active: true },
      { id: "cat_demat", name: "Demat & Trading", slug: "demat-investment", icon: "TrendingUp", description: "Stock broking, discount demat, and wealth management platforms", active: true },
      { id: "cat_loans", name: "Personal Loans", slug: "loans", icon: "Banknote", description: "Verified digital personal loan and instant credit line offers", active: true },
      { id: "cat_insurance", name: "Insurance", slug: "insurance", icon: "ShieldCheck", description: "Health, life, and motor insurance quote & issuance verification", active: true },
      { id: "cat_apps", name: "Fintech Apps", slug: "financial-apps", icon: "Smartphone", description: "Credit score monitors, UPI wallets, and savings apps", active: true },
      { id: "cat_shopping", name: "Shopping", slug: "shopping", icon: "ShoppingBag", description: "Verified e-commerce and retail shopping rewards", active: true },
      { id: "cat_local", name: "Local Business", slug: "local-business", icon: "Store", description: "Neighborhood stores, supermarkets, and local merchant offers", active: true },
      { id: "cat_social", name: "Social Media", slug: "social-media", icon: "Share2", description: "Social channel subscriptions and community engagements", active: true },
      { id: "cat_education", name: "Education", slug: "education", icon: "GraduationCap", description: "Courses, test prep, and educational portal signups", active: true },
      { id: "cat_services", name: "Services", slug: "services", icon: "Briefcase", description: "Utility, professional, and digital services promotions", active: true },
      { id: "cat_other", name: "Special Offers", slug: "other-affiliates", icon: "Sparkles", description: "Specialized partner offers and referral rewards", active: true }
    ];

    // 2. Real Social Media Channels
    this.socialLinks = [
      {
        id: "soc_01",
        platform: "telegram_channel",
        displayName: "DSK Official Announcements",
        url: "https://t.me/dsktaskmarketer",
        icon: "Send",
        enabled: true,
        displayOrder: 1,
        description: "Official updates on newly approved partner tasks and verification schedules"
      },
      {
        id: "soc_02",
        platform: "telegram_group",
        displayName: "DSK Community Discussion Group",
        url: "https://t.me/dsktaskmarketer_community",
        icon: "Users",
        enabled: true,
        displayOrder: 2,
        description: "Community forum for tips and step-by-step assistance"
      },
      {
        id: "soc_03",
        platform: "whatsapp_community",
        displayName: "DSK WhatsApp Community",
        url: "https://whatsapp.com/channel/dsktaskmarketer",
        icon: "MessageSquare",
        enabled: true,
        displayOrder: 3,
        description: "Direct notifications for high-priority affiliate rewards"
      }
    ];

    // 3. Platform Configuration Defaults
    this.settings = {
      platformName: "DSK TaskMarketer",
      companyName: "Digital Success Key",
      tagline: "Digital Success Key • Complete Tasks • Earn Rewards",
      logoUrl: "",
      primaryColor: "#1d4ed8",
      contactEmail: "support@dsktaskmarketer.com",
      supportEmail: "support@dsktaskmarketer.com",
      whatsappSupportNumber: "+91 80000 00000",
      whatsappSupportLink: "https://wa.me/918000000000",
      supportHours: "Mon-Sat 9AM-6PM",
      complianceDisclaimer: "DSK TaskMarketer is a performance marketing and affiliate rewards intermediary. Rewards are credited solely upon partner audit and reconciliation of qualified consumer actions. Never share banking passwords or OTPs.",
      affiliateDisclosureText: "DSK TaskMarketer receives financial affiliate compensation from partner institutions for qualified consumer actions.",
      minWithdrawal: 200,
      maxWithdrawal: 25000,
      minimumWithdrawalAmount: 200,
      referralRewardAmount: 50,
      referralQualifyingCondition: "First verified and approved task completion",
      referralPendingPeriodDays: 7,
      referralEnabled: true,
      maintenanceMode: false
    };

    // 3b. Load Persisted Platform Settings
    this.initSettings();

    // 4. Administrator Setup Initialization & Persistence Check
    this.initAdminAccount();

    // 5. Tasks Initialization & Persistence Check
    this.initTasks();

    // 6. Permanent User & Client Account Initialization from Disk
    this.initUsers();

    // 7. Client Campaigns & Advertiser Enquiries Initialization
    this.initCampaigns();
    this.initCampaignEnquiries();

    // 8. Submissions, Rewards, and Withdrawals Ledger Initialization & Persistence
    this.initSubmissions();
    this.initRewards();
    this.initWithdrawals();

    // 9. 3-Plan Monthly Incentive System Initialization
    this.initIncentives();
  }

  private initAdminAccount() {
    const PRIMARY_ADMIN_EMAIL = (process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'dsktaskmarketer@gmail.com').trim().toLowerCase();
    const envAdminPass = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const isSetupCompletedEnv = process.env.ADMIN_SETUP_COMPLETED === 'true';

    let persistedSetupCompleted = isSetupCompletedEnv;
    let persistedHash: string | undefined;
    let persistedSalt: string | undefined;

    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const config = JSON.parse(raw);
        if (config && config.adminSetupCompleted) {
          persistedSetupCompleted = true;
          this.adminSetupCompleted = true;
          persistedHash = config.passwordHash;
          persistedSalt = config.salt;
        }
      }
    } catch (err) {
      console.warn('[Admin Security] Error reading persisted admin config:', err);
    }

    if (persistedSetupCompleted) {
      this.adminSetupCompleted = true;
    }

    let adminHash = persistedHash;
    let adminSalt = persistedSalt;

    // Hash initial password from environment if provided and no existing hash is loaded
    if (!adminHash && envAdminPass && envAdminPass.trim()) {
      const { hash: envHash, salt: envSalt } = this.hashPassword(envAdminPass.trim());
      adminHash = envHash;
      adminSalt = envSalt;
      this.adminSetupCompleted = true;
    }

    // Ensure primary admin exists in in-memory cache
    const existing = this.users.find(u => u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL || u.role === 'admin');
    if (existing) {
      existing.email = PRIMARY_ADMIN_EMAIL;
      existing.role = 'admin';
      existing.status = 'active';
      if (adminHash && adminSalt) {
        existing.passwordHash = adminHash;
        existing.salt = adminSalt;
      }
    } else {
      this.users.push({
        id: "admin_root_001",
        name: "DSK Platform Administrator",
        email: PRIMARY_ADMIN_EMAIL,
        mobile: "+91 98000 00000",
        role: "admin",
        status: "active",
        referralCode: "DSKADMIN",
        createdAt: new Date().toISOString(),
        passwordHash: adminHash,
        salt: adminSalt
      });
    }

    // Guarantee that ONLY the designated primary admin is retained
    this.users = this.users.filter(u => {
      if (u.role === 'admin' && u.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL) {
        return false;
      }
      return true;
    });

    console.log(`[Admin Security] Administrator initialized: ${PRIMARY_ADMIN_EMAIL} (Setup completed: ${this.adminSetupCompleted})`);
  }

  public isDesignatedAdminEmail(email: string): boolean {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    const primary = (process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'dsktaskmarketer@gmail.com').trim().toLowerCase();
    return clean === primary;
  }

  public getAdminSetupStatus() {
    return {
      isFirstTimeSetup: !this.adminSetupCompleted
    };
  }

  public createInitialAdmin(email: string, password: string): User {
    const cleanedEmail = email.trim().toLowerCase();
    const { hash, salt } = this.hashPassword(password);
    this.adminSetupCompleted = true;

    let adminUser = this.users.find(u => u.email.toLowerCase() === cleanedEmail || u.role === 'admin');
    if (adminUser) {
      adminUser.email = cleanedEmail;
      adminUser.role = 'admin';
      adminUser.passwordHash = hash;
      adminUser.salt = salt;
    } else {
      adminUser = {
        id: "admin_root_001",
        name: "DSK Platform Administrator",
        email: cleanedEmail,
        mobile: "+91 98000 00000",
        role: "admin",
        status: "active",
        referralCode: "DSKADMIN",
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        salt: salt
      };
      this.users.push(adminUser);
    }

    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storageFilePath, JSON.stringify({
        adminSetupCompleted: true,
        adminId: adminUser.id,
        adminEmail: cleanedEmail,
        passwordHash: hash,
        salt: salt,
        completedAt: new Date().toISOString()
      }, null, 2), 'utf-8');
      console.log(`[Admin Security] Initial admin account securely created for: ${cleanedEmail} (hash and salt persisted, zero plaintext)`);
    } catch (err) {
      console.error('[Admin Security] Failed to persist initial admin config:', err);
    }

    // Permanently save admin setup to Supabase as primary cloud source of truth
    import('./supabase.js').then(({ saveAdminSetupStatusToSupabase }) => {
      saveAdminSetupStatusToSupabase({
        email: cleanedEmail,
        passwordHash: hash,
        salt: salt,
        adminId: adminUser.id,
        name: adminUser.name
      }).catch(sbErr => console.warn('[Supabase Sync] Note saving initial admin to Supabase:', sbErr));
    }).catch(() => {});

    const { passwordHash: _, salt: __, ...userProfile } = adminUser;
    return userProfile;
  }

  public completeAdminSetup(adminId: string, newEmail: string, newPassword: string): User | null {
    const adminIndex = this.users.findIndex(u => (u.id === adminId || u.role === 'admin'));
    if (adminIndex === -1) return null;

    const { hash, salt } = this.hashPassword(newPassword);
    const cleanedEmail = newEmail.trim().toLowerCase();

    const updatedUser = {
      ...this.users[adminIndex],
      email: cleanedEmail,
      passwordHash: hash,
      salt: salt
    };

    this.users[adminIndex] = updatedUser;
    this.adminSetupCompleted = true;

    // Persist to disk so restarts preserve the completion of setup and updated credentials
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storageFilePath, JSON.stringify({
        adminSetupCompleted: true,
        adminId: updatedUser.id,
        adminEmail: cleanedEmail,
        passwordHash: hash,
        salt: salt,
        completedAt: new Date().toISOString()
      }, null, 2), 'utf-8');
      console.log(`[Admin Security] Admin setup completed successfully. Default credentials permanently invalidated.`);
    } catch (err) {
      console.error('[Admin Security] Failed to persist admin config to disk:', err);
    }

    // Permanently sync updated admin credentials to Supabase
    import('./supabase.js').then(({ saveAdminSetupStatusToSupabase }) => {
      saveAdminSetupStatusToSupabase({
        email: cleanedEmail,
        passwordHash: hash,
        salt: salt,
        adminId: updatedUser.id,
        name: updatedUser.name
      }).catch(sbErr => console.warn('[Supabase Sync] Note saving completed admin setup to Supabase:', sbErr));
    }).catch(() => {});

    const { passwordHash: _, salt: __, ...userProfile } = updatedUser;
    return userProfile;
  }

  /**
   * Primary Supabase synchronization.
   * Loads permanent Admin Setup status and User accounts from Supabase cloud database.
   * Ensures that Render redeployments, browser restarts, and session expiries never wipe accounts or reset setup.
   */
  public async syncWithSupabase() {
    try {
      const { getAdminSetupStatusFromSupabase, saveAdminSetupStatusToSupabase, loadAllUsersFromSupabase } = await import('./supabase.js');

      const envAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'dsktaskmarketer@gmail.com').trim().toLowerCase();
      const envAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
      const envSetupCompleted = process.env.ADMIN_SETUP_COMPLETED === 'true';

      // 1. Sync Admin Setup status from Supabase
      const adminStatus = await getAdminSetupStatusFromSupabase();
      if (!adminStatus.isFirstTimeSetup) {
        // Setup is ALREADY completed in Supabase - NEVER overwrite existing password hash
        this.adminSetupCompleted = true;
        const targetEmail = (adminStatus.adminEmail || envAdminEmail).toLowerCase().trim();
        console.log(`[Supabase Sync] Administrator setup status verified in Supabase: COMPLETED (Admin: ${targetEmail})`);
        
        const adminIdx = this.users.findIndex(u => u.role === 'admin' || u.email.toLowerCase() === targetEmail);
        if (adminIdx >= 0) {
          this.users[adminIdx].email = targetEmail;
          this.users[adminIdx].role = 'admin';
          this.users[adminIdx].status = 'active';
          if (adminStatus.passwordHash && adminStatus.salt) {
            this.users[adminIdx].passwordHash = adminStatus.passwordHash;
            this.users[adminIdx].salt = adminStatus.salt;
          }
        } else {
          this.users.push({
            id: adminStatus.adminId || "admin_root_001",
            name: "DSK Platform Administrator",
            email: targetEmail,
            mobile: "+91 98000 00000",
            role: "admin",
            status: "active",
            referralCode: "DSKADMIN",
            createdAt: new Date().toISOString(),
            passwordHash: adminStatus.passwordHash,
            salt: adminStatus.salt
          });
        }
      } else {
        // First-Time Setup Only: If INITIAL_ADMIN_PASSWORD is provided in environment, initialize securely in Supabase
        if (envAdminPassword && envAdminPassword.trim()) {
          console.log(`[Supabase Sync] First-time setup detected: Initializing permanent admin account from environment (${envAdminEmail})...`);
          const { hash, salt } = this.hashPassword(envAdminPassword.trim());
          this.adminSetupCompleted = true;

          const adminIdx = this.users.findIndex(u => u.role === 'admin');
          if (adminIdx >= 0) {
            this.users[adminIdx].email = envAdminEmail;
            this.users[adminIdx].passwordHash = hash;
            this.users[adminIdx].salt = salt;
          } else {
            this.users.push({
              id: "admin_root_001",
              name: "DSK Platform Administrator",
              email: envAdminEmail,
              mobile: "+91 98000 00000",
              role: "admin",
              status: "active",
              referralCode: "DSKADMIN",
              createdAt: new Date().toISOString(),
              passwordHash: hash,
              salt: salt
            });
          }

          // Permanently save to Supabase
          await saveAdminSetupStatusToSupabase({
            email: envAdminEmail,
            passwordHash: hash,
            salt: salt,
            adminId: "admin_root_001",
            name: "DSK Platform Administrator"
          });
          console.log(`[Supabase Sync] Initial administrator setup permanently saved to Supabase for ${envAdminEmail}`);
        } else if (envSetupCompleted) {
          this.adminSetupCompleted = true;
        } else {
          this.adminSetupCompleted = false;
        }
      }

      // 2. Sync User accounts from Supabase
      const supabaseUsers = await loadAllUsersFromSupabase();
      if (Array.isArray(supabaseUsers) && supabaseUsers.length > 0) {
        let newUsersAdded = 0;
        for (const sbUser of supabaseUsers) {
          if (!sbUser || !sbUser.email) continue;
          const cleanEmail = sbUser.email.toLowerCase().trim();
          const existingIdx = this.users.findIndex(
            u => u.id === sbUser.id || u.email.toLowerCase() === cleanEmail
          );

          if (existingIdx !== -1) {
            // Update without losing fields
            const localUser = this.users[existingIdx];
            this.users[existingIdx] = {
              ...sbUser,
              ...localUser,
              name: localUser.name || sbUser.name,
              role: sbUser.role || localUser.role,
              status: sbUser.status || localUser.status || 'active',
              passwordHash: localUser.passwordHash || sbUser.passwordHash,
              salt: localUser.salt || sbUser.salt,
              payoutDetails: {
                ...sbUser.payoutDetails,
                ...localUser.payoutDetails
              }
            };
          } else {
            // Add user
            if (sbUser.role === 'user' && (!sbUser.referralCode || !String(sbUser.referralCode).trim())) {
              sbUser.referralCode = this.getNextSequentialEarnerReferralCode();
            }
            this.users.push(sbUser);
            newUsersAdded++;
          }
        }
        console.log(`[Supabase Sync] User accounts synchronized from Supabase: Total ${this.users.length} (${newUsersAdded} new from cloud).`);
        this.persistUsers();
      }
    } catch (err: any) {
      console.warn('[Supabase Sync] Notice during cloud synchronization:', err?.message || err);
    }
  }

  public getNextSequentialEarnerUserId(): string {
    let maxSeq = 0;

    // Scan all users in memory
    for (const u of this.users) {
      if (!u || !u.id) continue;
      const match = String(u.id).trim().match(/^DSK(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    // Check persistent counter in settings if available
    if (this.settings && typeof (this.settings as any).lastEarnerSeqNumber === 'number') {
      if ((this.settings as any).lastEarnerSeqNumber > maxSeq) {
        maxSeq = (this.settings as any).lastEarnerSeqNumber;
      }
    }

    let nextSeq = maxSeq + 1;
    let candidateId = `DSK${String(nextSeq).padStart(2, '0')}`;

    // Ensure candidateId is completely unique in memory
    while (this.users.some(u => u && u.id && String(u.id).trim().toUpperCase() === candidateId.toUpperCase())) {
      nextSeq++;
      candidateId = `DSK${String(nextSeq).padStart(2, '0')}`;
    }

    (this.settings as any).lastEarnerSeqNumber = nextSeq;
    this.persistSettings();

    return candidateId;
  }

  public getNextSequentialEarnerReferralCode(): string {
    let maxSeq = 0;

    // Scan all users in memory for referral codes matching DSKREF<number>
    for (const u of this.users) {
      if (!u || !u.referralCode) continue;
      const match = String(u.referralCode).trim().match(/^DSKREF(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    // Check persistent counter in settings if available
    if (this.settings && typeof (this.settings as any).lastEarnerReferralSeqNumber === 'number') {
      if ((this.settings as any).lastEarnerReferralSeqNumber > maxSeq) {
        maxSeq = (this.settings as any).lastEarnerReferralSeqNumber;
      }
    }

    let nextSeq = maxSeq + 1;
    let candidateCode = `DSKREF${String(nextSeq).padStart(2, '0')}`;

    // Ensure candidateCode is completely unique in memory
    while (this.users.some(u => u && u.referralCode && String(u.referralCode).trim().toUpperCase() === candidateCode.toUpperCase())) {
      nextSeq++;
      candidateCode = `DSKREF${String(nextSeq).padStart(2, '0')}`;
    }

    (this.settings as any).lastEarnerReferralSeqNumber = nextSeq;
    this.persistSettings();

    return candidateCode;
  }

  public resetAdminPassword(email: string, newPassword: string): boolean {
    const cleanedEmail = email.trim().toLowerCase();
    const adminIndex = this.users.findIndex(u => u.role === 'admin' && u.email.toLowerCase() === cleanedEmail);
    if (adminIndex === -1) return false;

    const { hash, salt } = this.hashPassword(newPassword);
    this.users[adminIndex].passwordHash = hash;
    this.users[adminIndex].salt = salt;
    this.adminSetupCompleted = true;

    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storageFilePath, JSON.stringify({
        adminSetupCompleted: true,
        adminId: this.users[adminIndex].id,
        adminEmail: cleanedEmail,
        passwordHash: hash,
        salt: salt,
        completedAt: new Date().toISOString()
      }, null, 2), 'utf-8');
      console.log(`[Admin Security] Admin password updated successfully for: ${cleanedEmail}`);
    } catch (err) {
      console.error('[Admin Security] Failed to save updated admin password to disk:', err);
    }

    return true;
  }

  public resetUserPassword(email: string, newPassword: string): boolean {
    const cleanedEmail = email.trim().toLowerCase();
    const userIndex = this.users.findIndex(u => u.email.toLowerCase() === cleanedEmail);
    if (userIndex === -1) return false;

    const { hash, salt } = this.hashPassword(newPassword);
    this.users[userIndex].passwordHash = hash;
    this.users[userIndex].salt = salt;

    if (this.users[userIndex].role === 'admin') {
      this.adminSetupCompleted = true;
      try {
        const dir = path.dirname(this.storageFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.storageFilePath, JSON.stringify({
          adminSetupCompleted: true,
          adminId: this.users[userIndex].id,
          adminEmail: cleanedEmail,
          passwordHash: hash,
          salt: salt,
          completedAt: new Date().toISOString()
        }, null, 2), 'utf-8');
      } catch (err) {
        console.error('[Admin Security] Failed to save updated admin password to disk:', err);
      }
    }

    return true;
  }

  // Password Hashing Helper
  public hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
  }

  public verifyPassword(password: string, hash?: string, salt?: string): boolean {
    if (!password || !hash || !salt) {
      return false;
    }
    try {
      const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
      if (crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'))) {
        return true;
      }
    } catch (err) {
      console.warn('[Password Verification] Hash comparison error:', err);
    }
    return false;
  }

  // Calculate real wallet summary based purely on valid ledger entries and auto-reconcile approved submissions
  public getWalletSummary(userId: string): WalletSummary {
    let taskEarnings = 0;
    let referralRewards = 0;
    let adminRewards = 0;
    let withdrawalRefunds = 0;
    let totalWithdrawalDeductions = 0;
    let pendingRewards = 0;

    const user = this.users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    const targetUserIds = new Set<string>([userId]);
    if (user) {
      targetUserIds.add(user.id);
      if (user.email) {
        targetUserIds.add(user.email.toLowerCase());
      }
    }

    // Auto-reconcile all approved submissions for this user so wallet balance is NEVER missed
    const userApprovedSubs = this.submissions.filter(s => {
      const matchesId = targetUserIds.has(s.userId);
      const matchesEmail = Boolean(user?.email && s.userEmail && s.userEmail.toLowerCase() === user.email.toLowerCase());
      return (matchesId || matchesEmail) && s.status === 'approved';
    });

    let rewardsChanged = false;
    for (const sub of userApprovedSubs) {
      const rewardItem = this.rewards.find(r => r.submissionId === sub.id);
      if (rewardItem) {
        if (rewardItem.status !== 'credited') {
          rewardItem.status = 'credited';
          rewardItem.amount = sub.rewardAmount;
          rewardsChanged = true;
        }
      } else {
        this.rewards.push({
          id: `rwd_${sub.id}`,
          userId: sub.userId || user?.id || userId,
          submissionId: sub.id,
          type: 'task_reward',
          amount: sub.rewardAmount,
          status: 'credited',
          referenceId: sub.referenceId || `DSK-RWD-${Math.floor(1000 + Math.random() * 9000)}`,
          description: `Task Reward Approved: ${sub.taskTitle}`,
          createdAt: sub.reviewedAt || sub.submittedAt || new Date().toISOString()
        });
        rewardsChanged = true;
      }
    }

    if (rewardsChanged) {
      this.persistRewards();
    }

    const userRewards = this.rewards.filter(r => {
      const matchesId = targetUserIds.has(r.userId);
      const matchesEmail = Boolean(user?.email && r.userId && r.userId.toLowerCase() === user.email.toLowerCase());
      return matchesId || matchesEmail;
    });

    for (const r of userRewards) {
      if (r.status === 'credited' || (r.status === 'approved' && r.type !== 'withdrawal')) {
        if (r.type === 'task_reward') {
          taskEarnings += r.amount;
        } else if (r.type === 'referral_reward') {
          referralRewards += r.amount;
        } else if (r.type === 'admin_reward' || r.type === 'manual_reward') {
          adminRewards += r.amount;
        } else if (r.type === 'withdrawal_refund') {
          withdrawalRefunds += r.amount;
        } else if (r.type === 'bonus') {
          if (r.description?.toLowerCase().includes('refund')) {
            withdrawalRefunds += r.amount;
          } else {
            adminRewards += r.amount;
          }
        }
      } else if (r.status === 'pending') {
        pendingRewards += r.amount;
      } else if (r.type === 'withdrawal') {
        // If a withdrawal was rejected or cancelled, and no withdrawal_refund credit was recorded,
        // it shouldn't deduct from balance. If a withdrawal_refund exists, keeping the deduction ensures
        // net balance = credits + refunds - deductions without double-counting.
        const hasExplicitRefund = userRewards.some(
          ref => ref.withdrawalId === r.withdrawalId || (ref.type === 'withdrawal_refund' && ref.description?.includes(r.id))
        );
        if ((r.status as string) !== 'rejected' && (r.status as string) !== 'cancelled' && r.status !== 'reversed') {
          totalWithdrawalDeductions += Math.abs(r.amount);
        } else if (hasExplicitRefund) {
          totalWithdrawalDeductions += Math.abs(r.amount);
        }
      }
    }

    // Formula per requirement 5: Total Earnings = Task Earnings + Referral Earnings
    const totalEarnings = taskEarnings + referralRewards;

    // Formula per requirement 7:
    // Available Wallet Balance = Task reward credits + Referral reward credits + Admin manual rewards + Withdrawal refunds - Successful withdrawal deductions
    const availableBalance = Math.max(0, (taskEarnings + referralRewards + adminRewards + withdrawalRefunds) - totalWithdrawalDeductions);

    const userSubmissions = this.submissions.filter(s => {
      const matchesId = targetUserIds.has(s.userId);
      const matchesEmail = Boolean(user?.email && s.userEmail && s.userEmail.toLowerCase() === user.email.toLowerCase());
      return matchesId || matchesEmail;
    });

    const completedTasks = userSubmissions.filter(s => s.status === 'approved').length;

    const userWithdrawals = this.withdrawals.filter(w => {
      const matchesId = targetUserIds.has(w.userId);
      const matchesEmail = Boolean(user?.email && w.userEmail && w.userEmail.toLowerCase() === user.email.toLowerCase());
      return matchesId || matchesEmail;
    });

    const totalWithdrawn = userWithdrawals
      .filter(w => w.status === 'paid' || (w.status as any) === 'completed' || (w.status as any) === 'processed')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    return {
      totalEarnings: Math.max(0, totalEarnings),
      availableBalance: Math.max(0, availableBalance),
      pendingRewards,
      referralRewards,
      taskEarnings,
      adminRewards,
      manualRewards: adminRewards,
      withdrawalRefunds,
      completedTasks,
      totalEarned: Math.max(0, totalEarnings),
      pendingBalance: pendingRewards,
      totalWithdrawn,
      minimumWithdrawalLimit: this.settings?.minimumWithdrawalAmount || 200
    };
  }

  public persistTasks() {
    // When Supabase is configured, tasks are stored in Supabase.
    // Keep .data/tasks.json untouched on disk as requested.
    const isSupabaseConfigured = Boolean(
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL
    );
    if (isSupabaseConfigured) {
      return;
    }

    try {
      const dataDir = path.dirname(this.tasksStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.tasksStoragePath, JSON.stringify(this.tasks, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB Persistence] Error writing tasks.json:', err);
    }
  }

  private initTasks() {
    // When Supabase is configured, tasks are loaded from Supabase database instead of .data/tasks.json.
    const isSupabaseConfigured = Boolean(
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL
    );

    if (isSupabaseConfigured) {
      console.log('[DB Persistence] Supabase mode active: Bypassing local .data/tasks.json.');
      this.tasks = [];
      return;
    }

    try {
      if (fs.existsSync(this.tasksStoragePath)) {
        const raw = fs.readFileSync(this.tasksStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded) && loaded.length > 0) {
          const isJunkTask = (t: any) => {
            if (!t) return true;
            const title = (t.title || '').toLowerCase().trim();
            const desc = (t.description || '').toLowerCase().trim();
            const partner = (t.partnerName || '').toLowerCase().trim();
            const combined = `${title} ${desc} ${partner}`;

            const junkPhrases = [
              'the partner/admin should describe',
              'the partner should describe',
              'the admin should describe',
              'ai must understand',
              'instructions for the ai',
              'do not support multiple tasks',
              'do not create separate drafts',
              'natural language description',
              'system instruction',
              'system prompt',
              'you are the ai task structurer',
              'validation rules',
              'ai rules',
              'complete verified merchant purchase/action'
            ];

            for (const phrase of junkPhrases) {
              if (combined.includes(phrase)) return true;
            }

            const exactJunkTitles = [
              'task title',
              'task description',
              'reward',
              'eligibility',
              'instructions',
              'proof',
              'ai rules',
              'validation rules',
              'affiliate task 1',
              'custom merchant task 1'
            ];

            if (exactJunkTitles.includes(title)) return true;
            return false;
          };

          const validTasks = loaded.filter(t => !isJunkTask(t));
          this.tasks = validTasks.map(t => ({
            ...t,
            active: t.isActive !== undefined ? Boolean(t.isActive) : (t.active !== undefined ? Boolean(t.active) : true),
            isActive: t.isActive !== undefined ? Boolean(t.isActive) : (t.active !== undefined ? Boolean(t.active) : true),
          }));
          if (validTasks.length !== loaded.length) {
            this.persistTasks();
            console.log(`[DB Persistence] Cleaned up ${loaded.length - validTasks.length} legacy invalid instruction tasks.`);
          }
          console.log(`[DB Persistence] Restored ${this.tasks.length} local dev tasks from disk`);
          return;
        }
      }
    } catch (err) {
      console.warn('[DB Persistence] Local dev fallback note:', err);
    }

    this.tasks = [];
  }

  // ==================== Permanent User Persistence ====================
  public persistUsers() {
    try {
      const dataDir = path.dirname(this.usersStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.usersStoragePath, JSON.stringify(this.users, null, 2), 'utf-8');
      console.log(`[Permanent Auth] Persisted ${this.users.length} user accounts to disk.`);
    } catch (err) {
      console.error('[Permanent Auth] Error persisting users to disk:', err);
    }
  }

  private initUsers() {
    try {
      if (fs.existsSync(this.usersStoragePath)) {
        const raw = fs.readFileSync(this.usersStoragePath, 'utf-8');
        const loadedUsers = JSON.parse(raw);
        if (Array.isArray(loadedUsers) && loadedUsers.length > 0) {
          // Merge loaded users while preserving existing admin accounts
          loadedUsers.forEach((loadedUser: any) => {
            const existingIdx = this.users.findIndex(u => u.id === loadedUser.id || u.email.toLowerCase() === loadedUser.email?.toLowerCase());
            if (existingIdx !== -1) {
              this.users[existingIdx] = { ...loadedUser, ...this.users[existingIdx] };
            } else {
              this.users.push(loadedUser);
            }
          });
          console.log(`[Permanent Auth] Successfully restored ${loadedUsers.length} user accounts from disk.`);
        }
      }
    } catch (err) {
      console.warn('[Permanent Auth] Error loading persisted users from disk:', err);
    }

    // Ensure that ONLY dsktaskmarketer@gmail.com is kept as admin
    const PRIMARY_ADMIN = 'dsktaskmarketer@gmail.com';
    this.users = this.users.filter(u => {
      if (u.role === 'admin' && u.email.toLowerCase() !== PRIMARY_ADMIN) {
        return false;
      }
      return true;
    });

    // Existing users keep their referral codes; only assign sequential DSKF code if they currently have no referral code
    let refChanges = false;
    this.users.forEach(u => {
      if (u.role === 'user' && (!u.referralCode || !String(u.referralCode).trim())) {
        u.referralCode = this.getNextSequentialEarnerReferralCode();
        refChanges = true;
      }
    });
    if (refChanges) {
      this.persistUsers();
    }
  }

  public cleanUpAdminAccounts(): { deletedCount: number; remainingAdmins: User[] } {
    const PRIMARY_ADMIN = 'dsktaskmarketer@gmail.com';
    let primary = this.users.find(u => u.email.toLowerCase() === PRIMARY_ADMIN);
    if (!primary) {
      const { hash, salt } = this.hashPassword(process.env.ADMIN_PASSWORD || 'Admin12345');
      primary = {
        id: "admin_root_001",
        name: "DSK Platform Administrator",
        email: PRIMARY_ADMIN,
        mobile: "+91 98000 00000",
        role: "admin",
        status: "active",
        referralCode: "DSKADMIN",
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        salt: salt
      };
      this.users.push(primary);
    } else {
      primary.role = 'admin';
      primary.status = 'active';
    }

    const initialLength = this.users.length;
    // Keep all normal users, permanently remove any other admin accounts
    this.users = this.users.filter(u => {
      if (u.role === 'admin' && u.email.toLowerCase() !== PRIMARY_ADMIN) {
        return false;
      }
      return true;
    });
    const deletedCount = initialLength - this.users.length;

    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const cfg = JSON.parse(raw);
        cfg.adminEmail = PRIMARY_ADMIN;
        cfg.adminId = primary.id;
        fs.writeFileSync(this.storageFilePath, JSON.stringify(cfg, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('[Admin Cleanup] Note updating storage file:', e);
    }

    this.persistUsers();

    return {
      deletedCount,
      remainingAdmins: this.users.filter(u => u.role === 'admin')
    };
  }

  // ==================== Platform Settings Persistence ====================
  public persistSettings() {
    try {
      const dataDir = path.dirname(this.settingsStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.settingsStoragePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Settings] Error writing settings.json:', err);
    }
  }

  private initSettings() {
    try {
      if (fs.existsSync(this.settingsStoragePath)) {
        const raw = fs.readFileSync(this.settingsStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (loaded && typeof loaded === 'object') {
          this.settings = {
            ...this.settings,
            ...loaded
          };
          console.log(`[Settings] Restored custom platform settings from disk.`);
        }
      }
    } catch (err) {
      console.warn('[Settings] Note loading settings from disk:', err);
    }
  }

  // ==================== Campaigns Persistence ====================
  public persistCampaigns() {
    try {
      const dataDir = path.dirname(this.campaignsStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.campaignsStoragePath, JSON.stringify(this.campaigns, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Campaigns] Error writing campaigns.json:', err);
    }
  }

  private initCampaigns() {
    try {
      if (fs.existsSync(this.campaignsStoragePath)) {
        const raw = fs.readFileSync(this.campaignsStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded)) {
          this.campaigns = loaded;
          console.log(`[Campaigns] Restored ${this.campaigns.length} campaigns from disk.`);
        }
      }
    } catch (err) {
      console.warn('[Campaigns] Note loading campaigns from disk:', err);
    }
  }

  // ==================== Submissions Persistence & Initialization ====================
  public persistSubmissions() {
    try {
      const dataDir = path.dirname(this.submissionsStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.submissionsStoragePath, JSON.stringify(this.submissions, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Persistence] Error writing submissions.json:', err);
    }
  }

  private initSubmissions() {
    try {
      if (fs.existsSync(this.submissionsStoragePath)) {
        const raw = fs.readFileSync(this.submissionsStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded) && loaded.length > 0) {
          this.submissions = loaded;
          console.log(`[Persistence] Restored ${this.submissions.length} submissions from disk.`);
          return;
        }
      }
    } catch (err) {
      console.warn('[Persistence] Error reading submissions.json:', err);
    }

    // Default sample submissions for Audit Desk testing if none exist
    const sampleSubmissions: Submission[] = [
      {
        id: "sub_demo_001",
        taskId: "tsk_cards_01",
        taskTitle: "HDFC Bank Millennia Credit Card - Premium Cashback",
        userId: "usr_member_101",
        userName: "Rahul Sharma",
        userEmail: "rahul.sharma@example.com",
        referenceId: "DSK-HDFC-9842",
        completedDate: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
        proofApplicationId: "HDFC884920194",
        screenshotUrl: "",
        userNote: "Application submitted and biometric verification completed yesterday.",
        status: "pending_review",
        rewardAmount: 500,
        submittedAt: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        id: "sub_demo_002",
        taskId: "tsk_bank_01",
        taskTitle: "Kotak 811 Zero Balance Digital Savings Account",
        userId: "usr_member_102",
        userName: "Priya Patel",
        userEmail: "priya.patel@example.com",
        referenceId: "DSK-KTK-4721",
        completedDate: new Date(Date.now() - 3600000 * 12).toISOString().split('T')[0],
        proofApplicationId: "KTK811-928174",
        screenshotUrl: "",
        userNote: "Account opened with Video KYC. Received welcome CRN confirmation.",
        status: "under_verification",
        adminNote: "Reconciling with partner daily feed report.",
        rewardAmount: 180,
        submittedAt: new Date(Date.now() - 3600000 * 10).toISOString()
      }
    ];
    this.submissions = sampleSubmissions;
    this.persistSubmissions();
  }

  // ==================== Rewards Persistence & Initialization ====================
  public persistRewards() {
    try {
      const dataDir = path.dirname(this.rewardsStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.rewardsStoragePath, JSON.stringify(this.rewards, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Persistence] Error writing rewards.json:', err);
    }
  }

  private initRewards() {
    try {
      if (fs.existsSync(this.rewardsStoragePath)) {
        const raw = fs.readFileSync(this.rewardsStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded) && loaded.length > 0) {
          this.rewards = loaded;
          return;
        }
      }
    } catch (err) {
      console.warn('[Persistence] Error reading rewards.json:', err);
    }

    // Seed matching reward items for sample submissions
    this.rewards = this.submissions.map(sub => ({
      id: `rwd_${sub.id}`,
      userId: sub.userId,
      submissionId: sub.id,
      type: 'task_reward' as const,
      amount: sub.rewardAmount,
      status: (sub.status === 'approved' ? 'credited' : 'pending') as any,
      referenceId: sub.referenceId,
      description: `Task Reward: ${sub.taskTitle}`,
      createdAt: sub.submittedAt
    }));
    this.persistRewards();
  }

  // ==================== Withdrawals Persistence & Initialization ====================
  public persistWithdrawals() {
    try {
      const dataDir = path.dirname(this.withdrawalsStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.withdrawalsStoragePath, JSON.stringify(this.withdrawals, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Persistence] Error writing withdrawals.json:', err);
    }
  }

  private initWithdrawals() {
    try {
      if (fs.existsSync(this.withdrawalsStoragePath)) {
        const raw = fs.readFileSync(this.withdrawalsStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded)) {
          this.withdrawals = loaded;
          return;
        }
      }
    } catch (err) {
      console.warn('[Persistence] Error reading withdrawals.json:', err);
    }
    this.withdrawals = [];
  }

  // ==================== Campaign Enquiries (Advertise With Us) ====================
  public persistCampaignEnquiries() {
    try {
      const dataDir = path.dirname(this.enquiriesStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.enquiriesStoragePath, JSON.stringify(this.campaignEnquiries, null, 2), 'utf-8');
      console.log(`[Enquiries] Persisted ${this.campaignEnquiries.length} campaign enquiries to disk.`);
    } catch (err) {
      console.error('[Enquiries] Error writing campaign_enquiries.json:', err);
    }
  }

  private initCampaignEnquiries() {
    try {
      if (fs.existsSync(this.enquiriesStoragePath)) {
        const raw = fs.readFileSync(this.enquiriesStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded)) {
          this.campaignEnquiries = loaded;
          console.log(`[Enquiries] Restored ${this.campaignEnquiries.length} campaign enquiries from disk.`);
        }
      }
    } catch (err) {
      console.warn('[Enquiries] Note loading campaign enquiries from disk:', err);
    }

    // Restore and merge permanent cloud enquiries from Supabase
    loadEnquiriesFromSupabase().then(cloudEnquiries => {
      if (cloudEnquiries && cloudEnquiries.length > 0) {
        let addedCount = 0;
        for (const cloudEnq of cloudEnquiries) {
          const existingIdx = this.campaignEnquiries.findIndex(e => e.id === cloudEnq.id);
          if (existingIdx === -1) {
            this.campaignEnquiries.push(cloudEnq);
            addedCount++;
          } else {
            // Keep the one with latest updatedAt
            const existing = this.campaignEnquiries[existingIdx];
            if (new Date(cloudEnq.updatedAt || cloudEnq.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
              this.campaignEnquiries[existingIdx] = cloudEnq;
            }
          }
        }
        if (addedCount > 0) {
          this.persistCampaignEnquiries();
          console.log(`[Enquiries] Synced ${addedCount} new campaign enquiries from Supabase.`);
        }
      }
    }).catch(err => {
      console.warn('[Enquiries] Note syncing enquiries from Supabase:', err?.message || err);
    });
  }

  public addCampaignEnquiry(data: Partial<CampaignEnquiry>): CampaignEnquiry {
    const id = `enq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const partnerType: PartnerType = (data.partnerType as PartnerType) || 
      (data.enquiryType === 'partner' ? 'affiliate_partner' : 'company');
    const businessName = String(data.company_brand_name || data.businessName || data.companyName || data.campaignName || '').trim();
    const contactPerson = String(data.contact_person_name || data.contactPerson || data.advertiserName || '').trim();
    const officialEmail = String(data.contact_email || data.officialEmail || data.contactEmail || '').trim().toLowerCase();
    const phoneNumber = String(data.contact_phone || data.phoneNumber || data.contactMobile || '').trim();
    const whatsappNumber = String(data.contact_whatsapp || data.whatsappNumber || '').trim();
    const websiteOrSocial = String(data.website_or_social || data.website || data.socialMediaProfiles || '').trim();
    const trackingUrl = String(data.trackingUrl || data.affiliateUrl || '').trim();
    const trackingUrlArrangedByAdmin = trackingUrl.length === 0 ? true : (data.trackingUrlArrangedByAdmin !== undefined ? data.trackingUrlArrangedByAdmin : false);

    const newEnquiry: CampaignEnquiry = {
      id,
      partnerType,
      enquiryType: partnerType,
      userId: data.userId,

      // Business & Requirement Information
      businessName,
      contactPerson,
      productService: String(data.productService || data.category || 'Promotion / Acquisition').trim(),
      desiredResult: String(data.desiredResult || data.objective || 'User Acquisition & Brand Awareness').trim(),
      promotionRequirement: String(data.promotionRequirement || data.instructions || '').trim(),
      category: String(data.category || 'General').trim(),
      targetAudience: String(data.targetAudience || 'Target Audience in India').trim(),
      targetLocation: String(data.targetLocation || 'Tamil Nadu & Pan-India').trim(),
      expectedVolume: String(data.expectedVolume || data.targetCompletions || '100+ actions').trim(),
      budget: data.budget || data.totalBudget || 'Flexible',
      duration: String(data.duration || data.campaignDuration || data.timelines || '30 Days').trim(),
      specificConditions: String(data.specificConditions || data.notes || '').trim(),

      // Tracking link (OPTIONAL!)
      trackingUrl,
      trackingUrlArrangedByAdmin,

      // Platform specific fields
      creatorPlatforms: Array.isArray(data.creatorPlatforms) ? data.creatorPlatforms : [],
      socialMediaProfiles: String(data.socialMediaProfiles || '').trim(),
      website: websiteOrSocial || String(data.website || '').trim(),
      businessLocation: String(data.businessLocation || '').trim(),

      // Mandatory Contact Information (Kept strictly separate)
      officialEmail,
      phoneNumber,
      whatsappNumber,

      // Exact database contact fields
      contact_person_name: contactPerson,
      company_brand_name: businessName,
      contact_email: officialEmail,
      contact_phone: phoneNumber,
      contact_whatsapp: whatsappNumber,
      website_or_social: websiteOrSocial,

      // AI Summary & Admin Tracking
      aiSummary: String(data.aiSummary || `Partnership enquiry from ${businessName}.`).trim(),
      missingInformation: Array.isArray(data.missingInformation) ? data.missingInformation : [],
      status: 'new',
      adminNotes: String(data.adminNotes || '').trim(),
      followUpHistory: [
        {
          id: `flw_${Date.now()}`,
          timestamp: now,
          type: 'status_change',
          note: 'Enquiry submitted via AI Assistant with status "New"'
        }
      ],
      createdAt: now,
      updatedAt: now,

      // Compatibility aliases
      campaignName: businessName,
      companyName: businessName,
      objective: String(data.desiredResult || data.objective || 'User Acquisition & Brand Awareness').trim(),
      rewardAmount: Number(data.rewardAmount || data.rewardPerAction) || 50,
      totalBudget: data.budget || data.totalBudget || 'Flexible',
      targetCompletions: Number(data.targetCompletions) || 100,
      campaignDuration: String(data.duration || data.campaignDuration || data.timelines || '30 Days').trim(),
      eligibility: String(data.targetAudience || 'Age 18+, Resident of India').trim(),
      instructions: data.instructions || [
        'Review campaign requirements and terms',
        'Access partner landing page or store',
        'Complete target action or verification',
        'Submit genuine proof or reference ID'
      ],
      requiredProof: Array.isArray(data.requiredProof) && data.requiredProof.length > 0 
        ? data.requiredProof 
        : ['Action confirmation screenshot / Reference ID'],
      notes: String(data.specificConditions || data.notes || '').trim(),
      advertiserName: contactPerson,
      contactEmail: officialEmail,
      contactMobile: phoneNumber,
      rewardPerAction: Number(data.rewardAmount || data.rewardPerAction) || 50,
      timelines: String(data.duration || data.campaignDuration || data.timelines || '30 Days').trim(),
      affiliateUrl: trackingUrl
    };

    this.campaignEnquiries.unshift(newEnquiry);
    this.persistCampaignEnquiries();

    // Persist permanently to Supabase
    saveEnquiryToSupabase(newEnquiry).catch(sbErr => {
      console.warn('[Enquiries] Note persisting to Supabase:', sbErr?.message || sbErr);
    });

    return newEnquiry;
  }

  public getCampaignEnquiries(status?: string, type?: string): CampaignEnquiry[] {
    let list = this.campaignEnquiries;
    if (type && type !== 'all') {
      list = list.filter(e => e.partnerType === type || e.enquiryType === type);
    }
    if (!status || status === 'all') {
      return list;
    }
    return list.filter(e => {
      if (status === 'new') {
        return e.status === 'new' || (e.status as any) === 'new_enquiry';
      }
      if (status === 'contacted') {
        return e.status === 'contacted';
      }
      if (status === 'under_review') {
        return e.status === 'under_review' || (e.status as any) === 'reviewing';
      }
      if (status === 'follow_up_required') {
        return e.status === 'follow_up_required';
      }
      if (status === 'approved') {
        return e.status === 'approved';
      }
      if (status === 'rejected') {
        return e.status === 'rejected';
      }
      if (status === 'converted') {
        return e.status === 'converted' || Boolean(e.convertedTaskId || e.convertedCampaignId);
      }
      if (status === 'archived') {
        return e.status === 'archived';
      }
      return e.status === status;
    });
  }

  public updateCampaignEnquiry(id: string, patch: Partial<CampaignEnquiry>): CampaignEnquiry | null {
    const idx = this.campaignEnquiries.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const existing = this.campaignEnquiries[idx];
    const now = new Date().toISOString();

    let updatedFollowUp = existing.followUpHistory || [];
    if (patch.followUpHistory && Array.isArray(patch.followUpHistory)) {
      updatedFollowUp = patch.followUpHistory;
    } else if (patch.status && patch.status !== existing.status) {
      updatedFollowUp = [
        {
          id: `flw_${Date.now()}`,
          timestamp: now,
          type: 'status_change',
          note: `Status changed from ${existing.status} to ${patch.status}`
        },
        ...updatedFollowUp
      ];
    }

    const updated: CampaignEnquiry = {
      ...existing,
      ...patch,
      followUpHistory: updatedFollowUp,
      updatedAt: now
    };

    this.campaignEnquiries[idx] = updated;
    this.persistCampaignEnquiries();

    // Sync update to Supabase
    saveEnquiryToSupabase(updated).catch(sbErr => {
      console.warn('[Enquiries] Note updating Supabase:', sbErr?.message || sbErr);
    });

    return updated;
  }

  public convertEnquiryToTask(id: string, taskOverride?: Partial<Task>): { enquiry: CampaignEnquiry; task: Task } | null {
    const idx = this.campaignEnquiries.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const enquiry = this.campaignEnquiries[idx];
    const taskId = `tsk_enq_${enquiry.id}_${Date.now()}`;
    const now = new Date().toISOString();

    const createdTask: Task = {
      id: taskId,
      title: taskOverride?.title || enquiry.campaignName || `${enquiry.companyName} Campaign Task`,
      categoryId: taskOverride?.categoryId || 'cat_other',
      partnerName: enquiry.companyName,
      description: taskOverride?.description || enquiry.objective || 'Complete verified advertiser action.',
      rewardAmount: Number(taskOverride?.rewardAmount || enquiry.rewardAmount || enquiry.rewardPerAction) || 50,
      currency: 'INR',
      affiliateUrl: taskOverride?.affiliateUrl || enquiry.trackingUrl || enquiry.affiliateUrl || 'https://dsktaskmarketer.com',
      eligibility: taskOverride?.eligibility || enquiry.eligibility || enquiry.targetAudience || 'Age 18+, Indian resident',
      steps: taskOverride?.steps || (Array.isArray(enquiry.instructions) ? enquiry.instructions : [
        'Review campaign requirements',
        'Open partner portal via Start Task',
        'Complete target action',
        'Submit legitimate verification proof'
      ]),
      proofRequirements: taskOverride?.proofRequirements || enquiry.requiredProof || ['Confirmation screenshot / Order ID'],
      terms: taskOverride?.terms || 'Rewards credited upon successful partner audit and reconciliation.',
      affiliateDisclosure: 'DSK TaskMarketer partner performance reward.',
      active: true,
      isActive: true,
      displayOrder: this.tasks.length + 1,
      startsCount: 0,
      completionsCount: 0,
      createdAt: now
    };

    this.tasks.push(createdTask);
    this.persistTasks();

    // Mark enquiry as converted with link to converted task
    enquiry.status = 'converted';
    enquiry.convertedTaskId = taskId;
    enquiry.updatedAt = now;
    if (!enquiry.followUpHistory) enquiry.followUpHistory = [];
    enquiry.followUpHistory.unshift({
      id: `flw_${Date.now()}`,
      timestamp: now,
      type: 'status_change',
      note: `Converted to live campaign task: "${createdTask.title}" (ID: ${taskId})`
    });
    this.persistCampaignEnquiries();

    // Sync converted status to Supabase
    saveEnquiryToSupabase(enquiry).catch(sbErr => {
      console.warn('[Enquiries] Note updating Supabase after conversion:', sbErr?.message || sbErr);
    });

    return { enquiry, task: createdTask };
  }

  // ========================================================
  // 3-PLAN MONTHLY INCENTIVE SYSTEM IMPLEMENTATION
  // ========================================================

  public getDefaultIncentivePlans(): IncentivePlanConfig[] {
    return [
      {
        id: 'plan_referral_target',
        planType: 'referral_target',
        title: 'Monthly Referral Target Incentive',
        subtitle: 'Bring genuine qualifying referrals this month',
        icon: 'Users',
        shortDescription: 'Reward users for bringing genuine qualifying users through their referral link who complete their first verified task.',
        enabled: true,
        qualifyingCondition: 'Referred user must complete at least 1 verified/approved task during the calendar month.',
        startDate: '',
        endDate: '',
        autoCreditOnUnlock: true,
        milestones: [
          { id: 'ms_ref_1', planType: 'referral_target', target: 3, bonusAmount: 25, title: 'Tier 1 Referral Bonus', description: '3 qualifying referrals', displayOrder: 1 },
          { id: 'ms_ref_2', planType: 'referral_target', target: 5, bonusAmount: 50, title: 'Tier 2 Referral Bonus', description: '5 qualifying referrals', displayOrder: 2 },
          { id: 'ms_ref_3', planType: 'referral_target', target: 10, bonusAmount: 150, title: 'Tier 3 Referral Bonus', description: '10 qualifying referrals', displayOrder: 3 },
          { id: 'ms_ref_4', planType: 'referral_target', target: 20, bonusAmount: 350, title: 'Tier 4 Referral Bonus', description: '20 qualifying referrals', displayOrder: 4 },
          { id: 'ms_ref_5', planType: 'referral_target', target: 30, bonusAmount: 600, title: 'Tier 5 Referral Bonus', description: '30 qualifying referrals', displayOrder: 5 },
        ]
      },
      {
        id: 'plan_task_completion',
        planType: 'task_completion',
        title: 'Monthly Task Completion Incentive',
        subtitle: 'Complete verified & approved tasks this month',
        icon: 'CheckSquare',
        shortDescription: 'Reward users for completing verified/eligible tasks during the month. Rejected or pending tasks do not count.',
        enabled: true,
        qualifyingCondition: 'Only Admin-defined eligible/approved verified tasks count. Rejected, cancelled or invalid tasks must NOT count.',
        startDate: '',
        endDate: '',
        autoCreditOnUnlock: true,
        milestones: [
          { id: 'ms_task_1', planType: 'task_completion', target: 5, bonusAmount: 25, title: 'Tier 1 Task Bonus', description: '5 verified tasks completed', displayOrder: 1 },
          { id: 'ms_task_2', planType: 'task_completion', target: 10, bonusAmount: 75, title: 'Tier 2 Task Bonus', description: '10 verified tasks completed', displayOrder: 2 },
          { id: 'ms_task_3', planType: 'task_completion', target: 20, bonusAmount: 200, title: 'Tier 3 Task Bonus', description: '20 verified tasks completed', displayOrder: 3 },
          { id: 'ms_task_4', planType: 'task_completion', target: 30, bonusAmount: 400, title: 'Tier 4 Task Bonus', description: '30 verified tasks completed', displayOrder: 4 },
          { id: 'ms_task_5', planType: 'task_completion', target: 50, bonusAmount: 750, title: 'Tier 5 Task Bonus', description: '50 verified tasks completed', displayOrder: 5 },
        ]
      },
      {
        id: 'plan_earning_milestone',
        planType: 'earning_milestone',
        title: 'Monthly Earning Milestone Incentive',
        subtitle: 'Reach milestone earnings from verified tasks',
        icon: 'TrendingUp',
        shortDescription: 'Reward users based on their eligible verified task earnings accumulated during the month.',
        enabled: true,
        qualifyingCondition: 'Tracks eligible verified task earnings (sum of approved task reward amounts), excluding non-task bonuses.',
        startDate: '',
        endDate: '',
        autoCreditOnUnlock: true,
        milestones: [
          { id: 'ms_earn_1', planType: 'earning_milestone', target: 500, bonusAmount: 25, title: 'Tier 1 Earnings Bonus', description: '₹500 verified task earnings', displayOrder: 1 },
          { id: 'ms_earn_2', planType: 'earning_milestone', target: 1000, bonusAmount: 75, title: 'Tier 2 Earnings Bonus', description: '₹1,000 verified task earnings', displayOrder: 2 },
          { id: 'ms_earn_3', planType: 'earning_milestone', target: 2500, bonusAmount: 200, title: 'Tier 3 Earnings Bonus', description: '₹2,500 verified task earnings', displayOrder: 3 },
          { id: 'ms_earn_4', planType: 'earning_milestone', target: 5000, bonusAmount: 500, title: 'Tier 4 Earnings Bonus', description: '₹5,000 verified task earnings', displayOrder: 4 },
          { id: 'ms_earn_5', planType: 'earning_milestone', target: 10000, bonusAmount: 1000, title: 'Tier 5 Earnings Bonus', description: '₹10,000 verified task earnings', displayOrder: 5 },
        ]
      }
    ];
  }

  public persistIncentives() {
    try {
      const dataDir = path.dirname(this.incentivesStoragePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const payload = {
        plans: this.incentivePlans,
        claims: this.incentiveClaims
      };
      fs.writeFileSync(this.incentivesStoragePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Incentives] Error writing incentives.json:', err);
    }
  }

  private initIncentives() {
    const defaults = this.getDefaultIncentivePlans();
    try {
      if (fs.existsSync(this.incentivesStoragePath)) {
        const raw = fs.readFileSync(this.incentivesStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (loaded && typeof loaded === 'object') {
          if (Array.isArray(loaded.plans) && loaded.plans.length > 0) {
            this.incentivePlans = loaded.plans;
          }
          if (Array.isArray(loaded.claims)) {
            this.incentiveClaims = loaded.claims;
          }
        }
      }
    } catch (err) {
      console.warn('[Incentives] Note loading incentives from disk:', err);
    }

    // Ensure all 3 plans exist in memory
    for (const def of defaults) {
      const existing = this.incentivePlans.find(p => p.planType === def.planType);
      if (!existing) {
        this.incentivePlans.push(def);
      } else {
        if (!existing.milestones || existing.milestones.length === 0) {
          existing.milestones = def.milestones;
        }
      }
    }
  }

  public getMonthKey(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  public getMonthName(monthKey: string): string {
    const [y, m] = monthKey.split('-').map(Number);
    if (!y || !m) return monthKey;
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }

  public getDaysRemainingInMonth(monthKey?: string): number {
    const now = new Date();
    const currentMonthKey = this.getMonthKey(now);
    const target = monthKey || currentMonthKey;
    const [y, m] = target.split('-').map(Number);
    if (!y || !m) return 0;
    
    // If it's a past month
    if (target < currentMonthKey) return 0;
    // Current month
    const totalDays = new Date(y, m, 0).getDate();
    return Math.max(0, totalDays - now.getDate());
  }

  public getUserIncentivesOverview(userId: string, targetMonth?: string): UserIncentivesOverview {
    const user = this.users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    const now = new Date();
    const currentMonth = this.getMonthKey(now);
    const month = targetMonth || currentMonth;
    const currentMonthName = this.getMonthName(month);
    const daysRemainingInMonth = this.getDaysRemainingInMonth(month);

    const userTargetIds = new Set<string>([userId]);
    if (user) {
      userTargetIds.add(user.id);
      if (user.email) userTargetIds.add(user.email.toLowerCase());
    }

    // 1. Calculate Monthly Referral Count (Only genuine qualifying referrals in month)
    // A referral qualifies when the referred user completed at least 1 verified/approved task
    const userReferrals = this.referrals.filter(r => 
      r.referrerId === userId || 
      (user?.id && r.referrerId === user.id) || 
      (user?.email && r.referrerId?.toLowerCase() === user.email.toLowerCase()) ||
      (user?.referralCode && r.referrerId === user.referralCode)
    );

    const qualifyingReferralItems: { id: string; title: string; date: string; value: number | string; status: string }[] = [];
    let qualifyingReferralCount = 0;

    for (const ref of userReferrals) {
      const referredApprovedSubs = this.submissions.filter(s => 
        (s.userId === ref.referredUserId || (ref.referredUserEmail && s.userEmail?.toLowerCase() === ref.referredUserEmail.toLowerCase())) &&
        s.status === 'approved'
      );
      
      const isQualified = ref.status === 'reward_credited' || ref.status === 'task_completed' || referredApprovedSubs.length > 0;
      if (isQualified) {
        const earliestApprovedSub = [...referredApprovedSubs].sort((a,b) => new Date(a.reviewedAt || a.submittedAt).getTime() - new Date(b.reviewedAt || b.submittedAt).getTime())[0];
        const qualificationDate = ref.completedAt || earliestApprovedSub?.reviewedAt || earliestApprovedSub?.submittedAt || ref.createdAt;
        
        if (qualificationDate && qualificationDate.startsWith(month)) {
          qualifyingReferralCount += 1;
          qualifyingReferralItems.push({
            id: ref.id,
            title: ref.referredUserName || 'Referred User',
            date: qualificationDate,
            value: `₹${ref.rewardAmount || 50}`,
            status: 'Qualifying Action Verified'
          });
        }
      }
    }

    // 2. Calculate Monthly Task Completion Count (Only verified approved tasks in month)
    const userApprovedSubs = this.submissions.filter(s => {
      const matches = userTargetIds.has(s.userId) || (user?.email && s.userEmail && s.userEmail.toLowerCase() === user.email.toLowerCase());
      if (!matches) return false;
      if (s.status !== 'approved') return false;
      const date = s.reviewedAt || s.submittedAt || s.completedDate;
      return date ? date.startsWith(month) : true;
    });

    const taskCompletionCount = userApprovedSubs.length;
    const eligibleTaskItems = userApprovedSubs.map(s => ({
      id: s.id,
      title: s.taskTitle,
      date: s.reviewedAt || s.submittedAt || s.completedDate,
      value: `₹${s.rewardAmount}`,
      status: 'Verified & Approved'
    }));

    // 3. Calculate Monthly Earning Milestones (Eligible verified task earnings in month)
    const monthlyTaskEarnings = userApprovedSubs.reduce((sum, s) => sum + (Number(s.rewardAmount) || 0), 0);

    // Build Plan Progress for each of the 3 plans
    const buildPlanProgress = (planType: IncentivePlanType, currentValue: number, qualifyingItems?: any[]): UserMonthlyPlanProgress => {
      const config = this.incentivePlans.find(p => p.planType === planType) || this.getDefaultIncentivePlans().find(p => p.planType === planType)!;
      const sortedMilestones = [...config.milestones].sort((a, b) => a.target - b.target);
      
      let currentMilestone: IncentiveMilestone | null = null;
      let nextMilestone: IncentiveMilestone | null = null;
      const completedMilestones: { milestone: IncentiveMilestone; claimed: boolean; claimRecord?: IncentiveClaimRecord }[] = [];
      const upcomingMilestones: IncentiveMilestone[] = [];
      let totalBonusEarned = 0;
      let stateChanged = false;

      for (let i = 0; i < sortedMilestones.length; i++) {
        const ms = sortedMilestones[i];
        if (currentValue >= ms.target) {
          currentMilestone = ms;
          // Check claim record
          let claim = this.incentiveClaims.find(c => 
            (c.userId === userId || (user && c.userId === user.id)) &&
            c.planType === planType &&
            c.milestoneId === ms.id &&
            c.month === month
          );

          if (!claim && config.enabled) {
            const autoCredit = config.autoCreditOnUnlock !== false;
            const nowIso = new Date().toISOString();
            const claimId = `inc_claim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            
            let rewardId: string | undefined;
            if (autoCredit && user) {
              rewardId = `rwd_inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
              this.rewards.push({
                id: rewardId,
                userId: user.id,
                type: 'bonus',
                amount: ms.bonusAmount,
                status: 'credited',
                referenceId: `DSK-INC-${month}-${Math.floor(1000 + Math.random() * 9000)}`,
                description: `Monthly Incentive: ${config.title} (${ms.target} Target Reached)`,
                createdAt: nowIso
              });
              this.notifications.push({
                id: `notif_inc_${Date.now()}`,
                userId: user.id,
                title: `🎁 ₹${ms.bonusAmount} Monthly Incentive Credited!`,
                message: `Congratulations! You unlocked the ₹${ms.bonusAmount} bonus for ${config.title} in ${currentMonthName}.`,
                type: 'reward',
                isRead: false,
                createdAt: nowIso,
                link: '/incentives'
              });
            }

            claim = {
              id: claimId,
              userId: user?.id || userId,
              userName: user?.name || 'User',
              userEmail: user?.email || '',
              planType,
              planTitle: config.title,
              month,
              milestoneId: ms.id,
              targetValue: ms.target,
              bonusAmount: ms.bonusAmount,
              status: autoCredit ? 'credited' : 'unlocked',
              rewardLedgerId: rewardId,
              createdAt: nowIso,
              creditedAt: autoCredit ? nowIso : undefined
            };

            this.incentiveClaims.push(claim);
            stateChanged = true;
          }

          if (claim && (claim.status === 'credited' || claim.status === 'paid')) {
            totalBonusEarned += ms.bonusAmount;
          }

          completedMilestones.push({
            milestone: ms,
            claimed: claim ? (claim.status === 'credited' || claim.status === 'paid') : false,
            claimRecord: claim
          });
        } else {
          if (!nextMilestone) {
            nextMilestone = ms;
          }
          upcomingMilestones.push(ms);
        }
      }

      if (stateChanged) {
        this.persistRewards();
        this.persistIncentives();
      }

      const isMaxTierReached = Boolean(currentMilestone && !nextMilestone);
      let progressPercent = 0;
      let remainingForNext = 0;

      if (nextMilestone) {
        const prevTarget = currentMilestone ? currentMilestone.target : 0;
        const segmentTotal = nextMilestone.target - prevTarget;
        const segmentProgress = currentValue - prevTarget;
        progressPercent = Math.min(100, Math.max(0, Math.round((segmentProgress / segmentTotal) * 100)));
        remainingForNext = Math.max(0, nextMilestone.target - currentValue);
      } else if (isMaxTierReached && currentMilestone) {
        progressPercent = 100;
        remainingForNext = 0;
      }

      return {
        planType,
        config,
        currentValue,
        currentMilestone,
        nextMilestone,
        progressPercent,
        remainingForNext,
        isMaxTierReached,
        completedMilestones,
        upcomingMilestones,
        totalBonusEarnedThisMonth: totalBonusEarned,
        qualifyingItems
      };
    };

    const referralProgress = buildPlanProgress('referral_target', qualifyingReferralCount, qualifyingReferralItems);
    const tasksProgress = buildPlanProgress('task_completion', taskCompletionCount, eligibleTaskItems);
    const earningsProgress = buildPlanProgress('earning_milestone', monthlyTaskEarnings);

    // Compute all history months
    const allUserClaims = this.incentiveClaims.filter(c => c.userId === userId || (user && c.userId === user.id));
    const monthsSet = new Set<string>();
    for (const c of allUserClaims) {
      if (c.month) monthsSet.add(c.month);
    }
    monthsSet.add(currentMonth);

    const historyMonths = Array.from(monthsSet).sort().reverse().map(m => {
      const monthClaims = allUserClaims.filter(c => c.month === m);
      const totalBonus = monthClaims
        .filter(c => c.status === 'credited' || c.status === 'paid')
        .reduce((sum, c) => sum + c.bonusAmount, 0);
      return {
        month: m,
        monthName: this.getMonthName(m),
        totalBonus,
        claims: monthClaims
      };
    });

    const totalBonusEarnedThisMonth = referralProgress.totalBonusEarnedThisMonth + tasksProgress.totalBonusEarnedThisMonth + earningsProgress.totalBonusEarnedThisMonth;
    const allTimeIncentiveBonus = allUserClaims
      .filter(c => c.status === 'credited' || c.status === 'paid')
      .reduce((sum, c) => sum + c.bonusAmount, 0);

    return {
      currentMonth: month,
      currentMonthName,
      daysRemainingInMonth,
      plans: {
        referral: referralProgress,
        tasks: tasksProgress,
        earnings: earningsProgress
      },
      totalBonusEarnedThisMonth,
      allTimeIncentiveBonus,
      historyMonths
    };
  }

  public claimIncentiveMilestone(userId: string, planType: IncentivePlanType, milestoneId: string, targetMonth?: string) {
    const user = this.users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    const month = targetMonth || this.getMonthKey();
    const config = this.incentivePlans.find(p => p.planType === planType);
    if (!config || !config.enabled) {
      return { success: false, message: 'This incentive plan is currently inactive.' };
    }
    const milestone = config.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      return { success: false, message: 'Milestone not found' };
    }

    const overview = this.getUserIncentivesOverview(user.id, month);
    const planProgress = planType === 'referral_target' ? overview.plans.referral : (planType === 'task_completion' ? overview.plans.tasks : overview.plans.earnings);

    if (planProgress.currentValue < milestone.target) {
      return { success: false, message: `Requirement not reached (${planProgress.currentValue}/${milestone.target})` };
    }

    let claim = this.incentiveClaims.find(c => c.userId === user.id && c.planType === planType && c.milestoneId === milestone.id && c.month === month);

    if (claim && (claim.status === 'credited' || claim.status === 'paid')) {
      return { success: false, message: 'Milestone bonus has already been credited to your wallet.' };
    }

    const nowIso = new Date().toISOString();
    const rewardId = `rwd_inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    
    this.rewards.push({
      id: rewardId,
      userId: user.id,
      type: 'bonus',
      amount: milestone.bonusAmount,
      status: 'credited',
      referenceId: `DSK-INC-${month}-${Math.floor(1000 + Math.random() * 9000)}`,
      description: `Monthly Incentive Bonus: ${config.title} (Target: ${milestone.target})`,
      createdAt: nowIso
    });

    this.notifications.push({
      id: `notif_inc_${Date.now()}`,
      userId: user.id,
      title: `🎁 ₹${milestone.bonusAmount} Incentive Bonus Claimed!`,
      message: `You claimed the ₹${milestone.bonusAmount} bonus for ${config.title}. It has been credited to your wallet balance.`,
      type: 'reward',
      isRead: false,
      createdAt: nowIso,
      link: '/wallet'
    });

    if (!claim) {
      claim = {
        id: `inc_claim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        planType,
        planTitle: config.title,
        month,
        milestoneId: milestone.id,
        targetValue: milestone.target,
        bonusAmount: milestone.bonusAmount,
        status: 'credited',
        rewardLedgerId: rewardId,
        createdAt: nowIso,
        creditedAt: nowIso
      };
      this.incentiveClaims.push(claim);
    } else {
      claim.status = 'credited';
      claim.rewardLedgerId = rewardId;
      claim.creditedAt = nowIso;
    }

    this.persistRewards();
    this.persistIncentives();

    const wallet = this.getWalletSummary(user.id);
    return {
      success: true,
      message: `₹${milestone.bonusAmount} bonus credited to your wallet!`,
      claim,
      wallet
    };
  }

  public getAdminIncentivesOverview(targetMonth?: string): AdminIncentivesOverview {
    const currentMonth = this.getMonthKey();
    const month = targetMonth || currentMonth;

    const monthsSet = new Set<string>();
    monthsSet.add(currentMonth);
    for (const c of this.incentiveClaims) {
      if (c.month) monthsSet.add(c.month);
    }
    for (const s of this.submissions) {
      const d = s.reviewedAt || s.submittedAt;
      if (d) monthsSet.add(d.slice(0, 7));
    }
    const availableMonths = Array.from(monthsSet).sort().reverse();

    const normalUsers = this.users.filter(u => u.role === 'user');
    const userItems: AdminIncentiveUserItem[] = [];

    let totalBonusesUnlocked = 0;
    let totalBonusesCredited = 0;
    let totalPendingClaims = 0;
    let referralBonusesPaid = 0;
    let taskBonusesPaid = 0;
    let earningBonusesPaid = 0;

    for (const u of normalUsers) {
      const overview = this.getUserIncentivesOverview(u.id, month);
      const userClaims = this.incentiveClaims.filter(c => c.userId === u.id && c.month === month);
      
      const unlocked = userClaims.filter(c => c.status === 'unlocked').reduce((s, c) => s + c.bonusAmount, 0);
      const credited = userClaims.filter(c => c.status === 'credited' || c.status === 'paid').reduce((s, c) => s + c.bonusAmount, 0);

      totalBonusesUnlocked += (unlocked + credited);
      totalBonusesCredited += credited;
      totalPendingClaims += userClaims.filter(c => c.status === 'unlocked').length;

      for (const c of userClaims) {
        if (c.status === 'credited' || c.status === 'paid') {
          if (c.planType === 'referral_target') referralBonusesPaid += c.bonusAmount;
          if (c.planType === 'task_completion') taskBonusesPaid += c.bonusAmount;
          if (c.planType === 'earning_milestone') earningBonusesPaid += c.bonusAmount;
        }
      }

      if (
        overview.plans.referral.currentValue > 0 || 
        overview.plans.tasks.currentValue > 0 || 
        overview.plans.earnings.currentValue > 0 ||
        userClaims.length > 0
      ) {
        userItems.push({
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          referralCount: overview.plans.referral.currentValue,
          taskCount: overview.plans.tasks.currentValue,
          taskEarnings: overview.plans.earnings.currentValue,
          unlockedBonuses: unlocked,
          creditedBonuses: credited,
          claimsCount: userClaims.length
        });
      }
    }

    const monthClaims = this.incentiveClaims.filter(c => c.month === month).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const planMap = {
      referral_target: this.incentivePlans.find(p => p.planType === 'referral_target') || this.getDefaultIncentivePlans()[0],
      task_completion: this.incentivePlans.find(p => p.planType === 'task_completion') || this.getDefaultIncentivePlans()[1],
      earning_milestone: this.incentivePlans.find(p => p.planType === 'earning_milestone') || this.getDefaultIncentivePlans()[2],
    };

    return {
      currentMonth,
      selectedMonth: month,
      availableMonths,
      plans: planMap,
      stats: {
        totalParticipants: userItems.length,
        totalBonusesUnlocked,
        totalBonusesCredited,
        totalPendingClaims,
        referralBonusesPaid,
        taskBonusesPaid,
        earningBonusesPaid
      },
      users: userItems,
      claims: monthClaims
    };
  }

  public updateIncentivePlan(planType: IncentivePlanType, updates: Partial<IncentivePlanConfig>): IncentivePlanConfig | null {
    let plan = this.incentivePlans.find(p => p.planType === planType);
    if (!plan) {
      const def = this.getDefaultIncentivePlans().find(p => p.planType === planType);
      if (!def) return null;
      plan = { ...def };
      this.incentivePlans.push(plan);
    }

    if (updates.title !== undefined) plan.title = updates.title;
    if (updates.subtitle !== undefined) plan.subtitle = updates.subtitle;
    if (updates.shortDescription !== undefined) plan.shortDescription = updates.shortDescription;
    if (updates.enabled !== undefined) plan.enabled = Boolean(updates.enabled);
    if (updates.qualifyingCondition !== undefined) plan.qualifyingCondition = updates.qualifyingCondition;
    if (updates.startDate !== undefined) plan.startDate = updates.startDate;
    if (updates.endDate !== undefined) plan.endDate = updates.endDate;
    if (updates.autoCreditOnUnlock !== undefined) plan.autoCreditOnUnlock = Boolean(updates.autoCreditOnUnlock);

    this.persistIncentives();
    return plan;
  }

  public addIncentiveMilestone(planType: IncentivePlanType, milestoneData: { target: number; bonusAmount: number; title?: string; description?: string }): IncentiveMilestone | null {
    let plan = this.incentivePlans.find(p => p.planType === planType);
    if (!plan) {
      const def = this.getDefaultIncentivePlans().find(p => p.planType === planType);
      if (!def) return null;
      plan = { ...def };
      this.incentivePlans.push(plan);
    }

    const newMs: IncentiveMilestone = {
      id: `ms_${planType.slice(0, 3)}_${Date.now()}`,
      planType,
      target: Number(milestoneData.target) || 1,
      bonusAmount: Number(milestoneData.bonusAmount) || 10,
      title: milestoneData.title || `Tier ${plan.milestones.length + 1} Bonus`,
      description: milestoneData.description || `Reach target ${milestoneData.target}`,
      displayOrder: plan.milestones.length + 1
    };

    plan.milestones.push(newMs);
    plan.milestones.sort((a, b) => a.target - b.target);
    this.persistIncentives();
    return newMs;
  }

  public updateIncentiveMilestone(planType: IncentivePlanType, milestoneId: string, updates: Partial<IncentiveMilestone>): IncentiveMilestone | null {
    const plan = this.incentivePlans.find(p => p.planType === planType);
    if (!plan) return null;

    const ms = plan.milestones.find(m => m.id === milestoneId);
    if (!ms) return null;

    if (updates.target !== undefined) ms.target = Number(updates.target) || ms.target;
    if (updates.bonusAmount !== undefined) ms.bonusAmount = Number(updates.bonusAmount) || ms.bonusAmount;
    if (updates.title !== undefined) ms.title = updates.title;
    if (updates.description !== undefined) ms.description = updates.description;
    if (updates.displayOrder !== undefined) ms.displayOrder = Number(updates.displayOrder);

    plan.milestones.sort((a, b) => a.target - b.target);
    this.persistIncentives();
    return ms;
  }

  public deleteIncentiveMilestone(planType: IncentivePlanType, milestoneId: string): boolean {
    const plan = this.incentivePlans.find(p => p.planType === planType);
    if (!plan) return false;

    const initialLen = plan.milestones.length;
    plan.milestones = plan.milestones.filter(m => m.id !== milestoneId);
    if (plan.milestones.length !== initialLen) {
      this.persistIncentives();
      return true;
    }
    return false;
  }

  public updateIncentiveClaimStatus(claimId: string, status: 'unlocked' | 'credited' | 'paid', adminNote?: string): IncentiveClaimRecord | null {
    const claim = this.incentiveClaims.find(c => c.id === claimId);
    if (!claim) return null;

    claim.status = status;
    if (adminNote) claim.adminNote = adminNote;

    if (status === 'credited' || status === 'paid') {
      if (!claim.creditedAt) claim.creditedAt = new Date().toISOString();
      if (!claim.rewardLedgerId) {
        const rewardId = `rwd_inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        claim.rewardLedgerId = rewardId;
        this.rewards.push({
          id: rewardId,
          userId: claim.userId,
          type: 'bonus',
          amount: claim.bonusAmount,
          status: 'credited',
          referenceId: `DSK-INC-${claim.month}-${Math.floor(1000 + Math.random() * 9000)}`,
          description: `Admin Approved Incentive: ${claim.planTitle || claim.planType} (Target: ${claim.targetValue})`,
          createdAt: new Date().toISOString()
        });
        this.persistRewards();
      }
    }

    this.persistIncentives();
    return claim;
  }
}

export const db = new InMemoryDB();
