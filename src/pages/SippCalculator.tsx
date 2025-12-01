import { ArrowLeft, Info } from "lucide-react";
import * as React from "react";

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
          } ${suffix ? "pr-8" : ""}`}
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
        {suffix ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
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
    </div>
  );
}

export default function SippCalculatorPage() {
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [minPercent, setMinPercent] = React.useState<number | "">("");
  const [stepPercent, setStepPercent] = React.useState<number | "">("");
  const [maxPercent, setMaxPercent] = React.useState<number | "">("");
  const [minWage, setMinWage] = React.useState<number | "">("");
  const [nrpmh, setNrphm] = React.useState<number | "">("");
  const [payAt100, setPayAt100] = React.useState<number | "">("");
  const [minIncentiveThreshold, setMinIncentiveThreshold] = React.useState<
    number | ""
  >("");
  const [round05, setRound05] = React.useState(false);
  const [useActual, setUseActual] = React.useState(false);

  const [actualNRMPHInput, setActualNRPMHInput] = React.useState<number | "">(
    ""
  );
  const [hourlyPayInput, setHourlyPayInput] = React.useState<number | "">("");
  const [actualSource, setActualSource] = React.useState<
    "nrpmh" | "pay" | "pct" | null
  >(null);
  const [actualError, setActualError] = React.useState("");
  const [actualNote, setActualNote] = React.useState("");
  const [actualPctInput, setActualPctInput] = React.useState<number | "">("");
  const actualComputed = React.useMemo(() => {
    if (!useActual || actualSource === null)
      return { pct: "", nrpmh: "", hourly: "" } as const;

    setActualError("");
    setActualNote("");
  }, [useActual, actualSource, actualPctInput]);

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
                  preffix="$"
                  step="0.01"
                  ariaLabel="Minimum Wage"
                  helper="Base hourly pay. Rate/Hr = Min Wage + Incentive/Hr."
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <NumberInput
                  label="100% NRPMH"
                  value={nrpmh}
                  onChange={setNrphm}
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
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
