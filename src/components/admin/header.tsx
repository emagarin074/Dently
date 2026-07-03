"use client"

import { logoutUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { LogOut, User, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Props {
  clinicSlug: string
  title: string
  userName: string
}

export function AdminHeader({ clinicSlug, title, userName }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6">
      <h1 className="text-base font-semibold lg:text-lg">{title}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clinic/${clinicSlug}`} target="_blank" className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" /> Public Page
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutUser.bind(null, clinicSlug)}>
                <button type="submit" className="flex w-full items-center gap-2 text-red-600">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
