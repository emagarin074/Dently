import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { buildDefaultProcedureData } from "../src/lib/default-procedures";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const clinics = await prisma.clinic.findMany({
    include: { users: { select: { id: true } } },
  });

  for (const clinic of clinics) {
    let branch = await prisma.branch.findFirst({
      where: { clinicId: clinic.id, isPrimary: true },
    });

    if (!branch) {
      branch = await prisma.branch.findFirst({
        where: { clinicId: clinic.id },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          clinicId: clinic.id,
          name: "Main Branch",
          slug: "main",
          address: clinic.address,
          phone: clinic.phone,
          email: clinic.email,
          isPrimary: true,
        },
      });
    } else if (!branch.isPrimary) {
      branch = await prisma.branch.update({
        where: { id: branch.id },
        data: { isPrimary: true },
      });
    }

    await prisma.userBranchAssignment.createMany({
      data: clinic.users.map((user) => ({
        clinicId: clinic.id,
        branchId: branch.id,
        userId: user.id,
        isPrimary: true,
      })),
      skipDuplicates: true,
    });

    await prisma.appointment.updateMany({
      where: { clinicId: clinic.id, branchId: null },
      data: { branchId: branch.id },
    });

    await prisma.queueEntry.updateMany({
      where: { clinicId: clinic.id, branchId: null },
      data: { branchId: branch.id },
    });

    const procedureCount = await prisma.procedure.count({
      where: { clinicId: clinic.id },
    });
    if (procedureCount === 0) {
      await prisma.procedure.createMany({
        data: buildDefaultProcedureData(clinic.id),
      });
    }

    console.log(`Ensured default branch for ${clinic.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
