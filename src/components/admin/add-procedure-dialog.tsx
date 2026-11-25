"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Odontogram } from "@/components/ui/odontogram";
import { addProcedureToAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Stethoscope, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { compressImage } from "@/lib/image-compression";

export interface ProcedureOption {
  id: string;
  name: string;
  category: string | null;
  priceType: string;
  price: unknown;
  priceMin: unknown;
  priceMax: unknown;
  hasOdontogram: boolean;
  hasToothSurface: boolean;
  hasUpperLower: boolean;
  hasMaterial: boolean;
  hasShade: boolean;
  hasSeverity: boolean;
  hasRemarks: boolean;
  hasPhotoUpload: boolean;
  hasXrayUpload: boolean;
  hasLabRequest: boolean;
  requireSignedConsent: boolean;
  requirePhoto: boolean;
  requireXray: boolean;
  requireLabDocs: boolean;
  isInstallmentAvailable: boolean;
  consentTemplate: { content: string; name: string } | null;
  priceRules?: unknown;
}

interface Props {
  appointmentId: string;
  clinicSlug: string;
  procedures: ProcedureOption[];
  trigger?: React.ReactNode;
}

function buildGenericConsentHtml(procedureName: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Consent Form – ${procedureName}</title>
  <style>
    @page { size: letter portrait; margin: 0.5in; }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 760px;
      margin: 20px auto;
      padding: 36px 44px;
      font-size: 13.5px;
      color: #0f172a;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      line-height: 1.7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { margin: 0; padding: 0; border: none; max-width: 100%; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Executive Medical Letterhead -->
  <div style="margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="vertical-align: middle; width: 60%;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: #0f172a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; font-family: sans-serif;">
              ✚
            </div>
            <div>
              <h2 style="margin: 0; font-size: 20px; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1.2;">
                DENTAL PRACTICE WORKSPACE
              </h2>
              <p style="margin: 3px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #0284c7; text-transform: uppercase;">
                Dental Clinic &amp; Oral Healthcare Practice
              </p>
            </div>
          </div>
        </td>
        <td style="vertical-align: middle; width: 40%; text-align: right; font-size: 11px; color: #475569; line-height: 1.6;">
          <strong style="color: #0f172a;">Official Clinical Record</strong><br/>
          <span>Patient Informed Consent Documentation</span>
        </td>
      </tr>
    </table>
    <div style="margin-top: 16px; border-bottom: 2.5px solid #0f172a;"></div>
    <div style="margin-top: 2px; border-bottom: 1px solid #0284c7;"></div>
  </div>

  <!-- Structured Clinical Metadata Header -->
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <tr>
        <td style="padding: 3px 0; width: 55%; vertical-align: top;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Patient Name</span><br/>
          <strong style="color: #0f172a; font-size: 14px;">_______________________________</strong>
        </td>
        <td style="padding: 3px 0; width: 45%; vertical-align: top; text-align: right;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Date of Birth / Date</span><br/>
          <strong style="color: #0f172a; font-size: 13px;">____ / ____ / ________</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 6px 0 0 0; vertical-align: top;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Attending Dentist</span><br/>
          <span style="color: #1e293b; font-size: 12px; font-weight: 600;">Dr. ___________________________</span>
        </td>
        <td style="padding: 6px 0 0 0; vertical-align: top; text-align: right;">
          <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Clinical Procedure</span><br/>
          <span style="color: #1e293b; font-size: 12px; font-weight: 600;">${procedureName}</span>
        </td>
      </tr>
    </table>
  </div>

  <!-- Title Badge -->
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0f172a; background: #ffffff; border: 1.5px solid #cbd5e1; padding: 6px 22px; border-radius: 6px;">
      INFORMED CONSENT FOR DENTAL TREATMENT
    </span>
  </div>

  <div style="font-size: 13.5px; color: #334155; line-height: 1.7; margin-bottom: 24px;">
    <p style="margin-bottom: 14px;">I, the undersigned patient (or legal guardian/authorized representative), hereby give my informed authorization and consent to perform the dental procedure: <strong style="color: #0f172a; text-decoration: underline;">${procedureName}</strong>.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Terms &amp; Clinical Acknowledgments:</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.6;">
        <li style="margin-bottom: 6px;">The nature of the procedure, its purpose, material risks, expected benefits, and available clinical alternatives have been thoroughly explained to me.</li>
        <li style="margin-bottom: 6px;">I understand that dental treatments involve inherent risks including but not limited to discomfort, sensitivity, bleeding, swelling, nerve proximity, or allergic responses to local anesthetics or materials.</li>
        <li style="margin-bottom: 6px;">I acknowledge that unforeseen clinical conditions may require modification to the original procedural plan, and I authorize necessary adjustments in good clinical judgment.</li>
        <li>I have had the opportunity to ask questions and all my questions have been answered to my satisfaction.</li>
      </ul>
    </div>
  </div>

  <!-- Official Signature Block -->
  <div style="margin-top: 48px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 24px;">
          <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; width: 220px;">
            <strong style="color: #0f172a; font-size: 13px;">Patient / Guardian Signature</strong><br/>
            <span style="font-size: 11px; color: #64748b;">Printed Name: _____________________</span><br/>
            <span style="font-size: 10px; color: #94a3b8;">Date Signed: ____ / ____ / ________</span>
          </div>
        </td>
        <td style="width: 50%; vertical-align: top; text-align: right;">
          <div style="display: inline-block; text-align: left;">
            <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; width: 230px;">
              <strong style="color: #0f172a; font-size: 13px;">Attending Dentist Signature</strong><br/>
              <span style="font-size: 11px; color: #64748b;">Attending Dental Practitioner</span><br/>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">Lic. No.: ___________ PTR: ___________</span>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Official Footer -->
  <div style="margin-top: 40px; padding-top: 12px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
    <span>CONFIDENTIAL MEDICAL RECORD</span>
    <span>OFFICIAL CLINIC DOCUMENT</span>
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`;
}
export interface PriceRules {
  severityPrices?: Record<string, number>;
  materialPrices?: Array<{ name: string; surcharge: number }>;
  shadePrices?: Array<{ name: string; surcharge: number }>;
  toothSurfaceSurcharge?: number;
  doubleArchSurcharge?: number;
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

export function AddProcedureDialog({
  appointmentId,
  clinicSlug,
  procedures,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
  const router = useRouter();

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
    setManualPriceOverride(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return toast.error("Select a procedure");
    const priceNum = parseFloat(currentPrice);
    if (isNaN(priceNum) || priceNum < 0)
      return toast.error("Enter a valid price");
    if (selected?.requireSignedConsent && !consentFile) {
      return toast.error("Upload a signed consent form to proceed");
    }

    setLoading(true);
    try {
      let consentDocument:
        | {
            base64: string;
            mimeType: string;
            fileName: string;
            fileSize: number;
          }
        | undefined;
      if (selected?.requireSignedConsent && consentFile) {
        const buffer = await consentFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++)
          binary += String.fromCharCode(bytes[i]);
        consentDocument = {
          base64: btoa(binary),
          mimeType: consentFile.type || "application/octet-stream",
          fileName: consentFile.name,
          fileSize: consentFile.size,
        };
      }

      const result = await addProcedureToAppointment(
        clinicSlug,
        appointmentId,
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
        },
      );

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Procedure added");
        setOpen(false);
        setSelectedId("");
        setManualPriceOverride(null);
        setConsentFile(null);
        router.refresh();
      }
    } catch {
      toast.error("Network error while adding procedure. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            Procedure
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Procedure</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Procedure select */}
          <div className="space-y-2">
            <Label>Procedure *</Label>
            <Select value={selectedId} onValueChange={handleSelectProcedure}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a procedure..." />
              </SelectTrigger>
              <SelectContent>
                {procedures.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span>{p.name}</span>
                    {p.category && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({p.category})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected?.requireSignedConsent && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Signed consent form required
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => {
                    const html =
                      selected?.consentTemplate?.content ??
                      buildGenericConsentHtml(
                        selected?.name ?? "Dental Procedure",
                      );
                    const blob = new Blob([html], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  }}
                >
                  Print / Download Form
                </Button>
              </div>
              <p className="text-xs text-amber-700">
                Print the consent form, have the patient sign it, then upload
                the signed copy below.
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const rawFile = e.target.files?.[0];
                  if (rawFile) {
                    try {
                      const { file: compressed } = await compressImage(rawFile);
                      setConsentFile(compressed);
                    } catch {
                      setConsentFile(rawFile);
                    }
                  } else {
                    setConsentFile(null);
                  }
                }}
                className="cursor-pointer text-sm"
              />
              {consentFile && (
                <p className="text-xs text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {consentFile.name}
                </p>
              )}
            </div>
          )}

          {selected && (
            <>
              {/* Price */}
              <div className="space-y-2">
                <Label>
                  Price (₱)
                  {selected.priceType === "RANGE" &&
                    selected.priceMin != null &&
                    selected.priceMax != null && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        Range: {formatCurrency(Number(selected.priceMin))} –{" "}
                        {formatCurrency(Number(selected.priceMax))}
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
                  className={selected.priceType === "FIXED" ? "bg-muted" : ""}
                  required
                />
              </div>

              {/* Upper / Lower */}
              {selected.hasUpperLower && (
                <div className="space-y-2">
                  <Label>Arch</Label>
                  <Select value={upperLower} onValueChange={setUpperLower}>
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>
                    Tooth Selection{" "}
                    {selected.hasToothSurface && (
                      <span className="text-xs text-muted-foreground font-normal">
                        — click a tooth then select surfaces
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
                  <Label>Material</Label>
                  {(selected.priceRules as PriceRules | undefined)
                    ?.materialPrices &&
                  (selected.priceRules as PriceRules).materialPrices!.length >
                    0 ? (
                    <Select value={material} onValueChange={setMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          (selected.priceRules as PriceRules).materialPrices ||
                          []
                        ).map((m) => (
                          <SelectItem key={m.name} value={m.name}>
                            {m.name} (+{formatCurrency(Number(m.surcharge))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="e.g. Composite, PFM, Zirconia..."
                    />
                  )}
                </div>
              )}

              {/* Shade */}
              {selected.hasShade && (
                <div className="space-y-2">
                  <Label>Shade</Label>
                  {(selected.priceRules as PriceRules | undefined)
                    ?.shadePrices &&
                  (selected.priceRules as PriceRules).shadePrices!.length >
                    0 ? (
                    <Select value={shade} onValueChange={setShade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shade..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          (selected.priceRules as PriceRules).shadePrices || []
                        ).map((s) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.name} (+{formatCurrency(Number(s.surcharge))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={shade}
                      onChange={(e) => setShade(e.target.value)}
                      placeholder="e.g. A2, B1..."
                    />
                  )}
                </div>
              )}

              {/* Severity */}
              {selected.hasSeverity && (
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
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

              {/* Remarks */}
              {selected.hasRemarks && (
                <div className="space-y-2">
                  <Label>Remarks / Notes</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Clinical findings, notes..."
                    rows={3}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !selectedId}
            >
              {loading ? "Saving..." : "Add Procedure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
