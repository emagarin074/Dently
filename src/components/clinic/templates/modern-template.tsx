"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Check,
  Phone,
  Plane,
  ArrowRight,
  MapPin,
  Mail,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlignCenter,
  Heart,
  Shield,
  Smile,
  Star,
  Link as LinkIcon,
  Activity,
  Microscope,
  Cross,
  Thermometer,
  Baby,
} from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import {
  FaTooth,
  FaSyringe,
  FaStethoscope,
  FaPills,
  FaHospital,
  FaTeeth,
  FaTeethOpen,
  FaPrescriptionBottle,
  FaUserDoctor,
  FaUserNurse,
} from "react-icons/fa6";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClinicData } from "@/components/clinic/public-page";
import { formatCurrency } from "@/lib/utils";
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

interface Props {
  clinic: ClinicData;
  data: Record<string, unknown>;
}

const PlatformIcon: Record<string, React.ElementType> = {
  Facebook: FaFacebook,
  Instagram: FaInstagram,
  Twitter: FaTwitter,
  LinkedIn: FaLinkedin,
  YouTube: FaYoutube,
};

export function ModernTemplate({ clinic, data }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [dentistId, setDentistId] = useState<string>("");
  const [service, setService] = useState<string>("");

  const navLinks =
    (data.navLinks as { label: string; sectionId: string }[]) || [];

  // Helper to split heading highlight
  const mainHeading = (data.heroHeadingMain as string) || "A calmer";
  const highlightHeading =
    (data.heroHeadingHighlight as string) || "dental\nvisit starts here.";

  const services =
    (data.servicesItems as {
      title: string;
      description: string;
      icon: string;
    }[]) || [];
  const faqs = (data.faqItems as { q: string; a: string }[]) || [];
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

  const IconMap: Record<string, React.ElementType> = {
    CheckCircle2,
    Tooth: FaTooth,
    Teeth: FaTeeth,
    TeethOpen: FaTeethOpen,
    Syringe: FaSyringe,
    Stethoscope: FaStethoscope,
    Pills: FaPills,
    Prescription: FaPrescriptionBottle,
    Hospital: FaHospital,
    Doctor: FaUserDoctor,
    Nurse: FaUserNurse,
    Sparkles,
    AlignCenter,
    Heart,
    Shield,
    Smile,
    Star,
    Activity,
    Microscope,
    Cross,
    Thermometer,
    Baby,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set(
      "preferredDentistId",
      dentistId === "no-preference" ? "" : dentistId,
    );
    fd.set("serviceType", service);
    const result = await createPublicBooking(clinic.slug, fd);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setSubmitted(true);
      toast.success("Booking submitted successfully!");
    }
    setLoading(false);
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
    const result = await createInquiry(clinic.slug, fd);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Message sent successfully!");
      (e.target as HTMLFormElement).reset();
    }
    setInquiryLoading(false);
  }

  const handleScroll = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.history.pushState({}, "", `#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {((data.logoType as string) || "text") === "image" &&
          data.logoImage ? (
            <Image
              src={data.logoImage as string}
              alt={clinic.name}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <>
              <div className="text-blue-600 bg-blue-100 p-1.5 rounded-lg">
                {(() => {
                  const LogoIcon =
                    IconMap[(data.logoIcon as string) || "Smile"] || Smile;
                  return <LogoIcon className="w-6 h-6" />;
                })()}
              </div>
              <span
                className={`hidden md:inline text-xl font-bold text-slate-900 ${(data.logoFont as string) || "font-sans"}`}
              >
                {(data.logoText as string) || clinic.name}
              </span>
            </>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={`#${link.sectionId}`}
              onClick={(e) => handleScroll(e, link.sectionId)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a href="#booking" onClick={(e) => handleScroll(e, "booking")}>
            <Button
              variant="secondary"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full font-medium"
            >
              Book an Appointment
              <Phone className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
            <span className="flex items-center text-blue-500 font-semibold text-sm">
              <Plane className="w-4 h-4 mr-1" />
              {data.heroBadgeText as string}
            </span>
            <span className="text-sm text-slate-500">
              {data.heroBadgeSub as string}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900">
            {mainHeading}{" "}
            <span className="text-blue-700 block mt-2 whitespace-pre-wrap">
              {highlightHeading}
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-slate-600 max-w-lg leading-relaxed whitespace-pre-wrap">
            {data.heroSubheading as string}
          </p>

          {/* CTA & Avatars */}
          <div className="space-y-8">
            <a
              href="#booking"
              onClick={(e) => handleScroll(e, "booking")}
              className="inline-block"
            >
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-6 text-lg font-medium shadow-md">
                {(data.heroCtaText as string) || "Book an Appointment"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                <Image
                  src="https://i.pravatar.cc/100?img=33"
                  alt="Dentist 1"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <Image
                  src="https://i.pravatar.cc/100?img=12"
                  alt="Dentist 2"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <Image
                  src="https://i.pravatar.cc/100?img=11"
                  alt="Dentist 3"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 z-10 relative">
                  {data.heroTrustCount as string}
                </div>
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {data.heroTrustText as string}
              </span>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-100 relative shadow-2xl">
            <Image
              src={
                (data.heroImage as string) ||
                "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80"
              }
              alt="Dental procedure"
              fill
              className="object-cover"
            />
          </div>

          {/* Floating Pills */}
          <div className="absolute right-0 bottom-12 transform translate-x-12 space-y-3">
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/20 flex items-center justify-between gap-8 min-w-[200px]">
              <span className="text-slate-800 font-medium flex items-center gap-2">
                <span className="text-slate-400">🦷</span> Teeth Cleaning
              </span>
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-white/40 flex items-center justify-between gap-8 min-w-[200px] opacity-80">
              <span className="text-slate-700 font-medium flex items-center gap-2">
                <span className="text-slate-400">🦷</span> Whitening
              </span>
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-white/50 flex items-center justify-between gap-8 min-w-[200px] opacity-60">
              <span className="text-slate-600 font-medium flex items-center gap-2">
                <span className="text-slate-400">🦷</span> Lost Filling
              </span>
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-slate-50 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">
              {(data.servicesHeading as string) || "Our Services"}
            </h2>
            <p className="text-lg text-slate-600">
              {(data.servicesSubheading as string) ||
                "Comprehensive dental care tailored to your needs."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services && services.length > 0 ? (
              services.map((service, idx) => {
                const IconComponent = IconMap[service.icon] || CheckCircle2;
                return (
                  <div
                    key={idx}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {service.title}
                    </h3>
                    {service.description && (
                      <p className="text-slate-600 mb-6 flex-grow">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto"
                        onClick={(e) => handleScroll(e, "booking")}
                      >
                        Book <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-center col-span-full py-12">
                No services available yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
            <Image
              src={
                (data.aboutImage as string) ||
                "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80"
              }
              alt="About Us"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-slate-900">
              {(data.aboutHeading as string) || "About Us"}
            </h2>
            <div className="prose prose-lg prose-slate text-slate-600 whitespace-pre-wrap">
              {(data.aboutContent as string) ||
                "We believe that a healthy smile is the foundation of overall wellness."}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="bg-slate-50 py-24 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">
              {(data.faqHeading as string) || "Frequently Asked Questions"}
            </h2>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6"
          >
            {((data.faqItems as { q: string; a: string }[]) || []).map(
              (faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border-b-0 border-slate-100 last:border-0"
                >
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900 hover:no-underline hover:text-blue-600 py-6">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base pb-6 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ),
            )}
          </Accordion>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 lg:p-24 text-white grid lg:grid-cols-2 gap-16 shadow-2xl">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold">
                  {(data.contactHeading as string) || "Get in Touch"}
                </h2>
                <p className="text-lg text-slate-400 max-w-md">
                  {(data.contactSubheading as string) ||
                    "We're here to answer any questions you have."}
                </p>
              </div>

              <div className="space-y-8">
                {clinic.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Visit Us</h4>
                      <p className="text-slate-400 leading-relaxed">
                        {clinic.address}
                      </p>
                    </div>
                  </div>
                )}

                {clinic.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Email Us</h4>
                      <p className="text-slate-400">{clinic.email}</p>
                    </div>
                  </div>
                )}

                {(socialLinks.length > 0 || activePhones.length > 0) && (
                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="font-semibold text-lg mb-4">
                      Connect with us
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {activePhones.map((phone, idx) => (
                        <a
                          key={`phone-${idx}`}
                          href={`tel:${phone}`}
                          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                        >
                          <Phone className="w-4 h-4 text-blue-400" />
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
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                          >
                            <Icon className="w-4 h-4 text-blue-400" />
                            {link.label ?? link.platform}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 text-slate-900 shadow-xl">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Send us a message</h3>
                <p className="text-sm text-slate-500">
                  We will reply through the email or phone number you provide.
                </p>
              </div>
              <form className="space-y-6" onSubmit={handleInquirySubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <Input
                    name="name"
                    required
                    placeholder="John Doe"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Message
                  </label>
                  <Textarea
                    name="message"
                    required
                    placeholder="How can we help?"
                    rows={4}
                    className="bg-slate-50 border-slate-200 resize-none"
                  />
                </div>
                <Button
                  disabled={inquiryLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg"
                >
                  {inquiryLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section
        id="booking"
        className="bg-slate-50 py-24 px-6 border-t border-slate-100"
      >
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">
              {(data.bookingHeading as string) || "Ready to Smile?"}
            </h2>
            <p className="text-lg text-slate-600">
              {(data.bookingSubheading as string) ||
                "Book your appointment online today."}
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-100">
            {submitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Booking Received!
                </h3>
                <p className="text-slate-600 text-lg max-w-sm mx-auto">
                  Thank you for your request. Our team will contact you shortly
                  to confirm your appointment.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="mt-4 rounded-xl px-8 py-6 text-lg"
                >
                  Book Another Appointment
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="fullName"
                      className="text-sm font-medium text-slate-700"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Juan dela Cruz"
                      required
                      className="bg-slate-50 border-slate-200 py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="contactNumber"
                      className="text-sm font-medium text-slate-700"
                    >
                      Contact Number *
                    </Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="+63 912 345 6789"
                      required
                      className="bg-slate-50 border-slate-200 py-6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan@email.com (optional)"
                    className="bg-slate-50 border-slate-200 py-6"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Desired Service *
                    </Label>
                    <Select value={service} onValueChange={setService} required>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-14">
                        <SelectValue placeholder="Select a service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clinic.procedures?.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="General Consultation">
                          General Consultation
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="preferredDate"
                      className="text-sm font-medium text-slate-700"
                    >
                      Preferred Date *
                    </Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="bg-slate-50 border-slate-200 h-14"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Preferred Dentist
                  </Label>
                  <Select value={dentistId} onValueChange={setDentistId}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-14">
                      <SelectValue placeholder="No Preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">
                        No Preference
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

                <div className="space-y-2">
                  <Label
                    htmlFor="additionalConcern"
                    className="text-sm font-medium text-slate-700"
                  >
                    Additional Concern
                  </Label>
                  <Textarea
                    id="additionalConcern"
                    name="additionalConcern"
                    rows={4}
                    placeholder="Any specific concerns or questions?"
                    className="bg-slate-50 border-slate-200 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm Appointment"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 text-slate-900 items-center md:items-start">
            <span className="font-bold text-xl">{clinic.name}</span>
            {(socialLinks.length > 0 || activePhones.length > 0) && (
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {activePhones.map((phone, idx) => (
                  <a
                    key={`f-phone-${idx}`}
                    href={`tel:${phone}`}
                    className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">{phone}</span>
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
                      className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">
                        {link.label ?? link.platform}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-slate-500 text-sm text-center md:text-right">
            {(data.footerText as string) ||
              "© 2024 Modern Dental Clinic. All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}
