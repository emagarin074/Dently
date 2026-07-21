import { prisma } from "../lib/prisma";

async function main() {
  const procedures = await prisma.procedure.findMany();
  console.log(
    procedures.map((p) => ({
      name: p.name,
      isInstallmentAvailable: p.isInstallmentAvailable,
    })),
  );
}
main().catch(console.error);
