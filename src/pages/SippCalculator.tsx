import { ArrowLeft } from "lucide-react";
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

export default function SippCalculatorPage() {
  const [helpOpen, setHelpOpen] = React.useState(false);

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
    </div>
  );
}
