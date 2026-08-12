import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

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

async function restoreSubscribedAccount() {
  const { prisma } = await import("../lib/prisma");
  try {
    const slug = "verano-dental-hub";
    const email = "subscribed@lunadental.com";

    console.log("🔍 Checking for existing subscribed account...");

    let clinic = await prisma.clinic.findUnique({
      where: { slug },
      include: { users: true },
    });

    if (clinic) {
      console.log(
        `✅ Subscribed clinic "${clinic.name}" (${clinic.slug}) exists!`,
      );
      console.log(
        `   Plan: ${clinic.plan} | Status: ${clinic.isActive ? "ACTIVE" : "INACTIVE"}`,
      );
      clinic.users.forEach((u) =>
        console.log(`   User: ${u.name} <${u.email}> (${u.role})`),
      );
      return;
    }

    console.log(
      `🌱 Restoring subscribed clinic "${slug}" with owner "${email}"...`,
    );
    const passwordHash = await bcrypt.hash("admin123456", 12);

    clinic = await prisma.clinic.create({
      data: {
        name: "Verano Dental Clinic",
        slug,
        address: "Verano Dental Hub, Metro Manila",
        phone: "+63 917 123 4567",
        email,
        description: "Subscribed clinic practice management account.",
        isActive: true,
        plan: "Clinic",
        settings: {
          create: {
            brandColor: "#0891b2",
            appointmentLeadDays: 30,
            autoConfirmBookings: false,
          },
        },
        users: {
          create: [
            {
              name: "Jurbert Magtibay Verano",
              email,
              passwordHash,
              role: "DENTIST_ADMIN",
              licenseNumber: "PRC-998877",
              specialization: "General Dentistry & Implantology",
              isActive: true,
            },
          ],
        },
        procedures: {
          create: [
            {
              name: "Oral Prophylaxis (Cleaning)",
              description: "Professional dental cleaning.",
              category: "Preventive",
              priceType: "FIXED",
              price: 1000,
              isActive: true,
            },
            {
              name: "Root Canal Treatment",
              description: "Endodontic therapy for infected tooth.",
              category: "Endodontics",
              priceType: "FIXED",
              price: 8000,
              isActive: true,
              isInstallmentAvailable: true,
            },
          ],
        },
      },
      include: { users: true },
    });

    console.log("🎉 Subscribed account successfully restored!");
    console.log(`   Clinic: ${clinic.name} (${clinic.slug})`);
    console.log(`   Owner: ${clinic.users[0].name} <${clinic.users[0].email}>`);
    console.log(`   Default Password: admin123456`);
  } catch (error) {
    console.error("Error restoring subscribed account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreSubscribedAccount();
