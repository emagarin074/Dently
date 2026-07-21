import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { getSession } from "@/lib/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user || null;

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar user={user} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
