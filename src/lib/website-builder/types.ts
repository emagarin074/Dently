// ─── Section Types ───────────────────────────────────────────────────────────

export type SectionType =
  | "hero"
  | "services"
  | "team"
  | "booking"
  | "about"
  | "testimonials"
  | "gallery"
  | "faq"
  | "contact"
  | "cta"
  | "custom"
  | "modern_data";

export type LayoutVariant =
  "default" | "centered" | "split" | "grid" | "list" | "cards" | "minimal";

export interface SectionBlock {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  layout: LayoutVariant;
  content: Record<string, unknown>;
  style: SectionStyle;
}

export interface SectionStyle {
  backgroundColor?: string;
  textColor?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: "inter" | "poppins" | "playfair" | "roboto" | "system";
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  buttonStyle: "solid" | "outline" | "ghost";
}

export interface WebsitePageData {
  templateId: string;
  sections: SectionBlock[];
  globalStyles: GlobalStyles;
  isPublished: boolean;
}

// ─── Default Section Content ─────────────────────────────────────────────────

export const DEFAULT_SECTION_CONTENT: Record<
  SectionType,
  Record<string, unknown>
> = {
  hero: {
    heading: "",
    subheading: "",
    showAddress: true,
    showPhone: true,
    showEmail: true,
    backgroundImage: "",
    ctaText: "Book an Appointment",
    ctaLink: "#booking",
  },
  services: {
    heading: "Our Services",
    subheading: "Quality dental care for the whole family",
    showPrices: true,
    showDescriptions: true,
  },
  team: {
    heading: "Meet Our Team",
    subheading: "Experienced professionals dedicated to your dental health",
    showSpecialization: true,
  },
  booking: {
    heading: "Book an Appointment",
    subheading: "Schedule your visit today",
    showDentistPreference: true,
    showConcernField: true,
  },
  about: {
    heading: "About Us",
    content: "",
    image: "",
  },
  testimonials: {
    heading: "What Our Patients Say",
    items: [],
  },
  gallery: {
    heading: "Our Clinic",
    images: [],
  },
  faq: {
    heading: "Frequently Asked Questions",
    items: [],
  },
  contact: {
    heading: "Contact Us",
    showMap: false,
    showForm: true,
    mapEmbedUrl: "",
  },
  cta: {
    heading: "Ready to Transform Your Smile?",
    subheading: "Book your appointment today and take the first step.",
    buttonText: "Book Now",
    buttonLink: "#booking",
  },
  custom: {
    heading: "",
    content: "",
  },
  modern_data: {
    // Navigation & Logo
    logoType: "text", // "text" or "image"
    logoImage: "",
    logoText: "",
    logoFont: "font-sans",
    logoIcon: "Smile",
    navLinks: [
      { label: "Services", sectionId: "services" },
      { label: "About Us", sectionId: "about" },
      { label: "FAQs", sectionId: "faqs" },
      { label: "Contact Us", sectionId: "contact" },
    ],
    heroBadgeIcon: "plane",
    heroBadgeText: "True 24/7",
    heroBadgeSub: "Care When It Counts",
    heroHeadingMain: "A calmer",
    heroHeadingHighlight: "dental\nvisit starts here.",
    heroSubheading:
      "Modern dentistry designed around your comfort.\nFrom routine checkups to advanced care, we make dental visits simple, clear, and stress-free.",
    heroCtaText: "Book an Appointment",
    heroTrustCount: "1,000+",
    heroTrustText: "Happy Patients",
    heroPills: [],
    heroImage:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80",

    // Services Section
    servicesHeading: "Our Services",
    servicesSubheading: "Comprehensive dental care tailored to your needs.",
    servicesItems: [
      {
        title: "General Dentistry",
        description:
          "Routine checkups, cleanings, and preventive care to keep your smile healthy.",
        icon: "Tooth",
      },
      {
        title: "Cosmetic Dentistry",
        description:
          "Teeth whitening, veneers, and smile makeovers for a radiant appearance.",
        icon: "Sparkles",
      },
      {
        title: "Orthodontics",
        description:
          "Clear aligners and braces to straighten your teeth perfectly.",
        icon: "AlignCenter",
      },
    ],

    // About Us Section
    aboutHeading: "About Us",
    aboutContent:
      "We believe that a healthy smile is the foundation of overall wellness. Our clinic was founded on the principle that dental care should be accessible, comfortable, and tailored to each individual patient. With state-of-the-art technology and a team of dedicated professionals, we strive to make every visit a positive experience.",
    aboutImage:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80",

    // FAQs Section
    faqHeading: "Frequently Asked Questions",
    faqItems: [
      {
        q: "What should I expect during my first visit?",
        a: "Your first visit will include a comprehensive oral examination, x-rays if necessary, and a consultation with our dentist to discuss your oral health goals.",
      },
      {
        q: "Do you accept insurance?",
        a: "Yes, we accept most major dental insurance plans. Please contact our office to verify your coverage.",
      },
      {
        q: "How often should I get a dental checkup?",
        a: "We recommend a routine checkup and cleaning every six months to maintain optimal oral health.",
      },
    ],

    // Booking Section
    bookingHeading: "Ready to Smile?",
    bookingSubheading: "Book your appointment online today.",

    // Contact Us Section
    contactHeading: "Get in Touch",
    contactSubheading: "We're here to answer any questions you have.",
    contactPhones: [],
    socialLinks: [
      { platform: "Facebook", url: "https://facebook.com", label: "Facebook" },
      {
        platform: "Instagram",
        url: "https://instagram.com",
        label: "Instagram",
      },
    ],

    // Footer Section
    footerText: "© 2024 Modern Dental Clinic. All rights reserved.",
  },
};

// ─── Default Global Styles ───────────────────────────────────────────────────

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  primaryColor: "#0891b2",
  secondaryColor: "#064e3b",
  fontFamily: "inter",
  borderRadius: "md",
  buttonStyle: "solid",
};
