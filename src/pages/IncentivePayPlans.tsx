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
    </div>
  );
}
export default function App() {
  return <UIPreview />;
}
