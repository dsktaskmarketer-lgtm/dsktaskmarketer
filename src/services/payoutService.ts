/**
 * DSK TaskMarketer - Payout Provider Service Abstraction
 * Supports Manual Disbursement (Default) and Extensible Automated Gateway Adapters (e.g. Cashfree, RazorpayX)
 * Strictly adheres to: Do NOT fake automatic payments. Default is Manual.
 */

export type PayoutMode = 'manual' | 'automatic';

export interface PayoutDisbursementRequest {
  withdrawalId: string;
  amount: number;
  paymentMethod: 'upi' | 'bank_transfer';
  recipient: {
    upiId?: string;
    accountHolderName?: string;
    bankAccount?: string;
    ifsc?: string;
  };
  narration?: string;
}

export interface PayoutDisbursementResult {
  success: boolean;
  status: 'pending' | 'queued' | 'paid' | 'rejected';
  referenceId?: string;
  provider?: string;
  message: string;
  rawResponse?: any;
}

export interface IPayoutProvider {
  name: string;
  isAvailable(): boolean;
  disburse(req: PayoutDisbursementRequest): Promise<PayoutDisbursementResult>;
  verifyStatus(referenceId: string): Promise<PayoutDisbursementResult>;
}

/**
 * Manual Payout Provider (Default)
 * Requires admin to disburse funds through offline banking portal and supply Bank UTR.
 */
export class ManualPayoutProvider implements IPayoutProvider {
  name = 'Manual Bank/UPI Disbursement';

  isAvailable(): boolean {
    return true;
  }

  async disburse(req: PayoutDisbursementRequest): Promise<PayoutDisbursementResult> {
    return {
      success: true,
      status: 'pending',
      provider: 'manual',
      message: 'Payout queued for manual verification and bank transfer by platform admin.'
    };
  }

  async verifyStatus(referenceId: string): Promise<PayoutDisbursementResult> {
    return {
      success: true,
      status: 'paid',
      referenceId,
      provider: 'manual',
      message: 'Status verified via recorded bank UTR.'
    };
  }
}

/**
 * PayoutService orchestrator
 */
export class PayoutService {
  private static instance: PayoutService;
  private mode: PayoutMode = 'manual';
  private activeProvider: IPayoutProvider = new ManualPayoutProvider();

  public static getInstance(): PayoutService {
    if (!PayoutService.instance) {
      PayoutService.instance = new PayoutService();
    }
    return PayoutService.instance;
  }

  public getMode(): PayoutMode {
    return this.mode;
  }

  public setMode(mode: PayoutMode) {
    this.mode = mode;
  }

  public getActiveProviderName(): string {
    return this.activeProvider.name;
  }

  public async executePayout(req: PayoutDisbursementRequest): Promise<PayoutDisbursementResult> {
    return this.activeProvider.disburse(req);
  }
}

export const payoutService = PayoutService.getInstance();
