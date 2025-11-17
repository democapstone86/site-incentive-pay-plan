const DS = {
  card: "rounded-xl border border-slate-200 bg-white shadow-sm",
  sectionPad: "p-5",
  toolbarBtn:
    "inline-flex items-center justify-center rounded-lg ring-1 ring-inset shadow-sm focus-visible:outline-none disabled:opacity-50",
  iconBtn: "h-8 w-8",
  primary: "bg-[#0F172A] text-white ring-slate-900/10 hover:brightness-110",
  subtle: "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
  info: "bg-[#1769FF] text-white ring-[#1769FF] hover:brightness-95",
  dangerGhost:
    "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-red-600 hover:text-white",
  badge:
    "inline-flex min-w-[8ch] items-center justify-center rounded-full px-2 py-0.5 text-[12px] font-medium leading-none",
  table: {
    wrap: "overflow-x-auto",
    el: "table-auto w-full border-separate border-spacing-0 text-[13px] leading-tight",
    head: "bg-slate-50",
    th: "sticky top-0 z-10 border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap",
    td: "px-3 py-2 align-middle",
  },
};

const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");
function UIPreview() {
  return (
    <div className="mih-h-screen bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-[#1769FF] text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20"
            >
              <span className="block h-4 w-4 rounded bg-white" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Capstone Logistics
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded px-1.5 py-1 text-white/90 hover:text-white">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              <span className="sr-only sm:not-sr-only text-[13px]">Help</span>
            </button>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/20"
              aria-label="User menu"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-14 pt-6">
        {/* Back link */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
            }}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            aria-label="Back to last page"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to last page</span>
          </button>
        </div>

        <section className={cx(DS.card, DS.sectionPad)}>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Site Incentive Pay Plans
          </h1>
          <p className="mt-1 text-[13px] text-slate-600">
            List view of site-level incentive pay plans.
          </p>
        </section>
      </main>
    </div>
  );
}
export default function App() {
  return <UIPreview />;
}
