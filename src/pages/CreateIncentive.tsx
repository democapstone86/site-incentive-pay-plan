import * as React from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  NumberInput,
  ColKey,
  ColumnDef,
  DataTableFrame,
  TableBody,
  TableCell,
  TableRow,
} from "./SippCalculator";
import { FileDown, Printer } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const REVENUE_NAMES = ["Bill Code", "Load Type", "Dock"];

const REVENUE_ATTRIBUTE_MAP = {
  "Bill Code": ["Bill Code Attr 1", "Bill Code Attr 2", "Bill Code Attr 3"],
  "Load Type": ["Load Type Attr 1", "Load Type Attr 2", "Load Type Attr 3"],
  Dock: ["Dock Attr 1", "Dock Attr 2", "Dock Attr 3"],
};

const ATTRIBUTE_NAMES = ["Attribute 1", "Attribute 2", "Attribute 3"];

const WORK_FUNCTION_NAMES = [
  "Auditing Production",
  "Breakout Production",
  "Bulk Selection Production",
  "Clamp Selection Prod",
  "Container Production",
  "Dunnage Production",
  "Event Prod",
  "Event Selection Prod",
  "Forklift Production",
  "HD Selection Zone 1",
  "Labeling Production",
  "Lead Instruction Week 1",
  "Selection Production",
  "Unload Production - Cold",
  "Unload Production - Dry",
  "Unload Production - Groc",
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
  Revenue: {
    dataset: REVENUE_NAMES,
    withStatus: false,
    showInactiveToggle: false,
    nameColumnLabel: "Revenue",
    hasStatusColumn: false,
    emptyMessage:
      "No revenue linked yet. Revenue is dependent on Services. Link at least one Service first, then select a single revenue option on the left and choose Add Selected. Only one revenue can be linked at a time.",
  },
  Attributes: {
    dataset: ATTRIBUTE_NAMES,
    withStatus: false,
    showInactiveToggle: false,
    nameColumnLabel: "Attribute",
    hasStatusColumn: false,
    emptyMessage:
      "No attributes linked yet. Attributes are dependent on Revenue. Link Revenue first, then select attributes on the left and choose Add Selected.",
  },
  "Work Functions": {
    dataset: WORK_FUNCTION_NAMES,
    withStatus: false,
    showInactiveToggle: false,
    nameColumnLabel: "Work Function",
    hasStatusColumn: false,
    emptyMessage:
      "No work functions linked yet. Work Functions are dependent on Services, Revenue, and Attributes. Link those first, then select work functions on the left and choose Add Selected.",
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

function deriveLinkedNames(rows) {
  return rows.filter((row) => row.linked).map((row) => row.name);
}

function filterRows(rows, query, showInactiveToggle, showInactive) {
  let cleaned = rows
    .map((row) => ({ ...row, name: (row.name || "").trim() }))
    .filter((row) => row.name);

  const trimmedQuery = (query || "").trim().toLowerCase();
  if (trimmedQuery) {
    cleaned = cleaned.filter((row) =>
      row.name.toLowerCase().includes(trimmedQuery)
    );
  }

  if (showInactiveToggle && !showInactive) {
    cleaned = cleaned.filter((row) => row.status !== "Inactive");
  }

  return cleaned;
}

function filterAndSortByName(rows, query) {
  const cleaned = rows.map((row) => ({
    ...row,
    name: (row.name || "").trim(),
  }));

  const trimmedQuery = (query || "").trim();
  if (!trimmedQuery) {
    return cleaned.slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  const q = trimmedQuery.toLowerCase();

  return cleaned
    .filter((row) => row.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function applyLinkState(rows, ids, linked) {
  if (!ids.length) return rows;
  const idSet = new Set(ids);
  return rows.map((row) => (idSet.has(row.id) ? { ...row, linked } : row));
}

function createCombinationId(suffix) {
  return (
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2) +
    (suffix ? "-" + suffix : "")
  );
}

function findDuplicateKeys(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!row.service || !row.revenueType || !row.attribute || !row.workFunction)
      continue;
    const key = [
      row.service,
      row.revenueType,
      row.attribute,
      row.workFunction,
    ].join("::");
    const existing = map.get(key) || [];
    existing.push(row.id);
    map.set(key, existing);
  }
  const result = [];
  for (const [key, ids] of map.entries()) {
    if (ids.length > 1) {
      result.push({ key, ids });
    }
  }
  return result;
}

function truncateText(value, maxLength = 80) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 1) + "…";
}

function LinkedSection(props) {
  const { title, datasetOverride, onRevenueLinkedChange, onLinkedChange } =
    props;

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
  const [visibleCount, setVisibleCount] = React.useState(6);
  const [linkedVisibleCount, setLinkedVisibleCount] = React.useState(6);
  const [linkedSearch, setLinkedSearch] = React.useState("");
  const [sortColumn, setSortColumn] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");

  function applySort(rows, column, direction) {
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;

      if (column === "name") {
        cmp = (a.name || "").localeCompare(b.name || "");
      } else if (column === "status") {
        const aStatus = a.status || "";
        const bStatus = b.status || "";
        cmp = aStatus.localeCompare(bStatus);
      } else if (column === "linked") {
        const aVal = a.linked ? 1 : 0;
        const bVal = b.linked ? 1 : 0;
        cmp = aVal - bVal;
      }

      return direction === "asc" ? cmp : -cmp;
    });

    return sorted;
  }
  React.useEffect(() => {
    setRows(
      initLinkableRows(effectiveDataset, {
        withStatus: sectionConfig.withStatus,
      })
    );
  }, [effectiveDataset, sectionConfig.withStatus]);

  const isRowSelected = (id) => selectedIds.includes(id);
  const hasRevenueSelection = title === "Revenue" && selectedIds.length > 0;

  const toggleSelectRow = (id) => {
    if (title === "Revenue") {
      setSelectedIds((prev) => (prev.includes(id) ? [] : [id]));
      return;
    }

    if (title === "Services") {
      const row = rows.find((r) => r.id === id);
      if (row && row.status === "Inactive") {
        return;
      }
    }

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSortChange = (column) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevColumn;
      }
      setSortDirection("asc");
      return column;
    });
  };

  const filteredRows = filterRows(
    rows,
    search,
    sectionConfig.showInactiveToggle,
    showInactive
  );

  const sortedRows = applySort(filteredRows, sortColumn, sortDirection);
  const visibleRows = sortedRows.slice(0, visibleCount);
  const showFooter = filteredRows.length > 6;
  const canShowMore = visibleCount < filteredRows.length;
  const canShowLess = visibleCount > 6;

  const linkedRows = rows.filter((row) => row.linked);

  const linkedNames = deriveLinkedNames(rows);

  React.useEffect(() => {
    if (onLinkedChange) {
      onLinkedChange(deriveLinkedNames(rows));
    }
  }, [rows, onLinkedChange]);

  const filteredLinkedRows = filterAndSortByName(linkedRows, linkedSearch);

  const visibleLinkedRows = filteredLinkedRows.slice(0, linkedVisibleCount);
  const linkedCanShowMore = linkedVisibleCount < filteredLinkedRows.length;
  const linkedCanShowLess = linkedVisibleCount > 6;
  const showLinkedFooter = filteredLinkedRows.length > 6;

  const selectableVisibleRows =
    title === "Services"
      ? visibleRows.filter((row) => row.status !== "Inactive")
      : visibleRows;

  const headerCheckboxChecked =
    selectableVisibleRows.length > 0 &&
    selectableVisibleRows.every((row) => selectedIds.includes(row.id));

  const toggleSelectAll = () => {
    if (title === "Revenue") {
      return;
    }

    const visibleIds = selectableVisibleRows.map((row) => row.id);
    if (visibleIds.length === 0) return;

    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const handleAddSelected = () => {
    if (!selectedIds.length) return;

    if (title === "Revenue") {
      const idToLink = selectedIds[0];
      setRows((current) => {
        const next = current.map((row) => ({
          ...row,
          linked: row.id === idToLink,
        }));
        if (onRevenueLinkedChange) {
          const linkedRow = next.find((row) => row.linked);
          onRevenueLinkedChange(linkedRow ? linkedRow.name : null);
        }
        return next;
      });
      return;
    }

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

  const handleRemoveLinkedItem = (id) => {
    if (title === "Revenue") {
      setRows((current) => {
        const next = applyLinkState(current, [id], false);
        if (onRevenueLinkedChange) {
          const linkedRow = next.find((row) => row.linked);
          onRevenueLinkedChange(linkedRow ? linkedRow.name : null);
        }
        return next;
      });
    } else {
      setRows((current) => applyLinkState(current, [id], false));
    }
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const { nameColumnLabel, hasStatusColumn, emptyMessage } = sectionConfig;

  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    return (
      <span className="ml-1 text-[9px]">
        {sortDirection === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const totalCount = rows.length;
  const linkedCount = linkedRows.length;
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

        <div className="overflow-x-auto">
          <table className="min-w-full border-t border-slate-100 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="w-10 px-4 py-2">
                  <div className="flext items-center justify-center">
                    <input
                      type="checkbox"
                      onChange={
                        title === "Revenue" ? undefined : toggleSelectAll
                      }
                      disabled={title === "Revenue"}
                      checked={
                        title === "Revenue" ? false : headerCheckboxChecked
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600"
                    />
                  </div>
                </th>
                <th className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => handleSortChange("name")}
                    className="flex items-center gap-1"
                  >
                    <span>{nameColumnLabel}</span>
                    {renderSortIcon("name")}
                  </button>
                </th>
                {hasStatusColumn && (
                  <th className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => handleSortChange("status")}
                      className="flex items-center gap-1"
                    >
                      <span>Status</span>
                      {renderSortIcon("status")}
                    </button>
                  </th>
                )}
                <th className="w-24 px-2 py-2">
                  <button
                    type="button"
                    onClick={() => handleSortChange("linked")}
                    className="flex items-center gap-1"
                  >
                    <span>Linked</span>
                    {renderSortIcon("linked")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
              {visibleRows.map((row) => {
                const isSelected = isRowSelected(row.id);
                const disabled =
                  (title === "Services" && row.status === "Inactive") ||
                  (title === "Revenue" && hasRevenueSelection && !isSelected);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className={
                            "h-4 w-4 rounded border-slate-300 text-sky-600 " +
                            ((title === "Services" &&
                              row.status === "Inactive") ||
                            (title === "Revenue" &&
                              hasRevenueSelection &&
                              !isSelected)
                              ? "opacity-40 cursor-not-allowed"
                              : "")
                          }
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2 align-middle text-[11px] font-medium">
                      {row.name}
                    </td>
                    {hasStatusColumn && (
                      <td className="w-24 px-2 py-2 align-middle">
                        {row.status ? (
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold " +
                              (row.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500")
                            }
                          >
                            {row.status}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-2 py-2 align-middle">
                      <span
                        className={
                          "text-[11px] font-semibold " +
                          (row.linked ? "text-emerald-600" : "text-slate-400")
                        }
                      >
                        {row.linked ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={hasStatusColumn ? 4 : 3}
                    className="px-4 py-6 text-center text-[11px] text-slate-400"
                  >
                    No items match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {showFooter && (
          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
            <span>
              Showing {visibleRows.length} of {filteredRows.length}. Use search
              to narrow the list.
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {canShowMore && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Load more
                </button>
              )}
              {canShowLess && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) => Math.max(6, prev - 6))
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white  px-4 py-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900">
          <span>Linked {title}</span>
          <span className="text-[11px] font-normal text-slate-400">
            {linkedCount} linked
          </span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px]">
            <span className="text-[10px] text-slate-400">🔍</span>
            <input
              type="text"
              value={linkedSearch}
              onChange={(e) => setLinkedSearch(e.target.value)}
              placeholder={`Search linked ${String(title).toLowerCase()}...`}
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          {linkedCount === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-400">
              {emptyMessage}
            </div>
          )}
          {visibleLinkedRows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
            >
              <span className="text-slate-800">{row.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveLinkedItem(row.id)}
                className="text-[11px] font-semibold text-slate-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          {linkedCount > 0 && (
            <div className="pt-2 text-[10px] text-slate-400">
              Linked: {linkedNames.join(", ")}
            </div>
          )}
          {showLinkedFooter && (
            <div className="mt-2 flex flex-wrap items-center justify-between border-t border-slate-100 text-[11px] text-slate-500">
              <span>
                Showing {visibleLinkedRows.length} of{" "}
                {filteredLinkedRows.length} linked.
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {linkedCanShowMore && (
                  <button
                    type="button"
                    onClick={() => setLinkedVisibleCount((prev) => prev + 6)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700:bg-slate-50"
                  >
                    Load more
                  </button>
                )}
                {linkedCanShowLess && (
                  <button
                    type="button"
                    onClick={() =>
                      setLinkedVisibleCount((prev) => Math.max(6, prev - 6))
                    }
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateIncentivePayPlan() {
  const { state } = useLocation();
  const siteId = state?.siteId;
  const navigate = useNavigate();

  const [draftId, setDraftId] = React.useState<string | null>(
    state?.draftId ?? null
  );

  const [isDraftLoading, setIsDraftLoading] = React.useState(false);

  const [selectedService, setSelectedService] = React.useState("");
  const canSaveDraft = Boolean(siteId?.id && selectedService);

  const [showSaveDraftDialog, setShowSaveDraftDialog] = React.useState(false);

  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  const previewPlanName = React.useMemo(() => {
    const sitePart = siteId?.id ? `SITE-${siteId.id}` : "SITE-";
    const servicePart = selectedService ? `-${selectedService}` : "";
    return `${sitePart}${servicePart}-v.10000`;
  }, [siteId?.id, selectedService]);

  const [activeTab, setActiveTab] = React.useState("details");
  const [activeRevenueName, setActiveRevenueName] = React.useState(null);
  const [linkedRevenues, setLinkedRevenues] = React.useState([]);
  const [linkedAttributes, setLinkedAttributes] = React.useState([]);
  const [effectiveStartDate, setEffectiveStartDate] = React.useState("");
  const [effectiveEndDate, setEffectiveEndDate] = React.useState("");
  const [linkedServices, setLinkedServices] = React.useState([]);
  const [linkedWorkFunctions, setLinkedWorkFunctions] = React.useState([]);
  const [isArchived, setIsArchived] = React.useState(false);

  const [appCombinations, setAppCombinations] = React.useState([]);

  const buildDraftPayload = React.useCallback(() => {
    return {
      selectedService,
      activeTab,
      activeRevenueName,
      linkedServices,
      linkedRevenues,
      linkedAttributes,
      linkedWorkFunctions,
      effectiveStartDate,
      effectiveEndDate,
      isArchived,
      appCombinations,
    };
  }, [
    selectedService,
    activeTab,
    activeRevenueName,
    linkedServices,
    linkedRevenues,
    linkedAttributes,
    linkedWorkFunctions,
    effectiveStartDate,
    effectiveEndDate,
    isArchived,
    appCombinations,
  ]);

  React.useEffect(() => {
    console.log(buildDraftPayload());
  }, [buildDraftPayload]);

  const [combinationSearch, setCombinationSearch] = React.useState("");
  const excludedCount = appCombinations.filter((row) => row.excluded).length;
  const [hideExcludedRows, setHideExcludedRows] = React.useState(false);

  const duplicateGroups = findDuplicateKeys(appCombinations);
  const duplicateIds = new Set(duplicateGroups.flatMap((group) => group.ids));

  let displayedCombinations = appCombinations;
  const trimmedQuery = (combinationSearch || "").trim().toLowerCase();
  if (trimmedQuery) {
    displayedCombinations = displayedCombinations.filter((row) => {
      return (
        (row.service && row.service.toLowerCase().includes(trimmedQuery)) ||
        (row.revenueType &&
          row.revenueType.toLowerCase().includes(trimmedQuery)) ||
        (row.attribute && row.attribute.toLowerCase().includes(trimmedQuery)) ||
        (row.workFunction &&
          row.workFunction.toLowerCase().includes(trimmedQuery))
      );
    });
  }

  const revenueDataset = React.useMemo(
    () => (linkedServices.length ? REVENUE_NAMES : []),
    [linkedServices.length]
  );

  const workFunctionDataset = React.useMemo(
    () =>
      linkedServices.length && linkedRevenues.length && linkedAttributes.length
        ? WORK_FUNCTION_NAMES
        : [],
    [linkedServices.length, linkedRevenues.length, linkedAttributes.length]
  );

  if (hideExcludedRows) {
    displayedCombinations = displayedCombinations.filter(
      (row) => !row.excluded
    );
  }

  const dynamicAttributeDatasetLocal = React.useMemo(() => {
    if (!activeRevenueName) return [];
    return REVENUE_ATTRIBUTE_MAP[activeRevenueName] || [];
  }, [activeRevenueName]);

  React.useEffect(() => {
    setAppCombinations((prev) => {
      const prevByKey = new Map();
      prev.forEach((row) => {
        const key = [
          row.service,
          row.revenueType,
          row.attribute,
          row.workFunction,
        ].join("::");
        prevByKey.set(key, row);
      });
      const generated = [];
      let idx = 1;
      linkedServices.forEach((service) => {
        linkedRevenues.forEach((revenueType) => {
          linkedAttributes.forEach((attribute) => {
            linkedWorkFunctions.forEach((workFunction) => {
              const key = [service, revenueType, attribute, workFunction].join(
                "::"
              );
              const existing = prevByKey.get(key);
              generated.push({
                id: existing ? existing.id : createCombinationId(String(idx)),
                label: String(idx),
                service,
                revenueType,
                attribute,
                workFunction,
                excluded: existing ? !!existing.excluded : false,
              });
              idx += 1;
            });
          });
        });
      });
      return generated;
    });
  }, [linkedServices, linkedRevenues, linkedAttributes, linkedWorkFunctions]);

  let dateError = "";
  if (
    effectiveStartDate &&
    effectiveEndDate &&
    effectiveEndDate < effectiveStartDate
  ) {
    dateError =
      "Effective end date cannot be before Effective start date, and Effective start cannot be after Effective end.";
  }
  let previewStatus = "Pending";

  let previewBadgeClass =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ";
  if (previewStatus === "Pending") {
    previewBadgeClass += "border-amber-200 bg-amber-50 text-amber-700";
  } else if (previewStatus === "In use") {
    previewBadgeClass += "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (previewStatus === "Not in use") {
    previewBadgeClass += "border-slate-200 bg-slate-100 text-slate-600";
  } else if (previewStatus === "Archived") {
    previewBadgeClass += "border-slate-500 bg-slate-800 text-slate-100";
  }

  const duplicateIdsSet = duplicateIds;

  const [minPercent, setMinPercent] = React.useState<number | "">("");
  const [stepPercent, setStepPercent] = React.useState<number | "">("");
  const [maxPercent, setMaxPercent] = React.useState<number | "">("");
  const [minWage, setMinWage] = React.useState<number | "">("");
  const [nrpmh, setNrpmh] = React.useState<number | "">("");
  const [payAt100, setPayAt100] = React.useState<number | "">("");
  const [minIncentiveThreshold, setMinIncentiveThreshold] = React.useState<
    number | ""
  >("");
  const [round05, setRound05] = React.useState(false);
  const [useActual, setUseActual] = React.useState(false);
  const [actualSource, setActualSource] = React.useState<
    "nrpmh" | "pay" | "pct" | null
  >(null);
  const [actualPctInput, setActualPctInput] = React.useState<number | "">("");
  const [actualError, setActualError] = React.useState("");
  const [actualNote, setActualNote] = React.useState("");
  const [actualNRMPHInput, setActualNRPMHInput] = React.useState<number | "">(
    ""
  );
  const [showChart, setShowChart] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<ColKey | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  type Mode = "pct" | "nrpmh" | "pay";
  const usd = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );
  const toCurrency = (n: number) => (Number.isFinite(n) ? usd.format(n) : "");
  type Row = {
    _i: number;
    percentToGoal: number;
    netRevHr: number;
    minWageCol: number;
    rateHr: number;
    incentiveHr: number;
  };

  const EPS = 1e-9;

  const roundToNearest = (value: number, increment: number) =>
    !increment || increment <= 0
      ? value
      : Math.round(value / increment) * increment;

  const parseNum = (v: unknown, fallback = 0) => {
    if (v === null || v === undefined || v === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const rows = React.useMemo<Row[]>(() => {
    const start = parseNum(minPercent);
    const end = parseNum(maxPercent);
    const step = Math.max(0.0001, parseNum(stepPercent, 1));
    const mw = parseNum(minWage);
    const n = parseNum(nrpmh);
    const threshold = Math.max(0, parseNum(minIncentiveThreshold));
    const p100 = parseNum(payAt100);

    const out: Row[] = [];
    let idx = 0;

    const first = start === 0 ? start + step : start;
    if (step <= 0 || first > end) return out;
    const steps = Math.floor((end - first) / step);

    for (let k = 0; k <= steps; k++) {
      const pct = Number((first + k * step).toFixed(6));
      const netRevHr = n * (pct / 100);
      let incentiveHr = p100 * (pct / 100) - mw;

      if (round05) incentiveHr = roundToNearest(incentiveHr, 0.05);
      if (incentiveHr < threshold) incentiveHr = 0;

      // Correct rate/hr formula
      const rateHr = mw + incentiveHr;

      out.push({
        _i: idx++,
        percentToGoal: Number(pct.toFixed(2)),
        netRevHr: Number(netRevHr.toFixed(2)),
        minWageCol: Number(mw.toFixed(2)),
        rateHr: Number(rateHr.toFixed(2)),
        incentiveHr: Number(incentiveHr.toFixed(2)),
      });
      if (out.length > 10000) break;
    }
    return out;
  }, [
    minPercent,
    maxPercent,
    stepPercent,
    minWage,
    nrpmh,
    minIncentiveThreshold,
    round05,
    payAt100,
  ]);

  const sortedRows = React.useMemo(() => {
    const copy = [...rows];
    if (!sortKey) return copy.sort((a, b) => a._i - b._i);
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return a._i - b._i;
      return (av < bv ? -1 : 1) * (sortDir === "asc" ? 1 : -1);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const [visibleCount, setVisibleCount] = React.useState(100);
  React.useEffect(() => setVisibleCount(100), [sortedRows.length]);
  const visibleRows = React.useMemo(
    () => sortedRows.slice(0, visibleCount),
    [sortedRows, visibleCount]
  );

  function interpolateFromTable(mode: Mode, x_in: number) {
    const pick = (r: Row) =>
      mode === "pct"
        ? { X: r.percentToGoal, Y1: r.netRevHr, Y2: r.rateHr }
        : mode === "nrpmh"
        ? { X: r.netRevHr, Y1: r.percentToGoal, Y2: r.rateHr }
        : { X: r.rateHr, Y1: r.percentToGoal, Y2: r.netRevHr };

    const data = rows
      .map(pick)
      .filter(
        (d) =>
          Number.isFinite(d.X) && Number.isFinite(d.Y1) && Number.isFinite(d.Y2)
      );

    if (data.length === 0)
      return { ok: false as const, msg: "No data available.", xUsed: NaN };
    if (data.length === 1) {
      const d0 = data[0];
      return {
        ok: true as const,
        xUsed: d0.X,
        y1: d0.Y1,
        y2: d0.Y2,
        clamped: false,
      };
    }
    const indexed = data.map((d, i) => ({ ...d, _i: i }));
    indexed.sort((a, b) => (a.X === b.X ? a._i - b._i : a.X - b.X));

    let x = x_in;
    const X_min = indexed[0].X;
    const X_max = indexed[indexed.length - 1].X;
    let clamped = false;
    if (x > X_max) {
      x = X_max;
      clamped = true;
    } else if (x < X_min) {
      x = X_min;
      clamped = true;
    }

    for (let j = 0; j < indexed.length; j++) {
      if (Math.abs(indexed[j].X - x) <= EPS) {
        return {
          ok: true as const,
          xUsed: x,
          y1: indexed[j].Y1,
          y2: indexed[j].Y2,
          clamped,
        };
      }
    }

    let i = 0;
    while (
      i + 1 < indexed.length &&
      !(indexed[i].X < x && x < indexed[i + 1].X)
    )
      i++;
    if (i >= indexed.length - 1) i = indexed.length - 2;
    const left = indexed[i];
    const right = indexed[i + 1];
    const denom = right.X - left.X;
    const t = Math.abs(denom) <= EPS ? 0 : (x - left.X) / denom;
    const y1 = left.Y1 + t * (right.Y1 - left.Y1);
    const y2 = left.Y2 + t * (right.Y2 - left.Y2);
    return { ok: true as const, xUsed: x, y1, y2, clamped };
  }

  const [hourlyPayInput, setHourlyPayInput] = React.useState<number | "">("");

  const actualComputed = React.useMemo(() => {
    if (!useActual || actualSource === null)
      return { pct: "", nrpmh: "", hourly: "" } as const;

    setActualError("");
    setActualNote("");

    const handle = (mode: Mode, raw: number | "") => {
      if (raw === "") return { pct: "", nrpmh: "", hourly: "" } as const;
      const x = Number(raw);
      if (!Number.isFinite(x)) {
        setActualError("Enter a number");
        return { pct: "", nrpmh: "", hourly: "" } as const;
      }
      const res = interpolateFromTable(mode, x);
      if (!res.ok) {
        setActualError(res.msg || "No data");
        return { pct: "", nrpmh: "", hourly: "" } as const;
      }
      if (res.clamped) setActualNote("Clamped to table bounds");
      if (mode === "pct")
        return {
          pct: x.toFixed(2),
          nrpmh: res.y1.toFixed(2),
          hourly: res.y2.toFixed(2),
        } as const;
      if (mode === "nrpmh")
        return {
          pct: res.y1.toFixed(2),
          nrpmh: x.toFixed(2),
          hourly: res.y2.toFixed(2),
        } as const;
      return {
        pct: res.y1.toFixed(2),
        nrpmh: res.y2.toFixed(2),
        hourly: res.y2.toFixed(2),
      } as const;
    };

    if (actualSource === "pct") return handle("pct", actualPctInput);
    if (actualSource === "nrpmh") return handle("nrpmh", actualNRMPHInput);
    return handle("pay", hourlyPayInput);
  }, [
    useActual,
    actualSource,
    actualPctInput,
    actualNRMPHInput,
    hourlyPayInput,
    rows,
  ]);

  const exportCSV = React.useCallback(() => {
    try {
      const header = [
        "% to Goal",
        "Net Revenue/Hour",
        "Minimum Wage",
        "Incentive/Hour",
        "Rate/Hour",
      ];
      const lines = rows.map((r) =>
        [
          r.percentToGoal,
          r.netRevHr,
          r.minWageCol,
          r.incentiveHr,
          r.rateHr,
        ].join(",")
      );
      const csv = ["\\ufeff" + header.join(","), ...lines].join("\\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calculator-data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("CSV export failed:", e);
    }
  }, [rows]);

  const handlePrint = React.useCallback(() => window.print(), []);

  const actualPoint = React.useMemo(() => {
    if (!useActual) return null;
    const px = Number(actualComputed.pct as any);
    const py = Number(actualComputed.hourly as any);
    return Number.isFinite(px) && Number.isFinite(py)
      ? ({ x: px, y: py } as const)
      : null;
  }, [useActual, actualComputed]);

  const starColor = React.useMemo(
    () =>
      !actualPoint ? undefined : actualPoint.x >= 100 ? "#16a34a" : "#dc2626",
    [actualPoint]
  );

  const columns: ColumnDef[] = React.useMemo(
    () => [
      { key: "percentToGoal", label: "% to Goal", widthClass: "w-[160px]" },
      { key: "netRevHr", label: "Net Revenue/Hour", widthClass: "w-[180px]" },
      { key: "minWageCol", label: "Minimum Wage", widthClass: "w-[160px]" },
      { key: "incentiveHr", label: "Incentive/Hour", widthClass: "w-[160px]" },
      { key: "rateHr", label: "Rate/Hour", widthClass: "w-[160px]" },
    ],
    []
  );

  function StarShape(props: any) {
    const { cx, cy, color = "#111827" } = props;
    const size = 14;
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size}
          fill={color}
        >
          ★
        </text>
      </g>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-10">
          <div className="flex items-start justify-between py-3 sm:items-center">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Incentive Pay Plan
              </div>
              <div className="text-sm font-semibold text-slice-900">
                Create incentive pay plan
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row ">
              <button
                type="button"
                onClick={() => navigate("/comingsoon")}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                View audit log
              </button>
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              {showCancelDialog &&
                createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-start justify-center sm:block"
                    role="dialog"
                    aria-modal="true"
                  >
                    {/* Backdrop */}
                    <div
                      className="absolute inset-0 bg-black/30 backdrop-blur-md"
                      onClick={() => setShowCancelDialog(false)}
                    />

                    {/* Modal */}
                    <div
                      className="relative z-10 mt-24 w-[calc(100%-2rem)] max-w-lg
                    sm:absolute sm:left-1/2 sm:top-24 sm:-translate-x-1/2
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    shadow-2xl
                    "
                    >
                      {/* Header */}
                      <div className="mt-5 px-6">
                        <h3 className="text-base font-semibold text-slate-900">
                          Cancel changes to selected plans?
                        </h3>

                        <p className="mt-2 text-sm text-slate-600">
                          Are you sure you want to discard the changes made to
                          the selected Incentive Pay Plan?
                        </p>
                      </div>

                      {/* Content */}
                      <div className="mt-5 px-6">
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold text-slate-700">
                            Selected Incentive Pay Plan
                          </p>

                          <ul className="space-y-1">{previewPlanName}</ul>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-6 flex flex-col-reverse gap-3 px-6 py-4 sm:flex-row sm:justify-end">
                        <button
                          onClick={() => setShowCancelDialog(false)}
                          className="w-full sm:w-auto rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          No, keep changes
                        </button>

                        <button
                          onClick={() => navigate("/incentive-pay-plans")}
                          className="w-full sm:w-auto rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Yes, Cancel selected
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.getElementById("modal-root")
                )}
              <button
                type="button"
                disabled={false}
                onClick={() => canSaveDraft && setShowSaveDraftDialog(true)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                  (canSaveDraft
                    ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400")
                }
              >
                Save draft
              </button>
              {showSaveDraftDialog &&
                createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-start justify-center sm:block"
                    role="dialog"
                    aria-modal="true"
                  >
                    {/* overlay */}
                    <div
                      className="absolute inset-0 bg-black/30 backdrop-blur-md"
                      onClick={() => setShowSaveDraftDialog(false)}
                    />

                    {/* dialog */}
                    <div
                      className=" relative z-10 mt-24 w-[calc(100%-2rem)] sm:absolute sm:left-1/2 sm:top-24 sm:w-[560px] sm:-translate-x-1/2
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    shadow-2xl"
                    >
                      {/* header */}
                      <div className="px-6 pt-6">
                        <h3 className="text-base font-semibold text-slate-900">
                          Save plan as draft?
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          Are you sure you want to save the{" "}
                          <span className="font-medium text-slate-800">
                            {previewPlanName}
                          </span>{" "}
                          Incentive Pay Plan as a draft?
                        </p>
                      </div>

                      {/* selected plans box */}
                      <div className="px-6 mt-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold text-slate-700 mb-2">
                            Selected Incentive Pay Plans
                          </p>
                          <ul className="space-y-1">
                            <li className="text-sm text-slate-800">
                              • {previewPlanName}
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* footer */}
                      <div className="mt-6 flex justify-end gap-3 border-slate-200 px-6 py-4">
                        <button
                          onClick={() => setShowSaveDraftDialog(false)}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          No, Cancel
                        </button>

                        <button
                          onClick={() => {
                            setShowSaveDraftDialog(false);
                          }}
                          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          Yes, Save as Draft
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.getElementById("modal-root")
                )}
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
              {previewPlanName}
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
            <LinkedSection
              title="Services"
              onLinkedChange={setLinkedServices}
            />
            <LinkedSection
              title="Revenue"
              datasetOverride={revenueDataset}
              onRevenueLinkedChange={setActiveRevenueName}
              onLinkedChange={setLinkedRevenues}
            />
            <LinkedSection
              title="Attributes"
              datasetOverride={dynamicAttributeDatasetLocal}
              onLinkedChange={setLinkedAttributes}
            />
            <LinkedSection
              title="Work Functions"
              datasetOverride={workFunctionDataset}
              onLinkedChange={setLinkedWorkFunctions}
            />
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
                <div className="space-y-3 text-[11px] text-slate-700">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">
                        Effective start
                        <span className="ml-0.5 text-[11px] font-semibold text-red-500">
                          *
                        </span>
                      </label>
                      <input
                        type="date"
                        value={effectiveStartDate}
                        onChange={(e) => setEffectiveStartDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-slate-600">
                        Effective end
                        <span className="ml-1 text-[10px] font-normal text-slate-400">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="date"
                        value={effectiveEndDate}
                        onChange={(e) => setEffectiveEndDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-600">
                      Preview status:
                    </span>
                    <span className={previewBadgeClass}>{previewStatus}</span>
                  </div>

                  <label className="mt-1 flex items-center gap-2  text-[10px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={isArchived}
                      onChange={(e) => setIsArchived(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600"
                    />
                    <span>Mark plan as archived (preview)</span>
                  </label>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Preview Status shows how this incentive plan would be
                    treated based on the effective start/end dates and archive
                    flag.
                  </p>
                  <ul className="mt-1 space-y-0.5 text-[10px] text-slate-400">
                    <li>
                      <span className="font-semibold">Pending</span> – Plan
                      hasn’t started yet (no start date or start date is in the
                      future).
                    </li>
                    <li>
                      <span className="font-semibold">In use</span> – Plan is
                      currently active between its start and end dates.
                    </li>
                    <li>
                      <span className="font-semibold">Not in use</span> – Plan’s
                      end date is in the past.
                    </li>
                    <li>
                      <span className="font-semibold">Archived</span> – Plan is
                      explicitly marked as archived, regardless of dates.
                    </li>
                  </ul>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Effective start is required. Leave Effective end blank if
                    the plan does not yet have an end date.
                  </p>
                  {dateError && (
                    <p className="mt-1 text-[10px] text-red-500">{dateError}</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl  border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <span>Applicable combinations</span>
                  <span className="text-[10px] font-normal normal-case text-slate-400">
                    {appCombinations.length} total • {excludedCount} excluded
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                    <span className="text-[10px] text-slate-400">🔍</span>
                    <input
                      type="text"
                      value={combinationSearch}
                      onChange={(e) => setCombinationSearch(e.target.value)}
                      placeholder="Search by service, revenue, attribute, or work function..."
                      className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-700">
                    <button
                      type="button"
                      onClick={() => setHideExcludedRows((prev) => !prev)}
                      className={
                        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold " +
                        (hideExcludedRows
                          ? "border-slate-800 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700")
                      }
                    >
                      {hideExcludedRows
                        ? "Hide excluded rows"
                        : "Show excluded rows"}
                    </button>
                    {excludedCount > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {excludedCount} row
                        {excludedCount !== 1 ? "s" : ""} excluded from the list.
                      </span>
                    )}
                  </div>
                </div>

                {appCombinations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-400">
                    No applicable combinations yet. Link at least one Service,
                    Revenue, Attribute, and Work Function in the Details tab to
                    populate this table.
                  </div>
                ) : displayedCombinations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-400">
                    No combinations match your current filters.
                  </div>
                ) : (
                  <div className="mb-3 overflow-x-auto rounded-xl border border-slate-100">
                    <table className="min-w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Services</th>
                          <th className="px-3 py-2">Revenue</th>
                          <th className="px-3 py-2">Attributes</th>
                          <th className="px-3 py-2">Work Functions</th>
                          <th className="w-20 px-3 py-2 text-center">
                            Exclude
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {displayedCombinations.map((row) => {
                          const isDuplicate = duplicateIdsSet.has(row.id);
                          return (
                            <tr
                              key={row.id}
                              className={
                                "hover:bg-slate-50/60 " +
                                (isDuplicate ? "bg-red-50/40" : "")
                              }
                            >
                              <td className="px-3 py-2 align-middle">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[11px] leading-snug line-clamp-2">
                                    {truncateText(row.service)}
                                  </span>
                                  {row.excluded && (
                                    <span className="inline-flex w-fit items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                                      Excluded
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <span className="text-[11px] leading-snug line-clamp-2">
                                  {truncateText(row.revenueType)}
                                </span>
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <span className="text-[11px] leading-snug line-clamp-2">
                                  {truncateText(row.attribute)}
                                </span>
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <span className="text-[11px] leading-snug line-clamp-2">
                                  {truncateText(row.workFunction)}
                                </span>
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAppCombinations((prev) =>
                                        prev.map((combo) =>
                                          combo.id === row.id
                                            ? {
                                                ...combo,
                                                excluded: !combo.excluded,
                                              }
                                            : combo
                                        )
                                      )
                                    }
                                    className={
                                      "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
                                      (row.excluded
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
                                    }
                                    aria-label={
                                      row.excluded
                                        ? "Include this combination"
                                        : "Exclude this combination"
                                    }
                                  >
                                    <span className="sr-only">
                                      {row.excluded
                                        ? "Include combination"
                                        : "Exclude combination"}
                                    </span>
                                    <span
                                      aria-hidden="true"
                                      className="text-xs"
                                    >
                                      {row.excluded ? "↩︎" : "⛔"}
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Site Incentive Pay Plan Calculator
                </div>
                <div className="space-y-3 text-[11px] text-slate-700">
                  <p className="mt-1 text-[10px] text-slate-400">
                    Model site incentive pay. Enter targets and pay rules to see
                    how hourly rate and incentive change across %-to-goal.
                    Compare actual results against the target model and export a
                    table or graph ofr stakeholders.
                  </p>
                  <section>
                    <div className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-slate-500">
                      <div className="space-y-3 text-[11px] text-slate-700">
                        <div className="grid gap-3 sm:grids-cols-2">
                          <div className="flex flex-col gap-1">
                            <NumberInput
                              label="Min %"
                              labelClassName="text-[11px] text-slate-700"
                              value={minPercent}
                              onChange={setMinPercent}
                              suffix="%"
                              step="1"
                              ariaLabel="Minimum Percent"
                              helper="Lowest % to include in the table. Example : 50 means start at 50%."
                              isPercent={true}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <NumberInput
                              label="Step %"
                              labelClassName="text-[11px] text-slate-700"
                              value={stepPercent}
                              onChange={setStepPercent}
                              suffix="%"
                              step="0.01"
                              ariaLabel="Step Percent"
                              helper="How much the % increases per row (e.g., 5 -> 50, 55, 60...)."
                              isPercent={true}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <NumberInput
                              label="Max %"
                              labelClassName="text-[11px] text-slate-700"
                              value={maxPercent}
                              onChange={setMaxPercent}
                              suffix="%"
                              step="1"
                              ariaLabel="Maximum Percent"
                              helper="Highest % to include. Must be greater than or equal to Min %."
                              isPercent={true}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <NumberInput
                              label="Min Wage/ Hour"
                              labelClassName="text-[11px] text-slate-700"
                              value={minWage}
                              onChange={setMinWage}
                              prefix="$"
                              step="0.01"
                              ariaLabel="Minimum Wage"
                              helper="Base hourly pay. Rate/Hr = Min Wage + Incentive/Hr."
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <NumberInput
                              label="100% NRPMH"
                              labelClassName="text-[11px] text-slate-700"
                              value={nrpmh}
                              onChange={setNrpmh}
                              prefix="$"
                              suffix="%"
                              step="1"
                              ariaLabel="NRPMH at 100%"
                              helper="Net revenue per man-hour at 100% goal. Used to compute the Net Revenue/Hour column."
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <NumberInput
                              label="Pay @ 100%"
                              labelClassName="text-[11px] text-slate-700"
                              value={payAt100}
                              onChange={setPayAt100}
                              prefix="$"
                              suffix="%"
                              step="1"
                              ariaLabel="Pay at 100 percent"
                              helper="Hourly pay when performance is 100% to goal. Incentive/Hr = Pay @ 100% - Min Wage."
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <NumberInput
                              label="Minmum Incentive Threshold"
                              labelClassName="text-[11px] text-slate-700"
                              value={minIncentiveThreshold}
                              onChange={setMinIncentiveThreshold}
                              prefix="$"
                              suffix="%"
                              step="1"
                              ariaLabel="Minimum Incentive Threshold"
                              helper="if Incentive/Hr is below this amount, it counts as $0 (no incentive)."
                            />
                          </div>

                          <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-4 justify-between">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-600"
                                checked={round05}
                                onChange={(e) => setRound05(e.target.checked)}
                              />
                              <span className="text-[11px] text-slate-700">
                                Round Incentive/hr to nearest $0.05
                              </span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-600"
                                checked={useActual}
                                onChange={(e) => setUseActual(e.target.checked)}
                              />
                              <span className="text-[11px] text-slate-700">
                                Use Actual section
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div
                className={`bg-white shadow-sm border border-slate-200 rounded-2xl p-[0.825rem] border-t-4 ${
                  useActual ? "opacity-100" : "opacity-50"
                }`}
                aria-label="Actual inputs"
              >
                <div className="flex items-center justify-between mb-[0.55rem]">
                  <h2 className="text-[11px] font-semibold uppercase font-semibold">
                    Actual
                  </h2>
                  <span className="text-xs text-blue-700 bg-blue-50 border px-2 py-0.5 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-[0.275rem]">
                  Exactly one input is active at a time. Focusing/typing
                  activates it and disables the other two until cleared.
                </p>
                <div className="space-y-[0.825rem] font-semibold text-[11px] text-slate-700">
                  <NumberInput
                    key={actualSource === null ? "pct-cleared" : "pct-active"}
                    label="Actual % to Goal"
                    labelClassName="text-[11px] text-slate-700"
                    disabled={
                      !useActual ||
                      (actualSource !== null && actualSource !== "pct")
                    }
                    suffix="%"
                    allowEmpty
                    value={
                      actualSource === "pct"
                        ? actualPctInput
                        : (actualComputed.pct as any)
                    }
                    onFocus={() => {
                      setActualSource("pct");
                      setActualError("");
                      setActualNote("");
                    }}
                    onChange={(v) => {
                      setActualPctInput(v as any);
                      setActualSource("pct");
                    }}
                    step="0.01"
                    ariaLabel="Actual Percent to Goal"
                    helper={`Type current % to goal. We'll compute NRPMH and Hourly from the table. Out-of-range values are clamped to [Min, Max].`}
                    isPercent={true}
                  />
                  <NumberInput
                    key={
                      actualSource === null ? "nrpmh-cleared" : "nrpmh-active"
                    }
                    label="Acutal NRPMH"
                    labelClassName="text-[11px] text-slate-700"
                    disabled={
                      !useActual ||
                      (actualSource !== null && actualSource !== "nrpmh")
                    }
                    prefix="$"
                    allowEmpty
                    value={
                      actualSource === "nrpmh"
                        ? actualNRMPHInput
                        : actualComputed.nrpmh !== ""
                        ? Number(actualComputed.nrpmh)
                        : ""
                    }
                    onFocus={() => {
                      setActualSource("nrpmh");
                      setActualError("");
                      setActualNote("");
                    }}
                    onChange={(v) => {
                      setActualNRPMHInput(v as any);
                      setActualSource("nrpmh");
                    }}
                    step="0.01"
                    ariaLabel="Actual NRPMH"
                    helper="Type current NRPMH to compute both % to Goal and Hourly from the table."
                  />
                  <NumberInput
                    key={actualSource === null ? "pay-cleared" : "pay-active"}
                    label="Hourly Pay"
                    labelClassName="text-[11px] text-slate-700"
                    disabled={
                      !useActual ||
                      (actualSource !== null && actualSource !== "pay")
                    }
                    prefix="$"
                    allowEmpty
                    value={
                      actualSource === "pay"
                        ? hourlyPayInput
                        : actualComputed.hourly !== ""
                        ? Number(actualComputed.hourly)
                        : ""
                    }
                    onFocus={() => {
                      setActualSource("pay");
                      setActualError("");
                      setActualNote("");
                    }}
                    onChange={(v) => {
                      setHourlyPayInput(v as any);
                      setActualSource("pay");
                    }}
                    step="0.01"
                    ariaLabel="Hourly Pay"
                    helper="Type current hourly rate to compute both % to Goal and NRPMH from the table."
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const hasPct =
                        typeof actualComputed.pct === "string" &&
                        actualComputed.pct !== "";
                      if (!hasPct) return null;
                      const pctVal = Number(actualComputed.pct);
                      const isGood = Number.isFinite(pctVal) && pctVal >= 100;
                      const deltaStr = `${(pctVal - 100).toFixed(2)}%`;
                      return (
                        <div
                          className={`text-xs inline-flex items-center gap-2 px-2 py-1 rounded border ${
                            isGood
                              ? "text-green-700 bg-green-50 border-green-200"
                              : "text-red-700 bg-red-50 border-red-200"
                          }`}
                        >
                          <span>∆ vs 100%:</span>
                          <strong>{deltaStr}</strong>
                        </div>
                      );
                    })()}
                    {actualNote ? (
                      <div className="text-xs text-amber-800 bg-amber-50 border-amber-200 inline-flex items-center gap-2 px-2 py-1 rounded">
                        {actualNote}
                      </div>
                    ) : null}
                    {actualError ? (
                      <div className="text-xs text-red-700 bg-red-50 border-red-200 inline-flex items-center gap-2 px-2 py-1 rounded">
                        {actualError}
                      </div>
                    ) : null}
                    <button
                      className="h-8 px-3 rounded-lg border-slate-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setActualSource(null);
                        setActualPctInput("");
                        setActualNRPMHInput("");
                        setHourlyPayInput("");
                        setActualError("");
                        setActualNote("");
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              </div>
              <div
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                aria-label="Data View"
              >
                <div className="flex items-center justify-between p-2">
                  <div
                    className="flex items-center gap-2"
                    role="tablist"
                    aria-label="View mode"
                  >
                    <div className="inline-flex rounded-xl bg-white ring-1 ring-slate-200 p-0.5">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={!showChart}
                        aria-label="Table view"
                        title="Table"
                        onClick={() => setShowChart(false)}
                        className={`${
                          !showChart
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-50"
                        } px-3 h-8 rounded-lg text-sm font-medium transition`}
                      >
                        Table
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={showChart}
                        aria-label="Graph view"
                        title="Graph"
                        onClick={() => setShowChart(true)}
                        className={`${
                          showChart
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-50"
                        } px-3 h-8 rounded-lg text-sm font-medium transition`}
                      >
                        Graph
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600">
                      Showing {Math.min(visibleCount, sortedRows.length)} of{" "}
                      {sortedRows.length}
                    </span>
                    {visibleCount < sortedRows.length && (
                      <button
                        className="h-8 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-blue-50"
                        onClick={() =>
                          setVisibleCount((c) =>
                            Math.min(c + 100, sortedRows.length)
                          )
                        }
                      >
                        Load 100 more
                      </button>
                    )}
                    <button
                      type="button"
                      className="h-9 w-9 rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 grid place-items-center"
                      onClick={exportCSV}
                      aria-label="Export CSV"
                      title="Export CSV"
                    >
                      <FileDown className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 grid place-items-center"
                      onClick={handlePrint}
                      aria-label="Print"
                      title="Print"
                    >
                      <Printer className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="relative h-[360px] md:h-[560px]">
                  <div
                    className={`absolute inset-0 ${
                      showChart ? "hidden" : "block"
                    } p-2 overflow-auto`}
                  >
                    <DataTableFrame
                      columns={columns}
                      sort={{ key: sortKey, dir: sortKey ? sortDir : null }}
                      onSortChange={(s) => {
                        setSortKey(s.key);
                        setSortDir((s.dir as any) || "asc");
                      }}
                    >
                      <TableBody>
                        {visibleRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="py-16 text-slate-500 flex items-center justify-center"
                            >
                              No rows yet - inject your content here.
                            </TableCell>
                          </TableRow>
                        ) : (
                          visibleRows.map((r, i) => (
                            <TableRow
                              key={i}
                              className={
                                i % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <TableCell>{r.percentToGoal}%</TableCell>
                              <TableCell>{toCurrency(r.netRevHr)}</TableCell>
                              <TableCell>{toCurrency(r.minWageCol)}</TableCell>
                              <TableCell>{toCurrency(r.incentiveHr)}</TableCell>
                              <TableCell>{toCurrency(r.rateHr)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </DataTableFrame>
                    {visibleCount < sortedRows.length && (
                      <div className="p-2 border-t bg-white sticky bottom-0 flex justify-center">
                        <button
                          className="h-10 px-4 rounded-lg bg_white border border-slate-300 text-slate-700 hover:bg-blue-50"
                          onClick={() =>
                            setVisibleCount((c) =>
                              Math.min(c + 100, sortedRows.length)
                            )
                          }
                        >
                          Load 100 more (showing {visibleCount} of{" "}
                          {sortedRows.length})
                        </button>
                      </div>
                    )}
                  </div>
                  <div
                    className={`absolute inset-0 ${
                      showChart ? "block" : "hidden"
                    } p-3`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rows}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="percentToGoal"
                          label={{
                            value: "% to Goal",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          label={{
                            value: "$ / hr",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          formatter={(v: any) => toCurrency(Number(v))}
                          labelFormatter={(l: any) => `${l}%`}
                          itemSorter={
                            ((a: any, b: any) => {
                              const order: Record<string, number> = {
                                "Rate/Hr": 0,
                                "Incentive/Hr": 1,
                              };
                              return (
                                (order[a?.name ?? ""] ?? 99) -
                                (order[b?.name ?? ""] ?? 99)
                              );
                            }) as unknown as (item: any) => string | number
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="rateHr"
                          name="Rate/Hr"
                          dot={false}
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="incentiveHr"
                          name="Incentive/Hr"
                          dot={false}
                          strokeDasharray="4 4"
                        />
                        {actualPoint && (
                          <ReferenceDot
                            x={actualPoint.x}
                            y={actualPoint.y}
                            isFront
                            r={8}
                            shape={<StarShape color={starColor} />}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
