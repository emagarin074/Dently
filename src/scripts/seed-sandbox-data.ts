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

import bcrypt from "bcryptjs";
import { PriceType, AppointmentStatus, QueueStatus } from "@prisma/client";

async function seedSandboxData() {
  const { prisma } = await import("../lib/prisma");

  try {
    console.log("🌱 Starting sandbox data seeding for Dently...");

    // 1. Get or create Verano Dental Clinic
    let clinic = await prisma.clinic.findUnique({
      where: { slug: "verano-dental-hub" },
      include: { users: true, settings: true },
    });

    const passwordHash = await bcrypt.hash("admin123456", 12);

    if (!clinic) {
      clinic = await prisma.clinic.create({
        data: {
          name: "Verano Dental Clinic",
          slug: "verano-dental-hub",
          address: "123 Health Ave, Suite 405, Makati City",
          phone: "+63 917 123 4567",
          email: "subscribed@lunadental.com",
          description: "Premium SaaS Dental Practice with full sandbox data.",
          isActive: true,
          plan: "Clinic",
          settings: {
            create: {
              brandColor: "#0891b2",
              appointmentLeadDays: 30,
              autoConfirmBookings: false,
            },
          },
        },
        include: { users: true, settings: true },
      });
    }

    // Ensure Dentist Admin & Staff exist
    let adminUser = clinic.users.find((u) => u.role === "DENTIST_ADMIN");
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          clinicId: clinic.id,
          name: "Dr. Jurbert Verano",
          firstName: "Jurbert",
          lastName: "Verano",
          email: "subscribed@lunadental.com",
          passwordHash,
          role: "DENTIST_ADMIN",
          licenseNumber: "PRC-998877",
          specialization: "Orthodontics & Implantology",
          isActive: true,
        },
      });
    }

    let assistantUser = clinic.users.find((u) => u.role === "ASSISTANT");
    if (!assistantUser) {
      assistantUser = await prisma.user.create({
        data: {
          clinicId: clinic.id,
          name: "Carla Mendoza",
          firstName: "Carla",
          lastName: "Mendoza",
          email: "carla@veranodental.com",
          passwordHash,
          role: "ASSISTANT",
          isActive: true,
        },
      });
    }

    console.log("✅ Clinic and Staff users ready!");

    // 2. Procedures
    const procedureData = [
      {
        name: "Oral Prophylaxis (Cleaning)",
        description: "Professional scaling and polishing.",
        category: "Preventive",
        priceType: "FIXED",
        price: 1200,
        isActive: true,
      },
      {
        name: "Tooth Extraction (Simple)",
        description: "Standard tooth removal under local anesthesia.",
        category: "Oral Surgery",
        priceType: "FIXED",
        price: 1800,
        isActive: true,
      },
      {
        name: "Composite Tooth Filling",
        description: "Tooth-colored resin filling for cavities.",
        category: "Restorative",
        priceType: "RANGE",
        priceMin: 1500,
        priceMax: 3000,
        price: 1500,
        isActive: true,
      },
      {
        name: "Root Canal Therapy",
        description: "Endodontic nerve treatment and root canal sealing.",
        category: "Endodontics",
        priceType: "FIXED",
        price: 9000,
        isInstallmentAvailable: true,
        isActive: true,
      },
      {
        name: "Porcelain Dental Crown",
        description: "Full coverage crown restoration.",
        category: "Prosthodontics",
        priceType: "FIXED",
        price: 14000,
        isInstallmentAvailable: true,
        isActive: true,
      },
      {
        name: "Orthodontic Braces (Comprehensive)",
        description: "Metal/Ceramic braces alignment treatment.",
        category: "Orthodontics",
        priceType: "FIXED",
        price: 45000,
        isInstallmentAvailable: true,
        isActive: true,
      },
      {
        name: "Teeth Whitening (Laser)",
        description: "In-office cosmetic dental bleaching.",
        category: "Cosmetic",
        priceType: "FIXED",
        price: 7000,
        isActive: true,
      },
    ];

    for (const proc of procedureData) {
      const existing = await prisma.procedure.findFirst({
        where: { clinicId: clinic.id, name: proc.name },
      });
      if (!existing) {
        await prisma.procedure.create({
          data: {
            ...proc,
            priceType: proc.priceType as PriceType,
            clinicId: clinic.id,
          },
        });
      }
    }

    const dbProcedures = await prisma.procedure.findMany({
      where: { clinicId: clinic.id },
    });
    console.log(`✅ ${dbProcedures.length} Procedures ready!`);

    // 3. Patients
    const patientData = [
      {
        firstName: "Juan",
        lastName: "Dela Cruz",
        email: "juan.delacruz@example.com",
        phone: "+63 918 111 2233",
        dateOfBirth: new Date("1992-05-15"),
        gender: "MALE" as const,
        address: "742 Evergreen Terrace, Quezon City",
      },
      {
        firstName: "Maria Clara",
        lastName: "Santos",
        email: "maria.clara@example.com",
        phone: "+63 919 222 3344",
        dateOfBirth: new Date("1995-11-20"),
        gender: "FEMALE" as const,
        address: "12 Palm Avenue, BGC Taguig",
      },
      {
        firstName: "Jose",
        lastName: "Rizal Jr.",
        email: "jose.rizal@example.com",
        phone: "+63 920 333 4455",
        dateOfBirth: new Date("1988-06-19"),
        gender: "MALE" as const,
        address: "88 Rizal Street, Calamba Laguna",
      },
      {
        firstName: "Gabriela",
        lastName: "Silang",
        email: "gabriela.silang@example.com",
        phone: "+63 921 444 5566",
        dateOfBirth: new Date("1990-03-10"),
        gender: "FEMALE" as const,
        address: "45 Freedom Highway, Vigan City",
      },
      {
        firstName: "Andres",
        lastName: "Bonifacio",
        email: "andres.bonifacio@example.com",
        phone: "+63 922 555 6677",
        dateOfBirth: new Date("1994-11-30"),
        gender: "MALE" as const,
        address: "10 Tondo Street, Manila",
      },
    ];

    const dbPatients = [];
    for (const pat of patientData) {
      let p = await prisma.patient.findFirst({
        where: { clinicId: clinic.id, email: pat.email },
      });
      if (!p) {
        p = await prisma.patient.create({
          data: { ...pat, clinicId: clinic.id },
        });
      }
      dbPatients.push(p);
    }
    console.log(`✅ ${dbPatients.length} Sandbox Patients ready!`);

    // 4. Appointments & Queue Entries
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const apptConfigs = [
      {
        patient: dbPatients[0],
        date: todayStr,
        time: "09:00",
        serviceType: "Oral Prophylaxis (Cleaning)",
        status: "CHECKED_IN",
        createQueue: true,
        queueStatus: "IN_TREATMENT",
      },
      {
        patient: dbPatients[1],
        date: todayStr,
        time: "10:30",
        serviceType: "Root Canal Therapy",
        status: "CHECKED_IN",
        createQueue: true,
        queueStatus: "WAITING",
      },
      {
        patient: dbPatients[2],
        date: todayStr,
        time: "14:00",
        serviceType: "Composite Tooth Filling",
        status: "CONFIRMED",
        createQueue: false,
      },
      {
        patient: dbPatients[3],
        date: todayStr,
        time: "15:30",
        serviceType: "Teeth Whitening (Laser)",
        status: "PENDING",
        createQueue: false,
      },
    ];

    let queueCounter = 1;

    for (const cfg of apptConfigs) {
      const appt = await prisma.appointment.create({
        data: {
          clinicId: clinic.id,
          patientId: cfg.patient.id,
          dentistId: adminUser.id,
          bookingName: `${cfg.patient.firstName} ${cfg.patient.lastName}`,
          bookingEmail: cfg.patient.email,
          bookingPhone: cfg.patient.phone,
          serviceType: cfg.serviceType,
          preferredDate: new Date(cfg.date),
          scheduledTime: cfg.time,
          status: cfg.status as AppointmentStatus,
          notes: "Sandbox test appointment",
        },
      });

      if (cfg.createQueue) {
        await prisma.queueEntry.create({
          data: {
            clinicId: clinic.id,
            appointmentId: appt.id,
            patientName: `${cfg.patient.firstName} ${cfg.patient.lastName}`,
            queueNumber: queueCounter++,
            status: cfg.queueStatus as QueueStatus,
            date: new Date(cfg.date),
          },
        });
      }
    }
    console.log(`✅ Sandbox Appointments and Queue entries ready!`);

    // 5. Billing & Installment Schedule Test Data
    const rootCanalProc =
      dbProcedures.find((p) => p.name.includes("Root Canal")) ||
      dbProcedures[0];

    const installmentPlan = await prisma.installmentPlan.create({
      data: {
        clinicId: clinic.id,
        patientId: dbPatients[1].id,
        totalAmount: 9000,
        paidAmount: 3000,
        status: "ACTIVE",
        notes: `Installment plan for ${rootCanalProc.name}`,
        scheduleItems: {
          create: [
            {
              installmentNumber: 1,
              dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue by 5 days
              amount: 3000,
              status: "PENDING",
              reminderSent: false,
            },
            {
              installmentNumber: 2,
              dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Due in 25 days
              amount: 3000,
              status: "PENDING",
              reminderSent: false,
            },
          ],
        },
      },
      include: { scheduleItems: true },
    });

    console.log(
      `✅ Installment Plan & Due Date Schedule ready! (ID: ${installmentPlan.id})`,
    );

    // 6. Compensation Program
    const existingProg = await prisma.compensationProgram.findFirst({
      where: { clinicId: clinic.id, name: "General Dentist Standard Program" },
    });

    if (!existingProg) {
      await prisma.compensationProgram.create({
        data: {
          clinicId: clinic.id,
          name: "General Dentist Standard Program",
          description:
            "Base 40% split with 50% Root Canal override and lab fee deduction.",
          version: 1,
          status: "PUBLISHED",
          isLatest: true,
          effectiveDate: new Date(),
          updatedBy: adminUser.name,
          rules: {
            create: [
              {
                ruleType: "COLLECTION_RULE",
                priority: 0,
                enabled: true,
                behavior: "BLOCK",
                config: { payableWhen: "Fully Paid" },
              },
              {
                ruleType: "REVENUE_SPLIT",
                priority: 1,
                enabled: true,
                behavior: "REPLACE",
                config: { percentage: 40, calculationBase: "Gross Fee" },
              },
              {
                ruleType: "PROCEDURE_OVERRIDE",
                priority: 2,
                enabled: true,
                behavior: "REPLACE",
                config: { procedure: "Root Canal Therapy", percentage: 50 },
              },
              {
                ruleType: "LAB_FEE_RULE",
                priority: 3,
                enabled: true,
                behavior: "MODIFY",
                config: { deductionTiming: "Deduct Before Commission" },
              },
            ],
          },
        },
      });
      console.log("✅ Published Compensation Program ready!");
    }

    console.log(
      "\n============================================================",
    );
    console.log("🎉 SANDBOX DATA SEEDING COMPLETE!");
    console.log("============================================================");
    console.log(
      `Clinic URL:      http://localhost:3000/clinic/${clinic.slug}/admin`,
    );
    console.log(`Admin Account:   ${adminUser.email}`);
    console.log(`Password:        admin123456`);
    console.log(`Patients:        ${dbPatients.length} Patients created`);
    console.log(
      `Procedures:      ${dbProcedures.length} Procedures configured`,
    );
    console.log(`Installments:    1 Active Plan with Overdue & Upcoming Items`);
    console.log(
      "============================================================\n",
    );
  } catch (error) {
    console.error("Error seeding sandbox data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSandboxData();
