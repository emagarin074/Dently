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
  Stethoscope,
  QrCode,
  Menu,
  X,
  Globe,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";

const adminLinks = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Appointments", icon: ClipboardList },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/procedures", label: "Procedures", icon: Stethoscope },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/website", label: "Website Builder", icon: Globe, adminOnly: true },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/users", label: "Users", icon: UserCog, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
  { href: "/qr", label: "QR Code", icon: QrCode, adminOnly: true },
];

const assistantLinks = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Appointments", icon: ClipboardList },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/qr", label: "QR Code", icon: QrCode },
];

interface Props {
  clinicSlug: string;
  clinicName: string;
  userRole: UserRole;
  userName: string;
}

export function AdminSidebar({
  clinicSlug,
  clinicName,
  userRole,
  userName,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = `/clinic/${clinicSlug}/admin`;

  const links =
    userRole === UserRole.DENTIST_ADMIN ? adminLinks : assistantLinks;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b">
        <Link
          href={`/clinic/${clinicSlug}`}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold flex-shrink-0">
            {clinicName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{clinicName}</p>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const href = link.href ? `${base}${link.href}` : base;
          const isActive =
            link.href === ""
              ? pathname === base
              : pathname.startsWith(`${base}${link.href}`);
          return (
            <Link
              key={link.href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <link.icon className="h-4 w-4 flex-shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {userRole === UserRole.DENTIST_ADMIN
                ? "Dentist Admin"
                : "Assistant"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-white lg:fixed lg:inset-y-0 lg:z-40">
        {NavContent()}
      </aside>

      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-white px-4">
        <Link
          href={`/clinic/${clinicSlug}`}
          className="font-semibold text-primary"
        >
          {clinicName}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-white">
            {NavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
