"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getOpenDays } from "@/lib/operating-days";
import {
  Check,
  Phone,
  ArrowRight,
  MapPin,
  Mail,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Smile,
  Link as LinkIcon,
  AlertCircle,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createPublicBooking } from "@/app/actions/appointments";
import { createInquiry } from "@/app/actions/inquiries";
import {
  TemplateProps,
  PlatformIcon,
  TemplateIconMap,
  checkTemplateDateValidity,
  handleTemplateScroll,
} from "./template-common";

export function MinimalTemplate({
  clinic,
  data,
  initialBranchId,
  blockedDates = [],
}: TemplateProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [dentistId, setDentistId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>(
    initialBranchId ||
      clinic.branches?.find((branch) => branch.isPrimary)?.id ||
      clinic.branches?.[0]?.id ||
      "",
  );
  const [service, setService] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);

  const openDays = getOpenDays(clinic.settings?.operatingHours);

  const navLinks = (data.navLinks as {
    label: string;
    sectionId: string;
  }[]) || [
    { label: "Care", sectionId: "services" },
    { label: "Philosophy", sectionId: "about" },
    { label: "Answers", sectionId: "faqs" },
    { label: "Studio", sectionId: "contact" },
  ];

  const mainHeading = (data.heroHeadingMain as string) || "Quietly redefining";
  const highlightHeading =
    (data.heroHeadingHighlight as string) || "the dental\nexperience.";
  const heroCtaText = (data.heroCtaText as string) || "Reserve Your Visit";
  const heroCtaSection =
    (data.heroCtaSection as string) ||
    (heroCtaText.toLowerCase().includes("contact") ? "contact" : "booking");

  const services =
    (data.servicesItems as {
      title: string;
      description: string;
      icon: string;
    }[]) || [];
  const socialLinks =
    (data.socialLinks as { platform: string; url: string; label?: string }[]) ||
    [];
  const contactPhones = (data.contactPhones as string[]) || [];
  const activePhones =
    contactPhones.filter(Boolean).length > 0
      ? contactPhones.filter(Boolean)
      : clinic.phone
        ? [clinic.phone]
        : [];

  const heroPills = (data.heroPills as {
    label: string;
    checked?: boolean;
  }[]) || [
    { label: "Unhurried Sessions", checked: true },
    { label: "Holistic Care", checked: true },
    { label: "Calming Space", checked: true },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const chosenDate = fd.get("preferredDate") as string;
    const err = checkTemplateDateValidity(chosenDate, openDays, blockedDates);
    if (err) {
      setDateError(err);
      return;
    }
    setLoading(true);
    try {
      fd.set(
        "preferredDentistId",
        dentistId === "no-preference" ? "" : dentistId,
      );
      fd.set("branchId", branchId);
      fd.set("serviceType", service);
      const result = await createPublicBooking(clinic.slug, fd);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setSubmitted(true);
        toast.success("Visit reserved successfully.");
      }
    } catch {
      toast.error(
        "Network error while submitting reservation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleInquirySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const phone = fd.get("phone") as string;

    if (!email && !phone) {
      toast.error("Please provide either an email address or a phone number.");
      return;
    }

    setInquiryLoading(true);
    try {
      const result = await createInquiry(clinic.slug, fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Note received. We will respond promptly.");
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Network error while sending message. Please try again.");
    } finally {
      setInquiryLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Floating Glass Navigation */}
      <header className="sticky top-0 z-40 bg-[#fafaf9]/90 backdrop-blur-md border-b border-stone-200/70 transition-all">
        <div className="flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {((data.logoType as string) || "text") === "image" &&
            data.logoImage ? (
              <Image
                src={data.logoImage as string}
                alt={clinic.name}
                width={130}
                height={40}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                  {(() => {
                    const LogoIcon =
                      TemplateIconMap[(data.logoIcon as string) || "Smile"] ||
                      Smile;
                    return <LogoIcon className="w-4 h-4" />;
                  })()}
                </div>
                <span
                  className={`text-lg font-medium tracking-tight text-stone-900 ${(data.logoFont as string) || "font-sans"}`}
                >
                  {(data.logoText as string) || clinic.name}
                </span>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={`#${link.sectionId}`}
                onClick={(e) => handleTemplateScroll(e, link.sectionId)}
                className="text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="#booking"
              onClick={(e) => handleTemplateScroll(e, "booking")}
            >
              <Button className="rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 text-xs tracking-wider uppercase font-medium px-5 py-2 transition-all hover:scale-[1.02]">
                Book Visit
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section: Generous whitespace & tranquil proportions */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-28">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-8">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs tracking-wide">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">
                {(data.heroBadgeText as string) || "Mindful Wellness"}
              </span>
              <span className="text-emerald-300">•</span>
              <span className="text-emerald-700">
                {(data.heroBadgeSub as string) || "A Serene Dental Ritual"}
              </span>
            </div>

            {/* Title with subtle weight contrast */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-stone-900 leading-[1.08]">
              {mainHeading}{" "}
              <span className="font-semibold text-emerald-800 block mt-2 whitespace-pre-wrap">
                {highlightHeading}
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-stone-600 max-w-xl font-light leading-relaxed whitespace-pre-wrap">
              {(data.heroSubheading as string) ||
                "Thoughtful dental care designed with warm minimalism, unhurried appointments, and absolute comfort for your mind and smile."}
            </p>

            {/* CTA & Trust */}
            <div className="pt-2 space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={`#${heroCtaSection}`}
                  onClick={(e) => handleTemplateScroll(e, heroCtaSection)}
                >
                  <Button className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-6 text-sm tracking-wide font-medium shadow-xs transition-all hover:shadow-md">
                    {heroCtaText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <a
                  href="#services"
                  onClick={(e) => handleTemplateScroll(e, "services")}
                >
                  <Button
                    variant="ghost"
                    className="rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 px-6 py-6 text-sm tracking-wide"
                  >
                    View Treatments
                  </Button>
                </a>
              </div>

              {/* Serene Trust Stat */}
              <div className="flex items-center gap-3 pt-2 text-xs text-stone-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  <strong className="text-stone-800 font-medium">
                    {(data.heroTrustCount as string) || "99.8%"}
                  </strong>{" "}
                  {(data.heroTrustText as string) || "Calm & Relaxed Visits"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Image: Pure architectural composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-stone-200/60 shadow-lg border border-stone-200/80">
              <Image
                src={
                  (data.heroImage as string) ||
                  "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80"
                }
                alt="Minimalist Dental Studio"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Floating Tag */}
            <div className="absolute -bottom-4 left-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-stone-200/60 text-xs text-stone-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Quiet environment • One patient at a time</span>
            </div>

            {/* Feature Pills */}
            <div className="absolute -top-3 -right-3 space-y-2 hidden sm:block">
              {heroPills.map((pill, idx) => (
                <div
                  key={idx}
                  className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs border border-stone-200/80 text-xs font-normal text-stone-700 flex items-center gap-2"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section: Grid with Hairline Dividers */}
      <section
        id="services"
        className="py-24 px-6 lg:px-12 bg-white border-y border-stone-200/70"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-16 space-y-3">
            <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium block">
              Mindful Oral Health
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-stone-900">
              {(data.servicesHeading as string) || "Curated Treatments"}
            </h2>
            <p className="text-stone-500 text-sm font-light leading-relaxed">
              {(data.servicesSubheading as string) ||
                "Mindful oral care focused on biological health, aesthetic harmony, and preventive longevity."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-200/70 rounded-2xl overflow-hidden border border-stone-200/70 shadow-2xs">
            {services && services.length > 0 ? (
              services.map((service, idx) => {
                const IconComponent =
                  TemplateIconMap[service.icon] || CheckCircle2;
                return (
                  <div
                    key={idx}
                    className="bg-white p-8 flex flex-col justify-between hover:bg-stone-50/70 transition-colors group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-full bg-emerald-50/80 text-emerald-700 flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-medium text-stone-900 mb-2">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="text-stone-500 text-sm leading-relaxed font-light">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-6 mt-6 border-t border-stone-100">
                      <button
                        type="button"
                        className="text-xs uppercase tracking-wider text-stone-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={(e) => handleTemplateScroll(e, "booking")}
                      >
                        Reserve treatment{" "}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-stone-500 text-center col-span-full py-12 bg-white">
                No treatments listed yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Philosophy / About Us Section */}
      <section id="about" className="py-28 px-6 lg:px-12 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 shadow-md border border-stone-200">
              <Image
                src={
                  (data.aboutImage as string) ||
                  "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80"
                }
                alt="Philosophy Studio"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium block">
              Our Vision
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-stone-900 leading-tight">
              {(data.aboutHeading as string) || "Our Calming Philosophy"}
            </h2>
            <div className="prose prose-stone text-stone-600 font-light leading-relaxed whitespace-pre-wrap text-base">
              {(data.aboutContent as string) ||
                "We created our studio as an antidote to cold, clinical dental offices. We believe that caring for your teeth should be an empowering act of self-care, not an ordeal to endure.\n\nFrom our quiet waiting lounge to our warm, naturally lit treatment suites, every detail is crafted to slow down, reduce stress, and put your well-being first."}
            </div>

            {/* Minimalist Quotes Tag */}
            <div className="pt-4 border-t border-stone-200">
              <p className="italic text-sm text-stone-500 font-light">
                &ldquo;Dentistry reimagined with stillness, clarity, and genuine
                human warmth.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section
        id="faqs"
        className="py-24 px-6 lg:px-12 bg-white border-t border-stone-200/70"
      >
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="space-y-2 text-center">
            <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium block">
              Clarity & Guidance
            </span>
            <h2 className="text-3xl font-light text-stone-900">
              {(data.faqHeading as string) || "Questions & Clarity"}
            </h2>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full divide-y divide-stone-200 border-y border-stone-200"
          >
            {((data.faqItems as { q: string; a: string }[]) || []).map(
              (faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border-b-0 py-3"
                >
                  <AccordionTrigger className="text-left text-base font-normal text-stone-900 hover:text-emerald-700 hover:no-underline py-3">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-500 font-light text-sm leading-relaxed pb-3">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ),
            )}
          </Accordion>
        </div>
      </section>

      {/* Contact & Message Section */}
      <section
        id="contact"
        className="py-24 px-6 lg:px-12 bg-[#f5f5f4] border-t border-stone-200"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium block">
                  Studio Concierge
                </span>
                <h2 className="text-3xl sm:text-4xl font-light text-stone-900">
                  {(data.contactHeading as string) || "Studio & Inquiries"}
                </h2>
                <p className="text-stone-500 text-sm font-light leading-relaxed">
                  {(data.contactSubheading as string) ||
                    "Reach out directly with any questions or special requests before your visit."}
                </p>
              </div>

              <div className="space-y-6 pt-4">
                {clinic.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center flex-shrink-0 text-stone-700">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-900">
                        Address
                      </h4>
                      <p className="text-sm text-stone-600 font-light mt-0.5">
                        {clinic.address}
                      </p>
                    </div>
                  </div>
                )}

                {clinic.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center flex-shrink-0 text-stone-700">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-900">
                        Direct Email
                      </h4>
                      <p className="text-sm text-stone-600 font-light mt-0.5">
                        {clinic.email}
                      </p>
                    </div>
                  </div>
                )}

                {(socialLinks.length > 0 || activePhones.length > 0) && (
                  <div className="pt-6 border-t border-stone-200/80">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-900 mb-3">
                      Telephone & Social
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {activePhones.map((phone, idx) => (
                        <a
                          key={`phone-${idx}`}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1.5 bg-white border border-stone-200 hover:border-emerald-600 transition-colors rounded-full px-3.5 py-1.5 text-xs text-stone-700"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {phone}
                        </a>
                      ))}
                      {socialLinks.map((link, idx) => {
                        const Icon = PlatformIcon[link.platform] || LinkIcon;
                        return (
                          <a
                            key={`social-${idx}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 bg-white border border-stone-200 hover:border-emerald-600 transition-colors rounded-full px-3.5 py-1.5 text-xs text-stone-700"
                          >
                            <Icon className="w-3 h-3 text-emerald-600" />
                            {link.label ?? link.platform}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Minimalist Inquiry Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-stone-200">
              <div className="mb-6">
                <h3 className="text-xl font-medium text-stone-900">
                  Send a Note
                </h3>
                <p className="text-xs text-stone-500 font-light mt-1">
                  We will reply through your provided contact preference.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleInquirySubmit}>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-stone-600 font-medium">
                    Your Name *
                  </Label>
                  <Input
                    name="name"
                    required
                    placeholder="Full name"
                    className="bg-stone-50 border-stone-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/20"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-stone-600 font-medium">
                      Email
                    </Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="hello@example.com"
                      className="bg-stone-50 border-stone-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-stone-600 font-medium">
                      Phone Number
                    </Label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="bg-stone-50 border-stone-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-stone-600 font-medium">
                    Message *
                  </Label>
                  <Textarea
                    name="message"
                    required
                    placeholder="Tell us what you'd like to ask or achieve..."
                    rows={4}
                    className="bg-stone-50 border-stone-200 rounded-xl resize-none focus:border-emerald-600 focus:ring-emerald-600/20"
                  />
                </div>
                <Button
                  disabled={inquiryLoading}
                  className="w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 py-5 text-xs uppercase tracking-wider font-medium cursor-pointer"
                >
                  {inquiryLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                  ) : (
                    "Send Note"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Studio Section */}
      <section
        id="booking"
        className="py-24 px-6 lg:px-12 bg-white border-t border-stone-200"
      >
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-emerald-700 font-medium block">
              Reservation
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-stone-900">
              {(data.bookingHeading as string) || "Reserve Your Visit"}
            </h2>
            <p className="text-sm text-stone-500 font-light">
              {(data.bookingSubheading as string) ||
                "Select a tranquil time that works best for your schedule."}
            </p>
          </div>

          <div className="bg-[#fafaf9] rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200">
            {submitted ? (
              <div className="text-center py-12 space-y-5">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-light text-stone-900">
                  Visit Reserved
                </h3>
                <p className="text-stone-500 text-sm max-w-sm mx-auto font-light leading-relaxed">
                  Thank you. We have received your booking and will reach out to
                  confirm your scheduled appointment.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="mt-4 rounded-full border-stone-300 text-stone-800 hover:bg-white text-xs uppercase tracking-wider px-6 py-2"
                >
                  Reserve Another Time
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="fullName"
                      className="text-xs uppercase tracking-wider text-stone-600 font-medium"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Juan dela Cruz"
                      required
                      className="bg-white border-stone-200 rounded-xl py-5 focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contactNumber"
                      className="text-xs uppercase tracking-wider text-stone-600 font-medium"
                    >
                      Phone Number *
                    </Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="+63 912 345 6789"
                      required
                      className="bg-white border-stone-200 rounded-xl py-5 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs uppercase tracking-wider text-stone-600 font-medium"
                  >
                    Email Address (Optional)
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan@email.com"
                    className="bg-white border-stone-200 rounded-xl py-5 focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-stone-600 font-medium">
                      Desired Treatment *
                    </Label>
                    <Select value={service} onValueChange={setService} required>
                      <SelectTrigger className="bg-white border-stone-200 rounded-xl h-12 focus:border-emerald-600">
                        <SelectValue placeholder="Select treatment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clinic.procedures?.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="General Consultation">
                          Consultation & Assessment
                        </SelectItem>
                        <SelectItem value="Other">Other Care</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {clinic.branches && clinic.branches.length > 1 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-stone-600 font-medium">
                        Studio Location *
                      </Label>
                      <Select
                        value={branchId}
                        onValueChange={setBranchId}
                        required
                      >
                        <SelectTrigger className="bg-white border-stone-200 rounded-xl h-12 focus:border-emerald-600">
                          <SelectValue placeholder="Select studio location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clinic.branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="preferredDate"
                      className="text-xs uppercase tracking-wider text-stone-600 font-medium"
                    >
                      Preferred Date *
                    </Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="bg-white border-stone-200 rounded-xl h-12 focus:border-emerald-600"
                      onChange={(e) => {
                        setDateError(
                          checkTemplateDateValidity(
                            e.target.value,
                            openDays,
                            blockedDates,
                          ),
                        );
                      }}
                    />
                    {dateError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 pt-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {dateError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-stone-600 font-medium">
                    Practitioner
                  </Label>
                  <Select value={dentistId} onValueChange={setDentistId}>
                    <SelectTrigger className="bg-white border-stone-200 rounded-xl h-12 focus:border-emerald-600">
                      <SelectValue placeholder="Any Available Practitioner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">
                        Any Available Practitioner
                      </SelectItem>
                      {clinic.users?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                          {d.specialization ? ` – ${d.specialization}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="additionalConcern"
                    className="text-xs uppercase tracking-wider text-stone-600 font-medium"
                  >
                    Notes or Considerations
                  </Label>
                  <Textarea
                    id="additionalConcern"
                    name="additionalConcern"
                    rows={3}
                    placeholder="Any specific requests or sensitivities..."
                    className="bg-white border-stone-200 rounded-xl resize-none focus:border-emerald-600"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-6 text-sm font-medium tracking-wide mt-3 cursor-pointer shadow-xs transition-all hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-emerald-200" />
                      Submitting reservation...
                    </>
                  ) : (
                    "Confirm Visit Reservation"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-[#fafaf9] text-stone-500 py-12 px-6 lg:px-12 border-t border-stone-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <span className="font-medium text-stone-900 text-base">
              {clinic.name}
            </span>
            {(socialLinks.length > 0 || activePhones.length > 0) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {activePhones.map((phone, idx) => (
                  <a
                    key={`f-phone-${idx}`}
                    href={`tel:${phone}`}
                    className="hover:text-emerald-700 transition-colors flex items-center gap-1.5 text-xs"
                  >
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>{phone}</span>
                  </a>
                ))}
                {socialLinks.map((link, idx) => {
                  const Icon = PlatformIcon[link.platform] || LinkIcon;
                  return (
                    <a
                      key={`f-social-${idx}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-emerald-700 transition-colors flex items-center gap-1.5 text-xs"
                    >
                      <Icon className="w-3 h-3 text-stone-400" />
                      <span>{link.label ?? link.platform}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-stone-400 text-xs text-center md:text-right">
            {(data.footerText as string) ||
              "© 2024 Minimal Dental Studio. Simplicity, precision, and mindful care."}
          </p>
        </div>
      </footer>
    </div>
  );
}
