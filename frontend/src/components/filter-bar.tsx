"use client";

import React, { useEffect, useState } from 'react';
import {
  IssuePriority,
  IssueQuery,
  IssueSortBy,
  IssueStatus,
  SortOrder,
} from '@/types/issue';
import { Button, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui';

interface FilterBarProps {
  initial: IssueQuery;
  onApply: (query: IssueQuery) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = Object.values(IssueStatus);
const PRIORITY_OPTIONS = Object.values(IssuePriority);
const SORT_OPTIONS: Array<{ label: string; value: IssueSortBy }> = [
  { label: 'Created date', value: 'createdAt' },
  { label: 'Updated date', value: 'updatedAt' },
  { label: 'Priority', value: 'priority' },
];
const ORDER_OPTIONS: Array<{ label: string; value: SortOrder }> = [
  { label: 'Descending', value: 'desc' },
  { label: 'Ascending', value: 'asc' },
];

export default function FilterBar({ initial, onApply, onReset }: FilterBarProps) {
  const [search, setSearch] = useState<string | undefined>(initial.search);
  const [status, setStatus] = useState<IssueStatus | undefined>(initial.status);
  const [priority, setPriority] = useState<IssuePriority | undefined>(initial.priority);
  const [category, setCategory] = useState<string | undefined>(initial.category);
  const [my, setMy] = useState<boolean>(Boolean(initial.my));
  const [unassigned, setUnassigned] = useState<boolean>(Boolean(initial.unassigned));
  const [sortBy, setSortBy] = useState<IssueSortBy>(initial.sortBy ?? 'createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>(initial.sortOrder ?? 'desc');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(initial.search);
    setStatus(initial.status);
    setPriority(initial.priority);
    setCategory(initial.category);
    setMy(Boolean(initial.my));
    setUnassigned(Boolean(initial.unassigned));
    setSortBy(initial.sortBy ?? 'createdAt');
    setSortOrder(initial.sortOrder ?? 'desc');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.page, initial?.limit]);

  const handleApply = () => {
    onApply({
      search: search?.trim() || undefined,
      status,
      priority,
      category: category?.trim() || undefined,
      my: my || undefined,
      unassigned: unassigned || undefined,
      page: 1,
      limit: initial.limit ?? 10,
      sortBy,
      sortOrder,
    });
  };

  const handleReset = () => {
    setSearch(undefined);
    setStatus(undefined);
    setPriority(undefined);
    setCategory(undefined);
    setMy(false);
    setUnassigned(false);
    setSortBy(initial.sortBy ?? 'createdAt');
    setSortOrder(initial.sortOrder ?? 'desc');
    onReset();
  };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-black/10 bg-white/80 p-4 backdrop-blur sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Search</label>
        <Input value={search ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} placeholder="Auth errors, flaky builds..." maxLength={200} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</label>
        <Select value={status ?? '__all'} onValueChange={(v) => setStatus(v === '__all' ? undefined : (v as IssueStatus))}>
          <SelectTrigger size="sm">
            <SelectValue>{status ?? 'All'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority</label>
        <Select value={priority ?? '__all'} onValueChange={(v) => setPriority(v === '__all' ? undefined : (v as IssuePriority))}>
          <SelectTrigger size="sm">
            <SelectValue>{priority ?? 'All'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</label>
        <Input value={category ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)} placeholder="Backend" maxLength={100} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Ownership</label>
        <div className="flex h-10 items-center gap-3 rounded-lg border border-black/10 px-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={my} onChange={(event) => setMy(event.target.checked)} />
            My issues
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={unassigned} onChange={(event) => setUnassigned(event.target.checked)} />
            Unassigned
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort by</label>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as IssueSortBy)}>
          <SelectTrigger size="sm">
            <SelectValue>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Created date'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Order</label>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
          <SelectTrigger size="sm">
            <SelectValue>{ORDER_OPTIONS.find((o) => o.value === sortOrder)?.label ?? 'Descending'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ORDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-4 2xl:col-span-1">
        <Button onClick={handleApply}>Apply</Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
