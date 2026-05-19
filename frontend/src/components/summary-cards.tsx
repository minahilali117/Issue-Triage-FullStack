import { IssueSummary } from '@/types/issue';

interface SummaryCardsProps {
  summary: IssueSummary | null;
  isLoading: boolean;
}

export default function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const items = [
    { label: 'Total issues', value: summary?.total ?? 0 },
    { label: 'Open', value: summary?.open ?? 0 },
    { label: 'Critical', value: summary?.critical ?? 0 },
    { label: 'Resolved', value: summary?.resolved ?? 0 },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {isLoading ? '...' : item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
