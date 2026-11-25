"use client";

import { logoutUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  ExternalLink,
  ChevronRight,
  Search,
  Plus,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { SubscriptionBanner } from "@/components/admin/subscription-banner";

interface Props {
  clinicSlug: string;
  title: string;
  userName: string;
  plan?: string;
  planExpiresAt?: string | null;
  clinicName?: string;
}

export function AdminHeader({
  clinicSlug,
  title,
  userName,
  plan,
  planExpiresAt,
  clinicName,
}: Props) {
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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 lg:px-6 shadow-2xs select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href={`/clinic/${clinicSlug}/admin`}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors hidden sm:inline"
        >
          {clinicName || "Workspace"}
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-300 hidden sm:inline flex-shrink-0" />
        <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Middle Search trigger (Linear style) */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-sm mx-4">
        <button
          type="button"
          onClick={triggerSearch}
          className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/90 text-xs text-slate-400 hover:text-slate-600 transition-all shadow-2xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-slate-500 font-medium text-[11px]">
              Search or jump to...
            </span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <SubscriptionBanner
          plan={plan}
          planExpiresAt={planExpiresAt}
          clinicSlug={clinicSlug}
          clinicName={clinicName}
        />

        {/* Quick New Appointment Button */}
        <Button
          size="sm"
          variant="outline"
          asChild
          className="hidden sm:inline-flex h-8 px-2.5 text-xs font-semibold gap-1.5 text-slate-700 hover:text-slate-900 border-slate-200/90"
        >
          <Link href={`/clinic/${clinicSlug}/admin/bookings?tab=requests`}>
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>Appointment</span>
          </Link>
        </Button>

        {/* Public clinic link */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
        >
          <Link
            href={`/clinic/${clinicSlug}`}
            target="_blank"
            title="View public booking page"
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden xl:inline text-xs font-medium">
              Public Page
            </span>
          </Link>
        </Button>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-8 px-1.5 rounded-lg hover:bg-slate-100 transition-all"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white text-[10px] font-bold shadow-2xs">
                {initials || "DR"}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-slate-800 tracking-tight max-w-[120px] truncate">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl p-1.5 border-slate-200 shadow-xl"
          >
            <div className="px-2.5 py-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Signed In As
              </p>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {userName}
              </p>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              asChild
              className="rounded-lg text-xs cursor-pointer"
            >
              <Link
                href={`/clinic/${clinicSlug}/admin/calendar`}
                className="flex items-center gap-2 py-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>My Calendar</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              asChild
              className="rounded-lg focus:bg-rose-50 focus:text-rose-600 text-rose-600 cursor-pointer"
            >
              <form
                action={logoutUser.bind(null, clinicSlug)}
                className="w-full"
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-xs font-medium py-1"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
