import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function QueuePage({ params }: Props) {
  const { slug } = await params
  redirect(`/clinic/${slug}/admin/bookings?tab=queue`)
}
