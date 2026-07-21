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
import { LogOut, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  clinicSlug: string;
  title: string;
  userName: string;
}

export function AdminHeader({ clinicSlug, title, userName }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 lg:px-6 shadow-sm shadow-slate-100/10 select-none">
      <h1 className="text-base font-extrabold lg:text-lg text-slate-950 tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-slate-100/50 rounded-xl transition-all"
        >
          <Link
            href={`/clinic/${clinicSlug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold bg-slate-50 border border-slate-200/60 hover:border-slate-300 rounded-xl px-3 h-9 transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Public Page
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2.5 h-9 rounded-xl hover:bg-slate-100/50 px-2.5 transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-600 text-xs font-bold border border-indigo-500/15 shadow-sm">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="hidden sm:block text-xs font-bold text-slate-700 tracking-wide">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 rounded-2xl p-1.5 border-slate-200 shadow-xl shadow-slate-200/30"
          >
            <div className="px-2.5 py-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Signed In As
              </p>
              <p className="text-xs font-bold text-slate-800 truncate mt-1">
                {userName}
              </p>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              asChild
              className="rounded-xl focus:bg-red-50 focus:text-red-600 cursor-pointer"
            >
              <form
                action={logoutUser.bind(null, clinicSlug)}
                className="w-full"
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-xs font-semibold text-red-600 py-1"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
