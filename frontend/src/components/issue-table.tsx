import { Issue } from '@/types/issue';
import PriorityBadge from './priority-badge';
import StatusBadge from './status-badge';

interface IssueTableProps {
  issues: Issue[];
}

export default function IssueTable({ issues }: IssueTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900 text-xs uppercase tracking-[0.2em] text-white">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Updated</th>
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
                {issue.assignee ?? 'Unassigned'}
              </td>
              <td className="px-4 py-4 text-slate-500">
                {new Date(issue.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
