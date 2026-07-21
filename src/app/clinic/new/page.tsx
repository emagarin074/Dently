import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClinicNewClient from "./clinic-new-client";

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function ClinicNewPage({ searchParams }: Props) {
  const user = await requireAuth();
  if (!user) {
    redirect("/login");
  }

  // If the user already has a clinic, redirect to their clinic dashboard
  if (user.clinicId) {
    // If the clinic slug is not available directly, we fetch/use user.clinic
    if (user.clinic) {
      redirect(`/clinic/${user.clinic.slug}/admin`);
    }
  }

  const { plan } = await searchParams;
  const selectedPlan = plan || "Starter";

  return <ClinicNewClient name={user.name} plan={selectedPlan} />;
}
