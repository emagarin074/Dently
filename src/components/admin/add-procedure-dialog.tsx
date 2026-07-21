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
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 24px; font-size: 13px; color: #111; }
    h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 13px; text-align: center; color: #555; font-weight: normal; margin-bottom: 24px; }
    p { line-height: 1.7; margin: 10px 0; }
    .field { border-bottom: 1px solid #333; display: inline-block; min-width: 220px; margin: 0 4px; }
    .section { margin-top: 28px; }
    .sig-row { display: flex; gap: 40px; margin-top: 32px; }
    .sig-box { flex: 1; }
    .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 11px; color: #555; }
    @media print { body { margin: 20px; } button { display: none; } }
  </style>
</head>
<body>
  <h1>Patient Informed Consent Form</h1>
  <h2>${procedureName}</h2>

  <div class="section">
    <p>Patient Name: <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
       Date of Birth: <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>
    <p>Date: <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
       Dentist: <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>
  </div>

  <div class="section">
    <p><strong>Procedure:</strong> ${procedureName}</p>
    <p>I, the undersigned patient (or guardian/authorized representative), hereby give my informed consent to the above-named dental procedure. I acknowledge that the nature of the procedure, its purpose, material risks, benefits, alternatives, and expected outcomes have been explained to me by the attending dental professional.</p>
    <p>I understand that dental procedures involve inherent risks including but not limited to: infection, pain, swelling, nerve sensitivity, allergic reactions to anesthetics or materials, and in rare cases, injury to adjacent structures. I have had the opportunity to ask questions and all my questions have been answered satisfactorily.</p>
    <p>I acknowledge that no guarantee has been made regarding the outcome of this procedure. I agree to follow all post-procedure instructions provided and to promptly report any unusual symptoms or complications.</p>
    <p>I authorize the dental team to take photographs or radiographs as clinically necessary for the purpose of treatment planning and record-keeping, subject to applicable privacy laws.</p>
  </div>

  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-line">Patient / Guardian Signature</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Print Name</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Date Signed</div>
    </div>
  </div>

  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-line">Dentist / Witness Signature</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Print Name &amp; License No.</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Date</div>
    </div>
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

    let consentDocument:
      | { base64: string; mimeType: string; fileName: string; fileSize: number }
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

    const result = await addProcedureToAppointment(clinicSlug, appointmentId, {
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
    });

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
    setLoading(false);
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
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setConsentFile(e.target.files?.[0] ?? null)}
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
