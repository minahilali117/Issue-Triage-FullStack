import Dashboard from "@/components/dashboard";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Internal tool
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Issue Triage Dashboard
            </h1>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="grid gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Today at a glance
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Triage, assign, and close issues with clarity.
          </h2>
          <p className="max-w-2xl text-base text-slate-600">
            Track engineering requests with fast filters, consistent priorities,
            and a clean handoff between product and engineering.
          </p>
        </section>
        <Dashboard />
      </main>
    </div>
  );
}
