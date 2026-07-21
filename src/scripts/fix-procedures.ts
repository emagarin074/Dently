import { prisma } from "../lib/prisma";

async function main() {
  await prisma.procedure.updateMany({
    where: {
      name: {
        contains: "Braces",
      },
    },
    data: {
      isInstallmentAvailable: true,
    },
  });
  console.log("Updated Braces procedures to be installment available");
}
main().catch(console.error);
