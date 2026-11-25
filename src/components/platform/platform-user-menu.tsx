"use client";

import { logoutGlobal } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Home, Building2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

interface PlatformUserMenuProps {
  user: {
    name: string;
    email: string;
    clinic?: {
      slug: string;
      name?: string;
    } | null;
  };
}

export function PlatformUserMenu({ user }: PlatformUserMenuProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutGlobal();
    });
  };

  const initial = user.name.charAt(0).toUpperCase() || "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {initial}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">
              {user.name}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
              {user.email}
            </p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl p-1.5 border-slate-200 shadow-xl shadow-slate-200/30"
      >
        <DropdownMenuLabel className="font-normal px-2.5 py-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-800 leading-none truncate">
                {user.name}
              </p>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          asChild
          className="rounded-xl cursor-pointer text-xs font-medium text-slate-700 focus:bg-slate-50"
        >
          <Link href="/" className="flex items-center gap-2 py-1.5 px-2">
            <Home className="h-4 w-4 text-slate-500" />
            <span>Go to Index Page</span>
          </Link>
        </DropdownMenuItem>
        {user.clinic && (
          <DropdownMenuItem
            asChild
            className="rounded-xl cursor-pointer text-xs font-medium text-slate-700 focus:bg-slate-50"
          >
            <Link
              href={`/clinic/${user.clinic.slug}/admin`}
              className="flex items-center gap-2 py-1.5 px-2"
            >
              <Building2 className="h-4 w-4 text-slate-500" />
              <span>My Clinic Workspace</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          asChild
          className="rounded-xl focus:bg-red-50 focus:text-red-600 cursor-pointer text-xs font-medium text-red-600"
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="flex w-full items-center gap-2 py-1.5 px-2 text-xs font-semibold text-red-600 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            <span>{isPending ? "Signing out..." : "Log Out"}</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
