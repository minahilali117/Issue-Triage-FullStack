'use client';

import { useEffect, useMemo, useState } from 'react';
import { createIssue, fetchIssues, fetchSummary, updateIssue } from '@/lib/api';
import {
  Issue,
  IssueInput,
  IssueListMeta,
  IssueQuery,
  IssueSummary,
} from '@/types/issue';
import EmptyState from './empty-state';
import ErrorState from './error-state';
import FilterBar from './filter-bar';
import IssueFormModal from './issue-form-modal';
import IssueTable from './issue-table';
import LoadingState from './loading-state';
import SummaryCards from './summary-cards';

const DEFAULT_QUERY: IssueQuery = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function Dashboard() {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Issues overview
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            Latest activity
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingIssue(null);
            setIsFormOpen(true);
          }}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          New issue
        </button>
      </div>
      <SummaryCards summary={summary} isLoading={isLoading} />
      <FilterBar
        initial={query}
        onApply={(nextQuery) => setQuery(nextQuery)}
        onReset={() => setQuery(DEFAULT_QUERY)}
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
        />
      )}

      {meta ? (
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
          <span>{paginationLabel}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setQuery((prev) => ({
                  ...prev,
                  page: Math.max(1, (prev.page ?? 1) - 1),
                }))
              }
              disabled={(meta.page ?? 1) <= 1}
              className="rounded-full border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                setQuery((prev) => ({
                  ...prev,
                  page: Math.min(meta.totalPages, (prev.page ?? 1) + 1),
                }))
              }
              disabled={(meta.page ?? 1) >= meta.totalPages}
              className="rounded-full border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
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
