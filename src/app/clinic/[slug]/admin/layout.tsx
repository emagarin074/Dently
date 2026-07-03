import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/sidebar"

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function AdminLayout({ children, params }: Props) {
  const { slug } = await params
  const user = await requireAuth(slug)

  if (!user) redirect(`/clinic/${slug}/login`)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        clinicSlug={slug}
        clinicName={user.clinic.name}
        userRole={user.role}
        userName={user.name}
      />
      <div className="flex-1 lg:pl-64">
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
