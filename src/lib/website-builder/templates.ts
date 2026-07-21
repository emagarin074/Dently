import { SectionBlock, GlobalStyles, DEFAULT_SECTION_CONTENT } from "./types";

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji or icon identifier
  templateType?: "builder" | "rigid"; // 'builder' = modular sections, 'rigid' = fixed layout
  sections: SectionBlock[];
  globalStyles: GlobalStyles;
}

function createSection(
  id: string,
  type: SectionBlock["type"],
  order: number,
  overrides?: Partial<SectionBlock>,
): SectionBlock {
  return {
    id,
    type,
    enabled: true,
    order,
    layout: "default",
    content: { ...DEFAULT_SECTION_CONTENT[type] },
    style: { padding: "lg" },
    ...overrides,
  };
}

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "modern",
    name: "Modern (Template Mode)",
    description: "Clean, professional independent template layout.",
    preview: "✨",
    templateType: "rigid",
    globalStyles: {
      primaryColor: "#0891b2",
      secondaryColor: "#0e7490",
      fontFamily: "inter",
      borderRadius: "md",
      buttonStyle: "solid",
    },
    sections: [
      {
        id: "modern-data-1",
        type: "modern_data" as SectionBlock["type"],
        enabled: true,
        order: 0,
        layout: "default",
        content: {
          navLinks: [
            { label: "Services", sectionId: "services" },
            { label: "About Us", sectionId: "about" },
            { label: "Doctors", sectionId: "doctors" },
            { label: "Blogs", sectionId: "blogs" },
          ],
          heroBadgeIcon: "plane",
          heroBadgeText: "True 24/7",
          heroBadgeSub: "Care When It Counts",
          heroHeadingMain: "A calmer",
          heroHeadingHighlight: "dental\nvisit starts here.",
          heroSubheading:
            "Modern dentistry designed around your comfort.\nFrom routine checkups to advanced care, we make dental visits simple, clear, and stress-free.",
          heroCtaText: "Contact Us",
          heroDentistCount: "15+",
          heroDentistText: "Expert Dentists for you",
          heroPills: [
            { label: "Teeth Cleaning", checked: true },
            { label: "Whitening", checked: false },
            { label: "Lost Filling", checked: false },
          ],
        },
        style: {},
      },
    ],
  },
  {
    id: "classic",
    name: "Classic",
    description:
      "Traditional and trustworthy design focused on services and credentials",
    preview: "🏛️",
    globalStyles: {
      primaryColor: "#1e40af",
      secondaryColor: "#1e3a5f",
      fontFamily: "roboto",
      borderRadius: "sm",
      buttonStyle: "solid",
    },
    sections: [
      createSection("hero-1", "hero", 0, { layout: "split" }),
      createSection("about-1", "about", 1),
      createSection("services-1", "services", 2, { layout: "list" }),
      createSection("team-1", "team", 3, { layout: "default" }),
      createSection("faq-1", "faq", 4),
      createSection("booking-1", "booking", 5),
      createSection("contact-1", "contact", 6),
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    description:
      "Simple and elegant with lots of whitespace and focused content",
    preview: "🌿",
    globalStyles: {
      primaryColor: "#059669",
      secondaryColor: "#047857",
      fontFamily: "poppins",
      borderRadius: "lg",
      buttonStyle: "outline",
    },
    sections: [
      createSection("hero-1", "hero", 0, {
        layout: "minimal",
        style: { padding: "xl" },
      }),
      createSection("services-1", "services", 1, { layout: "minimal" }),
      createSection("booking-1", "booking", 2),
      createSection("contact-1", "contact", 3, { layout: "minimal" }),
    ],
  },
  {
    id: "bold",
    name: "Bold",
    description: "Vibrant and energetic with strong colors and dynamic layout",
    preview: "🔥",
    globalStyles: {
      primaryColor: "#dc2626",
      secondaryColor: "#ea580c",
      fontFamily: "poppins",
      borderRadius: "full",
      buttonStyle: "solid",
    },
    sections: [
      createSection("hero-1", "hero", 0, {
        layout: "centered",
        style: { padding: "xl" },
      }),
      createSection("services-1", "services", 1, { layout: "cards" }),
      createSection("testimonials-1", "testimonials", 2, {
        style: { backgroundColor: "#fef2f2", padding: "lg" },
      }),
      createSection("team-1", "team", 3, { layout: "grid" }),
      createSection("cta-1", "cta", 4, {
        style: {
          backgroundColor: "#dc2626",
          textColor: "#ffffff",
          padding: "lg",
        },
      }),
      createSection("booking-1", "booking", 5),
    ],
  },
];

export function getTemplate(id: string): WebsiteTemplate | undefined {
  return WEBSITE_TEMPLATES.find((t) => t.id === id);
}
