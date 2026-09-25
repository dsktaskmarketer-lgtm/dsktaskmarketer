import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Users, 
  CheckSquare, 
  FileCheck, 
  Wallet, 
  ArrowUpRight, 
  Gift, 
  Award, 
  Briefcase, 
  ShieldCheck, 
  Loader2,
  Database,
  Layers,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { User, Task, TaskSubmission, Withdrawal, ReferralRecord, CampaignEnquiry, AdminIncentivesOverview } from '../../types';
import { getStoredToken } from '../../services/api';

export const AdminReportsView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Raw Data States
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [incentives, setIncentives] = useState<AdminIncentivesOverview | null>(null);
  const [enquiries, setEnquiries] = useState<CampaignEnquiry[]>([]);

  useEffect(() => {
    fetchAllReportsData();
  }, []);

  const fetchAllReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const [
        usersRes,
        tasksRes,
        subsRes,
        withdrawalsRes,
        referralsRes,
        incentivesRes,
        enquiriesRes
      ] = await Promise.all([
        fetch('/api/admin/users', { headers }).then(r => r.json()).catch(() => ({ users: [] })),
        fetch('/api/tasks?admin=true', { headers }).then(r => r.json()).catch(() => ({ tasks: [] })),
        fetch('/api/admin/submissions', { headers }).then(r => r.json()).catch(() => ({ submissions: [] })),
        fetch('/api/admin/withdrawals', { headers }).then(r => r.json()).catch(() => ({ withdrawals: [] })),
        fetch('/api/admin/referrals', { headers }).then(r => r.json()).catch(() => ({ referrals: [] })),
        fetch('/api/admin/incentives', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/admin/campaign-enquiries', { headers }).then(r => r.json()).catch(() => ({ enquiries: [] }))
      ]);

      setUsers(Array.isArray(usersRes.users) ? usersRes.users : (Array.isArray(usersRes) ? usersRes : []));
      setTasks(Array.isArray(tasksRes.tasks) ? tasksRes.tasks : (Array.isArray(tasksRes) ? tasksRes : []));
      setSubmissions(Array.isArray(subsRes.submissions) ? subsRes.submissions : (Array.isArray(subsRes) ? subsRes : []));
      setWithdrawals(Array.isArray(withdrawalsRes.withdrawals) ? withdrawalsRes.withdrawals : (Array.isArray(withdrawalsRes) ? withdrawalsRes : []));
      setReferrals(Array.isArray(referralsRes.referrals) ? referralsRes.referrals : (Array.isArray(referralsRes) ? referralsRes : []));
      setIncentives(incentivesRes || null);
      setEnquiries(Array.isArray(enquiriesRes.enquiries) ? enquiriesRes.enquiries : (Array.isArray(enquiriesRes) ? enquiriesRes : []));

    } catch (err: any) {
      console.error('Failed to load reports data:', err);
      setError(err.message || 'Failed to fetch platform records from database.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Universal Download Helpers
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Successfully downloaded Excel report: ${filename}`);
  };

  const downloadPDF = (reportTitle: string, headers: string[], rows: (string | number)[][]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for PDF downloads.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle} - DSK TaskMarketer</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; margin: 20px; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0B1F4D; padding-bottom: 12px; }
            .logo { font-size: 20px; font-weight: 900; color: #0B1F4D; }
            .title { font-size: 16px; font-weight: bold; margin-top: 4px; color: #334155; }
            .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; word-break: break-word; }
            th { background-color: #0B1F4D; color: #ffffff; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">DSK TaskMarketer — Admin Portal</div>
            <div class="title">${reportTitle}</div>
            <div class="meta">Generated on: ${new Date().toLocaleString()} | Total Records: ${rows.length}</div>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell !== undefined && cell !== null ? cell : ''}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <div class="footer">
            Confidential Platform Report © ${new Date().getFullYear()} DSK TaskMarketer. All rights reserved.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    showToast(`Successfully prepared PDF report: ${reportTitle}`);
  };

  // --- REPORT EXPORTERS ---

  // 1. Users Report
  const exportUsersPDF = () => {
    const headers = ['User ID', 'First Name', 'Last Name', 'Full Name', 'Mobile', 'Email', 'Referral Code', 'Referred By', 'Role', 'Joined Date', 'Status'];
    const rows = users.map(u => {
      const parts = (u.name || '').trim().split(' ');
      const fn = parts[0] || '';
      const ln = parts.slice(1).join(' ') || '';
      return [
        u.id,
        fn,
        ln,
        u.name,
        u.mobile || '-',
        u.email,
        u.referralCode || '-',
        u.referredBy || '-',
        u.role,
        new Date(u.createdAt || Date.now()).toLocaleDateString(),
        u.status || 'active'
      ];
    });
    downloadPDF('DSK TaskMarketer — Users Report', headers, rows);
  };

  const exportUsersExcel = () => {
    const headers = ['User ID', 'First Name', 'Last Name', 'Full Name', 'Mobile Number', 'Email Address', 'Referral Code', 'Referred By', 'Account Type', 'Registration Date', 'Account Status'];
    const rows = users.map(u => {
      const parts = (u.name || '').trim().split(' ');
      const fn = parts[0] || '';
      const ln = parts.slice(1).join(' ') || '';
      return [
        u.id,
        fn,
        ln,
        u.name,
        u.mobile || '-',
        u.email,
        u.referralCode || '-',
        u.referredBy || '-',
        u.role,
        new Date(u.createdAt || Date.now()).toLocaleDateString(),
        u.status || 'active'
      ];
    });
    downloadCSV(`DSK_TaskMarketer_Users_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 2. Tasks Report
  const exportTasksPDF = () => {
    const headers = ['Task ID', 'Title', 'Category', 'Reward (₹)', 'Target Count', 'Completed', 'Status', 'Created Date'];
    const rows = tasks.map(t => [
      t.id,
      t.title,
      t.category,
      t.rewardAmount,
      t.targetCount,
      t.completedCount || 0,
      t.active ? 'Active' : 'Paused',
      new Date(t.createdAt || Date.now()).toLocaleDateString()
    ]);
    downloadPDF('DSK TaskMarketer — Tasks Report', headers, rows);
  };

  const exportTasksExcel = () => {
    const headers = ['Task ID', 'Task Title', 'Category', 'Reward Amount (INR)', 'Target Count', 'Completed Count', 'Task Status', 'Creation Date'];
    const rows = tasks.map(t => [
      t.id,
      t.title,
      t.category,
      t.rewardAmount,
      t.targetCount,
      t.completedCount || 0,
      t.active ? 'Active' : 'Paused',
      new Date(t.createdAt || Date.now()).toLocaleDateString()
    ]);
    downloadCSV(`DSK_TaskMarketer_Tasks_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 3. Task Submissions Report
  const exportSubmissionsPDF = () => {
    const headers = ['Sub ID', 'Task ID', 'User ID', 'User Name', 'Status', 'Proof / Details', 'Submitted At'];
    const rows = submissions.map(s => [
      s.id,
      s.taskId,
      s.userId,
      s.userName || 'User',
      s.status,
      s.proofText || s.proofImage || '-',
      new Date(s.submittedAt || Date.now()).toLocaleString()
    ]);
    downloadPDF('DSK TaskMarketer — Task Submissions Report', headers, rows);
  };

  const exportSubmissionsExcel = () => {
    const headers = ['Submission ID', 'Task ID', 'User ID', 'User Name', 'Submission Status', 'Proof Details', 'Submission Timestamp'];
    const rows = submissions.map(s => [
      s.id,
      s.taskId,
      s.userId,
      s.userName || 'User',
      s.status,
      s.proofText || s.proofImage || '-',
      new Date(s.submittedAt || Date.now()).toLocaleString()
    ]);
    downloadCSV(`DSK_TaskMarketer_Submissions_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 4. Wallet / Earnings Report
  const exportWalletPDF = () => {
    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Referral Code'];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.status || 'active',
      u.referralCode || '-'
    ]);
    downloadPDF('DSK TaskMarketer — Wallet & Earnings User Summary Report', headers, rows);
  };

  const exportWalletExcel = () => {
    const headers = ['User ID', 'Full Name', 'Email Address', 'Account Role', 'Account Status', 'Referral Code'];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.status || 'active',
      u.referralCode || '-'
    ]);
    downloadCSV(`DSK_TaskMarketer_Wallet_Earnings_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 5. Withdrawals Report
  const exportWithdrawalsPDF = () => {
    const headers = ['Withdrawal ID', 'User ID', 'Amount (₹)', 'Method', 'Details / UPI', 'Status', 'Requested At'];
    const rows = withdrawals.map(w => [
      w.id,
      w.userId,
      w.amount,
      w.payoutMethod,
      w.payoutDetails?.upiId || w.payoutDetails?.accountNumber || '-',
      w.status,
      new Date(w.requestedAt || Date.now()).toLocaleString()
    ]);
    downloadPDF('DSK TaskMarketer — Withdrawals Report', headers, rows);
  };

  const exportWithdrawalsExcel = () => {
    const headers = ['Withdrawal ID', 'User ID', 'Amount (INR)', 'Payout Method', 'Destination Details', 'Withdrawal Status', 'Request Timestamp'];
    const rows = withdrawals.map(w => [
      w.id,
      w.userId,
      w.amount,
      w.payoutMethod,
      w.payoutDetails?.upiId || w.payoutDetails?.accountNumber || '-',
      w.status,
      new Date(w.requestedAt || Date.now()).toLocaleString()
    ]);
    downloadCSV(`DSK_TaskMarketer_Withdrawals_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 6. Referrals Report
  const exportReferralsPDF = () => {
    const headers = ['Referrer ID', 'Referrer Code', 'Referred User ID', 'Reward (₹)', 'Date'];
    const rows = referrals.map(r => [
      r.referrerId,
      r.referrerCode,
      r.referredUserId,
      r.rewardAmount,
      new Date(r.createdAt || Date.now()).toLocaleDateString()
    ]);
    downloadPDF('DSK TaskMarketer — Referrals Report', headers, rows);
  };

  const exportReferralsExcel = () => {
    const headers = ['Referrer ID', 'Referrer Code', 'Referred User ID', 'Reward Amount (INR)', 'Referral Date'];
    const rows = referrals.map(r => [
      r.referrerId,
      r.referrerCode,
      r.referredUserId,
      r.rewardAmount,
      new Date(r.createdAt || Date.now()).toLocaleDateString()
    ]);
    downloadCSV(`DSK_TaskMarketer_Referrals_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 7. Monthly Incentives Report
  const exportIncentivesPDF = () => {
    const headers = ['Milestone ID', 'Title', 'Target Count', 'Reward (₹)', 'Active Status'];
    const milestones = incentives?.milestones || [];
    const rows = milestones.map((m: any) => [
      m.id,
      m.title,
      m.targetCount,
      m.rewardAmount,
      m.isActive ? 'Active' : 'Inactive'
    ]);
    downloadPDF('DSK TaskMarketer — Monthly Incentives Report', headers, rows);
  };

  const exportIncentivesExcel = () => {
    const headers = ['Milestone ID', 'Milestone Title', 'Target Count', 'Reward Amount (INR)', 'Active Status'];
    const milestones = incentives?.milestones || [];
    const rows = milestones.map((m: any) => [
      m.id,
      m.title,
      m.targetCount,
      m.rewardAmount,
      m.isActive ? 'Active' : 'Inactive'
    ]);
    downloadCSV(`DSK_TaskMarketer_Incentives_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 8. Partner Enquiries Report
  const exportEnquiriesPDF = () => {
    const headers = ['Enquiry ID', 'Client Name', 'Company', 'Email', 'Mobile', 'Budget', 'Status', 'Created At'];
    const rows = enquiries.map(e => [
      e.id,
      e.clientName,
      e.companyName || '-',
      e.email,
      e.mobile,
      e.budget || '-',
      e.status,
      new Date(e.createdAt || Date.now()).toLocaleDateString()
    ]);
    downloadPDF('DSK TaskMarketer — Partner Enquiries Report', headers, rows);
  };

  const exportEnquiriesExcel = () => {
    const headers = ['Enquiry ID', 'Client Name', 'Company Name', 'Email Address', 'Mobile Number', 'Budget', 'Enquiry Status', 'Creation Date'];
    const rows = enquiries.map(e => [
      e.id,
      e.clientName,
      e.companyName || '-',
      e.email,
      e.mobile,
      e.budget || '-',
      e.status,
      new Date(e.createdAt || Date.now()).toLocaleDateString()
    ]);
    downloadCSV(`DSK_TaskMarketer_Enquiries_Report_${Date.now()}.xlsx`, headers, rows);
  };

  // 9. Overall / Complete Platform Report
  const exportCompletePlatformPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DSK TaskMarketer — Complete Platform Master Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; margin: 20px; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #0B1F4D; padding-bottom: 15px; }
            .logo { font-size: 22px; font-weight: 900; color: #0B1F4D; }
            .title { font-size: 18px; font-weight: bold; margin-top: 5px; color: #334155; }
            .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
            h2 { color: #0B1F4D; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 30px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; word-break: break-word; }
            th { background-color: #0B1F4D; color: #ffffff; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">DSK TaskMarketer — Master Admin Console</div>
            <div class="title">Complete Platform Master Report</div>
            <div class="meta">Generated: ${new Date().toLocaleString()} | Total Users: ${users.length} | Total Tasks: ${tasks.length} | Total Withdrawals: ${withdrawals.length}</div>
          </div>

          <h2>1. Users (${users.length})</h2>
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Ref Code</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              ${users.map(u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.mobile || '-'}</td><td>${u.referralCode || '-'}</td><td>${u.role}</td><td>${u.status}</td></tr>`).join('')}
            </tbody>
          </table>

          <h2>2. Tasks (${tasks.length})</h2>
          <table>
            <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Reward</th><th>Target</th><th>Completed</th><th>Status</th></tr></thead>
            <tbody>
              ${tasks.map(t => `<tr><td>${t.id}</td><td>${t.title}</td><td>${t.category}</td><td>₹${t.rewardAmount}</td><td>${t.targetCount}</td><td>${t.completedCount || 0}</td><td>${t.active ? 'Active' : 'Paused'}</td></tr>`).join('')}
            </tbody>
          </table>

          <h2>3. Withdrawals (${withdrawals.length})</h2>
          <table>
            <thead><tr><th>ID</th><th>User ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Requested At</th></tr></thead>
            <tbody>
              ${withdrawals.map(w => `<tr><td>${w.id}</td><td>${w.userId}</td><td>₹${w.amount}</td><td>${w.payoutMethod}</td><td>${w.status}</td><td>${new Date(w.requestedAt || Date.now()).toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>

          <h2>4. Partner Enquiries (${enquiries.length})</h2>
          <table>
            <thead><tr><th>ID</th><th>Client</th><th>Company</th><th>Email</th><th>Mobile</th><th>Status</th></tr></thead>
            <tbody>
              ${enquiries.map(e => `<tr><td>${e.id}</td><td>${e.clientName}</td><td>${e.companyName || '-'}</td><td>${e.email}</td><td>${e.mobile}</td><td>${e.status}</td></tr>`).join('')}
            </tbody>
          </table>

          <div class="footer">
            Master Platform Export © ${new Date().getFullYear()} DSK TaskMarketer. Confidential.
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    showToast('Successfully prepared Complete Platform Master PDF Report.');
  };

  const exportCompletePlatformExcel = () => {
    // Generate a multi-section CSV or combined CSV for all tables
    const headers = ['Record Type', 'Record ID', 'Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7'];
    const rows: (string | number)[][] = [];

    users.forEach(u => rows.push(['USER', u.id, u.name, u.email, u.mobile || '-', u.referralCode || '-', u.referredBy || '-', u.role, u.status]));
    tasks.forEach(t => rows.push(['TASK', t.id, t.title, t.category, `₹${t.rewardAmount}`, t.targetCount, t.completedCount || 0, t.active ? 'Active' : 'Paused', '']));
    withdrawals.forEach(w => rows.push(['WITHDRAWAL', w.id, w.userId, `₹${w.amount}`, w.payoutMethod, w.status, w.requestedAt, '', '']));
    enquiries.forEach(e => rows.push(['ENQUIRY', e.id, e.clientName, e.companyName || '-', e.email, e.mobile, e.status, '', '']));

    downloadCSV(`DSK_Complete_Platform_Master_Report_${Date.now()}.xlsx`, headers, rows);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-block mb-1">
            Admin Intelligence & Audits
          </span>
          <h1 className="text-2xl font-black text-slate-900">Platform Reports Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download complete, unpaginated records directly from the database in PDF or Excel (.xlsx) format.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportCompletePlatformPDF}
            className="px-4 py-2.5 bg-[#0B1F4D] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-yellow-400" />
            <span>Download Complete Master PDF</span>
          </button>
          <button
            onClick={exportCompletePlatformExcel}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Download Complete Master Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-600">Fetching latest platform records from database...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-800 text-xs font-bold">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Overall Platform Report Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Master</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">1. Overall Platform Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Aggregated platform health, users, tasks, withdrawals, and system metrics summary.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportCompletePlatformPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportCompletePlatformExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 2. Users Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{users.length} Records</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">2. Users Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Complete database list of all registered members, account types, IDs, and referral codes.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportUsersPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportUsersExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 3. Tasks Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{tasks.length} Records</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">3. Tasks Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                All platform tasks, categories, reward amounts, targets, and completion statistics.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportTasksPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportTasksExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 4. Task Submissions Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-700 font-bold">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{submissions.length} Records</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">4. Task Submissions Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Member proof submissions, verification statuses, timestamps, and reviewer notes.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportSubmissionsPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportSubmissionsExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 5. Wallet / Earnings Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{users.length} Users</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">5. Wallet / Earnings Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Member wallet summaries, task earnings ledgers, and credit histories.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportWalletPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportWalletExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 6. Withdrawals Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">{withdrawals.length} Records</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">6. Withdrawals Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Payout requests, UPI / bank account destinations, audit statuses, and payout amounts.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportWithdrawalsPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportWithdrawalsExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 7. Referrals Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{referrals.length} Records</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">7. Referrals Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Member referral networks, DSKF referral code usage, and referral reward logs.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportReferralsPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportReferralsExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 8. Monthly Incentives Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-700 font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{incentives?.milestones?.length || 0} Milestones</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">8. Monthly Incentives Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Monthly incentive milestones, reward slabs, and user achievement metrics.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportIncentivesPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportIncentivesExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* 9. Partner Enquiries Report */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{enquiries.length} Records</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">9. Partner Enquiries Report</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Advertiser campaign enquiries, client budgets, contact information, and pipeline statuses.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={exportEnquiriesPDF}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportEnquiriesExcel}
                className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
