/**
 * DSK TaskMarketer - Multi-Provider HTTP Email Delivery Service
 * Fallback Order:
 * 1. Brevo (Main / Priority 1) -> HTTP API (POST https://api.brevo.com/v3/smtp/email)
 * 2. Mailjet (Backup 1 / Priority 2) -> HTTP API (POST https://api.mailjet.com/v3.1/send)
 * 3. Resend (Backup 2 / Priority 3) -> HTTP API (POST https://api.resend.com/emails)
 */

export interface EmailSendResult {
  success: boolean;
  provider?: 'Brevo' | 'Mailjet' | 'Resend';
  messageId?: string;
  error?: string;
}

export interface ProviderStatusSummary {
  brevoConfigured: boolean;
  mailjetConfigured: boolean;
  resendConfigured: boolean;
  anyConfigured: boolean;
  senderEmail: string;
}

class EmailService {
  /**
   * Resolves the verified DSK TaskMarketer sender email address from environment variables
   */
  public getSenderEmail(): string {
    const raw = 
      process.env.SENDER_EMAIL ||
      process.env.BREVO_SENDER_EMAIL ||
      process.env.MAILJET_SENDER_EMAIL ||
      process.env.RESEND_SENDER_EMAIL ||
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      process.env.GMAIL_USER ||
      process.env.ADMIN_EMAIL ||
      'dsktaskmarketer@gmail.com';

    // Parse email address if formatted as "DSK TaskMarketer <email@domain.com>"
    const match = raw.match(/<([^>]+)>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return raw.trim();
  }

  /**
   * Returns whether at least one email provider API key is configured
   */
  public isConfigured(): boolean {
    const hasBrevo = Boolean(process.env.BREVO_API_KEY?.trim());
    const hasMailjet = Boolean(process.env.MAILJET_API_KEY?.trim() && process.env.MAILJET_SECRET_KEY?.trim());
    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
    return hasBrevo || hasMailjet || hasResend;
  }

  /**
   * Diagnostic summary of active providers
   */
  public getProviderStatus(): ProviderStatusSummary {
    const brevoConfigured = Boolean(process.env.BREVO_API_KEY?.trim());
    const mailjetConfigured = Boolean(process.env.MAILJET_API_KEY?.trim() && process.env.MAILJET_SECRET_KEY?.trim());
    const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

    return {
      brevoConfigured,
      mailjetConfigured,
      resendConfigured,
      anyConfigured: brevoConfigured || mailjetConfigured || resendConfigured,
      senderEmail: this.getSenderEmail()
    };
  }

  public getConfig() {
    const status = this.getProviderStatus();
    return {
      host: 'HTTP API (Brevo -> Mailjet -> Resend)',
      port: 443,
      secure: true,
      user: status.senderEmail,
      from: `"DSK TaskMarketer" <${status.senderEmail}>`,
      brevo: status.brevoConfigured,
      mailjet: status.mailjetConfigured,
      resend: status.resendConfigured
    };
  }

  public getConfigSummary() {
    const status = this.getProviderStatus();
    return {
      isConfigured: status.anyConfigured,
      host: 'HTTP API Cascade (Brevo -> Mailjet -> Resend)',
      port: 443,
      secure: true,
      user: status.senderEmail ? this.maskEmail(status.senderEmail) : 'Not configured',
      from: `DSK TaskMarketer <${status.senderEmail}>`,
      providers: {
        brevo: status.brevoConfigured ? 'Ready (Priority 1)' : 'Not configured',
        mailjet: status.mailjetConfigured ? 'Ready (Backup 1)' : 'Not configured',
        resend: status.resendConfigured ? 'Ready (Backup 2)' : 'Not configured'
      }
    };
  }

  public updateConfig(_config: any): void {
    // No-op for backwards compatibility with legacy SMTP config routes
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const visible = name.slice(0, 2);
    return `${visible}***@${parts[1]}`;
  }

  // =========================================================================
  // 1. PRIMARY PROVIDER: BREVO (HTTP API)
  // Endpoint: POST https://api.brevo.com/v3/smtp/email
  // Headers: api-key: process.env.BREVO_API_KEY
  // =========================================================================
  private async sendViaBrevo(
    to: string,
    subject: string,
    html: string,
    text: string,
    senderEmail: string,
    recipientName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    if (!apiKey) {
      return { success: false, error: 'BREVO_API_KEY is not configured in server environment' };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'DSK TaskMarketer',
            email: senderEmail
          },
          to: [
            {
              email: to,
              name: recipientName || 'Member'
            }
          ],
          subject,
          htmlContent: html,
          textContent: text
        }),
        signal: AbortSignal.timeout(8000) // 8-second safety timeout
      });

      const bodyText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(bodyText);
      } catch {}

      if (response.ok) {
        return {
          success: true,
          messageId: data.messageId || 'brevo-dispatched'
        };
      }

      const errorMessage = data.message || data.error || `Brevo HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    } catch (err: any) {
      return { success: false, error: `Brevo network error: ${err?.message || err}` };
    }
  }

  // =========================================================================
  // 2. BACKUP PROVIDER 1: MAILJET (HTTP API)
  // Endpoint: POST https://api.mailjet.com/v3.1/send
  // Headers: Authorization: Basic Base64(MAILJET_API_KEY:MAILJET_SECRET_KEY)
  // =========================================================================
  private async sendViaMailjet(
    to: string,
    subject: string,
    html: string,
    text: string,
    senderEmail: string,
    recipientName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = (process.env.MAILJET_API_KEY || '').trim();
    const secretKey = (process.env.MAILJET_SECRET_KEY || '').trim();

    if (!apiKey || !secretKey) {
      return { success: false, error: 'MAILJET_API_KEY or MAILJET_SECRET_KEY is not configured' };
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Messages: [
            {
              From: {
                Email: senderEmail,
                Name: 'DSK TaskMarketer'
              },
              To: [
                {
                  Email: to,
                  Name: recipientName || 'Member'
                }
              ],
              Subject: subject,
              TextPart: text,
              HTMLPart: html
            }
          ]
        }),
        signal: AbortSignal.timeout(8000) // 8-second safety timeout
      });

      const bodyText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(bodyText);
      } catch {}

      if (response.ok) {
        const msg = data.Messages?.[0];
        if (msg && (msg.Status === 'success' || msg.Status === 'queued')) {
          const msgId = msg.To?.[0]?.MessageID ? String(msg.To[0].MessageID) : 'mailjet-dispatched';
          return { success: true, messageId: msgId };
        }
        if (msg && msg.Errors && msg.Errors.length > 0) {
          const errList = msg.Errors.map((e: any) => e.ErrorMessage).join('; ');
          return { success: false, error: `Mailjet send error: ${errList}` };
        }
        return { success: true, messageId: 'mailjet-dispatched' };
      }

      const errorMessage = data.ErrorMessage || data.message || `Mailjet HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    } catch (err: any) {
      return { success: false, error: `Mailjet network error: ${err?.message || err}` };
    }
  }

  // =========================================================================
  // 3. BACKUP PROVIDER 2: RESEND (HTTP API)
  // Endpoint: POST https://api.resend.com/emails
  // Headers: Authorization: Bearer process.env.RESEND_API_KEY
  // With automatic fallback to onboarding@resend.dev if custom domain is unverified
  // =========================================================================
  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
    text: string,
    senderEmail: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = (process.env.RESEND_API_KEY || '').trim();
    if (!apiKey) {
      return { success: false, error: 'RESEND_API_KEY is not configured' };
    }

    const isFreeWebmail = /@(gmail|yahoo|hotmail|outlook|live|icloud)\.com$/i.test(senderEmail);
    const initialFrom = isFreeWebmail 
      ? `DSK TaskMarketer <onboarding@resend.dev>` 
      : `DSK TaskMarketer <${senderEmail}>`;

    const makeResendRequest = async (fromAddress: string) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text
        }),
        signal: AbortSignal.timeout(8000)
      });

      const bodyText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(bodyText);
      } catch {}

      return { response, data };
    };

    try {
      let { response, data } = await makeResendRequest(initialFrom);

      // If failed due to unverified custom domain, automatically fallback to Resend's default sender
      const errorMsg = data.message || data.error?.message || '';
      if (!response.ok && (errorMsg.includes('not verified') || errorMsg.includes('domain') || response.status === 403)) {
        if (initialFrom !== `DSK TaskMarketer <onboarding@resend.dev>`) {
          console.warn(`[Resend] Domain ${senderEmail} not verified in Resend. Retrying with onboarding@resend.dev...`);
          const retry = await makeResendRequest(`DSK TaskMarketer <onboarding@resend.dev>`);
          response = retry.response;
          data = retry.data;
        }
      }

      if (response.ok && data.id) {
        return {
          success: true,
          messageId: data.id
        };
      }

      const finalError = data.message || data.error?.message || `Resend HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: finalError };
    } catch (err: any) {
      return { success: false, error: `Resend network error: ${err?.message || err}` };
    }
  }

  // =========================================================================
  // CASCADE EXECUTION ENGINE: BREVO -> MAILJET -> RESEND
  // Sequential fallback: Only calls next provider if current provider fails
  // Single OTP is preserved across all fallback attempts
  // =========================================================================
  public async sendEmailWithFallback(
    to: string,
    subject: string,
    html: string,
    text: string,
    recipientName: string = 'Member'
  ): Promise<EmailSendResult> {
    const senderEmail = this.getSenderEmail();
    const maskedTo = this.maskEmail(to);
    const diagnosticErrors: string[] = [];

    // -----------------------------------------------------------------------
    // STEP 1: ATTEMPT BREVO (PRIMARY)
    // -----------------------------------------------------------------------
    if (process.env.BREVO_API_KEY?.trim()) {
      console.log(`[Email Delivery] [1/3] Trying Brevo for ${maskedTo}...`);
      const brevoResult = await this.sendViaBrevo(to, subject, html, text, senderEmail, recipientName);
      if (brevoResult.success) {
        console.log(`[Email Delivery] ✓ Sent successfully via Brevo (MessageId: ${brevoResult.messageId}) to ${maskedTo}`);
        return {
          success: true,
          provider: 'Brevo',
          messageId: brevoResult.messageId
        };
      }
      diagnosticErrors.push(`Brevo: ${brevoResult.error}`);
      console.warn(`[Email Delivery] ✗ Brevo failed for ${maskedTo}: ${brevoResult.error}. Proceeding to Backup 1 (Mailjet)...`);
    } else {
      diagnosticErrors.push('Brevo: BREVO_API_KEY missing');
      console.log(`[Email Delivery] [1/3] Brevo skipped (BREVO_API_KEY not configured). Trying Mailjet...`);
    }

    // -----------------------------------------------------------------------
    // STEP 2: ATTEMPT MAILJET (BACKUP 1)
    // -----------------------------------------------------------------------
    if (process.env.MAILJET_API_KEY?.trim() && process.env.MAILJET_SECRET_KEY?.trim()) {
      console.log(`[Email Delivery] [2/3] Trying Mailjet for ${maskedTo}...`);
      const mailjetResult = await this.sendViaMailjet(to, subject, html, text, senderEmail, recipientName);
      if (mailjetResult.success) {
        console.log(`[Email Delivery] ✓ Sent successfully via Mailjet (MessageId: ${mailjetResult.messageId}) to ${maskedTo}`);
        return {
          success: true,
          provider: 'Mailjet',
          messageId: mailjetResult.messageId
        };
      }
      diagnosticErrors.push(`Mailjet: ${mailjetResult.error}`);
      console.warn(`[Email Delivery] ✗ Mailjet failed for ${maskedTo}: ${mailjetResult.error}. Proceeding to Backup 2 (Resend)...`);
    } else {
      diagnosticErrors.push('Mailjet: MAILJET_API_KEY or MAILJET_SECRET_KEY missing');
      console.log(`[Email Delivery] [2/3] Mailjet skipped (credentials not configured). Trying Resend...`);
    }

    // -----------------------------------------------------------------------
    // STEP 3: ATTEMPT RESEND (BACKUP 2)
    // -----------------------------------------------------------------------
    if (process.env.RESEND_API_KEY?.trim()) {
      console.log(`[Email Delivery] [3/3] Trying Resend for ${maskedTo}...`);
      const resendResult = await this.sendViaResend(to, subject, html, text, senderEmail);
      if (resendResult.success) {
        console.log(`[Email Delivery] ✓ Sent successfully via Resend (MessageId: ${resendResult.messageId}) to ${maskedTo}`);
        return {
          success: true,
          provider: 'Resend',
          messageId: resendResult.messageId
        };
      }
      diagnosticErrors.push(`Resend: ${resendResult.error}`);
      console.error(`[Email Delivery] ✗ Resend failed for ${maskedTo}: ${resendResult.error}`);
    } else {
      diagnosticErrors.push('Resend: RESEND_API_KEY missing');
      console.log(`[Email Delivery] [3/3] Resend skipped (RESEND_API_KEY not configured).`);
    }

    // -----------------------------------------------------------------------
    // STEP 4: ALL PROVIDERS FAILED
    // -----------------------------------------------------------------------
    console.error(`[Email Delivery] Fatal: All 3 email providers failed for ${maskedTo}. Diagnostics: [${diagnosticErrors.join(' | ')}]`);
    return {
      success: false,
      error: 'Unable to deliver verification email. Please verify that at least one email provider (Brevo, Mailjet, or Resend) is configured with valid API keys.'
    };
  }

  // =========================================================================
  // USER REGISTRATION EMAIL OTP DISPATCH
  // =========================================================================
  public async sendRegistrationOtp(email: string, otp: string, userName?: string): Promise<EmailSendResult> {
    const subject = `Your DSK TaskMarketer Verification Code: ${otp}`;
    const name = userName || 'Valued Member';
    const text = `Hello ${name},\n\nYour DSK TaskMarketer verification code is: ${otp}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.\n\nDSK TaskMarketer - Complete Tasks • Earn Rewards • Grow Together`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07152F; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
          .header { background: linear-gradient(135deg, #0a1e4c 0%, #1e40af 100%); padding: 32px 24px; text-align: center; }
          .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
          .brand-sub { color: #ffd400; font-size: 13px; font-weight: 700; margin-top: 6px; }
          .content { padding: 32px 28px; color: #1e293b; line-height: 1.6; }
          .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .text { font-size: 14px; color: #475569; margin-bottom: 24px; }
          .otp-box { background: #eff6ff; border: 2px dashed #0057d9; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 38px; font-weight: 900; color: #0057d9; letter-spacing: 8px; font-family: monospace; }
          .otp-notice { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
          .badge { display: inline-block; background: #e60012; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
          .security-card { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px; font-size: 12px; color: #854d0e; margin-top: 24px; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand-title">DSK TaskMarketer</h1>
            <div class="brand-sub">Complete Tasks • Earn Rewards • Grow Together</div>
          </div>
          <div class="content">
            <div class="badge">Email Verification</div>
            <div class="greeting">Hello ${name},</div>
            <p class="text">Thank you for registering on DSK TaskMarketer. Please enter the 6-digit verification code below to verify your email address and activate your account.</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-notice">Valid for 10 minutes • Do not share this code with anyone</div>
            </div>

            <div class="security-card">
              <strong>Security Alert:</strong> DSK TaskMarketer administrators will never ask for your password, OTP, or UPI PIN via call, message, or email.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} DSK TaskMarketer. All rights reserved.<br>
            Digital Success Key Performance & Affiliate Network
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmailWithFallback(email, subject, html, text, name);
  }

  // =========================================================================
  // PASSWORD RESET EMAIL OTP DISPATCH (USER & ADMIN)
  // =========================================================================
  public async sendPasswordResetOtp(email: string, otp: string, role: 'admin' | 'user'): Promise<EmailSendResult> {
    const isAdmin = role === 'admin';
    const subject = `[${isAdmin ? 'ADMIN SECURITY' : 'SECURITY'}] DSK TaskMarketer Password Reset Code: ${otp}`;
    const text = `We received a request to reset your password for your DSK TaskMarketer account (${email}).\n\nYour 6-digit verification code is: ${otp}\n\nValid for 15 minutes. If you did not initiate this request, please contact support immediately.`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07152F; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
          .header { background: ${isAdmin ? 'linear-gradient(135deg, #991b1b 0%, #0a1e4c 100%)' : 'linear-gradient(135deg, #0a1e4c 0%, #1e40af 100%)'}; padding: 32px 24px; text-align: center; }
          .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; }
          .brand-sub { color: #ffd400; font-size: 13px; font-weight: 700; margin-top: 6px; }
          .content { padding: 32px 28px; color: #1e293b; line-height: 1.6; }
          .badge { display: inline-block; background: ${isAdmin ? '#e60012' : '#0057d9'}; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
          .otp-box { background: #f8fafc; border: 2px solid ${isAdmin ? '#e60012' : '#0057d9'}; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 38px; font-weight: 900; color: ${isAdmin ? '#e60012' : '#0057d9'}; letter-spacing: 8px; font-family: monospace; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand-title">DSK TaskMarketer</h1>
            <div class="brand-sub">${isAdmin ? 'Administrator Security Control' : 'Account Security'}</div>
          </div>
          <div class="content">
            <div class="badge">${isAdmin ? 'Admin Password Recovery' : 'Password Reset Request'}</div>
            <p>We received a request to reset your password for your DSK TaskMarketer account (<strong>${email}</strong>).</p>
            <p>Use the 6-digit verification code below to verify your identity and set a new secure password:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">Valid for 15 minutes</div>
            </div>

            <p style="font-size: 13px; color: #64748b;">If you did not initiate this password reset request, please ignore this email or contact support immediately.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} DSK TaskMarketer Security Services
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmailWithFallback(email, subject, html, text, isAdmin ? 'Administrator' : 'Member');
  }

  // =========================================================================
  // DIAGNOSTIC TEST CONNECTION (Tests Brevo -> Mailjet -> Resend)
  // =========================================================================
  public async testConnection(recipient?: string): Promise<{ success: boolean; message?: string; provider?: string; error?: string; details?: any }> {
    const status = this.getProviderStatus();
    if (!status.anyConfigured) {
      return {
        success: false,
        error: 'No email providers are configured. Please set BREVO_API_KEY, MAILJET_API_KEY/MAILJET_SECRET_KEY, or RESEND_API_KEY in server environment variables.'
      };
    }

    if (!recipient) {
      return {
        success: true,
        message: `Email system ready. Active providers: ${[
          status.brevoConfigured ? 'Brevo (Main)' : null,
          status.mailjetConfigured ? 'Mailjet (Backup 1)' : null,
          status.resendConfigured ? 'Resend (Backup 2)' : null
        ].filter(Boolean).join(', ')}`
      };
    }

    const subject = `DSK TaskMarketer - Multi-Provider Email Delivery Test`;
    const text = `This is a test email confirming that your DSK TaskMarketer HTTP API email delivery cascade is operational! Timestamp: ${new Date().toISOString()}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #0057d9; border-radius: 12px; background: #eff6ff;">
        <h2 style="color: #0b1f4d; margin: 0 0 10px;">Email Delivery Verified!</h2>
        <p style="color: #1e40af; font-size: 14px;">Your DSK TaskMarketer HTTP API email cascade is operational and ready to deliver real OTP emails.</p>
        <p style="font-size: 12px; color: #64748b;">Sent to: <strong>${recipient}</strong> at ${new Date().toLocaleString()}</p>
      </div>
    `;

    const result = await this.sendEmailWithFallback(recipient, subject, html, text, 'Administrator');
    if (result.success) {
      return {
        success: true,
        message: `Test email successfully delivered to ${recipient} via ${result.provider}!`,
        provider: result.provider,
        details: { provider: result.provider, messageId: result.messageId }
      };
    }

    return {
      success: false,
      error: result.error || 'Test email delivery failed across all providers.'
    };
  }
}

export const emailService = new EmailService();
