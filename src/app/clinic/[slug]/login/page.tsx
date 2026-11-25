import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ClinicLoginRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/login?clinic=${slug}`);
}
