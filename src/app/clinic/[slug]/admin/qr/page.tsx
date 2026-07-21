import { requireAuth } from "@/lib/auth"
import { QrPageClient } from "@/components/admin/qr-client"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function QrPage({ params }: Props) {
  const { slug } = await params
  await requireAuth(slug)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const registrationUrl = `${appUrl}/clinic/${slug}/register`

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Patient Registration QR Code</h1>
        <p className="text-muted-foreground mt-1">
          Display or print this QR code at your clinic. Patients scan it to register and fill out their health questionnaire.
        </p>
      </div>
      <QrPageClient registrationUrl={registrationUrl} clinicSlug={slug} />
    </div>
  )
}
