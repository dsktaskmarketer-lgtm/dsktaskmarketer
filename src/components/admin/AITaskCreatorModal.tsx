import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowRight, 
  ShieldAlert, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { AIDraftTask, TaskCategory, Task } from '../../types';
import { generateAITasks, bulkPublishAITasks } from '../../services/api';
import { isInstructionOrMetaText } from '../../utils/aiValidation';

interface AITaskCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TaskCategory[];
  existingTasks: Task[];
  onTasksPublished: () => Promise<void>;
  onManualCreateFallback?: (prefill: Partial<Task>, aiAssistant?: any) => void;
}

export const AITaskCreatorModal: React.FC<AITaskCreatorModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingTasks,
  onTasksPublished,
  onManualCreateFallback,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<AIDraftTask[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingDraft, setEditingDraft] = useState<AIDraftTask | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [publishActionType, setPublishActionType] = useState<'selected' | 'all'>('all');

  // Purge any legacy cached drafts from previous implementations
  React.useEffect(() => {
    try {
      localStorage.removeItem('dsk_ai_drafts');
      localStorage.removeItem('dsk_draft_tasks');
      localStorage.removeItem('dsk_tasks_drafts');
      localStorage.removeItem('ai_drafts');
      localStorage.removeItem('ai_task_drafts');
    } catch {}
  }, []);

  if (!isOpen) return null;

  const examplePrompts = [
    {
      label: "Kotak 811 Savings Account",
      text: "Open Kotak 811 account, complete the required process and submit safe proof. Reward ₹250."
    },
    {
      label: "Navi App KYC & Investment (Tanglish)",
      text: "Navi app download panni KYC complete panni mutual fund la ₹10 invest panna ₹120 reward. Link: https://navi.com/invite/dsk"
    },
    {
      label: "Local Store Purchase (Tamil / Tanglish)",
      text: "ABC supermarket ku poi ₹200 mela purchase panni original bill upload panna ₹50 reward. Valid till end of this month."
    }
  ];

  const handleApplyToForm = (draft: AIDraftTask) => {
    if (onManualCreateFallback) {
      onManualCreateFallback(
        {
          title: draft.title,
          categoryId: draft.categoryId,
          partnerName: draft.company && draft.company !== 'Partner Offer' ? draft.company : '',
          rewardAmount: draft.rewardAmount > 0 ? draft.rewardAmount : undefined,
          description: draft.description,
          eligibility: draft.eligibility || '',
          steps: draft.instructions,
          proofRequirements: draft.proofRequirements,
          terms: draft.terms,
          affiliateUrl: draft.destinationUrl && draft.destinationUrl !== 'Information Required' ? draft.destinationUrl : '',
        },
        {
          missingFields: draft.missingFields || [],
          missingQuestions: draft.missingQuestions || [],
          partnerIdentified: draft.company,
          categoryIdentified: draft.categorySlug,
          originalPrompt: draft.rawInputSnippet || promptText
        }
      );
      onClose();
    }
  };

  const handleGenerate = async (textToUse?: string, autoFillForm = false) => {
    const text = (textToUse !== undefined ? textToUse : promptText).trim();
    if (!text || isInstructionOrMetaText(text)) {
      setGenerationError("Please describe the actual task you want to create.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationNotice(null);

    try {
      const res = await generateAITasks(text);
      if (res.success && res.tasks && res.tasks.length > 0) {
        // EXACTLY ONE TASK DRAFT PER ACTION
        const singleDraft = res.tasks[0];
        // Draft count increases by exactly 1 per action
        setDrafts(prev => [singleDraft, ...prev.filter(d => d.id !== singleDraft.id)]);
        setSelectedIds(prev => [singleDraft.id, ...prev.filter(id => id !== singleDraft.id)]);
        if (res.error) {
          setGenerationNotice(res.error);
        }

        if (autoFillForm) {
          handleApplyToForm(singleDraft);
          return;
        }
      } else {
        setGenerationError(res.error || "Please describe the actual task you want to create.");
      }
    } catch (err: any) {
      setGenerationError(err.message || "Please describe the actual task you want to create.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualFallback = () => {
    if (onManualCreateFallback) {
      onManualCreateFallback({
        title: promptText.split('\n')[0].substring(0, 60),
        description: promptText,
      });
      onClose();
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === drafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(drafts.map(d => d.id));
    }
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
    if (editingDraft?.id === id) {
      setEditingDraft(null);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;

    setDrafts(prev => prev.map(d => d.id === editingDraft.id ? editingDraft : d));
    setEditingDraft(null);
  };

  const handleAddNewManualDraft = () => {
    const tempId = `draft_manual_${Date.now()}`;
    const newDraft: AIDraftTask = {
      id: tempId,
      tempId,
      title: "New Custom Partner Task",
      company: "Direct Partner",
      productService: "General Offer",
      description: "Complete specified steps to receive cash reward.",
      userAction: "Registration / In-store purchase / KYC",
      instructions: ["Click start task", "Follow instructions", "Upload valid proof screenshot"],
      rewardAmount: 50,
      proofRequirements: ["Confirmation bill / screenshot"],
      destinationUrl: "https://dsktaskmarketer.com",
      validDates: "Open",
      participantLimit: null,
      terms: "Subject to verification.",
      categorySlug: "other-affiliates",
      categoryId: "cat_other",
      missingInfo: [],
      isReviewRequired: false,
      status: "ready"
    };

    setDrafts(prev => [newDraft, ...prev]);
    setSelectedIds(prev => [tempId, ...prev]);
    setEditingDraft(newDraft);
  };

  const handleInitiatePublish = (type: 'selected' | 'all') => {
    setPublishActionType(type);
    setShowConfirmModal(true);
  };

  const handleExecutePublish = async () => {
    const tasksToPublish = publishActionType === 'selected' 
      ? drafts.filter(d => selectedIds.includes(d.id))
      : drafts;

    if (tasksToPublish.length === 0) return;

    setIsPublishing(true);
    try {
      const res = await bulkPublishAITasks(tasksToPublish);
      if (res.success) {
        await onTasksPublished();
        setShowConfirmModal(false);
        onClose();
      } else {
        alert("Failed to publish tasks. Please check all required fields.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to publish tasks.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07152F]/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-blue-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-[#0B1F4D]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0B1F4D] flex items-center gap-2">
                Other Task / AI Task Creator
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Multilingual AI
                </span>
              </h2>
              <p className="text-xs text-[#0B1F4D]/70">
                Describe the task in plain words (English, Tamil, Tanglish). Generates exactly ONE structured draft per action.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#0B1F4D]/60 hover:text-[#0B1F4D] rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Step 1: Prompt Input Screen */}
          <div className="space-y-3 bg-blue-50/40 p-4 sm:p-5 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0B1F4D] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Natural Language Description
              </label>
              <div className="text-[11px] text-[#0B1F4D]/60 font-medium">
                Supports: English, தமிழ், Tanglish, Mixed
              </div>
            </div>

            <textarea
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={`Describe the task in plain words:\nExample: "Open Kotak 811 account, complete the required process and submit safe proof. Reward ₹250."\nExample: "Navi app download panni KYC complete panni mutual fund la ₹10 invest panna ₹120 reward. Link: https://navi.com/invite/dsk"`}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-xs text-[#0B1F4D] placeholder-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#0B1F4D]/70">Quick Examples:</span>
              {examplePrompts.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPromptText(ex.text);
                    handleGenerate(ex.text);
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-[#0B1F4D]/70">
                AI extracts reward, proofs, instructions & flags missing info. Never auto-publishes.
              </div>
              <div className="flex gap-2">
                {promptText.trim() && (
                  <button
                    type="button"
                    onClick={handleManualFallback}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-[#0B1F4D] bg-white border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Manual Fallback
                  </button>
                )}
                <button
                  type="button"
                  disabled={isGenerating || !promptText.trim()}
                  onClick={() => handleGenerate(undefined, false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2 transition-colors border border-blue-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Preview Extraction
                </button>
                <button
                  type="button"
                  disabled={isGenerating || !promptText.trim()}
                  onClick={() => handleGenerate(undefined, true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-colors cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Auto-Filling Form...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      Auto-Fill Task Form →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Failure & Error State Handling */}
          {generationError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-800">
                    AI Task Structuring Failed (Input Preserved)
                  </h4>
                  <p className="text-xs text-red-600 mt-0.5">
                    {generationError}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t border-red-200">
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry AI
                </button>
                <button
                  type="button"
                  onClick={handleManualFallback}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-red-300 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Manual Create from This Text
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationError(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B1F4D]/70 hover:text-[#0B1F4D] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Temporary High Demand Notice */}
          {generationNotice && (
            <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-300 flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#0B1F4D]">
                  Temporary AI Demand Notice
                </h4>
                <p className="text-xs text-[#0B1F4D]/80 mt-0.5 leading-relaxed">
                  {generationNotice}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry AI
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationNotice(null)}
                  className="p-1 text-[#0B1F4D]/60 hover:text-[#0B1F4D] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Interactive Drafts Preview & Management */}
          {drafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#0B1F4D]">
                      Generated Task Drafts ({drafts.length})
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Draft Preview Only (Unpublished)
                    </span>
                  </div>
                  <p className="text-xs text-[#0B1F4D]/70">
                    Review each draft. Edit missing info or remove items. Publish only when confirmed.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDrafts([]);
                      setSelectedIds([]);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Clear All Drafts
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewManualDraft}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Manual Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    {selectedIds.length === drafts.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Drafts Cards List */}
              <div className="grid grid-cols-1 gap-3">
                {drafts.map((draft) => {
                  const isSelected = selectedIds.includes(draft.id);
                  const isUnderEdit = editingDraft?.id === draft.id;

                  return (
                    <div
                      key={draft.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs' 
                          : 'border-blue-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(draft.id)}
                            className="mt-1 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-blue-300 cursor-pointer"
                          />

                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-[#0B1F4D]">
                                {draft.title}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {draft.company}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                                ₹{draft.rewardAmount}
                              </span>

                              {/* Warning Chips */}
                              {draft.isDuplicate && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-[#0B1F4D] flex items-center gap-1 border border-yellow-300">
                                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                                  Possible Duplicate
                                </span>
                              )}

                              {draft.isReviewRequired && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1 border border-red-300">
                                  <ShieldAlert className="w-3 h-3 text-red-600" />
                                  Information Required
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#0B1F4D]/80 line-clamp-2">
                              {draft.description}
                            </p>

                            {/* Missing info flags */}
                            {draft.missingInfo && draft.missingInfo.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {draft.missingInfo.map((m, mi) => (
                                  <span key={mi} className="text-[10px] font-bold text-[#0B1F4D] bg-yellow-100 px-2 py-0.5 rounded-md border border-yellow-300">
                                    ⚠️ {m}
                                  </span>
                                ))}
                              </div>
                            )}

                            {draft.duplicateWarning && (
                              <p className="text-[11px] text-yellow-700 font-medium">
                                {draft.duplicateWarning}
                              </p>
                            )}

                            {/* Instructions Preview */}
                            <div className="pt-1 text-[11px] text-[#0B1F4D]/60 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                              <span>Action: {draft.userAction}</span>
                              <span>Proof: {draft.proofRequirements?.join(', ')}</span>
                              <span>URL: {draft.destinationUrl}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingDraft(draft)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Draft Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove from Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Apply to Create Task Form Action Banner */}
                      <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between gap-3">
                        <div className="text-[11px]">
                          {draft.missingQuestions && draft.missingQuestions.length > 0 ? (
                            <span className="text-red-600 font-semibold">
                              ⚠️ {draft.missingQuestions.length} required field(s) to verify in form
                            </span>
                          ) : (
                            <span className="text-blue-700 font-semibold">
                              ✓ All critical fields extracted
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyToForm(draft)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0B1F4D] hover:bg-blue-900 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Fill Task Form & Review</span>
                          <ArrowRight className="w-3.5 h-3.5 text-yellow-300" />
                        </button>
                      </div>

                      {/* Inline Editing Form */}
                      {isUnderEdit && editingDraft && (
                        <form onSubmit={handleSaveEdit} className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                          <h5 className="text-xs font-bold text-[#0B1F4D] flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            Edit Draft: {editingDraft.title}
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-[#0B1F4D]/70 uppercase">Title</label>
                              <input
                                type="text"
                                value={editingDraft.title}
                                onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-[#0B1F4D]"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#0B1F4D]/70 uppercase">Company / Shop</label>
                              <input
                                type="text"
                                value={editingDraft.company}
                                onChange={(e) => setEditingDraft({ ...editingDraft, company: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-[#0B1F4D]"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#0B1F4D]/70 uppercase">Reward Amount (₹)</label>
                              <input
                                type="number"
                                value={editingDraft.rewardAmount}
                                onChange={(e) => setEditingDraft({ ...editingDraft, rewardAmount: Number(e.target.value) || 0 })}
                                className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-[#0B1F4D]"
                                min={1}
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#0B1F4D]/70 uppercase">Destination / Affiliate URL</label>
                              <input
                                type="text"
                                value={editingDraft.destinationUrl}
                                onChange={(e) => setEditingDraft({ ...editingDraft, destinationUrl: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-[#0B1F4D]"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#0B1F4D]/70 uppercase">Description</label>
                            <textarea
                              rows={2}
                              value={editingDraft.description}
                              onChange={(e) => setEditingDraft({ ...editingDraft, description: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-[#0B1F4D]"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingDraft(null)}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-[#0B1F4D]/70 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-blue-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#0B1F4D]/70 hover:text-[#0B1F4D] cursor-pointer"
          >
            Cancel
          </button>

          {drafts.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedIds.length === 0 || isPublishing}
                onClick={() => handleInitiatePublish('selected')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Publish Selected ({selectedIds.length})
              </button>

              <button
                type="button"
                disabled={isPublishing}
                onClick={() => handleInitiatePublish('all')}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Publish All ({drafts.length})
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal before Publishing */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#07152F]/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#0B1F4D]">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-base font-black text-[#0B1F4D]">
                Confirm Publishing {publishActionType === 'selected' ? selectedIds.length : drafts.length} Task(s)
              </h4>
              <p className="text-xs text-[#0B1F4D]/70">
                These tasks will be saved to your database and become immediately <strong>ACTIVE</strong> and visible to all users on DSK TaskMarketer.
              </p>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl text-[11px] text-[#0B1F4D] space-y-1 border border-blue-200">
              <div className="font-bold text-[#0B1F4D]">Tasks to be published:</div>
              <ul className="list-disc list-inside space-y-0.5 max-h-28 overflow-y-auto">
                {(publishActionType === 'selected' 
                  ? drafts.filter(d => selectedIds.includes(d.id))
                  : drafts
                ).map(t => (
                  <li key={t.id} className="truncate">
                    {t.title} — ₹{t.rewardAmount} ({t.company})
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isPublishing}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0B1F4D]/70 bg-blue-50 hover:bg-blue-100 cursor-pointer"
              >
                Go Back & Review
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handleExecutePublish}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
