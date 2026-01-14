import { SortAsc } from "lucide-react";
import React from "react";
import {
  memo,
  useMemo,
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "./SippHomePage";

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

const STATUS_BADGE: Record<DisplayStatus, string> = {
  IN_USE: `${DS.badge} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200`,

  PENDING: `${DS.badge} bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200`,

  INACTIVE: `${DS.badge} bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200`,

  ARCHIVED: `${DS.badge} bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200`,
};

const STATUS_ORDER: Record<DisplayStatus, number> = {
  IN_USE: 0,
  PENDING: 1,
  INACTIVE: 2,
  ARCHIVED: 3,
};

const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

const fmtEndDate = (iso?: string) => (iso ? fmtDate(iso) : "None");
function stableSort<T>(arr: T[], cmp: (a: T, b: T) => number) {
  return arr
    .map((v, i) => ({ v, i }))
    .sort((a, b) => {
      const d = cmp(a.v, b.v);
      return d !== 0 ? d : a.i - b.i;
    })
    .map((x) => x.v);
}

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

function isPlanInUse(p: any) {
  const startOk = isOnOrBeforeToday(p.startDate);
  const expired = Boolean(
    p.endDate && isOnOrBeforeToday(p.endDate || undefined)
  );
  return p.status === "Active" && !!p.inUse && startOk && !expired;
}

function isPendingPlan(p: any) {
  const startOk = isOnOrBeforeToday(p.startDate);
  const isArchived = p.status === "Archived";
  return p.status === "Pending" || (!startOk && !isArchived);
}

type DisplayStatus = "IN_USE" | "PENDING" | "INACTIVE" | "ARCHIVED";

type UIPreviewRouteState = {
  siteId?: any;
};

function getDisplayStatus(p: any): DisplayStatus {
  const startOk = isOnOrBeforeToday(p.startDate);
  const expired = Boolean(p.endDate && isOnOrBeforeToday(p.endDate));

  if (p.isArchived || p.status === "Archived") return "ARCHIVED";
  if (!startOk || p.status === "Pending") return "PENDING";
  if (expired || p.status === "Inactive") return "INACTIVE";

  // 🔑 Any Active plan is now IN_USE
  if (p.status === "Active") return "IN_USE";

  return "INACTIVE";
}

export type Plan = {
  id: string;
  name: string;
  status: string;
  inUse?: boolean;
  startDate?: string;
  endDate?: string | null;

  isArchived?: boolean;
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
    const isArchived = p.status === "Archived" || p.isArchived === true;
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

const IndeterminateCheckbox = ({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  ariaLabel?: string;
}) => {
  const ref = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      className="h-4 w-4 rounded border-slate-300 text-[#1769FF] focus:ring-[#1769FF]"
      checked={checked}
      onChange={onChange}
    />
  );
};

const HeaderSortCtx = createContext<any>(null);
const Caret = ({ up }: { up: boolean }) => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {up ? (
      <polyline points="18 15 12 9 6 15" />
    ) : (
      <polyline points="6 9 12 15 18 9" />
    )}
  </svg>
);
const HeaderCell = memo(function HeaderCell({
  label,
  k,
}: {
  label: string;
  k: string;
}) {
  const { sortKey, setSortKey, sortAsc, setSortAsc } =
    useContext(HeaderSortCtx);
  const active = sortKey === k;
  return (
    <th
      scope="col"
      className={cx(DS.table.th, "cursor-pointer select-none")}
      onClick={() => {
        if (active) setSortAsc(!sortAsc);
        else {
          setSortKey(k);
          setSortAsc(true);
        }
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span
          aria-hidden
          className={cx(
            "inline-flex transition-colors duration-150",
            active ? "text-[#1769FF]" : "text-slate-400"
          )}
        >
          {active ? <Caret up={sortAsc} /> : <Caret up={true} />}
        </span>
      </span>
    </th>
  );
});

const ActionsMenu = ({
  open,
  anchorRect,
  onClose,
  onAction,
}: {
  open: boolean;
  anchorRect: any;
  onClose: () => void;
  onAction: (key: "view" | "edit" | "audit" | "archive") => void;
}) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!open || !anchorRect) {
      setPos(null);
      return;
    }
    const gap = 6;
    let left = anchorRect.left;
    const maxLeft = window.innerWidth - 224 - 8;
    left = Math.min(left, maxLeft);
    const top = Math.min(window.innerHeight - 8, anchorRect.bottom + gap);
    setPos({ top, left });
  }, [open, anchorRect]);
  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => {
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open || !pos) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute z-50 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        style={{ top: pos.top, left: pos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="py-1 text-[13px] text-slate-800">
          <li>
            <button
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
              onClick={() => {
                onAction("view");
                onClose();
              }}
            >
              <svg
                className="h-4 w-4 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>View (read only)</span>
            </button>
          </li>
          <li>
            <button
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
              onClick={() => {
                onAction("edit");
                onClose();
              }}
            >
              <svg
                className="h-4 w-4 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
              </svg>
              <span>Edit</span>
            </button>
          </li>
          <li>
            <button
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
              onClick={() => {
                onAction("audit");
                onClose();
              }}
            >
              <svg
                className="h-4 w-4 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Audit Log</span>
            </button>
          </li>
          <li>
            <button
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
              onClick={() => {
                onAction("archive");
                onClose();
              }}
            >
              <svg
                className="h-4 w-4 text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7h18" />
                <path d="M19 7v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Archive</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
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

const DataTable = memo(function DataTable({
  selectedSite,
  plans,
  selectedIds,
  onToggleOne,
  onToggleAll,
  openMenuId,
  setOpenMenuId,
  columns,
}: {
  selectedSite: any;
  plans: any[];
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  columns: { id: string; label: string; visible: boolean }[];
}) {
  const visibleIds = useMemo(() => plans.map((p: any) => p.id), [plans]);
  const [anchorRect, setAnchorRect] = useState<any>(null);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allSelected;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest?.("[data-actions-cell]")) setOpenMenuId(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDoc);
    };
  }, [setOpenMenuId]);

  const visibleCols = columns.filter((c) => c.visible);

  return (
    <section className={cx(DS.card, "mt-3")}>
      <div className={DS.table.wrap}>
        <table className={DS.table.el}>
          <thead className={DS.table.head}>
            <tr>
              <th className={cx(DS.table.th, "w-10")}>
                <IndeterminateCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={() => onToggleAll(visibleIds)}
                  ariaLabel="Select all visible"
                />
              </th>
              <th className={cx(DS.table.th, "w-10")}>Actions</th>
              {visibleCols.map((col) => (
                <HeaderCell key={col.id} label={col.label} k={col.id} />
              ))}
            </tr>
          </thead>
          <tbody>
            {!selectedSite ? (
              <tr>
                <td
                  colSpan={2 + visibleCols.length}
                  className="px-3 py-12 text-center text-slate-600"
                >
                  Select a site to view incentive pay plans.
                </td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + visibleCols.length}
                  className="px-3 py-12 text-center text-slate-600"
                >
                  No plans match your search.
                </td>
              </tr>
            ) : (
              plans.map((r: any, i: number) => (
                <tr
                  key={r.id}
                  className={i % 2 ? "bg-white" : "bg-slate-50/40"}
                >
                  <td className={cx(DS.table.td, "w-10")}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.name}`}
                      className="h-4 w-4 rounded border-slate-300 text-[#1769FF] focus:ring-[#1769FF]"
                      checked={selectedIds.has(r.id)}
                      onChange={() => onToggleOne(r.id)}
                    />
                  </td>
                  <td className={cx(DS.table.td, "relative")} data-actions-cell>
                    <button
                      type="button"
                      aria-label="Row actions"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === r.id ? null : r.id);
                        setAnchorRect(
                          (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect()
                        );
                      }}
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
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>
                    <ActionsMenu
                      open={openMenuId === r.id}
                      anchorRect={anchorRect}
                      onClose={() => setOpenMenuId(null)}
                      onAction={(key) => {
                        console.log("[ACTION]", key, r);
                      }}
                    />
                  </td>
                  {visibleCols.map((col) => {
                    if (col.id === "status") {
                      const displayStatus = getDisplayStatus(r);

                      const LABELS: Record<DisplayStatus, string> = {
                        IN_USE: "In Use",
                        PENDING: "Pending",
                        INACTIVE: "Inactive",
                        ARCHIVED: "Archived",
                      };

                      return (
                        <td key={col.id} className={DS.table.td}>
                          <span className={STATUS_BADGE[displayStatus]}>
                            {LABELS[displayStatus]}
                          </span>
                        </td>
                      );
                    }

                    if (col.id === "name")
                      return (
                        <td
                          key={col.id}
                          className={cx(
                            DS.table.td,
                            "max-w-[40ch] break-words"
                          )}
                        >
                          {r.name}
                        </td>
                      );
                    if (col.id === "services")
                      return (
                        <td
                          key={col.id}
                          className={cx(DS.table.td, "text-right tabular-nums")}
                        >
                          {r.services}
                        </td>
                      );
                    if (col.id === "revenueType")
                      return (
                        <td key={col.id} className={DS.table.td}>
                          {r.revenueType}
                        </td>
                      );
                    if (col.id === "startDate")
                      return (
                        <td key={col.id} className={DS.table.td}>
                          {fmtDate(r.startDate)}
                        </td>
                      );
                    if (col.id === "endDate")
                      return (
                        <td key={col.id} className={DS.table.td}>
                          {fmtEndDate(r.endDate)}
                        </td>
                      );
                    return null;
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
});

const SearchAndActions = memo(function SearchAndActions({
  q,
  setQ,
  selectedSite,
  selectedCount,
  onOpenConfirm,
  onOpenColumns,
}: {
  q: string;
  setQ: (s: string) => void;
  selectedSite: any;
  selectedCount: number;
  onOpenConfirm: () => void;
  onOpenColumns: () => void;
}) {
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value),
    [setQ]
  );
  const navigate = useNavigate();
  return (
    <section className={cx(DS.card, "mt-4 p-3")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
            type="search"
            inputMode="search"
            placeholder="Search by Status, Incentive Pay Plan, or Revenue Type"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-[14px] text-slate-900 placeholder-slate-500 shadow-sm hover:border-slate-400 focus:border-[#1769FF] focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
            value={q}
            onChange={onChange}
            disabled={!selectedSite}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            className={cx(DS.toolbarBtn, DS.iconBtn, DS.info)}
            aria-label="Add"
            onClick={() =>
              navigate("/createIncentive", {
                state: { siteId: selectedSite },
              })
            }
            disabled={!selectedSite}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Column customization"
            title="Column customization"
            onClick={onOpenColumns}
            className={cx(
              DS.toolbarBtn,
              DS.iconBtn,
              DS.subtle,
              "text-sky-700 ring-sky-300 hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-400"
            )}
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
              <line x1="4" y1="7" x2="20" y2="7" />
              <circle cx="9" cy="7" r="1.5" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <circle cx="14" cy="12" r="1.5" />
              <line x1="4" y1="17" x2="20" y2="17" />
              <circle cx="6.5" cy="17" r="1.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onOpenConfirm}
            disabled={!selectedSite || selectedCount === 0}
            title={
              selectedCount > 0
                ? `Archive ${selectedCount} selected`
                : "Select rows to bulk archive"
            }
            className={cx(
              DS.toolbarBtn,
              "h-8 px-2",
              DS.dangerGhost,
              selectedCount > 0 ? "" : "opacity-50 cursor-not-allowed"
            )}
            aria-label="Bulk archive"
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
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button
            className={cx(DS.toolbarBtn, DS.iconBtn, DS.subtle)}
            aria-label="Export"
            disabled
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 5 17 10" />
              <line x1="12" y1="5" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
});

function ColumnsModal({
  columns,
  onClose,
  onMove,
  onToggle,
  onApply,
}: {
  columns: any[];
  onClose: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onToggle: (id: string) => void;
  onApply?: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-16 w-[620px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">
              Customize Columns
            </h3>
            <p className="mt-1 text-[12px] leading-snug text-slate-600">
              Show or hide and reorder table columns. The first two columns
              (Select and Actions) are fixed and cannot be customized.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Changes update the preview immediately. Click{" "}
              <span className="font-medium text-slate-700">Apply</span> to save.
            </p>
          </div>
          <button
            className="rounded p-1 hover:bg-slate-50"
            onClick={onClose}
            aria-label="Close columns"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[55vh] overflow-auto p-4 space-y-2">
          {columns.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900 focus:ring-slate-900"
                  checked={!!c.visible}
                  onChange={() => onToggle(c.id)}
                />
                <span className="text-[13px] text-slate-900">{c.label}</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40"
                  disabled={idx === 0}
                  onClick={() => onMove(c.id, -1)}
                  aria-label="Move up"
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
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40"
                  disabled={idx === columns.length - 1}
                  onClick={() => onMove(c.id, 1)}
                  aria-label="Move down"
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
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onApply || onClose}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-medium text-white hover:brightness-110"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function UIPreview() {
  const location = useLocation() as unknown as Location & {
    state?: UIPreviewRouteState;
  };

  const [selectedSite, setSelectedSite] = useState<any>(null);

  useEffect(() => {
    if (!selectedSite) return;

    async function loadDrafts() {
      const res = await fetch(
        `/api/incentive-pay-plan/draft?siteId=${selectedSite.id}`
      );
      const drafts = await res.json();

      setPlansBySite((prev) => {
        const existing = prev[selectedSite.id] || [];

        const byId = new Map<string, any>();

        // keep mock + non-draft plans
        for (const p of existing) {
          if (!p.__isDraft) {
            byId.set(p.id, p);
          }
        }

        // overwrite drafts by id
        for (const d of drafts) {
          byId.set(d._id, {
            id: d._id,
            name: d.name,
            status: d.status === "IN_USE" ? "Active" : d.status,
            services:
              d.payload?.serviceCount ?? d.payload?.linkedServices?.length ?? 0,
            revenueType:
              d.payload?.activeRevenueName ??
              d.payload?.linkedRevenues?.[0] ??
              "Draft",
            startDate: d.payload?.effectiveStartDate,
            endDate: d.payload?.effectiveEndDate,
            inUse: d.status === "IN_USE",
            isArchived: Boolean(d.payload?.isArchived),
            __isDraft: true,
          });
        }

        return {
          ...prev,
          [selectedSite.id]: Array.from(byId.values()),
        };
      });
    }

    loadDrafts();
  }, [selectedSite]);

  useEffect(() => {
    if (location.state?.siteId) {
      setSelectedSite(location.state.siteId);

      // clear router state so it does not persist
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  const [plansBySite, setPlansBySite] = useState<Record<string, any[]>>(() =>
    JSON.parse(JSON.stringify(INITIAL_PLANS))
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "IN_USE" | "PENDING" | "INACTIVE"
  >("ALL");
  const [columns, setColumns] = useState<
    {
      id:
        | "status"
        | "name"
        | "services"
        | "revenueType"
        | "startDate"
        | "endDate";
      label: string;
      visible: boolean;
    }[]
  >([
    { id: "status", label: "Status", visible: true },
    { id: "name", label: "Service Matrix", visible: true },
    { id: "services", label: "Services", visible: true },
    { id: "revenueType", label: "Revenue Type", visible: true },
    { id: "startDate", label: "Effective Start", visible: true },
    { id: "endDate", label: "Effective End", visible: true },
  ]);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const moveColumn = useCallback((id: string, dir: -1 | 1) => {
    setColumns((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(j, 0, item);
      return next;
    });
  }, []);
  const toggleColumnVisible = useCallback((id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  }, []);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleAllVisible = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);
  const bulkArchiveSelected = useCallback(() => {
    if (!selectedSite || selectedIds.size === 0) return;
    setPlansBySite((prev) => {
      const siteId = selectedSite.id;
      const list = prev[siteId] || [];
      const nextList = list.map((p) =>
        selectedIds.has(p.id) ? { ...p, status: "Archived", inUse: false } : p
      );
      return { ...prev, [siteId]: nextList };
    });
    console.log("[BULK ARCHIVE]", Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedSite, selectedIds]);

  const plans = useMemo(() => {
    if (!selectedSite) return [] as any[];
    const base = plansBySite[selectedSite.id] || [];
    const statusFiltered =
      statusFilter === "ALL"
        ? base
        : base.filter((p: any) => {
            if (statusFilter === "IN_USE") return isPlanInUse(p);
            if (statusFilter === "PENDING") return isPendingPlan(p);
            if (statusFilter === "INACTIVE") return p.status === "Inactive";
            return true;
          });
    const query = q.trim().toLowerCase();
    const filtered = query
      ? statusFiltered.filter((r: any) =>
          [r.name, r.status, r.revenueType].some((v: any) =>
            String(v).toLowerCase().includes(query)
          )
        )
      : statusFiltered;
    const cmp = (a: any, b: any) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (sortKey === "status") {
        va = STATUS_ORDER[getDisplayStatus(a)];
        vb = STATUS_ORDER[getDisplayStatus(b)];
      } else if (sortKey === "services") {
        va = Number(a.services);
        vb = Number(b.services);
      } else if (sortKey === "startDate" || sortKey === "endDate") {
        va = va ? new Date(`${va}T00:00:00`).getTime() : 0;
        vb = vb ? new Date(`${vb}T00:00:00`).getTime() : 0;
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      const res = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? res : -res;
    };
    return stableSort([...filtered], cmp);
  }, [selectedSite, q, sortKey, sortAsc, plansBySite, statusFilter]);
  return (
    <div className="mih-h-screen bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <AppHeader
        helpHref="/help"
        brandHex="#1072BE"
        borderHex="#0E66AA"
        logoSrc="/assets/capstone-logo-white.png"
      />

      <main className="mx-auto max-w-7xl px-6 pb-14 pt-6">
        {/* Back link */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => navigate("/")}
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
            Site Incentive Pay Plan
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

        <HeaderSortCtx.Provider
          value={{ sortKey, setSortKey, SortAsc, setSortAsc }}
        >
          <SearchAndActions
            q={q}
            setQ={setQ}
            selectedSite={selectedSite}
            selectedCount={selectedIds.size}
            onOpenConfirm={bulkArchiveSelected}
            onOpenColumns={() => setShowColumnsModal(true)}
          />

          <DataTable
            selectedSite={selectedSite}
            plans={plans}
            selectedIds={selectedIds}
            onToggleOne={toggleOne}
            onToggleAll={toggleAllVisible}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            columns={columns}
          />
        </HeaderSortCtx.Provider>

        {showColumnsModal && (
          <ColumnsModal
            columns={columns}
            onClose={() => setShowColumnsModal(false)}
            onMove={moveColumn}
            onToggle={toggleColumnVisible}
            onApply={() => setShowColumnsModal(false)}
          />
        )}
      </main>
    </div>
  );
}
export default function App() {
  return <UIPreview />;
}
