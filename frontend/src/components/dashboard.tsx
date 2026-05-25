'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from '@/components/auth-provider';
import {
  ApiError,
  apiBaseUrl,
  createIssue,
  deleteIssue,
  fetchIssues,
  fetchSummary,
  fetchUsers,
  updateIssue,
} from '@/lib/api';
import {
  Issue,
  IssueInput,
  IssueQuery,
  IssueStatus,
  IssuePriority,
  IssueSortBy,
  SortOrder,
} from '@/types/issue';
import EmptyState from './empty-state';
import ErrorState from './error-state';
import FilterBar from '@/components/filter-bar';
import IssueFormModal from './issue-form-modal';
import IssueTable from './issue-table';
import IssueDetailsModal from './issue-details-modal';
import LoadingState from './loading-state';
import SummaryCards from './summary-cards';
import { Button } from './ui';
import { appToast, describeIssueSaveToast } from '@/lib/toast';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError || error instanceof Error ? error.message : fallback;

const DEFAULT_QUERY: IssueQuery = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState<IssueQuery>(DEFAULT_QUERY);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const issuesQuery = useQuery({
    queryKey: ['issues', query],
    queryFn: () => fetchIssues(query),
  });
  const summaryQuery = useQuery({
    queryKey: ['issue-summary'],
    queryFn: fetchSummary,
  });
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const refreshDashboard = () => {
    void queryClient.invalidateQueries({ queryKey: ['issues'] });
    void queryClient.invalidateQueries({ queryKey: ['issue-summary'] });
  };

  useEffect(() => {
    const socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socket.on('issue.updated', () => {
      refreshDashboard();
      appToast.realtimeIssueUpdated();
    });
    socket.on('issue.assigned', () => {
      refreshDashboard();
      appToast.realtimeIssueAssigned();
    });
    socket.on('comment.added', (payload: { issueId?: number }) => {
      refreshDashboard();
      appToast.realtimeCommentAdded();
      if (payload.issueId) {
        void queryClient.invalidateQueries({ queryKey: ['issue', payload.issueId] });
        void queryClient.invalidateQueries({ queryKey: ['comments', payload.issueId] });
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  // Sync URL -> state when the search params change (back/forward or direct link)
  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;

    const next: IssueQuery = { ...DEFAULT_QUERY };

    const s = sp.get('search');
    if (s) next.search = s;

    const status = sp.get('status');
    if (status) next.status = status as IssueStatus;

    const priority = sp.get('priority');
    if (priority) next.priority = priority as IssuePriority;

    const category = sp.get('category');
    if (category) next.category = category;

    const assigneeId = Number(sp.get('assigneeId'));
    if (!Number.isNaN(assigneeId) && assigneeId > 0) next.assigneeId = assigneeId;

    if (sp.get('my') === 'true') next.my = true;
    if (sp.get('unassigned') === 'true') next.unassigned = true;

    const page = Number(sp.get('page'));
    if (!Number.isNaN(page) && page > 0) next.page = page;

    const limit = Number(sp.get('limit'));
    if (!Number.isNaN(limit) && limit > 0) next.limit = limit;

    const sortBy = sp.get('sortBy');
    if (sortBy) next.sortBy = sortBy as IssueSortBy;

    const sortOrder = sp.get('sortOrder');
    if (sortOrder) next.sortOrder = sortOrder as SortOrder;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery((prev) => ({ ...prev, ...next }));
    const selected = Number(sp.get('issueId'));
    setSelectedIssueId(!Number.isNaN(selected) && selected > 0 ? selected : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  // Update state and push URL
  const updateQuery = (nextQuery: IssueQuery) => {
    setQuery(nextQuery);

    const params = new URLSearchParams();
    if (nextQuery.search) params.set('search', nextQuery.search);
    if (nextQuery.status) params.set('status', nextQuery.status);
    if (nextQuery.priority) params.set('priority', nextQuery.priority);
    if (nextQuery.category) params.set('category', nextQuery.category);
    if (nextQuery.assigneeId) params.set('assigneeId', String(nextQuery.assigneeId));
    if (nextQuery.my) params.set('my', 'true');
    if (nextQuery.unassigned) params.set('unassigned', 'true');
    if (nextQuery.page) params.set('page', String(nextQuery.page));
    if (nextQuery.limit) params.set('limit', String(nextQuery.limit));
    if (nextQuery.sortBy) params.set('sortBy', nextQuery.sortBy);
    if (nextQuery.sortOrder) params.set('sortOrder', nextQuery.sortOrder);

    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url);
  };

  const updateSelectedIssue = (issueId: number | null) => {
    setSelectedIssueId(issueId);
    const params = new URLSearchParams(searchParams?.toString());
    if (issueId) {
      params.set('issueId', String(issueId));
    } else {
      params.delete('issueId');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const issues = issuesQuery.data?.data ?? [];
  const meta = issuesQuery.data?.meta ?? null;
  const isLoading = issuesQuery.isLoading || summaryQuery.isLoading;
  const error =
    issuesQuery.error instanceof Error
      ? issuesQuery.error.message
      : summaryQuery.error instanceof Error
        ? summaryQuery.error.message
        : null;

  const paginationLabel = useMemo(() => {
    if (!meta) {
      return '';
    }

    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);

    return `Showing ${start}-${end} of ${meta.total}`;
  }, [meta]);

  const saveMutation = useMutation({
    mutationFn: async (payload: IssueInput) => {
      if (editingIssue) {
        await updateIssue(editingIssue.id, payload);
      } else {
        await createIssue(payload);
      }

      return payload;
    },
    onSuccess: (_data, payload) => {
      setEditingIssue(null);
      setIsFormOpen(false);
      if (editingIssue) {
        const result = describeIssueSaveToast(editingIssue, payload);
        appToast[result.variant](result.message);
      } else {
        appToast.issueCreated();
      }
      refreshDashboard();
    },
    onError: (error) => {
      appToast.error(getErrorMessage(error, 'Could not save issue.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIssue(id),
    onSuccess: () => {
      appToast.issueDeleted();
      refreshDashboard();
    },
    onError: (error) => {
      const role = user?.role ?? 'unknown role';
      const email = user?.email ?? 'unknown user';
      appToast.error(
        `${getErrorMessage(error, 'Could not delete issue.')} Signed in as ${email} (${role}). Only ADMIN can delete issues.`,
      );
    },
  });

  const handleSave = async (payload: IssueInput) => {
    try {
      await saveMutation.mutateAsync(payload);
    } catch {
      // Rendered through mutation onError.
    }
  };

  const handleDelete = async (issue: Issue) => {
    const confirmed = window.confirm(
      `Delete "${issue.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(issue.id);
    } catch {
      // Rendered through mutation onError.
    }
  };

  const canCreateIssues = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Issues overview
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            Latest activity
          </h3>
          <p className="text-sm text-slate-500">
            Signed in as {user?.name ?? user?.email} ({user?.role})
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await signOut();
              appToast.authLogoutSuccess();
            }}
          >
            Logout
          </Button>
          {canCreateIssues ? (
            <Button
              type="button"
              onClick={() => {
                setEditingIssue(null);
                setIsFormOpen(true);
              }}
            >
              New issue
            </Button>
          ) : null}
        </div>
      </div>
      <SummaryCards summary={summaryQuery.data ?? null} isLoading={isLoading} />
      <FilterBar
        initial={query}
        onApply={updateQuery}
        onReset={() => updateQuery(DEFAULT_QUERY)}
      />

      {error ? <ErrorState message={error} /> : null}

      {isLoading ? (
        <LoadingState label="Loading issues..." />
      ) : issues.length === 0 ? (
        <EmptyState />
      ) : (
        <IssueTable
          issues={issues}
          currentUser={user}
          onEdit={(issue) => {
            setEditingIssue(issue);
            setIsFormOpen(true);
          }}
          onDelete={handleDelete}
          onView={(issue) => updateSelectedIssue(issue.id)}
        />
      )}

      {meta ? (
        <div className="flex flex-col gap-3 text-xs uppercase tracking-[0.2em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{paginationLabel}</span>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() =>
                updateQuery({
                  ...query,
                  page: Math.max(1, (query.page ?? 1) - 1),
                })
              }
              disabled={(meta.page ?? 1) <= 1}
              variant="outline"
            >
              Prev
            </Button>
            <Button
              type="button"
              onClick={() =>
                updateQuery({
                  ...query,
                  page: Math.min(meta.totalPages, (query.page ?? 1) + 1),
                })
              }
              disabled={(meta.page ?? 1) >= meta.totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
      <IssueFormModal
        isOpen={isFormOpen}
        issue={editingIssue}
        onClose={() => {
          setEditingIssue(null);
          setIsFormOpen(false);
        }}
        onSave={handleSave}
        users={usersQuery.data ?? []}
      />
      <IssueDetailsModal
        issueId={selectedIssueId}
        onClose={() => updateSelectedIssue(null)}
      />
    </div>
  );
}
