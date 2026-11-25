"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Users,
  CreditCard,
  ClipboardList,
  Zap,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  Search,
  Clock,
  LayoutDashboard,
  Globe,
  Sparkles,
  Palette,
  ShieldCheck,
  QrCode,
} from "lucide-react";

const featureTabs = [
  {
    id: "scheduling",
    label: "Scheduler & Queue",
    title: "Smart online booking & live clinic queue",
    description:
      "Empower patients to book online and track their status in real-time. Automatically manage appointments and walk-in flows seamlessly.",
    points: [
      "Online booking links for patients",
      "Real-time walk-in queue numbers",
      "Daily queue numbers automatically reset",
      "Dentist calendar blocking & availability",
    ],
    icon: Calendar,
  },
  {
    id: "website",
    label: "Public Clinic Website",
    title: "Your clinic's own patient-facing website",
    description:
      "Every clinic gets an elegant, fully customizable public website where patients can explore services, view dentist profiles, check branch hours, and book appointments directly online.",
    points: [
      "Custom clinic URL (dently.app/clinic/your-clinic)",
      "Built-in no-code website builder & modern templates",
      "Direct 24/7 online patient booking & service catalog",
      "Custom branding: logos, colors, reviews & FAQs",
    ],
    icon: Globe,
  },
  {
    id: "odontogram",
    label: "Procedure Builder & Odontogram",
    title: "Visual tooth tracking & custom procedures",
    description:
      "Configure procedures dynamically with price guidelines, tooth selection, and surface specs. Dental charts update live on interaction.",
    points: [
      "Adult and child tooth arches support",
      "Click-to-select individual teeth & surfaces",
      "Dynamic price configuration",
      "Auto-fill procedural templates on save",
    ],
    icon: ClipboardList,
  },
  {
    id: "records",
    label: "Smart Patient Records",
    title: "Comprehensive medical history & forms",
    description:
      "Maintain immutable patient profiles. Automatically generate signed consent forms, medical certificates, and prescriptions from custom templates.",
    points: [
      "Secure digital health questionnaires",
      "Complete patient treatment history log",
      "Auto-generated prescriptions & certificates",
      "Digital signature consent templates",
    ],
    icon: Users,
  },
  {
    id: "billing",
    label: "Flexible Billing & Reports",
    title: "Procedure-based invoicing & revenue tracking",
    description:
      "Manage clinic cash flow easily. Charge procedures, configure partial/installment schedules, and track dentist earnings dynamically.",
    points: [
      "Procedurally itemized checkout sheets",
      "Support for down payments & installments",
      "Dentist commission & performance reports",
      "Daily revenue and collections tracking",
    ],
    icon: CreditCard,
  },
];

const plans = [
  {
    name: "Starter",
    price: "₱999",
    period: "/month",
    description: "Perfect for solo practitioners",
    features: [
      "1 dentist",
      "Up to 200 patients/month",
      "Branded public website for patients",
      "Online booking & calendar",
      "Basic reports",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Clinic",
    price: "₱2,499",
    period: "/month",
    description: "For growing dental clinics",
    features: [
      "Up to 5 dentists",
      "Unlimited patients",
      "Custom public website & templates",
      "All features included",
      "Email notifications",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large clinics and chains",
    features: [
      "Unlimited dentists",
      "Multi-branch website directory",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

interface MockupScalerProps {
  children: React.ReactNode;
  designWidth: number;
  designHeight: number;
}

function MockupScaler({
  children,
  designWidth,
  designHeight,
}: MockupScalerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth =
          containerRef.current.parentElement?.clientWidth || 0;
        if (parentWidth < designWidth) {
          setScale(parentWidth / designWidth);
        } else {
          setScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [designWidth]);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center overflow-hidden py-4 select-none"
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: `${designWidth}px`,
          height: `${designHeight * scale}px`,
          transition: "transform 0.1s ease-out",
        }}
        className="flex-shrink-0"
      >
        {children}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("scheduling");
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([14, 16]);
  const [schedSubTab, setSchedSubTab] = useState<"schedule" | "queue">(
    "schedule",
  );
  const [recordSubTab, setRecordSubTab] = useState<
    "docs" | "timeline" | "questionnaire"
  >("docs");
  const [activeDoc, setActiveDoc] = useState<"rx" | "consent" | "cert">("rx");
  const [selectedSurface, setSelectedSurface] = useState<string>("MOD");
  const [bookingService, setBookingService] = useState<string>("cleaning");
  const [billingView, setBillingView] = useState<"installments" | "invoice">(
    "installments",
  );

  const toggleTooth = (num: number) => {
    if (selectedTeeth.includes(num)) {
      setSelectedTeeth(selectedTeeth.filter((t) => t !== num));
    } else {
      setSelectedTeeth([...selectedTeeth, num]);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-400" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Globe className="h-3.5 w-3.5" />
            Built for modern dental practices · Includes your public clinic
            website
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            The all-in-one platform
            <br />
            <span className="text-primary">for dental clinics</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Manage appointments, patients, billing, documents, and reports — all
            in one place. Plus, every clinic gets its own{" "}
            <strong>dedicated, custom-branded public website</strong> so
            patients can discover services and book appointments online 24/7.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · 14-day free trial
          </p>

          {/* App Preview Mockup */}
          {/* App Preview Mockup */}
          <MockupScaler designWidth={1024} designHeight={600}>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col text-left h-[600px] w-[1024px] bg-slate-50">
              {/* Browser Header */}
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto flex max-w-sm flex-1 items-center justify-center rounded-lg bg-white px-3 py-1 border border-slate-100 text-xs text-muted-foreground select-none">
                  dently.app/clinic/luna-dental-care/admin
                </div>
                <div className="w-12" />
              </div>

              {/* Application Shell */}
              <div className="flex flex-1 overflow-hidden bg-slate-50">
                {/* Sidebar */}
                <aside className="flex w-52 flex-col border-r border-slate-200/60 bg-white p-4 space-y-6">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-3.5 w-3.5"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M12 2C9.5 2 8 4 8 6c0 1.5.5 2.5 1 3.5C8 11 7 13 7 15c0 3 2 5 5 5s5-2 5-5c0-2-1-4-2-5.5.5-1 1-2 1-3.5C16 4 14.5 2 12 2z" />
                      </svg>
                    </div>
                    Dently
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors">
                      <Calendar className="h-4 w-4" />
                      Scheduler
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors">
                      <Users className="h-4 w-4" />
                      Patients
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors">
                      <ClipboardList className="h-4 w-4" />
                      Procedures
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors">
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors">
                      <Zap className="h-4 w-4" />
                      Queue
                    </div>
                  </div>
                </aside>

                {/* Main Content Pane */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Good morning, Dr. Santos
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Luna Dental Care · July 16, 2026
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <div className="w-48 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-muted-foreground">
                          Search patients...
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center font-bold text-xs text-primary">
                        MS
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Widgets */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Today&apos;s Revenue
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          ₱12,500
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          +12.4%
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Active Patients
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          18
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium">
                          scheduled
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Active Queue
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          4
                        </span>
                        <span className="text-[9px] text-cyan-600 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded-md">
                          Waiting
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detail Lists Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Today's appointments */}
                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-primary" />
                          Today&apos;s Appointments
                        </h4>
                        <span className="text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                          View calendar
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:shadow-sm transition-shadow">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-gray-900">
                              Juan dela Cruz
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Procedure: Root Canal (09:00 AM)
                            </p>
                          </div>
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-bold text-primary">
                            Dr. Santos
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:shadow-sm transition-shadow">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-gray-900">
                              Maria Clarissa
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Procedure: Dental Cleaning (10:30 AM)
                            </p>
                          </div>
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-bold text-primary">
                            Dr. Santos
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:shadow-sm transition-shadow">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-gray-900">
                              Carlos Reyes
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Procedure: Braces Checkup (01:00 PM)
                            </p>
                          </div>
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700">
                            Dr. Cruz
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active Queue Tracker */}
                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-cyan-500" />
                          Live Clinic Queue
                        </h4>
                        <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                          Live
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-gray-700">
                              #03
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-gray-900">
                                Liza Gomez
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Checked in 12m ago
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                            WAITING
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                              #02
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-gray-900">
                                Juan dela Cruz
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Began treatment 15m ago
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-800">
                            TREATMENT
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 font-mono">
                              #01
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-gray-900">
                                Ramon Ramos
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Procedure finished
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                            PAYMENT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MockupScaler>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary font-mono">
              Core Platform Features
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 sm:text-4xl">
              Everything your clinic needs
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Dently streamlines all aspects of your dental practice. Click
              through the tabs below to explore our detailed visual guides.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Tabs Navigation (Left) */}
            <div className="lg:col-span-5 space-y-4">
              {featureTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-6 rounded-2xl border transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${isActive ? "bg-primary text-white" : "bg-slate-50 text-muted-foreground"}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-700"}`}
                      >
                        {tab.label}
                      </span>
                    </div>
                    {isActive && (
                      <div className="mt-4 space-y-3.5 animate-page-fade">
                        <p className="text-sm font-semibold text-gray-900">
                          {tab.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tab.description}
                        </p>
                        <ul className="grid grid-cols-1 gap-2 pt-2">
                          {tab.points.map((p) => (
                            <li
                              key={p}
                              className="flex items-center gap-2 text-xxs font-medium text-gray-600"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mockup Preview (Right) */}
            <div className="lg:col-span-7 w-full max-w-2xl mx-auto rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[480px] sm:min-h-[520px]">
              {/* TAB 1: SCHEDULER & QUEUE */}
              {activeTab === "scheduling" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade space-y-4">
                  <div className="space-y-3.5">
                    {/* Header bar with sub-tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">
                            Dr. Santos&apos;s Operatory 1
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            · BGC Branch
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          July 16, 2026 · 8 appointments scheduled today
                        </p>
                      </div>

                      {/* Sub-tab switcher */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setSchedSubTab("schedule")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            schedSubTab === "schedule"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Schedule View
                        </button>
                        <button
                          type="button"
                          onClick={() => setSchedSubTab("queue")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            schedSubTab === "queue"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Live Queue (#04)
                        </button>
                      </div>
                    </div>

                    {schedSubTab === "schedule" ? (
                      /* Detailed Schedule Timeline */
                      <div className="space-y-2">
                        <div className="flex gap-2.5 items-center p-2 rounded-xl bg-cyan-50/70 border border-cyan-100/80">
                          <span className="text-[11px] text-cyan-900 font-mono font-bold w-16 text-right">
                            09:00 AM
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-cyan-950 truncate">
                                Juan dela Cruz
                              </p>
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Confirmed
                              </span>
                            </div>
                            <p className="text-[11px] text-cyan-800 truncate mt-0.5">
                              Root Canal Obturation (#14) · Operatory 1 · ₱8,500
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[11px] text-slate-500 font-mono font-bold w-16 text-right">
                            10:15 AM
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                Maria Clarissa
                              </p>
                              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                Checked In · Queue #03
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              Ultrasonic Scaling & Deep Prophylaxis · Chair 2
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-center p-2 rounded-xl bg-purple-50/70 border border-purple-100/80">
                          <span className="text-[11px] text-purple-900 font-mono font-bold w-16 text-right">
                            11:30 AM
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-purple-950 truncate">
                                Carlos Reyes
                              </p>
                              <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                In Treatment · Queue #02
                              </span>
                            </div>
                            <p className="text-[11px] text-purple-800 truncate mt-0.5">
                              Surgical Molar Extraction (#38) · Local Anesthesia
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[11px] text-slate-500 font-mono font-bold w-16 text-right">
                            02:00 PM
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                Sarah Jenkins
                              </p>
                              <span className="text-[10px] font-semibold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                                Online Booking
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              Porcelain Veneers Consultation · 6 Units
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Live Queue Board */
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl border border-purple-200/80 bg-purple-50/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 text-white font-mono font-bold text-xs shadow-2xs">
                              #02
                            </span>
                            <div>
                              <p className="text-xs font-bold text-purple-950">
                                Carlos Reyes
                              </p>
                              <p className="text-[11px] text-purple-700">
                                In Treatment · Operatory 1 (Elapsed: 24 mins)
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                            Dr. Santos
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-blue-200/80 bg-blue-50/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-mono font-bold text-xs shadow-2xs">
                              #03
                            </span>
                            <div>
                              <p className="text-xs font-bold text-blue-950">
                                Maria Clarissa
                              </p>
                              <p className="text-[11px] text-blue-700">
                                In Consultation · Chair 2 (Elapsed: 8 mins)
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                            Dr. Reyes
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white font-mono font-bold text-xs shadow-2xs">
                              #04
                            </span>
                            <div>
                              <p className="text-xs font-bold text-amber-950">
                                Juan dela Cruz
                              </p>
                              <p className="text-[11px] text-amber-700">
                                Waiting in Lobby · Checked in via QR at 08:52 AM
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-[10px] font-bold bg-amber-600 text-white px-2.5 py-1 rounded-md shadow-xs hover:bg-amber-700"
                          >
                            Call Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scheduler Footer Bar */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-primary" />
                      Automatic daily reset · Lobby QR intake synced
                    </span>
                    <span className="font-semibold text-primary">
                      {schedSubTab === "schedule"
                        ? "8 of 10 Slots Booked"
                        : "3 Active in Queue"}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: PUBLIC CLINIC WEBSITE */}
              {activeTab === "website" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade space-y-3.5">
                  <div className="space-y-3">
                    {/* Browser Address Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-red-400" />
                          <div className="h-2 w-2 rounded-full bg-amber-400" />
                          <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-mono">
                          <Globe className="h-3 w-3 text-emerald-600" />
                          <span>dently.app/clinic/luna-dental-care</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Patient View
                      </span>
                    </div>

                    {/* Website Hero Card */}
                    <div className="rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-700 p-3.5 text-white shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xs text-white">
                            L
                          </div>
                          <span className="text-xs font-bold tracking-tight">
                            Luna Dental Care
                          </span>
                        </div>
                        <span className="text-[10px] bg-white text-slate-900 font-bold px-2 py-0.5 rounded-full shadow-xs">
                          ★ 4.9 (340+ Reviews)
                        </span>
                      </div>
                      <p className="text-xs font-extrabold tracking-tight">
                        Modern, gentle dentistry for your entire family
                      </p>
                      <p className="text-[10px] text-white/80 mt-0.5">
                        Online Booking · Pain-Free Care · BGC & Makati Clinics
                      </p>
                    </div>

                    {/* Interactive 3-Step Booking Demonstration */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Step 1: Choose a Dental Service
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setBookingService("cleaning")}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            bookingService === "cleaning"
                              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                              : "border-slate-200/80 bg-slate-50/60 hover:bg-white"
                          }`}
                        >
                          <p className="text-[11px] font-bold text-slate-900">
                            Cleaning & Checkup
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Prophylaxis · 45m
                          </p>
                          <p className="text-[11px] font-bold text-primary mt-0.5">
                            ₱1,200
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingService("whitening")}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            bookingService === "whitening"
                              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                              : "border-slate-200/80 bg-slate-50/60 hover:bg-white"
                          }`}
                        >
                          <p className="text-[11px] font-bold text-slate-900">
                            Laser Whitening
                          </p>
                          <p className="text-[10px] text-slate-500">
                            1-Hour Session
                          </p>
                          <p className="text-[11px] font-bold text-primary mt-0.5">
                            ₱4,500
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingService("aligners")}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            bookingService === "aligners"
                              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                              : "border-slate-200/80 bg-slate-50/60 hover:bg-white"
                          }`}
                        >
                          <p className="text-[11px] font-bold text-slate-900">
                            Clear Aligners
                          </p>
                          <p className="text-[10px] text-slate-500">
                            3D Smile Scan
                          </p>
                          <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                            Free Consult
                          </p>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-700">
                            Dentist & Branch:{" "}
                          </span>
                          <span className="text-slate-900 font-bold">
                            Dr. Maria Santos · BGC Branch
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <span className="bg-primary text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                            Today 2:00 PM
                          </span>
                          <span className="bg-white border text-slate-600 font-medium px-1.5 py-0.5 rounded text-[10px]">
                            3:30 PM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Website Footer Bar */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Automatic SMS & WhatsApp booking confirmations
                    </span>
                    <span className="font-bold text-primary">
                      No App Download Needed
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: PROCEDURE BUILDER & ODONTOGRAM */}
              {activeTab === "odontogram" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade space-y-3.5">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Interactive Dual-Arch Odontogram
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Click any tooth to configure dynamic clinical
                          procedures
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                          Surface:
                        </span>
                        {["O", "MOD", "MO", "DO"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSurface(s)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                              selectedSurface === s
                                ? "bg-primary text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upper Arch */}
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1 font-mono">
                        Upper Maxillary Arch
                      </p>
                      <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 max-w-lg mx-auto justify-items-center">
                        {[
                          18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25,
                          26, 27, 28,
                        ].map((num) => {
                          const isSelected = selectedTeeth.includes(num);
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => toggleTooth(num)}
                              className={`flex flex-col items-center justify-center h-8 w-5 sm:h-9 sm:w-6 rounded-md border transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary text-white font-bold ring-2 ring-primary/30 scale-105 shadow-xs"
                                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <span className="text-[8px] font-mono">
                                {num}
                              </span>
                              <div
                                className={`h-1.5 w-1 rounded-xs mt-0.5 ${
                                  isSelected ? "bg-white" : "bg-slate-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lower Arch */}
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1 font-mono">
                        Lower Mandibular Arch
                      </p>
                      <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 max-w-lg mx-auto justify-items-center">
                        {[
                          48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35,
                          36, 37, 38,
                        ].map((num) => {
                          const isSelected = selectedTeeth.includes(num);
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => toggleTooth(num)}
                              className={`flex flex-col items-center justify-center h-8 w-5 sm:h-9 sm:w-6 rounded-md border transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary text-white font-bold ring-2 ring-primary/30 scale-105 shadow-xs"
                                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div
                                className={`h-1.5 w-1 rounded-xs mb-0.5 ${
                                  isSelected ? "bg-white" : "bg-slate-300"
                                }`}
                              />
                              <span className="text-[8px] font-mono">
                                {num}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Procedure Builder Dynamic Specification Panel */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                          Selected Teeth:{" "}
                          {selectedTeeth.map((t) => `#${t}`).join(", ") ||
                            "None"}
                        </span>
                        <span className="text-[11px] font-bold text-primary font-mono">
                          Total: ₱
                          {selectedTeeth.length > 0
                            ? (selectedTeeth.length * 9500).toLocaleString()
                            : "0"}
                          .00
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Procedure Template
                          </p>
                          <p className="font-bold text-slate-900 mt-0.5">
                            Zirconia Crown ({selectedSurface})
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Base + Lab Fee
                          </p>
                          <p className="font-bold text-emerald-700 mt-0.5">
                            ₱8,000 + ₱1,500 Lab
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Odontogram Footer */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Auto-populates invoices & digital consent forms
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold shadow-xs"
                    >
                      Attach to Treatment Plan
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: SMART PATIENT RECORDS (Detailed EDR Demo) */}
              {activeTab === "records" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade space-y-3.5">
                  <div className="space-y-3">
                    {/* Patient Header with Health Alerts */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white text-xs font-bold shadow-2xs">
                          JD
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                              Juan dela Cruz
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              #PT-2026-0418
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            32-year old Male · Blood: O+ · +63 917 890 1234
                          </p>
                        </div>
                      </div>

                      {/* Medical alert badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          ⚠️ Penicillin Allergy
                        </span>
                        <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Hypertension
                        </span>
                      </div>
                    </div>

                    {/* Record Sub-Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setRecordSubTab("docs")}
                        className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          recordSubTab === "docs"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Clinical Documents (3)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordSubTab("timeline")}
                        className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          recordSubTab === "timeline"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Treatment History
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordSubTab("questionnaire")}
                        className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          recordSubTab === "questionnaire"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Intake Form (Verified)
                      </button>
                    </div>

                    {/* Sub-tab 1: Clinical Documents & Rx Preview */}
                    {recordSubTab === "docs" && (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* Document List */}
                        <div className="sm:col-span-5 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveDoc("rx")}
                            className={`w-full text-left p-2 rounded-lg border transition-all ${
                              activeDoc === "rx"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200/70 bg-white hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="truncate">
                                Rx_Amoxicillin.pdf
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold">
                                Signed
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Auto-generated prescription
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveDoc("consent")}
                            className={`w-full text-left p-2 rounded-lg border transition-all ${
                              activeDoc === "consent"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200/70 bg-white hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="truncate">
                                RootCanal_Consent.pdf
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold">
                                Signed
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Tablet digital signature
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveDoc("cert")}
                            className={`w-full text-left p-2 rounded-lg border transition-all ${
                              activeDoc === "cert"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200/70 bg-white hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="truncate">
                                Med_Certificate.pdf
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold">
                                Issued
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Fit to work certification
                            </p>
                          </button>
                        </div>

                        {/* Detailed Document Pad Preview */}
                        <div className="sm:col-span-7 rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex flex-col justify-between">
                          {activeDoc === "rx" && (
                            <div className="space-y-1.5 text-slate-800">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                <div>
                                  <p className="text-[11px] font-bold text-slate-900">
                                    Dr. Maria Santos, DMD
                                  </p>
                                  <p className="text-[9px] text-slate-500 font-mono">
                                    PRC: 0087412 · S2: 849201
                                  </p>
                                </div>
                                <span className="text-[10px] font-bold text-primary font-mono">
                                  Rx #8841
                                </span>
                              </div>
                              <div className="text-[10px] leading-relaxed pt-1">
                                <p className="font-bold text-slate-900">
                                  Rx: Amoxicillin 500mg Capsules
                                </p>
                                <p className="text-slate-600 mt-0.5">
                                  Sig: 1 cap TID (every 8 hrs) for 7 days after
                                  meals
                                </p>
                                <p className="text-slate-600">
                                  Dispense: #21 (Twenty-one) capsules
                                </p>
                              </div>
                              <div className="border-t border-dashed border-slate-200 pt-1.5 mt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                                <span>PRC Verified Electronic Seal</span>
                                <span className="text-emerald-700 font-bold">
                                  ✓ Signed
                                </span>
                              </div>
                            </div>
                          )}

                          {activeDoc === "consent" && (
                            <div className="space-y-1.5 text-slate-800">
                              <div className="border-b border-slate-200 pb-1.5">
                                <p className="text-[11px] font-bold text-slate-900">
                                  Surgical & Endodontic Consent
                                </p>
                                <p className="text-[9px] text-slate-500">
                                  Luna Dental Care · BGC Branch
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-600 leading-relaxed pt-1">
                                Patient was briefed on treatment risks, local
                                anesthesia, and postoperative care for Tooth
                                #14.
                              </p>
                              <div className="border-t border-dashed border-slate-200 pt-1.5 mt-2 flex items-center justify-between text-[9px] text-slate-500">
                                <span>Patient Signature on iPad</span>
                                <span className="font-mono text-emerald-700 font-bold">
                                  Jul 16, 2026 08:55 AM
                                </span>
                              </div>
                            </div>
                          )}

                          {activeDoc === "cert" && (
                            <div className="space-y-1.5 text-slate-800">
                              <div className="border-b border-slate-200 pb-1.5">
                                <p className="text-[11px] font-bold text-slate-900">
                                  Medical Certificate
                                </p>
                                <p className="text-[9px] text-slate-500">
                                  To whom it may concern
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-600 leading-relaxed pt-1">
                                This certifies that Juan dela Cruz underwent
                                dental surgery on Jul 16, 2026 and is advised 2
                                days rest.
                              </p>
                              <div className="border-t border-dashed border-slate-200 pt-1.5 mt-2 flex items-center justify-between text-[9px] text-slate-500">
                                <span>Clinic Stamp Affixed</span>
                                <span className="font-mono text-emerald-700 font-bold">
                                  Dr. Maria Santos
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 2: Treatment History Timeline */}
                    {recordSubTab === "timeline" && (
                      <div className="space-y-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-slate-200/60">
                          <div>
                            <span className="font-bold text-slate-900">
                              Root Canal Obturation (#14)
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Dr. Maria Santos · Gutta-percha seal
                            </p>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            ₱8,500
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-slate-200/60">
                          <div>
                            <span className="font-bold text-slate-900">
                              Digital Panoramic X-Ray
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Dr. Maria Santos · 1 DICOM scan attached
                            </p>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            ₱1,200
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-slate-200/60">
                          <div>
                            <span className="font-bold text-slate-900">
                              Ultrasonic Scaling & Prophylaxis
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Dr. Alex Reyes · Full mouth cleaning
                            </p>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            ₱1,200
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 3: Health Questionnaire */}
                    {recordSubTab === "questionnaire" && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-[11px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Blood Pressure
                            </span>
                            <p className="font-bold text-slate-900">
                              120/80 mmHg (Normal)
                            </p>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Bleeding Disorders
                            </span>
                            <p className="font-bold text-emerald-700">
                              None Reported
                            </p>
                          </div>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Known Allergies
                          </span>
                          <p className="font-bold text-rose-700">
                            Penicillin & Cephalosporins
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono text-right">
                          Verified via Lobby QR Tablet at 08:52 AM
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Patient Records Footer */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Immutable clinical history · HIPAA & DPA compliant
                    </span>
                    <span className="font-bold text-primary">
                      All Documents Exportable to PDF
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 5: FLEXIBLE BILLING & REPORTS */}
              {activeTab === "billing" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade space-y-3.5">
                  <div className="space-y-3">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">
                            Invoice #INV-2026-0894
                          </h4>
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Partially Paid
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Patient: Juan dela Cruz · Date: July 16, 2026
                        </p>
                      </div>

                      {/* Billing View Toggle */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setBillingView("installments")}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            billingView === "installments"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Installment Plan
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingView("invoice")}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            billingView === "invoice"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Itemized Bill
                        </button>
                      </div>
                    </div>

                    {billingView === "installments" ? (
                      /* Installment Schedule Demonstration */
                      <div className="space-y-2.5">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">
                              Total Invoice Amount:
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              ₱11,000.00
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>₱3,000.00 collected (27%)</span>
                              <span className="font-semibold text-rose-600">
                                ₱8,000.00 remaining
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: "27%" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Scheduled Payments */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
                            <div>
                              <span className="font-bold text-emerald-900">
                                Downpayment (Paid)
                              </span>
                              <p className="text-[10px] text-emerald-700">
                                Cash receipt #RC-1048 · Jul 16
                              </p>
                            </div>
                            <span className="font-mono font-bold text-emerald-800">
                              ₱3,000.00
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                            <div>
                              <span className="font-bold text-slate-900">
                                Installment 1 of 3
                              </span>
                              <p className="text-[10px] text-slate-500">
                                Due Aug 16, 2026 · Auto-reminder set
                              </p>
                            </div>
                            <span className="font-mono font-bold text-slate-900">
                              ₱2,666.67
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                            <div>
                              <span className="font-bold text-slate-900">
                                Installment 2 of 3
                              </span>
                              <p className="text-[10px] text-slate-500">
                                Due Sep 16, 2026
                              </p>
                            </div>
                            <span className="font-mono font-bold text-slate-900">
                              ₱2,666.67
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Itemized Invoice View */
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-slate-800 py-1 border-b border-slate-200/60">
                          <span>Root Canal Obturation (Molar #14)</span>
                          <span className="font-mono font-bold">₱8,500.00</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-800 py-1 border-b border-slate-200/60">
                          <span>Composite Core Buildup</span>
                          <span className="font-mono font-bold">₱2,200.00</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-800 py-1 border-b border-slate-200/60">
                          <span>Periapical Digital X-Ray (2x)</span>
                          <span className="font-mono font-bold">₱800.00</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-700 py-1 border-b border-slate-200/60">
                          <span>Clinic Loyalty Discount</span>
                          <span className="font-mono font-bold">-₱500.00</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1">
                          <span>Total Amount Due</span>
                          <span className="font-mono text-sm text-primary">
                            ₱11,000.00
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Billing Footer */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Dr. Santos production: 40% split (₱4,400.00)
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                    >
                      Collect Next Payment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Public Clinic Website Spotlight */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 via-cyan-50/20 to-white border-y border-slate-200/60 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100/70 border border-cyan-200/80 px-3.5 py-1 text-xs font-bold text-cyan-900 mb-4">
              <Globe className="h-3.5 w-3.5 text-cyan-600" />
              PATIENT-FACING CLINIC WEBSITE INCLUDED
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl lg:text-5xl">
              Every clinic gets its own{" "}
              <span className="text-primary">custom website</span> for patients
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Never get lost in generic directories. Your practice receives a
              dedicated, mobile-optimized public website where patients can
              explore procedures, meet your dentists, and book appointments
              24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Value Props (Left 5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-primary shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Your Own Clinic Web Address
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Share your custom link (
                      <span className="font-mono text-primary font-semibold">
                        dently.app/clinic/your-name
                      </span>
                      ) on Google Maps, Instagram, TikTok, and appointment
                      reminder cards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Direct 24/7 Online Patient Booking
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Patients pick their required procedure, preferred doctor,
                      and ideal date and time without endless back-and-forth
                      phone calls.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Built-in No-Code Website Builder
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Customize your brand colors, banner messaging, doctor
                      bios, accepted HMOs, and patient reviews in seconds — zero
                      coding skills needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Multi-Branch & Doctor Profiles
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Showcase multiple clinic branches, operating hours,
                      emergency hotlines, and dentist specializations all under
                      one cohesive brand.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Preview (Right 7 Cols) */}
            <div className="lg:col-span-7">
              <div className="relative mx-auto rounded-3xl border border-slate-300/80 bg-white shadow-2xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="mx-auto flex max-w-sm flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1 border border-slate-200 text-xs text-slate-600 font-mono">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>dently.app/clinic/luna-dental-care</span>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full hidden sm:inline">
                    Live Patient Portal
                  </span>
                </div>

                {/* Patient Website Mockup Canvas */}
                <div className="p-4 sm:p-6 space-y-5 bg-gradient-to-b from-slate-50/50 to-white">
                  {/* Public Navbar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        L
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm tracking-tight leading-none">
                          Luna Dental Care
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
                          Modern & Gentle Dentistry
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <span>Services</span>
                      <span>Dentists</span>
                      <span>Locations</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs shadow-xs flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>Book Online</span>
                    </div>
                  </div>

                  {/* Public Hero Banner */}
                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
                    <div className="max-w-md space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/10">
                        Makati & BGC Clinics
                      </span>
                      <h4 className="text-lg sm:text-xl font-extrabold tracking-tight">
                        Experience Gentle, World-Class Dental Care
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Schedule comprehensive checkups, teeth whitening, root
                        canals, and braces with our board-certified dental team.
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-200">
                      <span className="bg-white/10 px-2 py-0.5 rounded-md">
                        ⭐ 4.9 Rating (150+ reviews)
                      </span>
                      <span className="bg-white/10 px-2 py-0.5 rounded-md">
                        🕒 Open Mon-Sat 9AM - 6PM
                      </span>
                    </div>
                  </div>

                  {/* Procedure Highlights */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h5 className="text-xs font-bold text-slate-900">
                        Featured Dental Services
                      </h5>
                      <span className="text-[11px] font-semibold text-primary">
                        View all services &rarr;
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                        <div className="h-6 w-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs mb-2">
                          ✨
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          Preventive Cleaning
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Deep scaling & stain polish
                        </p>
                        <p className="text-xs font-bold text-primary mt-2">
                          ₱1,200 · 45 mins
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                        <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mb-2">
                          🦷
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          Laser Teeth Whitening
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Immediate 4-shade lift
                        </p>
                        <p className="text-xs font-bold text-primary mt-2">
                          ₱4,500 · 60 mins
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                        <div className="h-6 w-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs mb-2">
                          📐
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          Clear Aligners & Braces
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Custom digital 3D scans
                        </p>
                        <p className="text-xs font-bold text-primary mt-2">
                          Free Consultation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Footer Bar */}
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-medium text-slate-700">
                        Patients can book directly from their phone or computer
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-primary">
                      Powered by Dently Multi-Tenant Architecture
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">
              Choose the plan that fits your clinic.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link
                      href={
                        plan.name === "Enterprise"
                          ? "/contact"
                          : `/register?plan=${plan.name}`
                      }
                    >
                      {plan.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
              Get in touch
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              We&apos;d love to hear from you. Send us a message and our team
              will get back to you shortly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 max-w-5xl mx-auto items-start">
            <div className="space-y-8 lg:pr-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    hello@dently.app
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We reply within 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    +63 (2) 8888-8888
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mon-Fri from 9am to 6pm.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <h4 className="font-semibold text-gray-900">
                  Looking for a customized demo?
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  We can set up a personalized walk-through of Dently tailored
                  to your practice size and workflows.
                </p>
              </div>
            </div>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-first">First Name</Label>
                      <Input id="contact-first" placeholder="Juan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-last">Last Name</Label>
                      <Input id="contact-last" placeholder="dela Cruz" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="juan@clinic.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      rows={4}
                      placeholder="Tell us about your clinic..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">
            Ready to modernize your clinic?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Join dental clinics using Dently to streamline their operations.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/pricing">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
