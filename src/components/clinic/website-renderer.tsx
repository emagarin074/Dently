"use client";

import { useState } from "react";
import { SectionBlock, GlobalStyles } from "@/lib/website-builder/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPublicBooking } from "@/app/actions/appointments";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Star,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { type BlockedDate } from "@/components/clinic/public-page";
import { getOpenDays, isDayOpen, getDayName } from "@/lib/operating-days";

interface ClinicData {
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  settings?: { brandColor?: string; operatingHours?: unknown } | null;
  procedures: {
    id: string;
    name: string;
    description: string | null;
    priceType: string;
    price: number | null;
    priceMin: number | null;
    priceMax: number | null;
    category?: string | null;
  }[];
  users: { id: string; name: string; specialization: string | null }[];
}

interface Props {
  clinic: ClinicData;
  sections: SectionBlock[];
  globalStyles: GlobalStyles;
  blockedDates?: BlockedDate[];
}

const FONT_MAP: Record<string, string> = {
  inter: "'Inter', sans-serif",
  poppins: "'Poppins', sans-serif",
  playfair: "'Playfair Display', serif",
  roboto: "'Roboto', sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
};

const PADDING_MAP: Record<string, string> = {
  none: "0",
  sm: "2rem 1rem",
  md: "3rem 1rem",
  lg: "4rem 1rem",
  xl: "6rem 1rem",
};

export function WebsiteRenderer({
  clinic,
  sections,
  globalStyles,
  blockedDates = [],
}: Props) {
  const enabledSections = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  const fontFamily = FONT_MAP[globalStyles.fontFamily] || FONT_MAP.inter;
  const borderRadius = RADIUS_MAP[globalStyles.borderRadius] || RADIUS_MAP.md;

  return (
    <div
      style={
        {
          fontFamily,
          ["--primary" as string]: globalStyles.primaryColor,
          ["--radius" as string]: borderRadius,
        } as React.CSSProperties
      }
      className="min-h-screen bg-white"
    >
      {enabledSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          clinic={clinic}
          globalStyles={globalStyles}
          blockedDates={blockedDates}
        />
      ))}
    </div>
  );
}

function SectionRenderer({
  section,
  clinic,
  globalStyles,
  blockedDates = [],
}: {
  section: SectionBlock;
  clinic: ClinicData;
  globalStyles: GlobalStyles;
  blockedDates?: BlockedDate[];
}) {
  const padding = PADDING_MAP[section.style.padding || "lg"];
  const sectionStyle: React.CSSProperties = {
    padding,
    backgroundColor: section.style.backgroundColor || undefined,
    color: section.style.textColor || undefined,
  };

  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          section={section}
          clinic={clinic}
          globalStyles={globalStyles}
          style={sectionStyle}
        />
      );
    case "services":
      return (
        <ServicesSection
          section={section}
          clinic={clinic}
          globalStyles={globalStyles}
          style={sectionStyle}
        />
      );
    case "team":
      return (
        <TeamSection
          section={section}
          clinic={clinic}
          globalStyles={globalStyles}
          style={sectionStyle}
        />
      );
    case "booking":
      return (
        <BookingSection
          key={section.id}
          section={section}
          clinic={clinic}
          globalStyles={globalStyles}
          style={sectionStyle}
          blockedDates={blockedDates}
        />
      );
    case "about":
      return <AboutSection section={section} style={sectionStyle} />;
    case "testimonials":
      return (
        <TestimonialsSection
          section={section}
          style={sectionStyle}
          globalStyles={globalStyles}
        />
      );
    case "faq":
      return <FaqSection section={section} style={sectionStyle} />;
    case "contact":
      return (
        <ContactSection
          section={section}
          clinic={clinic}
          style={sectionStyle}
        />
      );
    case "cta":
      return (
        <CtaSection
          section={section}
          globalStyles={globalStyles}
          style={sectionStyle}
        />
      );
    case "custom":
      return <CustomSection section={section} style={sectionStyle} />;
    default:
      return null;
  }
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection({
  section,
  clinic,
  globalStyles,
  style,
}: {
  section: SectionBlock;
  clinic: ClinicData;
  globalStyles: GlobalStyles;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || clinic.name;
  const subheading = (c.subheading as string) || clinic.description || "";
  const ctaText = (c.ctaText as string) || "Book an Appointment";
  const navLinks = (c.navLinks as { sectionId: string; label: string }[]) || [];

  // Try to find the booking section dynamically for the CTA link
  // If we can't search through sections here, we can fallback to the first booking section ID if passed, or just "#booking"
  // Wait, we don't have all sections in HeroSection. The CTA can point to a section if we pass the booking section ID.
  // Actually, we can just let CTA link to `#booking` and ensure BookingSection has `id="booking"` AND `id={section.id}` (or just `id="booking"` since CTA is hardcoded).
  // Wait, user might add multiple booking sections? No, one is typical. I'll stick to `#booking` for CTA. But let's add `id={section.id}`.

  const showNavBar = c.showNavBar !== false;

  return (
    <section
      id={section.id}
      style={{
        ...style,
        backgroundColor: style.backgroundColor || globalStyles.primaryColor,
        color: style.color || "#ffffff",
      }}
      className="relative"
    >
      {showNavBar && (
        <nav
          className="absolute top-0 left-0 right-0 z-10"
          style={{
            backgroundColor: (c.navBarBgColor as string) || "transparent",
            color: (c.navBarTextColor as string) || "inherit",
          }}
        >
          <div className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
            <div className="font-bold text-xl flex items-center">
              {c.logoUrl ? (
                <img
                  src={c.logoUrl as string}
                  alt="Logo"
                  className="h-8 w-auto max-w-[150px] object-contain"
                />
              ) : c.logoText ? (
                <span
                  style={{
                    fontFamily: FONT_MAP[(c.logoFont as string) || "inter"],
                  }}
                >
                  {c.logoText as string}
                </span>
              ) : (
                <span>{clinic.name}</span>
              )}
            </div>
            <div className="hidden md:flex gap-6 items-center">
              {navLinks.map((link, i) => (
                <a
                  key={i}
                  href={`#${link.sectionId}`}
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      <div
        className={`mx-auto max-w-4xl text-center ${showNavBar ? "pt-16" : ""}`}
        style={
          c.bannerTextColor ? { color: c.bannerTextColor as string } : undefined
        }
      >
        <h1 className="text-4xl md:text-5xl font-bold">{heading}</h1>
        {subheading && (
          <p className="mt-4 text-lg opacity-80 max-w-xl mx-auto">
            {subheading}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm opacity-80">
          {c.showAddress !== false && clinic.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {clinic.address}
            </span>
          )}
          {c.showPhone !== false && clinic.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {clinic.phone}
            </span>
          )}
          {c.showEmail !== false && clinic.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {clinic.email}
            </span>
          )}
        </div>
        <div className="mt-8">
          <a
            href="#booking"
            className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

function ServicesSection({
  section,
  clinic,
  globalStyles,
  style,
}: {
  section: SectionBlock;
  clinic: ClinicData;
  globalStyles: GlobalStyles;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "Our Services";
  const subheading = (c.subheading as string) || "";

  function getPriceLabel(proc: ClinicData["procedures"][0]) {
    if (proc.priceType === "FIXED" && proc.price)
      return formatCurrency(proc.price);
    if (proc.priceType === "RANGE" && proc.priceMin && proc.priceMax)
      return `${formatCurrency(proc.priceMin)} – ${formatCurrency(proc.priceMax)}`;
    return "Inquire for price";
  }

  const gridClass =
    section.layout === "list"
      ? "grid-cols-1"
      : section.layout === "grid"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">{heading}</h2>
          {subheading && (
            <p className="mt-2 text-muted-foreground">{subheading}</p>
          )}
        </div>
        <div className={`grid gap-4 ${gridClass}`}>
          {clinic.procedures.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <h3 className="font-semibold">{p.name}</h3>
              {c.showDescriptions !== false && p.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {p.description}
                </p>
              )}
              {c.showPrices !== false && (
                <p
                  className="text-sm font-semibold mt-2"
                  style={{ color: globalStyles.primaryColor }}
                >
                  {getPriceLabel(p)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Team ────────────────────────────────────────────────────────────────────

function TeamSection({
  section,
  clinic,
  globalStyles,
  style,
}: {
  section: SectionBlock;
  clinic: ClinicData;
  globalStyles: GlobalStyles;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "Meet Our Team";
  const subheading = (c.subheading as string) || "";

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">{heading}</h2>
          {subheading && (
            <p className="mt-2 text-muted-foreground">{subheading}</p>
          )}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clinic.users.map((u) => (
            <div key={u.id} className="text-center p-4">
              <div
                className="mx-auto h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                style={{ backgroundColor: globalStyles.primaryColor }}
              >
                {u.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <h3 className="font-semibold">{u.name}</h3>
              {c.showSpecialization !== false && u.specialization && (
                <p className="text-sm text-muted-foreground">
                  {u.specialization}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Booking ─────────────────────────────────────────────────────────────────

function BookingSection({
  section,
  clinic,
  globalStyles,
  style,
  blockedDates = [],
}: {
  section: SectionBlock;
  clinic: ClinicData;
  globalStyles: GlobalStyles;
  style: React.CSSProperties;
  blockedDates?: BlockedDate[];
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "Book an Appointment";
  const subheading = (c.subheading as string) || "";
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dentistId, setDentistId] = useState("");
  const [service, setService] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const openDays = getOpenDays(clinic.settings?.operatingHours);

  function checkDateValidity(dateStr: string): string | null {
    if (!dateStr) return null;
    if (!isDayOpen(dateStr, openDays)) {
      const dayName = getDayName(new Date(dateStr + "T00:00:00").getDay());
      return `The clinic is closed on ${dayName}s. Please choose an open operating day.`;
    }
    const blocked = isDateBlocked(dateStr);
    if (blocked) {
      return `This date is unavailable (${blocked.title}). Please choose another date.`;
    }
    return null;
  }

  function isDateBlocked(dateStr: string): BlockedDate | null {
    if (!dateStr) return null;
    return (
      blockedDates.find(
        (b) => dateStr >= b.startDate && dateStr <= b.endDate,
      ) ?? null
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const chosenDate = fd.get("preferredDate") as string;
    const err = checkDateValidity(chosenDate);
    if (err) {
      setDateError(err);
      return;
    }
    setLoading(true);
    fd.set(
      "preferredDentistId",
      dentistId === "no-preference" ? "" : dentistId,
    );
    fd.set("serviceType", service);
    const result = await createPublicBooking(clinic.slug, fd);
    if ("error" in result) toast.error(result.error);
    else setSubmitted(true);
    setLoading(false);
  }

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-2xl">
        {/* We keep an anchor for the old hardcoded "#booking" link just in case */}
        <div id="booking" className="absolute -top-16" />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">{heading}</h2>
          {subheading && (
            <p className="mt-2 text-muted-foreground">{subheading}</p>
          )}
        </div>
        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <CheckCircle
              className="h-12 w-12 mx-auto"
              style={{ color: globalStyles.primaryColor }}
            />
            <h3 className="text-xl font-semibold">Booking Received!</h3>
            <p className="text-muted-foreground">
              Our team will confirm your appointment shortly.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Book Another
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 border rounded-lg p-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input id="contactNumber" name="contactNumber" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select value={service} onValueChange={setService} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {clinic.procedures.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="General Consultation">
                    General Consultation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date *</Label>
              <Input
                id="preferredDate"
                name="preferredDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                required
                onChange={(e) => {
                  setDateError(checkDateValidity(e.target.value));
                }}
              />
              {dateError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {dateError}
                </p>
              )}
            </div>
            {c.showDentistPreference !== false && clinic.users.length > 0 && (
              <div className="space-y-2">
                <Label>Preferred Dentist</Label>
                <Select value={dentistId} onValueChange={setDentistId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No Preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-preference">No Preference</SelectItem>
                    {clinic.users.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {c.showConcernField !== false && (
              <div className="space-y-2">
                <Label htmlFor="additionalConcern">Additional Concern</Label>
                <Textarea
                  id="additionalConcern"
                  name="additionalConcern"
                  rows={3}
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !service}
              style={{ backgroundColor: globalStyles.primaryColor }}
            >
              {loading ? "Submitting..." : "Request Appointment"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── About ───────────────────────────────────────────────────────────────────

function AboutSection({
  section,
  style,
}: {
  section: SectionBlock;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "About Us";
  const content = (c.content as string) || "";

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-6">{heading}</h2>
        {content && (
          <div className="prose prose-lg mx-auto text-muted-foreground whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────

function TestimonialsSection({
  section,
  style,
  globalStyles,
}: {
  section: SectionBlock;
  style: React.CSSProperties;
  globalStyles: GlobalStyles;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "What Our Patients Say";
  const items =
    (c.items as { name: string; text: string; rating: number }[]) || [];

  if (items.length === 0) return null;

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-8">{heading}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="border rounded-lg p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: item.rating || 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-current"
                    style={{ color: globalStyles.primaryColor }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-3">
                &ldquo;{item.text}&rdquo;
              </p>
              <p className="text-sm font-semibold">— {item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FaqSection({
  section,
  style,
}: {
  section: SectionBlock;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "Frequently Asked Questions";
  const items = (c.items as { question: string; answer: string }[]) || [];

  if (items.length === 0) return null;

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-8">{heading}</h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <details key={i} className="border rounded-lg p-4 group">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                {item.question}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact ─────────────────────────────────────────────────────────────────

function ContactSection({
  section,
  clinic,
  style,
}: {
  section: SectionBlock;
  clinic: ClinicData;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "Contact Us";

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-8">{heading}</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            {clinic.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <p>{clinic.address}</p>
              </div>
            )}
            {clinic.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p>{clinic.phone}</p>
              </div>
            )}
            {clinic.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p>{clinic.email}</p>
              </div>
            )}
          </div>
          {Boolean(c.showMap) &&
            typeof c.mapEmbedUrl === "string" &&
            c.mapEmbedUrl.length > 0 && (
              <div className="aspect-video rounded-lg overflow-hidden border">
                <iframe
                  src={c.mapEmbedUrl}
                  className="w-full h-full"
                  loading="lazy"
                  title="Map"
                />
              </div>
            )}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CtaSection({
  section,
  globalStyles,
  style,
}: {
  section: SectionBlock;
  globalStyles: GlobalStyles;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "Ready to Transform Your Smile?";
  const subheading = (c.subheading as string) || "";
  const buttonText = (c.buttonText as string) || "Book Now";

  return (
    <section
      id={section.id}
      style={{
        ...style,
        backgroundColor: style.backgroundColor || globalStyles.primaryColor,
        color: style.color || "#ffffff",
      }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold">{heading}</h2>
        {subheading && <p className="mt-3 text-lg opacity-80">{subheading}</p>}
        <div className="mt-6">
          <a
            href="#booking"
            className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {buttonText}
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Custom ──────────────────────────────────────────────────────────────────

function CustomSection({
  section,
  style,
}: {
  section: SectionBlock;
  style: React.CSSProperties;
}) {
  const c = section.content as Record<string, unknown>;
  const heading = (c.heading as string) || "";
  const content = (c.content as string) || "";

  return (
    <section id={section.id} style={style}>
      <div className="mx-auto max-w-4xl">
        {heading && (
          <h2 className="text-3xl font-bold text-center mb-6">{heading}</h2>
        )}
        {content && (
          <div
            className="prose mx-auto"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </section>
  );
}
