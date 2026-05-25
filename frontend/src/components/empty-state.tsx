import { SearchX } from 'lucide-react';
import { Button } from './ui';

interface EmptyStateProps {
  onReset?: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-sm text-slate-500 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <SearchX className="h-5 w-5" />
        </div>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">No issues match this filter.</h3>
          <p className="max-w-xl leading-6">Try widening the search, clearing the filters, or checking a different assignee view.</p>
        </div>
        {onReset ? (
          <Button type="button" variant="outline" onClick={onReset} className="sm:ml-auto">
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
