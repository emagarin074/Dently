import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // Create Luna Dental Care as first tenant
  const slug = "luna-dental-care"

  const existingClinic = await prisma.clinic.findUnique({ where: { slug } })
  if (existingClinic) {
    console.log("✅ Luna Dental Care already exists, skipping seed.")
    return
  }

  const passwordHash = await bcrypt.hash("admin123456", 12)

  const clinic = await prisma.clinic.create({
    data: {
      name: "Luna Dental Care",
      slug,
      address: "123 Dental Street, Makati City, Metro Manila",
      phone: "+63 2 8888-8888",
      email: "info@lunadental.com",
      description: "Modern dental care with a gentle touch. We provide comprehensive dental services for the whole family.",
      isActive: true,
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
            name: "Dr. Maria Santos",
            email: "maria@lunadental.com",
            passwordHash,
            role: "DENTIST_ADMIN",
            licenseNumber: "PRC-12345",
            specialization: "General Dentistry & Orthodontics",
            isActive: true,
          },
          {
            name: "Ana Reyes",
            email: "ana@lunadental.com",
            passwordHash,
            role: "ASSISTANT",
            isActive: true,
          },
        ],
      },
      procedures: {
        create: [
          {
            name: "Oral Prophylaxis (Cleaning)",
            description: "Professional dental cleaning to remove plaque and tartar.",
            category: "Preventive",
            priceType: "FIXED",
            price: 800,
            isActive: true,
            hasRemarks: true,
          },
          {
            name: "Tooth Extraction (Simple)",
            description: "Removal of a tooth that has been damaged or decayed.",
            category: "Oral Surgery",
            priceType: "FIXED",
            price: 500,
            isActive: true,
            hasOdontogram: true,
            hasToothSurface: false,
            hasRemarks: true,
            autoConsentForm: true,
            requireSignedConsent: true,
          },
          {
            name: "Tooth-Colored Filling (Composite)",
            description: "Direct dental restoration using tooth-colored composite resin.",
            category: "Restorative",
            priceType: "RANGE",
            priceMin: 800,
            priceMax: 2000,
            isActive: true,
            hasOdontogram: true,
            hasToothSurface: true,
            hasMaterial: true,
            hasShade: true,
            hasRemarks: true,
            autoConsentForm: false,
          },
          {
            name: "Braces (Full)",
            description: "Orthodontic treatment for teeth alignment.",
            category: "Orthodontics",
            priceType: "RANGE",
            priceMin: 35000,
            priceMax: 80000,
            isActive: true,
            hasOdontogram: true,
            hasUpperLower: true,
            hasMaterial: true,
            hasQuantity: false,
            hasRemarks: true,
            autoConsentForm: true,
            requireSignedConsent: true,
            hasPhotoUpload: true,
            hasXrayUpload: true,
          },
          {
            name: "Root Canal Treatment",
            description: "Endodontic treatment to save an infected or damaged tooth.",
            category: "Endodontics",
            priceType: "RANGE",
            priceMin: 5000,
            priceMax: 12000,
            isActive: true,
            hasOdontogram: true,
            hasSeverity: true,
            hasRemarks: true,
            autoConsentForm: true,
            autoPrescription: true,
            requireSignedConsent: true,
            hasXrayUpload: true,
          },
          {
            name: "Dental Crown (PFM)",
            description: "Porcelain-fused-to-metal crown for damaged teeth.",
            category: "Restorative",
            priceType: "FIXED",
            price: 8000,
            isActive: true,
            hasOdontogram: true,
            hasShade: true,
            hasMaterial: true,
            hasRemarks: true,
            autoConsentForm: true,
            requireSignedConsent: true,
            hasLabRequest: true,
            requireLabDocs: true,
          },
          {
            name: "Teeth Whitening",
            description: "Professional in-office teeth whitening treatment.",
            category: "Cosmetic",
            priceType: "FIXED",
            price: 5000,
            isActive: true,
            hasShade: true,
            hasPhotoUpload: true,
            hasRemarks: true,
          },
          {
            name: "Denture (Complete)",
            description: "Full removable dental prosthesis.",
            category: "Prosthodontics",
            priceType: "RANGE",
            priceMin: 12000,
            priceMax: 25000,
            isActive: true,
            hasUpperLower: true,
            hasMaterial: true,
            hasRemarks: true,
            autoConsentForm: true,
            hasLabRequest: true,
          },
        ],
      },
    },
  })

  console.log(`✅ Created clinic: ${clinic.name} (/${clinic.slug})`)
  console.log(`📧 Admin login: maria@lunadental.com / admin123456`)
  console.log(`📧 Assistant login: ana@lunadental.com / admin123456`)
  console.log(`🌐 Public URL: /clinic/luna-dental-care`)
  console.log(`🔧 Admin URL: /clinic/luna-dental-care/admin`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
