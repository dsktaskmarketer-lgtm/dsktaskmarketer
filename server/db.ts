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

  constructor() {
    this.storageFilePath = path.join(process.cwd(), '.data', 'admin_config.json');

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
          return;
        }
      }
    } catch (err) {
      console.warn('[Admin Security] Error reading persisted admin config:', err);
    }

    // First-Time Administrator Bootstrap (Initial Setup state)
    this.adminSetupCompleted = false;
    const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@dsktaskmarketer.com').toLowerCase().trim();
    const initialAdminPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';
    const { hash: adminHash, salt: adminSalt } = this.hashPassword(initialAdminPass);

    this.users.push({
      id: "admin_root_001",
      name: "DSK Platform Administrator",
      email: initialAdminEmail,
      mobile: "+91 98000 00000",
      role: "admin",
      status: "active",
      referralCode: "DSKADMIN",
      createdAt: new Date().toISOString(),
      passwordHash: adminHash,
      salt: adminSalt
    });
    console.log(`[Admin Security] First-time setup pending. Default initial email: ${initialAdminEmail}`);
  }

  public getAdminSetupStatus() {
    if (this.adminSetupCompleted) {
      return {
        isFirstTimeSetup: false
      };
    }
    return {
      isFirstTimeSetup: true,
      defaultEmail: (process.env.INITIAL_ADMIN_EMAIL || 'admin@dsktaskmarketer.com').toLowerCase().trim(),
      defaultPassword: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456'
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
    const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
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
}

export const db = new InMemoryDB();
