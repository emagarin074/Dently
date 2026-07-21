"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  updatePatient,
  saveHealthQuestionnaire,
  addPatientNote,
} from "@/app/actions/patients";
import {
  recordInstallmentPayment,
  cancelInstallmentPlan,
} from "@/app/actions/installments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDate, formatCurrency, calculateAge } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@prisma/client";
import { Edit2, Save, Plus, CreditCard, Landmark } from "lucide-react";
import {
  AddProcedureDialog,
  type ProcedureOption,
} from "@/components/admin/add-procedure-dialog";
import { TablePagination } from "@/components/ui/pagination";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bloodType: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  createdAt: string;
  healthQuestionnaire: {
    hasHypertension: boolean;
    hasDiabetes: boolean;
    hasHeartDisease: boolean;
    hasBleedingDisorder: boolean;
    isPregnant: boolean;
    hasAllergies: boolean;
    allergiesDetail: string | null;
    currentMedications: string | null;
    previousDentalWork: string | null;
    chiefComplaint: string | null;
    additionalNotes: string | null;
  } | null;
  appointments: {
    id: string;
    preferredDate: string;
    serviceType: string | null;
    status: string;
    dentist: { name: string } | null;
    procedures: { id: string; price: unknown; procedure: { name: string } }[];
    billing: {
      id: string;
      totalAmount: unknown;
      paidAmount: unknown;
      status: string;
      payments: {
        id: string;
        amount: unknown;
        method: string;
        reference: string | null;
        notes: string | null;
        paidAt: string;
      }[];
    } | null;
  }[];
  patientNotes: { id: string; content: string; createdAt: string }[];
  documents: { id: string; title: string; type: string; createdAt: string }[];
  followUps: {
    id: string;
    followUpDate: string;
    notes: string | null;
    status: string;
  }[];
  installmentPlans: {
    id: string;
    billingId: string | null;
    totalAmount: unknown;
    paidAmount: unknown;
    status: string;
    notes: string | null;
    createdAt: string;
    installments: {
      id: string;
      amount: unknown;
      method: string;
      reference: string | null;
      notes: string | null;
      paidAt: string;
    }[];
    billing: {
      id: string;
      totalAmount: unknown;
      paidAmount: unknown;
      appointment: {
        serviceType: string | null;
        preferredDate: string;
      } | null;
    } | null;
  }[];
}

interface Props {
  patient: Patient;
  dentists: { id: string; name: string; role: string }[];
  procedures: ProcedureOption[];
  clinicSlug: string;
  userRole: UserRole;
  defaultTab?: string;
}

export function PatientDetailClient({
  patient,
  clinicSlug,
  procedures,
  defaultTab = "overview",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [gender, setGender] = useState(patient.gender || "");
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const apptPage = parseInt(searchParams.get("apptPage") || "1");
  const apptPageSize = 10;
  const paginatedAppts = patient.appointments.slice(
    (apptPage - 1) * apptPageSize,
    apptPage * apptPageSize,
  );

  const billPage = parseInt(searchParams.get("billPage") || "1");
  const billPageSize = 10;

  async function handleUpdatePatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("gender", gender);
    const result = await updatePatient(clinicSlug, patient.id, fd);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Patient updated");
      setEditing(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleQuestionnaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await saveHealthQuestionnaire(clinicSlug, patient.id, fd);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Health questionnaire saved");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleNote() {
    if (!noteText.trim()) return;
    const result = await addPatientNote(clinicSlug, patient.id, noteText);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Note added");
      setNoteText("");
      router.refresh();
    }
  }

  const q = patient.healthQuestionnaire;

  return (
    <div className="space-y-4">
      {/* Patient header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold flex-shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {patient.firstName}{" "}
                {patient.middleName ? patient.middleName + " " : ""}
                {patient.lastName}
              </h2>
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                {patient.dateOfBirth && (
                  <span>Age: {calculateAge(patient.dateOfBirth)}</span>
                )}
                {patient.gender && (
                  <span>
                    {patient.gender.charAt(0) +
                      patient.gender.slice(1).toLowerCase()}
                  </span>
                )}
                {patient.phone && <span>{patient.phone}</span>}
                {patient.email && <span>{patient.email}</span>}
                {patient.bloodType && <span>Blood: {patient.bloodType}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questionnaire">Health Form</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="installments">Installments</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Patient Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? (
                  <Save className="h-4 w-4 mr-1" />
                ) : (
                  <Edit2 className="h-4 w-4 mr-1" />
                )}
                {editing ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleUpdatePatient} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        name="firstName"
                        defaultValue={patient.firstName}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input
                        name="middleName"
                        defaultValue={patient.middleName || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        name="lastName"
                        defaultValue={patient.lastName}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        name="dateOfBirth"
                        type="date"
                        defaultValue={patient.dateOfBirth?.split("T")[0] || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"].map(
                            (g) => (
                              <SelectItem key={g} value={g}>
                                {g.replace("_", " ")}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input name="phone" defaultValue={patient.phone || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        name="email"
                        type="email"
                        defaultValue={patient.email || ""}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      name="address"
                      defaultValue={patient.address || ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Blood Type</Label>
                      <Input
                        name="bloodType"
                        defaultValue={patient.bloodType || ""}
                        placeholder="A+, O-, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Emergency Contact</Label>
                      <Input
                        name="emergencyContactName"
                        defaultValue={patient.emergencyContactName || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Phone</Label>
                      <Input
                        name="emergencyContactPhone"
                        defaultValue={patient.emergencyContactPhone || ""}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    Save Changes
                  </Button>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  {[
                    ["Phone", patient.phone],
                    ["Email", patient.email],
                    ["Address", patient.address],
                    ["Blood Type", patient.bloodType],
                    ["Emergency Contact", patient.emergencyContactName],
                    ["Emergency Phone", patient.emergencyContactPhone],
                    ["Patient Since", formatDate(patient.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Questionnaire */}
        <TabsContent value="questionnaire" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Health Questionnaire</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuestionnaire} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      name: "hasHypertension",
                      label: "Hypertension / High Blood Pressure",
                      defaultChecked: q?.hasHypertension,
                    },
                    {
                      name: "hasDiabetes",
                      label: "Diabetes",
                      defaultChecked: q?.hasDiabetes,
                    },
                    {
                      name: "hasHeartDisease",
                      label: "Heart Disease",
                      defaultChecked: q?.hasHeartDisease,
                    },
                    {
                      name: "hasBleedingDisorder",
                      label: "Bleeding Disorder",
                      defaultChecked: q?.hasBleedingDisorder,
                    },
                    {
                      name: "isPregnant",
                      label: "Pregnant",
                      defaultChecked: q?.isPregnant,
                    },
                    {
                      name: "hasAllergies",
                      label: "Known Allergies",
                      defaultChecked: q?.hasAllergies,
                    },
                  ].map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <input type="hidden" name={field.name} value="false" />
                      <input
                        type="checkbox"
                        id={field.name}
                        name={field.name}
                        value="true"
                        defaultChecked={field.defaultChecked || false}
                        className="rounded"
                      />
                      <Label htmlFor={field.name}>{field.label}</Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Allergies Detail</Label>
                  <Textarea
                    name="allergiesDetail"
                    defaultValue={q?.allergiesDetail || ""}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <Textarea
                    name="currentMedications"
                    defaultValue={q?.currentMedications || ""}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Previous Dental Work</Label>
                  <Textarea
                    name="previousDentalWork"
                    defaultValue={q?.previousDentalWork || ""}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chief Complaint</Label>
                  <Textarea
                    name="chiefComplaint"
                    defaultValue={q?.chiefComplaint || ""}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    name="additionalNotes"
                    defaultValue={q?.additionalNotes || ""}
                    rows={2}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  Save Questionnaire
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appointment History</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No appointments
                </p>
              ) : (
                <div className="space-y-3">
                  {paginatedAppts.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {formatDate(a.preferredDate)}
                        </p>
                        <div className="flex items-center gap-2">
                          {a.status === "CHECKED_IN" && (
                            <AddProcedureDialog
                              appointmentId={a.id}
                              clinicSlug={clinicSlug}
                              procedures={procedures}
                              trigger={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-0.5" />
                                  Add Procedure
                                </Button>
                              }
                            />
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${a.status === "COMPLETED" ? "bg-green-100 text-green-800" : a.status === "CANCELLED" ? "bg-red-100 text-red-800" : a.status === "CHECKED_IN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {a.serviceType || "General"}{" "}
                        {a.dentist ? `· ${a.dentist.name}` : ""}
                      </p>
                      {a.procedures.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.procedures.map((p) => (
                            <span
                              key={p.id}
                              className="text-xs bg-gray-100 px-1.5 py-0.5 rounded"
                            >
                              {p.procedure.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <TablePagination
            total={patient.appointments.length}
            page={apptPage}
            pageSize={apptPageSize}
            itemName="appointments"
            paramName="apptPage"
          />
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const billingCards: {
                  id: string;
                  date: string;
                  status: string;
                  totalAmount: number;
                  paidAmount: number;
                  balance: number;
                  dentist: string;
                  procedures: string;
                  payments: string;
                  showPayInvoice: boolean;
                  billingId: string;
                }[] = [];

                // 1. Add all standard billing invoices (excluding ghost 0-total invoices)
                patient.appointments
                  .filter((a) => a.billing && Number(a.billing.totalAmount) > 0)
                  .forEach((a) => {
                    const billing = a.billing!;
                    const total = Number(billing.totalAmount);
                    // The paid amount for this specific invoice card is exactly what's in its direct payments list
                    const paid = billing.payments.reduce(
                      (sum, p) => sum + Number(p.amount),
                      0,
                    );
                    const balance = Math.max(0, total - paid);

                    // Only show PAY button if the overall invoice in DB is not fully paid
                    // Note: billing.paidAmount in DB might be higher if installments are linked, so we check DB status
                    const isFullyPaidInDb = billing.status === "FULLY_PAID";
                    const hasInstallment = patient.installmentPlans.some(
                      (plan) => plan.billingId === billing.id,
                    );

                    billingCards.push({
                      id: `std-${a.id}`,
                      date: a.preferredDate,
                      status: balance <= 0 ? "FULLY_PAID" : "PARTIALLY_PAID",
                      totalAmount: total,
                      paidAmount: paid,
                      balance: balance,
                      dentist: a.dentist?.name || "No dentist assigned",
                      procedures:
                        a.procedures
                          .map(
                            (p) =>
                              `${p.procedure.name} (${formatCurrency(Number(p.price))})`,
                          )
                          .join(", ") || "Standard Procedures",
                      payments: billing.payments
                        .map(
                          (p) =>
                            `${p.method} (${formatCurrency(Number(p.amount))})${p.reference ? ` Ref: ${p.reference}` : ""}`,
                        )
                        .join(", "),
                      showPayInvoice: !isFullyPaidInDb && !hasInstallment,
                      billingId: billing.id,
                    });
                  });

                // 2. Add all installment payment records as separate chronological cards
                patient.installmentPlans.forEach((plan) => {
                  const planTotal = Number(plan.totalAmount);

                  // Find the downpayment from the original invoice if it exists
                  const originalBilling = patient.appointments.find(
                    (a) => a.billing?.id === plan.billingId,
                  )?.billing;
                  const downpayment = originalBilling
                    ? originalBilling.payments.reduce(
                        (sum, p) => sum + Number(p.amount),
                        0,
                      )
                    : 0;

                  let runningPaid = downpayment;

                  // Sort installments chronologically and filter out the downpayment
                  // since it's already represented on the main standard invoice card
                  const sortedInstallments = [...plan.installments]
                    .filter((inst) => inst.notes !== "Downpayment")
                    .sort(
                      (a, b) =>
                        new Date(a.paidAt).getTime() -
                        new Date(b.paidAt).getTime(),
                    );

                  sortedInstallments.forEach((inst) => {
                    runningPaid += Number(inst.amount);
                    const runningOB = Math.max(0, planTotal - runningPaid);
                    const cardStatus =
                      runningOB === 0 ? "FULLY_PAID" : "PARTIALLY_PAID";

                    billingCards.push({
                      id: `inst-${inst.id}`,
                      date: inst.paidAt,
                      status: cardStatus,
                      totalAmount: planTotal,
                      paidAmount: runningPaid, // Cumulative paid up to this transaction
                      balance: runningOB,
                      dentist: "Installment Transaction",
                      procedures: `Installment Payment${plan.notes ? ` (${plan.notes})` : " (Braces)"}`,
                      payments: `${inst.method} (${formatCurrency(Number(inst.amount))})${inst.notes ? ` — ${inst.notes}` : ""}${inst.reference ? ` Ref: ${inst.reference}` : ""}`,
                      showPayInvoice: false,
                      billingId: plan.billingId || "",
                    });
                  });
                });

                // Sort by date descending
                const sortedCards = [...billingCards].sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                );

                const paginatedCards = sortedCards.slice(
                  (billPage - 1) * billPageSize,
                  billPage * billPageSize,
                );

                if (sortedCards.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No billing records
                    </p>
                  );
                }

                return (
                  <>
                    <div className="space-y-3">
                      {paginatedCards.map((card) => (
                        <div
                          key={card.id}
                          className="border rounded-lg p-3 space-y-2.5 bg-white shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-slate-800">
                              {formatDate(card.date)}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                card.status === "FULLY_PAID"
                                  ? "bg-green-100 text-green-800"
                                  : card.status === "PARTIALLY_PAID"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {card.status === "FULLY_PAID"
                                ? "FULLY PAID"
                                : card.status === "PARTIALLY_PAID"
                                  ? "PARTIALLY PAID"
                                  : "UNPAID"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                            <span>
                              Total: {formatCurrency(card.totalAmount)}
                            </span>
                            <span>Paid: {formatCurrency(card.paidAmount)}</span>
                            <span className="text-red-600">
                              Balance: {formatCurrency(card.balance)}
                            </span>
                          </div>

                          {/* Attending dentist */}
                          <p className="text-xs text-muted-foreground">
                            Dentist:{" "}
                            <span className="font-semibold text-slate-700">
                              {card.dentist}
                            </span>
                          </p>

                          {/* Procedures performed */}
                          {card.procedures && (
                            <p className="text-xs text-muted-foreground">
                              Procedures:{" "}
                              <span className="font-semibold text-slate-700">
                                {card.procedures}
                              </span>
                            </p>
                          )}

                          {/* Payment transactions log */}
                          {card.payments && (
                            <p className="text-xs text-muted-foreground">
                              Payments:{" "}
                              <span className="font-semibold text-slate-700">
                                {card.payments}
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <TablePagination
                      total={sortedCards.length}
                      page={billPage}
                      pageSize={billPageSize}
                      itemName="billing records"
                      paramName="billPage"
                    />
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No documents
                </p>
              ) : (
                <div className="space-y-2">
                  {patient.documents.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.type} · {formatDate(d.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleNote} disabled={!noteText.trim()}>
                  Add
                </Button>
              </div>
              {patient.patientNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes
                </p>
              ) : (
                <div className="space-y-2">
                  {patient.patientNotes.map((n) => (
                    <div key={n.id} className="border rounded-lg p-3">
                      <p className="text-sm">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups */}
        <TabsContent value="followups" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No follow-ups
                </p>
              ) : (
                <div className="space-y-2">
                  {patient.followUps.map((f) => (
                    <div
                      key={f.id}
                      className="border rounded-lg p-3 flex items-start justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(f.followUpDate)}
                        </p>
                        {f.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {f.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${f.status === "COMPLETED" ? "bg-green-100 text-green-800" : f.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installments */}
        <TabsContent value="installments" className="mt-4">
          <InstallmentsTab patient={patient} clinicSlug={clinicSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InstallmentsTab({
  patient,
  clinicSlug,
}: {
  patient: Patient;
  clinicSlug: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Record Payment states
  const [activePlanForPay, setActivePlanForPay] = useState<
    Patient["installmentPlans"][0] | null
  >(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlanForPay) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0)
      return toast.error("Enter a valid payment amount");

    const planBal =
      Number(activePlanForPay.totalAmount) -
      Number(activePlanForPay.paidAmount);
    if (amt > planBal)
      return toast.error("Payment cannot exceed remaining plan balance");

    setPayLoading(true);
    const result = await recordInstallmentPayment(
      clinicSlug,
      activePlanForPay.id,
      {
        amount: amt,
        method: payMethod,
        reference: payReference,
        notes: payNotes,
      },
    );
    setPayLoading(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Installment payment recorded successfully");
      setActivePlanForPay(null);
      setPayAmount("");
      setPayReference("");
      setPayNotes("");
      router.refresh();
    }
  }

  function handleCancelPlan(planId: string) {
    if (!confirm("Are you sure you want to cancel this installment plan?"))
      return;
    startTransition(async () => {
      const result = await cancelInstallmentPlan(clinicSlug, planId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Installment plan cancelled");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <Card>
        <CardContent className="p-4 flex justify-between items-center bg-slate-50/50 border border-slate-200/40 rounded-xl shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Payment Installment Plans
            </h3>
            <p className="text-xs text-slate-500">
              Record partial installment payments for this patient.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plans List */}
      {patient.installmentPlans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-slate-400 text-xs">
            No active or past installment plans found for this patient record.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {patient.installmentPlans.map((plan) => {
            const planRemaining =
              Number(plan.totalAmount) - Number(plan.paidAmount);
            const percent = Math.min(
              100,
              Math.round(
                (Number(plan.paidAmount) / Number(plan.totalAmount)) * 100,
              ),
            );
            const statusColor =
              plan.status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : plan.status === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : "bg-indigo-100 text-indigo-800";

            return (
              <Card
                key={plan.id}
                className="rounded-2xl border-slate-200 shadow-sm overflow-hidden"
              >
                <CardHeader className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-row justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">
                      Installment Plan
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Created: {formatDate(plan.createdAt).slice(0, 10)}
                  </span>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Progress tracker */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Total Limit:
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {formatCurrency(Number(plan.totalAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Paid Installments:
                      </p>
                      <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(Number(plan.paidAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Plan Balance:
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(planRemaining)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 text-right">
                      Plan Completion: {percent}%
                    </p>
                  </div>

                  {plan.notes && (
                    <p className="text-xs bg-slate-50 p-2.5 rounded-lg border text-slate-600 italic">
                      Agreement: {plan.notes}
                    </p>
                  )}

                  {plan.billing?.appointment && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 bg-sky-50 border border-sky-100 p-2 rounded-lg">
                      <CreditCard className="h-3.5 w-3.5 text-sky-600" />
                      Linked to booking:{" "}
                      <strong>
                        {plan.billing.appointment.serviceType}
                      </strong> on{" "}
                      {formatDate(plan.billing.appointment.preferredDate).slice(
                        0,
                        10,
                      )}
                    </p>
                  )}

                  {/* Payment log timeline */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Installment logs
                    </h4>
                    {plan.installments.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">
                        No payments logged yet against this plan.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden bg-slate-50/20">
                        {plan.installments.map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 flex justify-between items-center text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-700">
                                {log.method} Payment
                              </p>
                              {log.reference && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Ref: {log.reference}
                                </p>
                              )}
                              <p className="text-[9px] text-slate-400">
                                {formatDate(log.paidAt)}
                              </p>
                            </div>
                            <span className="font-bold text-emerald-600">
                              +{formatCurrency(Number(log.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {plan.status === "ACTIVE" && (
                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold rounded-lg"
                        onClick={() => handleCancelPlan(plan.id)}
                        disabled={isPending}
                      >
                        Cancel Plan
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                        onClick={() => {
                          setActivePlanForPay(plan);
                          setPayAmount(String(planRemaining));
                        }}
                      >
                        <Landmark className="h-3.5 w-3.5" />
                        Pay Installment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Record Installment Payment Dialog Drawer */}
      <Dialog
        open={!!activePlanForPay}
        onOpenChange={(v) => !v && setActivePlanForPay(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              Record Installment Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Logged payments will automatically deduct from the installment
              balance and sync invoices.
            </DialogDescription>
          </DialogHeader>
          {activePlanForPay && (
            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              <div className="bg-slate-50 p-3 border rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Total Plan Amount:</span>
                  <span className="font-bold">
                    {formatCurrency(Number(activePlanForPay.totalAmount))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(
                      Number(activePlanForPay.totalAmount) -
                        Number(activePlanForPay.paidAmount),
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">
                  Payment Amount (₱) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={
                    Number(activePlanForPay.totalAmount) -
                    Number(activePlanForPay.paidAmount)
                  }
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="rounded-xl h-10 border-slate-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">
                  Payment Method *
                </Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200">
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Debit / Credit Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="ONLINE">
                      Online Payment (eWallet)
                    </SelectItem>
                    <SelectItem value="INSURANCE">Dental Insurance</SelectItem>
                    <SelectItem value="OTHER">Other Method</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">
                  Reference receipt No. (Optional)
                </Label>
                <Input
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="Receipt ID..."
                  className="rounded-xl h-10 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">
                  Payment Notes (Optional)
                </Label>
                <Textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Log comment..."
                  rows={2}
                  className="rounded-xl border-slate-200"
                />
              </div>

              <Button
                type="submit"
                disabled={payLoading}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl"
              >
                {payLoading ? "Processing..." : "Record Payment"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
