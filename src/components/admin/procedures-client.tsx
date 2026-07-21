"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createProcedure,
  updateProcedure,
  toggleProcedureActive,
  createConsentTemplate,
} from "@/app/actions/procedures";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Power,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { TablePagination } from "@/components/ui/pagination";

interface ConsentTemplate {
  id: string;
  name: string;
}

interface Procedure {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priceType: string;
  price: unknown;
  priceMin: unknown;
  priceMax: unknown;
  isActive: boolean;
  hasOdontogram: boolean;
  hasToothSurface: boolean;
  hasUpperLower: boolean;
  hasQuadrant: boolean;
  hasMaterial: boolean;
  hasShade: boolean;
  hasSeverity: boolean;
  hasQuantity: boolean;
  hasRemarks: boolean;
  hasPhotoUpload: boolean;
  hasXrayUpload: boolean;
  hasLabRequest: boolean;
  autoConsentForm: boolean;
  autoPrescription: boolean;
  autoMedCert: boolean;
  autoFollowUp: boolean;
  requireSignedConsent: boolean;
  requirePhoto: boolean;
  requireXray: boolean;
  requireLabDocs: boolean;
  consentTemplateId: string | null;
  consentTemplate: { id: string; name: string } | null;
  priceRules?: unknown;
}

interface PriceRules {
  severityPrices?: {
    MILD?: number;
    MODERATE?: number;
    SEVERE?: number;
  };
  materialPrices?: Array<{ name: string; surcharge: number }>;
  shadePrices?: Array<{ name: string; surcharge: number }>;
  toothSurfaceSurcharge?: number;
  doubleArchSurcharge?: number;
}

const toggleFields = [
  {
    group: "Components",
    fields: [
      { key: "hasOdontogram", label: "Odontogram" },
      { key: "hasToothSurface", label: "Tooth Surface" },
      { key: "hasUpperLower", label: "Upper/Lower" },
      { key: "hasQuadrant", label: "Quadrant" },
      { key: "hasMaterial", label: "Material Used" },
      { key: "hasShade", label: "Shade Selection" },
      { key: "hasSeverity", label: "Severity" },
      { key: "hasQuantity", label: "Quantity" },
      { key: "hasRemarks", label: "Remarks" },
      { key: "hasPhotoUpload", label: "Photo Upload" },
      { key: "hasXrayUpload", label: "X-Ray Upload" },
      { key: "hasLabRequest", label: "Lab Request" },
    ],
  },
  {
    group: "Auto Actions",
    fields: [
      { key: "autoConsentForm", label: "Generate Consent Form" },
      { key: "autoPrescription", label: "Generate Prescription" },
      { key: "autoMedCert", label: "Generate Medical Certificate" },
      { key: "autoFollowUp", label: "Create Follow-up" },
    ],
  },
  {
    group: "Required Uploads",
    fields: [
      { key: "requireSignedConsent", label: "Signed Consent" },
      { key: "requirePhoto", label: "Photo" },
      { key: "requireXray", label: "X-Ray" },
      { key: "requireLabDocs", label: "Laboratory Documents" },
    ],
  },
  {
    group: "Payment Options",
    fields: [
      { key: "isInstallmentAvailable", label: "Available for Installment" },
    ],
  },
];

function CreateTemplateInline({
  clinicSlug,
  onCreated,
}: {
  clinicSlug: string;
  onCreated: (t: ConsentTemplate) => void;
}) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !content.trim())
      return toast.error("Name and content are required");
    setLoading(true);
    const result = await createConsentTemplate(clinicSlug, name, content);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Consent template created");
      onCreated(result.template as ConsentTemplate);
      setName("");
      setContent("");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3 space-y-3">
      <p className="text-xs font-medium text-blue-800">
        Create a new consent form template
      </p>
      <div className="space-y-2">
        <Input
          placeholder="Template name (e.g. General Consent)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm h-8"
        />
        <Textarea
          placeholder="Paste or type the consent form text here…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="text-sm"
        />
      </div>
      <Button
        type="button"
        size="sm"
        onClick={handleCreate}
        disabled={loading || !name.trim() || !content.trim()}
      >
        {loading ? "Creating…" : "Create Template"}
      </Button>
    </div>
  );
}

function ProcedureForm({
  procedure,
  clinicSlug,
  consentTemplates: initialTemplates,
  existingCategories,
  onClose,
}: {
  procedure?: Procedure;
  clinicSlug: string;
  consentTemplates: ConsentTemplate[];
  existingCategories: string[];
  onClose: () => void;
}) {
  const [priceType, setPriceType] = useState(procedure?.priceType || "FIXED");
  const [category, setCategory] = useState(procedure?.category || "");
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(
      toggleFields
        .flatMap((g) => g.fields)
        .map((f) => [f.key, (procedure as never)?.[f.key] ?? false]),
    ),
  );
  const [consentTemplateId, setConsentTemplateId] = useState(
    procedure?.consentTemplateId ?? "",
  );
  const [templates, setTemplates] =
    useState<ConsentTemplate[]>(initialTemplates);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const initialRules = (procedure?.priceRules as PriceRules | null) || {};
  const [severityPrices, setSeverityPrices] = useState({
    MILD: initialRules.severityPrices?.MILD ?? 0,
    MODERATE: initialRules.severityPrices?.MODERATE ?? 0,
    SEVERE: initialRules.severityPrices?.SEVERE ?? 0,
  });
  const [materialPrices, setMaterialPrices] = useState<
    Array<{ name: string; surcharge: number }>
  >(initialRules.materialPrices ?? []);
  const [shadePrices, setShadePrices] = useState<
    Array<{ name: string; surcharge: number }>
  >(initialRules.shadePrices ?? []);
  const [toothSurfaceSurcharge, setToothSurfaceSurcharge] = useState<number>(
    initialRules.toothSurfaceSurcharge ?? 0,
  );
  const [doubleArchSurcharge, setDoubleArchSurcharge] = useState<number>(
    initialRules.doubleArchSurcharge ?? 0,
  );

  const requiresConsent = toggles["requireSignedConsent"];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (requiresConsent && !consentTemplateId) {
      return toast.error("Select a consent form template for this procedure");
    }

    const fd = new FormData(e.currentTarget);

    if (priceType === "RANGE") {
      const min = Number(fd.get("priceMin"));
      const max = Number(fd.get("priceMax"));
      if (min > max) {
        return toast.error(
          "Minimum price cannot be greater than maximum price",
        );
      }
    }

    setLoading(true);
    Object.entries(toggles).forEach(([k, v]) => fd.set(k, String(v)));
    fd.set("priceType", priceType);
    fd.set("consentTemplateId", consentTemplateId);
    fd.set("category", category);

    const finalRules = {
      severityPrices,
      materialPrices,
      shadePrices,
      toothSurfaceSurcharge,
      doubleArchSurcharge,
    };
    fd.set("priceRules", JSON.stringify(finalRules));

    const result = procedure
      ? await updateProcedure(clinicSlug, procedure.id, fd)
      : await createProcedure(clinicSlug, fd);

    if ("error" in result) toast.error(result.error);
    else {
      toast.success(procedure ? "Procedure updated" : "Procedure created");
      onClose();
      router.refresh();
    }
    setLoading(false);
  }

  function handleTemplateCreated(t: ConsentTemplate) {
    setTemplates((prev) => [...prev, t]);
    setConsentTemplateId(t.id);
    setShowCreateTemplate(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-h-[70vh] overflow-y-auto p-1.5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label className="text-xs font-bold text-slate-700">
            Procedure Name *
          </Label>
          <Input
            name="name"
            defaultValue={procedure?.name}
            required
            className="text-sm bg-white"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label className="text-xs font-bold text-slate-700">
            Description
          </Label>
          <Textarea
            name="description"
            defaultValue={procedure?.description || ""}
            rows={2}
            className="text-sm bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Category</Label>
          <Input
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Restorative"
            className="text-sm bg-white"
          />
          {existingCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5 select-none">
              {existingCategories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">
            Pricing Type
          </Label>
          <Select value={priceType} onValueChange={setPriceType}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixed Price</SelectItem>
              <SelectItem value="MANUAL">Manual (set per patient)</SelectItem>
              <SelectItem value="RANGE">Price Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {priceType === "FIXED" && (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              Price (₱)
            </Label>
            <Input
              name="price"
              type="number"
              step="0.01"
              defaultValue={procedure?.price as string}
              className="bg-white"
            />
          </div>
        )}
        {priceType === "RANGE" && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                Min Price (₱)
              </Label>
              <Input
                name="priceMin"
                type="number"
                step="0.01"
                defaultValue={procedure?.priceMin as string}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                Max Price (₱)
              </Label>
              <Input
                name="priceMax"
                type="number"
                step="0.01"
                defaultValue={procedure?.priceMax as string}
                className="bg-white"
              />
            </div>
          </>
        )}
      </div>

      {toggleFields.map((group) => (
        <div
          key={group.group}
          className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl space-y-4"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono select-none">
            {group.group}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {group.fields.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-100/40 rounded-lg transition-colors"
              >
                <Label
                  className="text-xs font-semibold text-slate-700 cursor-pointer flex-1 py-1"
                  htmlFor={f.key}
                >
                  {f.label}
                </Label>
                <Switch
                  id={f.key}
                  checked={toggles[f.key]}
                  onCheckedChange={(v) =>
                    setToggles((prev) => ({ ...prev, [f.key]: v }))
                  }
                />
              </div>
            ))}
          </div>

          {/* Surcharge configurations — shown when corresponding toggles are ON */}
          {group.group === "Components" && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              {toggles.hasToothSurface && (
                <div className="space-y-1.5 p-3 bg-white border border-slate-200/60 rounded-xl">
                  <Label className="text-xs font-bold text-slate-700">
                    Tooth Surface Surcharge (Rule A) (₱) *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Surcharge per surface (e.g. 200)"
                    value={toothSurfaceSurcharge || ""}
                    onChange={(e) =>
                      setToothSurfaceSurcharge(Number(e.target.value))
                    }
                    className="h-9 text-xs"
                  />
                </div>
              )}
              {toggles.hasUpperLower && (
                <div className="space-y-1.5 p-3 bg-white border border-slate-200/60 rounded-xl">
                  <Label className="text-xs font-bold text-slate-700">
                    Flat Double-Arch Surcharge (₱) *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Surcharge when 'Both' is selected (e.g. 1200)"
                    value={doubleArchSurcharge || ""}
                    onChange={(e) =>
                      setDoubleArchSurcharge(Number(e.target.value))
                    }
                    className="h-9 text-xs"
                  />
                </div>
              )}
              {toggles.hasSeverity && (
                <div className="space-y-2 p-3 bg-white border border-slate-200/60 rounded-xl col-span-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Severity Surcharges (₱)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold">
                        Moderate Surcharge
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={severityPrices.MODERATE || ""}
                        onChange={(e) =>
                          setSeverityPrices((prev) => ({
                            ...prev,
                            MODERATE: Number(e.target.value),
                          }))
                        }
                        placeholder="e.g. 500"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold">
                        Severe Surcharge
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={severityPrices.SEVERE || ""}
                        onChange={(e) =>
                          setSeverityPrices((prev) => ({
                            ...prev,
                            SEVERE: Number(e.target.value),
                          }))
                        }
                        placeholder="e.g. 1000"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
              {toggles.hasMaterial && (
                <div className="space-y-2.5 p-3 bg-white border border-slate-200/60 rounded-xl col-span-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Material Options & Surcharges
                  </Label>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {materialPrices.length === 0 ? (
                      <p className="text-[10px] text-slate-400">
                        No custom material options added yet.
                      </p>
                    ) : (
                      materialPrices.map((m, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-xs p-1 bg-slate-50 border border-slate-200/60 rounded-md"
                        >
                          <span>
                            {m.name} (+{formatCurrency(m.surcharge)})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setMaterialPrices((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      id="new-material-name"
                      placeholder="Material (e.g. Zirconia)"
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      id="new-material-surcharge"
                      type="number"
                      min="0"
                      placeholder="Surcharge"
                      className="h-8 text-xs w-20"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const nameEl = document.getElementById(
                          "new-material-name",
                        ) as HTMLInputElement;
                        const surchargeEl = document.getElementById(
                          "new-material-surcharge",
                        ) as HTMLInputElement;
                        if (nameEl && surchargeEl && nameEl.value.trim()) {
                          setMaterialPrices((prev) => [
                            ...prev,
                            {
                              name: nameEl.value.trim(),
                              surcharge: Number(surchargeEl.value) || 0,
                            },
                          ]);
                          nameEl.value = "";
                          surchargeEl.value = "";
                        }
                      }}
                      className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
              {toggles.hasShade && (
                <div className="space-y-2.5 p-3 bg-white border border-slate-200/60 rounded-xl col-span-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Shade Options & Surcharges (Optional)
                  </Label>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {shadePrices.length === 0 ? (
                      <p className="text-[10px] text-slate-400">
                        No custom shade options added yet.
                      </p>
                    ) : (
                      shadePrices.map((s, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-xs p-1 bg-slate-50 border border-slate-200/60 rounded-md"
                        >
                          <span>
                            {s.name} (+{formatCurrency(s.surcharge)})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShadePrices((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      id="new-shade-name"
                      placeholder="Shade (e.g. Bleach)"
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      id="new-shade-surcharge"
                      type="number"
                      min="0"
                      placeholder="Surcharge"
                      className="h-8 text-xs w-20"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const nameEl = document.getElementById(
                          "new-shade-name",
                        ) as HTMLInputElement;
                        const surchargeEl = document.getElementById(
                          "new-shade-surcharge",
                        ) as HTMLInputElement;
                        if (nameEl && surchargeEl && nameEl.value.trim()) {
                          setShadePrices((prev) => [
                            ...prev,
                            {
                              name: nameEl.value.trim(),
                              surcharge: Number(surchargeEl.value) || 0,
                            },
                          ]);
                          nameEl.value = "";
                          surchargeEl.value = "";
                        }
                      }}
                      className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Consent template selector — shown when requireSignedConsent is on */}
          {group.group === "Required Uploads" && requiresConsent && (
            <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-amber-900 flex items-center gap-1.5 select-none">
                  <FileText className="h-3.5 w-3.5" />
                  Consent Form Template *
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] font-bold text-blue-700 hover:bg-blue-50/50"
                  onClick={() => setShowCreateTemplate((v) => !v)}
                >
                  {showCreateTemplate ? (
                    <ChevronUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-0.5" />
                  )}
                  {showCreateTemplate ? "Cancel" : "+ New Template"}
                </Button>
              </div>

              {showCreateTemplate && (
                <CreateTemplateInline
                  clinicSlug={clinicSlug}
                  onCreated={handleTemplateCreated}
                />
              )}

              {templates.length === 0 && !showCreateTemplate ? (
                <p className="text-xs text-amber-700 select-none">
                  No consent templates yet. Click &quot;+ New Template&quot; to
                  create one first.
                </p>
              ) : (
                <Select
                  value={consentTemplateId}
                  onValueChange={setConsentTemplateId}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-amber-200 focus:ring-amber-400">
                    <SelectValue placeholder="Select a consent template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {requiresConsent && !consentTemplateId && (
                <p className="text-[10px] font-semibold text-red-600 select-none">
                  A consent template is required before saving.
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Switch
          name="isActive"
          defaultChecked={procedure?.isActive ?? true}
          id="isActive"
        />
        <Label
          htmlFor="isActive"
          className="text-xs font-bold text-slate-700 cursor-pointer"
        >
          Active and available for clinic use
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
        disabled={loading}
      >
        {loading
          ? "Saving..."
          : procedure
            ? "Update Procedure"
            : "Create Procedure"}
      </Button>
    </form>
  );
}

export function ProceduresClient({
  procedures,
  consentTemplates,
  clinicSlug,
  total,
  page,
}: {
  procedures: Procedure[];
  consentTemplates: ConsentTemplate[];
  clinicSlug: string;
  total: number;
  page: number;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const router = useRouter();

  const categories = Array.from(
    new Set(procedures.map((p) => p.category).filter(Boolean)),
  ) as string[];

  const filteredProcedures = procedures.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function getPriceLabel(p: Procedure) {
    if (p.priceType === "FIXED" && p.price)
      return formatCurrency(Number(p.price));
    if (p.priceType === "RANGE" && p.priceMin && p.priceMax)
      return `${formatCurrency(Number(p.priceMin))} – ${formatCurrency(Number(p.priceMax))}`;
    return "Manual";
  }

  async function handleToggleActive(p: Procedure) {
    const result = await toggleProcedureActive(clinicSlug, p.id, !p.isActive);
    if ("error" in result) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search procedures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-sm border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="bg-white border-slate-200/80 focus:ring-primary rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(v) => {
            setDialogOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditing(null)}
              className="h-10 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
            >
              <Plus className="h-4.5 w-4.5 mr-1" /> New Procedure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl rounded-2xl border-slate-200/60 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900 tracking-tight">
                {editing ? "Edit Procedure" : "Create Procedure"}
              </DialogTitle>
            </DialogHeader>
            <ProcedureForm
              procedure={editing || undefined}
              clinicSlug={clinicSlug}
              consentTemplates={consentTemplates}
              existingCategories={categories}
              onClose={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-between items-center select-none">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          Showing {filteredProcedures.length} of {procedures.length} procedures
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProcedures.length === 0 && (
          <p className="col-span-full text-center text-slate-400 py-12 select-none text-sm font-medium">
            No matching procedures found.
          </p>
        )}
        {filteredProcedures.map((p) => (
          <Card
            key={p.id}
            className={`border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 ${!p.isActive ? "opacity-60" : ""}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {p.name}
                  </CardTitle>
                  {p.category && (
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase font-mono mt-0.5">
                      {p.category}
                    </p>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 text-[10px] px-2.5 py-0.5 rounded-full font-bold select-none border ${
                    p.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {p.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {[
                  p.hasOdontogram && "Odontogram",
                  p.hasToothSurface && "Surfaces",
                  p.hasPhotoUpload && "Photo",
                  p.hasXrayUpload && "X-Ray",
                  p.autoConsentForm && "Consent Form",
                  p.autoPrescription && "Prescription",
                  p.requireSignedConsent && "Consent Required",
                ]
                  .filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag as string}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md select-none ${
                        tag === "Consent Required"
                          ? "bg-amber-50 text-amber-800 border border-amber-100"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100/50"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              {p.requireSignedConsent && p.consentTemplate && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5 select-none bg-slate-50 border border-slate-100 rounded-lg p-2 font-medium">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Template: {p.consentTemplate.name}
                </p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100/60">
                <span className="font-extrabold text-primary text-sm tracking-wide">
                  {getPriceLabel(p)}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(p)}
                    className="hover:bg-slate-100/60 rounded-lg"
                  >
                    <Power
                      className={`h-4 w-4 ${p.isActive ? "text-rose-500" : "text-emerald-500"}`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setDialogOpen(true);
                    }}
                    className="hover:bg-slate-100/60 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TablePagination total={total} page={page} itemName="procedures" />
    </div>
  );
}
