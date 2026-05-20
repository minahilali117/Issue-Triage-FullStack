'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Issue,
  IssueInput,
  IssuePriority,
  IssueStatus,
  IssueUser,
} from '@/types/issue';
import { Button, Input } from './ui';

interface IssueFormModalProps {
  isOpen: boolean;
  issue: Issue | null;
  onClose: () => void;
  onSave: (payload: IssueInput, issueId?: number) => Promise<void>;
  users: IssueUser[];
}

const issueSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  status: z.enum(IssueStatus),
  priority: z.enum(IssuePriority),
  category: z.string().min(1).max(100),
  assigneeId: z.number().int().positive().nullable().optional(),
});

type IssueFormValues = z.infer<typeof issueSchema>;

const DEFAULT_FORM: IssueFormValues = {
  title: '',
  description: '',
  status: IssueStatus.OPEN,
  priority: IssuePriority.MEDIUM,
  category: '',
  assigneeId: null,
};

export default function IssueFormModal({
  isOpen,
  issue,
  onClose,
  onSave,
  users,
}: IssueFormModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = useMemo(() => Boolean(issue), [issue]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: DEFAULT_FORM,
  });
  const status = useWatch({ control, name: 'status' });
  const priority = useWatch({ control, name: 'priority' });
  const assigneeId = useWatch({ control, name: 'assigneeId' });

  useEffect(() => {
    if (issue) {
      reset({
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        category: issue.category,
        assigneeId: issue.assigneeId,
      });
      return;
    }

    reset(DEFAULT_FORM);
  }, [issue, isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  const submitForm = async (form: IssueFormValues) => {
    setIsSaving(true);

    try {
      await onSave(
        {
          ...form,
          assigneeId: form.assigneeId ?? null,
        },
        issue?.id,
      );
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

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(submitForm)}>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Title
            </label>
            <Input
              {...register('title')}
              maxLength={200}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
            {errors.title ? <p className="text-xs text-rose-600">{errors.title.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Description
            </label>
            <textarea
              {...register('description')}
              maxLength={5000}
              rows={4}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
            {errors.description ? <p className="text-xs text-rose-600">{errors.description.message}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Status
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setValue('status', event.target.value as IssueStatus)
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
                value={priority}
                onChange={(event) =>
                  setValue('priority', event.target.value as IssuePriority)
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
              <Input
                {...register('category')}
                maxLength={100}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
              />
              {errors.category ? <p className="text-xs text-rose-600">{errors.category.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Assignee
              </label>
              <select
                value={assigneeId ?? ''}
                onChange={(event) =>
                  setValue(
                    'assigneeId',
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update issue' : 'Create issue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
