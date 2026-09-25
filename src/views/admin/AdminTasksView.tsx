import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Task, TaskCategory, AIDraftTask } from '../../types';
import { AdminUserLinkCard } from '../../components/admin/AdminUserLinkCard';
import { AITaskCreatorModal } from '../../components/admin/AITaskCreatorModal';
import { isInstructionOrMetaText } from '../../utils/aiValidation';
import { generateAITasks } from '../../services/api';

interface AdminTasksViewProps {
  tasks: Task[];
  categories: TaskCategory[];
  onCreateTask: (data: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onNavigate?: (view: string, id?: string) => void;
  onRefresh?: () => Promise<void>;
}

interface AIAssistantState {
  missingFields: string[];
  missingQuestions: string[];
  partnerIdentified?: string;
  categoryIdentified?: string;
  originalPrompt?: string;
}

export const AdminTasksView: React.FC<AdminTasksViewProps> = ({
  tasks,
  categories,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onNavigate,
  onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(tasks.length === 0);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [partnerName, setPartnerName] = useState('');
  const [rewardAmount, setRewardAmount] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [proofText, setProofText] = useState('');
  const [terms, setTerms] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // AI Assistant in Form State
  const [aiAssistant, setAiAssistant] = useState<AIAssistantState | null>(null);
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [isInlineGenerating, setIsInlineGenerating] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineInputValues, setInlineInputValues] = useState<{ [key: string]: string }>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh tasks on mount if onRefresh callback is provided
  useEffect(() => {
    let isMounted = true;
    if (onRefresh) {
      setRefreshing(true);
      setFetchError(null);
      onRefresh()
        .then(() => {
          if (isMounted) {
            setFetchError(null);
            setInitialLoading(false);
          }
        })
        .catch((err: any) => {
          if (isMounted) {
            console.error('[AdminTasksView] Refresh on mount failed:', err);
            setFetchError(err?.message || 'Failed to retrieve tasks from database.');
            setInitialLoading(false);
          }
        })
        .finally(() => {
          if (isMounted) {
            setRefreshing(false);
          }
        });
    } else {
      setInitialLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    setFetchError(null);
    try {
      await onRefresh();
      setFetchError(null);
    } catch (err: any) {
      console.error('[AdminTasksView] Manual refresh failed:', err);
      setFetchError(err?.message || 'Failed to retrieve tasks from database.');
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  };

  const handleOpenCreateWithPrefill = (prefill: Partial<Task>, aiAssistantInfo?: AIAssistantState) => {
    setEditingTask(null);
    setTitle(prefill.title || '');
    setCategoryId(prefill.categoryId || categories[0]?.id || '');
    setPartnerName(prefill.partnerName || '');
    setRewardAmount(prefill.rewardAmount !== undefined && prefill.rewardAmount !== null && Number(prefill.rewardAmount) > 0 ? Number(prefill.rewardAmount) : '');
    setDescription(prefill.description || '');
    setEligibility(prefill.eligibility || '');
    setStepsText(Array.isArray(prefill.steps) ? prefill.steps.join('\n') : (prefill.steps || ''));
    setProofText(Array.isArray(prefill.proofRequirements) ? prefill.proofRequirements.join('\n') : (prefill.proofRequirements || ''));
    setTerms(prefill.terms || 'Verified reward payable upon compliance approval and partner audit confirmation.');
    setAffiliateUrl(prefill.affiliateUrl || '');
    setIsActive(true);
    setError(null);
    setAiAssistant(aiAssistantInfo || null);
    setInlinePrompt(aiAssistantInfo?.originalPrompt || '');
    setInlineError(null);
    setInlineNotice(null);
    setInlineInputValues({});
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    handleOpenCreateWithPrefill({});
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setCategoryId(task.categoryId || categories[0]?.id || '');
    setPartnerName(task.partnerName || '');
    setRewardAmount(task.rewardAmount ?? '');
    setDescription(task.description || '');
    setEligibility(task.eligibility || '');
    setStepsText(Array.isArray(task.steps) ? task.steps.join('\n') : '');
    setProofText(Array.isArray(task.proofRequirements) ? task.proofRequirements.join('\n') : '');
    setTerms(task.terms || '');
    setAffiliateUrl(task.affiliateUrl || '');
    setIsActive(task.isActive ?? task.active ?? true);
    setError(null);
    setAiAssistant(null);
    setInlineError(null);
    setInlineNotice(null);
    setModalOpen(true);
  };

  // Inline AI Task extraction for the Create Task Form
  const handleInlineAIExtract = async (promptToUse?: string) => {
    const text = (promptToUse !== undefined ? promptToUse : inlinePrompt).trim();
    if (!text || isInstructionOrMetaText(text)) {
      setInlineError("Please describe the actual task you want to create.");
      return;
    }

    setIsInlineGenerating(true);
    setInlineError(null);
    setInlineNotice(null);

    try {
      const res = await generateAITasks(text);
      if (res.success && res.tasks && res.tasks.length > 0) {
        const draft = res.tasks[0];
        setTitle(draft.title || '');
        if (draft.categoryId) {
          setCategoryId(draft.categoryId);
        }
        setPartnerName(draft.company && draft.company !== 'Partner Offer' ? draft.company : '');
        setRewardAmount(draft.rewardAmount > 0 ? draft.rewardAmount : '');
        setDescription(draft.description || '');
        setEligibility(draft.eligibility || '');
        setStepsText(Array.isArray(draft.instructions) ? draft.instructions.join('\n') : '');
        setProofText(Array.isArray(draft.proofRequirements) ? draft.proofRequirements.join('\n') : '');
        setTerms(draft.terms || 'Verified reward payable upon compliance approval and partner audit confirmation.');
        setAffiliateUrl(draft.destinationUrl && draft.destinationUrl !== 'Information Required' ? draft.destinationUrl : '');

        const missingFields = draft.missingFields || [];
        const missingQuestions = draft.missingQuestions || [];
        setAiAssistant({
          missingFields,
          missingQuestions,
          partnerIdentified: draft.company,
          categoryIdentified: draft.categorySlug,
          originalPrompt: text
        });

        if (res.error) {
          setInlineNotice(res.error);
        }
      } else {
        setInlineError(res.error || "Please describe the actual task you want to create.");
      }
    } catch (err: any) {
      setInlineError(err.message || "Please describe the actual task you want to create.");
    } finally {
      setIsInlineGenerating(false);
    }
  };

  const handleResolveMissingField = (fieldKey: string, value: string) => {
    if (!value || !value.trim()) return;
    const clean = value.trim();

    if (fieldKey === 'rewardAmount') {
      const num = Number(clean);
      if (!isNaN(num) && num > 0) {
        setRewardAmount(num);
      }
    } else if (fieldKey === 'destinationUrl' || fieldKey === 'affiliateUrl') {
      setAffiliateUrl(clean);
    } else if (fieldKey === 'eligibility') {
      setEligibility(clean);
    } else if (fieldKey === 'partnerName') {
      setPartnerName(clean);
    }

    if (aiAssistant) {
      setAiAssistant({
        ...aiAssistant,
        missingFields: aiAssistant.missingFields.filter(f => f !== fieldKey && f !== (fieldKey === 'destinationUrl' ? 'affiliateUrl' : fieldKey)),
        missingQuestions: aiAssistant.missingQuestions.filter(q => {
          if (fieldKey === 'rewardAmount' && q.toLowerCase().includes('reward')) return false;
          if ((fieldKey === 'destinationUrl' || fieldKey === 'affiliateUrl') && (q.toLowerCase().includes('url') || q.toLowerCase().includes('link'))) return false;
          if (fieldKey === 'eligibility' && q.toLowerCase().includes('eligibility')) return false;
          return true;
        })
      });
    }

    setInlineInputValues(prev => ({ ...prev, [fieldKey]: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const cleanTitle = (title || '').trim();
      if (!cleanTitle || cleanTitle === 'Information Required') {
        setError('Task Title is required.');
        setSaving(false);
        return;
      }

      if (!categoryId) {
        setError('Please select a valid Category.');
        setSaving(false);
        return;
      }

      const cleanPartner = (partnerName || '').trim();
      if (!cleanPartner || cleanPartner === 'Information Required') {
        setError('Partner / Bank Name is required.');
        setSaving(false);
        return;
      }

      const numReward = Number(rewardAmount);
      if (rewardAmount === '' || isNaN(numReward) || numReward <= 0) {
        setError('Reward Amount is required and must be greater than ₹0 (minimum ₹10).');
        setSaving(false);
        return;
      }

      const cleanUrl = (affiliateUrl || '').trim();
      if (!cleanUrl || cleanUrl === 'Information Required') {
        setError('Official Affiliate / Application Destination URL is required.');
        setSaving(false);
        return;
      }
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        setError('Affiliate Destination URL must start with http:// or https://');
        setSaving(false);
        return;
      }

      const cleanDesc = (description || '').trim();
      if (!cleanDesc || cleanDesc === 'Information Required') {
        setError('Task Description is required.');
        setSaving(false);
        return;
      }

      const cleanSteps = stepsText.split('\n').map(s => s.trim()).filter(Boolean);
      if (cleanSteps.length === 0) {
        setError('At least one required step instruction must be provided.');
        setSaving(false);
        return;
      }

      const cleanProofs = proofText.split('\n').map(p => p.trim()).filter(Boolean);
      if (cleanProofs.length === 0) {
        setError('Proof Requirements are required. Please specify what safe proof users should submit.');
        setSaving(false);
        return;
      }

      const sensitiveKeywords = [
        'pan number', 'pan card', 'pan ', 'pan:', 
        'aadhaar', 'aadhar', 
        'otp', 'one time password', 
        'pin', 'cvv', 
        'password', 'banking credential', 'net banking', 'debit card pin', 'atm pin'
      ];
      const lowerProof = proofText.toLowerCase();
      const detectedSensitive = sensitiveKeywords.find(kw => lowerProof.includes(kw));
      if (detectedSensitive) {
        setError(
          `Financial Task Safety Violation: Never request ${detectedSensitive.toUpperCase()} as task proof! Sensitive information must only be entered by the user directly on the official financial institution portal.`
        );
        setSaving(false);
        return;
      }

      const taskData: Partial<Task> = {
        title: cleanTitle,
        categoryId,
        partnerName: cleanPartner,
        rewardAmount: numReward,
        description: cleanDesc,
        eligibility: (eligibility || '').trim(),
        steps: cleanSteps,
        proofRequirements: cleanProofs,
        terms: (terms || '').trim(),
        affiliateUrl: cleanUrl,
        affiliateDisclosure: 'DSK TaskMarketer receives financial affiliate compensation from partner for qualified consumer actions.',
        isActive,
      };

      if (editingTask) {
        await onUpdateTask(editingTask.id, taskData);
      } else {
        await onCreateTask(taskData);
      }

      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const filteredTasks = tasks.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 text-[#0B1F4D]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md inline-block">
              Admin Inventory
            </span>
            {fetchError ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-bold border border-red-200">
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span>Supabase Sync Failed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Supabase Connected ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0B1F4D]">Task Management</h1>
          <p className="text-xs text-[#0B1F4D]/70 mt-0.5">
            Real-time synchronization with Supabase <code className="font-mono bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-[11px]">public.tasks</code> table.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Reload all tasks directly from Supabase database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}

          <button
            onClick={() => setAiModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Other Task / AI Task Creator</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#0B1F4D] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-yellow-300" />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-red-700">Supabase Connection Error</h4>
              <p className="text-xs text-red-800 mt-0.5 font-medium">{fetchError}</p>
              <p className="text-[11px] text-red-600 mt-0.5">
                The tasks table could not be fetched from Supabase <code className="font-mono bg-red-100 px-1 py-0.5 rounded text-[10px]">public.tasks</code>. Please verify network access or click retry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-blue-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-blue-600" />
        <input
          type="text"
          value={search || ''}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter tasks by name or partner..."
          className="w-full text-xs text-[#0B1F4D] focus:outline-none placeholder-blue-900/40"
        />
      </div>

      {/* 1x4 Responsive Task Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-blue-200 p-8 space-y-3 shadow-xs">
            {initialLoading && refreshing ? (
              <div className="space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="font-bold text-base text-[#0B1F4D]">Connecting to Supabase Database...</p>
                <p className="text-xs text-[#0B1F4D]/70 max-w-md mx-auto">
                  Loading task records from <code className="font-mono bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-[11px]">public.tasks</code>.
                </p>
              </div>
            ) : fetchError ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="font-bold text-base text-red-900">Database Query Failed</p>
                <p className="text-xs text-red-700 max-w-md mx-auto font-medium">
                  {fetchError}
                </p>
                <p className="text-[11px] text-[#0B1F4D]/70">
                  Could not retrieve records from Supabase. Verify database credentials and network connectivity.
                </p>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Retry Supabase Query</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Layers className="w-10 h-10 text-blue-300 mx-auto" />
                <p className="font-bold text-base text-[#0B1F4D]">No tasks found</p>
                <p className="text-xs text-[#0B1F4D]/70 max-w-md mx-auto">
                  {search ? 'No tasks match your current search query.' : 'There are currently no tasks in the database.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      disabled={refreshing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 border border-blue-200 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                      <span>{refreshing ? 'Reloading...' : 'Reload from Database'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B1F4D] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Create New Task</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredTasks.map(task => {
            const category = categories.find(c => c.id === task.categoryId);
            return (
              <div key={task.id} className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-all text-[#0B1F4D] min-w-0">
                {/* Header: Category Badge & Status Toggle */}
                <div className="flex items-center justify-between gap-2 border-b border-blue-100 pb-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-200 truncate max-w-[130px]">
                    {category?.name || 'Task'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateTask(task.id, { isActive: !task.isActive })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer shrink-0 ${
                      task.isActive ? 'bg-blue-600 text-white' : 'bg-yellow-100 text-[#0B1F4D] border border-yellow-300'
                    }`}
                    title="Toggle task active status"
                  >
                    {task.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Task Info: Title, Partner, Reward */}
                <div className="space-y-1.5 min-w-0">
                  <h3 className="font-extrabold text-[#0B1F4D] text-xs leading-snug line-clamp-2" title={task.title}>
                    {task.title}
                  </h3>
                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
                    <p className="text-[#0B1F4D]/70 font-medium truncate">
                      Partner: <span className="font-bold text-[#0B1F4D]">{task.partnerName}</span>
                    </p>
                    <span className="text-xs font-black text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                      ₹{task.rewardAmount}
                    </span>
                  </div>
                </div>

                {/* User Task Link & Share Section */}
                <AdminUserLinkCard
                  compact={true}
                  taskId={task.id}
                  taskTitle={task.title}
                  partnerName={task.partnerName}
                  rewardAmount={task.rewardAmount}
                  onNavigate={onNavigate}
                />

                {/* Footer: Completions & Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-blue-100 text-[11px]">
                  <span className="text-[10px] text-[#0B1F4D]/70 font-medium">
                    Completions: <strong className="text-[#0B1F4D] font-bold">{task.completionsCount}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(task)}
                      className="px-2 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07152F]/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-blue-200 text-[#0B1F4D]">
            <div className="px-6 py-4 bg-white border-b border-blue-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0B1F4D] text-base">
                  {editingTask ? 'Edit Task Configuration' : 'Create New Financial Task'}
                </h3>
                <p className="text-[11px] text-[#0B1F4D]/70">
                  {editingTask ? 'Modify and publish updates to existing partner task.' : 'Fill task details directly or use AI to auto-populate from your prompt.'}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[#0B1F4D]/60 hover:text-[#0B1F4D] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Inline AI Quick-Fill Bar (Only on New Task Creation) */}
              {!editingTask && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#0B1F4D] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      AI Natural Language Auto-Fill
                    </span>
                    <span className="text-[11px] text-blue-700 font-medium">
                      One prompt → Populates form automatically
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={inlinePrompt}
                      onChange={(e) => {
                        setInlinePrompt(e.target.value);
                        if (inlineError) setInlineError(null);
                      }}
                      placeholder='e.g. "Kotak 811 account opening, complete KYC, reward ₹250. Link: https://kotak.com/811"'
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      disabled={isInlineGenerating || !inlinePrompt.trim()}
                      onClick={() => handleInlineAIExtract()}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      {isInlineGenerating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Auto-Fill Form</span>
                        </>
                      )}
                    </button>
                  </div>

                  {inlineError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                      <span>{inlineError}</span>
                    </div>
                  )}

                  {inlineNotice && (
                    <div className="p-2.5 rounded-lg bg-yellow-50 border border-yellow-300 text-[11px] text-[#0B1F4D] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-yellow-600" />
                      <span>{inlineNotice}</span>
                    </div>
                  )}
                </div>
              )}

              {/* AI Assistant Findings & Missing Information Callout */}
              {aiAssistant && (
                <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-300 text-[#0B1F4D] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-[#0B1F4D]">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      AI Extraction Status
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiAssistant(null)}
                      className="text-[10px] text-blue-700 hover:underline cursor-pointer"
                    >
                      Dismiss banner
                    </button>
                  </div>

                  <div className="text-[11px] flex flex-wrap gap-x-4 gap-y-1 text-[#0B1F4D]/80">
                    {aiAssistant.partnerIdentified && (
                      <span><strong>Identified Partner:</strong> {aiAssistant.partnerIdentified}</span>
                    )}
                    {aiAssistant.categoryIdentified && (
                      <span><strong>Mapped Category:</strong> {aiAssistant.categoryIdentified}</span>
                    )}
                  </div>

                  {aiAssistant.missingQuestions && aiAssistant.missingQuestions.length > 0 ? (
                    <div className="mt-2 pt-2 border-t border-yellow-200 space-y-2">
                      <div className="text-[11px] font-bold text-[#0B1F4D]">
                        The admin did not provide the following information in the prompt. Please provide it below or in the form fields:
                      </div>
                      <div className="space-y-2">
                        {aiAssistant.missingQuestions.map((q, idx) => {
                          const lowerQ = q.toLowerCase();
                          const isReward = lowerQ.includes('reward') || lowerQ.includes('payout');
                          const isUrl = lowerQ.includes('url') || lowerQ.includes('link');
                          const isEligibility = lowerQ.includes('eligibility');
                          const fieldKey = isReward ? 'rewardAmount' : isUrl ? 'destinationUrl' : isEligibility ? 'eligibility' : `field_${idx}`;

                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white border border-yellow-300 text-xs">
                              <span className="text-[#0B1F4D] font-medium">{q}</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type={isReward ? "number" : "text"}
                                  value={inlineInputValues[fieldKey] || ''}
                                  onChange={(e) => setInlineInputValues({ ...inlineInputValues, [fieldKey]: e.target.value })}
                                  placeholder={isReward ? "e.g. 250" : isUrl ? "https://..." : "Enter details..."}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 w-36 bg-white text-[#0B1F4D] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleResolveMissingField(fieldKey, inlineInputValues[fieldKey])}
                                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-blue-800 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      All necessary details were extracted and applied to the form below. Review and publish when ready!
                    </div>
                  )}
                </div>
              )}

              {editingTask && (
                <div className="mb-2">
                  <div className="text-[11px] font-black uppercase text-[#0B1F4D]/70 mb-1.5 tracking-wider">
                    Live Public Task Link & Actions
                  </div>
                  <AdminUserLinkCard
                    taskId={editingTask.id}
                    taskTitle={editingTask.title}
                    partnerName={editingTask.partnerName}
                    rewardAmount={editingTask.rewardAmount}
                    onNavigate={onNavigate}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Fields with Status Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0B1F4D]">Task Title *</label>
                    {!title.trim() && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                        Information Required
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Axis Bank Neo Credit Card Application"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white ${
                      !title.trim() ? 'border-yellow-400 bg-yellow-50/20' : 'border-blue-200'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0B1F4D]">Category *</label>
                    {!categoryId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                        Select Category
                      </span>
                    )}
                  </div>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-[#0B1F4D] bg-white cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0B1F4D]">Partner / Bank Name *</label>
                    {!partnerName.trim() && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                        Information Required
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={partnerName || ''}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. Kotak Mahindra Bank"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white ${
                      !partnerName.trim() ? 'border-yellow-400 bg-yellow-50/20' : 'border-blue-200'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0B1F4D]">Reward Amount (₹) *</label>
                    {(rewardAmount === '' || Number(rewardAmount) <= 0) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                        Information Required
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min={10}
                    value={rewardAmount !== undefined && rewardAmount !== null ? rewardAmount : ''}
                    onChange={(e) => setRewardAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 250"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0B1F4D] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white ${
                      rewardAmount === '' || Number(rewardAmount) <= 0 ? 'border-yellow-400 bg-yellow-50/20' : 'border-blue-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#0B1F4D]">Affiliate Destination URL *</label>
                  {!affiliateUrl.trim() && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                      Information Required
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  required
                  value={affiliateUrl || ''}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://affiliate.network.com/tracking?offer=123"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0B1F4D] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white ${
                    !affiliateUrl.trim() ? 'border-yellow-400 bg-yellow-50/20' : 'border-blue-200'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#0B1F4D]">Description *</label>
                  {!description.trim() && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                      Information Required
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  required
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a clear, simple overview of the task and reward conditions..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white ${
                    !description.trim() ? 'border-yellow-400 bg-yellow-50/20' : 'border-blue-200'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B1F4D] mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={eligibility || ''}
                  onChange={(e) => setEligibility(e.target.value)}
                  placeholder="e.g. Age 18+ Indian Resident with valid documentation."
                  className="w-full px-3.5 py-2 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-[#0B1F4D] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0B1F4D]">Required Steps (1 per line) *</label>
                    {!stepsText.trim() && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                        Information Required
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={stepsText || ''}
                    onChange={(e) => setStepsText(e.target.value)}
                    placeholder="1. Click Start Task to open partner portal&#10;2. Complete required registration or purchase&#10;3. Save confirmation proof"
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-[#0B1F4D] font-mono bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0B1F4D]">Proof Requirements (1 per line) *</label>
                    {!proofText.trim() && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-[#0B1F4D] border border-yellow-300">
                        Information Required
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={proofText || ''}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Screenshot of final confirmation screen&#10;Order ID / Application Reference Number"
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-[#0B1F4D] font-mono bg-white"
                  />
                  {/* Financial Safety Notice */}
                  <div className="mt-1.5 p-2 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-900 flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-blue-600 mt-0.5" />
                    <span>
                      <strong>Safety Rule:</strong> Never request PAN number, Aadhaar number, OTP, PIN, CVV, or passwords as task proof.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0B1F4D] mb-1">Specific Terms</label>
                <input
                  type="text"
                  value={terms || ''}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Verified reward payable upon compliance approval and partner audit confirmation."
                  className="w-full px-3.5 py-2 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-[#0B1F4D] bg-white"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0B1F4D]">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <span>Make Task Active & Visible to Users</span>
                </label>
              </div>

              <div className="pt-4 border-t border-blue-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#0B1F4D]/70 hover:bg-blue-50 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !partnerName.trim() || rewardAmount === '' || Number(rewardAmount) <= 0 || !affiliateUrl.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : editingTask ? (
                    'Update Task'
                  ) : (
                    <>
                      <span>Publish Task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Task Creator & Other Task Modal */}
      <AITaskCreatorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        categories={categories}
        existingTasks={tasks}
        onTasksPublished={async () => {
          if (onRefresh) {
            await onRefresh();
          }
        }}
        onManualCreateFallback={(prefill, aiAssistantData) => {
          handleOpenCreateWithPrefill(prefill, aiAssistantData);
        }}
      />
    </div>
  );
};
