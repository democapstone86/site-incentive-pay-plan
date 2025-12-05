import * as React from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const DETAIL_SERVICES_ROWS = [
  { id: 1, service: "Delivery" },
  { id: 2, service: "Sorting" },
  { id: 3, service: "Cross-Dock" },
];

export default function CreateIncentivePayPlan() {
  const { state } = useLocation();
  const siteId = state?.siteId;
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = React.useState("");

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
    </div>
  );
}
