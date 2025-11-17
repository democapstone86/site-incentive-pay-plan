import * as React from "react";
import {
  Calendar,
  FileText,
  Wallet,
  Settings,
  ListChecks,
  User,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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

const AccordionItem = React.memo(function AccordionItem({
  icon,
  title,
  children,
  defaultOpen = false,
  linkPaths = [],
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  linkPaths?: string[];
}) {
  const location = useLocation();
  const [open, setOpen] = React.useState(defaultOpen);
  const uid = React.useId();
  const contentId = `panel-${uid}`;
  const labelId = `label-${uid}`;
  const toggle = React.useCallback(() => setOpen((v) => !v), []);

  React.useEffect(() => {
    if (linkPaths.some((p) => location.pathname.startsWith(p))) {
      setOpen(true);
    }
  }, [location.pathname, linkPaths]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-slate-300 hover:bg-slate-50 transition-colors"
        aria-expanded={open}
        aria-controls={contentId}
        id={labelId}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            {icon}
          </div>
          <span className="truncate font-medium text-slate-900">{title}</span>
        </div>
        <ChevronDown
          className={`ml-3 h-4 w-4 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={labelId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

const A = React.memo(function A(p: {
  href: string;
  title: string;
  desc: string;
}) {
  const location = useLocation();
  const path = p.href.replace(/^#/, "");
  const isActive = location.pathname === path;

  return (
    <div>
      <Link
        to={path}
        className={`font-medium underline-offset-4 transition-all rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5FA8]/40
          ${
            isActive
              ? "text-[#094F8C] font-semibold underline"
              : "text-[#0B5FA8] hover:text-[#094F8C] hover:underline"
          }`}
      >
        {p.title}
      </Link>
      <p
        className={`text-sm ${
          isActive ? "text-slate-700 font-medium" : "text-slate-600"
        }`}
      >
        {p.desc}
      </p>
    </div>
  );
});

const ICONS = {
  holiday: Calendar,
  invoicing: FileText,
  payroll: Wallet,
  admin: Settings,
  sipp: ListChecks,
} as const;

type LinkDef = { href: string; title: string; desc: string };

type SectionDef = {
  key: keyof typeof ICONS;
  title: string;
  defaultOpen?: boolean;
  tagline: string;
  description: string;
  links: LinkDef[];
};

const SECTIONS_DATA: SectionDef[] = [
  {
    key: "holiday",
    title: "Holiday Calendar",
    defaultOpen: true,
    tagline: "Plan with confidence.",
    description:
      "Stay organized with a unified calendar that highlights all company-observed holidays and site-specific schedules. It ensures teams can plan workloads effectively and avoid payroll or invoicing conflicts during non-working days.",
    links: [
      {
        href: "#/calendars",
        title: "Calendars",
        desc: "Browse company and site calendars.",
      },
      {
        href: "#/policy-assignment",
        title: "Policy Assignment",
        desc: "Assign holiday policies to sites or groups.",
      },
      {
        href: "#/hot-state-list",
        title: "HOT State List",
        desc: "View and manage HOT state configurations.",
      },
    ],
  },
  {
    key: "invoicing",
    title: "Invoicing",
    tagline: "Simplify billing and financial tracking.",
    description:
      "Create, manage, and review invoices in one centralized space. Gain transparency across billable services and maintain reliable records for audits and reporting.",
    links: [
      {
        href: "#/invoice-center",
        title: "Invoice Center",
        desc: "Configure and access the main invoicing center.",
      },
      {
        href: "#/third-party",
        title: "Third Party",
        desc: "Manage third-party invoicing integrations.",
      },
    ],
  },
  {
    key: "payroll",
    title: "Payroll",
    tagline: "Process pay accurately and efficiently.",
    description:
      "Process payroll efficiently and accurately. The system integrates site performance data with pay structures, ensuring timely compensation and compliance with Capstone’s pay policies.",
    links: [
      {
        href: "#/employee-time",
        title: "Employee Time",
        desc: "Review and adjust employee time entries.",
      },
    ],
  },
  {
    key: "admin",
    title: "Site Administration",
    tagline: "Manage your site with confidence.",
    description:
      "Configure site details, control user permissions, and maintain operational settings all in one place. Designed for clarity, consistency, and control.",
    links: [
      {
        href: "#/site-admin",
        title: "Site Admin",
        desc: "Access site configuration and administration tools.",
      },
    ],
  },
  {
    key: "sipp",
    title: "Site Incentive Pay Plan",
    tagline: "Reward performance, the right way.",
    description:
      "Access and configure incentive pay structures through the Capstone Incentive Pay Tool, aligning rewards with measurable site performance to promote fairness and motivation across teams.",
    links: [
      {
        href: "#/incentive-pay-plans",
        title: "Incentive Pay Plans",
        desc: "Browse active and scheduled incentive plans.",
      },
      {
        href: "#/practice-sipp-calculator",
        title: "Practice SIPP Calculator",
        desc: "Try out the Site Incentive Pay Plan calculator.",
      },
    ],
  },
];

function PageBody() {
  const userName = "Jordan";
  return (
    <main
      id="main"
      role="main"
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <section className="mb-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold leading-6">
            Welcome, {userName}
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-600">
            The Capstone Back Office Tool is your central command center for
            managing Capstone's core business operations. From payroll and
            invoicing to site administration and incentive programs, it brings
            every process together in one streamlined experience — ensuring
            consistency, accuracy, and collaboration across all teams.
          </p>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        {SECTIONS_DATA.map(
          ({ key, title, defaultOpen, tagline, description, links }) => {
            const Icon = ICONS[key];
            const linkPaths = links.map((l) => l.href.replace(/^#/, ""));
            return (
              <AccordionItem
                key={key}
                title={title}
                icon={<Icon className="h-5 w-5" aria-hidden />}
                defaultOpen={!!defaultOpen}
                linkPaths={links.map((l) => l.href.replace(/^#/, ""))}
              >
                <div className="space-y-3">
                  <p className="text-base font-medium text-slate-800">
                    {tagline}
                  </p>
                  <p>{description}</p>
                  <div className="mt-4 space-y-4">
                    {links.map((l) => (
                      <A
                        key={l.title}
                        href={l.href}
                        title={l.title}
                        desc={l.desc}
                      />
                    ))}
                  </div>
                </div>
              </AccordionItem>
            );
          }
        )}
      </section>
    </main>
  );
}

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
      <PageBody />
    </div>
  );
});

export default SIPPHomePage;
