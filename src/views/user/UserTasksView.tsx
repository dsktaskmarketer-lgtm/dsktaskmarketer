import React, { useState } from 'react';
import { 
  Search, 
  Info,
  AlertCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Task, TaskCategory, TaskActivity } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { EmptyStateIllustration, TasksSectionIllustration } from '../../components/illustrations';

interface UserTasksViewProps {
  tasks: Task[];
  categories: TaskCategory[];
  activities: TaskActivity[];
  onViewTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onSubmitProof: (task: Task) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const UserTasksView: React.FC<UserTasksViewProps> = ({
  tasks,
  categories,
  activities,
  onViewTask,
  onStartTask,
  onSubmitProof,
  loading = false,
  error = null,
  onRetry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const startedTaskIds = new Set(activities.map(a => a.taskId));

  const filteredTasks = tasks.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
    const matchesSearch = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full px-4 md:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
      {/* Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2.5 text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-300 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-500/30 inline-block">
              Task Catalog & Rewards
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Explore Available Financial Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              Choose a verified financial offer, start the task, complete the required action, and submit proof for instant verified cash payouts!
            </p>
          </div>
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <TasksSectionIllustration size="sm" />
          </div>
        </div>
      </div>

      {/* Compliance Warning */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-yellow-50/80 dark:bg-yellow-950/40 border border-yellow-200/80 dark:border-yellow-800/60 flex items-start gap-2.5 text-[11px] sm:text-xs text-yellow-900 dark:text-yellow-300">
        <Info className="w-4 h-4 text-yellow-700 dark:text-yellow-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Disclosures:</strong> Financial institutions reserve sole right to approve or reject credit cards, accounts, or loans. Rewards are conditional incentives credited upon partner audit verification.
        </p>
      </div>

      {/* Error state with retry */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </button>
          )}
        </div>
      )}

      {/* Search & Categories Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, partner bank, keywords..."
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg sm:rounded-xl font-bold whitespace-nowrap text-xs transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories ({tasks.length})
          </button>
          {categories.map(cat => {
            const count = tasks.filter(t => t.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl font-bold whitespace-nowrap text-xs transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-4/5"></div>
              <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center space-y-3 flex flex-col items-center">
          <EmptyStateIllustration size="sm" />
          <p className="font-bold text-slate-800 dark:text-white text-sm">
            {searchQuery || selectedCategory !== 'all' ? 'No tasks match your filter' : 'No tasks available right now'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your search criteria' : 'Check back shortly for new partner offers'}
          </p>
          {onRetry && (
            <div className="pt-2">
              <button
                onClick={onRetry}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Tasks</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              category={categories.find(c => c.id === task.categoryId)}
              onViewDetails={onViewTask}
              onStartTask={onStartTask}
              onSubmitProof={onSubmitProof}
              isStarted={startedTaskIds.has(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
