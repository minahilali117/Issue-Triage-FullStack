import { IssueStatus } from '@/types/issue';

const STATUS_STYLES: Record<IssueStatus, string> = {
  OPEN: 'bg-emerald-100 text-emerald-900',
  IN_PROGRESS: 'bg-amber-100 text-amber-900',
  RESOLVED: 'bg-sky-100 text-sky-900',
  CLOSED: 'bg-slate-200 text-slate-900',
};

export default function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
