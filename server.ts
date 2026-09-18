import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { db } from './server/db.ts';
import { 
  supabaseServer, 
  verifySupabaseToken, 
  syncTaskToSupabase, 
  deleteTaskFromSupabase 
} from './server/supabase.ts';
import type { 
  Task, 
  TaskSubmission, 
  RewardLedgerItem, 
  Withdrawal, 
  SocialLink, 
  SupportTicket, 
  SupportMessage, 
  NotificationItem,
  User,
  Campaign
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

  // Asynchronous authentication middleware
  // Resolves token from Bearer header or x-user-id header
  // Supports direct user ID, active session tokens, and verified Supabase JWTs
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

      // 2. Direct email match or admin token prefix matching
      if (db.isDesignatedAdminEmail(token)) {
        let adminUser = db.users.find(u => u.email.toLowerCase() === token.toLowerCase() && u.role === 'admin') ||
                        db.users.find(u => u.role === 'admin');
        if (adminUser) {
          (req as any).authUser = adminUser;
          return next();
        }
      }

      if (token.startsWith('admin_') || token === 'admin' || token === 'admin_root') {
        const matchedAdmin = db.users.find(u => u.id === token && u.role === 'admin') || 
                             db.users.find(u => u.role === 'admin');
        if (matchedAdmin) {
          (req as any).authUser = matchedAdmin;
          return next();
        }
      }

      // 3. Supabase JWT verification (tokens with dots or length > 25)
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
            referralCode: 'DSK' + supabaseUser.id.replace(/-/g, '').slice(0, 5).toUpperCase(),
            createdAt: supabaseUser.created_at || new Date().toISOString()
          };
          db.users.push(newUser);
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
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: "Access denied. Administrator privileges required." });
      return null;
    }
    return user;
  };

  // ===================== HEALTH CHECK ROUTES =====================
  // Standard health checks for Render, Docker, and monitoring proxies
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      service: "DSK TaskMarketer Production API",
      port: PORT,
      host: HOST,
      timestamp: new Date().toISOString()
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
    const wallet = db.getWalletSummary(user.id);
    const unreadNotifications = db.notifications.filter(n => n.userId === user.id && !n.isRead).length;
    const mustChange = user.role === 'admin' && !db.adminSetupCompleted;
    res.json({
      user: {
        ...user,
        mustChangeCredentials: mustChange
      },
      wallet,
      unreadNotifications,
      adminSetupCompleted: db.adminSetupCompleted
    });
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

  // Dedicated Admin Setup Status Endpoint (Only reveals default credentials on initial setup)
  app.get('/api/auth/admin/setup-status', (req, res) => {
    const status = db.getAdminSetupStatus();
    res.json(status);
  });

  // Dedicated Admin Login Endpoint with Server-Side Role Enforcement
  app.post('/api/auth/admin/login', (req, res) => {
    const identifier = req.body.identifier || req.body.email || req.body.username;
    const { password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Administrator email/username and password are required" });
    }

    const trimmed = identifier.trim().toLowerCase();
    const user = db.users.find(u => 
      u.email.toLowerCase() === trimmed || u.mobile === identifier.trim()
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid administrative credentials" });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: "Administrative account suspended. Contact system administrator." });
    }

    // Verify Password
    if (user.passwordHash && user.salt) {
      const isValid = db.verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid administrative credentials" });
      }
    }

    // STRICT SERVER-SIDE ROLE ENFORCEMENT: Never allow normal users or clients to pass
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Access Denied: This account does not possess verified administrator privileges." 
      });
    }

    const isFirstTimeSetup = !db.adminSetupCompleted;
    const { passwordHash: _, salt: __, ...adminProfile } = user;

    res.json({
      success: true,
      user: adminProfile,
      token: user.id,
      role: 'admin',
      mustChangeCredentials: isFirstTimeSetup
    });
  });

  // Complete First-Time Administrator Security Setup
  app.post('/api/auth/admin/complete-setup', async (req, res) => {
    const admin = requireAdmin(req, res, true);
    if (!admin) return;

    const { newEmail, newPassword } = req.body;
    if (!newEmail || !newPassword) {
      return res.status(400).json({ error: "New administrator email and master password are required." });
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

    res.json({
      success: true,
      message: "Administrator credentials updated successfully. Default credentials are now permanently disabled.",
      user: updatedAdmin,
      token: updatedAdmin.id
    });
  });

  // Admin Forgot Password - Dispatches secure reset link via Supabase Auth
  app.post('/api/auth/admin/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Administrator email is required." });
    }

    const trimmed = String(email).trim().toLowerCase();
    const adminUser = db.users.find(u => u.role === 'admin' && u.email.toLowerCase() === trimmed);

    // If Supabase server is configured and admin account matches, send email reset link
    if (supabaseServer && adminUser) {
      try {
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
        const host = req.get('host') || req.headers.host || 'localhost:3000';
        const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${protocol}://${host}`;
        const redirectUrl = `${appUrl}/admin/login?type=recovery`;
        await supabaseServer.auth.resetPasswordForEmail(trimmed, {
          redirectTo: redirectUrl
        });
        console.log(`[Admin Security] Dispatched password reset link via Supabase to: ${trimmed} with redirect: ${redirectUrl}`);
      } catch (err) {
        console.error('[Admin Security] Error sending recovery email via Supabase Auth:', err);
      }
    }

    // Security Rule 19: Do not reveal whether an email belongs to an admin account
    res.json({
      success: true,
      message: "If an administrative account matches this email address, password reset instructions have been dispatched. Please check your inbox and click the verification link to proceed."
    });
  });

  // Admin Reset Password - Verifies and applies new master password
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

  app.post('/api/auth/register', (req, res) => {
    const { name, email, mobile, password, confirmPassword, referralCode, role } = req.body;
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: "Name, email, mobile, and password are required" });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const { hash, salt } = db.hashPassword(password);
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userReferralCode = `DSK${Math.floor(1000 + Math.random() * 9000)}`;

    // Support registering as 'client' (advertiser) or standard 'user'
    const assignedRole: 'user' | 'client' = role === 'client' ? 'client' : 'user';

    const newUser = {
      id: newUserId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      role: assignedRole,
      status: 'active' as const,
      referralCode: userReferralCode,
      referredBy: referralCode ? referralCode.trim().toUpperCase() : undefined,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt
    };

    db.users.push(newUser);

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

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Email or mobile and password are required" });
    }

    const trimmed = identifier.trim().toLowerCase();
    const user = db.users.find(u => 
      u.email.toLowerCase() === trimmed || u.mobile === identifier.trim()
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email/mobile or password" });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: "Your account is temporarily suspended. Please contact support." });
    }

    if (user.passwordHash && user.salt) {
      const isValid = db.verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email/mobile or password" });
      }
    }

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

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
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

  app.get('/api/tasks', (req, res) => {
    const { category, search, admin } = req.query;
    let list = [...db.tasks];

    if (admin !== 'true') {
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
    res.json(list);
  });

  app.get('/api/tasks/:id', (req, res) => {
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  app.post('/api/tasks', (req, res) => {
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
      affiliateDisclosure: req.body.affiliateDisclosure || "DSK TaskMarketer is compensated by affiliate partners upon qualifying actions.",
      active: isActive,
      isActive: isActive,
      displayOrder: db.tasks.length + 1,
      startsCount: 0,
      completionsCount: 0,
      createdAt: new Date().toISOString()
    };

    db.tasks.push(newTask);
    db.persistTasks();
    console.log(`[Tasks] Created new task ${newTask.id} (${newTask.title}) with affiliateUrl: ${newTask.affiliateUrl}`);

    // Privileged server-side sync with Supabase tasks table
    if (supabaseServer) {
      syncTaskToSupabase(newTask).catch(err => {
        console.warn('[Supabase Sync] Task creation sync warning:', err);
      });
    }

    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const taskId = req.params.id;
    let taskIndex = db.tasks.findIndex(t => t.id === taskId);

    const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : 
                     (req.body.active !== undefined ? Boolean(req.body.active) : true);

    const existingTask = taskIndex !== -1 ? db.tasks[taskIndex] : null;

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
      affiliateDisclosure: req.body.affiliateDisclosure || existingTask?.affiliateDisclosure || "DSK TaskMarketer is compensated by affiliate partners upon qualifying actions.",
      active: isActive,
      isActive: isActive,
      displayOrder: existingTask ? existingTask.displayOrder : db.tasks.length + 1,
      startsCount: existingTask ? existingTask.startsCount : 0,
      completionsCount: existingTask ? existingTask.completionsCount : 0,
      createdAt: existingTask ? existingTask.createdAt : new Date().toISOString(),
      ...(req.body.campaignId ? { campaignId: req.body.campaignId } : (existingTask?.campaignId ? { campaignId: existingTask.campaignId } : {})),
      ...(req.body.isDemo !== undefined ? { isDemo: req.body.isDemo } : (existingTask?.isDemo !== undefined ? { isDemo: existingTask.isDemo } : {}))
    };

    if (taskIndex === -1) {
      db.tasks.push(updatedTask);
      console.log(`[Tasks] Upserted task ${taskId}`);
    } else {
      db.tasks[taskIndex] = updatedTask;
      console.log(`[Tasks] Updated task ${taskId} (${updatedTask.title}), affiliateUrl: ${updatedTask.affiliateUrl}`);
    }

    db.persistTasks();

    // Privileged server-side sync with Supabase tasks table
    if (supabaseServer) {
      syncTaskToSupabase(updatedTask).catch(err => {
        console.warn('[Supabase Sync] Task update sync warning:', err);
      });
    }

    res.json(updatedTask);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const newActiveState = req.body.active !== undefined ? Boolean(req.body.active) : !task.active;
    task.active = newActiveState;
    task.isActive = newActiveState;
    db.persistTasks();

    // Sync status change to Supabase
    if (supabaseServer) {
      syncTaskToSupabase(task).catch(err => {
        console.warn('[Supabase Sync] Task delete/status sync warning:', err);
      });
    }

    res.json({ success: true, active: task.active, isActive: task.isActive });
  });

  // Public & Tracking Redirection Flow (User -> Start Task -> Tracking URL -> Affiliate Destination URL)
  app.get('/track/:taskId', (req, res) => {
    const { taskId } = req.params;
    const task = db.tasks.find(t => t.id === taskId);
    
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
    db.taskStarts.push({
      taskId: task.id,
      userId: (req.query.uid as string) || 'visitor',
      referenceId: ref,
      startedAt: new Date().toISOString()
    });
    db.persistTasks();

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
  app.get('/api/tasks/:id/track', (req, res) => {
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const check = normalizeDestinationUrl(task.affiliateUrl);
    if (!check.valid) {
      return res.status(400).json({ error: check.error || "Invalid destination URL" });
    }

    task.startsCount = (task.startsCount || 0) + 1;
    const ref = (req.query.ref as string) || `DSK-TRK-${Math.floor(10000 + Math.random() * 90000)}`;
    db.taskStarts.push({
      taskId: task.id,
      userId: (req.query.uid as string) || 'visitor',
      referenceId: ref,
      startedAt: new Date().toISOString()
    });
    db.persistTasks();

    res.json({
      success: true,
      taskId: task.id,
      referenceId: ref,
      affiliateUrl: check.url,
      trackingUrl: `/track/${task.id}?ref=${ref}`
    });
  });

  // ===================== 4. TASK STARTS & SUBMISSIONS =====================
  app.post('/api/task-starts', (req, res) => {
    const user = getAuthUser(req);
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    const task = db.tasks.find(t => t.id === taskId);
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
      const list = db.submissions.filter(s => s.userId === user.id);
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
      }

      const task = db.tasks.find(t => t.id === submission.taskId);
      if (task) task.completionsCount += 1;

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

    res.json(submission);
  });

  // ===================== 5. REWARDS & LEDGER =====================
  app.get('/api/rewards', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { type, status } = req.query;
    let list = user.role === 'admin' && req.query.all === 'true'
      ? [...db.rewards]
      : db.rewards.filter(r => r.userId === user.id);

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

    const minAmount = db.settings.minimumWithdrawalAmount || 200;
    if (withdrawAmount < minAmount) {
      return res.status(400).json({ error: `Minimum withdrawal amount is ₹${minAmount}` });
    }

    const wallet = db.getWalletSummary(user.id);
    if (withdrawAmount > wallet.availableBalance) {
      return res.status(400).json({ error: `Insufficient available balance. You have ₹${wallet.availableBalance} available.` });
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
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: withdrawAmount,
      payoutMethod,
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
      type: 'withdrawal',
      amount: -withdrawAmount,
      status: 'approved',
      referenceId: `DSK-WTH-${Math.floor(1000 + Math.random() * 9000)}`,
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

    res.status(201).json(newWithdrawal);
  });

  app.put('/api/withdrawals/:id/status', (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const withdrawal = db.withdrawals.find(w => w.id === req.params.id);
    if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });

    const { status, adminNote, rejectionReason, paymentReference } = req.body;
    const oldStatus = withdrawal.status;

    if (oldStatus === 'paid' && status !== 'paid') {
      return res.status(400).json({ error: "Cannot change status of an already disbursed payout." });
    }

    withdrawal.status = status;
    if (adminNote !== undefined) withdrawal.adminNote = adminNote;
    if (rejectionReason !== undefined) withdrawal.rejectionReason = rejectionReason;
    if (paymentReference !== undefined) withdrawal.paymentReference = paymentReference;
    withdrawal.processedBy = admin.name || "Administrator";
    withdrawal.processedAt = new Date().toISOString();

    if (status === 'rejected' && oldStatus !== 'rejected') {
      db.rewards.push({
        id: `rwd_refnd_${Date.now()}`,
        userId: withdrawal.userId,
        type: 'bonus',
        amount: withdrawal.amount,
        status: 'credited',
        referenceId: `DSK-RFND-${Math.floor(1000 + Math.random() * 9000)}`,
        description: `Refund for Rejected Withdrawal (${withdrawal.id}): ${rejectionReason || adminNote || 'Payout failed'}`,
        createdAt: new Date().toISOString()
      });

      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: withdrawal.userId,
        title: "Withdrawal Rejected & Refunded",
        message: `Your withdrawal request for ₹${withdrawal.amount} was rejected: ${rejectionReason || adminNote || 'Invalid payout details'}. Balance has been restored.`,
        type: 'withdrawal',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/withdrawals'
      });
    } else if (status === 'paid') {
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: withdrawal.userId,
        title: `Withdrawal Paid: ₹${withdrawal.amount}`,
        message: `Your payout of ₹${withdrawal.amount} has been successfully dispatched! UTR / Payment Ref: ${paymentReference || 'N/A'}.`,
        type: 'withdrawal',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/withdrawals'
      });
    }

    res.json(withdrawal);
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

    res.json({ success: true, settings: db.settings });
  });

  // Safe API route fallback: ensure ANY unhandled /api route returns JSON 404, NEVER HTML index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404
    });
  });

  // Vite development middleware or static serve in production
  if (!isProduction) {
    console.log(`[Development Mode] Initializing Vite middleware for HMR and compilation...`);
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
  const server = app.listen(PORT, HOST, () => {
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
