import fs from "fs";
import path from "path";

// Load .env file for CLI script execution
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of envLines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"'))
        value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function monitorSubscriptions() {
  const { prisma } = await import("../lib/prisma");
  try {
    const clinics = await prisma.clinic.findMany({
      include: {
        users: {
          where: { role: "DENTIST_ADMIN" },
          select: { email: true, name: true },
        },
        _count: {
          select: {
            patients: true,
            appointments: true,
            procedures: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalClinics = clinics.length;
    const activeClinics = clinics.filter((c) => c.isActive).length;
    const inactiveClinics = totalClinics - activeClinics;

    const planCounts = clinics.reduce(
      (acc, c) => {
        const planName = c.plan || "Starter";
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log(
      "\n============================================================",
    );
    console.log("           DENTLY CLINIC SUBSCRIPTIONS MONITOR           ");
    console.log("============================================================");
    console.log(
      `Total Registered Clinics: ${totalClinics} | Active: ${activeClinics} | Inactive: ${inactiveClinics}`,
    );
    console.log(
      `Plan Distribution: ${Object.entries(planCounts)
        .map(([plan, count]) => `${plan}: ${count}`)
        .join(" | ")}`,
    );
    console.log(
      "============================================================\n",
    );

    if (clinics.length === 0) {
      console.log("No clinics registered yet.\n");
      return;
    }

    clinics.forEach((c, index) => {
      const owner = c.users[0];
      const ownerStr = owner
        ? `${owner.name} <${owner.email}>`
        : c.email || "No admin assigned";

      const joinedDate = new Date(c.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      console.log(`[${index + 1}] ${c.name}`);
      console.log(`    Slug/URL:     ${c.slug}`);
      console.log(`    Plan:         ${c.plan || "Starter"}`);
      console.log(
        `    Status:       ${c.isActive ? "🟢 ACTIVE" : "🔴 INACTIVE"}`,
      );
      console.log(`    Owner/Admin:  ${ownerStr}`);
      console.log(`    Joined:       ${joinedDate}`);
      console.log(
        `    Usage Stats:  ${c._count.patients} Patients | ${c._count.appointments} Appointments | ${c._count.procedures} Procedures`,
      );
      console.log(
        "------------------------------------------------------------",
      );
    });
  } catch (error) {
    console.error("Error monitoring subscriptions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

monitorSubscriptions();
