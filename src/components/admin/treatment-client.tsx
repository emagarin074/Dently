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
  Printer,
  UserCheck,
  XCircle,
  Clock,
  Plus,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  renderDocumentTemplate,
  handlePrintDocument,
} from "@/lib/utils";
import { compressImage } from "@/lib/image-compression";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addProcedureToAppointment,
  deleteProcedureFromAppointment,
  cancelTreatmentVisit,
} from "@/app/actions/appointments";
import { advanceQueueToPayment } from "@/app/actions/queue";
import { addPatientNote } from "@/app/actions/patients";
import {
  matchClinicProcedure,
  classifyProcedure,
  type PlannedTreatmentItem,
} from "@/lib/treatment-planning";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import {
  LinkPatientDialog,
  type PatientOption,
} from "@/components/admin/link-patient-dialog";
import type {
  ProcedureOption,
  PriceRules,
} from "@/components/admin/add-procedure-dialog";

interface Props {
  clinicSlug: string;
  appointment: {
    id: string;
    bookingName?: string | null;
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
  clinicInfo?: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  patients?: PatientOption[];
  plannedTreatments?: PlannedTreatmentItem[];
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
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 44px 48px; max-width: 760px; margin: 0 auto; color: #0f172a; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08); box-sizing: border-box;">
  <!-- Executive Medical Letterhead -->
  <div style="margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="vertical-align: middle; width: 60%;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: #0f172a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; font-family: sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ✚
            </div>
            <div>
              <h2 style="margin: 0; font-size: 20px; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1.2;">
                {{clinic_name}}
              </h2>
              <p style="margin: 3px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #0284c7; text-transform: uppercase;">
                Dental Clinic & Oral Healthcare Practice
              </p>
            </div>
          </div>
        </td>
        <td style="vertical-align: middle; width: 40%; text-align: right; font-size: 11px; color: #475569; line-height: 1.6;">
          <strong style="color: #0f172a;">{{clinic_address}}</strong><br/>
          <span>Tel: {{clinic_phone}}</span><br/>
          <span style="color: #64748b;">{{clinic_email}}</span>
        </td>
      </tr>
    </table>
    <!-- Sophisticated Dual Accent Rule -->
    <div style="margin-top: 16px; border-bottom: 2.5px solid #0f172a;"></div>
    <div style="margin-top: 2px; border-bottom: 1px solid #0284c7;"></div>
  </div>

  <!-- Structured Clinical Metadata Header -->
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <tr>
        <td style="padding: 3px 0; width: 55%; vertical-align: top;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Patient Name</span><br/>
          <strong style="color: #0f172a; font-size: 14px;">{{patient_name}}</strong>
        </td>
        <td style="padding: 3px 0; width: 45%; vertical-align: top; text-align: right;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Date of Issue</span><br/>
          <strong style="color: #0f172a; font-size: 13px;">{{date}}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 6px 0 0 0; vertical-align: top;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Attending Dentist</span><br/>
          <span style="color: #1e293b; font-size: 12px; font-weight: 600;">Dr. {{dentist_name}}</span>
        </td>
        <td style="padding: 6px 0 0 0; vertical-align: top; text-align: right;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Clinical Procedure</span><br/>
          <span style="color: #1e293b; font-size: 12px; font-weight: 600;">${procedureName}</span>
        </td>
      </tr>
    </table>
  </div>

  <!-- Document Title Badge -->
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0f172a; background: #ffffff; border: 1.5px solid #cbd5e1; padding: 6px 22px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      INFORMED CONSENT FOR DENTAL TREATMENT
    </span>
  </div>

  <!-- Document Content Body -->
  <div style="font-size: 13.5px; color: #334155; line-height: 1.7; margin-bottom: 24px;">
    <p style="margin-bottom: 14px;">I, <strong>{{patient_name}}</strong> (or authorized parent/guardian), hereby authorize and consent to <strong>Dr. {{dentist_name}}</strong> and the dental staff at <strong>{{clinic_name}}</strong> to perform the recommended dental procedure: <strong style="color: #0f172a; text-decoration: underline;">${procedureName}</strong> on <strong>{{date}}</strong>.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Terms & Clinical Acknowledgments:</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.6;">
        <li style="margin-bottom: 6px;">The purpose, anticipated clinical benefits, potential risks, and available treatment alternatives have been thoroughly explained to me.</li>
        <li style="margin-bottom: 6px;">I acknowledge that unforeseen conditions may require modifications to the planned treatment during the course of the procedure.</li>
        <li style="margin-bottom: 6px;">I understand that local anesthesia and medications may be administered, and I have disclosed all known allergies, medical conditions, and medications.</li>
        <li>I have had ample opportunity to ask all questions regarding this procedure and all questions have been answered to my complete satisfaction.</li>
      </ul>
    </div>
  </div>

  <!-- Official Signature Block -->
  <div style="margin-top: 48px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 24px;">
          <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; width: 220px;">
            <strong style="color: #0f172a; font-size: 13px;">{{patient_name}}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">Patient / Authorized Representative</span><br/>
            <span style="font-size: 10px; color: #94a3b8;">Date Signed: {{date}}</span>
          </div>
        </td>
        <td style="width: 50%; vertical-align: top; text-align: right;">
          <div style="display: inline-block; text-align: left;">
            <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; width: 230px;">
              <strong style="color: #0f172a; font-size: 13px;">Dr. {{dentist_name}}</strong><br/>
              <span style="font-size: 11px; color: #64748b;">Attending Dental Practitioner</span><br/>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">Lic. No.: ___________ PTR: ___________</span>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Official Footer & Verification Mark -->
  <div style="margin-top: 40px; padding-top: 12px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
    <span>CONFIDENTIAL MEDICAL RECORD · {{clinic_name}}</span>
    <span>OFFICIAL CLINIC DOCUMENT · VERIFIED VIA DENTLY</span>
  </div>
</div>`;
}

export function TreatmentClient({
  clinicSlug,
  appointment,
  procedures,
  hasExistingConsent,
  hasExistingXray,
  hasExistingPhoto,
  clinicInfo,
  patients = [],
  plannedTreatments = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Planned treatments state
  const [plannedPrices, setPlannedPrices] = useState<Record<string, string>>(
    {},
  );
  const [performingPlannedId, setPerformingPlannedId] = useState<string | null>(
    null,
  );

  const activePlannedTreatments = (plannedTreatments || []).filter((item) => {
    const alreadyInAppointment = appointment.procedures.some((ap) => {
      const teethArr = Array.isArray(ap.toothSelection)
        ? (ap.toothSelection as number[])
        : [];
      const toothMatch = teethArr.includes(item.toothNumber);
      const nameOrCatMatch =
        ap.procedure.name.toLowerCase() === item.procedureName.toLowerCase() ||
        (ap.procedure.category &&
          ap.procedure.category.toLowerCase() ===
            item.category.toLowerCase()) ||
        classifyProcedure(ap.procedure.name, ap.procedure.category) ===
          item.kind;
      return toothMatch && nameOrCatMatch;
    });
    return !alreadyInAppointment && item.stage === "planned";
  });

  function handlePlannedPriceChange(id: string, val: string) {
    setPlannedPrices((prev) => ({ ...prev, [id]: val }));
  }

  function handleLoadPlannedIntoForm(item: PlannedTreatmentItem) {
    const matchedProc = matchClinicProcedure(
      item.kind,
      item.procedureName,
      item.category,
      procedures,
    );
    if (!matchedProc) {
      toast.error("Could not find a matching procedure in clinic catalog");
      return;
    }

    const priceVal =
      plannedPrices[item.id] !== undefined
        ? plannedPrices[item.id]
        : item.price != null
          ? String(item.price)
          : "";

    setSelectedId(matchedProc.id);
    setTeeth([item.toothNumber]);
    if (item.surfaces.length > 0) {
      setSurfaces({ [item.toothNumber]: item.surfaces });
    } else {
      setSurfaces({});
    }
    if (priceVal !== "") {
      setManualPriceOverride(priceVal);
    }
    toast.info(`Loaded ${item.procedureName} into procedure form`);
  }

  async function handlePerformPlannedTreatment(item: PlannedTreatmentItem) {
    const priceVal =
      plannedPrices[item.id] !== undefined
        ? plannedPrices[item.id]
        : item.price != null
          ? String(item.price)
          : "";

    const priceNum = parseFloat(priceVal);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error(`Please enter a valid price for ${item.procedureName}`);
      return;
    }

    const matchedProc = matchClinicProcedure(
      item.kind,
      item.procedureName,
      item.category,
      procedures,
    );

    if (!matchedProc) {
      toast.error("No matching procedure found in catalog");
      return;
    }

    // If procedure has mandatory requirements, guide user to load into form
    if (matchedProc.requireSignedConsent && !hasExistingConsent) {
      toast.info(
        "This procedure requires a signed consent form. Loading into form...",
      );
      handleLoadPlannedIntoForm(item);
      return;
    }
    if (matchedProc.requirePhoto && !hasExistingPhoto) {
      toast.info(
        "This procedure requires a photo upload. Loading into form...",
      );
      handleLoadPlannedIntoForm(item);
      return;
    }
    if (matchedProc.requireXray && !hasExistingXray) {
      toast.info(
        "This procedure requires an X-ray upload. Loading into form...",
      );
      handleLoadPlannedIntoForm(item);
      return;
    }

    setPerformingPlannedId(item.id);
    try {
      const res = await addProcedureToAppointment(clinicSlug, appointment.id, {
        procedureId: matchedProc.id,
        price: priceNum,
        toothSelection: [item.toothNumber],
        surfaceSelection:
          item.surfaces.length > 0
            ? { [item.toothNumber]: item.surfaces }
            : undefined,
      });

      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        const patientId = appointment.patient?.id;
        if (patientId) {
          // Clear and consume the planned treatment stamp so only the permanent appointment record is created
          const noteContent = `[TOOTH_CLEAR:${item.toothNumber}] [TOOTH_CLEAR:${item.toothNumber}:${item.kind}] [TOOTH_CONSUMED:${item.toothNumber}:${item.kind}] Planned ${item.procedureName} completed as permanent appointment record.`;
          await addPatientNote(clinicSlug, patientId, noteContent);
        }
        toast.success(
          `Added ${item.procedureName} (${formatCurrency(priceNum)}) to visit!`,
        );
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(
        "Failed to add procedure: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setPerformingPlannedId(null);
    }
  }

  async function handleCancelVisit() {
    setCancelling(true);
    const res = await cancelTreatmentVisit(clinicSlug, appointment.id);
    if ("error" in res && res.error) {
      toast.error(res.error);
      setCancelling(false);
    } else {
      toast.success("Treatment visit has been cancelled");
      router.push(`/clinic/${clinicSlug}/admin/bookings?tab=queue`);
    }
  }

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
  const [installmentAgreementFile, setInstallmentAgreementFile] =
    useState<File | null>(null);

  // Confirmation modals
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [printContent, setPrintContent] = useState<string | null>(null);

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
    setInstallmentAgreementFile(null);
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
      ? await fileToBase64((await compressImage(consentFile)).file)
      : undefined;
    const photoDocument = photoFile
      ? await fileToBase64((await compressImage(photoFile)).file)
      : undefined;
    const xrayDocument = xrayFile
      ? await fileToBase64((await compressImage(xrayFile)).file)
      : undefined;
    const labDocument = labFile
      ? await fileToBase64((await compressImage(labFile)).file)
      : undefined;
    const installmentAgreementDocument = installmentAgreementFile
      ? await fileToBase64((await compressImage(installmentAgreementFile)).file)
      : undefined;

    try {
      const result = await addProcedureToAppointment(
        clinicSlug,
        appointment.id,
        {
          procedureId: selectedId,
          price: priceNum,
          toothSelection: teeth.length > 0 ? teeth : undefined,
          surfaceSelection:
            Object.keys(surfaces).length > 0 ? surfaces : undefined,
          upperLower: upperLower || undefined,
          material: material || undefined,
          shade: shade || undefined,
          severity: severity || undefined,
          remarks: remarks || undefined,
          consentDocument,
          photoDocument,
          xrayDocument,
          labDocument,
          installmentAgreementDocument,
        },
      );

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Procedure added");

        // If any of the treated teeth had a matching planned treatment, clear it so it's not retained
        if (appointment.patient?.id && teeth.length > 0) {
          const matchingPlanned = (plannedTreatments || []).filter((pt) => {
            const toothMatch = teeth.includes(pt.toothNumber);
            const nameMatch = selected
              ? pt.procedureName.toLowerCase() === selected.name.toLowerCase()
              : false;
            const catMatch =
              Boolean(selected?.category) &&
              pt.category.toLowerCase() === selected?.category?.toLowerCase();
            const kindMatch = selected
              ? pt.kind === classifyProcedure(selected.name, selected.category)
              : false;
            return toothMatch && (nameMatch || catMatch || kindMatch);
          });

          for (const pt of matchingPlanned) {
            try {
              await addPatientNote(
                clinicSlug,
                appointment.patient.id,
                `[TOOTH_CLEAR:${pt.toothNumber}] [TOOTH_CLEAR:${pt.toothNumber}:${pt.kind}] [TOOTH_CONSUMED:${pt.toothNumber}:${pt.kind}] Planned ${pt.procedureName} completed as permanent appointment record.`,
              );
            } catch {
              // Note logging error should not block user workflow
            }
          }
        }

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
        setInstallmentAgreementFile(null);
        setManualPriceOverride(null);
        router.refresh();
      }
    } catch {
      toast.error("Network error while adding procedure. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteProcedure(apProcId: string) {
    startTransition(async () => {
      try {
        const result = await deleteProcedureFromAppointment(
          clinicSlug,
          apProcId,
        );
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Procedure removed");
          router.refresh();
        }
      } catch {
        toast.error(
          "Network error while removing procedure. Please try again.",
        );
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
      try {
        const result = await advanceQueueToPayment(clinicSlug, appointment.id);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Queue advanced to Payment");
          router.push(
            `/clinic/${clinicSlug}/admin/billing/${result.billingId}/pay`,
          );
        }
      } catch {
        toast.error(
          "Network error while advancing to payment. Please try again.",
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">
                {patientName}
              </h1>
              {appointment.queueEntry && (
                <span className="inline-flex items-center justify-center h-6 px-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-100 rounded-lg">
                  Q-{appointment.queueEntry.queueNumber}
                </span>
              )}
              {patients && patients.length > 0 && (
                <LinkPatientDialog
                  appointmentId={appointment.id}
                  clinicSlug={clinicSlug}
                  patients={patients}
                  currentPatient={
                    appointment.patient
                      ? {
                          id: appointment.patient.id,
                          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
                        }
                      : null
                  }
                  bookingName={appointment.bookingName || patientName}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 border-slate-200"
                    >
                      <UserCheck className="h-3 w-3 mr-1 text-slate-500" />
                      Change Patient
                    </Button>
                  }
                />
              )}
            </div>
            <p className="text-xs text-slate-500">
              Attending: {appointment.dentist?.name || "No dentist assigned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <ConfirmActionDialog
            title="Cancel Treatment Visit"
            description={`Are you sure you want to cancel ${patientName}'s visit? This will mark the appointment as CANCELLED and remove it from today's active queue.`}
            confirmLabel="Yes, Cancel Visit"
            destructive
            loading={cancelling}
            onConfirm={handleCancelVisit}
            trigger={
              <Button
                type="button"
                variant="outline"
                disabled={cancelling || isPending || loading}
                className="h-10 px-3 text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Cancel Visit
              </Button>
            }
          />
          {(appointment.procedures.length > 0 ||
            (appointment.patient?.installmentPlans &&
              appointment.patient.installmentPlans.length > 0)) && (
            <Button
              onClick={onProceedToPaymentClick}
              disabled={isPending || loading || cancelling}
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
          {/* Planned Treatments from Chart */}
          {activePlannedTreatments.length > 0 && (
            <Card className="rounded-2xl border-amber-200/90 bg-linear-to-br from-amber-50/50 via-white to-orange-50/20 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Planned Treatments from Chart
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activePlannedTreatments.length} Pending
                    </span>
                  </CardTitle>
                  <span className="text-[11px] text-amber-700 font-medium hidden sm:inline">
                    Ready to perform & add to visit
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {activePlannedTreatments.map((item) => {
                  const itemPrice =
                    plannedPrices[item.id] !== undefined
                      ? plannedPrices[item.id]
                      : item.price != null
                        ? String(item.price)
                        : "";
                  const isPerforming = performingPlannedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white border border-amber-200/80 rounded-xl shadow-2xs hover:border-amber-300 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-teal-700 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md shadow-2xs">
                            #{item.toothNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {item.procedureName}
                          </span>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                          {item.surfaces.length > 0 && (
                            <div className="flex items-center gap-1">
                              {item.surfaces.map((s) => (
                                <span
                                  key={s}
                                  className="text-[9.5px] font-mono font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 px-1 py-0.2 rounded"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                          Planned
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-semibold text-slate-600 shrink-0">
                            Price:
                          </Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              ₱
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0.00 (Enter price)"
                              value={itemPrice}
                              onChange={(e) =>
                                handlePlannedPriceChange(
                                  item.id,
                                  e.target.value,
                                )
                              }
                              className="w-34 pl-6 h-8 text-xs font-mono font-bold bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-amber-500"
                            />
                          </div>
                          {item.price != null && (
                            <span className="text-[10px] text-slate-400 italic hidden sm:inline">
                              (Plan estimate)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadPlannedIntoForm(item)}
                            className="h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer"
                            title="Load into the procedure form to upload consent, photos, or materials"
                          >
                            Load into Form
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPerforming || loading}
                            onClick={() => handlePerformPlannedTreatment(item)}
                            className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-2xs gap-1.5 cursor-pointer"
                          >
                            {isPerforming ? (
                              "Adding..."
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Perform & Add to Visit
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

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
                          hasToothSurface={Boolean(selected.hasToothSurface)}
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
                              const rawHtml =
                                selected.consentTemplate?.content ??
                                buildGenericConsentHtml(selected.name);
                              const patientName = appointment.patient
                                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                                : "Patient";
                              const dentistName =
                                appointment.dentist?.name ??
                                "Attending Dentist";
                              const dateStr = formatDate(new Date());

                              const finalHtml = renderDocumentTemplate(
                                rawHtml,
                                {
                                  clinicName:
                                    clinicInfo?.name || "Clinic Workspace",
                                  clinicAddress:
                                    clinicInfo?.address || "Clinic Address",
                                  clinicPhone:
                                    clinicInfo?.phone || "Clinic Phone",
                                  clinicEmail:
                                    clinicInfo?.email || "clinic@dently.app",
                                  patientName,
                                  dentistName,
                                  procedureName: selected.name,
                                  date: dateStr,
                                },
                              );

                              setPrintContent(finalHtml);
                            }}
                          >
                            Print Form
                          </Button>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
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
                          accept="image/*"
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
                          accept="image/*"
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

                    {/* Installment Agreement Contract Upload (Automatically available when procedure allows installment) */}
                    {selected.isInstallmentAvailable && (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2">
                        <Label className="text-xs font-bold text-indigo-900 block flex items-center justify-between">
                          <span>Installment Agreement Photo (Optional)</span>
                          <span className="text-[10px] font-normal text-indigo-600">
                            Optional
                          </span>
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setInstallmentAgreementFile(
                              e.target.files?.[0] ?? null,
                            )
                          }
                          className="bg-white text-xs"
                        />
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          Upload signed installment agreement photo for this
                          transaction. Uploading is optional because patients
                          may pay in installments or defer signing.
                        </p>
                        {installmentAgreementFile && (
                          <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {installmentAgreementFile.name}
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

      {/* Print Document Preview Modal */}
      <Dialog
        open={!!printContent}
        onOpenChange={(v) => !v && setPrintContent(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="no-print">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>Document Preview</DialogTitle>
              <Button
                size="sm"
                onClick={() => handlePrintDocument(printContent || "")}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print Document
              </Button>
            </div>
          </DialogHeader>
          <div
            id="printable-document"
            className="w-full max-w-[760px] mx-auto print:max-w-none"
            dangerouslySetInnerHTML={{
              __html: printContent || "",
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
