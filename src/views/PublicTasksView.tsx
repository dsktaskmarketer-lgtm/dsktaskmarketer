import React, { useState } from 'react';
import { 
  Search, 
  Info,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Task, TaskCategory } from '../types';
import { TaskCard } from '../components/TaskCard';
import { EmptyStateIllustration, TasksSectionIllustration } from '../components/illustrations';

interface PublicTasksViewProps {
  tasks: Task[];
  categories: TaskCategory[];
  onViewTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const PublicTasksView: React.FC<PublicTasksViewProps> = ({
  tasks,
  categories,
  onViewTask,
  onStartTask,
  loading = false,
  error = null,
  onRetry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full px-4 md:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Hero Section Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 p-4 sm:p-8 md:p-10 text-white shadow-xl border border-blue-700/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2.5 sm:space-y-4 text-left">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-yellow-300 bg-white/10 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Verified Financial Task Marketplace
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Complete Tasks • Earn <span className="text-red-400">Instant Verified Rewards</span>
            </h1>
            <p className="text-[11px] sm:text-sm text-blue-100 leading-relaxed max-w-xl">
              Browse top financial offers across bank accounts, credit cards, demat accounts, and fintech apps. Complete qualifying actions through verified partner links and receive guaranteed payouts directly to your wallet.
            </p>
          </div>
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <TasksSectionIllustration size="md" />
          </div>
        </div>
      </div>

      {/* Compliance Warning Box */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-amber-900 dark:text-amber-300">
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Disclosures:</strong> Financial product eligibility and approvals are decided solely by the respective financial institution. DSK TaskMarketer does not guarantee approval, credit limits, or income. Rewards are conditional on meeting partner terms and passing scheduled verification audits.
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </button>
          )}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, provider (Kotak, Upstox...), or keywords..."
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-900 dark:text-white"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 self-end sm:self-center cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Category Pills (Matches Reference Screen 2) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full font-black whitespace-nowrap text-xs transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          {categories.map(cat => {
            const count = tasks.filter(t => t.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full font-black whitespace-nowrap text-xs transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 animate-pulse">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-3 flex flex-col items-center">
          <EmptyStateIllustration size="md" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            {searchQuery || selectedCategory !== 'all' ? 'No tasks match your filter' : 'No tasks available right now'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search query or selecting a different category from above.'
              : 'Our verified financial partners update campaigns regularly. Please check back shortly.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Tasks</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              category={categories.find(c => c.id === task.categoryId)}
              onViewDetails={onViewTask}
              onStartTask={onStartTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};
