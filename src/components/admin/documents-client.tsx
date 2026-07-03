"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus, FileText, Printer } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { UserRole } from "@prisma/client"

interface Template {
  id: string; type: string; name: string; content: string; isDefault: boolean; isActive: boolean
}

interface Document {
  id: string; type: string; title: string; content: string | null; fileUrl: string | null
  createdAt: string
  patient: { firstName: string; lastName: string }
}

const DOC_TYPE_LABELS: Record<string, string> = {
  CONSENT_FORM: "Consent Form",
  PRESCRIPTION: "Prescription",
  MEDICAL_CERTIFICATE: "Medical Certificate",
  XRAY: "X-Ray",
  PHOTO: "Photo",
  LAB_REQUEST: "Lab Request",
  LAB_RESULT: "Lab Result",
  OTHER: "Other",
}

export function DocumentsClient({
  templates, documents, clinicSlug, userRole
}: {
  templates: Template[]
  documents: Document[]
  clinicSlug: string
  userRole: UserRole
}) {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateType, setTemplateType] = useState("CONSENT_FORM")
  const [loading, setLoading] = useState(false)
  const [printContent, setPrintContent] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreateTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/templates", {
      method: "POST",
      body: JSON.stringify({
        clinicSlug,
        type: templateType,
        name: fd.get("name"),
        content: fd.get("content"),
      }),
      headers: { "Content-Type": "application/json" },
    })
    if (res.ok) { toast.success("Template created"); setTemplateOpen(false); router.refresh() }
    else toast.error("Failed to create template")
    setLoading(false)
  }

  const SAMPLE_TEMPLATE = `<div style="font-family: serif; padding: 40px; max-width: 700px; margin: 0 auto;">
  <h2 style="text-align: center;">{{clinic_name}}</h2>
  <p style="text-align: center;">{{clinic_address}} | {{clinic_phone}}</p>
  <hr/>
  <h3 style="text-align: center;">CONSENT FORM</h3>
  <p>Patient: <strong>{{patient_name}}</strong></p>
  <p>Date: <strong>{{date}}</strong></p>
  <p>Procedure: <strong>{{procedure_name}}</strong></p>
  <p>Attending Dentist: <strong>{{dentist_name}}</strong></p>
  <br/>
  <p>I, the undersigned patient, hereby consent to the dental procedure described above...</p>
  <br/><br/>
  <div style="display: flex; justify-content: space-between; margin-top: 60px;">
    <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 4px;">Patient Signature</div>
    <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 4px;">Dentist Signature</div>
  </div>
</div>`

  return (
    <Tabs defaultValue="recent">
      <TabsList>
        <TabsTrigger value="recent">Recent Documents</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>

      {/* Recent Documents */}
      <TabsContent value="recent" className="mt-4">
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No documents yet</td></tr>
                )}
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.patient.firstName} {doc.patient.lastName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{DOC_TYPE_LABELS[doc.type] || doc.type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {doc.content && (
                        <Button size="sm" variant="outline" onClick={() => setPrintContent(doc.content)}>
                          <Printer className="h-3.5 w-3.5 mr-1" />Print
                        </Button>
                      )}
                      {doc.fileUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.fileUrl} target="_blank">View</a>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Templates */}
      <TabsContent value="templates" className="mt-4">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" />New Template</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Create Document Template</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input name="name" placeholder="e.g. Standard Consent Form" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={templateType} onValueChange={setTemplateType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSENT_FORM">Consent Form</SelectItem>
                          <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                          <SelectItem value="MEDICAL_CERTIFICATE">Medical Certificate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>HTML Content</Label>
                    <p className="text-xs text-muted-foreground">
                      Use: {"{{patient_name}}"}, {"{{dentist_name}}"}, {"{{clinic_name}}"}, {"{{date}}"}, {"{{procedure_name}}"}
                    </p>
                    <Textarea
                      name="content"
                      rows={12}
                      defaultValue={SAMPLE_TEMPLATE}
                      className="font-mono text-xs"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>Create Template</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">No templates yet.</p>
            )}
            {templates.map(t => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{t.type.replace("_", " ")}</span>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPrintContent(t.content)} className="flex-1">
                      <Printer className="h-3.5 w-3.5 mr-1" />Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Print Dialog */}
      <Dialog open={!!printContent} onOpenChange={(v) => !v && setPrintContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Document Preview</DialogTitle>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" />Print
              </Button>
            </div>
          </DialogHeader>
          <div
            className="border rounded-lg p-4 bg-white print:border-0 print:p-0"
            dangerouslySetInnerHTML={{ __html: printContent || "" }}
          />
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
