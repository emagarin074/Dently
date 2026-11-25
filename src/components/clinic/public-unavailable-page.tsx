import type { ClinicAccessStatus } from "@/lib/subscription-status";
import { AlertTriangle, CalendarX } from "lucide-react";

interface Props {
  clinicName: string;
  status: Exclude<ClinicAccessStatus, "ACTIVE">;
}

export function PublicUnavailablePage({ clinicName, status }: Props) {
  const isSuspended = status === "SUSPENDED";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${
            isSuspended
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {isSuspended ? (
            <AlertTriangle className="h-6 w-6" />
          ) : (
            <CalendarX className="h-6 w-6" />
          )}
        </div>
        <p className="mt-5 text-xs font-bold uppercase text-slate-400">
          Temporarily unavailable
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{clinicName}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Online booking and public clinic information are temporarily
          unavailable. Please contact the clinic directly or try again later.
        </p>
      </section>
    </main>
  );
}
