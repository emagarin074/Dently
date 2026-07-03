import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar, Users, FileText, CreditCard, BarChart3, ClipboardList,
  Shield, Smartphone, Zap, CheckCircle, ArrowRight
} from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Online booking, calendar management, blocked dates, and walk-in queue handling.",
  },
  {
    icon: Users,
    title: "Patient Records",
    description: "Complete patient profiles with health questionnaires, treatment history, and follow-ups.",
  },
  {
    icon: ClipboardList,
    title: "Procedure Builder",
    description: "Configure dental procedures with odontogram, tooth selection, pricing, and auto-document generation.",
  },
  {
    icon: FileText,
    title: "Document Generator",
    description: "Auto-generate consent forms, prescriptions, and medical certificates from templates.",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description: "Full, partial, and installment payments with revenue tracking per dentist.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Daily, weekly, monthly revenue reports with dentist performance tracking.",
  },
  {
    icon: Shield,
    title: "Multi-Tenant Security",
    description: "Each clinic's data is fully isolated. Role-based access for admins and assistants.",
  },
  {
    icon: Smartphone,
    title: "QR Registration",
    description: "Patients scan a QR code to register on-site. No patient login required.",
  },
  {
    icon: Zap,
    title: "Queue Management",
    description: "Tablet-friendly queue display with real-time status updates.",
  },
]

const plans = [
  {
    name: "Starter",
    price: "₱999",
    period: "/month",
    description: "Perfect for solo practitioners",
    features: ["1 dentist", "Up to 200 patients/month", "Booking & Calendar", "Basic Reports"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Clinic",
    price: "₱2,499",
    period: "/month",
    description: "For growing dental clinics",
    features: ["Up to 5 dentists", "Unlimited patients", "All features included", "Email notifications", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large clinics and chains",
    features: ["Unlimited dentists", "Multi-branch support", "Custom integrations", "Dedicated support"],
    cta: "Contact Us",
    popular: false,
  },
]

export default function HomePage() {
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
            Manage appointments, patients, billing, documents, and reports — all in one place.
            Built for multi-tenant SaaS: each clinic gets its own isolated workspace.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required · 14-day free trial</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything your clinic needs</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From the first patient booking to the final payment receipt — Dently handles it all.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">Choose the plan that fits your clinic.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
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
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link href={plan.name === "Enterprise" ? "/contact" : "/register"}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to modernize your clinic?</h2>
          <p className="mt-4 text-primary-foreground/80">
            Join dental clinics using Dently to streamline their operations.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/register">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
