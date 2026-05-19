'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Issue,
  IssueInput,
  IssuePriority,
  IssueStatus,
} from '@/types/issue';

interface IssueFormModalProps {
  isOpen: boolean;
  issue: Issue | null;
  onClose: () => void;
  onSave: (payload: IssueInput, issueId?: number) => Promise<void>;
}

const DEFAULT_FORM: IssueInput = {
  title: '',
  description: '',
  status: IssueStatus.OPEN,
  priority: IssuePriority.MEDIUM,
  category: '',
  assignee: '',
};

export default function IssueFormModal({
  isOpen,
  issue,
  onClose,
  onSave,
}: IssueFormModalProps) {
  const [form, setForm] = useState<IssueInput>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = useMemo(() => Boolean(issue), [issue]);

  useEffect(() => {
    if (issue) {
      setForm({
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        category: issue.category,
        assignee: issue.assignee ?? '',
      });
      return;
    }

    setForm(DEFAULT_FORM);
  }, [issue, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    key: keyof IssueInput,
    value: IssueInput[keyof IssueInput],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSave(
        {
          ...form,
          assignee: form.assignee?.trim() || null,
        },
        issue?.id,
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {isEditing ? 'Edit issue' : 'New issue'}
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              {isEditing ? 'Update issue details' : 'Create a new issue'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            Close
          </button>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Title
            </label>
            <input
              value={form.title}
              onChange={(event) => handleChange('title', event.target.value)}
              required
              minLength={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              required
              minLength={10}
              rows={4}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Status
              </label>
              <select
                value={form.status}
                onChange={(event) =>
                  handleChange('status', event.target.value as IssueStatus)
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
              >
                {Object.values(IssueStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(event) =>
                  handleChange('priority', event.target.value as IssuePriority)
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
              >
                {Object.values(IssuePriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Category
              </label>
              <input
                value={form.category}
                onChange={(event) => handleChange('category', event.target.value)}
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Assignee
              </label>
              <input
                value={form.assignee ?? ''}
                onChange={(event) => handleChange('assignee', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update issue' : 'Create issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
