import * as React from "react";
import { User } from "lucide-react";

export type AppHeaderProps = {
  logoSrc?: string;
  helpHref?: string;
  onProfile?: () => void;
  onLogout?: () => void;
  brandHex?: string;
  borderHex?: string;
  className?: string;
};

const AppHeader = React.memo(function AppHeader({
  logoSrc = "/assets/capstone-logo-white.png",
  helpHref = "#help",
  onProfile = () => (window.location.href = "/profile"),
  onLogout = () => (window.location.href = "/logout"),
  brandHex = "#1072BE",
  borderHex = "#0E66AA",
  className = "",
}: AppHeaderProps) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-[#1072BE] focus:shadow"
      >
        Skip to main content
      </a>
      <div
        className={`sticky top-0 z-40 w-full text-white ${className}`}
        style={{
          backgroundColor: brandHex,
          borderBottom: `1px solid ${borderHex}`,
        }}
        role="banner"
      >
        <div className="mx-auto flex h-14 items-center justify-between px-6">
          <img
            src={logoSrc}
            alt="Capstone Logistics"
            className="h-8 w-auto select-none"
            draggable={false}
          />
          <div className="flex items-center gap-3">
            <a
              href={helpHref}
              className="font-sans text-sm text-white/90 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 transition-colors"
              aria-label="Help"
            >
              Help
            </a>
            <UserMenu onProfile={onProfile} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </>
  );
});

const UserMenu = React.memo(function UserMenu({
  onProfile = () => {},
  onLogout = () => {},
}: {
  onProfile?: () => void;
  onLogout?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const firstItemRef = React.useRef<HTMLAnchorElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const toggle = React.useCallback(() => setOpen((v) => !v), []);
  const handleProfile = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      onProfile();
      setOpen(false);
    },
    [onProfile]
  );
  const handleLogout = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      onLogout();
      setOpen(false);
    },
    [onLogout]
  );

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick, true);
    return () => document.removeEventListener("mousedown", onDocClick, true);
  }, [open]);

  React.useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);
  return (
    <div className="relative">
      <button
        ref={btnRef}
        id="user-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        aria-label="Open user menu"
        onClick={toggle}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1072BE] shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2"
      >
        <User className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div
          id="user-menu"
          ref={menuRef}
          role="menu"
          aria-labelledby="user-menu-button"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-50"
        >
          <div className="h-px bg-slate-200" />
          <div className="py-1">
            <li>
              <a
                href="#profile"
                role="menuitem"
                ref={firstItemRef}
                onClick={handleProfile}
                className="block w-full px-4 py-2.5 text-sm text-slate-900 hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none leading-6"
              >
                User Profile
              </a>
            </li>
            <li>
              <a
                href="#logout"
                role="menuitem"
                onClick={handleLogout}
                className="block w-full px-4 py-2.5 text-sm text-slate-900 hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none leading-6"
              >
                Log out
              </a>
            </li>
          </div>
        </div>
      )}
    </div>
  );
});

const SIPPHomePage = React.memo(function SIPPHomePage() {
  React.useEffect(() => {
    const html = document.documentElement;
    const prevOverflow = html.style.overflowY;
    const prevGutter = (html.style as any).scrollbarGutter;
    html.style.overflowY = "scroll";
    (html.style as any).scrollbarGutter = "stable both-edges";
    return () => {
      html.style.overflowY = prevOverflow;
      (html.style as any).scrollbarGutter = prevGutter || "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-900">
      <AppHeader
        helpHref="/help"
        brandHex="#1072BE"
        borderHex="#0E66AA"
        logoSrc="/assets/capstone-logo-white.png"
      />
    </div>
  );
});

export default SIPPHomePage;
