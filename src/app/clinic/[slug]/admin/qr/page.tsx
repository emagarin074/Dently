import { requireAuth } from "@/lib/auth";
import { QrPageClient } from "@/components/admin/qr-client";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function QrPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = (await searchParams) || {};
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/clinic/${slug}#booking`;
  const registrationUrl = `${appUrl}/clinic/${slug}/register`;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clinic QR Codes</h1>
        <p className="text-muted-foreground mt-1">
          Generate, download, or print QR codes for patient intake
          questionnaires and public website booking.
        </p>
      </div>
      <QrPageClient
        publicUrl={publicUrl}
        registrationUrl={registrationUrl}
        clinicSlug={slug}
        initialTab={tab === "booking" ? "booking" : "intake"}
      />
    </div>
  );
}
