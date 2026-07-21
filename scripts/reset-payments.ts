import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [payments, installmentPayments, installmentPlans, billings] =
    await Promise.all([
      prisma.payment.count(),
      prisma.installmentPayment.count(),
      prisma.installmentPlan.count(),
      prisma.billing.count(),
    ]);

  console.log("Records found:");
  console.log(`  Payment:            ${payments}`);
  console.log(`  InstallmentPayment: ${installmentPayments}`);
  console.log(`  InstallmentPlan:    ${installmentPlans}`);
  console.log(`  Billing (will reset paidAmount/status): ${billings}`);
  console.log("");

  await prisma.$transaction([
    // Delete in order: child records first
    prisma.installmentPayment.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.installmentPlan.deleteMany(),
    // Reset all billing records back to UNPAID with zero paid
    prisma.billing.updateMany({
      data: { paidAmount: 0, status: "UNPAID" },
    }),
  ]);

  console.log("✓ All payment records and installment plans deleted.");
  console.log("✓ All billing records reset to UNPAID with ₱0 paid.");
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
