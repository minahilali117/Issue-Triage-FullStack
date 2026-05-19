export default function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
      {label}
    </div>
  );
}
