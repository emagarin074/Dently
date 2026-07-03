"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { createProcedure, updateProcedure, toggleProcedureActive, createConsentTemplate } from "@/app/actions/procedures"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Power, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ConsentTemplate { id: string; name: string }

interface Procedure {
  id: string; name: string; description: string | null; category: string | null
  priceType: string; price: unknown; priceMin: unknown; priceMax: unknown; isActive: boolean
  hasOdontogram: boolean; hasToothSurface: boolean; hasUpperLower: boolean; hasQuadrant: boolean
  hasMaterial: boolean; hasShade: boolean; hasSeverity: boolean; hasQuantity: boolean
  hasRemarks: boolean; hasPhotoUpload: boolean; hasXrayUpload: boolean; hasLabRequest: boolean
  autoConsentForm: boolean; autoPrescription: boolean; autoMedCert: boolean; autoFollowUp: boolean
  requireSignedConsent: boolean; requirePhoto: boolean; requireXray: boolean; requireLabDocs: boolean
  consentTemplateId: string | null
  consentTemplate: { id: string; name: string } | null
}

const toggleFields = [
  { group: "Components", fields: [
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
  ]},
  { group: "Auto Actions", fields: [
    { key: "autoConsentForm", label: "Generate Consent Form" },
    { key: "autoPrescription", label: "Generate Prescription" },
    { key: "autoMedCert", label: "Generate Medical Certificate" },
    { key: "autoFollowUp", label: "Create Follow-up" },
  ]},
  { group: "Required Uploads", fields: [
    { key: "requireSignedConsent", label: "Signed Consent" },
    { key: "requirePhoto", label: "Photo" },
    { key: "requireXray", label: "X-Ray" },
    { key: "requireLabDocs", label: "Laboratory Documents" },
  ]},
]

function CreateTemplateInline({
  clinicSlug,
  onCreated,
}: {
  clinicSlug: string
  onCreated: (t: ConsentTemplate) => void
}) {
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !content.trim()) return toast.error("Name and content are required")
    setLoading(true)
    const result = await createConsentTemplate(clinicSlug, name, content)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success("Consent template created")
      onCreated(result.template as ConsentTemplate)
      setName("")
      setContent("")
    }
    setLoading(false)
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3 space-y-3">
      <p className="text-xs font-medium text-blue-800">Create a new consent form template</p>
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
      <Button type="button" size="sm" onClick={handleCreate} disabled={loading || !name.trim() || !content.trim()}>
        {loading ? "Creating…" : "Create Template"}
      </Button>
    </div>
  )
}

function ProcedureForm({
  procedure,
  clinicSlug,
  consentTemplates: initialTemplates,
  onClose,
}: {
  procedure?: Procedure
  clinicSlug: string
  consentTemplates: ConsentTemplate[]
  onClose: () => void
}) {
  const [priceType, setPriceType] = useState(procedure?.priceType || "FIXED")
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(
      toggleFields.flatMap(g => g.fields).map(f => [f.key, (procedure as never)?.[f.key] ?? false])
    )
  )
  const [consentTemplateId, setConsentTemplateId] = useState(procedure?.consentTemplateId ?? "")
  const [templates, setTemplates] = useState<ConsentTemplate[]>(initialTemplates)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const requiresConsent = toggles["requireSignedConsent"]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (requiresConsent && !consentTemplateId) {
      return toast.error("Select a consent form template for this procedure")
    }
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    Object.entries(toggles).forEach(([k, v]) => fd.set(k, String(v)))
    fd.set("priceType", priceType)
    fd.set("consentTemplateId", consentTemplateId)

    const result = procedure
      ? await updateProcedure(clinicSlug, procedure.id, fd)
      : await createProcedure(clinicSlug, fd)

    if ("error" in result) toast.error(result.error)
    else { toast.success(procedure ? "Procedure updated" : "Procedure created"); onClose(); router.refresh() }
    setLoading(false)
  }

  function handleTemplateCreated(t: ConsentTemplate) {
    setTemplates(prev => [...prev, t])
    setConsentTemplateId(t.id)
    setShowCreateTemplate(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 col-span-2">
          <Label>Procedure Name *</Label>
          <Input name="name" defaultValue={procedure?.name} required />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Description</Label>
          <Textarea name="description" defaultValue={procedure?.description || ""} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input name="category" defaultValue={procedure?.category || ""} placeholder="e.g. Restorative" />
        </div>
        <div className="space-y-2">
          <Label>Pricing Type</Label>
          <Select value={priceType} onValueChange={setPriceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixed Price</SelectItem>
              <SelectItem value="MANUAL">Manual (set per patient)</SelectItem>
              <SelectItem value="RANGE">Price Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {priceType === "FIXED" && (
          <div className="space-y-2">
            <Label>Price (₱)</Label>
            <Input name="price" type="number" step="0.01" defaultValue={procedure?.price as string} />
          </div>
        )}
        {priceType === "RANGE" && (
          <>
            <div className="space-y-2">
              <Label>Min Price (₱)</Label>
              <Input name="priceMin" type="number" step="0.01" defaultValue={procedure?.priceMin as string} />
            </div>
            <div className="space-y-2">
              <Label>Max Price (₱)</Label>
              <Input name="priceMax" type="number" step="0.01" defaultValue={procedure?.priceMax as string} />
            </div>
          </>
        )}
      </div>

      {toggleFields.map((group) => (
        <div key={group.group}>
          <Separator className="my-2" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{group.group}</p>
          <div className="grid grid-cols-2 gap-2">
            {group.fields.map((f) => (
              <div key={f.key} className="flex items-center justify-between">
                <Label className="text-sm cursor-pointer">{f.label}</Label>
                <Switch
                  checked={toggles[f.key]}
                  onCheckedChange={(v) => setToggles(prev => ({ ...prev, [f.key]: v }))}
                />
              </div>
            ))}
          </div>

          {/* Consent template selector — shown when requireSignedConsent is on */}
          {group.group === "Required Uploads" && requiresConsent && (
            <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-amber-900 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Consent Form Template *
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-blue-700"
                  onClick={() => setShowCreateTemplate(v => !v)}
                >
                  {showCreateTemplate ? <ChevronUp className="h-3 w-3 mr-0.5" /> : <ChevronDown className="h-3 w-3 mr-0.5" />}
                  {showCreateTemplate ? "Cancel" : "+ New Template"}
                </Button>
              </div>

              {showCreateTemplate && (
                <CreateTemplateInline clinicSlug={clinicSlug} onCreated={handleTemplateCreated} />
              )}

              {templates.length === 0 && !showCreateTemplate ? (
                <p className="text-xs text-amber-700">
                  No consent templates yet. Click &quot;+ New Template&quot; to create one first.
                </p>
              ) : (
                <Select value={consentTemplateId} onValueChange={setConsentTemplateId}>
                  <SelectTrigger className="h-8 text-sm bg-white">
                    <SelectValue placeholder="Select a consent template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {requiresConsent && !consentTemplateId && (
                <p className="text-xs text-red-600">A consent template is required before saving.</p>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2 pt-2">
        <Switch name="isActive" defaultChecked={procedure?.isActive ?? true} />
        <Label>Active</Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : procedure ? "Update Procedure" : "Create Procedure"}
      </Button>
    </form>
  )
}

export function ProceduresClient({
  procedures,
  consentTemplates,
  clinicSlug,
}: {
  procedures: Procedure[]
  consentTemplates: ConsentTemplate[]
  clinicSlug: string
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Procedure | null>(null)
  const router = useRouter()

  function getPriceLabel(p: Procedure) {
    if (p.priceType === "FIXED" && p.price) return formatCurrency(Number(p.price))
    if (p.priceType === "RANGE" && p.priceMin && p.priceMax) return `${formatCurrency(Number(p.priceMin))} – ${formatCurrency(Number(p.priceMax))}`
    return "Manual"
  }

  async function handleToggleActive(p: Procedure) {
    const result = await toggleProcedureActive(clinicSlug, p.id, !p.isActive)
    if ("error" in result) toast.error(result.error)
    else router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{procedures.length} procedures configured</p>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" />New Procedure</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Procedure" : "Create Procedure"}</DialogTitle>
            </DialogHeader>
            <ProcedureForm
              procedure={editing || undefined}
              clinicSlug={clinicSlug}
              consentTemplates={consentTemplates}
              onClose={() => { setDialogOpen(false); setEditing(null) }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {procedures.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">No procedures yet. Create your first procedure.</p>
        )}
        {procedures.map((p) => (
          <Card key={p.id} className={`${!p.isActive ? "opacity-60" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold">{p.name}</CardTitle>
                  {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                </div>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              <div className="flex flex-wrap gap-1">
                {[
                  p.hasOdontogram && "Odontogram",
                  p.hasToothSurface && "Surfaces",
                  p.hasPhotoUpload && "Photo",
                  p.hasXrayUpload && "X-Ray",
                  p.autoConsentForm && "Consent Form",
                  p.autoPrescription && "Prescription",
                  p.requireSignedConsent && "Consent Required",
                ].filter(Boolean).map((tag) => (
                  <span key={tag as string} className={`text-xs px-1.5 py-0.5 rounded ${tag === "Consent Required" ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-700"}`}>{tag}</span>
                ))}
              </div>
              {p.requireSignedConsent && p.consentTemplate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />Template: {p.consentTemplate.name}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-primary text-sm">{getPriceLabel(p)}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleToggleActive(p)}>
                    <Power className={`h-3.5 w-3.5 ${p.isActive ? "text-red-500" : "text-green-500"}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true) }}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
