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
  Sparkles,
  Zap,
  Star,
  Link as LinkIcon,
  AlertCircle,
  Flame,
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

export function BoldTemplate({
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
    { label: "Services", sectionId: "services" },
    { label: "Transformations", sectionId: "about" },
    { label: "FAQ", sectionId: "faqs" },
    { label: "Contact", sectionId: "contact" },
  ];

  const mainHeading = (data.heroHeadingMain as string) || "UNLEASH YOUR";
  const highlightHeading =
    (data.heroHeadingHighlight as string) || "MOST CONFIDENT,\nRADIANT SMILE.";
  const heroCtaText = (data.heroCtaText as string) || "TRANSFORM MY SMILE";
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
    { label: "3D Smile Preview", checked: true },
    { label: "Same-Day Results", checked: true },
    { label: "Financing Available", checked: true },
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
        toast.success("Appointment request locked in!");
      }
    } catch {
      toast.error(
        "Network error while submitting appointment request. Please try again.",
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
        toast.success("Message sent! Our team will get back to you fast.");
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      toast.error("Network error while sending message. Please try again.");
    } finally {
      setInquiryLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Ambient Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-600/15 via-orange-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {((data.logoType as string) || "text") === "image" &&
            data.logoImage ? (
              <Image
                src={data.logoImage as string}
                alt={clinic.name}
                width={130}
                height={40}
                className="h-10 w-auto object-contain brightness-110"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                  {(() => {
                    const LogoIcon =
                      TemplateIconMap[
                        (data.logoIcon as string) || "Sparkles"
                      ] || Sparkles;
                    return <LogoIcon className="w-5 h-5" />;
                  })()}
                </div>
                <span
                  className={`text-xl font-black tracking-tight text-white ${(data.logoFont as string) || "font-sans"}`}
                >
                  {(data.logoText as string) || clinic.name}
                </span>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={`#${link.sectionId}`}
                onClick={(e) => handleTemplateScroll(e, link.sectionId)}
                className="text-xs uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-colors"
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
              <Button className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 shadow-lg shadow-rose-600/25 transition-all hover:scale-105">
                BOOK NOW <Zap className="w-3.5 h-3.5 ml-1 fill-white" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section: High Voltage & Energetic */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-28">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-8">
            {/* Electric Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-950/80 to-orange-950/80 border border-rose-500/40 text-rose-400 text-xs font-bold tracking-wider uppercase shadow-lg shadow-rose-950/50">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>
                {(data.heroBadgeText as string) || "NEXT-GEN SMILE STUDIO"}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300">
                {(data.heroBadgeSub as string) || "100% Digital • Fast Results"}
              </span>
            </div>

            {/* High-Impact Display Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              {mainHeading}{" "}
              <span className="block mt-2 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 bg-clip-text text-transparent whitespace-pre-wrap">
                {highlightHeading}
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-zinc-300 max-w-xl font-normal leading-relaxed whitespace-pre-wrap">
              {(data.heroSubheading as string) ||
                "High-impact cosmetic dentistry, rapid smile transformations, and 3D precision technology built for results that turn heads."}
            </p>

            {/* CTA & Social Proof */}
            <div className="pt-2 space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={`#${heroCtaSection}`}
                  onClick={(e) => handleTemplateScroll(e, heroCtaSection)}
                >
                  <Button className="rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-black px-9 py-6 text-base uppercase tracking-wider shadow-xl shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer">
                    {heroCtaText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a
                  href="#services"
                  onClick={(e) => handleTemplateScroll(e, "services")}
                >
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-7 py-6 text-base tracking-wide"
                  >
                    EXPLORE SERVICES
                  </Button>
                </a>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
                  <span className="text-white font-black text-sm">
                    {(data.heroTrustCount as string) || "10,000+"}
                  </span>{" "}
                  {(data.heroTrustText as string) || "Smiles Transformed"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Dynamic Frame */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-zinc-900 shadow-2xl border-2 border-white/15">
              <Image
                src={
                  (data.heroImage as string) ||
                  "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80"
                }
                alt="Bold Smile Transformation"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Glowing Accent Badge */}
            <div className="absolute -bottom-6 -left-6 bg-zinc-900/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-rose-500/40 max-w-[260px]">
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">
                  3D Smile Preview
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-snug">
                Visualize your dream smile in photorealistic 3D before starting
                treatment.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="absolute -right-4 top-8 space-y-2 hidden sm:block">
              {heroPills.map((pill, idx) => (
                <div
                  key={idx}
                  className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl shadow-xl border border-white/15 text-xs font-bold text-white flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        className="py-24 px-6 lg:px-12 bg-zinc-950 border-y border-white/10 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
              TRANSFORMATIONAL PROCEDURES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {(data.servicesHeading as string) || "POWERFUL SMILE SOLUTIONS"}
            </h2>
            <p className="text-zinc-400 text-base font-normal">
              {(data.servicesSubheading as string) ||
                "State-of-the-art procedures designed for dramatic, long-lasting aesthetic and functional transformations."}
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
                    className="group bg-[#121216] border border-white/10 hover:border-rose-500/50 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-rose-950/30"
                  >
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-rose-600/30 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-3">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-6 mt-6 border-t border-white/10">
                      <button
                        type="button"
                        className="text-xs font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        onClick={(e) => handleTemplateScroll(e, "booking")}
                      >
                        BOOK PROCEDURE <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-zinc-500 text-center col-span-full py-12">
                No procedures listed yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* About Section: High Contrast Transformation */}
      <section id="about" className="py-28 px-6 lg:px-12 bg-[#09090b]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-2xl">
              <Image
                src={
                  (data.aboutImage as string) ||
                  "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80"
                }
                alt="Clinic Studio"
                fill
                className="object-cover"
              />
            </div>
            {/* Stat Callout */}
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-rose-600 to-orange-500 p-6 rounded-3xl shadow-xl text-white max-w-xs hidden sm:block">
              <span className="text-4xl font-black block">100%</span>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-100 mt-1">
                Digital Workflow & Instant Visualizations
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
              INNOVATION & CRAFTSMANSHIP
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {(data.aboutHeading as string) ||
                "THE FUTURE OF DENTISTRY IS HERE"}
            </h2>
            <div className="text-zinc-300 text-base leading-relaxed space-y-4 whitespace-pre-wrap">
              {(data.aboutContent as string) ||
                "We don't do boring, old-fashioned dentistry. We are a high-performance cosmetic dental studio equipped with cutting-edge 3D scanners, instant smile previews, and pain-free laser technology.\n\nWhether you need a full celebrity smile makeover, rapid clear aligners, or urgent dental care, our elite team delivers unmatched results with precision and speed."}
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <span className="text-2xl font-black text-rose-400 block">
                  3D Tech
                </span>
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Precise Simulations
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <span className="text-2xl font-black text-orange-400 block">
                  0% Anxiety
                </span>
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Gentle Laser Care
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <span className="text-2xl font-black text-amber-400 block">
                  Fast Track
                </span>
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Same-Day Services
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section
        id="faqs"
        className="py-24 px-6 lg:px-12 bg-zinc-950 border-t border-white/10"
      >
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
              GOT QUESTIONS?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {(data.faqHeading as string) || "FREQUENTLY ASKED QUESTIONS"}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {((data.faqItems as { q: string; a: string }[]) || []).map(
              (faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="bg-[#121216] border border-white/10 rounded-2xl px-6 py-1 data-[state=open]:border-rose-500/50"
                >
                  <AccordionTrigger className="text-left text-base font-bold text-white hover:text-rose-400 hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 text-sm leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ),
            )}
          </Accordion>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-24 px-6 lg:px-12 bg-[#09090b] border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
                  READY TO CONNECT?
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  {(data.contactHeading as string) || "GET IN TOUCH"}
                </h2>
                <p className="text-zinc-400 text-base">
                  {(data.contactSubheading as string) ||
                    "Ready to kickstart your smile transformation? Send us a direct message."}
                </p>
              </div>

              <div className="space-y-6 pt-4">
                {clinic.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0 text-rose-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                        STUDIO LOCATION
                      </h4>
                      <p className="text-sm text-zinc-400 mt-0.5">
                        {clinic.address}
                      </p>
                    </div>
                  </div>
                )}

                {clinic.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0 text-rose-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                        DIRECT EMAIL
                      </h4>
                      <p className="text-sm text-zinc-400 mt-0.5">
                        {clinic.email}
                      </p>
                    </div>
                  </div>
                )}

                {(socialLinks.length > 0 || activePhones.length > 0) && (
                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                      PHONE & SOCIAL
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {activePhones.map((phone, idx) => (
                        <a
                          key={`phone-${idx}`}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-rose-400" />
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
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors"
                          >
                            <Icon className="w-3.5 h-3.5 text-rose-400" />
                            {link.label ?? link.platform}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dark Sleek Inquiry Form */}
            <div className="lg:col-span-7 bg-[#121216] border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-white">
                  Send a Direct Message
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  We respond via your preferred contact channel within 24 hours.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleInquirySubmit}>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Full Name *
                  </Label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. Alex Morgan"
                    className="bg-black/60 border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-rose-500/20"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Email Address
                    </Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="alex@example.com"
                      className="bg-black/60 border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-rose-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Phone Number
                    </Label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="bg-black/60 border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Message *
                  </Label>
                  <Textarea
                    name="message"
                    required
                    placeholder="What procedure are you interested in?"
                    rows={4}
                    className="bg-black/60 border-white/10 rounded-xl text-white placeholder:text-zinc-600 resize-none focus:border-rose-500 focus:ring-rose-500/20"
                  />
                </div>
                <Button
                  disabled={inquiryLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-black py-5 text-sm uppercase tracking-wider shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  {inquiryLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    "SUBMIT INQUIRY"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section
        id="booking"
        className="py-24 px-6 lg:px-12 bg-zinc-950 border-t border-white/10"
      >
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
              PRIORITY SCHEDULING
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {(data.bookingHeading as string) || "LOCK IN YOUR APPOINTMENT"}
            </h2>
            <p className="text-sm text-zinc-400">
              {(data.bookingSubheading as string) ||
                "Spots fill quickly. Claim your personalized consultation today."}
            </p>
          </div>

          <div className="bg-[#121216] border border-white/15 rounded-3xl p-8 md:p-12 shadow-2xl">
            {submitted ? (
              <div className="text-center py-12 space-y-5">
                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto border border-rose-500">
                  <CheckCircle2 className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-3xl font-black text-white">
                  APPOINTMENT RECEIVED!
                </h3>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                  You are one step closer to your dream smile. Our team will
                  contact you shortly to confirm your scheduled slot.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="mt-4 rounded-xl border-white/20 text-white hover:bg-white/10 text-xs font-black tracking-wider uppercase px-6 py-3"
                >
                  Book Another Session
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="fullName"
                      className="text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      Patient Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Juan dela Cruz"
                      required
                      className="bg-black/60 border-white/15 rounded-xl text-white py-5 focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contactNumber"
                      className="text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      Phone Number *
                    </Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="+63 912 345 6789"
                      required
                      className="bg-black/60 border-white/15 rounded-xl text-white py-5 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-wider text-zinc-300"
                  >
                    Email Address (Optional)
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan@email.com"
                    className="bg-black/60 border-white/15 rounded-xl text-white py-5 focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Desired Procedure *
                    </Label>
                    <Select value={service} onValueChange={setService} required>
                      <SelectTrigger className="bg-black/60 border-white/15 rounded-xl text-white h-12 focus:border-rose-500">
                        <SelectValue placeholder="Select procedure..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {clinic.procedures?.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="General Consultation">
                          Smile Consultation
                        </SelectItem>
                        <SelectItem value="Other">Other Treatment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {clinic.branches && clinic.branches.length > 1 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Branch Location *
                      </Label>
                      <Select
                        value={branchId}
                        onValueChange={setBranchId}
                        required
                      >
                        <SelectTrigger className="bg-black/60 border-white/15 rounded-xl text-white h-12 focus:border-rose-500">
                          <SelectValue placeholder="Select branch..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
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
                      className="text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      Preferred Date *
                    </Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="bg-black/60 border-white/15 rounded-xl text-white h-12 focus:border-rose-500"
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
                      <p className="flex items-center gap-1.5 text-xs text-rose-400 pt-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {dateError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Preferred Dentist
                  </Label>
                  <Select value={dentistId} onValueChange={setDentistId}>
                    <SelectTrigger className="bg-black/60 border-white/15 rounded-xl text-white h-12 focus:border-rose-500">
                      <SelectValue placeholder="First Available Specialist" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="no-preference">
                        First Available Specialist
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
                    className="text-xs font-bold uppercase tracking-wider text-zinc-300"
                  >
                    Goals or Concerns
                  </Label>
                  <Textarea
                    id="additionalConcern"
                    name="additionalConcern"
                    rows={3}
                    placeholder="Tell us what you'd like to improve about your smile..."
                    className="bg-black/60 border-white/15 rounded-xl text-white placeholder:text-zinc-600 resize-none focus:border-rose-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-black py-6 text-base uppercase tracking-wider shadow-xl shadow-rose-600/30 mt-3 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
                      LOCKING IN APPOINTMENT...
                    </>
                  ) : (
                    "CONFIRM MY APPOINTMENT"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-zinc-400 py-12 px-6 lg:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <span className="font-black text-white text-lg">{clinic.name}</span>
            {(socialLinks.length > 0 || activePhones.length > 0) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {activePhones.map((phone, idx) => (
                  <a
                    key={`f-phone-${idx}`}
                    href={`tel:${phone}`}
                    className="hover:text-rose-400 transition-colors flex items-center gap-1.5 text-xs font-bold text-zinc-300"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
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
                      className="hover:text-rose-400 transition-colors flex items-center gap-1.5 text-xs font-bold text-zinc-300"
                    >
                      <Icon className="w-3.5 h-3.5 text-rose-500" />
                      <span>{link.label ?? link.platform}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-zinc-600 text-xs text-center md:text-right">
            {(data.footerText as string) ||
              "© 2024 Bold Smile Studio. High-performance dentistry. All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}
