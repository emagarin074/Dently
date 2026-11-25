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
  | "modern_data"
  | "classic_data"
  | "minimal_data"
  | "bold_data"
  | "template_data";

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
  classic_data: {
    logoType: "text",
    logoImage: "",
    logoText: "",
    logoFont: "font-serif",
    logoIcon: "Shield",
    navLinks: [
      { label: "Specialties", sectionId: "services" },
      { label: "About Clinic", sectionId: "about" },
      { label: "Patient FAQs", sectionId: "faqs" },
      { label: "Contact & Location", sectionId: "contact" },
    ],
    heroBadgeIcon: "Shield",
    heroBadgeText: "Established 2005",
    heroBadgeSub: "Excellence in Dental Medicine",
    heroHeadingMain: "Dignified care for your",
    heroHeadingHighlight: "family's lifelong\nhealthy smile.",
    heroSubheading:
      "Providing compassionate, board-certified dental healthcare with clinical precision and time-honored dedication to patient comfort.",
    heroCtaText: "Schedule Consultation",
    heroTrustCount: "5,000+",
    heroTrustText: "Families Trusted for Gentle Care",
    heroPills: [
      { label: "Board Certified Specialists", checked: true },
      { label: "Comfort & Sedation Options", checked: true },
      { label: "Family Heritage Practice", checked: true },
    ],
    heroImage:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80",
    servicesHeading: "Clinical Specialties & Services",
    servicesSubheading:
      "Comprehensive diagnostic, restorative, and preventive care delivered with the highest standard of medicine.",
    servicesItems: [
      {
        title: "Preventive & Family Dentistry",
        description:
          "Comprehensive dental examinations, advanced cleanings, and preventive therapy for all generations.",
        icon: "Tooth",
      },
      {
        title: "Restorative Dentistry & Crowns",
        description:
          "Precision crowns, bridges, and durable restorations crafted for long-lasting structural integrity.",
        icon: "Shield",
      },
      {
        title: "Periodontal Healthcare",
        description:
          "Specialized care for gum health, bone preservation, and long-term oral stability.",
        icon: "Stethoscope",
      },
      {
        title: "Orthodontic Solutions",
        description:
          "Structured alignment therapies and clinical evaluations to achieve balanced, functional bites.",
        icon: "AlignCenter",
      },
      {
        title: "Oral Surgery & Extractions",
        description:
          "Gentle, stress-free surgical treatments with state-of-the-art diagnostics and patient care.",
        icon: "Hospital",
      },
      {
        title: "Cosmetic Restoration",
        description:
          "Subtle, natural smile rejuvenation including professional whitening and enamel preservation.",
        icon: "Sparkles",
      },
    ],
    aboutHeading: "A Tradition of Trust & Excellence",
    aboutContent:
      "Founded on the core principles of medical integrity and patient-first dedication, our practice combines time-honored clinical experience with modern technological advances.\n\nEvery member of our team is dedicated to listening carefully to your health needs, explaining every option transparently, and ensuring that you and your loved ones feel secure and respected throughout every visit.",
    aboutImage:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80",
    faqHeading: "Frequently Asked Questions",
    faqItems: [
      {
        q: "What should I bring to my initial consultation?",
        a: "Please bring any prior dental records, a list of current medications, your insurance documentation, and a valid photo ID.",
      },
      {
        q: "How do you accommodate patients with dental anxiety?",
        a: "We prioritize gentle care, unhurried consultations, and comfortable amenities to ensure your complete peace of mind.",
      },
      {
        q: "Do you offer emergency dental appointments?",
        a: "Yes, we reserve dedicated emergency slots each operating day for urgent patient needs.",
      },
      {
        q: "What payment and insurance options are supported?",
        a: "We work with leading insurance providers and offer flexible installment options for comprehensive treatment plans.",
      },
    ],
    bookingHeading: "Schedule Your Consultation",
    bookingSubheading:
      "Select your preferred date and specialist for an unhurried, thorough dental assessment.",
    contactHeading: "Contact Our Practice",
    contactSubheading:
      "Our patient care coordinators are here to assist with any inquiries, appointments, or special arrangements.",
    contactPhones: [],
    socialLinks: [
      { platform: "Facebook", url: "https://facebook.com", label: "Facebook" },
      {
        platform: "Instagram",
        url: "https://instagram.com",
        label: "Instagram",
      },
    ],
    footerText:
      "© 2024 Classic Dental Care. Committed to clinical excellence and compassionate healthcare.",
  },
  minimal_data: {
    logoType: "text",
    logoImage: "",
    logoText: "",
    logoFont: "font-sans",
    logoIcon: "Smile",
    navLinks: [
      { label: "Care", sectionId: "services" },
      { label: "Philosophy", sectionId: "about" },
      { label: "Answers", sectionId: "faqs" },
      { label: "Studio", sectionId: "contact" },
    ],
    heroBadgeIcon: "Heart",
    heroBadgeText: "Mindful Wellness",
    heroBadgeSub: "A Serene Dental Ritual",
    heroHeadingMain: "Quietly redefining",
    heroHeadingHighlight: "the dental\nexperience.",
    heroSubheading:
      "Thoughtful dental care designed with warm minimalism, unhurried appointments, and absolute comfort for your mind and smile.",
    heroCtaText: "Reserve Your Visit",
    heroTrustCount: "99.8%",
    heroTrustText: "Calm & Relaxed Visits",
    heroPills: [
      { label: "Unhurried Sessions", checked: true },
      { label: "Holistic Care", checked: true },
      { label: "Calming Space", checked: true },
    ],
    heroImage:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80",
    servicesHeading: "Curated Treatments",
    servicesSubheading:
      "Mindful oral care focused on biological health, aesthetic harmony, and preventive longevity.",
    servicesItems: [
      {
        title: "Essential Hygiene & Ritual Clean",
        description:
          "Gentle ultrasonic cleaning, botanical polish, and mindful oral microbiome assessment.",
        icon: "Smile",
      },
      {
        title: "Invisible Alignment",
        description:
          "Discreet clear aligners custom-engineered to gracefully guide your teeth into harmony.",
        icon: "Sparkles",
      },
      {
        title: "Micro-Aesthetic Bonding",
        description:
          "Artisanal composite contouring that seamlessly restores natural tooth beauty without invasive preparation.",
        icon: "Sparkles",
      },
      {
        title: "Biomimetic Restorations",
        description:
          "Tooth-preserving ceramic restorations that mimic the natural biomechanics of your teeth.",
        icon: "Shield",
      },
      {
        title: "Gentle Preventive Care",
        description:
          "Personalized remineralization treatments and diagnostic imaging with ultra-low radiation.",
        icon: "Heart",
      },
      {
        title: "Relaxation-Assisted Care",
        description:
          "Calming sensory environments with acoustic isolation and gentle aromatherapy.",
        icon: "Baby",
      },
    ],
    aboutHeading: "Our Calming Philosophy",
    aboutContent:
      "We created our studio as an antidote to cold, clinical dental offices. We believe that caring for your teeth should be an empowering act of self-care, not an ordeal to endure.\n\nFrom our quiet waiting lounge to our warm, naturally lit treatment suites, every detail is crafted to slow down, reduce stress, and put your well-being first.",
    aboutImage:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80",
    faqHeading: "Questions & Clarity",
    faqItems: [
      {
        q: "How is your studio experience different?",
        a: "We operate on a low-volume, high-attention model. We only book one patient at a time with your dentist, guaranteeing unhurried care without crowded waiting rooms.",
      },
      {
        q: "What should I expect during my visit?",
        a: "You'll begin with a warm beverage, a gentle discussion about your health goals, and a comprehensive digital assessment without judgment or pressure.",
      },
      {
        q: "Are your treatments holistic?",
        a: "We prioritize biocompatible materials, conservative tooth-preserving techniques, and low-dose digital imaging.",
      },
    ],
    bookingHeading: "Reserve Your Visit",
    bookingSubheading:
      "Select a tranquil time that works best for your schedule.",
    contactHeading: "Studio & Inquiries",
    contactSubheading:
      "Reach out directly with any questions or special requests before your visit.",
    contactPhones: [],
    socialLinks: [
      {
        platform: "Instagram",
        url: "https://instagram.com",
        label: "Instagram",
      },
      { platform: "Facebook", url: "https://facebook.com", label: "Facebook" },
    ],
    footerText:
      "© 2024 Minimal Dental Studio. Simplicity, precision, and mindful care.",
  },
  bold_data: {
    logoType: "text",
    logoImage: "",
    logoText: "",
    logoFont: "font-sans",
    logoIcon: "Sparkles",
    navLinks: [
      { label: "Services", sectionId: "services" },
      { label: "Transformations", sectionId: "about" },
      { label: "FAQ", sectionId: "faqs" },
      { label: "Contact", sectionId: "contact" },
    ],
    heroBadgeIcon: "Flame",
    heroBadgeText: "NEXT-GEN SMILE STUDIO",
    heroBadgeSub: "100% Digital • Fast Results",
    heroHeadingMain: "UNLEASH YOUR",
    heroHeadingHighlight: "MOST CONFIDENT,\nRADIANT SMILE.",
    heroSubheading:
      "High-impact cosmetic dentistry, rapid smile transformations, and 3D precision technology built for results that turn heads.",
    heroCtaText: "TRANSFORM MY SMILE",
    heroTrustCount: "10,000+",
    heroTrustText: "Smiles Transformed",
    heroPills: [
      { label: "3D Smile Preview", checked: true },
      { label: "Same-Day Results", checked: true },
      { label: "Financing Available", checked: true },
    ],
    heroImage:
      "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80",
    servicesHeading: "POWERFUL SMILE SOLUTIONS",
    servicesSubheading:
      "State-of-the-art procedures designed for dramatic, long-lasting aesthetic and functional transformations.",
    servicesItems: [
      {
        title: "Veneers & Full Makeovers",
        description:
          "Handcrafted ultra-thin porcelain veneers designed for maximum luminosity and symmetrical perfection.",
        icon: "Sparkles",
      },
      {
        title: "Laser Power Whitening",
        description:
          "Clinical laser whitening delivering up to 8 shades brighter in a single 45-minute power session.",
        icon: "Star",
      },
      {
        title: "Clear Aligner Pro",
        description:
          "Accelerated aligner therapy utilizing AI-driven smile simulation and rapid tooth positioning.",
        icon: "AlignCenter",
      },
      {
        title: "Digital Dental Implants",
        description:
          "Guided robotic implant placement for permanent, natural-feeling tooth replacements.",
        icon: "Tooth",
      },
      {
        title: "Full Mouth Reconstruction",
        description:
          "Comprehensive aesthetic and functional overhaul combining advanced prosthodontics and bite correction.",
        icon: "Shield",
      },
      {
        title: "Emergency Pain Relief",
        description:
          "Immediate same-day emergency interventions to relieve acute dental pain fast.",
        icon: "Cross",
      },
    ],
    aboutHeading: "THE FUTURE OF DENTISTRY IS HERE",
    aboutContent:
      "We don't do boring, old-fashioned dentistry. We are a high-performance cosmetic dental studio equipped with cutting-edge 3D scanners, instant smile previews, and pain-free laser technology.\n\nWhether you need a full celebrity smile makeover, rapid clear aligners, or urgent dental care, our elite team delivers unmatched results with precision and speed.",
    aboutImage:
      "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80",
    faqHeading: "FREQUENTLY ASKED QUESTIONS",
    faqItems: [
      {
        q: "Can I see my new smile before treatment starts?",
        a: "Yes! With our 3D Digital Smile Design technology, we generate a photorealistic 3D simulation of your final smile before touching a single tooth.",
      },
      {
        q: "How fast is laser teeth whitening?",
        a: "Our in-office laser whitening session takes just 45 minutes and brightens your smile up to 8 shades with zero downtime.",
      },
      {
        q: "Do you offer flexible 0% interest payment plans?",
        a: "Absolutely! We partner with flexible medical financing providers so you can spread your transformation across comfortable monthly installments.",
      },
    ],
    bookingHeading: "LOCK IN YOUR APPOINTMENT",
    bookingSubheading:
      "Spots fill quickly. Claim your personalized consultation today.",
    contactHeading: "GET IN TOUCH",
    contactSubheading:
      "Ready to kickstart your smile transformation? Send us a direct message.",
    contactPhones: [],
    socialLinks: [
      {
        platform: "Instagram",
        url: "https://instagram.com",
        label: "Instagram",
      },
      { platform: "Facebook", url: "https://facebook.com", label: "Facebook" },
    ],
    footerText:
      "© 2024 Bold Smile Studio. High-performance dentistry. All rights reserved.",
  },
  template_data: {
    logoType: "text",
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
    servicesHeading: "Our Services",
    servicesSubheading: "Comprehensive dental care tailored to your needs.",
    servicesItems: [],
    aboutHeading: "About Us",
    aboutContent: "",
    aboutImage:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80",
    faqHeading: "Frequently Asked Questions",
    faqItems: [],
    bookingHeading: "Ready to Smile?",
    bookingSubheading: "Book your appointment online today.",
    contactHeading: "Get in Touch",
    contactSubheading: "We're here to answer any questions you have.",
    contactPhones: [],
    socialLinks: [],
    footerText: "© 2024 Dental Clinic. All rights reserved.",
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
