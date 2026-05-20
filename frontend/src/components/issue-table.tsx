import type { AuthUser } from '@/types/auth';
import { Issue } from '@/types/issue';
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-white">
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
          {issues.map((issue) => (
            <tr key={issue.id} className="border-t border-slate-200">
              <td className="px-4 py-4">
                <p className="font-semibold text-slate-900">{issue.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {issue.description}
                </p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={issue.status} />
              </td>
              <td className="px-4 py-4">
                <PriorityBadge priority={issue.priority} />
              </td>
              <td className="px-4 py-4 text-slate-700">{issue.category}</td>
              <td className="px-4 py-4 text-slate-700">
                {issue.assignee?.name ?? issue.assignee?.email ?? 'Unassigned'}
              </td>
              <td className="px-4 py-4 text-slate-700">
                {issue.createdBy?.name ?? issue.createdBy?.email}
              </td>
              <td className="px-4 py-4 text-slate-500">
                {new Date(issue.updatedAt).toLocaleDateString()}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
