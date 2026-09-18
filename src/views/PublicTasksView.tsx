import React, { useState } from 'react';
import { 
  Search, 
  Info
} from 'lucide-react';
import { Task, TaskCategory } from '../types';
import { TaskCard } from '../components/TaskCard';

interface PublicTasksViewProps {
  tasks: Task[];
  categories: TaskCategory[];
  onViewTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
}

export const PublicTasksView: React.FC<PublicTasksViewProps> = ({
  tasks,
  categories,
  onViewTask,
  onStartTask,
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="max-w-3xl space-y-2 sm:space-y-3">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
          Financial Task Marketplace
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Available Tasks & Rewards
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Browse verified financial offers across credit cards, zero-balance bank accounts, personal loans, demat accounts, and fintech apps. Complete qualifying actions through approved affiliate links and submit proof for verified rewards.
        </p>
      </div>

      {/* Compliance Warning Box */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-amber-900 dark:text-amber-300">
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Disclosures:</strong> Financial product eligibility and approvals are decided solely by the respective financial institution. DSK TaskMarketer does not guarantee approval, credit limits, or income. Rewards are conditional on meeting partner terms and passing scheduled verification audits.
        </p>
      </div>

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
              placeholder="Search by task title, bank/provider, or keywords..."
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 self-end sm:self-center"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg sm:rounded-xl font-bold whitespace-nowrap text-xs transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
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
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl font-bold whitespace-nowrap text-xs transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Grid: Strictly Two-Column Across All Screen Sizes (Mobile, Tablet, PC) */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No tasks match your filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category from above.
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6">
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
