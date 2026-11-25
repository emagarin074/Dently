import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy | Dently",
  description:
    "Learn how Dently protects clinic, staff, and patient health data in compliance with the Philippine Data Privacy Act of 2012.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 31, 2026";

  return (
    <div className="py-16 sm:py-24 bg-slate-50/50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Banner */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Dently is committed to protecting the privacy and confidentiality of
            dental clinics, practitioners, and their patients.
          </p>
          <p className="text-xs text-slate-400 font-mono">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Highlighted Guarantees Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
              RA 10173 Compliant
            </h3>
            <p className="text-xs text-slate-500">
              Designed in full compliance with the Philippine Data Privacy Act
              of 2012.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <EyeOff className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
              Strict Tenant Isolation
            </h3>
            <p className="text-xs text-slate-500">
              Your patient charts and revenue remain strictly confidential to
              your clinic only.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="h-8 w-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
              Never Sold or Shared
            </h3>
            <p className="text-xs text-slate-500">
              We never sell or monetize clinic records, patient data, or
              financial numbers.
            </p>
          </div>
        </div>

        {/* Main Privacy Document Body */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 space-y-10 text-slate-700 leading-relaxed text-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">1.</span>
              <span>Introduction & Scope</span>
            </h2>
            <p>
              This Privacy Policy explains how Dently collects, processes,
              stores, and protects personal data and sensitive personal
              information when dental practitioners, clinic staff, and patients
              interact with the Dently platform.
            </p>
            <p>
              In legal terms under the Data Privacy Act of 2012 (Republic Act
              No. 10173):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>
                <strong>
                  The Clinic is the Personal Information Controller (PIC):
                </strong>{" "}
                You determine the purpose and scope of collecting your
                patients&apos; health information.
              </li>
              <li>
                <strong>
                  Dently is the Personal Information Processor (PIP):
                </strong>{" "}
                We provide secure software infrastructure to process and store
                your clinic data on your behalf.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">2.</span>
              <span>Information We Process</span>
            </h2>
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  A. Clinic & User Account Data
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Name, professional license number, email address, contact
                  phone number, clinic name, clinic address, and encrypted
                  passwords.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  B. Patient Health Records (Entered by Clinic)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Patient full name, contact information, date of birth, medical
                  history, health questionnaire responses, odontogram tooth
                  chartings, treatment history, procedure notes, prescriptions,
                  and billing receipts.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  C. Technical & Log Information
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  IP addresses, browser type, device information, and secure
                  authentication session tokens.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">3.</span>
              <span>How We Use Your Information</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>
                To provide, operate, and maintain clinic tenant workspaces.
              </li>
              <li>
                To facilitate appointment booking, queue tracking, and treatment
                documentation.
              </li>
              <li>
                To generate formal dental documents (Medical Certificates,
                Prescriptions, Consent Forms).
              </li>
              <li>
                To calculate procedure pricing and billing installment
                schedules.
              </li>
              <li>
                To communicate service updates, password resets, and account
                notices.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">4.</span>
              <span>Data Protection & Security Measures</span>
            </h2>
            <p>
              We implement comprehensive organizational, physical, and technical
              security measures to safeguard your information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">
                  Encrypted Transmission
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  All data in transit is encrypted using modern TLS 1.3 / SSL
                  encryption.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">
                  Multi-Tenant Scoping
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  Strict programmatic guards prevent cross-tenant data leaks.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">
                  Password Hashing
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  Passwords are securely salted and hashed with bcrypt (12
                  rounds).
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">
                  Role-Based Access
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  Granular permission controls for Dentist Admins and
                  Assistants.
                </span>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">5.</span>
              <span>Your Data Rights</span>
            </h2>
            <p>
              Under the Philippine Data Privacy Act of 2012, individuals hold
              fundamental rights regarding their personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>
                <strong>Right to be Informed:</strong> To know how your data is
                collected and processed.
              </li>
              <li>
                <strong>Right to Access:</strong> To request copies of your
                stored records.
              </li>
              <li>
                <strong>Right to Rectification:</strong> To correct inaccurate
                or outdated information.
              </li>
              <li>
                <strong>Right to Erasure / Blocking:</strong> To request data
                deletion subject to legal health record retention requirements.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">6.</span>
              <span>Data Protection Officer & Contact</span>
            </h2>
            <p>
              If you have any questions, feedback, or concerns regarding your
              privacy or this policy, please reach out to our team:
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Dently Data Protection & Privacy Team</strong>
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:privacy@dently.app"
                  className="text-indigo-600 hover:underline"
                >
                  privacy@dently.app
                </a>{" "}
                or{" "}
                <a
                  href="mailto:support@dently.app"
                  className="text-indigo-600 hover:underline"
                >
                  support@dently.app
                </a>
              </p>
              <p>
                Website:{" "}
                <a
                  href="https://dently.app"
                  className="text-indigo-600 hover:underline"
                >
                  https://dently.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
          <Link
            href="/terms"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Read our Terms of Service</span>
          </Link>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold">
            <Link href="/pricing">View Plans & Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
