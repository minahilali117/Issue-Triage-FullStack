import { IssuePriority } from '@/types/issue';

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-indigo-100 text-indigo-900',
  HIGH: 'bg-orange-100 text-orange-900',
  CRITICAL: 'bg-rose-100 text-rose-900',
};

export default function PriorityBadge({ priority }: { priority: IssuePriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}
