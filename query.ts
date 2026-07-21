import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: "verano-dental-hub" },
    include: { websitePage: true },
  });
  console.log(JSON.stringify(clinic?.websitePage?.sections, null, 2));
}
main().finally(() => prisma.$disconnect());
