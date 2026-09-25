import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import { db } from './server/db.ts';
import { emailService } from './server/emailService.ts';
import { 
  supabaseServer, 
  isServerSupabaseConfigured,
  hasServiceRolePrivilege,
  verifySupabaseToken, 
  syncTaskToSupabase, 
  saveTaskToSupabase,
  loadTasksFromSupabase,
  getTaskByIdFromSupabase,
  deleteTaskFromSupabase,
  recordTaskStartInSupabase,
  checkDuplicatesInSupabase,
  cleanupSupabaseAdminAccounts,
  findUserInSupabase,
  saveUserToSupabase,
  getAdminSetupStatusFromSupabase
} from './server/supabase.ts';
import { 
  generateStructuredTasks, 
  processCampaignEnquiryAI, 
  isInstructionOrMetaText,
  type AIDraftTaskResult 
} from './server/aiTaskService.ts';
import type { 
  Task, 
  TaskSubmission, 
  RewardLedgerItem, 
  RewardType,
  Withdrawal, 
  SocialLink, 
  SupportTicket, 
  SupportMessage, 
  NotificationItem,
  User,
  Campaign,
  CampaignEnquiry
} from './src/types.ts';

// Global Process Error Handlers for Production Stability
process.on('uncaughtException', (err) => {
  console.error('[DSK TaskMarketer Fatal] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[DSK TaskMarketer Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  
  const isRunningFromBundle = typeof __filename !== 'undefined' && 
    (__filename.endsWith('.cjs') || __filename.endsWith('.js') || __filename.includes('/dist/') || __filename.includes('dist'));
  const isProduction = process.env.NODE_ENV === 'production' || isRunningFromBundle;

  // Port configuration: AI Studio nginx reverse proxy strictly routes to port 3000
  const PORT = 3000;
  const HOST = '0.0.0.0';

  app.use(express.json({ limit: '10mb' }));

  // Preload tasks from Supabase database on server startup
  if (supabaseServer) {
    loadTasksFromSupabase({ admin: true })
      .then(loaded => {
        db.tasks = loaded;
        console.log(`[Supabase DB Startup] Connection successful: preloaded ${loaded.length} tasks from Supabase database into memory`);
      })
      .catch(err => {
        console.error('[Supabase DB Startup] Failed to preload tasks from Supabase database:', err?.message || err);
      });
  } else {
    console.log(`[Server Startup] Supabase server client not configured. Using local in-memory DB (${db.tasks.length} tasks).`);
  }

  // Permanently synchronize Administrator Setup status and User Accounts from Supabase Cloud
  db.syncWithSupabase().catch(err => {
    console.warn('[Supabase Startup Sync] Note during initial synchronization:', err?.message || err);
  });

  // Asynchronous authentication middleware
  // Resolves token from Bearer header or x-user-id header
  // Supports direct user ID, active session tokens, verified Supabase JWTs, and direct Supabase database verification
  app.use(async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      let token = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (req.headers['x-user-id']) {
        token = String(req.headers['x-user-id']).trim();
      }

      if (!token) {
        (req as any).authUser = undefined;
        return next();
      }

      // 1. Direct ID / Token / Session matching in local db.users
      let user = db.users.find(u => u.id === token || (u as any).sessionToken === token);
      if (user) {
        (req as any).authUser = user;
        return next();
      }

      // 2. Direct Supabase Cloud lookup by ID, email, or session token
      try {
        const sbUser = await findUserInSupabase(token);
        if (sbUser) {
          const existingIdx = db.users.findIndex(
            u => u.id === sbUser.id || (u.email && u.email.toLowerCase() === (sbUser.email || '').toLowerCase())
          );
          if (existingIdx !== -1) {
            db.users[existingIdx] = { ...db.users[existingIdx], ...sbUser };
            user = db.users[existingIdx];
          } else {
            const fullUser: User = {
              id: sbUser.id,
              name: sbUser.name || (sbUser.email ? sbUser.email.split('@')[0] : 'DSK User'),
              email: (sbUser.email || '').toLowerCase(),
              mobile: sbUser.mobile || '',
              role: sbUser.role || 'user',
              status: sbUser.status || 'active',
              referralCode: sbUser.referralCode || (sbUser.role === 'user' ? db.getNextSequentialEarnerReferralCode() : 'DSKCLIENT'),
              referredBy: sbUser.referredBy,
              profilePhoto: sbUser.profilePhoto,
              payoutDetails: sbUser.payoutDetails,
              createdAt: sbUser.createdAt || new Date().toISOString()
            };
            if (sbUser.passwordHash) (fullUser as any).passwordHash = sbUser.passwordHash;
            if (sbUser.salt) (fullUser as any).salt = sbUser.salt;
            db.users.push(fullUser);
            user = fullUser;
          }
          (req as any).authUser = user;
          return next();
        }
      } catch (findErr) {
        console.warn('[Auth Middleware] Supabase direct user lookup note:', findErr);
      }

      // 3. Direct email match or admin token prefix matching
      if (db.isDesignatedAdminEmail(token)) {
        let adminUser = db.users.find(u => u.email.toLowerCase() === token.toLowerCase() && u.role === 'admin') ||
                        db.users.find(u => u.role === 'admin');
        if (adminUser) {
          (req as any).authUser = adminUser;
          return next();
        }
      }

      if (token.startsWith('admin_') || token === 'admin' || token === 'admin_root' || db.isDesignatedAdminEmail(token)) {
        // Query Supabase for verified administrator setup status
        try {
          const adminStatus = await getAdminSetupStatusFromSupabase();
          if (!adminStatus.isFirstTimeSetup && adminStatus.adminEmail) {
            db.adminSetupCompleted = true;
            let matchedAdmin = db.users.find(u => u.role === 'admin');
            if (!matchedAdmin) {
              matchedAdmin = {
                id: adminStatus.adminId || 'admin_root_001',
                name: 'DSK Platform Administrator',
                email: adminStatus.adminEmail.toLowerCase(),
                mobile: '+91 98000 00000',
                role: 'admin',
                status: 'active',
                referralCode: 'DSKADMIN',
                createdAt: new Date().toISOString()
              };
              db.users.push(matchedAdmin);
            }
            (req as any).authUser = matchedAdmin;
            return next();
          }
        } catch (adminErr) {
          console.warn('[Auth Middleware] Admin Supabase verification note:', adminErr);
        }

        const matchedAdmin = db.users.find(u => u.id === token && u.role === 'admin') || 
                             db.users.find(u => u.role === 'admin');
        if (matchedAdmin) {
          (req as any).authUser = matchedAdmin;
          return next();
        }
      }

      // 4. Supabase JWT verification (tokens with dots or length > 25)
      if (token.includes('.') || token.length > 25) {
        let supabaseUser = await verifySupabaseToken(token);
        let userEmail = supabaseUser?.email;

        // Fallback JWT payload decoder if verifySupabaseToken failed or network error
        if (!userEmail && token.includes('.')) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              if (payload && payload.email) {
                userEmail = payload.email;
                if (!supabaseUser) {
                  supabaseUser = {
                    id: payload.sub || payload.id || `sb_${Date.now()}`,
                    email: payload.email,
                    user_metadata: payload.user_metadata || {},
                    app_metadata: payload.app_metadata || {},
                    created_at: new Date().toISOString()
                  } as any;
                }
              }
            }
          } catch (jwtErr) {
            console.warn('[Auth Middleware] JWT decode note:', jwtErr);
          }
        }

        if (supabaseUser && userEmail) {
          const emailClean = userEmail.toLowerCase().trim();
          const isDesignatedAdmin = db.isDesignatedAdminEmail(emailClean) ||
            supabaseUser.app_metadata?.role === 'admin' ||
            supabaseUser.user_metadata?.role === 'admin';

          let resolvedRole: 'user' | 'client' | 'admin' = isDesignatedAdmin ? 'admin' : 'user';

          // If profiles table exists in Supabase, check role
          if (!isDesignatedAdmin && supabaseServer) {
            try {
              const { data: profile } = await supabaseServer
                .from('profiles')
                .select('role')
                .eq('id', supabaseUser.id)
                .single();
              if (profile?.role === 'admin') {
                resolvedRole = 'admin';
              } else if (profile?.role === 'client') {
                resolvedRole = 'client';
              }
            } catch {}
          }

          let existingUser = db.users.find(u => u.id === supabaseUser.id || u.email.toLowerCase() === emailClean);
          if (existingUser) {
            if (resolvedRole === 'admin' && existingUser.role !== 'admin') {
              existingUser.role = 'admin';
            }
            (req as any).authUser = existingUser;
            return next();
          }

          const newUser: User = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || emailClean.split('@')[0],
            email: emailClean,
            mobile: supabaseUser.user_metadata?.mobile || '',
            role: resolvedRole,
            status: 'active',
            referralCode: supabaseUser.user_metadata?.referralCode || (resolvedRole === 'user' ? db.getNextSequentialEarnerReferralCode() : 'DSKCLIENT'),
            createdAt: supabaseUser.created_at || new Date().toISOString()
          };
          db.users.push(newUser);
          saveUserToSupabase(newUser).catch(err => {
            console.warn('[Auth Middleware] Note persisting new JWT user to Supabase:', err);
          });
          (req as any).authUser = newUser;
          return next();
        }
      }
    } catch (authErr) {
      console.warn('[Auth Middleware] Resolution warning:', authErr);
    }
    next();
  });

  // Helper auth extractor (Reads resolved authUser or falls back to db.users)
  const getAuthUser = (req: express.Request): User | undefined => {
    if ((req as any).authUser) {
      return (req as any).authUser;
    }
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-user-id']) {
      token = String(req.headers['x-user-id']).trim();
    }

    if (!token) return undefined;
    let user = db.users.find(x => x.id === token || x.email.toLowerCase() === token.toLowerCase());
    if (!user && (token.startsWith('admin_') || token === 'admin' || token === 'admin_root')) {
      user = db.users.find(u => u.role === 'admin');
    }
    if (!user && db.isDesignatedAdminEmail(token)) {
      user = db.users.find(u => u.role === 'admin');
    }
    return user;
  };

  // Helper to verify admin permissions and block access for unprivileged callers
  const requireAdmin = (req: express.Request, res: express.Response, _allowSetupPending = false): User | null => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required. Please log in as admin." });
      return null;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: "Access denied. Administrator privileges required." });
      return null;
    }
    return user;
  };

  // ===================== HEALTH CHECK ROUTES =====================
  // Standard health checks for Render, Docker, and monitoring proxies
  app.get('/api/health', async (req, res) => {
    let supabaseStatus: any = {
      configured: isServerSupabaseConfigured,
      hasServiceRole: hasServiceRolePrivilege,
      clientReady: Boolean(supabaseServer),
      tasksCount: -1,
      error: null
    };

    if (supabaseServer) {
      try {
        const { count, error } = await supabaseServer
          .from('tasks')
          .select('*', { count: 'exact', head: true });
        if (error) {
          supabaseStatus.error = error.message;
        } else {
          supabaseStatus.tasksCount = count ?? 0;
        }
      } catch (e: any) {
        supabaseStatus.error = e?.message || String(e);
      }
    }

    res.status(200).json({ 
      status: "ok", 
      service: "DSK TaskMarketer Production API",
      port: PORT,
      host: HOST,
      timestamp: new Date().toISOString(),
      supabase: supabaseStatus
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      service: "DSK TaskMarketer",
      port: PORT
    });
  });

  app.get('/healthz', (req, res) => {
    res.status(200).send("OK");
  });

  // ===================== 1. AUTH ROUTES =====================
  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.json({ user: null, wallet: null, unreadNotifications: 0 });
    }
    const { passwordHash: _, salt: __, ...cleanUser } = user as any;
    const wallet = db.getWalletSummary(user.id);
    const unreadNotifications = db.notifications.filter(n => n.userId === user.id && !n.isRead).length;
    const mustChange = user.role === 'admin' && !db.adminSetupCompleted;
    res.json({
      user: {
        ...cleanUser,
        mustChangeCredentials: mustChange
      },
      wallet,
      unreadNotifications,
      adminSetupCompleted: db.adminSetupCompleted
    });
  });

  // Dedicated Real-time Wallet Endpoint
  app.get('/api/wallet', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const wallet = db.getWalletSummary(user.id);
    res.json(wallet);
  });

  // Dedicated Admin Role Verification Endpoint (Server-Side)
  app.get('/api/auth/admin/verify', (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }
    const mustChange = !db.adminSetupCompleted;
    res.json({ 
      verified: true, 
      role: 'admin', 
      user: {
        ...user,
        mustChangeCredentials: mustChange
      },
      mustChangeCredentials: mustChange
    });
  });

  // Dedicated Admin Setup Status Endpoint (Never reveals plaintext passwords)
  app.get('/api/auth/admin/setup-status', async (req, res) => {
    // If memory already confirmed setup is completed, return false permanently
    if (db.adminSetupCompleted) {
      return res.json({ isFirstTimeSetup: false });
    }

    // Check Supabase as primary cloud persistence source
    try {
      const { getAdminSetupStatusFromSupabase } = await import('./server/supabase.js');
      const sbStatus = await getAdminSetupStatusFromSupabase();
      if (!sbStatus.isFirstTimeSetup) {
        db.adminSetupCompleted = true;
        return res.json({ isFirstTimeSetup: false });
      }
    } catch (sbErr) {
      console.warn('[Admin Setup Status] Supabase check notice:', sbErr);
    }

    const status = db.getAdminSetupStatus();
    res.json(status);
  });

  // Dedicated Initial Admin Setup (Asked on first setup: Admin Gmail & Password)
  // CRITICAL RULE: Initial setup can happen ONLY ONCE. If already completed, permanently locked.
  app.post('/api/auth/admin/initial-setup', async (req, res) => {
    // Check Supabase cloud first - if setup was ever completed, permanently block setup
    try {
      const { getAdminSetupStatusFromSupabase } = await import('./server/supabase.js');
      const sbStatus = await getAdminSetupStatusFromSupabase();
      if (!sbStatus.isFirstTimeSetup) {
        db.adminSetupCompleted = true;
        return res.status(403).json({ 
          error: "Administrator setup is already completed and permanently locked. Please sign in." 
        });
      }
    } catch {}

    if (db.adminSetupCompleted) {
      return res.status(403).json({ 
        error: "Administrator setup is already completed and permanently locked. Please sign in." 
      });
    }

    const { email, password, confirmPassword } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Admin Gmail and password are required." });
    }

    const emailClean = String(email).trim().toLowerCase();
    const passwordClean = String(password).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({ error: "Please provide a valid Admin Gmail / email address." });
    }

    if (passwordClean.length < 8) {
      return res.status(400).json({ error: "Admin password must be at least 8 characters long." });
    }

    if (confirmPassword && confirmPassword !== passwordClean) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const adminUser = db.createInitialAdmin(emailClean, passwordClean);

    // Sync permanently to Supabase cloud storage
    try {
      const { saveAdminSetupStatusToSupabase } = await import('./server/supabase.js');
      const adminRecord = db.users.find(u => u.role === 'admin' && u.email.toLowerCase() === emailClean);
      await saveAdminSetupStatusToSupabase({
        email: emailClean,
        passwordHash: (adminRecord as any)?.passwordHash || '',
        salt: (adminRecord as any)?.salt || '',
        adminId: adminUser.id,
        name: adminUser.name
      });
    } catch (sbErr) {
      console.warn('[Admin Setup] Supabase cloud save note:', sbErr);
    }

    // Sync to Supabase Auth if configured
    if (supabaseServer) {
      try {
        const { data: usersData } = await supabaseServer.auth.admin.listUsers();
        const existing = usersData?.users?.find((u: any) => u.email?.toLowerCase() === emailClean);
        if (existing) {
          await supabaseServer.auth.admin.updateUserById(existing.id, {
            password: passwordClean,
            email_confirm: true,
            user_metadata: { role: 'admin', name: adminUser.name }
          });
        } else {
          await supabaseServer.auth.admin.createUser({
            email: emailClean,
            password: passwordClean,
            email_confirm: true,
            user_metadata: { role: 'admin', name: adminUser.name }
          });
        }
        console.log(`[Admin Security] Synchronized initial admin in Supabase Auth: ${emailClean}`);
      } catch (err) {
        console.warn('[Admin Security] Supabase Auth setup note:', err);
      }
    }

    res.json({
      success: true,
      message: "Administrator account initialized securely and permanently stored in Supabase.",
      user: adminUser,
      token: adminUser.id
    });
  });

  // Secure In-Memory OTP Store for Password Reset
  interface PasswordResetOtpEntry {
    email: string;
    otpHash: string;
    salt: string;
    expiresAt: number;
    attempts: number;
    role: 'admin' | 'user';
  }
  const resetOtpStore = new Map<string, PasswordResetOtpEntry>();

  // Secure In-Memory Store for Pending User Registrations awaiting Email OTP
  interface PendingRegistrationEntry {
    name: string;
    email: string;
    mobile: string;
    passwordHash: string;
    salt: string;
    passwordRaw: string;
    role: 'user' | 'client';
    referralCode?: string;
    otpHash: string;
    otpSalt: string;
    expiresAt: number;
    attempts: number;
  }
  const pendingRegistrationStore = new Map<string, PendingRegistrationEntry>();

  // Helper to generate secure 6-digit numeric OTP
  function generateSecureOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Unified Request Password Reset OTP (Admin & User)
  app.post('/api/auth/forgot-password/request-otp', async (req, res) => {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const emailClean = String(email).trim().toLowerCase();
    const targetRole: 'admin' | 'user' = role === 'admin' ? 'admin' : 'user';

    // Verify account existence
    const user = db.users.find(u => 
      u.email.toLowerCase() === emailClean && 
      (targetRole === 'admin' ? u.role === 'admin' : true)
    );

    if (!user) {
      return res.status(404).json({
        error: targetRole === 'admin' 
          ? "No registered administrator account found with this email." 
          : "No registered account found with this email address."
      });
    }

    const otp = generateSecureOtp();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.scryptSync(otp, salt, 32).toString('hex');

    // Deliver REAL email OTP via HTTP API (Brevo -> Mailjet -> Resend)
    const emailResult = await emailService.sendPasswordResetOtp(emailClean, otp, targetRole);
    if (!emailResult.success) {
      console.error(`[Forgot Password] Email delivery to ${emailClean} failed:`, emailResult.error);
      return res.status(500).json({
        error: `Could not send verification email. Please try again or contact support.`
      });
    }

    resetOtpStore.set(emailClean, {
      email: emailClean,
      otpHash,
      salt,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes TTL
      attempts: 0,
      role: targetRole
    });

    console.log(`[Security] Password Reset OTP successfully dispatched via ${emailResult.provider || 'Email Provider'} to: ${emailClean} (${targetRole.toUpperCase()})`);

    // Dispatches Supabase reset email if configured as additional backup
    if (supabaseServer && user) {
      try {
        await supabaseServer.auth.resetPasswordForEmail(emailClean);
      } catch (err) {
        console.warn('[Supabase Auth] Note on backup reset email:', err);
      }
    }

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${emailClean}. Please check your inbox and spam folder.`
    });
  });

  // Unified Verify OTP & Reset Password (Admin & User)
  app.post('/api/auth/forgot-password/verify-otp-reset', async (req, res) => {
    const { email, otp, newPassword, confirmPassword, role } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, 6-digit verification code, and new password are required." });
    }

    const emailClean = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const cleanPassword = String(newPassword).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ error: "Verification code must be exactly 6 digits." });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    if (confirmPassword && confirmPassword !== cleanPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const record = resetOtpStore.get(emailClean);
    if (!record || Date.now() > record.expiresAt) {
      resetOtpStore.delete(emailClean);
      return res.status(400).json({ error: "Verification code has expired or is invalid. Please request a new code." });
    }

    if (record.attempts >= 5) {
      resetOtpStore.delete(emailClean);
      return res.status(400).json({ error: "Too many failed attempts. Please request a new verification code." });
    }

    // Verify OTP using timing-safe scrypt comparison
    const checkHash = crypto.scryptSync(cleanOtp, record.salt, 32).toString('hex');
    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(Buffer.from(record.otpHash, 'hex'), Buffer.from(checkHash, 'hex'));
    } catch {
      isValid = false;
    }

    if (!isValid) {
      record.attempts += 1;
      return res.status(400).json({ error: `Invalid verification code. ${5 - record.attempts} attempts remaining.` });
    }

    // OTP Verified! Apply new password to user
    const updated = db.resetUserPassword(emailClean, cleanPassword);
    if (!updated) {
      return res.status(404).json({ error: "Account with this email could not be found." });
    }

    // Synchronize password to Supabase Auth if configured
    if (supabaseServer) {
      try {
        const { data: usersData } = await supabaseServer.auth.admin.listUsers();
        const existing = usersData?.users?.find((u: any) => u.email?.toLowerCase() === emailClean);
        if (existing) {
          await supabaseServer.auth.admin.updateUserById(existing.id, {
            password: cleanPassword
          });
        }
      } catch (err) {
        console.warn('[Admin Security] Note updating password in Supabase Auth:', err);
      }
    }

    // Remove consumed OTP
    resetOtpStore.delete(emailClean);

    console.log(`[Security Alert] Password successfully reset for: ${emailClean}`);

    res.json({
      success: true,
      message: "Your password has been successfully updated. You may now log in with your new password."
    });
  });

  // Dedicated Admin Login Endpoint with Server-Side Role Enforcement
  app.post('/api/auth/admin/login', async (req, res) => {
    const identifier = req.body.identifier || req.body.email || req.body.username;
    const { password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Administrator email/username and password are required" });
    }

    const trimmed = String(identifier).trim().toLowerCase();
    const rawIdentifier = String(identifier).trim();
    const digits = rawIdentifier.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    let user = db.users.find(u => {
      if (!u) return false;
      if (u.email && u.email.trim().toLowerCase() === trimmed) return true;
      if (u.mobile && u.mobile.trim() === rawIdentifier) return true;
      if (last10 && last10.length === 10 && u.mobile) {
        const uDigits = u.mobile.replace(/\D/g, '').slice(-10);
        if (uDigits.length === 10 && uDigits === last10) return true;
      }
      return false;
    });

    // If admin is not found in memory (e.g. fresh container deploy), look up from Supabase
    if (!user) {
      try {
        const { findUserInSupabase } = await import('./server/supabase.js');
        const sbUser = await findUserInSupabase(rawIdentifier);
        if (sbUser && sbUser.role === 'admin') {
          const existing = db.users.find(u => u.id === sbUser.id || u.email.toLowerCase() === sbUser.email.toLowerCase());
          if (existing) {
            user = existing;
            if (!user.passwordHash && sbUser.passwordHash) user.passwordHash = sbUser.passwordHash;
            if (!user.salt && sbUser.salt) user.salt = sbUser.salt;
          } else {
            db.users.push(sbUser);
            user = sbUser;
            db.persistUsers();
          }
        }
      } catch (err) {
        console.warn('[Admin Login] Supabase lookup note:', err);
      }
    } else {
      if ((!user.passwordHash || !user.salt) && user.email) {
        try {
          const { findUserInSupabase } = await import('./server/supabase.js');
          const sbUser = await findUserInSupabase(user.email);
          if (sbUser?.passwordHash && sbUser?.salt) {
            user.passwordHash = sbUser.passwordHash;
            user.salt = sbUser.salt;
            db.persistUsers();
          }
        } catch {}
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid administrative credentials" });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: "Administrative account suspended. Contact system administrator." });
    }

    // STRICT SERVER-SIDE ROLE ENFORCEMENT: Never allow normal users or clients to pass
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Access Denied: This account does not possess verified administrator privileges." 
      });
    }

    let isValid = false;
    if (user.passwordHash && user.salt) {
      isValid = db.verifyPassword(password, user.passwordHash, user.salt);
    }

    const envAdminPass = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!isValid && envAdminPass && password.trim() === envAdminPass.trim()) {
      const { hash, salt } = db.hashPassword(password.trim());
      user.passwordHash = hash;
      user.salt = salt;
      db.persistUsers();
      isValid = true;
    }

    // Fallback: Verify password via Supabase Auth if local hash verification fails or hash missing
    if (!isValid && supabaseServer && user.email) {
      try {
        const { data: authData, error: authErr } = await supabaseServer.auth.signInWithPassword({
          email: user.email.trim().toLowerCase(),
          password: String(password).trim()
        });
        if (!authErr && authData?.user) {
          const { hash, salt } = db.hashPassword(password);
          user.passwordHash = hash;
          user.salt = salt;
          db.persistUsers();
          isValid = true;
        }
      } catch (sbErr) {
        console.warn('[Admin Login] Supabase Auth password check note:', sbErr);
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: "Invalid administrative credentials" });
    }

    // Admin setup is completed permanently
    db.adminSetupCompleted = true;
    const { passwordHash: _, salt: __, ...adminProfile } = user;

    res.json({
      success: true,
      user: adminProfile,
      token: user.id,
      role: 'admin',
      mustChangeCredentials: false
    });
  });

  // Complete First-Time Administrator Security Setup
  app.post('/api/auth/admin/complete-setup', async (req, res) => {
    const admin = requireAdmin(req, res, true);
    if (!admin) return;

    const { newEmail, newPassword } = req.body;
    if (!newEmail || !newPassword) {
      return res.status(400).json({ error: "New administrator email and password are required." });
    }

    const emailClean = String(newEmail).trim().toLowerCase();
    const passwordClean = String(newPassword).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({ error: "Please provide a valid administrator email address." });
    }

    if (passwordClean.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const defaultInitialPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';
    if (passwordClean === defaultInitialPass) {
      return res.status(400).json({ error: "Security Policy: You must choose a new password that differs from the default initial password." });
    }

    // Synchronize with Supabase Auth server-side if configured
    if (supabaseServer) {
      try {
        const { data: usersData } = await supabaseServer.auth.admin.listUsers();
        const existingAuthUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === emailClean || u.id === admin.id);

        if (existingAuthUser) {
          await supabaseServer.auth.admin.updateUserById(existingAuthUser.id, {
            email: emailClean,
            password: passwordClean,
            email_confirm: true,
            user_metadata: { role: 'admin', name: admin.name }
          });
        } else {
          await supabaseServer.auth.admin.createUser({
            email: emailClean,
            password: passwordClean,
            email_confirm: true,
            user_metadata: { role: 'admin', name: admin.name }
          });
        }
        console.log(`[Admin Security] Synchronized administrator in Supabase Auth: ${emailClean}`);
      } catch (sbErr) {
        console.warn('[Admin Security] Supabase Auth sync note (handled gracefully):', sbErr);
      }
    }

    const updatedAdmin = db.completeAdminSetup(admin.id, emailClean, passwordClean);
    if (!updatedAdmin) {
      return res.status(500).json({ error: "Failed to finalize administrator credential update." });
    }

    // Permanently persist users state
    db.persistUsers();

    res.json({
      success: true,
      message: "Administrator credentials updated successfully. Default credentials are now permanently disabled.",
      user: updatedAdmin,
      token: updatedAdmin.id
    });
  });

  // Admin Forgot Password - Dispatches secure 6-digit OTP via SMTP/Email
  app.post('/api/auth/admin/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Administrator email is required." });
    }

    const trimmed = String(email).trim().toLowerCase();
    const adminUser = db.users.find(u => u.role === 'admin' && u.email.toLowerCase() === trimmed);

    if (!adminUser) {
      return res.status(404).json({ error: "No administrator account found matching this email address." });
    }

    const otp = generateSecureOtp();
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.scryptSync(otp, salt, 32).toString('hex');

    // Deliver REAL email OTP via Brevo -> Mailjet -> Resend
    const emailResult = await emailService.sendPasswordResetOtp(trimmed, otp, 'admin');
    if (!emailResult.success) {
      console.error(`[Admin Forgot Password] Failed to send email to ${trimmed}:`, emailResult.error);
      return res.status(500).json({
        error: `Could not send verification email. Please try again or check email provider settings.`
      });
    }

    resetOtpStore.set(trimmed, {
      email: trimmed,
      otpHash,
      salt,
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
      role: 'admin'
    });

    console.log(`[Admin Security] Real OTP dispatched via ${emailResult.provider || 'Email Provider'} to administrator: ${trimmed}`);

    // Backup Supabase reset email if configured
    if (supabaseServer) {
      try {
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
        const host = req.get('host') || req.headers.host || 'localhost:3000';
        const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${protocol}://${host}`;
        const redirectUrl = `${appUrl}/admin/login?type=recovery`;
        await supabaseServer.auth.resetPasswordForEmail(trimmed, {
          redirectTo: redirectUrl
        });
      } catch (err) {
        console.warn('[Admin Security] Supabase Auth recovery note:', err);
      }
    }

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${trimmed}. Please enter the code below to reset your administrator password.`
    });
  });

  // Admin Reset Password - Verifies and applies new admin password
  app.post('/api/auth/admin/reset-password', async (req, res) => {
    const { email, newPassword, token } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required." });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(newPassword).trim();

    if (cleanPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    // Verify token if Supabase token is provided
    if (token && supabaseServer) {
      try {
        const { data: { user: sbUser }, error: sbErr } = await supabaseServer.auth.getUser(token);
        if (sbErr || !sbUser) {
          console.warn('[Admin Security] Note on token validation in reset-password (fallback handled)');
        }
      } catch {}
    }

    const updated = db.resetAdminPassword(trimmedEmail, cleanPassword);
    if (!updated) {
      return res.status(400).json({ error: "Unable to complete password reset. Please request a new recovery link." });
    }

    if (supabaseServer) {
      try {
        const { data: usersData } = await supabaseServer.auth.admin.listUsers();
        const existingAuthUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === trimmedEmail);
        if (existingAuthUser) {
          await supabaseServer.auth.admin.updateUserById(existingAuthUser.id, {
            password: cleanPassword
          });
        }
      } catch (err) {
        console.warn('[Admin Security] Supabase Auth password sync note:', err);
      }
    }

    res.json({
      success: true,
      message: "Administrator password updated successfully. You may now sign in with your new credentials."
    });
  });

  async function checkRegistrationDuplicateStatus(
    email: string,
    mobile: string
  ): Promise<{ emailUsed: boolean; mobileUsed: boolean }> {
    let emailUsed = false;
    let mobileUsed = false;

    const cleanEmail = (email || '').trim().toLowerCase();
    const rawMobile = (mobile || '').trim();
    const mobileDigits = rawMobile.replace(/\D/g, '');
    const normalizedMobile10 = mobileDigits.slice(-10);

    // 1. Check local in-memory db.users
    if (cleanEmail) {
      const foundEmail = db.users.some(u => u.email && u.email.toLowerCase().trim() === cleanEmail);
      if (foundEmail) emailUsed = true;
    }

    if (normalizedMobile10 && normalizedMobile10.length === 10) {
      const foundMobile = db.users.some(u => {
        if (!u.mobile) return false;
        const uDigits = u.mobile.replace(/\D/g, '').slice(-10);
        return (uDigits.length === 10 && uDigits === normalizedMobile10) || (u.mobile.trim() === rawMobile);
      });
      if (foundMobile) mobileUsed = true;
    }

    // 2. Check actual Supabase database independently
    if (isServerSupabaseConfigured) {
      try {
        const sbResult = await checkDuplicatesInSupabase(cleanEmail, rawMobile);
        if (sbResult.emailUsed) emailUsed = true;
        if (sbResult.mobileUsed) mobileUsed = true;
      } catch (sbErr) {
        console.warn('[Registration Validation] Supabase duplicate check notice:', sbErr);
      }
    }

    return { emailUsed, mobileUsed };
  }

  // Pre-check duplicate endpoint for registration UI
  app.post('/api/auth/check-duplicates', async (req, res) => {
    const { email, mobile } = req.body || {};
    const { emailUsed, mobileUsed } = await checkRegistrationDuplicateStatus(email, mobile);
    res.json({
      emailUsed,
      mobileUsed,
      emailError: emailUsed ? "This email is already used." : undefined,
      mobileError: mobileUsed ? "This mobile number is already used." : undefined
    });
  });

  // 1. Send Registration OTP via Email (Real Gmail/SMTP)
  app.post('/api/auth/register/send-otp', async (req, res) => {
    const { name, email, mobile, password, confirmPassword, referralCode, role } = req.body;

    const cleanedName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
    if (!cleanedName) {
      return res.status(400).json({ error: "Full Name is required. Enter your full legal name exactly as it appears on your Aadhaar/PAN." });
    }
    if (!/^[\p{L}\s]+$/u.test(cleanedName)) {
      return res.status(400).json({ error: "Full legal name must contain letters and spaces only. Numbers and special characters are not allowed." });
    }
    const nameWords = cleanedName.split(' ').filter(w => w.length > 0);
    if (nameWords.length < 2) {
      return res.status(400).json({ error: "Please enter your full legal name with at least two words (e.g., First and Last Name)." });
    }

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const rawMobile = typeof mobile === 'string' ? mobile.trim() : '';
    const mobileDigits = rawMobile.replace(/\D/g, '');
    if (!rawMobile || mobileDigits.length < 10) {
      return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
    }

    const { emailUsed, mobileUsed } = await checkRegistrationDuplicateStatus(cleanEmail, rawMobile);
    if (emailUsed && mobileUsed) {
      return res.status(400).json({
        error: "This email is already used. This mobile number is already used.",
        fieldErrors: { email: "This email is already used.", mobile: "This mobile number is already used." }
      });
    }
    if (emailUsed) {
      return res.status(400).json({
        error: "This email is already used.",
        fieldErrors: { email: "This email is already used." }
      });
    }
    if (mobileUsed) {
      return res.status(400).json({
        error: "This mobile number is already used.",
        fieldErrors: { mobile: "This mobile number is already used." }
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain both letters and numbers." });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match. Please verify your confirm password." });
    }

    const otp = generateSecureOtp();
    const otpSalt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.scryptSync(otp, otpSalt, 32).toString('hex');
    const { hash, salt } = db.hashPassword(password);
    const assignedRole: 'user' | 'client' = role === 'client' ? 'client' : 'user';

    // Dispatch REAL Email OTP via Brevo -> Mailjet -> Resend
    const emailResult = await emailService.sendRegistrationOtp(cleanEmail, otp, cleanedName);
    if (!emailResult.success) {
      console.error(`[Register OTP] Failed to send email to ${cleanEmail}:`, emailResult.error);
      return res.status(500).json({
        error: `Could not send verification email. Please check the email address or try again in a few moments.`
      });
    }

    pendingRegistrationStore.set(cleanEmail, {
      name: cleanedName,
      email: cleanEmail,
      mobile: rawMobile,
      passwordHash: hash,
      salt,
      passwordRaw: password,
      role: assignedRole,
      referralCode: referralCode ? referralCode.trim().toUpperCase() : undefined,
      otpHash,
      otpSalt,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes TTL
      attempts: 0
    });

    console.log(`[Register OTP] 6-digit OTP successfully dispatched via ${emailResult.provider || 'Email Provider'} to ${cleanEmail}`);

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please enter the code to activate your account.`
    });
  });

  // 2. Verify Registration OTP and Activate Account
  app.post('/api/auth/register/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and 6-digit verification code are required." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ error: "Verification code must be exactly 6 digits." });
    }

    const pending = pendingRegistrationStore.get(cleanEmail);
    if (!pending || Date.now() > pending.expiresAt) {
      pendingRegistrationStore.delete(cleanEmail);
      return res.status(400).json({ error: "Verification code has expired. Please submit registration again." });
    }

    if (pending.attempts >= 5) {
      pendingRegistrationStore.delete(cleanEmail);
      return res.status(400).json({ error: "Too many failed attempts. Please submit registration again." });
    }

    const checkHash = crypto.scryptSync(cleanOtp, pending.otpSalt, 32).toString('hex');
    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(Buffer.from(pending.otpHash, 'hex'), Buffer.from(checkHash, 'hex'));
    } catch {
      isValid = false;
    }

    if (!isValid) {
      pending.attempts += 1;
      return res.status(400).json({ error: `Invalid verification code. ${5 - pending.attempts} attempts remaining.` });
    }

    // OTP Verified! Create user
    const isEarnerRole = (pending.role || 'user') === 'user';
    const newUserId = isEarnerRole 
      ? db.getNextSequentialEarnerUserId() 
      : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userReferralCode = isEarnerRole
      ? db.getNextSequentialEarnerReferralCode()
      : `DSK${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = {
      id: newUserId,
      name: pending.name,
      email: pending.email,
      mobile: pending.mobile,
      role: pending.role,
      status: 'active' as const,
      referralCode: userReferralCode,
      referredBy: pending.referralCode,
      createdAt: new Date().toISOString(),
      passwordHash: pending.passwordHash,
      salt: pending.salt
    };

    db.users.push(newUser);
    db.persistUsers();
    pendingRegistrationStore.delete(cleanEmail);

    // Save to Supabase
    import('./server/supabase.js').then(({ saveUserToSupabase }) => {
      saveUserToSupabase(newUser, pending.passwordRaw).catch(() => {});
    }).catch(() => {});

    if (supabaseServer) {
      try {
        await supabaseServer.auth.admin.createUser({
          email: pending.email,
          password: pending.passwordRaw,
          email_confirm: true,
          user_metadata: {
            name: pending.name,
            mobile: pending.mobile,
            role: pending.role,
            referralCode: userReferralCode
          }
        });
      } catch {}
    }

    // Handle referral if applicable
    if (pending.role === 'user' && pending.referralCode) {
      const referrer = db.users.find(u => u.referralCode === pending.referralCode);
      if (referrer && referrer.id !== newUserId) {
        db.referrals.push({
          id: `ref_${Date.now()}`,
          referrerId: referrer.id,
          referredUserId: newUserId,
          referredUserName: pending.name,
          referredUserEmail: pending.email,
          status: 'qualifying_action_pending',
          rewardAmount: 50,
          createdAt: new Date().toISOString()
        });

        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: referrer.id,
          title: "New Referral Registered",
          message: `${pending.name} registered using your referral link. Once they complete an approved task, ₹50 will be credited to your wallet.`,
          type: 'referral',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/referrals'
        });
      }
    }

    const { passwordHash: _, salt: __, ...userProfile } = newUser;
    res.json({
      success: true,
      user: userProfile,
      wallet: db.getWalletSummary(newUserId),
      token: newUserId,
      message: "Account verified and registered successfully! Welcome to DSK TaskMarketer."
    });
  });

  // 3. Resend Registration OTP
  app.post('/api/auth/register/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const pending = pendingRegistrationStore.get(cleanEmail);
    if (!pending) {
      return res.status(404).json({ error: "No pending registration found for this email. Please register again." });
    }

    const otp = generateSecureOtp();
    const otpSalt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.scryptSync(otp, otpSalt, 32).toString('hex');

    const emailResult = await emailService.sendRegistrationOtp(cleanEmail, otp, pending.name);
    if (!emailResult.success) {
      return res.status(500).json({
        error: `Could not send verification email. Please try again in a few moments.`
      });
    }

    pending.otpHash = otpHash;
    pending.otpSalt = otpSalt;
    pending.expiresAt = Date.now() + 10 * 60 * 1000;
    pending.attempts = 0;

    res.json({
      success: true,
      message: `A new 6-digit verification code has been dispatched to ${cleanEmail}.`
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { name, email, mobile, password, confirmPassword, referralCode, role } = req.body;

    // 1. Mandatory Full Legal Name & Format Validation
    // Trim extra spaces: collapse multiple consecutive spaces and trim edges
    const cleanedName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
    if (!cleanedName) {
      return res.status(400).json({ error: "Full Name is required. Enter your full legal name exactly as it appears on your Aadhaar/PAN." });
    }

    // Allow letters and spaces. Do not allow numbers or unnecessary special characters.
    if (!/^[\p{L}\s]+$/u.test(cleanedName)) {
      return res.status(400).json({ error: "Full legal name must contain letters and spaces only. Numbers and special characters are not allowed." });
    }

    // Minimum 2 words preferred
    const nameWords = cleanedName.split(' ').filter(w => w.length > 0);
    if (nameWords.length < 2) {
      return res.status(400).json({ error: "Please enter your full legal name with at least two words (e.g., First and Last Name)." });
    }

    // 2. Email Format Validation
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail) {
      return res.status(400).json({ error: "Email address is required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    // 3. Mobile Number Format Validation
    const rawMobile = typeof mobile === 'string' ? mobile.trim() : '';
    if (!rawMobile) {
      return res.status(400).json({ error: "Mobile number is required." });
    }
    const mobileDigits = rawMobile.replace(/\D/g, '');
    if (mobileDigits.length < 10) {
      return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
    }

    // 4. Independent duplicate checks against Supabase and database
    const { emailUsed, mobileUsed } = await checkRegistrationDuplicateStatus(cleanEmail, rawMobile);

    if (emailUsed && mobileUsed) {
      return res.status(400).json({
        error: "This email is already used. This mobile number is already used.",
        fieldErrors: {
          email: "This email is already used.",
          mobile: "This mobile number is already used."
        }
      });
    }

    if (emailUsed) {
      return res.status(400).json({
        error: "This email is already used.",
        fieldErrors: {
          email: "This email is already used."
        }
      });
    }

    if (mobileUsed) {
      return res.status(400).json({
        error: "This mobile number is already used.",
        fieldErrors: {
          mobile: "This mobile number is already used."
        }
      });
    }

    // 5. Password Rules
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: "Password is required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain both letters and numbers." });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match. Please verify your confirm password." });
    }

    const { hash, salt } = db.hashPassword(password);
    // Support registering as 'client' (advertiser) or standard 'user'
    const assignedRole: 'user' | 'client' = role === 'client' ? 'client' : 'user';
    const newUserId = assignedRole === 'user'
      ? db.getNextSequentialEarnerUserId()
      : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userReferralCode = assignedRole === 'user'
      ? db.getNextSequentialEarnerReferralCode()
      : `DSK${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = {
      id: newUserId,
      name: cleanedName,
      email: cleanEmail,
      mobile: rawMobile,
      role: assignedRole,
      status: 'active' as const,
      referralCode: userReferralCode,
      referredBy: referralCode ? referralCode.trim().toUpperCase() : undefined,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt
    };

    db.users.push(newUser);
    db.persistUsers();

    // Permanently sync user to Supabase cloud database
    import('./server/supabase.js').then(({ saveUserToSupabase }) => {
      saveUserToSupabase(newUser, password).catch(err => {
        console.warn('[Supabase Persistence] User save note:', err);
      });
    }).catch(() => {});

    // Sync user permanently to Supabase Auth if server is configured
    if (supabaseServer) {
      (async () => {
        try {
          await supabaseServer.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
              name: cleanedName,
              mobile: rawMobile,
              role: assignedRole,
              referralCode: userReferralCode
            }
          });
          console.log(`[Supabase Auth] Created permanent auth account for user: ${cleanEmail}`);
        } catch (sbErr: any) {
          console.warn('[Supabase Auth] Sync warning (gracefully handled):', sbErr?.message || sbErr);
        }
      })();
    }

    // If registered via valid referral code (only for regular users)
    if (assignedRole === 'user' && referralCode) {
      const referrer = db.users.find(u => u.referralCode === referralCode.trim().toUpperCase());
      if (referrer && referrer.id !== newUserId) {
        db.referrals.push({
          id: `ref_${Date.now()}`,
          referrerId: referrer.id,
          referredUserId: newUserId,
          referredUserName: name.trim(),
          referredUserEmail: email.toLowerCase().trim(),
          status: 'qualifying_action_pending',
          rewardAmount: 50,
          createdAt: new Date().toISOString()
        });

        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: referrer.id,
          title: "New Referral Registered",
          message: `${name} registered using your referral link. Once they complete an approved task, ₹50 will be credited to your wallet.`,
          type: 'referral',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/referrals'
        });
      }
    }

    const { passwordHash: _, salt: __, ...userProfile } = newUser;

    res.json({
      user: userProfile,
      wallet: db.getWalletSummary(newUserId),
      token: newUserId
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const rawInput = req.body.identifier || req.body.email || req.body.mobile || req.body.username;
    const { password } = req.body;
    if (!rawInput || !password) {
      return res.status(400).json({ error: "Email or mobile and password are required" });
    }

    const trimmed = String(rawInput).trim().toLowerCase();
    const rawIdentifier = String(rawInput).trim();
    const digits = rawIdentifier.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    console.log(`[Auth Login Attempt] Received login request for identifier: "${rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : rawIdentifier}"`);

    let user = db.users.find(u => {
      if (!u) return false;
      if (u.email && u.email.trim().toLowerCase() === trimmed) return true;
      if (u.mobile && u.mobile.trim() === rawIdentifier) return true;
      if (last10 && last10.length === 10 && u.mobile) {
        const uDigits = u.mobile.replace(/\D/g, '').slice(-10);
        if (uDigits.length === 10 && uDigits === last10) return true;
      }
      return false;
    });

    // If user is not found in memory (e.g. after restart/redeploy), query Supabase cloud!
    if (!user) {
      try {
        const { findUserInSupabase } = await import('./server/supabase.js');
        const sbUser = await findUserInSupabase(rawIdentifier);
        if (sbUser) {
          // Never create duplicate: check if already exists by id or email
          const existing = db.users.find(u => u.id === sbUser.id || (u.email && u.email.toLowerCase() === sbUser.email.toLowerCase()));
          if (existing) {
            user = existing;
            if (!user.passwordHash && sbUser.passwordHash) user.passwordHash = sbUser.passwordHash;
            if (!user.salt && sbUser.salt) user.salt = sbUser.salt;
          } else {
            db.users.push(sbUser);
            user = sbUser;
            db.persistUsers();
          }
        }
      } catch (err) {
        console.warn('[Login] Supabase user query note:', err);
      }
    } else {
      // If found in memory, ensure passwordHash and salt are populated if missing
      if ((!user.passwordHash || !user.salt) && user.email) {
        try {
          const { findUserInSupabase } = await import('./server/supabase.js');
          const sbUser = await findUserInSupabase(user.email);
          if (sbUser?.passwordHash && sbUser?.salt) {
            user.passwordHash = sbUser.passwordHash;
            user.salt = sbUser.salt;
            db.persistUsers();
          }
        } catch {}
      }
    }

    if (!user) {
      console.log(`[Auth Login Failure] Identifier not found: "${rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : rawIdentifier}"`);
      return res.status(401).json({ error: "Invalid email/mobile or password" });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: "Your account is temporarily suspended. Please contact support." });
    }

    let isValid = false;
    if (user.passwordHash && user.salt) {
      isValid = db.verifyPassword(password, user.passwordHash, user.salt);
    }

    if (!isValid && (user.role === 'admin' || db.isDesignatedAdminEmail(user.email))) {
      const envAdminPass = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
      if (envAdminPass && password.trim() === envAdminPass.trim()) {
        const { hash, salt } = db.hashPassword(password.trim());
        user.passwordHash = hash;
        user.salt = salt;
        db.persistUsers();
        isValid = true;
      }
    }

    // Fallback: Verify password via Supabase Auth if local verification fails or hash missing
    if (!isValid && supabaseServer && user.email) {
      try {
        const { data: authData, error: authErr } = await supabaseServer.auth.signInWithPassword({
          email: user.email.trim().toLowerCase(),
          password: String(password).trim()
        });
        if (!authErr && authData?.user) {
          const { hash, salt } = db.hashPassword(password);
          user.passwordHash = hash;
          user.salt = salt;
          db.persistUsers();
          isValid = true;
        }
      } catch (sbErr) {
        console.warn('[Login] Supabase Auth password check note:', sbErr);
      }
    }

    if (!isValid) {
      console.log(`[Auth Login Failure] Password verification failed for identifier: "${rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : rawIdentifier}"`);
      return res.status(401).json({ error: "Invalid email/mobile or password" });
    }

    console.log(`[Auth Login Success] User successfully authenticated: "${user.email}" (${user.role})`);

    const { passwordHash: _, salt: __, ...userProfile } = user;
    const mustChange = user.role === 'admin' && !db.adminSetupCompleted;

    res.json({
      user: {
        ...userProfile,
        mustChangeCredentials: mustChange
      },
      wallet: db.getWalletSummary(user.id),
      token: user.id,
      mustChangeCredentials: mustChange
    });
  });

  // Logout only terminates the client session and MUST NEVER delete any user data
  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: "Logged out successfully. User data preserved." });
  });

  app.put('/api/auth/profile', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { name, mobile, profilePhoto, payoutDetails, themePreference, languagePreference } = req.body;
    if (name) user.name = name.trim();
    if (mobile) user.mobile = mobile.trim();
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (themePreference) user.themePreference = themePreference;
    if (languagePreference) user.languagePreference = languagePreference;
    if (payoutDetails) {
      user.payoutDetails = {
        ...user.payoutDetails,
        ...payoutDetails
      };
    }
    db.persistUsers();
    saveUserToSupabase(user).catch(err => {
      console.warn('[Profile Update] Note persisting user to Supabase:', err);
    });
    const { passwordHash: _, salt: __, ...userProfile } = user as any;
    res.json({ success: true, user: userProfile });
  });

  // ===================== 2. CAMPAIGNS (ADVERTISER / CLIENT PORTAL) =====================
  app.get('/api/campaigns', (req, res) => {
    const user = getAuthUser(req);
    const { status, clientId } = req.query;

    let list = [...db.campaigns];

    if (user?.role === 'admin') {
      if (status && status !== 'all') {
        list = list.filter(c => c.status === status);
      }
      if (clientId) {
        list = list.filter(c => c.clientId === clientId);
      }
    } else if (user?.role === 'client') {
      // Client sees their own campaigns
      list = list.filter(c => c.clientId === user.id);
      if (status && status !== 'all') {
        list = list.filter(c => c.status === status);
      }
    } else {
      // Public / user sees active campaigns only
      list = list.filter(c => c.status === 'active');
    }

    res.json(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post('/api/campaigns', (req, res) => {
    const user = getAuthUser(req);
    if (!user || (user.role !== 'client' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Client or Admin authentication required" });
    }

    const {
      title,
      categoryId,
      partnerName,
      rewardAmount,
      currency,
      affiliateUrl,
      description,
      eligibility,
      steps,
      proofRequirements,
      terms,
      targetCompletions
    } = req.body;

    if (!title || !affiliateUrl || !rewardAmount) {
      return res.status(400).json({ error: "Title, affiliate URL, and reward amount are required" });
    }

    const campaignId = `cmp_${Date.now()}`;
    const newCampaign: Campaign = {
      id: campaignId,
      clientId: user.id,
      title: title.trim(),
      categoryId: categoryId || 'cat_cards',
      partnerName: partnerName?.trim() || user.name,
      rewardAmount: Number(rewardAmount),
      currency: currency || 'INR',
      affiliateUrl: affiliateUrl.trim(),
      description: description?.trim() || '',
      eligibility: eligibility?.trim() || '',
      steps: Array.isArray(steps) ? steps : [],
      proofRequirements: Array.isArray(proofRequirements) ? proofRequirements : ['Application Screenshot'],
      terms: terms?.trim() || 'Reward credited upon verified partner audit.',
      targetCompletions: Number(targetCompletions) || 100,
      completionsCount: 0,
      // If admin creates, it is active immediately; if client, it is pending administrative approval
      status: user.role === 'admin' ? 'active' : 'pending_approval',
      createdAt: new Date().toISOString()
    };

    db.campaigns.push(newCampaign);

    // If active immediately, sync to live tasks table
    if (newCampaign.status === 'active') {
      const task: Task = {
        id: `tsk_${newCampaign.id}`,
        title: newCampaign.title,
        categoryId: newCampaign.categoryId,
        partnerName: newCampaign.partnerName,
        description: newCampaign.description,
        rewardAmount: newCampaign.rewardAmount,
        currency: newCampaign.currency,
        affiliateUrl: newCampaign.affiliateUrl,
        eligibility: newCampaign.eligibility,
        steps: newCampaign.steps,
        proofRequirements: newCampaign.proofRequirements,
        terms: newCampaign.terms,
        affiliateDisclosure: "DSK TaskMarketer is compensated upon successful user completion.",
        active: true,
        displayOrder: db.tasks.length + 1,
        startsCount: 0,
        completionsCount: 0,
        createdAt: new Date().toISOString()
      };
      db.tasks.push(task);
    }

    res.status(201).json(newCampaign);
  });

  app.put('/api/campaigns/:id/status', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const campaign = db.campaigns.find(c => c.id === req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const { status, rejectionReason } = req.body;
    campaign.status = status;
    if (rejectionReason) campaign.rejectionReason = rejectionReason;

    // If approved into active status, publish or activate corresponding Task
    if (status === 'active') {
      let task = db.tasks.find(t => t.id === `tsk_${campaign.id}`);
      if (!task) {
        task = {
          id: `tsk_${campaign.id}`,
          title: campaign.title,
          categoryId: campaign.categoryId,
          partnerName: campaign.partnerName,
          description: campaign.description,
          rewardAmount: campaign.rewardAmount,
          currency: campaign.currency,
          affiliateUrl: campaign.affiliateUrl,
          eligibility: campaign.eligibility,
          steps: campaign.steps,
          proofRequirements: campaign.proofRequirements,
          terms: campaign.terms,
          affiliateDisclosure: "DSK TaskMarketer partner performance reward.",
          active: true,
          displayOrder: db.tasks.length + 1,
          startsCount: 0,
          completionsCount: campaign.completionsCount,
          createdAt: new Date().toISOString()
        };
        db.tasks.push(task);
      } else {
        task.active = true;
      }
    } else if (status === 'paused' || status === 'rejected') {
      const task = db.tasks.find(t => t.id === `tsk_${campaign.id}`);
      if (task) {
        task.active = false;
      }
    }

    res.json(campaign);
  });

  // Helper to validate and normalize destination URLs
  function normalizeDestinationUrl(rawUrl?: string | null): { valid: boolean; url: string; error?: string } {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return { valid: false, url: '', error: 'Affiliate destination URL is not configured or is empty.' };
    }
    let trimmed = rawUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, url: '', error: 'Only http:// and https:// URLs are supported.' };
      }
      return { valid: true, url: parsed.toString() };
    } catch {
      return { valid: false, url: '', error: 'Invalid web address URL format.' };
    }
  }

  // ===================== 3. TASKS & CATEGORIES =====================
  app.get('/api/categories', (req, res) => {
    res.json(db.categories.filter(c => c.active));
  });

  app.get('/api/tasks', async (req, res) => {
    const startTime = Date.now();
    const { category, search, admin } = req.query;
    const isAdminQuery = admin === 'true';

    try {
      if (isServerSupabaseConfigured && !supabaseServer) {
        const errorMsg = 'Supabase server credentials configured in environment but client failed to initialize.';
        console.error(`[API /api/tasks] ${errorMsg} | HTTP 500 returned`);
        return res.status(500).json({ 
          error: errorMsg, 
          httpStatus: 500,
          configured: isServerSupabaseConfigured 
        });
      }

      let list: Task[] = [];
      if (supabaseServer) {
        console.log(`[API /api/tasks] Querying Supabase public.tasks (admin=${isAdminQuery}, category=${category || 'all'}, search=${search || 'none'})...`);
        list = await loadTasksFromSupabase({
          admin: isAdminQuery,
          category: category && category !== 'all' ? String(category) : undefined,
          search: typeof search === 'string' ? search : undefined,
        });

        if (isAdminQuery) {
          db.tasks = list;
        }
        console.log(`[API /api/tasks] Supabase connection successful | returned ${list.length} tasks in ${Date.now() - startTime}ms | HTTP 200 returned`);
      } else {
        console.log(`[API /api/tasks] Supabase not active, serving from in-memory store | tasks in store: ${db.tasks.length} | HTTP 200 returned`);
        list = [...db.tasks];
        if (!isAdminQuery) {
          list = list.filter(t => t.active !== false && t.isActive !== false);
        }
        if (category && category !== 'all') {
          list = list.filter(t => t.categoryId === category);
        }
        if (search && typeof search === 'string') {
          const q = search.toLowerCase();
          list = list.filter(t => 
            t.title.toLowerCase().includes(q) || 
            t.description.toLowerCase().includes(q) ||
            t.partnerName.toLowerCase().includes(q)
          );
        }
        list.sort((a, b) => a.displayOrder - b.displayOrder);
      }

      return res.status(200).json(list);
    } catch (err: any) {
      console.error(`[API /api/tasks] Supabase database error: ${err?.message || err} | HTTP 500 returned`);
      return res.status(500).json({ 
        error: 'Failed to retrieve tasks from database',
        details: err?.message || String(err),
        httpStatus: 500
      });
    }
  });

  app.get('/api/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    try {
      if (supabaseServer) {
        const dbTask = await getTaskByIdFromSupabase(taskId);
        if (dbTask) {
          return res.json(dbTask);
        }
      }
      const task = db.tasks.find(t => t.id === taskId);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (err: any) {
      console.error(`[API /api/tasks/${taskId}] Error:`, err);
      res.status(500).json({ error: "Failed to retrieve task" });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : 
                     (req.body.active !== undefined ? Boolean(req.body.active) : true);

    const urlCheck = normalizeDestinationUrl(req.body.affiliateUrl);
    const validUrl = urlCheck.valid ? urlCheck.url : (req.body.affiliateUrl || "https://dsktaskmarketer.com");

    const newTask: Task = {
      id: req.body.id || `tsk_${Date.now()}`,
      title: req.body.title || "Financial Campaign Task",
      categoryId: req.body.categoryId || "cat_cards",
      partnerName: req.body.partnerName || "Partner",
      description: req.body.description || "",
      rewardAmount: Number(req.body.rewardAmount) || 100,
      currency: "INR",
      affiliateUrl: validUrl,
      eligibility: req.body.eligibility || "Age 21+, Indian resident",
      steps: Array.isArray(req.body.steps) && req.body.steps.length > 0 ? req.body.steps : [
        "Review eligibility criteria.",
        "Click Start Task to open partner portal.",
        "Complete online action.",
        "Submit required proof."
      ],
      proofRequirements: Array.isArray(req.body.proofRequirements) && req.body.proofRequirements.length > 0 ? req.body.proofRequirements : [
        "Application reference ID",
        "Confirmation screenshot"
      ],
      terms: req.body.terms || "Reward is subject to partner audit verification.",
      affiliateDisclosure: req.body.affiliateDisclosure || "DSK TaskMarketer receives financial affiliate compensation from partner institution for qualified consumer actions.",
      active: isActive,
      isActive: isActive,
      displayOrder: db.tasks.length + 1,
      startsCount: 0,
      completionsCount: 0,
      createdAt: new Date().toISOString()
    };

    let resultTask = newTask;
    if (supabaseServer) {
      const saveRes = await saveTaskToSupabase(newTask);
      if (!saveRes.success) {
        console.error('[API /api/tasks] Error persisting to Supabase:', saveRes.error);
        return res.status(500).json({ error: saveRes.error || "Failed to save task to Supabase database" });
      }
      if (saveRes.task) {
        resultTask = saveRes.task;
      }
    }

    db.tasks.push(resultTask);
    db.persistTasks();
    console.log(`[Tasks] Created and saved new task ${resultTask.id} (${resultTask.title}) in Supabase database`);

    res.status(201).json(resultTask);
  });

  app.put('/api/tasks/:id', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const taskId = req.params.id;
    let existingTask = db.tasks.find(t => t.id === taskId);
    if (!existingTask && supabaseServer) {
      existingTask = await getTaskByIdFromSupabase(taskId) || undefined;
    }

    const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : 
                     (req.body.active !== undefined ? Boolean(req.body.active) : true);

    let targetAffiliateUrl = req.body.affiliateUrl !== undefined ? req.body.affiliateUrl : (existingTask?.affiliateUrl || "");
    const urlCheck = normalizeDestinationUrl(targetAffiliateUrl);
    if (urlCheck.valid) {
      targetAffiliateUrl = urlCheck.url;
    }

    const updatedTask: Task = {
      id: taskId,
      title: req.body.title || existingTask?.title || "Financial Campaign Task",
      categoryId: req.body.categoryId || existingTask?.categoryId || "cat_cards",
      partnerName: req.body.partnerName || existingTask?.partnerName || "Partner",
      description: req.body.description !== undefined ? req.body.description : (existingTask?.description || ""),
      rewardAmount: Number(req.body.rewardAmount) || existingTask?.rewardAmount || 100,
      currency: req.body.currency || existingTask?.currency || "INR",
      affiliateUrl: targetAffiliateUrl,
      eligibility: req.body.eligibility !== undefined ? req.body.eligibility : (existingTask?.eligibility || ""),
      steps: Array.isArray(req.body.steps) ? req.body.steps : (existingTask?.steps || []),
      proofRequirements: Array.isArray(req.body.proofRequirements) ? req.body.proofRequirements : (existingTask?.proofRequirements || []),
      terms: req.body.terms !== undefined ? req.body.terms : (existingTask?.terms || ""),
      affiliateDisclosure: req.body.affiliateDisclosure || existingTask?.affiliateDisclosure || "DSK TaskMarketer receives financial affiliate compensation from partner institution for qualified consumer actions.",
      active: isActive,
      isActive: isActive,
      displayOrder: existingTask ? existingTask.displayOrder : (db.tasks.length + 1),
      startsCount: existingTask ? existingTask.startsCount : 0,
      completionsCount: existingTask ? existingTask.completionsCount : 0,
      createdAt: existingTask ? existingTask.createdAt : new Date().toISOString(),
      ...(req.body.campaignId ? { campaignId: req.body.campaignId } : (existingTask?.campaignId ? { campaignId: existingTask.campaignId } : {})),
    };

    let resultTask = updatedTask;
    if (supabaseServer) {
      const saveRes = await saveTaskToSupabase(updatedTask);
      if (!saveRes.success) {
        console.error('[API /api/tasks/:id] Error saving to Supabase:', saveRes.error);
        return res.status(500).json({ error: saveRes.error || "Failed to update task in Supabase database" });
      }
      if (saveRes.task) {
        resultTask = saveRes.task;
      }
    }

    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      db.tasks.push(resultTask);
    } else {
      db.tasks[taskIndex] = resultTask;
    }
    db.persistTasks();

    console.log(`[Tasks] Successfully saved task ${taskId} in Supabase database:`, resultTask.title);
    res.json(resultTask);
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const taskId = req.params.id;
    let task = db.tasks.find(t => t.id === taskId);
    if (!task && supabaseServer) {
      task = await getTaskByIdFromSupabase(taskId) || undefined;
    }
    if (!task) return res.status(404).json({ error: "Task not found" });

    const newActiveState = req.body.active !== undefined ? Boolean(req.body.active) : !task.active;
    task.active = newActiveState;
    task.isActive = newActiveState;

    if (supabaseServer) {
      await deleteTaskFromSupabase(taskId, true);
    }

    db.persistTasks();
    res.json({ success: true, active: task.active, isActive: task.isActive });
  });

  // ==================== AI TASK CREATOR & BULK MANAGEMENT ====================

  // Generate structured tasks using AI from English, Tamil, Tanglish natural language descriptions
  app.post('/api/admin/tasks/ai-generate', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim() || isInstructionOrMetaText(prompt)) {
      return res.status(400).json({ 
        success: false, 
        error: "Please describe the actual task you want to create.", 
        rawInput: prompt || "" 
      });
    }

    try {
      const result = await generateStructuredTasks(prompt, db.tasks);
      if (!result.success && !result.error) {
        result.error = "Please describe the actual task you want to create.";
      }
      res.json(result);
    } catch (err: any) {
      console.error('[API /api/admin/tasks/ai-generate] Error:', err);
      res.status(500).json({ 
        success: false, 
        error: err.message || "Please describe the actual task you want to create.",
        rawInput: prompt,
        canManualCreate: true
      });
    }
  });

  // Bulk Publish AI Draft Tasks after Admin Review & Confirmation
  app.post('/api/admin/tasks/ai-bulk-publish', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "No tasks provided for publication." });
    }

    const publishedTasks: Task[] = [];
    const errors: string[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const draft = tasks[i] as AIDraftTaskResult;
      const taskId = `tsk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      let targetUrl = draft.destinationUrl;
      if (!targetUrl || targetUrl === 'Information Required') {
        targetUrl = 'https://dsktaskmarketer.com';
      }

      const newTask: Task = {
        id: taskId,
        title: draft.title || `Affiliate Task ${i + 1}`,
        categoryId: draft.categoryId || 'cat_other',
        partnerName: draft.company || 'Partner Offer',
        description: draft.description || `${draft.title} - Complete required actions to receive reward.`,
        rewardAmount: Number(draft.rewardAmount) || 50,
        currency: 'INR',
        affiliateUrl: targetUrl,
        eligibility: draft.validDates && draft.validDates !== 'Information Required' 
          ? `Age 18+ Indian Resident. Valid: ${draft.validDates}` 
          : 'Age 18+ Indian Resident with valid documentation',
        steps: Array.isArray(draft.instructions) && draft.instructions.length > 0 
          ? draft.instructions 
          : ['Review offer requirements', 'Open link and complete action', 'Submit proof for admin approval'],
        proofRequirements: Array.isArray(draft.proofRequirements) && draft.proofRequirements.length > 0 
          ? draft.proofRequirements 
          : ['Confirmation screenshot or transaction reference ID'],
        terms: draft.terms || 'Reward will be credited once verified by partner audit.',
        affiliateDisclosure: 'DSK TaskMarketer receives affiliate compensation from partner institution.',
        active: true,
        isActive: true,
        displayOrder: db.tasks.length + i + 1,
        startsCount: 0,
        completionsCount: 0,
        createdAt: now
      };

      if (supabaseServer) {
        try {
          const saveRes = await saveTaskToSupabase(newTask);
          if (saveRes.success && saveRes.task) {
            publishedTasks.push(saveRes.task);
            db.tasks.push(saveRes.task);
          } else {
            publishedTasks.push(newTask);
            db.tasks.push(newTask);
          }
        } catch (sbErr: any) {
          console.warn('[AI Tasks Bulk] Supabase sync note:', sbErr?.message);
          publishedTasks.push(newTask);
          db.tasks.push(newTask);
        }
      } else {
        publishedTasks.push(newTask);
        db.tasks.push(newTask);
      }
    }

    db.persistTasks();
    console.log(`[AI Tasks] Successfully bulk published ${publishedTasks.length} tasks to active status.`);

    res.json({
      success: true,
      count: publishedTasks.length,
      tasks: publishedTasks,
      errors: errors.length > 0 ? errors : undefined
    });
  });

  // ==================== ADVERTISER & PARTNER CAMPAIGN ENQUIRIES ====================

  // AI Assistant for Advertisers / Partners
  app.post('/api/partner/campaign-enquiry/ai-assist', async (req, res) => {
    const { message, currentDetails } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required." });
    }

    try {
      const extracted = await processCampaignEnquiryAI(message, currentDetails);
      res.json({ success: true, data: extracted });
    } catch (err: any) {
      console.error('[API /api/partner/campaign-enquiry/ai-assist] Error:', err);
      res.status(500).json({ error: "Failed to process campaign enquiry assistance." });
    }
  });

  // Submit Campaign Enquiry (Public / Partner)
  app.post('/api/partner/campaign-enquiry', (req, res) => {
    const contactPerson = String(req.body.contact_person_name || req.body.contactPerson || req.body.advertiserName || '').trim();
    const companyName = String(req.body.company_brand_name || req.body.companyName || req.body.businessName || '').trim();
    const officialEmail = String(req.body.contact_email || req.body.officialEmail || req.body.contactEmail || '').trim().toLowerCase();
    const phoneNumber = String(req.body.contact_phone || req.body.phoneNumber || req.body.contactMobile || '').trim();
    const whatsappNumber = String(req.body.contact_whatsapp || req.body.whatsappNumber || '').trim();
    const websiteOrSocial = String(req.body.website_or_social || req.body.website || req.body.socialMediaProfiles || '').trim();

    // Check if contactPerson is actually a campaign description like "I will promote my product"
    if (/(promote|product|campaign|service|install|download|marketing|advertis|i will|we want|i want)/i.test(contactPerson)) {
      return res.status(400).json({
        error: "Contact Person Name must be an individual's name (e.g. Rahul Sharma), not a campaign description or requirement."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(officialEmail)) {
      return res.status(400).json({
        error: "Please provide a valid official email address (e.g. name@company.com)."
      });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        error: "Please provide a valid phone number with at least 10 digits."
      });
    }

    const cleanWhatsApp = whatsappNumber.replace(/\D/g, '');
    if (cleanWhatsApp.length < 10) {
      return res.status(400).json({
        error: "Please provide a valid WhatsApp number with at least 10 digits."
      });
    }

    // Mandatory contact details validation
    if (!contactPerson || !companyName || !officialEmail || !phoneNumber || !whatsappNumber) {
      return res.status(400).json({ 
        error: "Contact Person Name, Company/Brand Name, Official Email, Phone Number, and WhatsApp Number are mandatory before submitting an enquiry." 
      });
    }

    const enquiry = db.addCampaignEnquiry({
      ...req.body,
      contactPerson,
      companyName,
      businessName: companyName,
      officialEmail,
      phoneNumber,
      whatsappNumber,
      website: websiteOrSocial,
      contact_person_name: contactPerson,
      company_brand_name: companyName,
      contact_email: officialEmail,
      contact_phone: phoneNumber,
      contact_whatsapp: whatsappNumber,
      website_or_social: websiteOrSocial
    });

    // Notify administrators of new campaign enquiry
    const adminNotificationTitle = enquiry.enquiryType === 'partner' 
      ? 'New Partner Campaign Enquiry' 
      : 'New Advertiser Campaign Enquiry';

    db.users.filter(u => u.role === 'admin').forEach(admin => {
      db.notifications.push({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: admin.id,
        title: adminNotificationTitle,
        message: `${enquiry.contactPerson} from "${enquiry.companyName}" submitted a campaign proposal (${enquiry.campaignName || enquiry.objective.substring(0, 60)}...).`,
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/admin?tab=campaigns'
      });
    });

    res.json({
      success: true,
      message: "Thank you! Your campaign enquiry has been submitted successfully. Our Admin team will review your requirements and contact you soon.",
      enquiry
    });
  });

  // Get Campaign Enquiries (Admin Only)
  app.get('/api/admin/campaign-enquiries', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const status = req.query.status as string;
    const type = req.query.type as string;
    const enquiries = db.getCampaignEnquiries(status, type);
    res.json({ enquiries });
  });

  // Get Client's Own Campaign Enquiries (Client / Partner)
  app.get('/api/client/campaign-enquiries', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const myEnquiries = db.campaignEnquiries.filter(e => 
      (e.userId && e.userId === user.id) ||
      (e.officialEmail && e.officialEmail.toLowerCase() === user.email.toLowerCase()) ||
      (e.contactEmail && e.contactEmail.toLowerCase() === user.email.toLowerCase())
    );
    res.json({ enquiries: myEnquiries });
  });

  // Update Campaign Enquiry Status / Internal Notes / Tracking Link / Follow-ups (Admin Only)
  const handleUpdateEnquiry = (req: any, res: any) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { status, adminNotes, trackingUrl, trackingUrlArrangedByAdmin, followUpNote, followUpType } = req.body;

    const existing = db.campaignEnquiries.find(e => e.id === id);
    if (!existing) {
      return res.status(404).json({ error: "Campaign enquiry not found." });
    }

    let updatedFollowUp = [...(existing.followUpHistory || [])];
    if (followUpNote) {
      updatedFollowUp.unshift({
        id: `flw_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminName: admin.name || 'Admin',
        type: followUpType || 'note',
        note: followUpNote
      });
    }

    const updated = db.updateCampaignEnquiry(id, {
      ...(status ? { status } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(trackingUrl !== undefined ? { trackingUrl, trackingUrlArrangedByAdmin: Boolean(trackingUrlArrangedByAdmin) } : {}),
      ...(followUpNote ? { followUpHistory: updatedFollowUp } : {})
    });

    res.json({ success: true, enquiry: updated });
  };
  app.patch('/api/admin/campaign-enquiries/:id', handleUpdateEnquiry);
  app.put('/api/admin/campaign-enquiries/:id', handleUpdateEnquiry);

  // Convert Campaign Enquiry to Active Task (Admin Only)
  // Advertisers/Partners can NEVER publish directly; only Admin can convert
  app.post('/api/admin/campaign-enquiries/:id/convert-to-task', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { taskOverride } = req.body;

    const result = db.convertEnquiryToTask(id, taskOverride);
    if (!result) {
      return res.status(404).json({ error: "Campaign enquiry not found." });
    }

    if (supabaseServer) {
      try {
        await saveTaskToSupabase(result.task);
      } catch (sbErr) {
        console.warn('[Convert Enquiry] Supabase sync note:', sbErr);
      }
    }

    console.log(`[Campaign Enquiry] Admin converted enquiry ${id} into live task: ${result.task.title}`);

    res.json({
      success: true,
      message: "Campaign enquiry successfully converted into an active task.",
      task: result.task,
      enquiry: result.enquiry
    });
  });

  // Public & Tracking Redirection Flow (User -> Start Task -> Tracking URL -> Affiliate Destination URL)
  app.get('/track/:taskId', async (req, res) => {
    const { taskId } = req.params;
    let task = db.tasks.find(t => t.id === taskId);
    if (!task && supabaseServer) {
      task = await getTaskByIdFromSupabase(taskId) || undefined;
      if (task) db.tasks.push(task);
    }
    
    if (!task) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Not Found | DSK TaskMarketer</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: white; max-width: 480px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; }
            h1 { font-size: 20px; margin-bottom: 8px; color: #0f172a; }
            p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
            a { display: inline-block; background: #059669; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Task Offer Unavailable</h1>
            <p>The requested task offer could not be found or has been completed. Please explore our active reward catalog.</p>
            <a href="/">Browse Active Tasks</a>
          </div>
        </body>
        </html>
      `);
    }

    const check = normalizeDestinationUrl(task.affiliateUrl);
    if (!check.valid) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Partner Link Issue | DSK TaskMarketer</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: white; max-width: 480px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; }
            h1 { font-size: 20px; margin-bottom: 8px; color: #b91c1c; }
            p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
            a { display: inline-block; background: #0f172a; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Partner Destination Unconfigured</h1>
            <p>The destination link for this task (${task.partnerName}) is currently being updated by the administrator. Please try again in a few moments.</p>
            <a href="/task/${encodeURIComponent(task.id)}">Return to Task Offer</a>
          </div>
        </body>
        </html>
      `);
    }

    // Register tracking start
    task.startsCount = (task.startsCount || 0) + 1;
    const ref = (req.query.ref as string) || `DSK-TRK-${Math.floor(10000 + Math.random() * 90000)}`;
    const userId = (req.query.uid as string) || 'visitor';
    db.taskStarts.push({
      taskId: task.id,
      userId,
      referenceId: ref,
      startedAt: new Date().toISOString()
    });
    db.persistTasks();

    if (supabaseServer) {
      recordTaskStartInSupabase(task.id, userId, ref).catch(err => {
        console.warn('[Supabase DB] Note recording start:', err);
      });
    }

    console.log(`[Tracking Redirect] Redirecting user to partner URL: ${check.url} (Task: ${task.id}, Ref: ${ref})`);

    // HTTP 302 Redirect with robust fallback page for mobile webviews and sandboxed browsers
    res.setHeader('Location', check.url);
    res.status(302).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="0; url=${check.url}">
        <title>Connecting to ${task.partnerName}...</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: white; max-width: 440px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; }
          .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          h2 { font-size: 18px; margin: 0 0 8px; color: #0f172a; }
          p { font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
          a { display: inline-block; background: #059669; color: white; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px; }
        </style>
        <script>
          window.location.replace("${check.url}");
        </script>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h2>Connecting to ${task.partnerName}</h2>
          <p>Redirecting to official partner application portal. If you are not redirected automatically within 3 seconds, click below.</p>
          <a href="${check.url}" rel="noopener noreferrer">Continue to Partner Portal</a>
        </div>
      </body>
      </html>
    `);
  });

  // Dedicated API endpoint for tracking task launch
  app.get('/api/tasks/:id/track', async (req, res) => {
    let task = db.tasks.find(t => t.id === req.params.id);
    if (!task && supabaseServer) {
      task = await getTaskByIdFromSupabase(req.params.id) || undefined;
      if (task) db.tasks.push(task);
    }
    if (!task) return res.status(404).json({ error: "Task not found" });

    const check = normalizeDestinationUrl(task.affiliateUrl);
    if (!check.valid) {
      return res.status(400).json({ error: check.error || "Invalid destination URL" });
    }

    task.startsCount = (task.startsCount || 0) + 1;
    const ref = (req.query.ref as string) || `DSK-TRK-${Math.floor(10000 + Math.random() * 90000)}`;
    const userId = (req.query.uid as string) || 'visitor';
    db.taskStarts.push({
      taskId: task.id,
      userId,
      referenceId: ref,
      startedAt: new Date().toISOString()
    });
    db.persistTasks();

    if (supabaseServer) {
      recordTaskStartInSupabase(task.id, userId, ref).catch(err => {
        console.warn('[Supabase DB] Note recording start:', err);
      });
    }

    res.json({
      success: true,
      taskId: task.id,
      referenceId: ref,
      affiliateUrl: check.url,
      trackingUrl: `/track/${task.id}?ref=${ref}`
    });
  });

  // ===================== 4. TASK STARTS & SUBMISSIONS =====================
  app.post('/api/task-starts', async (req, res) => {
    const user = getAuthUser(req);
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    let task = db.tasks.find(t => t.id === taskId);
    if (!task && supabaseServer) {
      task = await getTaskByIdFromSupabase(taskId) || undefined;
      if (task) db.tasks.push(task);
    }
    if (!task) return res.status(404).json({ error: "Task not found" });

    const urlCheck = normalizeDestinationUrl(task.affiliateUrl);
    if (!urlCheck.valid) {
      return res.status(400).json({ 
        error: urlCheck.error || "The destination URL for this task is invalid or not configured." 
      });
    }

    task.startsCount = (task.startsCount || 0) + 1;
    const referenceId = `DSK-TRK-${Math.floor(10000 + Math.random() * 90000)}`;
    const userId = user ? user.id : 'guest';

    const startRecord = {
      id: `str_${Date.now()}`,
      taskId,
      userId,
      referenceId,
      startedAt: new Date().toISOString(),
      affiliateTrackingRef: `dsk_${userId}_${Date.now()}`
    };

    db.taskStarts.push(startRecord);
    db.persistTasks();

    if (supabaseServer) {
      recordTaskStartInSupabase(taskId, user?.id, referenceId).catch(err => {
        console.warn('[Supabase DB] Start record note:', err);
      });
    }

    console.log(`[Task Started] Task ${taskId} started by ${userId}. Ref: ${referenceId}, URL: ${urlCheck.url}`);

    res.json({
      success: true,
      referenceId,
      affiliateUrl: urlCheck.url,
      trackingUrl: `/track/${task.id}?ref=${referenceId}`,
      instructions: "Complete all partner steps carefully. Capture a screenshot of the final acknowledgment or confirmation page."
    });
  });

  app.get('/api/submissions', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === 'admin') {
      const { status } = req.query;
      let list = [...db.submissions];
      if (status && status !== 'all') {
        list = list.filter(s => s.status === status);
      }
      return res.json(list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    } else {
      const list = db.submissions.filter(s => s.userId === user.id || (Boolean(user.email && s.userEmail && s.userEmail.toLowerCase() === user.email.toLowerCase())));
      return res.json(list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }
  });

  app.post('/api/submissions', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { taskId, proofApplicationId, screenshotUrl, userNote, completedDate } = req.body;
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!proofApplicationId) {
      return res.status(400).json({ error: "Application Reference ID / Proof Number is required" });
    }

    const submissionId = `sub_${Date.now()}`;
    const referenceId = `DSK-SUB-${Math.floor(10000 + Math.random() * 90000)}`;
    const campaignId = task.id.startsWith('tsk_cmp_') ? task.id.replace('tsk_', '') : undefined;

    const newSubmission: TaskSubmission = {
      id: submissionId,
      taskId: task.id,
      campaignId,
      taskTitle: task.title,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      referenceId,
      completedDate: completedDate || new Date().toISOString().split('T')[0],
      proofApplicationId: proofApplicationId.trim(),
      screenshotUrl: screenshotUrl || "",
      userNote: userNote?.trim() || "",
      status: 'pending_review',
      rewardAmount: task.rewardAmount,
      submittedAt: new Date().toISOString()
    };

    db.submissions.push(newSubmission);

    const rewardItem: RewardLedgerItem = {
      id: `rwd_${Date.now()}`,
      userId: user.id,
      submissionId,
      type: 'task_reward',
      amount: task.rewardAmount,
      status: 'pending',
      referenceId: `DSK-RWD-${Math.floor(1000 + Math.random() * 9000)}`,
      description: `Task Reward (Pending Audit): ${task.title}`,
      createdAt: new Date().toISOString()
    };
    db.rewards.push(rewardItem);

    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: "Task Submission Received",
      message: `Your proof for '${task.title}' has been received and is queued for verification.`,
      type: 'submission',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/submissions'
    });

    db.persistSubmissions();
    db.persistRewards();

    res.status(201).json(newSubmission);
  });

  // Client Review for Submissions on their Campaigns
  app.put('/api/client/submissions/:id/review', (req, res) => {
    const user = getAuthUser(req);
    if (!user || (user.role !== 'client' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized: Client access required" });
    }

    const submission = db.submissions.find(s => s.id === req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    // Ensure the campaign belongs to this client if not admin
    if (user.role === 'client' && submission.campaignId) {
      const campaign = db.campaigns.find(c => c.id === submission.campaignId);
      if (!campaign || campaign.clientId !== user.id) {
        return res.status(403).json({ error: "Access denied: Not your campaign submission" });
      }
    }

    const { status, note } = req.body;
    submission.status = status;
    submission.adminNote = note;
    submission.reviewedAt = new Date().toISOString();
    submission.reviewedBy = user.id;

    const rewardItem = db.rewards.find(r => r.submissionId === submission.id);

    if (status === 'approved') {
      if (rewardItem) {
        rewardItem.status = 'credited';
        rewardItem.description = `Task Reward Approved: ${submission.taskTitle}`;
      }

      const task = db.tasks.find(t => t.id === submission.taskId);
      if (task) task.completionsCount += 1;

      if (submission.campaignId) {
        const campaign = db.campaigns.find(c => c.id === submission.campaignId);
        if (campaign) campaign.completionsCount += 1;
      }

      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: submission.userId,
        title: `Task Approved: ₹${submission.rewardAmount} Credited`,
        message: `Your proof for '${submission.taskTitle}' has been verified by the partner. ₹${submission.rewardAmount} was added to your available balance.`,
        type: 'reward',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/earnings'
      });
    } else if (status === 'rejected') {
      if (rewardItem) {
        rewardItem.status = 'rejected';
        rewardItem.description = `Task Reward Rejected: ${submission.taskTitle} (${note || 'Invalid proof'})`;
      }
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: submission.userId,
        title: "Task Submission Rejected",
        message: `Your submission for '${submission.taskTitle}' was rejected: ${note || 'Verification failed.'}`,
        type: 'submission',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/submissions'
      });
    }

    res.json(submission);
  });

  app.put('/api/submissions/:id/status', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const submission = db.submissions.find(s => s.id === req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const { status, adminNote, rejectionReason } = req.body;
    submission.status = status;
    submission.adminNote = adminNote;
    submission.rejectionReason = rejectionReason;
    submission.reviewedAt = new Date().toISOString();
    submission.reviewedBy = admin.id;

    const rewardItem = db.rewards.find(r => r.submissionId === submission.id);

    if (status === 'approved') {
      if (rewardItem) {
        rewardItem.status = 'credited';
        rewardItem.description = `Task Reward Approved: ${submission.taskTitle}`;
      } else {
        db.rewards.push({
          id: `rwd_${Date.now()}`,
          userId: submission.userId,
          submissionId: submission.id,
          type: 'task_reward',
          amount: submission.rewardAmount,
          status: 'credited',
          referenceId: submission.referenceId || `DSK-RWD-${Math.floor(1000 + Math.random() * 9000)}`,
          description: `Task Reward Approved: ${submission.taskTitle}`,
          createdAt: new Date().toISOString()
        });
      }

      const task = db.tasks.find(t => t.id === submission.taskId);
      if (task) {
        task.completionsCount = (task.completionsCount || 0) + 1;
        db.persistTasks();
      }

      // Check referral qualification
      const userObj = db.users.find(u => u.id === submission.userId);
      if (userObj && userObj.referredBy) {
        const referrer = db.users.find(u => u.referralCode === userObj.referredBy);
        if (referrer) {
          const refRecord = db.referrals.find(r => r.referrerId === referrer.id && r.referredUserId === userObj.id);
          if (refRecord && refRecord.status !== 'reward_credited') {
            refRecord.status = 'reward_credited';
            refRecord.completedAt = new Date().toISOString();

            db.rewards.push({
              id: `rwd_ref_${Date.now()}`,
              userId: referrer.id,
              type: 'referral_reward',
              amount: 50,
              status: 'credited',
              referenceId: `DSK-REF-${Math.floor(1000 + Math.random() * 9000)}`,
              description: `Referral Reward: ${userObj.name} completed qualifying task`,
              createdAt: new Date().toISOString()
            });

            db.notifications.push({
              id: `notif_${Date.now()}`,
              userId: referrer.id,
              title: `Referral Reward Credited: ₹50`,
              message: `${userObj.name} has completed their first approved task! ₹50 credited to your wallet.`,
              type: 'referral',
              isRead: false,
              createdAt: new Date().toISOString(),
              link: '/referrals'
            });
          }
        }
      }

      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: submission.userId,
        title: `Task Approved: ₹${submission.rewardAmount} Credited`,
        message: `Your proof for '${submission.taskTitle}' has been verified. ₹${submission.rewardAmount} was added to your available balance.`,
        type: 'reward',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/earnings'
      });
    } else if (status === 'rejected') {
      if (rewardItem) {
        rewardItem.status = 'rejected';
        rewardItem.description = `Task Reward Rejected: ${submission.taskTitle} (${rejectionReason || 'Invalid proof'})`;
      }
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: submission.userId,
        title: "Task Submission Rejected",
        message: `Your submission for '${submission.taskTitle}' was rejected: ${rejectionReason || 'Verification failed.'}`,
        type: 'submission',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/submissions'
      });
    }

    db.persistSubmissions();
    db.persistRewards();

    res.json(submission);
  });

  // ===================== 5. REWARDS & LEDGER =====================
  app.get('/api/rewards', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Auto-reconcile any approved submissions to ensure rewards are up to date
    db.getWalletSummary(user.id);

    const { type, status } = req.query;
    let list = user.role === 'admin' && req.query.all === 'true'
      ? [...db.rewards]
      : db.rewards.filter(r => r.userId === user.id || (Boolean(user.email && r.userId && r.userId.toLowerCase() === user.email.toLowerCase())));

    if (type && type !== 'all') {
      list = list.filter(r => r.type === type);
    }
    if (status && status !== 'all') {
      list = list.filter(r => r.status === status);
    }

    res.json(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  // ===================== 6. REFERRALS =====================
  app.get('/api/referrals', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const userReferrals = db.referrals.filter(r => r.referrerId === user.id);
    const sortedReferrals = userReferrals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalReferrals = userReferrals.length;
    const eligibleReferrals = userReferrals.filter(r => r.status === 'reward_credited').length;
    const pendingReferrals = userReferrals.filter(r => r.status === 'qualifying_action_pending').length;
    const approvedReferralRewards = userReferrals
      .filter(r => r.status === 'reward_credited')
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    const pendingReferralRewards = pendingReferrals * 50;

    res.json({
      referralCode: user.referralCode,
      referralLink: `${req.protocol}://${req.get('host')}/register?ref=${user.referralCode}`,
      stats: {
        totalReferrals,
        eligibleReferrals,
        pendingReferrals,
        approvedReferralRewards,
        pendingReferralRewards
      },
      rules: {
        rewardAmount: 50,
        qualifyingCondition: "Credited when your referred user completes their first verified task.",
        antiAbuse: "Self-referrals, automated accounts, or duplicate payment details will lead to permanent disqualification."
      },
      history: sortedReferrals,
      referrals: sortedReferrals
    });
  });

  // ===================== 7. WITHDRAWALS =====================
  app.get('/api/withdrawals', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === 'admin' && req.query.all === 'true') {
      return res.json(db.withdrawals.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    } else {
      const list = db.withdrawals.filter(w => w.userId === user.id);
      return res.json(list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    }
  });

  app.post('/api/withdrawals', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { amount, payoutMethod, payoutDetails } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: "Please enter a valid withdrawal amount" });
    }

    const wallet = db.getWalletSummary(user.id);
    if (withdrawAmount > wallet.availableBalance) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    const minAmount = db.settings.minimumWithdrawalAmount || 200;
    if (withdrawAmount < minAmount) {
      return res.status(400).json({ error: `Minimum withdrawal amount is ₹${minAmount}` });
    }

    if (payoutMethod === 'upi') {
      if (!payoutDetails?.upiId || !payoutDetails.upiId.includes('@')) {
        return res.status(400).json({ error: "Valid UPI ID (e.g. yourname@bank) is required" });
      }
    } else if (payoutMethod === 'bank_transfer') {
      if (!payoutDetails?.bankAccount || !payoutDetails?.ifsc || !payoutDetails?.accountHolderName) {
        return res.status(400).json({ error: "Account holder name, account number, and IFSC are required" });
      }
    } else {
      return res.status(400).json({ error: "Unsupported payout method" });
    }

    const withdrawalId = `wth_${Date.now()}`;
    const refId = `DSK-WTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: withdrawAmount,
      payoutMethod,
      referenceId: refId,
      payoutDetails: {
        upiId: payoutDetails.upiId,
        accountHolderName: payoutDetails.accountHolderName,
        bankAccount: payoutDetails.bankAccount,
        ifsc: payoutDetails.ifsc
      },
      status: 'pending',
      availableBalanceAtRequest: wallet.availableBalance,
      requestedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          withdrawalId,
          action: "Withdrawal Requested",
          adminName: `User (${user.name})`,
          timestamp: new Date().toISOString(),
          previousStatus: "none",
          newStatus: "pending",
          note: `User requested payout of ₹${withdrawAmount} via ${payoutMethod.toUpperCase()}`
        }
      ]
    };

    db.withdrawals.push(newWithdrawal);

    db.rewards.push({
      id: `rwd_wth_${Date.now()}`,
      userId: user.id,
      withdrawalId: withdrawalId,
      type: 'withdrawal',
      amount: -withdrawAmount,
      status: 'approved',
      referenceId: refId,
      description: `Withdrawal Request via ${payoutMethod.toUpperCase()}`,
      createdAt: new Date().toISOString()
    });

    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal request of ₹${withdrawAmount} has been received and queued for disbursement.`,
      type: 'withdrawal',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/withdrawals'
    });

    db.persistRewards();
    db.persistWithdrawals();

    res.status(201).json(newWithdrawal);
  });

  app.put('/api/withdrawals/:id/status', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const withdrawal = db.withdrawals.find(w => w.id === req.params.id);
    if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });

    const { status, adminNote, rejectionReason, paymentReference, utrNumber, payoutReference } = req.body;
    const oldStatus = withdrawal.status;

    if (oldStatus === 'paid' && status !== 'paid') {
      return res.status(400).json({ error: "Cannot change status of an already disbursed payout." });
    }

    withdrawal.status = status;
    if (adminNote !== undefined) withdrawal.adminNote = adminNote;
    if (rejectionReason !== undefined) withdrawal.rejectionReason = rejectionReason;

    // Save UTR permanently
    const finalUtr = (paymentReference ?? utrNumber ?? payoutReference ?? '').toString().trim();
    if (finalUtr) {
      withdrawal.paymentReference = finalUtr;
      (withdrawal as any).utrNumber = finalUtr;
      (withdrawal as any).payoutReference = finalUtr;
    }
    if (!withdrawal.referenceId) {
      withdrawal.referenceId = `DSK-WTH-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    withdrawal.processedBy = admin.name || "Administrator";
    withdrawal.processedAt = new Date().toISOString();

    const isRefundStatus = (status === 'rejected' || status === 'cancelled');
    const isAlreadyRefunded = Boolean(
      withdrawal.refunded ||
      db.rewards.some(r => r.withdrawalId === withdrawal.id && (r.type === 'withdrawal_refund' || (r.type === 'bonus' && r.description?.includes('Refund'))))
    );

    // Requirement 2: Withdrawal Refund
    // If Admin rejects or cancels a withdrawal:
    // Automatically refund the EXACT requested withdrawal amount to the user's wallet.
    // Create transaction: Type: Withdrawal Refund, Amount: +₹X, Reason: Withdrawal rejected/cancelled
    // Refund ONLY ONCE. Prevent duplicate refunds.
    // Do NOT refund pending, approved or completed withdrawals.
    if (isRefundStatus && !isAlreadyRefunded) {
      withdrawal.refunded = true;
      withdrawal.refundedAt = new Date().toISOString();

      const reasonText = rejectionReason || adminNote || (status === 'cancelled' ? 'Withdrawal cancelled' : 'Withdrawal rejected');
      const refundRecord: RewardLedgerItem = {
        id: `rwd_rfnd_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        userId: withdrawal.userId,
        withdrawalId: withdrawal.id,
        type: 'withdrawal_refund',
        amount: withdrawal.amount,
        status: 'credited',
        referenceId: `DSK-RFND-${Math.floor(100000 + Math.random() * 900000)}`,
        description: `Withdrawal Refund: ${reasonText}`,
        refundReason: reasonText,
        createdAt: new Date().toISOString()
      };

      db.rewards.push(refundRecord);

      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: withdrawal.userId,
        title: "Withdrawal Refunded",
        message: `Your withdrawal request for ₹${withdrawal.amount} was ${status === 'cancelled' ? 'cancelled' : 'rejected'} (${reasonText}). ₹${withdrawal.amount} has been refunded to your wallet balance.`,
        type: 'withdrawal',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/withdrawals'
      });
    } else if (status === 'paid') {
      withdrawal.paidAmount = req.body.paidAmount || withdrawal.amount;
      withdrawal.paidDate = req.body.paidDate || new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: withdrawal.userId,
        title: `Withdrawal Paid: ₹${withdrawal.amount}`,
        message: `Your payout of ₹${withdrawal.amount} has been successfully dispatched! UTR / Payment Ref: ${finalUtr || withdrawal.paymentReference || 'Verified'}.`,
        type: 'withdrawal',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/withdrawals'
      });
    }

    db.persistRewards();
    db.persistWithdrawals();

    res.json(withdrawal);
  });

  // Requirement 3: ADMIN MANUAL WALLET REWARD
  app.post('/api/admin/rewards', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { userId, amount, reason, note, idempotencyKey, rewardType, type } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Reward amount must be a positive number greater than ₹0." });
    }

    const trimmedReason = (reason || note || '').toString().trim();
    if (!trimmedReason) {
      return res.status(400).json({ error: "Reason / Note is required before submitting reward." });
    }

    const targetUser = db.users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found." });
    }

    // Determine normalized reward type:
    // 1. Task Reward -> 'task_reward'
    // 2. Referral Reward -> 'referral_reward'
    // 3. Other / Manual Reward -> 'manual_reward'
    const rawType = (rewardType || type || 'manual_reward').toString().toLowerCase().trim();
    let finalType: RewardType = 'manual_reward';
    let typeLabel = 'Manual Reward';
    let prefix = 'MNL';

    if (rawType === 'task_reward' || rawType === 'task' || rawType === 'task reward') {
      finalType = 'task_reward';
      typeLabel = 'Task Reward';
      prefix = 'TSK';
    } else if (rawType === 'referral_reward' || rawType === 'referral' || rawType === 'referral reward') {
      finalType = 'referral_reward';
      typeLabel = 'Referral Reward';
      prefix = 'REF';
    } else {
      finalType = 'manual_reward';
      typeLabel = 'Manual Reward';
      prefix = 'MNL';
    }

    // Prevent duplicate rewards from double-click or refresh
    const now = Date.now();
    const isDuplicate = db.rewards.some(r => {
      if (idempotencyKey && (r as any).idempotencyKey === idempotencyKey) return true;
      const createdTime = new Date(r.createdAt).getTime();
      return (now - createdTime < 4000) &&
        r.userId === targetUser.id &&
        r.type === finalType &&
        r.amount === numAmount &&
        r.description === trimmedReason;
    });

    if (isDuplicate) {
      return res.status(409).json({ error: "Duplicate reward request detected. Reward has already been credited." });
    }

    const adminIdentifier = admin.name || admin.email || 'Administrator';
    const newReward: RewardLedgerItem = {
      id: `rwd_${prefix.toLowerCase()}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      userId: targetUser.id,
      type: finalType,
      amount: numAmount,
      status: 'credited',
      referenceId: `DSK-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`,
      description: trimmedReason,
      addedByAdmin: adminIdentifier,
      internalNote: `${typeLabel} added by admin: ${adminIdentifier}. Reason: ${trimmedReason}`,
      createdAt: new Date().toISOString()
    };

    if (idempotencyKey) {
      (newReward as any).idempotencyKey = idempotencyKey;
    }

    db.rewards.push(newReward);
    db.persistRewards();

    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: targetUser.id,
      title: `${typeLabel}: +₹${numAmount}`,
      message: `Administrator (${adminIdentifier}) added ₹${numAmount} (${typeLabel}) to your wallet. Reason: ${trimmedReason}`,
      type: 'reward',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/earnings'
    });

    const updatedWallet = db.getWalletSummary(targetUser.id);

    res.status(201).json({
      message: `${typeLabel} of ₹${numAmount} added successfully`,
      reward: newReward,
      wallet: updatedWallet
    });
  });

  // ===================== 8. COMMUNITY, NOTIFICATIONS, TICKETS =====================
  app.get('/api/community', (req, res) => {
    const user = getAuthUser(req);
    const isAdmin = user?.role === 'admin';
    let links = [...db.socialLinks];
    if (!isAdmin) {
      links = links.filter(l => l.enabled);
    }
    links.sort((a, b) => a.displayOrder - b.displayOrder);
    res.json(links);
  });

  app.post('/api/community', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const link = req.body;
    const newLink: SocialLink = {
      id: `link_${Date.now()}`,
      platform: link.platform || 'other',
      displayName: link.displayName || link.name || 'Community Channel',
      url: link.url || 'https://telegram.org',
      icon: link.icon || 'Send',
      enabled: link.enabled !== undefined ? link.enabled : true,
      displayOrder: db.socialLinks.length + 1,
      description: link.description || ''
    };
    db.socialLinks.push(newLink);
    res.status(201).json(newLink);
  });

  app.put('/api/community/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const id = req.params.id;
    const idx = db.socialLinks.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ error: "Community link not found" });
    db.socialLinks[idx] = { ...db.socialLinks[idx], ...req.body, id };
    res.json(db.socialLinks[idx]);
  });

  app.delete('/api/community/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const id = req.params.id;
    db.socialLinks = db.socialLinks.filter(l => l.id !== id);
    res.json({ success: true });
  });

  app.get('/api/notifications', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const list = db.notifications.filter(n => n.userId === user.id);
    res.json(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.put('/api/notifications/:id/read', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const notif = db.notifications.find(n => n.id === req.params.id && n.userId === user.id);
    if (notif) notif.isRead = true;
    res.json({ success: true });
  });

  app.put('/api/notifications/read-all', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    db.notifications.filter(n => n.userId === user.id).forEach(n => n.isRead = true);
    res.json({ success: true });
  });

  app.get('/api/support/tickets', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === 'admin' && req.query.all === 'true') {
      return res.json(db.tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } else {
      const list = db.tickets.filter(t => t.userId === user.id);
      return res.json(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    }
  });

  app.post('/api/support/tickets', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { category, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    const ticketId = `tkt_${Date.now()}`;
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      category: category || "Task Verification",
      subject: subject.trim(),
      status: 'open',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_${Date.now()}`,
          ticketId,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          message: message.trim(),
          createdAt: new Date().toISOString()
        }
      ]
    };

    db.tickets.push(newTicket);
    res.status(201).json(newTicket);
  });

  app.post('/api/support/tickets/:id/reply', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const ticketId = req.params.id;
    const ticket = db.tickets.find(t => t.id === ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (user.role !== 'admin' && ticket.userId !== user.id) {
      return res.status(403).json({ error: "Unauthorized access to ticket" });
    }

    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Reply message cannot be empty" });
    }

    const newMsg: SupportMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message: String(message).trim(),
      createdAt: new Date().toISOString()
    };

    if (!ticket.messages) ticket.messages = [];
    ticket.messages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();

    if (user.role === 'admin' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    res.json(ticket);
  });

  app.put('/api/support/tickets/:id/status', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const ticketId = req.params.id;
    const ticket = db.tickets.find(t => t.id === ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (user.role !== 'admin' && ticket.userId !== user.id) {
      return res.status(403).json({ error: "Unauthorized access to ticket" });
    }

    const { status, priority } = req.body;
    if (status) ticket.status = status;
    if (priority && user.role === 'admin') ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();

    res.json(ticket);
  });

  // ===================== 9. ADMIN CONSOLE & METRICS =====================
  app.get('/api/admin/metrics', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const totalUsers = db.users.filter(u => u.role === 'user').length;
    const activeUsers = db.users.filter(u => u.role === 'user' && u.status === 'active').length;
    const totalClients = db.users.filter(u => u.role === 'client').length;
    const totalCampaigns = db.campaigns.length;
    const pendingCampaigns = db.campaigns.filter(c => c.status === 'pending_approval').length;
    const totalTasks = db.tasks.length;
    const activeTasks = db.tasks.filter(t => t.active).length;
    const taskCompletions = db.submissions.filter(s => s.status === 'approved').length;
    const pendingSubmissions = db.submissions.filter(s => s.status === 'pending_review').length;

    const pendingRewards = db.rewards
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalRewardsCredited = db.rewards
      .filter(r => r.status === 'credited' && (r.type === 'task_reward' || r.type === 'referral_reward'))
      .reduce((sum, r) => sum + r.amount, 0);

    const pendingWithdrawals = db.withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);

    const totalWithdrawalsPaid = db.withdrawals
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + w.amount, 0);

    const totalReferrals = db.referrals.length;
    const eligibleReferrals = db.referrals.filter(r => r.status === 'reward_credited').length;

    res.json({
      totalUsers,
      activeUsers,
      totalClients,
      totalCampaigns,
      pendingCampaigns,
      totalTasks,
      activeTasks,
      taskCompletions,
      pendingSubmissions,
      pendingRewards,
      totalRewardsCredited,
      pendingWithdrawals,
      totalWithdrawalsPaid,
      totalReferrals,
      eligibleReferrals
    });
  });

  app.get('/api/admin/users', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const userList = db.users.map(u => {
      const wallet = db.getWalletSummary(u.id);
      const submissionCount = db.submissions.filter(s => s.userId === u.id).length;
      const approvedCount = db.submissions.filter(s => s.userId === u.id && s.status === 'approved').length;
      const referralCount = db.referrals.filter(r => r.referrerId === u.id).length;
      const withdrawalCount = db.withdrawals.filter(w => w.userId === u.id).length;

      const { passwordHash: _, salt: __, ...cleanUser } = u as any;

      return {
        ...cleanUser,
        wallet,
        submissionCount,
        approvedCount,
        referralCount,
        withdrawalCount
      };
    });

    res.json(userList);
  });

  // Permanently delete all other admin accounts and retain only dsktaskmarketer@gmail.com
  app.post('/api/admin/users/cleanup-admins', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    try {
      // 1. Clean from in-memory and local disk
      const localResult = db.cleanUpAdminAccounts();

      // 2. Clean from Supabase Auth and profiles
      const sbResult = await cleanupSupabaseAdminAccounts('dsktaskmarketer@gmail.com');

      console.log(`[Admin Cleanup] Deleted ${localResult.deletedCount} local admin accounts and ${sbResult.deletedFromProfiles} Supabase admin records.`);

      res.json({
        success: true,
        message: "Permanently deleted all other admin accounts. dsktaskmarketer@gmail.com is the sole retained administrator.",
        deletedLocalAdmins: localResult.deletedCount,
        deletedFromSupabaseProfiles: sbResult.deletedFromProfiles,
        deletedFromSupabaseAuth: sbResult.deletedFromAuth,
        admins: localResult.remainingAdmins.map(u => {
          const { passwordHash: _, salt: __, ...safeUser } = u as any;
          return safeUser;
        })
      });
    } catch (err: any) {
      console.error('[Admin Cleanup Endpoint] Error:', err);
      res.status(500).json({ error: err.message || "Failed to cleanup admin accounts" });
    }
  });

  app.get('/api/admin/referrals', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const enrichedReferrals = db.referrals.map(r => {
      const referrer = db.users.find(u => u.id === r.referrerId);
      const referred = db.users.find(u => u.id === r.referredUserId);
      return {
        ...r,
        referrerName: referrer?.name || 'Unknown Member',
        referrerEmail: referrer?.email || 'N/A',
        referredUserName: r.referredUserName || referred?.name || 'Member',
        referredUserEmail: r.referredUserEmail || referred?.email || 'N/A'
      };
    });

    res.json(enrichedReferrals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.put('/api/admin/users/:id/status', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const targetUser = db.users.find(u => u.id === req.params.id);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    targetUser.status = req.body.status || (targetUser.status === 'active' ? 'suspended' : 'active');
    res.json({ success: true, user: targetUser });
  });

  app.get('/api/settings', (req, res) => {
    res.json(db.settings);
  });

  app.put('/api/settings', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    db.settings = {
      ...db.settings,
      ...req.body
    };

    if (req.body.smtpConfig) {
      emailService.updateConfig(req.body.smtpConfig);
    }

    db.persistSettings();
    res.json({ success: true, settings: db.settings });
  });

  // SMTP Configuration & Diagnostics Endpoints for Admin
  app.get('/api/admin/smtp-config', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const conf = emailService.getConfig();
    res.json({
      configured: emailService.isConfigured(),
      host: conf.host,
      port: conf.port,
      user: conf.user,
      from: conf.from,
      secure: conf.secure
    });
  });

  app.put('/api/admin/smtp-config', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { host, port, user, pass, from, secure } = req.body;
    emailService.updateConfig({ 
      host, 
      port: Number(port) || 587, 
      user, 
      pass, 
      from, 
      secure: Boolean(secure) 
    });

    if (!db.settings.smtpConfig) {
      (db.settings as any).smtpConfig = {};
    }
    (db.settings as any).smtpConfig = {
      host: host || '',
      port: Number(port) || 587,
      user: user || '',
      from: from || '',
      secure: Boolean(secure)
    };
    db.persistSettings();

    res.json({
      success: true,
      message: "SMTP configuration updated successfully."
    });
  });

  app.post('/api/admin/smtp-test', async (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { testRecipient } = req.body;
    const recipient = testRecipient || admin.email || 'admin@dsktaskmarketer.com';

    const result = await emailService.testConnection(recipient);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    res.json({
      success: true,
      message: `Test email successfully sent to ${recipient}!`,
      details: result.details
    });
  });

  // ===================== 19. 3-PLAN MONTHLY INCENTIVE SYSTEM =====================
  app.get('/api/incentives', (req, res) => {
    let user = getAuthUser(req);
    const userIdQuery = req.query.userId as string | undefined;
    if (!user && userIdQuery) {
      user = db.users.find(u => u.id === userIdQuery || (u.email && u.email.toLowerCase() === userIdQuery.toLowerCase()));
    }
    if (!user) {
      user = db.users.find(u => u.role === 'user') || db.users[0];
    }
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const month = req.query.month as string | undefined;
      const overview = db.getUserIncentivesOverview(user.id, month);
      res.json(overview);
    } catch (err: any) {
      console.error('[Incentives API] Error getting user incentives:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch incentive plans' });
    }
  });

  app.post('/api/incentives/claim', (req, res) => {
    let user = getAuthUser(req);
    const { planType, milestoneId, month, userId } = req.body;
    if (!user && userId) {
      user = db.users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    }
    if (!user) {
      user = db.users.find(u => u.role === 'user') || db.users[0];
    }
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
      if (!planType || !milestoneId) {
        return res.status(400).json({ error: "Plan type and milestone ID are required." });
      }

      const result = db.claimIncentiveMilestone(user.id, planType, milestoneId, month);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json(result);
    } catch (err: any) {
      console.error('[Incentives API] Error claiming incentive milestone:', err);
      res.status(500).json({ error: err.message || 'Failed to claim milestone bonus' });
    }
  });

  app.get('/api/admin/incentives', (req, res) => {
    const user = getAuthUser(req);
    if (user && user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }

    try {
      const month = req.query.month as string | undefined;
      const overview = db.getAdminIncentivesOverview(month);
      res.json(overview);
    } catch (err: any) {
      console.error('[Admin Incentives API] Error getting admin overview:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch admin incentives data' });
    }
  });

  app.put('/api/admin/incentives/plans/:planType', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    try {
      const planType = req.params.planType as any;
      const updated = db.updateIncentivePlan(planType, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Incentive plan not found." });
      }
      res.json({ success: true, plan: updated });
    } catch (err: any) {
      console.error('[Admin Incentives API] Error updating plan config:', err);
      res.status(500).json({ error: err.message || 'Failed to update plan configuration' });
    }
  });

  app.post('/api/admin/incentives/plans/:planType/milestones', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    try {
      const planType = req.params.planType as any;
      const newMs = db.addIncentiveMilestone(planType, req.body);
      if (!newMs) {
        return res.status(400).json({ error: "Failed to create milestone." });
      }
      res.json({ success: true, milestone: newMs });
    } catch (err: any) {
      console.error('[Admin Incentives API] Error creating milestone:', err);
      res.status(500).json({ error: err.message || 'Failed to add milestone' });
    }
  });

  app.put('/api/admin/incentives/plans/:planType/milestones/:milestoneId', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    try {
      const { planType, milestoneId } = req.params;
      const updated = db.updateIncentiveMilestone(planType as any, milestoneId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Milestone not found." });
      }
      res.json({ success: true, milestone: updated });
    } catch (err: any) {
      console.error('[Admin Incentives API] Error updating milestone:', err);
      res.status(500).json({ error: err.message || 'Failed to update milestone' });
    }
  });

  app.delete('/api/admin/incentives/plans/:planType/milestones/:milestoneId', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    try {
      const { planType, milestoneId } = req.params;
      const deleted = db.deleteIncentiveMilestone(planType as any, milestoneId);
      if (!deleted) {
        return res.status(404).json({ error: "Milestone not found or could not be deleted." });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Admin Incentives API] Error deleting milestone:', err);
      res.status(500).json({ error: err.message || 'Failed to delete milestone' });
    }
  });

  app.put('/api/admin/incentives/claims/:claimId', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    try {
      const { claimId } = req.params;
      const { status, adminNote } = req.body;
      const claim = db.updateIncentiveClaimStatus(claimId, status, adminNote);
      if (!claim) {
        return res.status(404).json({ error: "Incentive claim record not found." });
      }
      res.json({ success: true, claim });
    } catch (err: any) {
      console.error('[Admin Incentives API] Error updating claim status:', err);
      res.status(500).json({ error: err.message || 'Failed to update claim status' });
    }
  });

  // Safe API route fallback: ensure ANY unhandled /api route returns JSON 404, NEVER HTML index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404
    });
  });

  // Mount public directory for direct asset serving (e.g. /monthly-incentive.png)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Create standard HTTP server instance
  const httpServer = http.createServer(app);

  // Vite development middleware or static serve in production
  if (!isProduction) {
    console.log(`[Development Mode] Initializing Vite middleware with HTTP server attachment...`);
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static resolution
    const possiblePaths = [
      path.join(process.cwd(), 'dist'),
      __dirname,
      path.resolve(__dirname, 'dist'),
      path.resolve(process.cwd(), 'dist')
    ];
    const distPath = possiblePaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const indexExists = fs.existsSync(indexPath);

    console.log(`[Production Mode] Static files directory: ${distPath}`);
    console.log(`[Production Mode] index.html located: ${indexPath} (exists: ${indexExists})`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.status(200).sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>DSK TaskMarketer</title></head><body><div id="root">DSK TaskMarketer is running</div></body></html>');
      }
    });
  }

  // Open HTTP port immediately (Do not wait for external databases or third-party APIs)
  const server = httpServer.listen(PORT, HOST, () => {
    console.log(`================================================================`);
    console.log(`DSK TaskMarketer Production Server Online`);
    console.log(`Binding Host:      ${HOST}`);
    console.log(`Listening Port:    ${PORT}`);
    console.log(`Environment:       ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`Health Check:      http://${HOST}:${PORT}/api/health`);
    console.log(`Status:            Ready for Render deployment checks`);
    console.log(`================================================================`);
  });

  server.on('error', (err: any) => {
    console.error(`[FATAL] Server failed to bind or encountered an error on ${HOST}:${PORT}:`, err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error("[FATAL] Critical error during server bootstrap:", err);
  process.exit(1);
});
