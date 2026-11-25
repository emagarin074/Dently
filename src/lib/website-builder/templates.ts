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

export function createSection(
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
          ...DEFAULT_SECTION_CONTENT.modern_data,
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
          heroCtaText: "Contact Us",
          heroCtaSection: "contact",
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
      "Traditional and prestigious design focused on clinical excellence and credentials",
    preview: "🏛️",
    templateType: "rigid",
    globalStyles: {
      primaryColor: "#1e3a8a",
      secondaryColor: "#0f172a",
      fontFamily: "playfair",
      borderRadius: "sm",
      buttonStyle: "solid",
    },
    sections: [
      {
        id: "classic-data-1",
        type: "classic_data" as SectionBlock["type"],
        enabled: true,
        order: 0,
        layout: "default",
        content: {
          ...DEFAULT_SECTION_CONTENT.classic_data,
        },
        style: {},
      },
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    description:
      "Serene boutique design with architectural calm and mindful dental wellness",
    preview: "🌿",
    templateType: "rigid",
    globalStyles: {
      primaryColor: "#059669",
      secondaryColor: "#047857",
      fontFamily: "inter",
      borderRadius: "full",
      buttonStyle: "solid",
    },
    sections: [
      {
        id: "minimal-data-1",
        type: "minimal_data" as SectionBlock["type"],
        enabled: true,
        order: 0,
        layout: "default",
        content: {
          ...DEFAULT_SECTION_CONTENT.minimal_data,
        },
        style: {},
      },
    ],
  },
  {
    id: "bold",
    name: "Bold",
    description:
      "High-impact modern smile studio with dynamic energy and vibrant transformations",
    preview: "🔥",
    templateType: "rigid",
    globalStyles: {
      primaryColor: "#e11d48",
      secondaryColor: "#ea580c",
      fontFamily: "poppins",
      borderRadius: "md",
      buttonStyle: "solid",
    },
    sections: [
      {
        id: "bold-data-1",
        type: "bold_data" as SectionBlock["type"],
        enabled: true,
        order: 0,
        layout: "default",
        content: {
          ...DEFAULT_SECTION_CONTENT.bold_data,
        },
        style: {},
      },
    ],
  },
];

export function getTemplate(id: string): WebsiteTemplate | undefined {
  return WEBSITE_TEMPLATES.find((t) => t.id === id);
}
