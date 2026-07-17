"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutGlobal } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
];

interface UserProp {
  id: string;
  name: string;
  email: string;
  clinicId?: string | null;
  clinic?: {
    slug: string;
    name: string;
  } | null;
  avatarUrl?: string | null;
}

interface MarketingNavbarProps {
  user: UserProp | null;
}

export function MarketingNavbar({ user }: MarketingNavbarProps) {
  const [open, setOpen] = useState(false);

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("/#")) {
      const id = href.split("#")[1];
      const element = document.getElementById(id);
      if (element) {
        e.preventDefault();
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleLogout = async () => {
    await logoutGlobal();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 2C9.5 2 8 4 8 6c0 1.5.5 2.5 1 3.5C8 11 7 13 7 15c0 3 2 5 5 5s5-2 5-5c0-2-1-4-2-5.5.5-1 1-2 1-3.5C16 4 14.5 2 12 2z" />
            </svg>
          </div>
          Dently
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => handleScroll(e, l.href)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {user.clinic ? (
                <Button variant="ghost" asChild>
                  <Link href={`/clinic/${user.clinic.slug}/admin`}>
                    Workspace
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" asChild>
                  <Link href="/clinic/new">Set Up Workspace</Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer">
                    <Avatar className="h-9 w-9">
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                      )}
                      <AvatarFallback className="bg-primary text-white text-xs font-bold">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer font-medium"
                    asChild
                  >
                    <Link href="#">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer font-medium"
                    asChild
                  >
                    <Link href="#">Account Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 font-medium"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/pricing">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t md:hidden bg-white px-4 pb-4 pt-2 space-y-2">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-sm font-medium"
              onClick={(e) => {
                handleScroll(e, l.href);
                setOpen(false);
              }}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            {user ? (
              <>
                <div className="px-3 py-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                {user.clinic ? (
                  <Button asChild className="w-full">
                    <Link href={`/clinic/${user.clinic.slug}/admin`}>
                      Workspace
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/clinic/new">Set Up Workspace</Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full text-red-600 hover:text-red-700 border-red-200 bg-red-50/10"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/pricing">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
