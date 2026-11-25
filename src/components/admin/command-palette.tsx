"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
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
  Globe,
  MessageSquare,
  Plus,
  ExternalLink,
  Clock,
} from "lucide-react";
import { UserRole } from "@prisma/client";

interface Props {
  clinicSlug: string;
  userRole: UserRole;
}

export function AdminCommandPalette({ clinicSlug, userRole }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const base = `/clinic/${clinicSlug}/admin`;
  const isDentistAdmin = userRole === UserRole.DENTIST_ADMIN;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleOpenEvent = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", handleOpenEvent);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="max-h-[360px] p-2">
        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
          No matching commands or pages found.
        </CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push(`${base}/bookings?tab=requests`))
            }
          >
            <Plus className="mr-2 h-4 w-4 text-primary" />
            <span>New Appointment / Requests</span>
            <CommandShortcut>A</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/patients`))}
          >
            <Users className="mr-2 h-4 w-4 text-emerald-600" />
            <span>Search / Add Patient</span>
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push(`${base}/bookings?tab=queue`))
            }
          >
            <Clock className="mr-2 h-4 w-4 text-indigo-600" />
            <span>Live Queue Status</span>
            <CommandShortcut>Q</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                window.open(
                  `/clinic/${clinicSlug}`,
                  "_blank",
                  "noopener,noreferrer",
                ),
              )
            }
          >
            <ExternalLink className="mr-2 h-4 w-4 text-sky-600" />
            <span>Open Public Clinic Website</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1.5" />

        <CommandGroup heading="Clinical & Patient Operations">
          <CommandItem onSelect={() => runCommand(() => router.push(base))}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/bookings`))}
          >
            <ClipboardList className="mr-2 h-4 w-4 text-slate-500" />
            <span>Appointments</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/calendar`))}
          >
            <Calendar className="mr-2 h-4 w-4 text-slate-500" />
            <span>Calendar Schedule</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/patients`))}
          >
            <Users className="mr-2 h-4 w-4 text-slate-500" />
            <span>Patients Directory</span>
          </CommandItem>
          {isDentistAdmin && (
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push(`${base}/procedures`))
              }
            >
              <Stethoscope className="mr-2 h-4 w-4 text-slate-500" />
              <span>Procedure Builder</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator className="my-1.5" />

        <CommandGroup heading="Billing & Documents">
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/billing`))}
          >
            <CreditCard className="mr-2 h-4 w-4 text-slate-500" />
            <span>Billing & Payments</span>
          </CommandItem>
          {isDentistAdmin && (
            <CommandItem
              onSelect={() => runCommand(() => router.push(`${base}/payroll`))}
            >
              <Banknote className="mr-2 h-4 w-4 text-slate-500" />
              <span>Dentist Payroll</span>
            </CommandItem>
          )}
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/documents`))}
          >
            <FileText className="mr-2 h-4 w-4 text-slate-500" />
            <span>Documents & Templates</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/reports`))}
          >
            <BarChart3 className="mr-2 h-4 w-4 text-slate-500" />
            <span>Financial Reports & Analytics</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1.5" />

        <CommandGroup heading="Management & Clinic Settings">
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/inquiries`))}
          >
            <MessageSquare className="mr-2 h-4 w-4 text-slate-500" />
            <span>Website Inquiries</span>
          </CommandItem>
          {isDentistAdmin && (
            <>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`${base}/branches`))
                }
              >
                <MapPin className="mr-2 h-4 w-4 text-slate-500" />
                <span>Clinic Branches</span>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`${base}/website`))
                }
              >
                <Globe className="mr-2 h-4 w-4 text-slate-500" />
                <span>Website Builder</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push(`${base}/users`))}
              >
                <UserCog className="mr-2 h-4 w-4 text-slate-500" />
                <span>Staff & User Accounts</span>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`${base}/settings`))
                }
              >
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                <span>Clinic Settings & Preferences</span>
              </CommandItem>
            </>
          )}
          <CommandItem
            onSelect={() => runCommand(() => router.push(`${base}/qr`))}
          >
            <QrCode className="mr-2 h-4 w-4 text-slate-500" />
            <span>QR Codes & Patient Intake</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
