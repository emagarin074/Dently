import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service | Dently",
  description:
    "Review the Terms of Service governing the use of Dently Dental Practice Management Platform.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "August 31, 2026";

  return (
    <div className="py-16 sm:py-24 bg-slate-50/50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Header Banner */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-bold tracking-wide uppercase">
            <FileText className="h-3.5 w-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Please read these terms carefully before creating a workspace or
            using Dently Dental Practice Management Platform.
          </p>
          <p className="text-xs text-slate-400 font-mono">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Main Terms Document Body */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 space-y-10 text-slate-700 leading-relaxed text-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">1.</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, registering an account, or using the Dently platform
              (&quot;Dently&quot;, &quot;we&quot;, &quot;our&quot;, or
              &quot;us&quot;), you (&quot;Subscriber&quot;, &quot;Clinic
              Administrator&quot;, &quot;Dentist&quot;, or &quot;User&quot;)
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, you must discontinue the use of our services
              immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">2.</span>
              <span>Description of Service & Multi-Tenancy</span>
            </h2>
            <p>
              Dently is a multi-tenant Software-as-a-Service (SaaS) dental
              clinic management platform providing patient records management,
              odontogram charting, appointment booking, queue systems, billing
              schedules, document generation, and clinic website hosting.
            </p>
            <p>
              Each clinic operates as an isolated tenant workspace. Dently
              maintains strict logical data separation between clinics using
              unique tenant identifiers.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">3.</span>
              <span>Account Registration & Responsibilities</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Authorized Representatives:</strong> You must be a
                licensed dentist, dental clinic owner, or authorized staff
                member to register and manage a clinic workspace.
              </li>
              <li>
                <strong>Account Confidentiality:</strong> You are responsible
                for safeguarding your login credentials and ensuring all clinic
                staff members keep their passwords secure.
              </li>
              <li>
                <strong>Accuracy of Data:</strong> You represent and warrant
                that all professional license numbers, contact details, and
                clinic credentials provided are accurate and valid.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">4.</span>
              <span>Subscriptions, Trials, & Manual Payments</span>
            </h2>
            <div className="space-y-2">
              <p>
                <strong>14-Day Free Trial:</strong> All new clinics receive an
                automatic 14-day free trial upon workspace creation. No payment
                information is required to start a trial.
              </p>
              <p>
                <strong>Subscription Fees & Plans:</strong> Following your
                trial, continued access requires an active subscription (Starter
                Plan at ₱999/month or Clinic Plan at ₱2,499/month, or custom
                Enterprise pricing).
              </p>
              <p>
                <strong>Payment Methods:</strong> Subscription payments are
                processed manually via GCash, Maya, or Philippine bank transfer
                (BDO, BPI, UnionBank). Upon sending proof of payment, platform
                administrators will activate or extend your plan validity.
              </p>
              <p>
                <strong>Suspension & Cancellation:</strong> If a subscription
                expires without renewal, Dently reserves the right to suspend
                clinic portal access. You may cancel your subscription at any
                time by contacting support.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">5.</span>
              <span>Patient Data & Health Information Confidentiality</span>
            </h2>
            <p>
              Dently respects the doctor-patient relationship and
              dentist-patient confidentiality:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <Shield className="h-4 w-4" />
                <span>You Own Your Data</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your clinic retains 100% ownership of all patient charts,
                clinical notes, odontograms, diagnosis records, and financial
                invoices entered into Dently. Dently acts solely as a secure
                data processor under the Philippine Data Privacy Act of 2012 (RA
                10173).
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">6.</span>
              <span>Prohibited Uses</span>
            </h2>
            <p>You agree not to use Dently to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>
                Engage in unauthorized access, reverse engineering, or
                penetration testing against platform servers.
              </li>
              <li>Upload malicious code, viruses, or disruptive scripts.</li>
              <li>
                Violate medical licensing laws or practice dentistry without
                valid regulatory permits.
              </li>
              <li>Misrepresent your identity or clinic credentials.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">7.</span>
              <span>Limitation of Liability & Medical Disclaimer</span>
            </h2>
            <p>
              <strong>Not Medical Advice:</strong> Dently is an administrative
              and record-keeping software tool. Dently does not provide medical
              diagnoses, treatment advice, or prescriptions. All clinical
              decisions remain the sole professional responsibility of the
              attending licensed dentist.
            </p>
            <p>
              <strong>Service Availability:</strong> We strive for 99.9% uptime
              and perform automated backups, but Dently is provided &quot;as
              is&quot; without warranties of uninterrupted operation.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-indigo-600 font-mono text-sm">8.</span>
              <span>Contact Information</span>
            </h2>
            <p>
              For legal inquiries, questions about these Terms, or subscription
              assistance, please reach out to us:
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Dently Platform Operations</strong>
              </p>
              <p>
                Email:{" "}
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
            href="/privacy"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Read our Privacy Policy</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold">
            <Link href="/pricing">View Plans & Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
