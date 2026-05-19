import {
  IssuePriority,
  IssueQuery,
  IssueSortBy,
  IssueStatus,
  SortOrder,
} from '@/types/issue';

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
  return (
    <form
      className="grid grid-cols-1 gap-3 rounded-2xl border border-black/10 bg-white/80 p-4 backdrop-blur sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        onApply({
          search: String(formData.get('search') ?? '').trim() || undefined,
          status: (formData.get('status') as IssueStatus) || undefined,
          priority: (formData.get('priority') as IssuePriority) || undefined,
          category: String(formData.get('category') ?? '').trim() || undefined,
          assignee: String(formData.get('assignee') ?? '').trim() || undefined,
          page: 1,
          limit: initial.limit ?? 10,
          sortBy:
            (formData.get('sortBy') as IssueSortBy) ??
            initial.sortBy ??
            'createdAt',
          sortOrder:
            (formData.get('sortOrder') as SortOrder) ??
            initial.sortOrder ??
            'desc',
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Search
        </label>
        <input
          name="search"
          defaultValue={initial.search ?? ''}
          placeholder="Auth errors, flaky builds..."
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Status
        </label>
        <select
          name="status"
          defaultValue={initial.status ?? ''}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Priority
        </label>
        <select
          name="priority"
          defaultValue={initial.priority ?? ''}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Category
        </label>
        <input
          name="category"
          defaultValue={initial.category ?? ''}
          placeholder="Backend"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Assignee
        </label>
        <input
          name="assignee"
          defaultValue={initial.assignee ?? ''}
          placeholder="Minahil"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Sort by
        </label>
        <select
          name="sortBy"
          defaultValue={initial.sortBy ?? 'createdAt'}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Order
        </label>
        <select
          name="sortOrder"
          defaultValue={initial.sortOrder ?? 'desc'}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        >
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-4 2xl:col-span-1">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
