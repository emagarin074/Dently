import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

const plans = [
  {
    name: "Starter",
    price: "₱999",
    period: "/month",
    description: "Perfect for solo practitioners and small clinics.",
    features: [
      "1 dentist account",
      "Up to 200 patients/month",
      "Online booking",
      "Calendar management",
      "Basic queue",
      "Basic reports",
    ],
    cta: "Start Free Trial",
    href: "/register?plan=Starter",
    popular: false,
  },
  {
    name: "Clinic",
    price: "₱2,499",
    period: "/month",
    description: "For growing dental clinics with multiple staff.",
    features: [
      "Up to 5 dentist accounts",
      "Unlimited patients",
      "Full procedure builder",
      "Odontogram",
      "Document generation",
      "Billing & payments",
      "Email notifications",
      "Revenue reports",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/register?plan=Clinic",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large clinics, chains, and custom integrations.",
    features: [
      "Unlimited dentists",
      "Multi-branch support",
      "Custom SMTP",
      "Custom templates",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Us",
    href: "/contact",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-primary shadow-xl" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            All plans include SSL security, automatic backups, and unlimited
            appointments.{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>{" "}
            for custom pricing.
          </p>
        </div>
      </div>
    </div>
  );
}
