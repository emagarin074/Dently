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
  Star,
  Shield,
  Link as LinkIcon,
  AlertCircle,
  Clock,
  Award,
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

export function ClassicTemplate({
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
    { label: "Specialties", sectionId: "services" },
    { label: "About Clinic", sectionId: "about" },
    { label: "Patient FAQs", sectionId: "faqs" },
    { label: "Contact & Location", sectionId: "contact" },
  ];

  const mainHeading =
    (data.heroHeadingMain as string) || "Dignified care for your";
  const highlightHeading =
    (data.heroHeadingHighlight as string) ||
    "family's lifelong\nhealthy smile.";
  const heroCtaText = (data.heroCtaText as string) || "Schedule Consultation";
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
    { label: "Board Certified Specialists", checked: true },
    { label: "Comfort & Sedation Options", checked: true },
    { label: "Family Heritage Practice", checked: true },
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
        toast.success("Consultation request submitted successfully.");
      }
    } catch {
      toast.error("Network error while submitting request. Please try again.");
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
        toast.success(
          "Thank you. Our patient coordinator will contact you shortly.",
        );
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Network error while sending message. Please try again.");
    } finally {
      setInquiryLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 font-serif selection:bg-amber-100 selection:text-amber-900">
      {/* Top Heritage Accent Bar */}
      <div className="h-1.5 bg-gradient-to-r from-amber-700 via-blue-900 to-amber-700 w-full" />

      {/* Classic Top Header Bar with Contact Quick Links */}
      <div className="border-b border-amber-200/50 bg-[#f4f0e8] text-xs text-slate-700 font-sans hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {clinic.address && (
              <span className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                {clinic.address}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              Comprehensive Dental Practice
            </span>
          </div>
          <div className="flex items-center gap-4">
            {activePhones[0] && (
              <a
                href={`tel:${activePhones[0]}`}
                className="hover:text-amber-800 transition-colors font-medium flex items-center gap-1"
              >
                <Phone className="w-3 h-3 text-amber-700" />
                {activePhones[0]}
              </a>
            )}
            {clinic.email && (
              <a
                href={`mailto:${clinic.email}`}
                className="hover:text-amber-800 transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3 text-amber-700" />
                {clinic.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-amber-100 sticky top-0 z-40 transition-all shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto font-sans">
          <div className="flex items-center gap-3">
            {((data.logoType as string) || "text") === "image" &&
            data.logoImage ? (
              <Image
                src={data.logoImage as string}
                alt={clinic.name}
                width={140}
                height={45}
                className="h-11 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 shadow-xs">
                  {(() => {
                    const LogoIcon =
                      TemplateIconMap[(data.logoIcon as string) || "Shield"] ||
                      Shield;
                    return <LogoIcon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <span
                    className={`block text-xl font-bold font-serif tracking-tight text-blue-950 ${(data.logoFont as string) || "font-serif"}`}
                  >
                    {(data.logoText as string) || clinic.name}
                  </span>
                  <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-800 block -mt-1">
                    Dental Practice & Care
                  </span>
                </div>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={`#${link.sectionId}`}
                onClick={(e) => handleTemplateScroll(e, link.sectionId)}
                className="text-sm font-medium text-slate-700 hover:text-blue-900 transition-colors relative py-1 hover:border-b-2 hover:border-amber-600"
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
              <Button className="bg-blue-950 hover:bg-blue-900 text-amber-100 border border-amber-600/40 rounded-md font-medium px-5 py-2 text-sm shadow-sm transition-all hover:shadow-md">
                Schedule Visit
                <CalendarPlusIcon className="w-4 h-4 ml-1.5 text-amber-400" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f7f4ee] to-[#faf8f5] border-b border-amber-100/70 pt-16 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 space-y-8">
            {/* Heritage Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 font-sans text-xs tracking-wider uppercase font-semibold shadow-2xs">
              <Award className="w-4 h-4 text-amber-700" />
              <span>
                {(data.heroBadgeText as string) || "Established 2005"}
              </span>
              <span className="text-amber-400">•</span>
              <span className="text-amber-800 font-normal">
                {(data.heroBadgeSub as string) ||
                  "Excellence in Dental Medicine"}
              </span>
            </div>

            {/* Prestige Headings */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-blue-950">
                {mainHeading}{" "}
                <span className="italic font-normal text-amber-800 block mt-1">
                  {highlightHeading}
                </span>
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-lg text-slate-700 leading-relaxed font-sans max-w-xl font-light">
              {(data.heroSubheading as string) ||
                "Providing compassionate, board-certified dental healthcare with clinical precision and time-honored dedication to patient comfort."}
            </p>

            {/* CTA & Trust Stats */}
            <div className="pt-2 space-y-6 font-sans">
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={`#${heroCtaSection}`}
                  onClick={(e) => handleTemplateScroll(e, heroCtaSection)}
                >
                  <Button className="bg-blue-950 hover:bg-blue-900 text-white rounded-md px-8 py-6 text-base font-medium shadow-md border-b-2 border-amber-600 transition-all hover:translate-y-[-1px]">
                    {heroCtaText}
                    <ArrowRight className="w-5 h-5 ml-2 text-amber-400" />
                  </Button>
                </a>
                <a
                  href="#services"
                  onClick={(e) => handleTemplateScroll(e, "services")}
                >
                  <Button
                    variant="outline"
                    className="border-slate-300 hover:bg-amber-50 text-slate-800 rounded-md px-6 py-6 text-base"
                  >
                    View Specialties
                  </Button>
                </a>
              </div>

              {/* Classic Stars & Trust Bar */}
              <div className="flex items-center gap-4 pt-4 border-t border-amber-200/60 max-w-md">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-500"
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-600 font-sans">
                  <strong className="text-slate-900 font-semibold">
                    {(data.heroTrustCount as string) || "5,000+"}
                  </strong>{" "}
                  {(data.heroTrustText as string) ||
                    "Families Trusted for Gentle Care"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Portrait Frame */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md">
              {/* Ornate classic backdrop border */}
              <div className="absolute -inset-3 rounded-2xl border-2 border-amber-200/60 -rotate-1 pointer-events-none" />
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white shadow-2xl border-4 border-white ring-1 ring-amber-300/40">
                <Image
                  src={
                    (data.heroImage as string) ||
                    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
                  }
                  alt="Clinical Care"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating Classic Accreditation Plaque */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-xl border border-amber-200/80 max-w-[240px] font-sans">
                <div className="flex items-center gap-2 mb-1.5 text-amber-800">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Clinical Standard
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  Adhering to strict international sterilization & clinical
                  protocols.
                </p>
              </div>

              {/* Floating Feature Pills */}
              <div className="absolute -right-4 top-8 space-y-2 hidden sm:block font-sans">
                {heroPills.map((pill, idx) => (
                  <div
                    key={idx}
                    className="bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-md shadow-md border border-amber-200/70 text-xs font-medium text-slate-800 flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    <span>{pill.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties & Services Section */}
      <section id="services" className="py-24 px-6 bg-[#f4f0e8]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-800 font-sans block">
              Department of Dental Medicine
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-950">
              {(data.servicesHeading as string) ||
                "Clinical Specialties & Services"}
            </h2>
            <div className="w-16 h-0.5 bg-amber-600 mx-auto my-3" />
            <p className="text-base text-slate-600 font-sans font-light">
              {(data.servicesSubheading as string) ||
                "Comprehensive diagnostic, restorative, and preventive care delivered with the highest standard of medicine."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services && services.length > 0 ? (
              services.map((service, idx) => {
                const IconComponent =
                  TemplateIconMap[service.icon] || CheckCircle2;
                return (
                  <div
                    key={idx}
                    className="bg-white p-8 rounded-lg shadow-2xs border border-amber-200/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col group"
                  >
                    <div className="w-12 h-12 rounded-md bg-blue-950 text-amber-400 flex items-center justify-center mb-6 group-hover:bg-amber-800 group-hover:text-amber-100 transition-colors">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-950 mb-3 font-serif">
                      {service.title}
                    </h3>
                    {service.description && (
                      <p className="text-slate-600 mb-6 font-sans text-sm leading-relaxed flex-grow font-light">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-auto pt-4 border-t border-amber-100 font-sans">
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-wider text-amber-800 hover:text-blue-950 flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={(e) => handleTemplateScroll(e, "booking")}
                      >
                        Request Consultation{" "}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-center col-span-full py-12 font-sans">
                No specialties listed yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* About Us & Heritage Section */}
      <section
        id="about"
        className="py-24 px-6 bg-white border-y border-amber-100"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border-4 border-[#faf8f5]">
              <Image
                src={
                  (data.aboutImage as string) ||
                  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80"
                }
                alt="About Practice"
                fill
                className="object-cover"
              />
            </div>
            {/* Heritage Plaque */}
            <div className="absolute -bottom-6 -right-6 bg-blue-950 text-white p-6 rounded-lg shadow-xl max-w-xs border-t-2 border-amber-500 font-sans hidden sm:block">
              <p className="italic font-serif text-amber-200 text-sm mb-2">
                &ldquo;Our philosophy has always been simple: treat every
                patient like our own family.&rdquo;
              </p>
              <span className="text-xs uppercase tracking-widest text-slate-400 block font-semibold">
                Clinical Philosophy
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-800 font-sans block">
              Our Tradition & Principles
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-950">
              {(data.aboutHeading as string) ||
                "A Tradition of Trust & Excellence"}
            </h2>
            <div className="w-12 h-0.5 bg-amber-600 my-2" />
            <div className="text-slate-700 font-sans font-light leading-relaxed space-y-4 whitespace-pre-wrap text-base">
              {(data.aboutContent as string) ||
                "Founded on the core principles of medical integrity and patient-first dedication, our practice combines time-honored clinical experience with modern technological advances.\n\nEvery member of our team is dedicated to listening carefully to your health needs, explaining every option transparently, and ensuring that you and your loved ones feel secure and respected throughout every visit."}
            </div>

            {/* 3 Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-amber-100 font-sans">
              <div className="space-y-1">
                <span className="font-serif font-bold text-blue-950 block text-base">
                  Dignity & Comfort
                </span>
                <p className="text-xs text-slate-600 font-light">
                  Unhurried care tailored to your exact comfort needs.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-serif font-bold text-blue-950 block text-base">
                  Clinical Precision
                </span>
                <p className="text-xs text-slate-600 font-light">
                  State-of-the-art diagnostic and restorative mastery.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-serif font-bold text-blue-950 block text-base">
                  Lifelong Care
                </span>
                <p className="text-xs text-slate-600 font-light">
                  Preventive focus guarding your oral health for decades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient FAQs */}
      <section id="faqs" className="py-24 px-6 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-800 font-sans block">
              Clear & Honest Answers
            </span>
            <h2 className="text-3xl font-bold text-blue-950">
              {(data.faqHeading as string) || "Frequently Asked Questions"}
            </h2>
            <div className="w-12 h-0.5 bg-amber-600 mx-auto my-2" />
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full bg-white rounded-lg shadow-2xs border border-amber-200/60 p-6 divide-y divide-amber-100 font-sans"
          >
            {((data.faqItems as { q: string; a: string }[]) || []).map(
              (faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border-b-0 py-2 first:pt-0 last:pb-0"
                >
                  <AccordionTrigger className="text-left text-base font-serif font-semibold text-blue-950 hover:text-amber-800 hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 font-sans text-sm pb-4 leading-relaxed font-light">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ),
            )}
          </Accordion>
        </div>
      </section>

      {/* Contact & Inquiry Section */}
      <section
        id="contact"
        className="py-24 px-6 bg-[#0a182d] text-white relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-8 font-sans">
              <div className="space-y-3">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400 block">
                  Patient Services Department
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold font-serif text-white">
                  {(data.contactHeading as string) || "Contact Our Practice"}
                </h2>
                <div className="w-12 h-0.5 bg-amber-500 my-2" />
                <p className="text-sm text-slate-300 font-light leading-relaxed">
                  {(data.contactSubheading as string) ||
                    "Our patient care coordinators are here to assist with any inquiries, appointments, or special arrangements."}
                </p>
              </div>

              <div className="space-y-6 pt-4">
                {clinic.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-amber-100">
                        Practice Location
                      </h4>
                      <p className="text-sm text-slate-300 font-light mt-0.5">
                        {clinic.address}
                      </p>
                    </div>
                  </div>
                )}

                {clinic.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-amber-100">
                        Email Correspondence
                      </h4>
                      <p className="text-sm text-slate-300 font-light mt-0.5">
                        {clinic.email}
                      </p>
                    </div>
                  </div>
                )}

                {(socialLinks.length > 0 || activePhones.length > 0) && (
                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="font-serif text-sm font-semibold text-amber-100 mb-3">
                      Direct Telephone & Social
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {activePhones.map((phone, idx) => (
                        <a
                          key={`phone-${idx}`}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-md px-3.5 py-1.5 text-xs text-slate-200"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
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
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-md px-3.5 py-1.5 text-xs text-slate-200"
                          >
                            <Icon className="w-3.5 h-3.5 text-amber-400" />
                            {link.label ?? link.platform}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="lg:col-span-7 bg-[#faf8f5] text-slate-900 rounded-xl p-8 lg:p-10 shadow-2xl border border-amber-200/80 font-sans">
              <div className="mb-6">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 block">
                  Confidential Inquiry
                </span>
                <h3 className="text-2xl font-bold font-serif text-blue-950 mt-1">
                  Send a Direct Message
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  We will reply through the email or phone number you provide.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleInquirySubmit}>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800">
                    Full Name *
                  </Label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. John Doe"
                    className="bg-white border-slate-300 rounded-md focus:border-amber-600 focus:ring-amber-600"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800">
                      Email Address
                    </Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className="bg-white border-slate-300 rounded-md focus:border-amber-600 focus:ring-amber-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800">
                      Phone Number
                    </Label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="bg-white border-slate-300 rounded-md focus:border-amber-600 focus:ring-amber-600"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800">
                    Message / Question *
                  </Label>
                  <Textarea
                    name="message"
                    required
                    placeholder="How may our clinical staff assist you?"
                    rows={4}
                    className="bg-white border-slate-300 rounded-md resize-none focus:border-amber-600 focus:ring-amber-600"
                  />
                </div>
                <Button
                  disabled={inquiryLoading}
                  className="w-full bg-blue-950 hover:bg-blue-900 text-amber-100 rounded-md py-5 font-semibold text-sm border-b-2 border-amber-600 cursor-pointer"
                >
                  {inquiryLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    "Transmit Inquiry"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Booking Section */}
      <section
        id="booking"
        className="py-24 px-6 bg-[#f4f0e8]/60 border-t border-amber-200/60 font-sans"
      >
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-800 block">
              Patient Registration & Booking
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-serif text-blue-950">
              {(data.bookingHeading as string) || "Schedule Your Consultation"}
            </h2>
            <div className="w-16 h-0.5 bg-amber-600 mx-auto my-2" />
            <p className="text-sm text-slate-600 font-light">
              {(data.bookingSubheading as string) ||
                "Select your preferred date and specialist for an unhurried, thorough dental assessment."}
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 md:p-12 shadow-xl border border-amber-200/80">
            {submitted ? (
              <div className="text-center py-12 space-y-5">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-2 border-amber-300">
                  <CheckCircle2 className="w-8 h-8 text-amber-800" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-blue-950">
                  Consultation Request Received
                </h3>
                <p className="text-slate-600 text-sm max-w-sm mx-auto font-light leading-relaxed">
                  Thank you for placing your trust in our practice. Our clinical
                  coordinator will reach out shortly to confirm your scheduled
                  time.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="mt-4 border-amber-600 text-blue-950 hover:bg-amber-50 rounded-md text-xs font-semibold tracking-wider uppercase"
                >
                  Schedule Another Appointment
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="fullName"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Patient Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Juan dela Cruz"
                      required
                      className="bg-[#faf8f5] border-slate-300 rounded-md py-5 focus:border-amber-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contactNumber"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Contact Phone *
                    </Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="+63 912 345 6789"
                      required
                      className="bg-[#faf8f5] border-slate-300 rounded-md py-5 focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold text-slate-800"
                  >
                    Email Address (Optional)
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan@email.com"
                    className="bg-[#faf8f5] border-slate-300 rounded-md py-5 focus:border-amber-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-800">
                      Desired Specialty / Service *
                    </Label>
                    <Select value={service} onValueChange={setService} required>
                      <SelectTrigger className="bg-[#faf8f5] border-slate-300 rounded-md h-12 focus:border-amber-600">
                        <SelectValue placeholder="Select specialty..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clinic.procedures?.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="General Consultation">
                          Comprehensive Examination
                        </SelectItem>
                        <SelectItem value="Other">
                          Other Clinical Care
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {clinic.branches && clinic.branches.length > 1 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-800">
                        Preferred Location / Branch *
                      </Label>
                      <Select
                        value={branchId}
                        onValueChange={setBranchId}
                        required
                      >
                        <SelectTrigger className="bg-[#faf8f5] border-slate-300 rounded-md h-12 focus:border-amber-600">
                          <SelectValue placeholder="Select clinic branch..." />
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
                      className="text-xs font-semibold text-slate-800"
                    >
                      Preferred Consultation Date *
                    </Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="bg-[#faf8f5] border-slate-300 rounded-md h-12 focus:border-amber-600"
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
                  <Label className="text-xs font-semibold text-slate-800">
                    Preferred Clinical Practitioner
                  </Label>
                  <Select value={dentistId} onValueChange={setDentistId}>
                    <SelectTrigger className="bg-[#faf8f5] border-slate-300 rounded-md h-12 focus:border-amber-600">
                      <SelectValue placeholder="No Preference / First Available" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">
                        No Preference (First Available Practitioner)
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
                    className="text-xs font-semibold text-slate-800"
                  >
                    Medical or Dental Notes
                  </Label>
                  <Textarea
                    id="additionalConcern"
                    name="additionalConcern"
                    rows={3}
                    placeholder="Kindly share any relevant symptoms, medical history, or preferences."
                    className="bg-[#faf8f5] border-slate-300 rounded-md resize-none focus:border-amber-600"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-950 hover:bg-blue-900 text-amber-100 rounded-md py-6 text-base font-semibold border-b-2 border-amber-600 transition-all hover:shadow-lg mt-3 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-amber-400" />
                      Registering Request...
                    </>
                  ) : (
                    "Confirm Consultation Booking"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Heritage Footer */}
      <footer className="bg-[#071324] text-slate-300 py-12 px-6 border-t-2 border-amber-600 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <span className="font-serif font-bold text-xl text-white">
              {clinic.name}
            </span>
            <span className="text-xs text-amber-400 tracking-wider uppercase font-semibold">
              Excellence in Dental Medicine
            </span>
            {(socialLinks.length > 0 || activePhones.length > 0) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {activePhones.map((phone, idx) => (
                  <a
                    key={`f-phone-${idx}`}
                    href={`tel:${phone}`}
                    className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
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
                      className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs"
                    >
                      <Icon className="w-3.5 h-3.5 text-amber-500" />
                      <span>{link.label ?? link.platform}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-slate-500 text-xs text-center md:text-right max-w-sm">
            {(data.footerText as string) ||
              "© 2024 Classic Dental Care. Committed to clinical excellence and compassionate healthcare."}
          </p>
        </div>
      </footer>
    </div>
  );
}

function CalendarPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M10 16h4" />
      <path d="M12 14v4" />
    </svg>
  );
}
