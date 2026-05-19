'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createIssue,
  deleteIssue,
  fetchIssues,
  fetchSummary,
  updateIssue,
} from '@/lib/api';
import {
  Issue,
  IssueInput,
  IssueListMeta,
  IssueQuery,
  IssueSummary,
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
import LoadingState from './loading-state';
import SummaryCards from './summary-cards';
import { Button } from './ui';

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

  const [query, setQuery] = useState<IssueQuery>(DEFAULT_QUERY);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [meta, setMeta] = useState<IssueListMeta | null>(null);
  const [summary, setSummary] = useState<IssueSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [issueData, summaryData] = await Promise.all([
          fetchIssues(query),
          fetchSummary(),
        ]);

        if (!isMounted) {
          return;
        }

        setIssues(issueData.data);
        setMeta(issueData.meta);
        setSummary(summaryData);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [query, refreshToken]);

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

    const assignee = sp.get('assignee');
    if (assignee) next.assignee = assignee;

    const page = Number(sp.get('page'));
    if (!Number.isNaN(page) && page > 0) next.page = page;

    const limit = Number(sp.get('limit'));
    if (!Number.isNaN(limit) && limit > 0) next.limit = limit;

    const sortBy = sp.get('sortBy');
    if (sortBy) next.sortBy = sortBy as IssueSortBy;

    const sortOrder = sp.get('sortOrder');
    if (sortOrder) next.sortOrder = sortOrder as SortOrder;

    setQuery((prev) => ({ ...prev, ...next }));
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
    if (nextQuery.assignee) params.set('assignee', nextQuery.assignee);
    if (nextQuery.page) params.set('page', String(nextQuery.page));
    if (nextQuery.limit) params.set('limit', String(nextQuery.limit));
    if (nextQuery.sortBy) params.set('sortBy', nextQuery.sortBy);
    if (nextQuery.sortOrder) params.set('sortOrder', nextQuery.sortOrder);

    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url);
  };

  const paginationLabel = useMemo(() => {
    if (!meta) {
      return '';
    }

    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);

    return `Showing ${start}-${end} of ${meta.total}`;
  }, [meta]);

  const handleSave = async (payload: IssueInput) => {
    if (editingIssue) {
      await updateIssue(editingIssue.id, payload);
    } else {
      await createIssue(payload);
    }

    setEditingIssue(null);
    setIsFormOpen(false);
    setRefreshToken((prev) => prev + 1);
  };

  const handleDelete = async (issue: Issue) => {
    const confirmed = window.confirm(
      `Delete "${issue.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    await deleteIssue(issue.id);
    setRefreshToken((prev) => prev + 1);
  };

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
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingIssue(null);
            setIsFormOpen(true);
          }}
        >
          New issue
        </Button>
      </div>
      <SummaryCards summary={summary} isLoading={isLoading} />
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
          onEdit={(issue) => {
            setEditingIssue(issue);
            setIsFormOpen(true);
          }}
          onDelete={handleDelete}
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
      />
    </div>
  );
}
