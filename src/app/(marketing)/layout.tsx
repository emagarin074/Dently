import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { getSession } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/super-admin";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user || null;
  const isSuperAdmin = isSuperAdminEmail(user?.email);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar user={user} isSuperAdmin={isSuperAdmin} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
