import React, { useState } from 'react';
import { 
  Search, 
  Info
} from 'lucide-react';
import { Task, TaskCategory, TaskActivity } from '../../types';
import { TaskCard } from '../../components/TaskCard';

interface UserTasksViewProps {
  tasks: Task[];
  categories: TaskCategory[];
  activities: TaskActivity[];
  onViewTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onSubmitProof: (task: Task) => void;
}

export const UserTasksView: React.FC<UserTasksViewProps> = ({
  tasks,
  categories,
  activities,
  onViewTask,
  onStartTask,
  onSubmitProof,
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md inline-block mb-1">
          Catalog
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Available Tasks</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Choose a verified financial offer, start the task, complete the required action, and submit proof.
        </p>
      </div>

      {/* Compliance Warning */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-[11px] sm:text-xs text-amber-900 dark:text-amber-300">
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Disclosures:</strong> Financial institutions reserve sole right to approve or reject credit cards, accounts, or loans. Rewards are conditional incentives credited upon partner audit verification.
        </p>
      </div>

      {/* Search & Categories Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, partner bank, keywords..."
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* Categories Bar */}
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

      {/* Two-Column Task Grid Across All Devices */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center space-y-2">
          <p className="font-bold text-slate-800 dark:text-white text-sm">No tasks found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search criteria</p>
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
              onSubmitProof={onSubmitProof}
              isStarted={startedTaskIds.has(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
