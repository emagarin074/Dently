"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  UserCog,
  MapPin,
  Stethoscope,
  Banknote,
  QrCode,
  Menu,
  X,
  Globe,
  MessageSquare,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { href: "", label: "Dashboard", icon: LayoutDashboard },
      { href: "/bookings", label: "Appointments", icon: ClipboardList },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/patients", label: "Patients", icon: Users },
    ],
  },
  {
    title: "Clinical & Practice",
    items: [
      { href: "/procedures", label: "Procedures", icon: Stethoscope },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    title: "Financials",
    items: [
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/payroll", label: "Payroll", icon: Banknote, adminOnly: true },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/branches", label: "Branches", icon: MapPin, adminOnly: true },
      {
        href: "/website",
        label: "Website Builder",
        icon: Globe,
        adminOnly: true,
      },
      { href: "/inquiries", label: "Inquiries", icon: MessageSquare },
    ],
  },
  {
    title: "System & Tools",
    items: [
      { href: "/users", label: "Users", icon: UserCog, adminOnly: true },
      { href: "/qr", label: "QR Code", icon: QrCode, adminOnly: true },
      { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
    ],
  },
];

const assistantSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { href: "", label: "Dashboard", icon: LayoutDashboard },
      { href: "/bookings", label: "Appointments", icon: ClipboardList },
      { href: "/patients", label: "Patients", icon: Users },
    ],
  },
  {
    title: "Billing & Records",
    items: [
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    title: "Tools & Inquiries",
    items: [
      { href: "/inquiries", label: "Inquiries", icon: MessageSquare },
      { href: "/qr", label: "QR Code", icon: QrCode },
    ],
  },
];

interface Props {
  clinicSlug: string;
  clinicName: string;
  userRole: UserRole;
  userName: string;
  isSuperAdmin?: boolean;
}

interface SidebarContentProps {
  clinicSlug: string;
  clinicName: string;
  userRole: UserRole;
  userName: string;
  isSuperAdmin: boolean;
  pathname: string;
  onItemClick?: () => void;
}

function SidebarInner({
  clinicSlug,
  clinicName,
  userRole,
  userName,
  isSuperAdmin,
  pathname,
  onItemClick,
}: SidebarContentProps) {
  const base = `/clinic/${clinicSlug}/admin`;
  const sections =
    userRole === UserRole.DENTIST_ADMIN ? adminSections : assistantSections;

  function triggerSearch() {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const clinicInitials =
    clinicName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || clinicName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Clinic Workspace Brand */}
      <div className="p-3.5 border-b border-slate-100">
        <Link
          href={`/clinic/${clinicSlug}`}
          target="_blank"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white text-xs font-bold shadow-xs flex-shrink-0 tracking-wider">
            {clinicInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-xs text-slate-900 truncate tracking-tight">
                {clinicName}
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            </div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              {userRole === UserRole.DENTIST_ADMIN
                ? "Clinic Admin"
                : "Assistant"}
            </p>
          </div>
        </Link>

        {/* Quick Command Bar Trigger */}
        <button
          type="button"
          onClick={triggerSearch}
          className="mt-2 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 text-xs text-slate-500 transition-all shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="font-medium text-slate-600 text-[11px]">
              Quick Jump...
            </span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Super Admin HQ pill */}
      {isSuperAdmin && (
        <div className="px-3 pt-3">
          <Link
            href="/platform/clinics"
            className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all group"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">Super Admin HQ</span>
            </div>
            <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              PLATFORM
            </span>
          </Link>
        </div>
      )}

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const href = item.href ? `${base}${item.href}` : base;
                const isActive =
                  item.href === ""
                    ? pathname === base
                    : pathname.startsWith(`${base}${item.href}`);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={onItemClick}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary text-white shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon
                        className={cn(
                          "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150 group-hover:scale-105",
                          isActive
                            ? "text-white"
                            : "text-slate-500 group-hover:text-primary",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2.5 p-1 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold flex-shrink-0 shadow-2xs">
              {initials || "DR"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate tracking-tight">
                {userName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {userRole === UserRole.DENTIST_ADMIN
                    ? "Administrator"
                    : "Clinic Assistant"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({
  clinicSlug,
  clinicName,
  userRole,
  userName,
  isSuperAdmin = false,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-slate-200/80 lg:bg-white lg:fixed lg:inset-y-0 lg:z-40">
        <SidebarInner
          clinicSlug={clinicSlug}
          clinicName={clinicName}
          userRole={userRole}
          userName={userName}
          isSuperAdmin={isSuperAdmin}
          pathname={pathname}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4">
        <Link
          href={`/clinic/${clinicSlug}`}
          className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-2"
        >
          <div className="h-6 w-6 rounded-md bg-primary text-white flex items-center justify-center text-[10px] font-bold">
            {clinicName.slice(0, 2).toUpperCase()}
          </div>
          <span className="truncate">{clinicName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-command-palette"))
            }
            className="h-9 w-9 text-slate-600"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-9 w-9 text-slate-600"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-white shadow-2xl">
            <SidebarInner
              clinicSlug={clinicSlug}
              clinicName={clinicName}
              userRole={userRole}
              userName={userName}
              isSuperAdmin={isSuperAdmin}
              pathname={pathname}
              onItemClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
