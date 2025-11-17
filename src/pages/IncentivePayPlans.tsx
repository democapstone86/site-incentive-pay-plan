import { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const SITES = [
  { id: "30249", name: "SHAMROCK SACRAMENTO CA" },
  { id: "30321", name: "ALDI MORENO VALLEY CA SANI" },
  { id: "30364", name: "ALBERTS ORGANICS RIVERSIDE CA" },
  { id: "30388", name: "NEWELL BRANDS VICTORVILLE CA" },
  { id: "30438", name: "MCLANE SO CALIFORNIA SAN BERNARDINO CA" },
  { id: "30494", name: "MCLANE PACIFIC (MERCED) CA" },
  { id: "30496", name: "NOR CAL PRODUE (UNFI NAT) WEST SACRAMENTO CA" },
  { id: "30499", name: "US FOODS VISTA CA 4J" },
  { id: "30589", name: "INDIVIDUAL FOODSERVICE BELL CA" },
  { id: "30604", name: "FRITO LAY FRESNO CA S2U" },
];

const INITIAL_PLANS: Record<string, any[]> = {
  "30249": [
    {
      id: "p1",
      name: "30249-Unloading-v1.0000",
      service: "Unloading",
      version: "1.0000",
      status: "Active",
      services: 5,
      revenueType: "Bill Code",
      startDate: "2024-10-01",
      endDate: null,
      inUse: true,
    },
    {
      id: "p2",
      name: "30249-Selection-v1.0000",
      service: "Selection",
      version: "1.0000",
      status: "Inactive",
      services: 3,
      revenueType: "Dock",
      startDate: "2024-06-01",
      endDate: "2024-09-30",
      inUse: false,
    },
    {
      id: "p3",
      name: "30249-Palletizing-v2.0000",
      service: "Palletizing",
      version: "2.0000",
      status: "Pending",
      services: 0,
      revenueType: "Load Type",
      startDate: "2025-12-01",
      endDate: null,
      inUse: false,
    },
  ],
  "30321": [
    {
      id: "p4",
      name: "30321-Loading-v1.0000",
      service: "Loading",
      version: "1.0000",
      status: "Active",
      services: 2,
      revenueType: "Dock",
      startDate: "2024-11-15",
      endDate: null,
      inUse: false,
    },
  ],
};

const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function filterSites(query: string) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return SITES;
  return SITES.filter(
    (s) => s.id.includes(q) || s.name.toLowerCase().includes(q)
  );
}

function parseISODate(iso?: string) {
  if (!iso) return undefined as Date | undefined;
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? undefined : d;
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function isOnOrBeforeToday(iso?: string) {
  const d = parseISODate(iso);
  if (!d) return false;
  const t = startOfToday();
  d.setHours(0, 0, 0, 0);
  return d.getTime() <= t.getTime();
}

function daysBetweenInclusive(fromIso?: string, to?: Date) {
  const a = parseISODate(fromIso);
  if (!a) return 0;
  const b = new Date((to || startOfToday()).getTime());
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const ms = b.getTime() - a.getTime();
  return ms < 0 ? 0 : Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

export type Plan = {
  id: string;
  name: string;
  status: string;
  inUse?: boolean;
  startDate?: string;
  endDate?: string | null;
};

export function computeKPI(list: Plan[], today: Date) {
  let total = list.length,
    inUse = 0,
    pending = 0,
    notInUse = 0,
    archived = 0;
  let daysSum = 0;
  let inUseDen = 0;
  list.forEach((p) => {
    const startOk = isOnOrBeforeToday(p.startDate);
    const expired = Boolean(
      p.endDate && isOnOrBeforeToday(p.endDate || undefined)
    );
    const isArchived = p.status === "Archived";
    const isPending = p.status === "Pending" || (!startOk && !isArchived);
    const isActiveLabel = p.status === "Active";

    if (isArchived) {
      archived++;
      return;
    }
    if (expired) {
      notInUse++;
      return;
    }
    if (isPending) {
      pending++;
      return;
    }

    if (isActiveLabel && p.inUse) {
      inUse++;
      daysSum += daysBetweenInclusive(p.startDate, today);
      inUseDen++;
    } else {
      notInUse++;
    }
  });
  const avgDays = inUseDen ? Math.floor(daysSum / inUseDen) : 0;
  return { total, inUse, pending, notInUse, archived, avgDays };
}

const KPISummary = memo(function KPISummary({
  selectedSite,
  plansBySite,
  setStatusFilter,
}: {
  selectedSite: any;
  plansBySite: Record<string, any[]>;
  setStatusFilter: (f: "ALL" | "IN_USE" | "PENDING" | "INACTIVE") => void;
}) {
  const navigate = useNavigate();
  const today = startOfToday();

  const kpi = useMemo(() => {
    if (!selectedSite)
      return {
        total: 0,
        inUse: 0,
        pending: 0,
        notInUse: 0,
        archived: 0,
        avgDays: 0,
      };
    const list = plansBySite[selectedSite.id] || [];
    return computeKPI(list, today);
  }, [selectedSite, plansBySite]);

  if (!selectedSite) {
    return (
      <div className={cx(DS.card, DS.sectionPad)}>
        <h2 className="text-[15px] font-semibold text-slate-900">
          Incentive Pay Plan Summary
        </h2>
        <p className="mt-1 text-[13px] text-slate-600">
          Select a site to view KPIs.
        </p>
      </div>
    );
  }

  const tiles = [
    { label: "Total", value: kpi.total },
    {
      label: "In Use",
      value: kpi.inUse,
      link: "show all",
      onClick: () => setStatusFilter("IN_USE"),
    },
    {
      label: "Pending",
      value: kpi.pending,
      link: "show all",
      onClick: () => setStatusFilter("PENDING"),
    },
    {
      label: "Not In Use",
      value: kpi.notInUse,
      link: "show all",
      onClick: () => setStatusFilter("INACTIVE"),
    },
    {
      label: "Archived",
      value: kpi.archived,
      link: "view all",
      onClick: () => navigate("/archives"),
    },
    {
      label: "Avg Days",
      value: kpi.avgDays,
      link: "In use",
      onClick: () => setStatusFilter("IN_USE"),
    },
  ];

  return (
    <div className={cx(DS.card, DS.sectionPad)}>
      <h2 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide">
        {selectedSite.name} Incentive Pay Plan Summary
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-center space-y-1.5"
          >
            <div className="text-[12px] text-slate-600">{t.label}</div>
            <div className="text-2xl font-semibold text-slate-900">
              {t.value}
            </div>
            {(t as any).link && (
              <button
                type="button"
                onClick={(t as any).onClick}
                className="text-[12px] text-sky-700 underline-offset-2 hover:underline"
              >
                {(t as any).link}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const SiteSelect = memo(function SiteSelect({
  selectedSite,
  setSelectedSite,
}: {
  selectedSite: any;
  setSelectedSite: (s: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const options = useMemo(() => filterSites(q), [q]);
  return (
    <div className={cx(DS.card, DS.sectionPad)}>
      <h2 className="text-[-15px] font-semibold text-slate-900">
        Select a Site (search by ID or name)
      </h2>
      <div className="relative mt-2">
        <button
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="group flex w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769FF]"
        >
          <span
            className={cx(
              "truncate",
              selectedSite ? "text-slate-900" : "text-slate-500"
            )}
          >
            {selectedSite ? selectedSite.name : "Select a site"}
          </span>
          <svg
            className="h-4 w-4 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="relative p-2 pb-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search by Site ID or name"
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-500 focus:border-[#1769FF] focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <ul role="listbox" className="max-h-64 overflow-auto p-1">
              {options.length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
              )}
              {options.map((s) => (
                <li
                  key={s.id}
                  role="option"
                  tabIndex={0}
                  aria-selected={selectedSite?.id === s.id}
                  onClick={() => {
                    setSelectedSite(s);
                    setOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      (e.currentTarget as any).click();
                  }}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-slate-50 focus:bg-slate-50"
                >
                  <span
                    className="truncate text-sm text-slate-900"
                    title={s.name}
                  >
                    {s.name}
                  </span>
                  <span className="ml-auto w-20 text-right tabular-nums text-xs text-slate-600">
                    {s.id}
                  </span>
                  {selectedSite?.id === s.id && (
                    <svg
                      className="h-4 w-4 text-[#1769FF]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

function UIPreview() {
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [plansBySite, setPlansBySite] = useState<Record<string, any[]>>(() =>
    JSON.parse(JSON.stringify(INITIAL_PLANS))
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "IN_USE" | "PENDING" | "INACTIVE"
  >("ALL");
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

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <SiteSelect
            selectedSite={selectedSite}
            setSelectedSite={setSelectedSite}
          />
          <KPISummary
            selectedSite={selectedSite}
            plansBySite={plansBySite}
            setStatusFilter={setStatusFilter}
          />
        </section>
      </main>
    </div>
  );
}
export default function App() {
  return <UIPreview />;
}
