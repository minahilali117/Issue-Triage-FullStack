import { IssueSummary } from '@/types/issue';
import { motion } from 'framer-motion';
import { Skeleton } from './ui';

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
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {item.label}
          </p>
          <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {isLoading ? <Skeleton className="h-8 w-20" /> : item.value}
          </div>
        </motion.div>
      ))}
    </section>
  );
}
