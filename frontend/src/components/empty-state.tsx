import { SearchX } from 'lucide-react';
import SectionEmptyState from './section-empty-state';

interface EmptyStateProps {
  onReset?: () => void;
  title?: string;
  description?: string;
}

export default function EmptyState({
  onReset,
  title = 'No issues found',
  description = 'Try widening the search, clearing the filters, or checking a different assignee view.',
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
      <SectionEmptyState
        title={title}
        description={description}
        icon={SearchX}
        action={
          onReset
            ? {
                label: 'Clear filters',
                onClick: onReset,
              }
            : undefined
        }
      />
    </div>
  );
}
