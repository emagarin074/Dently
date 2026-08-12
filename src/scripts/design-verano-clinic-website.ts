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

async function designVeranoClinicWebsite() {
  const { prisma } = await import("../lib/prisma");

  try {
    console.log("🎨 Designing website for Verano Dental Clinic...");

    const clinic = await prisma.clinic.findUnique({
      where: { slug: "verano-dental-hub" },
    });

    if (!clinic) {
      console.error("❌ Verano Dental Clinic not found!");
      return;
    }

    const modernSectionContent = {
      navLinks: [
        { label: "Services", sectionId: "services" },
        { label: "About Us", sectionId: "about" },
        { label: "FAQs", sectionId: "faqs" },
        { label: "Book Appointment", sectionId: "booking" },
      ],
      logoType: "text",
      logoIcon: "Sparkles",
      logoText: "Verano Dental Hub",
      logoFont: "font-bold",

      // Hero Section
      heroBadgeIcon: "plane",
      heroBadgeText: "Excellence in Dentistry",
      heroBadgeSub: "Gentle • Modern • Comprehensive",
      heroHeadingMain: "Elevate your",
      heroHeadingHighlight: "smile & confidence.",
      heroSubheading:
        "Experience state-of-the-art dental procedures in a relaxing, spa-like environment.\nOur expert team provides gentle care tailored to your unique smile.",
      heroCtaText: "Book Appointment Now",
      heroCtaSection: "booking",
      heroTrustCount: "4.9★",
      heroTrustText: "1,200+ Happy Patients Transformed",
      heroImage:
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80",

      // Services Section
      servicesHeading: "Specialized Dental Treatments",
      servicesSubheading:
        "High-precision procedures performed by dedicated dental specialists.",
      servicesItems: [
        {
          title: "Root Canal Therapy",
          description:
            "Pain-free endodontic nerve treatment using rotary technology.",
          icon: "Stethoscope",
        },
        {
          title: "Orthodontic Braces",
          description: "Comprehensive teeth alignment for teens and adults.",
          icon: "Teeth",
        },
        {
          title: "Laser Teeth Whitening",
          description:
            "Brighten your smile up to 8 shades lighter in just 45 minutes.",
          icon: "Sparkles",
        },
        {
          title: "Porcelain Dental Crowns",
          description:
            "Custom-crafted, natural-looking porcelain tooth restorations.",
          icon: "Shield",
        },
        {
          title: "Oral Prophylaxis",
          description:
            "Gentle ultrasonic scaling and tooth polishing for healthy gums.",
          icon: "Tooth",
        },
        {
          title: "Composite Fillings",
          description:
            "Tooth-colored resin fillings for seamless, invisible cavity repair.",
          icon: "Smile",
        },
      ],

      // About Section
      aboutHeading: "Why Choose Verano Dental Clinic",
      aboutContent:
        "At Verano Dental Clinic, we combine compassionate patient care with cutting-edge dental technology. Led by Dr. Jurbert Verano, our team is dedicated to providing painless treatments, flexible installment plans, and transparent pricing in a warm, welcoming environment.\n\nWhether you need routine preventive care or a full cosmetic smile makeover, we are committed to giving you the healthiest, most radiant smile possible.",
      aboutImage:
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80",

      // FAQs Section
      faqHeading: "Frequently Asked Questions",
      faqItems: [
        {
          q: "Do you offer installment plans for major procedures?",
          a: "Yes! We offer flexible monthly installment options for root canal treatments, braces, and dental crowns without hidden fees.",
        },
        {
          q: "How can I book an appointment?",
          a: "You can select your preferred procedure and date using our online booking tool right on this page, or contact us directly via phone.",
        },
        {
          q: "What safety standards do you follow?",
          a: "We adhere to strict hospital-grade sterilization protocols, using single-use items and autoclaved instruments for every patient.",
        },
        {
          q: "Are walk-in patients accepted?",
          a: "We welcome walk-ins! However, we recommend booking an appointment online to guarantee minimal waiting time.",
        },
      ],

      // Contact & Social
      contactPhones: ["+63 917 123 4567", "+63 2 8888-9999"],
      socialLinks: [
        {
          platform: "Facebook",
          url: "https://facebook.com/veranodental",
          label: "Facebook",
        },
        {
          platform: "Instagram",
          url: "https://instagram.com/veranodental",
          label: "Instagram",
        },
        {
          platform: "LinkedIn",
          url: "https://linkedin.com/company/veranodental",
          label: "LinkedIn",
        },
      ],
    };

    const sections = [
      {
        id: "modern-data-1",
        type: "modern_data",
        enabled: true,
        order: 0,
        layout: "default",
        content: modernSectionContent,
        style: {},
      },
    ];

    const globalStyles = {
      primaryColor: "#0891b2",
      secondaryColor: "#0e7490",
      fontFamily: "inter",
      borderRadius: "md",
      buttonStyle: "solid",
    };

    const websitePage = await prisma.websitePage.upsert({
      where: { clinicId: clinic.id },
      create: {
        clinicId: clinic.id,
        templateId: "modern",
        sections,
        globalStyles,
        isPublished: true,
      },
      update: {
        templateId: "modern",
        sections,
        globalStyles,
        isPublished: true,
      },
    });

    console.log(
      "✨ Modern website design successfully deployed for Verano Dental Clinic!",
    );
    console.log(
      `🌐 Live Website URL: http://localhost:3000/clinic/verano-dental-hub`,
    );
    console.log(
      `🛠️ Builder Editor:  http://localhost:3000/clinic/verano-dental-hub/admin/settings?tab=website`,
    );
  } catch (error) {
    console.error("Error setting up website design:", error);
  } finally {
    await prisma.$disconnect();
  }
}

designVeranoClinicWebsite();
