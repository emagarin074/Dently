"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Odontogram } from "@/components/ui/odontogram";
import {
  ArrowLeft,
  Stethoscope,
  Trash2,
  FileText,
  CheckCircle,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addProcedureToAppointment,
  deleteProcedureFromAppointment,
} from "@/app/actions/appointments";
import { advanceQueueToPayment } from "@/app/actions/queue";
import type {
  ProcedureOption,
  PriceRules,
} from "@/components/admin/add-procedure-dialog";

interface Props {
  clinicSlug: string;
  appointment: {
    id: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      dateOfBirth: string | null;
      installmentPlans: {
        id: string;
        totalAmount: unknown;
        paidAmount: unknown;
        status: string;
        notes: string | null;
        createdAt: string;
      }[];
    } | null;
    dentist: { id: string; name: string } | null;
    status: string;
    queueEntry: { id: string; queueNumber: number; status: string } | null;
    procedures: {
      id: string;
      price: unknown;
      toothSelection: unknown;
      surfaceSelection: unknown;
      upperLower: string | null;
      material: string | null;
      shade: string | null;
      severity: string | null;
      remarks: string | null;
      procedure: { name: string; category: string | null };
    }[];
  };
  procedures: ProcedureOption[];
  hasExistingConsent: boolean;
  hasExistingXray: boolean;
  hasExistingPhoto: boolean;
}

function calculateDynamicPrice(
  selected: ProcedureOption | undefined,
  severity: string,
  material: string,
  shade: string,
  surfaces: Record<number, string[]>,
  upperLower: string,
) {
  if (!selected) return 0;

  let basePrice = 0;
  if (selected.priceType === "FIXED" && selected.price) {
    basePrice = Number(selected.price);
  } else if (selected.priceType === "RANGE" && selected.priceMin) {
    basePrice = Number(selected.priceMin);
  }

  const rules = (selected.priceRules as PriceRules | null) || {};
  let total = basePrice;

  // 1. Severity Surcharge
  if (selected.hasSeverity && severity) {
    const sevSurcharge = rules.severityPrices?.[severity] ?? 0;
    total += Number(sevSurcharge);
  }

  // 2. Material Surcharge
  if (selected.hasMaterial && material) {
    const matOption = rules.materialPrices?.find(
      (m) => m.name.toLowerCase() === material.toLowerCase(),
    );
    if (matOption) {
      total += Number(matOption.surcharge);
    }
  }

  // 3. Shade Surcharge
  if (selected.hasShade && shade) {
    const shadeOption = rules.shadePrices?.find(
      (s) => s.name.toLowerCase() === shade.toLowerCase(),
    );
    if (shadeOption) {
      total += Number(shadeOption.surcharge);
    }
  }

  // 4. Tooth Surface Surcharge (Rule A)
  if (selected.hasToothSurface && surfaces) {
    const totalSurfaces = Object.values(surfaces).reduce(
      (acc, curr) => acc + (curr?.length || 0),
      0,
    );
    const surfaceFee = rules.toothSurfaceSurcharge ?? 0;
    total += totalSurfaces * Number(surfaceFee);
  }

  // 5. Flat Double-Arch Surcharge
  if (selected.hasUpperLower && upperLower === "BOTH") {
    const doubleArchFee = rules.doubleArchSurcharge ?? 0;
    total += Number(doubleArchFee);
  }

  return total;
}

function buildGenericConsentHtml(procedureName: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Consent Form – ${procedureName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 24px; font-size: 13px; color: #111; }
    h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 13px; text-align: center; color: #555; font-weight: normal; margin-bottom: 24px; }
    p { line-height: 1.7; margin: 10px 0; }
    sig-row { display: flex; gap: 40px; margin-top: 32px; }
    .sig-box { flex: 1; }
    .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 11px; color: #555; }
  </style>
</head>
<body>
  <h1>Patient Informed Consent Form</h1>
  <h2>${procedureName}</h2>
  <p>I hereby give my informed consent to the Attending Dentist to perform the procedure.</p>
</body>
</html>`;
}

export function TreatmentClient({
  clinicSlug,
  appointment,
  procedures,
  hasExistingConsent,
  hasExistingXray,
  hasExistingPhoto,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  // Form states
  const [selectedId, setSelectedId] = useState("");
  const [manualPriceOverride, setManualPriceOverride] = useState<string | null>(
    null,
  );
  const [teeth, setTeeth] = useState<number[]>([]);
  const [surfaces, setSurfaces] = useState<Record<number, string[]>>({});
  const [upperLower, setUpperLower] = useState("");
  const [material, setMaterial] = useState("");
  const [shade, setShade] = useState("");
  const [severity, setSeverity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [labFile, setLabFile] = useState<File | null>(null);

  // Confirmation modals
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);

  const selected = procedures.find((p) => p.id === selectedId);
  const computedPrice = calculateDynamicPrice(
    selected,
    severity,
    material,
    shade,
    surfaces,
    upperLower,
  );
  const currentPrice =
    manualPriceOverride !== null ? manualPriceOverride : String(computedPrice);

  function handleSelectProcedure(id: string) {
    setSelectedId(id);
    setTeeth([]);
    setSurfaces({});
    setUpperLower("");
    setMaterial("");
    setShade("");
    setSeverity("");
    setRemarks("");
    setConsentFile(null);
    setPhotoFile(null);
    setXrayFile(null);
    setLabFile(null);
    setManualPriceOverride(null);
  }

  async function fileToBase64(file: File) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return {
      base64: btoa(binary),
      mimeType: file.type || "application/octet-stream",
      fileName: file.name,
      fileSize: file.size,
    };
  }

  function onAddProcedureSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return toast.error("Select a procedure");
    const priceNum = parseFloat(currentPrice);
    if (isNaN(priceNum) || priceNum < 0)
      return toast.error("Enter a valid price");

    // Validation checks for required uploads
    const consentRequired =
      selected?.requireSignedConsent && !hasExistingConsent;
    if (consentRequired && !consentFile) {
      return toast.error("Upload a signed consent form to proceed");
    }

    const photoRequired = selected?.requirePhoto && !hasExistingPhoto;
    if (photoRequired && !photoFile) {
      return toast.error("Upload a procedure photo to proceed");
    }

    const xrayRequired = selected?.requireXray && !hasExistingXray;
    if (xrayRequired && !xrayFile) {
      return toast.error("Upload an X-ray image to proceed");
    }

    const labRequired = selected?.requireLabDocs;
    if (labRequired && !labFile) {
      return toast.error("Upload lab documents to proceed");
    }

    setShowAddConfirm(true);
  }

  async function handleAddProcedure() {
    setShowAddConfirm(false);
    setLoading(true);

    const priceNum = parseFloat(currentPrice);

    const consentDocument = consentFile
      ? await fileToBase64(consentFile)
      : undefined;
    const photoDocument = photoFile ? await fileToBase64(photoFile) : undefined;
    const xrayDocument = xrayFile ? await fileToBase64(xrayFile) : undefined;
    const labDocument = labFile ? await fileToBase64(labFile) : undefined;

    const result = await addProcedureToAppointment(clinicSlug, appointment.id, {
      procedureId: selectedId,
      price: priceNum,
      toothSelection: teeth.length > 0 ? teeth : undefined,
      surfaceSelection: Object.keys(surfaces).length > 0 ? surfaces : undefined,
      upperLower: upperLower || undefined,
      material: material || undefined,
      shade: shade || undefined,
      severity: severity || undefined,
      remarks: remarks || undefined,
      consentDocument,
      photoDocument,
      xrayDocument,
      labDocument,
    });
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Procedure added");
      setSelectedId("");
      setTeeth([]);
      setSurfaces({});
      setUpperLower("");
      setMaterial("");
      setShade("");
      setSeverity("");
      setRemarks("");
      setConsentFile(null);
      setPhotoFile(null);
      setXrayFile(null);
      setLabFile(null);
      setManualPriceOverride(null);
      router.refresh();
    }
  }

  function handleDeleteProcedure(apProcId: string) {
    startTransition(async () => {
      const result = await deleteProcedureFromAppointment(clinicSlug, apProcId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Procedure removed");
        router.refresh();
      }
    });
  }

  function onProceedToPaymentClick() {
    if (selectedId) {
      return toast.error(
        "You have an unsubmitted procedure. Please add it to the patient or clear the selection first.",
      );
    }
    setShowProceedConfirm(true);
  }

  function handleProceedToPayment() {
    setShowProceedConfirm(false);
    startTransition(async () => {
      const result = await advanceQueueToPayment(clinicSlug, appointment.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Queue advanced to Payment");
        router.push(
          `/clinic/${clinicSlug}/admin/billing/${result.billingId}/pay`,
        );
      }
    });
  }

  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : "Anonymous Patient";

  const totalCost = appointment.procedures.reduce(
    (acc, curr) => acc + Number(curr.price || 0),
    0,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/clinic/${clinicSlug}/admin/bookings?tab=queue`}
            as={`/clinic/${clinicSlug}/admin/bookings?tab=queue`}
          >
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">
                {patientName}
              </h1>
              {appointment.queueEntry && (
                <span className="inline-flex items-center justify-center h-6 px-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-100 rounded-lg">
                  Q-{appointment.queueEntry.queueNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Attending: {appointment.dentist?.name || "No dentist assigned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {(appointment.procedures.length > 0 ||
            (appointment.patient?.installmentPlans &&
              appointment.patient.installmentPlans.length > 0)) && (
            <Button
              onClick={onProceedToPaymentClick}
              disabled={isPending || loading}
              className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <CreditCard className="h-4 w-4" />
              {appointment.procedures.length > 0
                ? `Proceed to Payment (${formatCurrency(totalCost)})`
                : "Proceed to Payment / Installment"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Add Procedure Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Add Procedure / Treatment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={onAddProcedureSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Select Procedure *
                  </Label>
                  <Select
                    value={selectedId}
                    onValueChange={handleSelectProcedure}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 h-10 bg-slate-50/20">
                      <SelectValue placeholder="Choose a procedure to perform..." />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span>{p.name}</span>
                          {p.category && (
                            <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                              ({p.category})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selected && (
                  <div className="space-y-4 pt-2 animate-page-fade">
                    {/* Price */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Price (₱)
                        {selected.priceType === "RANGE" &&
                          selected.priceMin != null &&
                          selected.priceMax != null && (
                            <span className="ml-2 text-[10px] text-slate-500 font-normal bg-slate-100 px-1.5 py-0.5 rounded-md">
                              Range: {formatCurrency(Number(selected.priceMin))}{" "}
                              – {formatCurrency(Number(selected.priceMax))}
                            </span>
                          )}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentPrice}
                        onChange={(e) => setManualPriceOverride(e.target.value)}
                        placeholder="0.00"
                        readOnly={selected.priceType === "FIXED"}
                        className={`rounded-xl border-slate-200 h-10 ${selected.priceType === "FIXED" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
                        required
                      />
                    </div>

                    {/* Arch */}
                    {selected.hasUpperLower && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">
                          Arch Selection
                        </Label>
                        <Select
                          value={upperLower}
                          onValueChange={setUpperLower}
                        >
                          <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select arch..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPPER">Upper</SelectItem>
                            <SelectItem value="LOWER">Lower</SelectItem>
                            <SelectItem value="BOTH">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Odontogram */}
                    {selected.hasOdontogram && (
                      <div className="space-y-2 bg-slate-50/50 p-4 border border-slate-200/50 rounded-2xl">
                        <Label className="text-xs font-bold text-slate-700 flex flex-col gap-0.5">
                          <span>Tooth Selection</span>
                          {selected.hasToothSurface && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              Click a tooth then select surfaces in the
                              odontogram.
                            </span>
                          )}
                        </Label>
                        <Odontogram
                          selectedTeeth={teeth}
                          selectedSurfaces={surfaces}
                          onChange={(t, s) => {
                            setTeeth(t);
                            setSurfaces(s);
                          }}
                        />
                      </div>
                    )}

                    {/* Material */}
                    {selected.hasMaterial && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">
                          Material
                        </Label>
                        {(selected.priceRules as PriceRules | undefined)
                          ?.materialPrices &&
                        (selected.priceRules as PriceRules).materialPrices!
                          .length > 0 ? (
                          <Select value={material} onValueChange={setMaterial}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                              <SelectValue placeholder="Select material..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                (selected.priceRules as PriceRules)
                                  .materialPrices || []
                              ).map((m) => (
                                <SelectItem key={m.name} value={m.name}>
                                  {m.name} (+
                                  {formatCurrency(Number(m.surcharge))})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={material}
                            onChange={(e) => setMaterial(e.target.value)}
                            placeholder="e.g. Composite, Ceramic..."
                            className="rounded-xl border-slate-200 h-10"
                          />
                        )}
                      </div>
                    )}

                    {/* Shade */}
                    {selected.hasShade && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">
                          Shade
                        </Label>
                        {(selected.priceRules as PriceRules | undefined)
                          ?.shadePrices &&
                        (selected.priceRules as PriceRules).shadePrices!
                          .length > 0 ? (
                          <Select value={shade} onValueChange={setShade}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                              <SelectValue placeholder="Select shade..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                (selected.priceRules as PriceRules)
                                  .shadePrices || []
                              ).map((s) => (
                                <SelectItem key={s.name} value={s.name}>
                                  {s.name} (+
                                  {formatCurrency(Number(s.surcharge))})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={shade}
                            onChange={(e) => setShade(e.target.value)}
                            placeholder="e.g. A2, B1..."
                            className="rounded-xl border-slate-200 h-10"
                          />
                        )}
                      </div>
                    )}

                    {/* Severity */}
                    {selected.hasSeverity && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">
                          Severity
                        </Label>
                        <Select value={severity} onValueChange={setSeverity}>
                          <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select severity..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MILD">Mild</SelectItem>
                            <SelectItem value="MODERATE">Moderate</SelectItem>
                            <SelectItem value="SEVERE">Severe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Consent Requirements */}
                    {selected.requireSignedConsent && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                            <AlertTriangle className="h-4 w-4" />
                            {hasExistingConsent
                              ? "Signed Consent (Optional - already on file)"
                              : "Signed Consent Required *"}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[10px] rounded-lg border-amber-300 text-amber-800 bg-white hover:bg-amber-100"
                            onClick={() => {
                              const html =
                                selected.consentTemplate?.content ??
                                buildGenericConsentHtml(selected.name);
                              const blob = new Blob([html], {
                                type: "text/html",
                              });
                              const url = URL.createObjectURL(blob);
                              window.open(url, "_blank");
                              setTimeout(() => URL.revokeObjectURL(url), 10000);
                            }}
                          >
                            Print Form
                          </Button>
                        </div>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            setConsentFile(e.target.files?.[0] ?? null)
                          }
                          className="bg-white border-amber-200 text-xs"
                          required={
                            selected.requireSignedConsent && !hasExistingConsent
                          }
                        />
                        {consentFile && (
                          <p className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {consentFile.name}
                          </p>
                        )}
                        {hasExistingConsent && (
                          <p className="text-[10px] text-amber-700">
                            Note: Patient already has a signed consent form on
                            file. Re-upload is optional.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Photo Upload */}
                    {(selected.requirePhoto || selected.hasPhotoUpload) && (
                      <div
                        className={`rounded-xl border p-4 space-y-2 ${selected.requirePhoto && !hasExistingPhoto ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-slate-50/50"}`}
                      >
                        <Label className="text-xs font-bold text-slate-700 block">
                          {selected.requirePhoto && !hasExistingPhoto
                            ? "Procedure Photo Required *"
                            : "Procedure Photo (Optional)"}
                          {hasExistingPhoto && (
                            <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                              (Already on file)
                            </span>
                          )}
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setPhotoFile(e.target.files?.[0] ?? null)
                          }
                          className="bg-white text-xs"
                          required={selected.requirePhoto && !hasExistingPhoto}
                        />
                        {photoFile && (
                          <p className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {photoFile.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* X-Ray Upload */}
                    {(selected.requireXray || selected.hasXrayUpload) && (
                      <div
                        className={`rounded-xl border p-4 space-y-2 ${selected.requireXray && !hasExistingXray ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-slate-50/50"}`}
                      >
                        <Label className="text-xs font-bold text-slate-700 block">
                          {selected.requireXray && !hasExistingXray
                            ? "X-Ray Image Required *"
                            : "X-Ray Image (Optional)"}
                          {hasExistingXray && (
                            <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                              (Already on file)
                            </span>
                          )}
                        </Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            setXrayFile(e.target.files?.[0] ?? null)
                          }
                          className="bg-white text-xs"
                          required={selected.requireXray && !hasExistingXray}
                        />
                        {xrayFile && (
                          <p className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {xrayFile.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Lab Request Upload */}
                    {(selected.requireLabDocs || selected.hasLabRequest) && (
                      <div
                        className={`rounded-xl border p-4 space-y-2 ${selected.requireLabDocs ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-slate-50/50"}`}
                      >
                        <Label className="text-xs font-bold text-slate-700 block">
                          {selected.requireLabDocs
                            ? "Lab Request Documents Required *"
                            : "Lab Request Documents (Optional)"}
                        </Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) =>
                            setLabFile(e.target.files?.[0] ?? null)
                          }
                          className="bg-white text-xs"
                          required={selected.requireLabDocs}
                        />
                        {labFile && (
                          <p className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {labFile.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Remarks */}
                    {selected.hasRemarks && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">
                          Remarks / Clinical Notes
                        </Label>
                        <Textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Log symptoms, clinical findings, remarks..."
                          rows={3}
                          className="rounded-xl border-slate-200"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  {selectedId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSelectProcedure("")}
                      disabled={loading}
                      className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      Clear Selection
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={loading || !selectedId}
                    className="flex-1 h-11 text-white font-bold bg-primary hover:bg-primary/95 rounded-xl transition-all shadow"
                  >
                    {loading ? "Adding..." : "Add Treatment to Patient"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Performed Treatments and Bill Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ongoing Installment Plans */}
          {appointment.patient?.installmentPlans &&
            appointment.patient.installmentPlans.length > 0 && (
              <div className="space-y-4">
                {appointment.patient.installmentPlans.map((plan) => {
                  const planRemaining =
                    Number(plan.totalAmount) - Number(plan.paidAmount);
                  const percent = Math.min(
                    100,
                    Math.round(
                      (Number(plan.paidAmount) / Number(plan.totalAmount)) *
                        100,
                    ),
                  );

                  return (
                    <Card
                      key={plan.id}
                      className="rounded-2xl border-indigo-100 bg-indigo-50/20 shadow-sm overflow-hidden border"
                    >
                      <CardHeader className="bg-indigo-50/50 p-4 border-b border-indigo-100/60 flex flex-row items-center gap-2">
                        <CreditCard className="h-4 w-4 text-indigo-600" />
                        <CardTitle className="text-xs font-bold text-slate-800">
                          Ongoing Installment Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>
                            Total: {formatCurrency(Number(plan.totalAmount))}
                          </span>
                          <span className="text-emerald-600">
                            Paid: {formatCurrency(Number(plan.paidAmount))}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>
                              Balance: {formatCurrency(planRemaining)}
                            </span>
                            <span>{percent}% Completed</span>
                          </div>
                        </div>
                        {plan.notes && (
                          <p className="text-[10px] bg-white border border-indigo-100/40 p-2 rounded-lg text-slate-600 italic">
                            Agreement: {plan.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

          {/* Active Procedures Card */}
          <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                Performed Procedures ({appointment.procedures.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {appointment.procedures.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs select-none">
                  No treatments recorded for this appointment yet. Add one from
                  the left form pane.
                </div>
              ) : (
                appointment.procedures.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl space-y-2 relative hover:bg-slate-100/50 transition-colors animate-page-fade"
                  >
                    <div className="flex justify-between items-start pr-8">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">
                          {p.procedure.name}
                        </h4>
                        {p.procedure.category && (
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            {p.procedure.category}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {formatCurrency(Number(p.price))}
                      </span>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500">
                      {p.severity && (
                        <div>
                          Severity:{" "}
                          <span className="font-semibold text-slate-700">
                            {p.severity}
                          </span>
                        </div>
                      )}
                      {p.material && (
                        <div>
                          Material:{" "}
                          <span className="font-semibold text-slate-700">
                            {p.material}
                          </span>
                        </div>
                      )}
                      {p.shade && (
                        <div>
                          Shade:{" "}
                          <span className="font-semibold text-slate-700">
                            {p.shade}
                          </span>
                        </div>
                      )}
                      {p.upperLower && (
                        <div>
                          Arch:{" "}
                          <span className="font-semibold text-slate-700">
                            {p.upperLower}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 absolute top-2 right-2 border border-transparent hover:border-red-100"
                      onClick={() => handleDeleteProcedure(p.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}

              {/* Total cost box */}
              {appointment.procedures.length > 0 && (
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center bg-slate-50/50 -mx-4 -mb-4 p-4 mt-2">
                  <span className="text-xs font-bold text-slate-500">
                    Total Treatment Cost:
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAddConfirm} onOpenChange={setShowAddConfirm}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Confirm Treatment Addition
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1.5">
              Are you sure you want to add this procedure to the patient&apos;s
              record?
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 border-b border-slate-100">
            {selected && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-slate-800">
                    {selected.name}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(parseFloat(currentPrice) || 0)}
                  </span>
                </div>
                {(teeth.length > 0 ||
                  Object.keys(surfaces).length > 0 ||
                  material ||
                  shade ||
                  upperLower) && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 mt-2 space-y-1">
                    {teeth.length > 0 && <div>Teeth: {teeth.join(", ")}</div>}
                    {Object.keys(surfaces).length > 0 && (
                      <div>
                        Surfaces:{" "}
                        {Object.entries(surfaces)
                          .map(([t, s]) => `${t}(${s.join(",")})`)
                          .join(", ")}
                      </div>
                    )}
                    {material && <div>Material: {material}</div>}
                    {shade && <div>Shade: {shade}</div>}
                    {upperLower && <div>Arch: {upperLower}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-5 flex justify-end gap-3 bg-slate-50/30">
            <Button
              variant="outline"
              onClick={() => setShowAddConfirm(false)}
              className="h-9 px-4 rounded-xl text-xs border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProcedure}
              className="h-9 px-5 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white shadow-sm"
              disabled={loading}
            >
              {loading ? "Adding..." : "Okay"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProceedConfirm} onOpenChange={setShowProceedConfirm}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Proceed to Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1.5">
              Are you sure you want to proceed to the checkout? You will not be
              able to add more treatments to this visit once you proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 border-b border-slate-100 max-h-[300px] overflow-y-auto">
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 mb-2">
                Treatments to be Billed:
              </div>
              {appointment.procedures.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-start bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm"
                >
                  <div className="font-medium text-slate-800">
                    {p.procedure.name}
                  </div>
                  <div className="font-semibold text-slate-700">
                    {formatCurrency(Number(p.price))}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-800 text-sm">Total:</span>
                <span className="font-bold text-primary text-base">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>
          </div>
          <div className="p-5 flex justify-end gap-3 bg-slate-50/30">
            <Button
              variant="outline"
              onClick={() => setShowProceedConfirm(false)}
              className="h-9 px-4 rounded-xl text-xs border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToPayment}
              className="h-9 px-5 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white shadow-sm"
              disabled={isPending}
            >
              {isPending ? "Proceeding..." : "Okay"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
