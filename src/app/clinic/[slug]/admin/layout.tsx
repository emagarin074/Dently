import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { getClinicAccessStatus } from "@/lib/subscription-status";
import { AccountStatusLock } from "@/components/admin/account-status-lock";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminCommandPalette } from "@/components/admin/command-palette";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { slug } = await params;
  const user = await requireAuth(slug);

  if (!user) redirect(`/clinic/${slug}/login`);

  const isSuperAdmin = isSuperAdminEmail(user.email);
  const accessStatus = getClinicAccessStatus(user.clinic);

  if (!isSuperAdmin && accessStatus !== "ACTIVE") {
    return (
      <AccountStatusLock
        clinicSlug={slug}
        clinicName={user.clinic.name}
        plan={user.clinic.plan}
        planExpiresAt={user.clinic.planExpiresAt}
        planNotes={user.clinic.planNotes}
        status={accessStatus}
        userRole={user.role}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans antialiased text-slate-900 selection:bg-slate-900 selection:text-white">
      <AdminSidebar
        clinicSlug={slug}
        clinicName={user.clinic.name}
        userRole={user.role}
        userName={user.name}
        isSuperAdmin={isSuperAdmin}
      />
      <div className="flex-1 lg:pl-64">
        <div className="flex min-h-screen flex-col">{children}</div>
      </div>
      <AdminCommandPalette clinicSlug={slug} userRole={user.role} />
    </div>
  );
}
