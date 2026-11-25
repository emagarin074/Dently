import { requireSuperAdmin } from "@/lib/super-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Building2, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformUserMenu } from "@/components/platform/platform-user-menu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Administration | Dently",
  description:
    "Manage clinic tenants, subscriptions, and platform-wide metrics.",
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login?redirect=/platform/clinics");
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans">
      {/* Top Super Admin Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/platform/clinics"
              className="flex items-center gap-2.5 group"
            >
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight">
                    Dently
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Platform Operations & Tenant Control
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl text-xs h-9 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
            >
              <Link href="/">
                <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Back to Home</span>
              </Link>
            </Button>

            {user.clinic && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-xl text-xs h-9 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs hidden sm:flex"
              >
                <Link href={`/clinic/${user.clinic.slug}/admin`}>
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>My Clinic Workspace</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </Link>
              </Button>
            )}

            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

            <PlatformUserMenu user={user} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Dently Platform Super Admin</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-600">
              Platform Data Isolation & Tenant Guards Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
