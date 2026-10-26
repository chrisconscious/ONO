const modules = [
  {
    name: "CRM",
    description: "Accounts, contacts and pipeline in one place.",
  },
  {
    name: "Sales",
    description: "Quotes, orders and revenue tracking.",
  },
  {
    name: "Finance",
    description: "Invoicing, expenses and reporting.",
  },
  {
    name: "Inventory",
    description: "Stock levels, movements and reordering.",
  },
  {
    name: "Procurement",
    description: "Suppliers, purchase orders and approvals.",
  },
  {
    name: "Projects",
    description: "Delivery plans, tasks and milestones.",
  },
  {
    name: "Workforce",
    description: "People, roles and availability.",
  },
  {
    name: "Analytics",
    description: "Cross-module metrics and dashboards.",
  },
  {
    name: "AI Insights",
    description: "Assisted decisions across your data.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-14 px-6 py-20">
      <header className="flex flex-col gap-5">
        <span className="w-fit rounded-full border border-border-subtle bg-surface-raised px-3 py-1 text-xs font-medium tracking-wide text-brand">
          Project scaffold
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          ONO
        </h1>
        <p className="max-w-2xl text-balance text-lg leading-relaxed text-slate-400">
          A multi-tenant platform for running business operations end to end.
          The foundation is in place — routes, modules, database layer and
          tooling are ready for the first feature.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <article
            key={module.name}
            className="rounded-xl border border-border-subtle bg-surface-raised p-5"
          >
            <h2 className="text-sm font-semibold text-white">{module.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {module.description}
            </p>
          </article>
        ))}
      </section>

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border-subtle pt-6 text-sm text-slate-500">
        <span>Next.js 16 · React 19 · TypeScript</span>
        <span>Tailwind CSS 4</span>
        <span>Prisma 6 · PostgreSQL</span>
      </footer>
    </main>
  );
}
