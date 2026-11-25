import { logoutUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { ClinicAccessStatus } from "@/lib/subscription-status";
import { AlertTriangle, Building2, CalendarClock, LogOut } from "lucide-react";

interface Props {
  clinicSlug: string;
  clinicName: string;
  plan: string;
  planExpiresAt: Date | string | null;
  planNotes?: string | null;
  status: Exclude<ClinicAccessStatus, "ACTIVE">;
  userRole: string;
}

function formatDate(date: Date | string | null) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountStatusLock({
  clinicSlug,
  clinicName,
  plan,
  planExpiresAt,
  planNotes,
  status,
  userRole,
}: Props) {
  const isSuspended = status === "SUSPENDED";
  const isAdmin = userRole === "DENTIST_ADMIN";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isSuspended
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Workspace unavailable
              </p>
              <h1 className="text-lg font-bold text-slate-950">
                {isSuspended
                  ? "Clinic account suspended"
                  : "Subscription expired"}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5 text-sm text-slate-600">
          <p>
            {clinicName} is currently locked. Patient records, appointments,
            treatments, billing, documents, reports, and payroll are temporarily
            unavailable until access is restored.
          </p>

          <div className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 text-xs md:grid-cols-2">
            <div className="flex gap-2">
              <Building2 className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="font-bold text-slate-800">Current Plan</p>
                <p>{plan || "Starter"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CalendarClock className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="font-bold text-slate-800">Plan Expiry</p>
                <p>{formatDate(planExpiresAt)}</p>
              </div>
            </div>
          </div>

          {planNotes && (
            <div className="rounded-md border border-slate-100 bg-white p-4 text-xs">
              <p className="font-bold text-slate-800">Account Note</p>
              <p className="mt-1 text-slate-600">{planNotes}</p>
            </div>
          )}

          <div className="rounded-md border border-indigo-100 bg-indigo-50 p-4 text-xs text-indigo-900">
            {isAdmin
              ? "Renew the subscription or contact platform support to restore access."
              : "Please contact your clinic administrator to restore workspace access."}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <a
            href="mailto:support@dently.app"
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
          >
            Contact Support
          </a>
          <form action={logoutUser.bind(null, clinicSlug)}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
