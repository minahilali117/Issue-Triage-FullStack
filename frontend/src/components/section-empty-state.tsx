import type { LucideIcon } from 'lucide-react';
import { Button } from './ui';

type SectionEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
};

export default function SectionEmptyState({
  title,
  description,
  icon: Icon,
  action,
  compact = false,
}: SectionEmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400 ${
        compact ? 'px-4 py-5' : 'px-5 py-6'
      }`}
    >
      <div className={`flex ${compact ? 'flex-col gap-3' : 'flex-col items-start gap-4 sm:flex-row sm:items-center'}`}>
        {Icon ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h3>
          {description ? <p className="max-w-xl leading-6">{description}</p> : null}
        </div>
        {action ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className={compact ? '' : 'sm:ml-auto'}
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
