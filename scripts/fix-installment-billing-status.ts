import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = await prisma.installmentPlan.findMany({
    where: { billingId: { not: null } },
    include: { billing: true },
  });

  console.log(
    `Found ${plans.length} installment-linked billing record(s) to check.`,
  );
  let updated = 0;

  for (const plan of plans) {
    if (!plan.billing) continue;
    const billing = plan.billing;
    const paidAmount = Number(billing.paidAmount);
    const correctStatus = paidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID";

    if (billing.status !== correctStatus) {
      await prisma.billing.update({
        where: { id: billing.id },
        data: { status: correctStatus },
      });
      console.log(
        `  ✓ Billing ${billing.id}: ${billing.status} → ${correctStatus} (paid: ₱${paidAmount.toLocaleString()})`,
      );
      updated++;
    } else {
      console.log(
        `  — Billing ${billing.id}: already ${billing.status}, skipped.`,
      );
    }
  }

  console.log(`\nDone. ${updated} billing record(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
