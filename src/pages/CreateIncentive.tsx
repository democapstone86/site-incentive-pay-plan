import * as React from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const DETAIL_SERVICES_ROWS = [
  { id: 1, service: "Delivery" },
  { id: 2, service: "Sorting" },
  { id: 3, service: "Cross-Dock" },
];

const SERVICES_NAMES = [
  "Unloading",
  "Selection",
  "Labeling",
  "Freight Running",
  "Put Away",
  "Repack Sorting",
  "Trailer Stripping",
  "Auditing",
  "Loading",
  "Pallet",
];

const SECTION_CONFIG = {
  Services: {
    dataset: SERVICES_NAMES,
    withStatus: true,
    showInactiveToggle: false,
    nameColumnLabel: "Service Name",
    hasStatusColumn: true,
    emptyMessage:
      "No services linked yet. Select one or more services on the left and choose Add Selected.",
  },
};

const DEFAULT_SECTION_CONFIG = {
  dataset: [],
  withStatus: false,
  showInactiveToggle: false,
  nameColumnLabel: "Service Name",
  hasStatusColumn: false,
  emptyMessage:
    "No items linked yet. Select one or more on the left and choose Add Selected.",
};

function initLinkableRows(names, options) {
  const withStatus = options && options.withStatus;
  return names.map((name, idx) => ({
    id: name,
    name,
    status: withStatus ? (idx % 2 === 0 ? "Active" : "Inactive") : undefined,
    linked: false,
  }));
}

function applyLinkState(rows, ids, linked) {
  if (!ids.length) return rows;
  const idSet = new Set(ids);
  return rows.map((row) => (idSet.has(row.id) ? { ...row, linked } : row));
}

function LinkedSection(props) {
  const { title, datasetOverride, onRevenueLinkedChange } = props;

  const baseConfig = SECTION_CONFIG[title] || DEFAULT_SECTION_CONFIG;
  const sectionConfig = {
    ...baseConfig,
    emptyMessage:
      baseConfig.emptyMessage ||
      "No " +
        String(title).toLowerCase() +
        " linked yet. Select one or more in the " +
        String(title) +
        " section on the left and choose Add Selected.",
  };

  const effectiveDataset = datasetOverride || sectionConfig.dataset;

  const [rows, setRows] = React.useState(() =>
    initLinkableRows(effectiveDataset, {
      withStatus: sectionConfig.withStatus,
    })
  );

  const [search, setSearch] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState([]);

  React.useEffect(() => {
    setRows(
      initLinkableRows(effectiveDataset, {
        withStatus: sectionConfig.withStatus,
      })
    );
  }, [effectiveDataset, sectionConfig.withStatus]);

  const handleAddSelected = () => {
    if (title === "Services") {
      setRows((current) => {
        const activeIds = selectedIds.filter((id) => {
          const row = current.find((r) => r.id === id);
          return row && row.status === "Active";
        });
        if (!activeIds.length) return current;
        return applyLinkState(current, activeIds, true);
      });
      return;
    }

    setRows((current) => applyLinkState(current, selectedIds, true));
  };

  const handleRemoveSelected = () => {
    if (!selectedIds.length) return;

    if (title === "Revenue") {
      setRows((current) => {
        const next = applyLinkState(current, selectedIds, false);
        if (onRevenueLinkedChange) {
          const linkedRow = next.find((row) => row.linked);
          onRevenueLinkedChange(linkedRow ? linkedRow.name : null);
        }
        return next;
      });
      return;
    }
    setRows((current) => applyLinkState(current, selectedIds, false));
  };

  const totalCount = rows.length;
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <div className="flex items-center justify-between">
            <span>{title}</span>
            <span className="text-[10px] font-normal tracking-normal text-slate-400">
              Total: {totalCount}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-xs text-slate-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${String(title).toLowerCase()}...`}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          {sectionConfig.showInactiveToggle && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              show inactive
            </label>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddSelected}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Add Selected
            </button>
            <button
              type="button"
              onClick={handleRemoveSelected}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500"
            >
              Remove Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateIncentivePayPlan() {
  const { state } = useLocation();
  const siteId = state?.siteId;
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("details");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Incentive Pay Plan
              </div>
              <div className="text-sm font-semibold text-slice-900">
                Create incentive pay plan
              </div>
            </div>

            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => navigate("/comingsoon")}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                View audit log
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={false}
                className={
                  "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                }
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={false}
                className={
                  "rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                }
              >
                Submit
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Site #
              </label>
              <input
                type="text"
                value={`SITE-${siteId?.id ?? ""}`}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none"
              />
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Select Service Type
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="" disabled>
                    Select a service type
                  </option>

                  {DETAIL_SERVICES_ROWS.map((row) => (
                    <option key={row.id} value={row.service}>
                      {row.service}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-400">
                  &#9660;
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Version #
              </label>
              <input
                type="text"
                value="v1.0000"
                disabled
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="pb-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Draft
              </span>
              <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Incentive plan name (preview)
              </label>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              {`SITE-${siteId?.id ?? ""} ${
                selectedService ? `-${selectedService}` : ""
              }-v.100000`}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-10">
        <div className="flex justify-center pt-4">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={
                "rounded-full px-4 py-1.5 transition " +
                (activeTab === "details"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800")
              }
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={
                "rounded-full px-4 py-1.5 transition " +
                (activeTab === "calculator"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800")
              }
            >
              Incentive pay calculator
            </button>
          </div>
        </div>

        <div className="py-6">
          {/* Details tab */}
          <div
            className={
              activeTab === "details" ? "flex flex-col gap-8" : "hidden"
            }
          >
            <LinkedSection title="Services" />
          </div>
          <div
            className={
              activeTab === "calculator"
                ? "grid gap-6 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]"
                : "hidden"
            }
          >
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Effective start dates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
