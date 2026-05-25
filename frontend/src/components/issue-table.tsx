import type { AuthUser } from '@/types/auth';
import { Issue } from '@/types/issue';
import { motion, AnimatePresence } from 'framer-motion';
import PriorityBadge from './priority-badge';
import StatusBadge from './status-badge';

interface IssueTableProps {
  issues: Issue[];
  currentUser: AuthUser | null;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
  onView: (issue: Issue) => void;
}

export default function IssueTable({
  issues,
  currentUser,
  onEdit,
  onDelete,
  onView,
}: IssueTableProps) {
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER';
  const canDelete = currentUser?.role === 'ADMIN';

  const getInitials = (value?: string | null) => {
    if (!value) return 'U';
    const parts = value.trim().split(/\s+/);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || value.slice(0, 2).toUpperCase();
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="overflow-x-auto">
      <table className="min-w-240 w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-950 text-xs uppercase tracking-[0.2em] text-white dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Creator</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
          {issues.map((issue) => (
            <motion.tr
              key={issue.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              whileHover={{ backgroundColor: 'rgba(248,250,252,0.92)' }}
              className="border-t border-slate-200/80 transition-colors dark:border-white/10"
            >
              <td className="px-4 py-4">
                <div className="flex flex-col gap-2">
                  <p className="font-semibold text-slate-950 dark:text-white">{issue.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                  {issue.description}
                  </p>
                </div>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={issue.status} />
              </td>
              <td className="px-4 py-4">
                <PriorityBadge priority={issue.priority} />
              </td>
              <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{issue.category}</td>
              <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
                    {getInitials(issue.assignee?.name ?? issue.assignee?.email)}
                  </span>
                  <span>{issue.assignee?.name ?? issue.assignee?.email ?? 'Unassigned'}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                {new Date(issue.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                {issue.createdBy?.name ?? issue.createdBy?.email}
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onView(issue)}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400"
                  >
                    Details
                  </button>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(issue)}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400"
                    >
                      Edit
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(issue)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:border-rose-300"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </motion.tr>
          ))}
          </AnimatePresence>
        </tbody>
      </table>
      </div>
    </div>
  );
}
