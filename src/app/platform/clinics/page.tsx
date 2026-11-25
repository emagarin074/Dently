import { requireSuperAdmin } from "@/lib/super-admin";
import { getPlatformClinics } from "@/app/actions/platform";
import { redirect } from "next/navigation";
import { ClinicsClient } from "@/components/platform/clinics-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinics Directory | Dently Platform Admin",
};

export default async function PlatformClinicsPage() {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login?redirect=/platform/clinics");
  }

  const initialData = await getPlatformClinics({
    search: "",
    plan: "ALL",
    status: "ALL",
    page: 1,
    limit: 10,
  });

  return (
    <ClinicsClient
      initialData={JSON.parse(JSON.stringify(initialData))}
      currentUser={{
        id: user.id,
        name: user.name,
        email: user.email,
      }}
    />
  );
}
