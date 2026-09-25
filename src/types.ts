export type UserRole = 'user' | 'client' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface PayoutDetails {
  upiId?: string;
  accountHolderName?: string;
  bankAccount?: string;
  ifsc?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  profilePhoto?: string;
  payoutDetails?: PayoutDetails;
  themePreference?: ThemeMode;
  languagePreference?: string;
  mustChangeCredentials?: boolean;
}

export interface Client {
  id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  mobile: string;
  website?: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  clientCompanyName?: string;
  title: string;
  categoryId: string;
  partnerName: string;
  description: string;
  rewardAmount: number;
  currency: string;
  affiliateUrl: string;
  eligibility: string;
  steps: string[];
  proofRequirements: string[];
  terms: string;
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  rejectionReason?: string;
  totalBudget?: number;
  targetCompletions?: number;
  completionsCount: number;
  createdAt: string;
  approvedAt?: string;
}

export type PartnerType =
  | 'company'
  | 'brand'
  | 'creator'
  | 'influencer'
  | 'local_business'
  | 'affiliate_partner'
  | 'agency'
  | 'app_owner'
  | 'service_provider'
  | 'other';

export type CampaignEnquiryStatus = 
  | 'new'
  | 'contacted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'follow_up_required'
  | 'archived'
  | 'new_enquiry' 
  | 'reviewing' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface FollowUpLog {
  id: string;
  timestamp: string;
  adminName?: string;
  type: 'call' | 'whatsapp' | 'email' | 'note' | 'status_change';
  note: string;
}

export interface CampaignEnquiry {
  id: string;
  partnerType: PartnerType;
  enquiryType?: string; // backward compat alias
  userId?: string;

  // Business & Requirement Information
  businessName: string;
  contactPerson: string;
  productService?: string;
  desiredResult?: string;
  promotionRequirement?: string;
  category?: string;
  targetAudience?: string;
  targetLocation?: string;
  expectedVolume?: string;
  budget?: string | number;
  duration?: string;
  specificConditions?: string;

  // Tracking link (OPTIONAL!)
  trackingUrl?: string;
  trackingUrlArrangedByAdmin?: boolean;

  // Platform specific fields
  creatorPlatforms?: string[];
  socialMediaProfiles?: string;
  website?: string;
  businessLocation?: string;

  // Mandatory Contact Information
  officialEmail: string;
  phoneNumber: string;
  whatsappNumber: string;

  // Explicit Contact Database Fields (Separately collected and preserved)
  contact_person_name?: string;
  company_brand_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  website_or_social?: string;

  // AI & Admin Metadata
  aiSummary: string;
  missingInformation?: string[];
  status: CampaignEnquiryStatus;
  adminNotes?: string;
  followUpHistory?: FollowUpLog[];
  convertedCampaignId?: string;
  convertedTaskId?: string;
  createdAt: string;
  updatedAt: string;

  // Backward-compatibility aliases
  campaignName?: string;
  companyName?: string;
  objective?: string;
  rewardAmount?: number;
  totalBudget?: string | number;
  targetCompletions?: number;
  campaignDuration?: string;
  eligibility?: string;
  instructions?: string[] | string;
  requiredProof?: string[];
  notes?: string;
  advertiserName?: string;
  contactEmail?: string;
  contactMobile?: string;
  rewardPerAction?: number;
  timelines?: string;
  affiliateUrl?: string;
}

export interface AIDraftTask {
  id: string;
  tempId: string;
  title: string;
  company: string;
  productService: string;
  description: string;
  userAction: string;
  instructions: string[];
  rewardAmount: number;
  proofRequirements: string[];
  destinationUrl: string;
  validDates: string;
  participantLimit: number | null;
  terms: string;
  categorySlug: string;
  categoryId: string;
  eligibility?: string;
  missingInfo: string[];
  missingFields?: string[];
  missingQuestions?: string[];
  isReviewRequired: boolean;
  isDuplicate?: boolean;
  duplicateWarning?: string;
  status: 'draft' | 'review_required' | 'ready';
  rawInputSnippet?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  active: boolean;
}

export interface Task {
  id: string;
  campaignId?: string;
  title: string;
  categoryId: string;
  partnerName: string;
  description: string;
  rewardAmount: number;
  currency: string;
  affiliateUrl: string;
  eligibility: string;
  steps: string[];
  proofRequirements: string[];
  terms: string;
  affiliateDisclosure: string;
  isDemo?: boolean;
  active: boolean;
  isActive?: boolean;
  displayOrder: number;
  startsCount: number;
  completionsCount: number;
  createdAt: string;
  expiresAt?: string;
}

export interface TaskStart {
  id: string;
  taskId: string;
  userId: string;
  referenceId: string;
  startedAt: string;
  affiliateTrackingRef: string;
}

export type SubmissionStatus = 
  | 'pending_review' 
  | 'under_verification' 
  | 'approved' 
  | 'rejected' 
  | 'resubmission_required';

export interface TaskSubmission {
  id: string;
  taskId: string;
  campaignId?: string;
  taskTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  referenceId: string;
  completedDate: string;
  proofApplicationId?: string;
  screenshotUrl?: string;
  userNote?: string;
  status: SubmissionStatus;
  adminNote?: string;
  rejectionReason?: string;
  rewardAmount: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type Submission = TaskSubmission;

export type RewardStatus = 'pending' | 'approved' | 'rejected' | 'credited' | 'reversed';
export type RewardType = 'task_reward' | 'referral_reward' | 'withdrawal' | 'withdrawal_refund' | 'admin_reward' | 'reversal' | 'bonus' | 'manual_reward';

export interface RewardLedgerItem {
  id: string;
  userId: string;
  submissionId?: string;
  withdrawalId?: string;
  type: RewardType;
  amount: number;
  status: RewardStatus;
  referenceId: string;
  description: string;
  createdAt: string;
  internalNote?: string;
  addedByAdmin?: string;
  refundReason?: string;
}

export interface WalletSummary {
  totalEarnings: number;
  availableBalance: number;
  pendingRewards: number;
  referralRewards: number;
  taskEarnings?: number;
  adminRewards?: number;
  manualRewards?: number;
  withdrawalRefunds?: number;
  completedTasks: number;
  totalEarned?: number;
  pendingBalance?: number;
  totalWithdrawn?: number;
  minimumWithdrawalLimit?: number;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  status: 'registered' | 'qualifying_action_pending' | 'eligible' | 'reward_credited';
  rewardAmount: number;
  createdAt: string;
  completedAt?: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled' | 'requested' | 'processing' | 'processed';
export type PayoutMethod = 'upi' | 'bank_transfer';

export interface WithdrawalAuditLog {
  id: string;
  withdrawalId: string;
  action: string;
  adminName: string;
  adminId?: string;
  timestamp: string;
  previousStatus: string;
  newStatus: string;
  note?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  payoutMethod: PayoutMethod;
  payoutDetails: PayoutDetails;
  status: WithdrawalStatus;
  referenceId?: string;
  utrNumber?: string;
  payoutReference?: string;
  refunded?: boolean;
  refundedAt?: string;
  availableBalanceAtRequest?: number;
  adminNote?: string;
  paymentReference?: string;
  paidAmount?: number;
  paidDate?: string;
  processedBy?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  requestedAt: string;
  processedAt?: string;
  auditLogs?: WithdrawalAuditLog[];
}

export interface SocialLink {
  id: string;
  platform: 'telegram_channel' | 'telegram_group' | 'youtube' | 'instagram' | 'facebook' | 'whatsapp_community' | 'other';
  displayName: string;
  url: string;
  icon: string;
  enabled: boolean;
  displayOrder: number;
  description?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'submission' | 'reward' | 'withdrawal' | 'referral' | 'system' | 'support';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface PlatformSettings {
  platformName: string;
  companyName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  themePreset?: string;
  borderRadius?: string;
  contactEmail?: string;
  minimumWithdrawalAmount?: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  minimumWithdrawalLimit?: number; // alias for compatibility
  payoutMode?: 'manual' | 'automatic';
  autoPayoutEnabled?: boolean;
  supportedPayoutMethods?: { upi: boolean; bankTransfer: boolean };
  manualPaymentInstructions?: string;
  referralRewardAmount: number;
  referralQualifyingCondition: string;
  referralPendingPeriodDays: number;
  referralEnabled: boolean;
  whatsappSupportNumber: string;
  whatsappSupportLink: string;
  whatsappNumber?: string; // alias
  supportEmail: string;
  supportHours: string;
  maintenanceMode: boolean;
  complianceDisclaimer?: string;
  affiliateDisclosureText?: string;
  affiliateDisclosure?: string; // alias
  defaultLanguage?: string;
  enabledLanguages?: string[];
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass?: string;
    from: string;
  };
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  enabled: boolean;
  isDefault: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface CommunityLink {
  id: string;
  title: string;
  description: string;
  platform: 'telegram' | 'whatsapp' | 'youtube' | 'instagram';
  url: string;
  memberCount: string;
  isActive: boolean;
}

export interface AdminMetrics {
  totalUsers: number;
  activeTasks: number;
  pendingSubmissions: number;
  totalRewardsPaid: number;
  pendingWithdrawals: number;
}

export interface WithdrawalItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  paymentMethod: 'upi' | 'bank_transfer';
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  accountHolderName?: string;
  status: WithdrawalStatus;
  transactionReference?: string;
  paymentReference?: string;
  paidAmount?: number;
  paidDate?: string;
  processedBy?: string;
  adminNote?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  availableBalanceAtRequest?: number;
  requestedAt: string;
  processedAt?: string;
  auditLogs?: WithdrawalAuditLog[];
}

export interface RewardItem {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: 'pending' | 'approved' | 'cancelled';
  description: string;
  createdAt: string;
}

export interface ReferralItem {
  id: string;
  referrerId?: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail?: string;
  rewardAmount: number;
  rewardStatus?: 'registered' | 'task_completed' | 'rewarded';
  status?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  createdAt: string;
}

export type RewardTransaction = RewardLedgerItem;
export type WithdrawalRequest = Withdrawal;
export type SocialMediaLink = SocialLink;

// ========================================================
// 3-PLAN MONTHLY INCENTIVE SYSTEM TYPES
// ========================================================

export type IncentivePlanType = 'referral_target' | 'task_completion' | 'earning_milestone';

export interface IncentiveMilestone {
  id: string;
  planType: IncentivePlanType;
  target: number; // e.g. 3, 5, 10 for referrals; 5, 10, 20 for tasks; 500, 1000, 2500 for earnings
  bonusAmount: number; // e.g. ₹25, ₹50, ₹150...
  title?: string;
  description?: string;
  displayOrder: number;
}

export interface IncentivePlanConfig {
  id: string;
  planType: IncentivePlanType;
  title: string;
  subtitle: string;
  icon: string;
  shortDescription: string;
  enabled: boolean;
  qualifyingCondition: string;
  startDate?: string;
  endDate?: string;
  milestones: IncentiveMilestone[];
  autoCreditOnUnlock?: boolean;
}

export interface IncentiveClaimRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  planType: IncentivePlanType;
  planTitle?: string;
  month: string; // 'YYYY-MM' e.g. '2026-09'
  milestoneId: string;
  targetValue: number;
  bonusAmount: number;
  status: 'unlocked' | 'credited' | 'paid';
  rewardLedgerId?: string;
  createdAt: string;
  creditedAt?: string;
  adminNote?: string;
}

export interface UserMonthlyPlanProgress {
  planType: IncentivePlanType;
  config: IncentivePlanConfig;
  currentValue: number; // Current count or INR amount
  currentMilestone: IncentiveMilestone | null;
  nextMilestone: IncentiveMilestone | null;
  progressPercent: number; // 0 - 100
  remainingForNext: number;
  isMaxTierReached: boolean;
  completedMilestones: {
    milestone: IncentiveMilestone;
    claimed: boolean;
    claimRecord?: IncentiveClaimRecord;
  }[];
  upcomingMilestones: IncentiveMilestone[];
  totalBonusEarnedThisMonth: number;
  qualifyingItems?: {
    id: string;
    title: string;
    date: string;
    value: number | string;
    status: string;
  }[];
}

export interface UserIncentivesOverview {
  currentMonth: string; // '2026-09'
  currentMonthName: string; // 'September 2026'
  daysRemainingInMonth: number;
  plans: {
    referral: UserMonthlyPlanProgress;
    tasks: UserMonthlyPlanProgress;
    earnings: UserMonthlyPlanProgress;
  };
  totalBonusEarnedThisMonth: number;
  allTimeIncentiveBonus: number;
  historyMonths: {
    month: string;
    monthName: string;
    totalBonus: number;
    claims: IncentiveClaimRecord[];
  }[];
}

export interface AdminIncentiveUserItem {
  userId: string;
  userName: string;
  userEmail: string;
  referralCount: number;
  taskCount: number;
  taskEarnings: number;
  unlockedBonuses: number;
  creditedBonuses: number;
  claimsCount: number;
}

export interface AdminIncentivesOverview {
  currentMonth: string;
  selectedMonth: string;
  availableMonths: string[];
  plans: {
    referral_target: IncentivePlanConfig;
    task_completion: IncentivePlanConfig;
    earning_milestone: IncentivePlanConfig;
  };
  stats: {
    totalParticipants: number;
    totalBonusesUnlocked: number;
    totalBonusesCredited: number;
    totalPendingClaims: number;
    referralBonusesPaid: number;
    taskBonusesPaid: number;
    earningBonusesPaid: number;
  };
  users: AdminIncentiveUserItem[];
  claims: IncentiveClaimRecord[];
}



