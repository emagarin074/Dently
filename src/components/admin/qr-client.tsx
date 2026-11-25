"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Download,
  Printer,
  ExternalLink,
  ClipboardCheck,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  publicUrl: string;
  registrationUrl: string;
  clinicSlug: string;
  initialTab?: "intake" | "booking";
}

export function QrPageClient({
  publicUrl,
  registrationUrl,
  clinicSlug,
  initialTab = "intake",
}: Props) {
  const [activeTab, setActiveTab] = useState<"intake" | "booking">(initialTab);
  const intakeQrRef = useRef<HTMLDivElement>(null);
  const bookingQrRef = useRef<HTMLDivElement>(null);

  const activeUrl = activeTab === "intake" ? registrationUrl : publicUrl;

  function handleCopyLink() {
    navigator.clipboard.writeText(activeUrl);
    toast.success(
      activeTab === "intake"
        ? "Patient intake questionnaire link copied"
        : "Public website booking link copied",
    );
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const currentRef = activeTab === "intake" ? intakeQrRef : bookingQrRef;
    const svg = currentRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download =
        activeTab === "intake"
          ? `${clinicSlug}-patient-intake-qr.png`
          : `${clinicSlug}-public-website-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "intake" | "booking")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 print:hidden mb-6">
          <TabsTrigger value="intake" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span>Patient Intake Questionnaire</span>
          </TabsTrigger>
          <TabsTrigger value="booking" className="gap-2">
            <Globe className="h-4 w-4" />
            <span>Public Website & Booking</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Patient Intake & Health Questionnaire */}
        <TabsContent value="intake" className="space-y-6">
          <Card className="print:shadow-none print:border-none">
            <CardContent className="flex flex-col items-center gap-6 py-10">
              <div
                ref={intakeQrRef}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <QRCode value={registrationUrl} size={220} />
              </div>

              <div className="space-y-1.5 text-center max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Self-Registration & Medical History Form
                </div>
                <p className="text-xl font-bold text-slate-900">
                  Scan to Register & Answer Questionnaire
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Patients scan this QR code with their mobile phone to create
                  their profile and fill out their health questionnaire before
                  treatment.
                </p>
                <p className="mt-2 break-all px-4 font-mono text-xs text-slate-500 bg-slate-50 py-1.5 rounded-lg border border-slate-200/80">
                  {registrationUrl}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3 print:hidden">
            <Button onClick={handleDownload} className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 sm:flex-none"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Standee
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button
              variant="ghost"
              asChild
              className="flex-1 sm:flex-none text-primary hover:text-primary"
            >
              <a
                href={registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview Form
              </a>
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm print:hidden space-y-2">
            <p className="font-semibold text-slate-800">
              How Patient Intake Works
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
              <li>
                Place this QR standee at your clinic front desk or waiting area.
              </li>
              <li>
                When a new patient arrives, they scan the QR code using their
                smartphone camera.
              </li>
              <li>
                They enter their contact details and answer the digital{" "}
                <strong>Health Questionnaire</strong> (allergies, medical
                conditions, medications).
              </li>
              <li>
                Once submitted, a new patient record with their complete health
                questionnaire automatically appears in your{" "}
                <strong>Patients</strong> tab.
              </li>
            </ol>
          </div>
        </TabsContent>

        {/* Tab 2: Public Website & Booking */}
        <TabsContent value="booking" className="space-y-6">
          <Card className="print:shadow-none print:border-none">
            <CardContent className="flex flex-col items-center gap-6 py-10">
              <div
                ref={bookingQrRef}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <QRCode value={publicUrl} size={220} />
              </div>

              <div className="space-y-1.5 text-center max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold mb-1">
                  <Globe className="h-3.5 w-3.5" />
                  Public Booking Portal
                </div>
                <p className="text-xl font-bold text-slate-900">
                  Scan to Visit Website & Book Appointment
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Patients scan this to browse clinic services, meet doctors,
                  check branch schedules, and book appointments online.
                </p>
                <p className="mt-2 break-all px-4 font-mono text-xs text-slate-500 bg-slate-50 py-1.5 rounded-lg border border-slate-200/80">
                  {publicUrl}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3 print:hidden">
            <Button onClick={handleDownload} className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 sm:flex-none"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button
              variant="ghost"
              asChild
              className="flex-1 sm:flex-none text-primary hover:text-primary"
            >
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Website
              </a>
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm print:hidden space-y-1">
            <p className="font-semibold text-slate-800">How to use</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Print this QR code for your clinic front door, flyers, business
              cards, or social media posts. If your clinic has multiple
              branches, patients choose their preferred branch and doctor
              directly in the booking form.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
