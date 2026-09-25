/**
 * DSK TaskMarketer - Email OTP Delivery Service
 * Implements sequential HTTP fallback:
 * 1. Brevo (Main / Priority 1) -> POST https://api.brevo.com/v3/smtp/email
 * 2. Mailjet (Backup 1 / Priority 2) -> POST https://api.mailjet.com/v3.1/send
 * 3. Resend (Backup 2 / Priority 3) -> POST https://api.resend.com/emails
 */

export interface EmailOTPResponse {
  success: boolean;
  provider?: 'Brevo' | 'Mailjet' | 'Resend';
  messageId?: string;
  error?: string;
}

export interface SendEmailOTPOptions {
  to: string;
  otp: string;
  userName?: string;
  type?: 'registration' | 'password_reset' | 'admin_recovery' | 'general';
  subject?: string;
  customHtml?: string;
  customText?: string;
}

/**
 * Resolves the verified sender email from server-side environment variables
 */
function getSenderEmail(): string {
  const raw = 
    (typeof process !== 'undefined' && (
      process.env?.SENDER_EMAIL ||
      process.env?.BREVO_SENDER_EMAIL ||
      process.env?.MAILJET_SENDER_EMAIL ||
      process.env?.RESEND_SENDER_EMAIL ||
      process.env?.SMTP_FROM ||
      process.env?.SMTP_USER ||
      process.env?.GMAIL_USER ||
      process.env?.ADMIN_EMAIL
    )) || 'dsktaskmarketer@gmail.com';

  const match = raw.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return raw.trim();
}

/**
 * Safely masks email address for diagnostic logs (e.g. us***@example.com)
 */
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const visible = name.slice(0, 2);
  return `${visible}***@${parts[1]}`;
}

/**
 * 1. Brevo HTTP API
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 * Headers: api-key: process.env.BREVO_API_KEY
 */
async function sendViaBrevo(
  to: string,
  subject: string,
  html: string,
  text: string,
  senderEmail: string,
  recipientName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = (typeof process !== 'undefined' ? process.env?.BREVO_API_KEY : '') || '';
  if (!apiKey.trim()) {
    return { success: false, error: 'BREVO_API_KEY is not configured' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey.trim(),
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
      signal: AbortSignal.timeout(8000)
    });

    const bodyText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(bodyText);
    } catch {}

    if (response.ok) {
      return {
        success: true,
        messageId: data.messageId || 'brevo-sent'
      };
    }

    return {
      success: false,
      error: data.message || data.error || `Brevo HTTP ${response.status}: ${response.statusText}`
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Brevo request error: ${err?.message || err}`
    };
  }
}

/**
 * 2. Mailjet HTTP API
 * Endpoint: POST https://api.mailjet.com/v3.1/send
 * Headers: Authorization: Basic Base64(MAILJET_API_KEY:MAILJET_SECRET_KEY)
 */
async function sendViaMailjet(
  to: string,
  subject: string,
  html: string,
  text: string,
  senderEmail: string,
  recipientName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = (typeof process !== 'undefined' ? process.env?.MAILJET_API_KEY : '') || '';
  const secretKey = (typeof process !== 'undefined' ? process.env?.MAILJET_SECRET_KEY : '') || '';

  if (!apiKey.trim() || !secretKey.trim()) {
    return { success: false, error: 'MAILJET_API_KEY or MAILJET_SECRET_KEY is not configured' };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${apiKey.trim()}:${secretKey.trim()}`).toString('base64');

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
      signal: AbortSignal.timeout(8000)
    });

    const bodyText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(bodyText);
    } catch {}

    if (response.ok) {
      const msg = data.Messages?.[0];
      if (msg && (msg.Status === 'success' || msg.Status === 'queued')) {
        const msgId = msg.To?.[0]?.MessageID ? String(msg.To[0].MessageID) : 'mailjet-sent';
        return { success: true, messageId: msgId };
      }
      if (msg && msg.Errors && msg.Errors.length > 0) {
        const errList = msg.Errors.map((e: any) => e.ErrorMessage).join('; ');
        return { success: false, error: `Mailjet error: ${errList}` };
      }
      return { success: true, messageId: 'mailjet-sent' };
    }

    return {
      success: false,
      error: data.ErrorMessage || data.message || `Mailjet HTTP ${response.status}: ${response.statusText}`
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Mailjet request error: ${err?.message || err}`
    };
  }
}

/**
 * 3. Resend HTTP API
 * Endpoint: POST https://api.resend.com/emails
 * Headers: Authorization: Bearer process.env.RESEND_API_KEY
 * Automatically retries with onboarding@resend.dev if custom domain is unverified
 */
async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text: string,
  senderEmail: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = (typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : '') || '';
  if (!apiKey.trim()) {
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
        'Authorization': `Bearer ${apiKey.trim()}`,
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

    const errorMsg = data.message || data.error?.message || '';
    if (!response.ok && (errorMsg.includes('not verified') || errorMsg.includes('domain') || response.status === 403)) {
      if (initialFrom !== `DSK TaskMarketer <onboarding@resend.dev>`) {
        console.warn(`[sendEmailOTP] Domain ${senderEmail} not verified in Resend. Retrying with onboarding@resend.dev...`);
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
    return {
      success: false,
      error: finalError
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Resend request error: ${err?.message || err}`
    };
  }
}

/**
 * Generates standard responsive HTML template for OTP emails
 */
function buildOtpEmailHtml(otp: string, name: string, type: 'registration' | 'password_reset' | 'admin_recovery' | 'general'): { subject: string; html: string; text: string } {
  const isAdmin = type === 'admin_recovery';
  const isReset = type === 'password_reset' || isAdmin;

  const subject = isReset 
    ? `[${isAdmin ? 'ADMIN SECURITY' : 'SECURITY'}] DSK TaskMarketer Password Reset Code: ${otp}`
    : `Your DSK TaskMarketer Verification Code: ${otp}`;

  const text = isReset
    ? `Hello ${name},\n\nWe received a request to reset your password for your DSK TaskMarketer account.\n\nYour 6-digit verification code is: ${otp}\n\nValid for 15 minutes. If you did not initiate this request, please contact support immediately.\n\nDSK TaskMarketer Security Services`
    : `Hello ${name},\n\nYour DSK TaskMarketer verification code is: ${otp}\n\nValid for 10 minutes. Do not share this code with anyone.\n\nDSK TaskMarketer - Complete Tasks • Earn Rewards • Grow Together`;

  const headerGradient = isAdmin 
    ? 'linear-gradient(135deg, #991b1b 0%, #0a1e4c 100%)' 
    : 'linear-gradient(135deg, #0a1e4c 0%, #1e40af 100%)';

  const badgeText = isAdmin 
    ? 'Admin Password Recovery' 
    : isReset 
      ? 'Password Reset Request' 
      : 'Email Verification';

  const badgeColor = isAdmin ? '#e60012' : '#0057d9';
  const accentColor = isReset ? '#e60012' : '#0057d9';
  const validityNotice = isReset ? 'Valid for 15 minutes • Do not share with anyone' : 'Valid for 10 minutes • Do not share with anyone';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07152F; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .header { background: ${headerGradient}; padding: 32px 24px; text-align: center; }
        .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .brand-sub { color: #ffd400; font-size: 13px; font-weight: 700; margin-top: 6px; }
        .content { padding: 32px 28px; color: #1e293b; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #eff6ff; border: 2px dashed ${accentColor}; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 38px; font-weight: 900; color: ${accentColor}; letter-spacing: 8px; font-family: monospace; }
        .otp-notice { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
        .badge { display: inline-block; background: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
        .security-card { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px; font-size: 12px; color: #854d0e; margin-top: 24px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand-title">DSK TaskMarketer</h1>
          <div class="brand-sub">${isAdmin ? 'Administrator Security Control' : 'Complete Tasks • Earn Rewards • Grow Together'}</div>
        </div>
        <div class="content">
          <div class="badge">${badgeText}</div>
          <div class="greeting">Hello ${name},</div>
          <p class="text">
            ${isReset 
              ? 'We received a request to reset your password. Use the 6-digit verification code below to verify your identity and set a new password:'
              : 'Thank you for registering on DSK TaskMarketer. Please enter the 6-digit verification code below to verify your email address and activate your account:'
            }
          </p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-notice">${validityNotice}</div>
          </div>

          <div class="security-card">
            <strong>Security Alert:</strong> DSK TaskMarketer administrators will never ask for your password, OTP, or UPI PIN via call, message, or email.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} DSK TaskMarketer Security Services.<br>
          Digital Success Key Performance & Affiliate Network
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html, text };
}

/**
 * Main function: sendEmailOTP
 * 
 * Sends a single OTP using sequential fallback order:
 * Brevo (Priority 1) -> Mailjet (Priority 2) -> Resend (Priority 3)
 * 
 * If a provider succeeds, it immediately returns and stops execution.
 * The same OTP is preserved across all fallback attempts.
 */
export async function sendEmailOTP(
  toOrOptions: string | SendEmailOTPOptions,
  otpArg?: string,
  userNameArg?: string,
  typeArg: 'registration' | 'password_reset' | 'admin_recovery' | 'general' = 'registration'
): Promise<EmailOTPResponse> {
  let to: string;
  let otp: string;
  let userName: string = 'Valued Member';
  let type: 'registration' | 'password_reset' | 'admin_recovery' | 'general' = 'registration';
  let customSubject: string | undefined;
  let customHtml: string | undefined;
  let customText: string | undefined;

  if (typeof toOrOptions === 'object') {
    to = toOrOptions.to;
    otp = toOrOptions.otp;
    userName = toOrOptions.userName || userName;
    type = toOrOptions.type || type;
    customSubject = toOrOptions.subject;
    customHtml = toOrOptions.customHtml;
    customText = toOrOptions.customText;
  } else {
    to = toOrOptions;
    otp = otpArg || '';
    userName = userNameArg || userName;
    type = typeArg;
  }

  if (!to || !otp) {
    return {
      success: false,
      error: 'Recipient email address and OTP code are required.'
    };
  }

  const senderEmail = getSenderEmail();
  const maskedTo = maskEmail(to);

  // Generate template unless custom content provided
  const template = buildOtpEmailHtml(otp, userName, type);
  const subject = customSubject || template.subject;
  const html = customHtml || template.html;
  const text = customText || template.text;

  const diagnosticErrors: string[] = [];

  // =========================================================================
  // STEP 1: ATTEMPT BREVO (PRIMARY)
  // =========================================================================
  if (typeof process !== 'undefined' && process.env?.BREVO_API_KEY?.trim()) {
    console.log(`[sendEmailOTP] [1/3] Attempting Brevo for ${maskedTo}...`);
    const brevoResult = await sendViaBrevo(to, subject, html, text, senderEmail, userName);
    if (brevoResult.success) {
      console.log(`[sendEmailOTP] ✓ Delivered successfully via Brevo (MessageId: ${brevoResult.messageId}) to ${maskedTo}`);
      return {
        success: true,
        provider: 'Brevo',
        messageId: brevoResult.messageId
      };
    }
    diagnosticErrors.push(`Brevo: ${brevoResult.error}`);
    console.warn(`[sendEmailOTP] ✗ Brevo failed for ${maskedTo}: ${brevoResult.error}. Falling back to Mailjet...`);
  } else {
    diagnosticErrors.push('Brevo: BREVO_API_KEY not configured');
    console.log(`[sendEmailOTP] [1/3] Brevo skipped (BREVO_API_KEY missing). Trying Mailjet...`);
  }

  // =========================================================================
  // STEP 2: ATTEMPT MAILJET (BACKUP 1)
  // =========================================================================
  if (
    typeof process !== 'undefined' && 
    process.env?.MAILJET_API_KEY?.trim() && 
    process.env?.MAILJET_SECRET_KEY?.trim()
  ) {
    console.log(`[sendEmailOTP] [2/3] Attempting Mailjet for ${maskedTo}...`);
    const mailjetResult = await sendViaMailjet(to, subject, html, text, senderEmail, userName);
    if (mailjetResult.success) {
      console.log(`[sendEmailOTP] ✓ Delivered successfully via Mailjet (MessageId: ${mailjetResult.messageId}) to ${maskedTo}`);
      return {
        success: true,
        provider: 'Mailjet',
        messageId: mailjetResult.messageId
      };
    }
    diagnosticErrors.push(`Mailjet: ${mailjetResult.error}`);
    console.warn(`[sendEmailOTP] ✗ Mailjet failed for ${maskedTo}: ${mailjetResult.error}. Falling back to Resend...`);
  } else {
    diagnosticErrors.push('Mailjet: MAILJET_API_KEY or MAILJET_SECRET_KEY not configured');
    console.log(`[sendEmailOTP] [2/3] Mailjet skipped (credentials missing). Trying Resend...`);
  }

  // =========================================================================
  // STEP 3: ATTEMPT RESEND (BACKUP 2)
  // =========================================================================
  if (typeof process !== 'undefined' && process.env?.RESEND_API_KEY?.trim()) {
    console.log(`[sendEmailOTP] [3/3] Attempting Resend for ${maskedTo}...`);
    const resendResult = await sendViaResend(to, subject, html, text, senderEmail);
    if (resendResult.success) {
      console.log(`[sendEmailOTP] ✓ Delivered successfully via Resend (MessageId: ${resendResult.messageId}) to ${maskedTo}`);
      return {
        success: true,
        provider: 'Resend',
        messageId: resendResult.messageId
      };
    }
    diagnosticErrors.push(`Resend: ${resendResult.error}`);
    console.error(`[sendEmailOTP] ✗ Resend failed for ${maskedTo}: ${resendResult.error}`);
  } else {
    diagnosticErrors.push('Resend: RESEND_API_KEY not configured');
    console.log(`[sendEmailOTP] [3/3] Resend skipped (RESEND_API_KEY missing).`);
  }

  // =========================================================================
  // STEP 4: ALL PROVIDERS FAILED
  // =========================================================================
  console.error(`[sendEmailOTP] Fatal: All 3 email providers failed for ${maskedTo}. Diagnostics: [${diagnosticErrors.join(' | ')}]`);
  return {
    success: false,
    error: 'Unable to deliver verification email. Please verify that at least one email provider (Brevo, Mailjet, or Resend) is configured with valid API keys.'
  };
}
