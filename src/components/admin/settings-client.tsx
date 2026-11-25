"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  updateClinicInfo,
  updateClinicSettings,
  testClinicSmtp,
} from "@/app/actions/settings";
import {
  updateOperatingDays,
  type ConflictingAppointment,
} from "@/app/actions/calendar";
import { DAYS_OF_WEEK, getOpenDays } from "@/lib/operating-days";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  Send,
  Loader2,
  ArrowRight,
  Zap,
  Layers,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import {
  CompensationListClient,
  ProgramRecordUI,
} from "@/components/admin/compensation/compensation-list-client";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  settings: {
    brandColor: string;
    appointmentLeadDays: number;
    queueWorkflow?: "FULL_WORKFLOW" | "SIMPLE_QUEUE" | "DIRECT_TREATMENT";
    maxBookingsPerDay: number | null;
    autoConfirmBookings: boolean;
    revenueFormula: string | null;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPassword: string | null;
    smtpFromEmail: string | null;
    smtpFromName: string | null;
    operatingHours?: unknown;
  } | null;
  compensationPrograms?: ProgramRecordUI[];
}

export function SettingsClient({
  clinic,
  clinicSlug,
  defaultTab = "info",
}: {
  clinic: Clinic;
  clinicSlug: string;
  defaultTab?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [queueWorkflow, setQueueWorkflow] = useState<
    "FULL_WORKFLOW" | "SIMPLE_QUEUE" | "DIRECT_TREATMENT"
  >(clinic.settings?.queueWorkflow ?? "FULL_WORKFLOW");
  const [autoConfirm, setAutoConfirm] = useState(
    clinic.settings?.autoConfirmBookings ?? false,
  );
  const [selectedOpenDays, setSelectedOpenDays] = useState<number[]>(() =>
    getOpenDays(clinic.settings?.operatingHours),
  );
  const [opDaysLoading, setOpDaysLoading] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  async function handleTestSmtp(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;

    setTestingSmtp(true);
    try {
      const result = await testClinicSmtp(clinicSlug, new FormData(form));
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else if ("message" in result && result.message) {
        toast.success(result.message);
      }
    } catch {
      toast.error(
        "Network error while testing SMTP connection. Please try again.",
      );
    } finally {
      setTestingSmtp(false);
    }
  }

  const isSmtpConfigured = Boolean(
    clinic.settings?.smtpHost &&
    clinic.settings?.smtpUser &&
    clinic.settings?.smtpPassword,
  );
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictList, setConflictList] = useState<ConflictingAppointment[]>(
    [],
  );

  const [clinicName, setClinicName] = useState(clinic.name);
  const [clinicPhone, setClinicPhone] = useState(clinic.phone || "");
  const [clinicAddress, setClinicAddress] = useState(clinic.address || "");

  const router = useRouter();

  async function handleInfoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateClinicInfo(
        clinicSlug,
        new FormData(e.currentTarget),
      );
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Clinic info updated");
        router.refresh();
      }
    } catch {
      toast.error(
        "Network error while saving clinic information. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSettingsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("autoConfirmBookings", String(autoConfirm));
      const result = await updateClinicSettings(clinicSlug, fd);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Settings saved");
        router.refresh();
      }
    } catch {
      toast.error("Network error while saving settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOperatingDays() {
    setOpDaysLoading(true);
    setConflictError(null);
    setConflictList([]);

    try {
      const result = await updateOperatingDays(clinicSlug, selectedOpenDays);

      if ("error" in result && result.error) {
        setConflictError(result.error);
        if (result.conflicts) {
          setConflictList(result.conflicts);
        }
        toast.error("Cannot update operating days");
      } else {
        toast.success("Operating days saved");
        router.refresh();
      }
    } catch {
      toast.error(
        "Network error while updating operating days. Please try again.",
      );
    } finally {
      setOpDaysLoading(false);
    }
  }

  async function handleQueueWorkflowSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("queueWorkflow", queueWorkflow);
      const result = await updateClinicSettings(clinicSlug, fd);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Queue workflow updated successfully");
        router.refresh();
      }
    } catch {
      toast.error(
        "Network error while updating queue workflow. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const toggleDay = (dayId: number) => {
    setSelectedOpenDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort(),
    );
  };

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="info">Clinic Info</TabsTrigger>
        <TabsTrigger value="booking">Booking & Operating Days</TabsTrigger>
        <TabsTrigger value="queue">Queue Workflow</TabsTrigger>
        <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
        <TabsTrigger value="revenue">Revenue</TabsTrigger>
      </TabsList>

      {/* Clinic Info */}
      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clinic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Clinic Name (Appears on Letterhead)</Label>
                <Input
                  name="name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Phone (Appears on Letterhead)</Label>
                  <Input
                    name="phone"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    defaultValue={clinic.email || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address (Appears on Letterhead)</Label>
                <Input
                  name="address"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  defaultValue={clinic.description || ""}
                  rows={3}
                />
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p className="text-muted-foreground">
                  Your clinic URL:{" "}
                  <strong>your-domain/clinic/{clinic.slug}</strong>
                </p>
              </div>

              {/* Document Letterhead Preview Card */}
              <div className="mt-6 pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileText className="h-4 w-4 text-primary" />
                    Document Letterhead Header Preview
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Live Document Header
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  This letterhead prints at the top of all Consent Forms,
                  Prescriptions, and Medical Certificates.
                </p>
                <div className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                        ✚
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight leading-tight">
                          {clinicName || "Clinic Name"}
                        </h2>
                        <p className="text-[10px] font-bold text-sky-600 tracking-wider uppercase mt-0.5">
                          Dental Clinic & Oral Healthcare Practice
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-xs text-slate-600 leading-relaxed font-sans">
                      <p className="font-semibold text-slate-800">
                        {clinicAddress || "Clinic Address"}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Tel: {clinicPhone || "+63 (2) 8888-DENT"}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {clinic.email || "clinic@dently.app"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 border-b-2 border-slate-900" />
                  <div className="mt-0.5 border-b border-sky-600" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Saving..." : "Save Letterhead & Clinic Info"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Booking Settings */}
      <TabsContent value="booking" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operating Days Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Configure which days of the week the clinic is regularly open.
              Closing a day with active upcoming appointments will require
              canceling or rescheduling those bookings first.
            </p>

            {conflictError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 space-y-2">
                <div className="flex items-start gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>{conflictError}</div>
                </div>

                {conflictList.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1 pt-1 border-t border-red-200">
                    <p className="font-semibold text-red-800">
                      Affected Appointments:
                    </p>
                    {conflictList.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-red-100"
                      >
                        <div>
                          <span className="font-medium text-gray-900">
                            {c.patientName}
                          </span>
                          <div className="text-gray-500">
                            {format(
                              new Date(c.preferredDate),
                              "MMM d, yyyy (EEE)",
                            )}
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded font-semibold text-[10px]">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 bg-gray-50/50">
              {DAYS_OF_WEEK.map((day) => {
                const isChecked = selectedOpenDays.includes(day.id);
                return (
                  <label
                    key={day.id}
                    className={`flex items-center justify-between p-2.5 rounded-md border text-sm font-medium cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-white border-primary/40 text-primary shadow-sm"
                        : "bg-gray-100 border-gray-200 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <span>{day.label}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-normal ${
                        isChecked
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isChecked ? "Open" : "Closed"}
                    </span>
                  </label>
                );
              })}
            </div>

            <Button onClick={handleSaveOperatingDays} disabled={opDaysLoading}>
              {opDaysLoading
                ? "Saving Operating Days..."
                : "Save Operating Days"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              General Booking Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="brandColor"
                      defaultValue={clinic.settings?.brandColor || "#0891b2"}
                      className="h-9 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      name="brandColorText"
                      defaultValue={clinic.settings?.brandColor || "#0891b2"}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Appointment Lead Days</Label>
                  <Input
                    name="appointmentLeadDays"
                    type="number"
                    defaultValue={clinic.settings?.appointmentLeadDays || 30}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Bookings Per Day</Label>
                <Input
                  name="maxBookingsPerDay"
                  type="number"
                  defaultValue={clinic.settings?.maxBookingsPerDay || ""}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-confirm Bookings</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically confirm online bookings without manual review
                  </p>
                </div>
                <Switch
                  checked={autoConfirm}
                  onCheckedChange={setAutoConfirm}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Queue Workflow Settings */}
      <TabsContent value="queue">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Queue & Visit Workflow
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Select the patient flow that matches your clinic&apos;s daily
              operational setup.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQueueWorkflowSubmit} className="space-y-6">
              <input type="hidden" name="queueWorkflow" value={queueWorkflow} />

              <div className="grid grid-cols-1 gap-4">
                {/* Option 1: Full Workflow */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setQueueWorkflow("FULL_WORKFLOW")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setQueueWorkflow("FULL_WORKFLOW");
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${
                    queueWorkflow === "FULL_WORKFLOW"
                      ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          Full Workflow (5 Stages)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          Standard
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Comprehensive multi-stage flow with dedicated
                        consultation and treatment rooms.
                      </p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${
                        queueWorkflow === "FULL_WORKFLOW"
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {queueWorkflow === "FULL_WORKFLOW" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Flow pipeline */}
                  <div className="mt-3.5 flex items-center flex-wrap gap-1.5 text-xs select-none">
                    <span className="px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 font-medium">
                      Waiting
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">
                      In Consultation
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-medium">
                      In Treatment
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 font-medium">
                      For Payment
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-800 font-medium">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Option 2: Simple Queue */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setQueueWorkflow("SIMPLE_QUEUE")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setQueueWorkflow("SIMPLE_QUEUE");
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${
                    queueWorkflow === "SIMPLE_QUEUE"
                      ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          Simple Queue (Queue & Treatment)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> Recommended
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Patients check in to the queue and transition directly
                        into treatment when called (skips consultation).
                      </p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${
                        queueWorkflow === "SIMPLE_QUEUE"
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {queueWorkflow === "SIMPLE_QUEUE" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Flow pipeline */}
                  <div className="mt-3.5 flex items-center flex-wrap gap-1.5 text-xs select-none">
                    <span className="px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 font-medium">
                      Queue (Waiting)
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-medium">
                      In Treatment
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 font-medium">
                      For Payment
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-800 font-medium">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Option 3: Direct to Treatment */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setQueueWorkflow("DIRECT_TREATMENT")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setQueueWorkflow("DIRECT_TREATMENT");
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${
                    queueWorkflow === "DIRECT_TREATMENT"
                      ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          Direct to Treatment (Auto Check-In)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                          <Zap className="h-2.5 w-2.5" /> Express
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Checking in automatically places patient directly in
                        treatment chair (bypasses waiting room queue).
                      </p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${
                        queueWorkflow === "DIRECT_TREATMENT"
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {queueWorkflow === "DIRECT_TREATMENT" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Flow pipeline */}
                  <div className="mt-3.5 flex items-center flex-wrap gap-1.5 text-xs select-none">
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-medium">
                      In Treatment (Direct)
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 font-medium">
                      For Payment
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-800 font-medium">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Workflow updates apply immediately to the Appointments Queue
                  board and future patient check-ins.
                </span>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Saving Workflow..." : "Save Queue Workflow"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SMTP Settings */}
      <TabsContent value="email">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">SMTP Email Settings</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Configure your clinic&apos;s outgoing mail server to send
                automated patient emails (booking confirmations, status updates,
                receipts).
              </p>
            </div>
            {isSmtpConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Configured & Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Not Configured
              </span>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    name="smtpHost"
                    defaultValue={clinic.settings?.smtpHost || ""}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    name="smtpPort"
                    type="number"
                    defaultValue={clinic.settings?.smtpPort || 587}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    name="smtpUser"
                    defaultValue={clinic.settings?.smtpUser || ""}
                    placeholder="contact@yourclinic.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    name="smtpPassword"
                    type="password"
                    defaultValue={
                      clinic.settings?.smtpPassword ? "••••••••" : ""
                    }
                    placeholder="App Password or API key"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    name="smtpFromEmail"
                    type="email"
                    defaultValue={clinic.settings?.smtpFromEmail || ""}
                    placeholder="noreply@yourclinic.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    name="smtpFromName"
                    defaultValue={clinic.settings?.smtpFromName || ""}
                    placeholder={clinic.name}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={loading || testingSmtp}>
                  {loading ? "Saving..." : "Save SMTP Settings"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp || loading}
                >
                  {testingSmtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2 text-primary" />
                      Test Connection & Send Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Revenue Formula & Compensation Program Builder */}
      <TabsContent value="revenue">
        <CompensationListClient
          clinicSlug={clinicSlug}
          programs={clinic.compensationPrograms || []}
        />
      </TabsContent>
    </Tabs>
  );
}
