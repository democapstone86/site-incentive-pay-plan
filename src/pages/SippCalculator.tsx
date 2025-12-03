import * as React from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileDown,
  Info,
  Printer,
} from "lucide-react";

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
("recharts");

const parseNum = (v: unknown, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const roundToNearest = (value: number, increment: number) =>
  !increment || increment <= 0
    ? value
    : Math.round(value / increment) * increment;

export type ColKey =
  | "percentToGoal"
  | "netRevHr"
  | "minWageCol"
  | "rateHr"
  | "incentiveHr";

export type ColumnDef = {
  key: ColKey;
  label: string;
  widthClass?: string;
};

function Button({
  variant = "default",
  size = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "icon";
}) {
  const base =
    "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    default: "bg-slate-900 text-white hover:bg-slate-800 border-transparent",
    outline: "bg-white text-slate-900 hover:bg-slate-50 border-slate-200",
    ghost:
      "bg-transparent text-slate-900 hover:bg-slate-100 border-transparent",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3",
    default: "h-10 px-4",
    icon: "h-10 w-10",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = "any",
  ariaLabel,
  disabled = false,
  helper,
  allowEmpty = false,
  placeholder = "Enter value",
  ...rest
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  ariaLabel?: string;
  diabled?: boolean;
  helper?: string;
  allowEmpty?: boolean;
  placeholder?: string;
  [key: string]: any;
}) {
  const isCurrency = prefix === "$";

  const clampMoney = (n: number) => {
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 9_999_999) return 9_999_999;
    return n;
  };
  const toMoneyString = (n: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const parseMoneyString = (s: string) => {
    const cleaned = s.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    const n = Number(normalized);
    return Number.isFinite(n) ? clampMoney(n) : NaN;
  };

  const [display, setDisplay] = React.useState<string>(
    isCurrency && typeof value === "number"
      ? toMoneyString(value)
      : value === ""
      ? ""
      : String(value)
  );
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    if (editing) return;
    if (isCurrency) {
      if (value === "") setDisplay("");
      else if (typeof value === "number") setDisplay(toMoneyString(value));
      else {
        setDisplay(value === "" ? "" : String(value));
      }
    }
  }, [value, isCurrency, editing]);

  const {
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    ...restInput
  } = rest as any;

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        {helper ? <InfoTip text={helper} label={label} /> : null}
      </div>
      <div className="relative">
        {prefix ? (
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            {prefix}
          </span>
        ) : null}
        <input
          aria-label={ariaLabel || label}
          type={isCurrency ? "text" : "number"}
          inputMode="decimal"
          placeholder={isCurrency ? "Enter dollars" : placeholder}
          step={step}
          className={`w-full border border-slate-300 rounded-md px-[0.825rem] py-[0.55rem] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            prefix ? "pl-6" : ""
          } ${!isCurrency && suffix ? "pr-8" : ""}`}
          value={display}
          onFocus={(e) => {
            setEditing(true);
            if (typeof onFocusProp === "function") onFocusProp(e);
          }}
          onChange={(e) => {
            const raw = (e.target as HTMLInputElement).value;
            setDisplay(raw);
            if (allowEmpty && raw.trim() === "") {
              onChange("");
              return;
            }
            if (isCurrency) {
              const n = parseMoneyString(raw);
              if (Number.isFinite(n)) onChange(n);
              return;
            }
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
          onBlur={(e) => {
            setEditing(false);
            if (isCurrency) {
              if (display.trim() !== "") {
                const n = parseMoneyString(display);
                if (Number.isFinite(n)) {
                  const fixed = clampMoney(n);
                  setDisplay(toMoneyString(fixed));
                  onChange(fixed);
                }
              }
            }
            if (typeof onBlurProp === "function") onBlurProp(e);
          }}
          disabled={disabled}
          {...restInput}
        />
        {!isCurrency && suffix ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

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

function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = React.useState(false);
  const id = Math.random().toString(36).slice(2);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`${label} info`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open ? (
        <div
          role="tooltip"
          id={id}
          className="absolute z-20 left-1/2 -translate-x-1/2 -top-1 -translate-y-full w-max max-w-[min(85vw,28rem)] whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-white shadow-md text-[12px] leading-relaxed text-slate-700 p-2"
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45" />
          {text}
        </div>
      ) : null}
    </div>
  );
}

type TriSortState = { key: ColKey | null; dir: "asc" | "desc" | null };

function useTriSort(
  keyExternal?: ColKey | null,
  dirExternal?: "asc" | "desc",
  onChange?: (s: TriSortState) => void
) {
  const [sort, setSort] = React.useState<TriSortState>({
    key: keyExternal ?? null,
    dir: keyExternal ? dirExternal ?? "desc" : null,
  });
  React.useEffect(() => {
    setSort({
      key: keyExternal ?? null,
      dir: keyExternal ? dirExternal ?? "desc" : null,
    });
  }, [keyExternal, dirExternal]);
}

function DataTableFrame({
  columns,
  sort,
  onSortChange,
  children,
}: {
  columns: ColumnDef[];
  sort: TriSortState;
  onSortChange: (s: TriSortState) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[720px]">
      <div
        className="grid sticky top-0 z-10 bg-white h-10 items-center text-[11px] sm:text-xs font-semibold uppercase text-slate-600 px-2"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minMax(0, 1fr))`,
        }}
      >
        {columns.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() =>
              onSortChange({
                key: sort.key !== c.key ? (c.key as ColKey) : sort.key,
                dir:
                  sort.key !== c.key
                    ? "desc"
                    : sort.dir === "desc"
                    ? "asc"
                    : sort.dir === "asc"
                    ? null
                    : "desc",
              })
            }
            aria-sort={
              sort.key === c.key
                ? sort.dir === "asc"
                  ? "ascending"
                  : "descending"
                : "none"
            }
            className="flex items-center justify-between gap-1 text-left px-2 h-8 whitespace-nowrap rounded hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate300"
          >
            <span>{c.label}</span>
            <span className="shrink-0 opacity-80 inline-flex items-center">
              {sort.key === c.key ? (
                sort.dir === "asc" ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )
              ) : (
                <ChevronDown className="h3 w-3 opacity-30" />
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="divide-y divide-slate-200">{children}</div>
    </div>
  );
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <div role="rowgroup">{children}</div>;
}

function TableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="row"
      className={`grid gap-0 text-sm h-10 items-center px-0 ${className}`}
      style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
    >
      {children}
    </div>
  );
}

function TableCell({
  children,
  className = "",
  colSpan,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  style?: React.CSSProperties;
}) {
  const gridSpan =
    colSpan && colSpan > 1
      ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
      : undefined;
  return (
    <div
      className={`px-2 ${className}`}
      style={{ ...(style || {}), ...(gridSpan || {}) }}
    >
      {children}
    </div>
  );
}

export default function SippCalculatorPage() {
  const [helpOpen, setHelpOpen] = React.useState(false);
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

  type Mode = "pct" | "nrpmh" | "pay";
  const EPS = 1e-9;
  const [actualNRMPHInput, setActualNRPMHInput] = React.useState<number | "">(
    ""
  );
  const [hourlyPayInput, setHourlyPayInput] = React.useState<number | "">("");
  const [actualSource, setActualSource] = React.useState<
    "nrpmh" | "pay" | "pct" | null
  >(null);
  const [actualError, setActualError] = React.useState("");
  const [actualNote, setActualNote] = React.useState("");

  const [showChart, setShowChart] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<ColKey | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

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
  const [actualPctInput, setActualPctInput] = React.useState<number | "">("");
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

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
      if (helpOpen) window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    };
  }, [helpOpen]);

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

  return (
    <div className="min-h-screen bg-[#FFFFFFF] text-gray-900">
      <header className="flex items-center justify-between p-3 bg-blue-600 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded-md bg-white/20 grid place-items-center text-xs font-semibold tracking-wide">
            LOGO
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="
              border-white/40 
              text-white 
              bg-white/10
              hover:bg-white/20
              "
            onClick={() => setHelpOpen(true)}
          >
            Help
          </Button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 mt-2">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else window.location.assign("/");
          }}
          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 hover:underline text-sm font-medium"
          aria-label="Go back to the previous page"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to last page
        </button>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-3">
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-3 border-t-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Site Incentive Pay Plan Calculator
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Model site incentive pay. Enter targets and pay rules to see how
            hourly rate and incentive change across %-to-goal. Compare actual
            results against the target model and export a table or graph ofr
            stakeholders.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-3">
        <div
          role="region"
          aria-label="Inputs"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <section
            className="lg:col-span-2 bg_WHITE shadow-sm border border-slate-200 rounded-2xl p-4 md:p5 border-t-4"
            aria-labelledby="input-heading"
          >
            <h2 id="inputs-heading" className="text-base font-semibold mb-3">
              Inputs
            </h2>
            <div className="grid grid-cols-12 gap-4 md:gap-5 auto-rows-fr">
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="Min %"
                  value={minPercent}
                  onChange={setMinPercent}
                  suffix="%"
                  step="1"
                  ariaLabel="Minimum Percent"
                  helper="Lowest % to include in the table. Example : 50 means start at 50%."
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="Step %"
                  value={stepPercent}
                  onChange={setStepPercent}
                  suffix="%"
                  step="0.01"
                  ariaLabel="Step Percent"
                  helper="How much the % increases per row (e.g., 5 -> 50, 55, 60...)."
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="Max %"
                  value={maxPercent}
                  onChange={setMaxPercent}
                  suffix="%"
                  step="1"
                  ariaLabel="Maximum Percent"
                  helper="Highest % to include. Must be greater than or equal to Min %."
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="Min Wage/ Hour"
                  value={minWage}
                  onChange={setMinWage}
                  prefix="$"
                  step="0.01"
                  ariaLabel="Minimum Wage"
                  helper="Base hourly pay. Rate/Hr = Min Wage + Incentive/Hr."
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="100% NRPMH"
                  value={nrpmh}
                  onChange={setNrpmh}
                  prefix="$"
                  suffix="%"
                  step="1"
                  ariaLabel="NRPMH at 100%"
                  helper="Net revenue per man-hour at 100% goal. Used to compute the Net Revenue/Hour column."
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="Pay @ 100%"
                  value={payAt100}
                  onChange={setPayAt100}
                  prefix="$"
                  suffix="%"
                  step="1"
                  ariaLabel="Pay at 100 percent"
                  helper="Hourly pay when performance is 100% to goal. Incentive/Hr = Pay @ 100% - Min Wage."
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="Minmum Incentive Threshold"
                  value={minIncentiveThreshold}
                  onChange={setMinIncentiveThreshold}
                  prefix="$"
                  suffix="%"
                  step="1"
                  ariaLabel="Minimum Incentive Threshold"
                  helper="if Incentive/Hr is below this amount, it counts as $0 (no incentive)."
                />
              </div>
            </div>
            <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-4 justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  checked={round05}
                  onChange={(e) => setRound05(e.target.checked)}
                />
                <span className="text-sm">
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
                <span className="text-sm">Use Actual section</span>
              </label>
            </div>
          </section>
          <section
            className={`bg-white shadow-sm border border-slate-200 rounded-2xl p-[0.825rem] border-t-4 ${
              useActual ? "opacity-100" : "opacity-50"
            }`}
            aria-label="Actual inputs"
          >
            <div className="flex items-center justify-between mb-[0.55rem]">
              <h2 className="text-base font-semibold">Actual</h2>
              <span className="text-xs text-blue-700 bg-blue-50 border px-2 py-0.5 rounded">
                Optional
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-[0.275rem]">
              Exactly one input is active at a time. Focusing/typing activates
              it and disables the other two until cleared.
            </p>
            <div className="space-y-[0.825rem]">
              <NumberInput
                label="Actual % to Goal"
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
              />
              <NumberInput
                label="Acutal NRPMH"
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
                label="Hourly Pay"
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
                  className="h-8 px-3 rounded-lg border-slate-300 text-slate-700 hover:bg-blue-50"
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
          </section>
        </div>
        <section
          className="mt-4 bg-white shadow-sm border border-slate-200 rounded-2xl border-t-4"
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
                    setVisibleCount((c) => Math.min(c + 100, sortedRows.length))
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
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
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
                    Load 100 more (showing {visibleCount} of {sortedRows.length}
                    )
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
        </section>
      </div>
    </div>
  );
}
