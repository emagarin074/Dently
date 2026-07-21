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
  FileText,
  CreditCard,
  BarChart3,
  ClipboardList,
  Shield,
  Smartphone,
  Zap,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  Search,
  Clock,
  LayoutDashboard,
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
      "Booking & Calendar",
      "Basic Reports",
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
      "Multi-branch support",
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
            <Zap className="h-3.5 w-3.5" />
            Built for modern dental clinics
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            The all-in-one platform
            <br />
            <span className="text-primary">for dental clinics</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Manage appointments, patients, billing, documents, and reports — all
            in one place. Built for multi-tenant SaaS: each clinic gets its own
            isolated workspace.
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
            <div className="lg:col-span-7 aspect-auto sm:aspect-[4/3] w-full max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[340px] sm:min-h-[380px]">
              {activeTab === "scheduling" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Dr. Santos&apos;s Scheduler
                        </h4>
                        <p className="text-xxs text-muted-foreground mt-0.5">
                          July 16, 2026
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xxs font-bold animate-pulse flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                        Auto-sync
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex gap-3 items-center">
                        <span className="text-xxs text-muted-foreground font-bold w-12 text-right">
                          09:00 AM
                        </span>
                        <div className="flex-1 bg-cyan-50 border border-cyan-100 rounded-lg p-2.5 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-cyan-800">
                              Juan dela Cruz
                            </p>
                            <p className="text-xxs text-cyan-700">
                              Root Canal Consultation
                            </p>
                          </div>
                          <span className="text-xxs font-semibold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md">
                            Pending
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        <span className="text-xxs text-muted-foreground font-bold w-12 text-right">
                          10:00 AM
                        </span>
                        <div className="flex-1 bg-violet-50 border border-violet-100 rounded-lg p-2.5 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-violet-800">
                              Maria Clarissa
                            </p>
                            <p className="text-xxs text-violet-700">
                              Prophylaxis (Cleaning)
                            </p>
                          </div>
                          <span className="text-xxs font-semibold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-md">
                            Confirmed
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        <span className="text-xxs text-muted-foreground font-bold w-12 text-right">
                          11:00 AM
                        </span>
                        <div className="flex-1 bg-rose-50 border border-rose-100 rounded-lg p-2.5 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-rose-800">
                              Carlos Reyes
                            </p>
                            <p className="text-xxs text-rose-700">
                              Tooth Extraction
                            </p>
                          </div>
                          <span className="text-xxs font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                            In Progress
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xxs text-muted-foreground">
                    <span>Active Queue: #04 in waiting room</span>
                    <button className="text-primary font-bold hover:underline">
                      Open Queue Board &rarr;
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "odontogram" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Interactive Odontogram Chart
                        </h4>
                        <p className="text-xxs text-muted-foreground mt-0.5">
                          Click teeth below to select for treatment
                        </p>
                      </div>
                    </div>

                    <div className="py-2">
                      <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider text-center mb-3">
                        Upper Dental Arch (Maxillary)
                      </p>

                      <div className="grid grid-cols-8 gap-1 sm:gap-2 max-w-sm mx-auto justify-items-center">
                        {[
                          18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25,
                          26, 27, 28,
                        ].map((num) => {
                          const isSelected = selectedTeeth.includes(num);
                          return (
                            <button
                              key={num}
                              onClick={() => toggleTooth(num)}
                              className={`flex flex-col items-center justify-center h-8 w-6 sm:h-10 sm:w-8 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-sm text-primary font-bold ring-2 ring-primary/20 scale-105"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              <span className="text-[8px] sm:text-[9px]">
                                {num}
                              </span>
                              <div
                                className={`h-1.5 w-1 sm:h-2.5 sm:w-2 rounded-t-sm mt-1 border ${
                                  isSelected
                                    ? "bg-primary/40 border-primary"
                                    : "bg-slate-100 border-slate-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Selected Teeth:
                      </p>
                      <p className="text-xs font-bold text-primary">
                        {selectedTeeth.length > 0
                          ? selectedTeeth.map((t) => `#${t}`).join(", ")
                          : "None selected"}
                      </p>
                    </div>
                    <span className="rounded-lg bg-primary text-white text-xxs font-bold px-2.5 py-1 select-none">
                      Configure Procedures
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "records" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Patient Profile: Juan dela Cruz
                        </h4>
                        <p className="text-xxs text-muted-foreground mt-0.5">
                          32-year old Male · Active Record
                        </p>
                      </div>
                      <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xxs font-bold text-primary">
                        No allergies
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-2">
                        <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">
                          Clinical Documents
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between bg-white border border-slate-100 p-1.5 rounded text-xxs">
                            <span className="truncate max-w-[120px]">
                              Rx_Amoxicillin.pdf
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Signed
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white border border-slate-100 p-1.5 rounded text-xxs">
                            <span className="truncate max-w-[120px]">
                              Consent_Form.pdf
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Signed
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                        <p className="text-xxs font-bold text-primary flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Auto-Generated Rx
                        </p>
                        <div className="text-[9px] text-slate-700 leading-relaxed border-t border-slate-100 pt-1">
                          <strong>Rx:</strong> Amoxicillin 500mg <br />
                          <strong>Sig:</strong> 1 cap TID for 7 days <br />
                          <strong>Qty:</strong> 21 capsules <br />
                          <div className="border-t border-dashed border-slate-200 mt-2 pt-1 text-right text-[8px] text-muted-foreground">
                            Signed: Dr. Maria Santos
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xxs text-muted-foreground">
                    <span>Intake Health Form: Verified</span>
                    <button className="text-primary font-bold hover:underline">
                      Edit records &rarr;
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-page-fade">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Checkout Invoice #INV-8839
                        </h4>
                        <p className="text-xxs text-muted-foreground mt-0.5">
                          Itemized billing checklist
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                      <div className="flex justify-between items-center text-xxs text-gray-700">
                        <span>Root Canal Treatment (#14)</span>
                        <span className="font-semibold">₱8,500.00</span>
                      </div>
                      <div className="flex justify-between items-center text-xxs text-gray-700">
                        <span>Topical Anesthetic</span>
                        <span className="font-semibold">₱500.00</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-slate-200 pt-1.5">
                        <span>Subtotal</span>
                        <span>₱9,000.00</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-gray-900">
                        <span>Total Due</span>
                        <span>₱9,000.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Payment Terms
                      </span>
                      <span className="text-xxs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded mt-0.5">
                        3x Monthly Installments
                      </span>
                    </div>
                    <button className="rounded-lg bg-emerald-600 text-white text-xxs font-bold px-3 py-1.5 hover:bg-emerald-700">
                      Collect ₱3,000.00 Down
                    </button>
                  </div>
                </div>
              )}
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
