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
  | "custom";

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
};

// ─── Default Global Styles ───────────────────────────────────────────────────

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  primaryColor: "#0891b2",
  secondaryColor: "#064e3b",
  fontFamily: "inter",
  borderRadius: "md",
  buttonStyle: "solid",
};
