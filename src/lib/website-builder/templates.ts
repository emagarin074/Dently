import { SectionBlock, GlobalStyles, DEFAULT_SECTION_CONTENT } from "./types";

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji or icon identifier
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
    name: "Modern",
    description:
      "Clean, professional layout with bold hero section and smooth sections",
    preview: "✨",
    globalStyles: {
      primaryColor: "#0891b2",
      secondaryColor: "#0e7490",
      fontFamily: "inter",
      borderRadius: "md",
      buttonStyle: "solid",
    },
    sections: [
      createSection("hero-1", "hero", 0, { layout: "centered" }),
      createSection("services-1", "services", 1, { layout: "grid" }),
      createSection("team-1", "team", 2, { layout: "cards" }),
      createSection("cta-1", "cta", 3, {
        style: {
          backgroundColor: "#0891b2",
          textColor: "#ffffff",
          padding: "lg",
        },
      }),
      createSection("booking-1", "booking", 4),
      createSection("contact-1", "contact", 5),
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
