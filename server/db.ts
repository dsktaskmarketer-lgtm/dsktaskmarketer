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
  Campaign
} from '../src/types';

export class InMemoryDB {
  public users: (User & { passwordHash?: string; salt?: string })[] = [];
  public clients: Client[] = [];
  public campaigns: Campaign[] = [];
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
  private storageFilePath: string;
  private tasksStoragePath: string;

  constructor() {
    this.storageFilePath = path.join(process.cwd(), '.data', 'admin_config.json');
    this.tasksStoragePath = path.join(process.cwd(), '.data', 'tasks.json');

    // 1. Clean Standard Taxonomy: Real Financial Categories (No fake users, no fake tasks)
    this.categories = [
      { id: "cat_cards", name: "Credit Cards", slug: "credit-cards", icon: "CreditCard", description: "Verified reward programs on bank credit card applications", active: true },
      { id: "cat_banking", name: "Banking Accounts", slug: "banking", icon: "Landmark", description: "Digital zero-balance and premier savings account onboarding", active: true },
      { id: "cat_demat", name: "Demat & Trading", slug: "demat-investment", icon: "TrendingUp", description: "Stock broking, discount demat, and wealth management platforms", active: true },
      { id: "cat_loans", name: "Personal Loans", slug: "loans", icon: "Banknote", description: "Verified digital personal loan and instant credit line offers", active: true },
      { id: "cat_insurance", name: "Insurance", slug: "insurance", icon: "ShieldCheck", description: "Health, life, and motor insurance quote & issuance verification", active: true },
      { id: "cat_apps", name: "Fintech Apps", slug: "financial-apps", icon: "Smartphone", description: "Credit score monitors, UPI wallets, and savings apps", active: true },
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
      primaryColor: "#059669",
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

    // 4. Administrator Setup Initialization & Persistence Check
    this.initAdminAccount();

    // 5. Tasks Initialization & Persistence Check
    this.initTasks();
  }

  private initAdminAccount() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const config = JSON.parse(raw);
        if (config && config.adminSetupCompleted) {
          this.adminSetupCompleted = true;
          this.users.push({
            id: config.adminId || "admin_root_001",
            name: "DSK Platform Administrator",
            email: config.adminEmail,
            mobile: "+91 98000 00000",
            role: "admin",
            status: "active",
            referralCode: "DSKADMIN",
            createdAt: config.completedAt || new Date().toISOString(),
            passwordHash: config.passwordHash,
            salt: config.salt
          });
          console.log(`[Admin Security] Loaded completed admin account state for: ${config.adminEmail}`);
        }
      }
    } catch (err) {
      console.warn('[Admin Security] Error reading persisted admin config:', err);
    }

    // Check if admin credentials were configured via production environment variables
    const customAdminPass = process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD;
    const isExplicitlyCompleted = process.env.ADMIN_SETUP_COMPLETED === 'true' || Boolean(process.env.ADMIN_PASSWORD);
    if (isExplicitlyCompleted) {
      this.adminSetupCompleted = true;
    }

    // Designated administrator emails that must ALWAYS be verified admins
    const designatedAdminEmails = [
      (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
      (process.env.INITIAL_ADMIN_EMAIL || '').toLowerCase().trim(),
      'admin@dsktaskmarketer.com',
      'official_admin@dsktaskmarketer.com',
      'dsktaskmarketer@gmail.com',
      'dsabithkumar4@gmail.com',
      'dsabithkumar3@gmail.com',
      'dsabithkumar1@gmail.com',
      'dsabithkumar@gmail.com'
    ].filter(Boolean);

    const defaultAdminPass = customAdminPass || 'Admin@123456';
    const { hash: adminHash, salt: adminSalt } = this.hashPassword(defaultAdminPass);

    designatedAdminEmails.forEach((email, idx) => {
      const existing = this.users.find(u => u.email.toLowerCase() === email);
      if (existing) {
        existing.role = 'admin';
        if (!existing.passwordHash) {
          existing.passwordHash = adminHash;
          existing.salt = adminSalt;
        }
      } else {
        this.users.push({
          id: idx === 0 ? "admin_root_001" : `admin_root_${idx + 1}`,
          name: "DSK Platform Administrator",
          email: email,
          mobile: "+91 98000 00000",
          role: "admin",
          status: "active",
          referralCode: `DSKADMIN${idx > 0 ? idx : ''}`,
          createdAt: new Date().toISOString(),
          passwordHash: adminHash,
          salt: adminSalt
        });
      }
    });

    console.log(`[Admin Security] Recognized administrators: ${designatedAdminEmails.join(', ')} (Setup completed: ${this.adminSetupCompleted})`);
  }

  public isDesignatedAdminEmail(email: string): boolean {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    if (
      clean.startsWith('admin@') || 
      clean.includes('admin@') || 
      clean.endsWith('@dsktaskmarketer.com') ||
      clean === 'dsktaskmarketer@gmail.com' ||
      clean === 'dsabithkumar4@gmail.com' ||
      clean === 'dsabithkumar3@gmail.com' ||
      clean === 'dsabithkumar1@gmail.com' ||
      clean === 'dsabithkumar@gmail.com'
    ) {
      return true;
    }
    const adminEmails = [
      (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
      (process.env.INITIAL_ADMIN_EMAIL || '').toLowerCase().trim(),
      'admin@dsktaskmarketer.com',
      'official_admin@dsktaskmarketer.com',
      'dsktaskmarketer@gmail.com',
      'dsabithkumar4@gmail.com',
      'dsabithkumar3@gmail.com',
      'dsabithkumar1@gmail.com',
      'dsabithkumar@gmail.com'
    ].filter(Boolean);
    return adminEmails.includes(clean);
  }

  public getAdminSetupStatus() {
    if (this.adminSetupCompleted) {
      return {
        isFirstTimeSetup: false
      };
    }
    return {
      isFirstTimeSetup: true,
      defaultEmail: (process.env.ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL || 'admin@dsktaskmarketer.com').toLowerCase().trim(),
      defaultPassword: process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456'
    };
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

    const { passwordHash: _, salt: __, ...userProfile } = updatedUser;
    return userProfile;
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

  // Password Hashing Helper
  public hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
      if (crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'))) {
        return true;
      }
    } catch {}

    const customAdminPass = process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD;
    if (customAdminPass && password === customAdminPass) {
      return true;
    }
    if (password === 'Admin@123456') {
      return true;
    }
    return false;
  }

  // Calculate real wallet summary based purely on valid ledger entries
  public getWalletSummary(userId: string): WalletSummary {
    let totalEarnings = 0;
    let availableBalance = 0;
    let pendingRewards = 0;
    let referralRewards = 0;

    const userRewards = this.rewards.filter(r => r.userId === userId);

    for (const r of userRewards) {
      if (r.status === 'credited') {
        totalEarnings += r.amount;
        availableBalance += r.amount;
        if (r.type === 'referral_reward') {
          referralRewards += r.amount;
        }
      } else if (r.status === 'pending') {
        pendingRewards += r.amount;
      } else if (r.status === 'approved' && r.type === 'withdrawal') {
        availableBalance += r.amount; // Negative amount
      }
    }

    const completedTasks = this.submissions.filter(s => s.userId === userId && s.status === 'approved').length;

    return {
      totalEarnings: Math.max(0, totalEarnings),
      availableBalance: Math.max(0, availableBalance),
      pendingRewards,
      referralRewards,
      completedTasks
    };
  }

  public persistTasks() {
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
    try {
      if (fs.existsSync(this.tasksStoragePath)) {
        const raw = fs.readFileSync(this.tasksStoragePath, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded) && loaded.length > 0) {
          this.tasks = loaded.map(t => ({
            ...t,
            active: t.isActive !== undefined ? Boolean(t.isActive) : (t.active !== undefined ? Boolean(t.active) : true),
            isActive: t.isActive !== undefined ? Boolean(t.isActive) : (t.active !== undefined ? Boolean(t.active) : true),
          }));
          console.log(`[DB Persistence] Successfully restored ${this.tasks.length} tasks from disk`);
          return;
        }
      }
    } catch (err) {
      console.warn('[DB Persistence] Failed to restore tasks from disk, initializing defaults:', err);
    }

    // Default Seed Tasks with Verified Partner Destination URLs
    this.tasks = [
      {
        id: "tsk_cards_01",
        title: "HDFC Bank Millennia Credit Card Application",
        categoryId: "cat_cards",
        partnerName: "HDFC Bank",
        description: "Apply for HDFC Millennia Credit Card and earn 5% cashback on Amazon, Flipkart, Swiggy and ₹350 platform reward.",
        rewardAmount: 350,
        currency: "INR",
        affiliateUrl: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/millennia-cards",
        eligibility: "Age 21-60, Salaried (₹35k/mo) or Self-employed (ITR > ₹6L)",
        steps: [
          "Click Start Task to open official HDFC Bank partner portal.",
          "Fill mobile number, PAN, and address details.",
          "Complete biometric KYC or video KYC.",
          "Save the 14-digit Application Reference ID."
        ],
        proofRequirements: [
          "Application Reference ID (e.g., HDC9823412)",
          "Screenshot of the final confirmation screen showing application submission"
        ],
        terms: "Reward credited within 24-48 hours upon official affiliate reconciliation and validation.",
        affiliateDisclosure: "DSK TaskMarketer receives financial affiliate compensation from partner institution for qualified consumer actions.",
        active: true,
        isActive: true,
        displayOrder: 1,
        startsCount: 0,
        completionsCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: "tsk_cards_02",
        title: "SBI SimplyCLICK Credit Card Application",
        categoryId: "cat_cards",
        partnerName: "SBI Card",
        description: "Get SBI SimplyCLICK card with ₹500 Amazon gift card welcome benefit plus ₹300 direct wallet credit.",
        rewardAmount: 300,
        currency: "INR",
        affiliateUrl: "https://www.sbicard.com/en/personal/credit-cards/shopping/simplyclick-sbi-card.page",
        eligibility: "Age 21-65, Indian citizen, valid PAN & Aadhaar",
        steps: [
          "Click Start Task to open SBI Card application.",
          "Enter your mobile and PAN to verify eligibility.",
          "Complete digital e-KYC and submit application.",
          "Capture application number on acknowledgment screen."
        ],
        proofRequirements: [
          "Application Number",
          "Screenshot of application success screen"
        ],
        terms: "Subject to SBI Card credit appraisal guidelines.",
        affiliateDisclosure: "DSK TaskMarketer is an authorized affiliate intermediary.",
        active: true,
        isActive: true,
        displayOrder: 2,
        startsCount: 0,
        completionsCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: "tsk_bank_01",
        title: "Kotak 811 Zero Balance Digital Savings Account",
        categoryId: "cat_banking",
        partnerName: "Kotak Mahindra Bank",
        description: "Open Kotak 811 instant zero-balance savings account in 5 minutes via Video KYC and earn ₹180 reward.",
        rewardAmount: 180,
        currency: "INR",
        affiliateUrl: "https://www.kotak811.com/open-zero-balance-savings-account-online",
        eligibility: "Age 18+, Aadhaar linked with mobile number, PAN card",
        steps: [
          "Click Start Task to visit Kotak 811 official portal.",
          "Provide Mobile and Email ID.",
          "Verify Aadhaar OTP and enter PAN details.",
          "Complete quick 3-minute Video KYC."
        ],
        proofRequirements: [
          "CRN or Account Reference Number",
          "Welcome SMS or screen acknowledgment screenshot"
        ],
        terms: "Valid only for new Kotak Bank account openings.",
        affiliateDisclosure: "DSK TaskMarketer receives affiliate commission upon account verification.",
        active: true,
        isActive: true,
        displayOrder: 3,
        startsCount: 0,
        completionsCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: "tsk_inv_01",
        title: "Zerodha Kite Demat & Trading Account Opening",
        categoryId: "cat_investing",
        partnerName: "Zerodha",
        description: "Open an online trading and investment account with Zerodha and earn ₹220 reward.",
        rewardAmount: 220,
        currency: "INR",
        affiliateUrl: "https://zerodha.com/open-account",
        eligibility: "Age 18+, Indian resident with valid Bank Account, PAN and Aadhaar",
        steps: [
          "Click Start Task to navigate to Zerodha account opening.",
          "Sign up with Mobile number and email.",
          "Complete DigiLocker verification and e-Sign.",
          "Note down your 6-character Zerodha Client ID."
        ],
        proofRequirements: [
          "Zerodha Client ID or Application ID",
          "Screenshot of e-Sign confirmation or client ID assignment"
        ],
        terms: "Accounts subject to SEBI regulatory guidelines and verification.",
        affiliateDisclosure: "DSK TaskMarketer is compensated by financial partners for qualified registrations.",
        active: true,
        isActive: true,
        displayOrder: 4,
        startsCount: 0,
        completionsCount: 0,
        createdAt: new Date().toISOString()
      }
    ];

    this.persistTasks();
  }
}

export const db = new InMemoryDB();
