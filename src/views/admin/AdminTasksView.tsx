import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { Task, TaskCategory } from '../../types';
import { AdminUserLinkCard } from '../../components/admin/AdminUserLinkCard';

interface AdminTasksViewProps {
  tasks: Task[];
  categories: TaskCategory[];
  onCreateTask: (data: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onNavigate?: (view: string, id?: string) => void;
}

export const AdminTasksView: React.FC<AdminTasksViewProps> = ({
  tasks,
  categories,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onNavigate,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [partnerName, setPartnerName] = useState('');
  const [rewardAmount, setRewardAmount] = useState(500);
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [proofText, setProofText] = useState('');
  const [terms, setTerms] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle('');
    setCategoryId(categories[0]?.id || '');
    setPartnerName('');
    setRewardAmount(500);
    setDescription('');
    setEligibility('Age 21-60 with verifiable regular monthly income.');
    setStepsText('1. Open official link\n2. Complete basic info\n3. Complete video KYC\n4. Save Application reference ID');
    setProofText('Application reference number from final confirmation screen\nScreenshot showing application submitted successfully');
    setTerms('Reward is payable only upon successful approval and confirmation by partner affiliate reconciliation report.');
    setAffiliateUrl('https://example.com/affiliate-link');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setCategoryId(task.categoryId || categories[0]?.id || '');
    setPartnerName(task.partnerName || '');
    setRewardAmount(task.rewardAmount ?? 0);
    setDescription(task.description || '');
    setEligibility(task.eligibility || '');
    setStepsText(Array.isArray(task.steps) ? task.steps.join('\n') : '');
    setProofText(Array.isArray(task.proofRequirements) ? task.proofRequirements.join('\n') : '');
    setTerms(task.terms || '');
    setAffiliateUrl(task.affiliateUrl || '');
    setIsActive(task.isActive ?? task.active ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const taskData: Partial<Task> = {
        title,
        categoryId,
        partnerName,
        rewardAmount: Number(rewardAmount),
        description,
        eligibility,
        steps: stepsText.split('\n').map(s => s.trim()).filter(Boolean),
        proofRequirements: proofText.split('\n').map(p => p.trim()).filter(Boolean),
        terms,
        affiliateUrl,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block mb-1">
            Admin Inventory
          </span>
          <h1 className="text-2xl font-black text-slate-900">Task Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure financial tasks, reward amounts, verification requirements, and affiliate links.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Search & View Mode Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search || ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tasks by name or partner..."
            className="w-full text-xs text-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sharing Cards View
          </button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map(task => {
            const category = categories.find(c => c.id === task.categoryId);
            return (
              <div key={task.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {category?.name || 'Task'}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1">{task.title}</h3>
                    <p className="text-xs text-slate-500">Partner: {task.partnerName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-700">₹{task.rewardAmount}</span>
                    <div className="mt-1">
                      <button
                        onClick={() => onUpdateTask(task.id, { isActive: !task.isActive })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {task.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin User-Facing Task Link & Share Card */}
                <AdminUserLinkCard
                  taskId={task.id}
                  taskTitle={task.title}
                  partnerName={task.partnerName}
                  rewardAmount={task.rewardAmount}
                  onNavigate={onNavigate}
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-medium">Completions: <strong className="text-slate-800 font-bold">{task.completionsCount}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-bold text-[11px] flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors font-bold text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task List Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-6">Task Title & Partner</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Reward</th>
                  <th className="py-3.5 px-4 min-w-[290px]">User Link & Share</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const category = categories.find(c => c.id === task.categoryId);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{task.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Partner: {task.partnerName}</p>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">
                        {category?.name || 'General'}
                      </td>
                      <td className="py-4 px-4 font-black text-emerald-800 text-sm">
                        ₹{task.rewardAmount}*
                      </td>
                      <td className="py-3 px-4">
                        <AdminUserLinkCard
                          compact={true}
                          taskId={task.id}
                          taskTitle={task.title}
                          partnerName={task.partnerName}
                          rewardAmount={task.rewardAmount}
                          onNavigate={onNavigate}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => onUpdateTask(task.id, { isActive: !task.isActive })}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            task.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {task.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Task"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
                                onDeleteTask(task.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTask ? 'Edit Task Configuration' : 'Create New Financial Task'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              {editingTask && (
                <div className="mb-2">
                  <div className="text-[11px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">
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
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Axis Bank Neo Credit Card Application"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Category</label>
                  <select
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Partner / Bank Name</label>
                  <input
                    type="text"
                    required
                    value={partnerName || ''}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. Axis Bank (Affiliate Network)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Reward Amount (₹)*</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={rewardAmount !== undefined && rewardAmount !== null ? rewardAmount : ''}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Affiliate Destination URL</label>
                <input
                  type="url"
                  required
                  value={affiliateUrl || ''}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://affiliate.network.com/tracking?offer=123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  required
                  value={eligibility || ''}
                  onChange={(e) => setEligibility(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Required Steps (1 per line)</label>
                  <textarea
                    rows={4}
                    value={stepsText || ''}
                    onChange={(e) => setStepsText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Proof Requirements (1 per line)</label>
                  <textarea
                    rows={4}
                    value={proofText || ''}
                    onChange={(e) => setProofText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Specific Terms</label>
                <input
                  type="text"
                  value={terms || ''}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Make Task Active</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Publish Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
