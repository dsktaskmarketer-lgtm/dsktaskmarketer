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
export type RewardType = 'task_reward' | 'referral_reward' | 'withdrawal' | 'reversal' | 'bonus';

export interface RewardLedgerItem {
  id: string;
  userId: string;
  submissionId?: string;
  type: RewardType;
  amount: number;
  status: RewardStatus;
  referenceId: string;
  description: string;
  createdAt: string;
  internalNote?: string;
}

export interface WalletSummary {
  totalEarnings: number;
  availableBalance: number;
  pendingRewards: number;
  referralRewards: number;
  completedTasks: number;
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
  complianceDisclaimer: string;
  affiliateDisclosureText: string;
  affiliateDisclosure?: string; // alias
  defaultLanguage?: string;
  enabledLanguages?: string[];
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


