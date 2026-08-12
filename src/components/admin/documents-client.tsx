"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Printer,
  Sparkles,
  Code,
  Eye,
  Trash2,
} from "lucide-react";
import { formatDate, renderDocumentTemplate } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { TablePagination } from "@/components/ui/pagination";

interface Template {
  id: string;
  type: string;
  name: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

interface Document {
  id: string;
  type: string;
  title: string;
  content: string | null;
  fileUrl: string | null;
  createdAt: string;
  patient: { firstName: string; lastName: string };
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
};

const PLACEHOLDER_TAGS = [
  { tag: "{{patient_name}}", label: "Patient Name" },
  { tag: "{{dentist_name}}", label: "Dentist Name" },
  { tag: "{{clinic_name}}", label: "Clinic Name" },
  { tag: "{{date}}", label: "Date" },
  { tag: "{{procedure_name}}", label: "Procedure Name" },
  { tag: "{{clinic_address}}", label: "Clinic Address" },
  { tag: "{{clinic_phone}}", label: "Clinic Phone" },
];

const PRESETS: Record<string, { title: string; body: string }> = {
  CONSENT_FORM: {
    title: "INFORMED CONSENT FORM",
    body: `I, {{patient_name}}, hereby give my consent to Dr. {{dentist_name}} and the dental team at {{clinic_name}} to perform the procedure: {{procedure_name}} on {{date}}.\n\nI confirm that the procedure, expected outcomes, potential risks, and post-treatment care instructions have been thoroughly explained to me. I have had the opportunity to ask questions and all my questions have been answered to my satisfaction.`,
  },
  PRESCRIPTION: {
    title: "PRESCRIPTION (Rx)",
    body: `Patient: {{patient_name}}\nDate: {{date}}\n\nRx:\n1. Amoxicillin 500mg — 1 capsule every 8 hours for 7 days (Total: 21 caps)\n2. Mefenamic Acid 500mg — 1 capsule every 8 hours for pain as needed\n\nInstructions: Take oral medications after meals as directed by attending dentist.`,
  },
  MEDICAL_CERTIFICATE: {
    title: "MEDICAL CERTIFICATE",
    body: `This is to certify that {{patient_name}} was examined and attended to at {{clinic_name}} on {{date}} for {{procedure_name}} by Dr. {{dentist_name}}.\n\nDue to the nature of the dental procedure performed, the patient is advised to rest and refrain from strenuous physical activity for 2 days.`,
  },
};

function generateHtmlFromVisual({
  title,
  body,
  includeHeader,
  includeSignatures,
}: {
  title: string;
  body: string;
  includeHeader: boolean;
  includeSignatures: boolean;
}) {
  const paragraphs = body
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin-bottom: 12px; line-height: 1.6;">${p.replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n");

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
${
  includeHeader
    ? `  <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #0891b2; padding-bottom: 16px;">
    <h2 style="margin: 0; font-size: 22px; color: #0f172a; font-weight: 700; text-transform: uppercase;">{{clinic_name}}</h2>
    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">{{clinic_address}} | {{clinic_phone}}</p>
  </div>`
    : ""
}
  <h3 style="text-align: center; font-size: 18px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px; color: #0f172a; font-weight: 600;">${title}</h3>

  <div style="font-size: 14px; color: #334155; margin-bottom: 24px;">
    ${paragraphs}
  </div>

${
  includeSignatures
    ? `  <div style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 16px;">
    <div style="border-top: 1px solid #94a3b8; width: 220px; text-align: center; padding-top: 6px; font-size: 13px; color: #475569;">
      <strong>Patient Signature</strong><br/><span style="font-size: 11px; color: #64748b;">{{patient_name}}</span>
    </div>
    <div style="border-top: 1px solid #94a3b8; width: 220px; text-align: center; padding-top: 6px; font-size: 13px; color: #475569;">
      <strong>Dentist Signature</strong><br/><span style="font-size: 11px; color: #64748b;">Dr. {{dentist_name}}</span>
    </div>
  </div>`
    : ""
}
</div>`;
}

interface ClinicInfo {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

function renderSamplePreview(
  htmlContent: string,
  clinicInfo?: ClinicInfo | null,
) {
  return renderDocumentTemplate(htmlContent, {
    clinicName: clinicInfo?.name || "Dental Clinic Workspace",
    clinicAddress: clinicInfo?.address || "Clinic Address",
    clinicPhone: clinicInfo?.phone || "Clinic Phone",
  });
}

export function DocumentsClient({
  templates,
  documents,
  clinicSlug,
  userRole,
  total = 0,
  page = 1,
  clinicInfo,
}: {
  templates: Template[];
  documents: Document[];
  clinicSlug: string;
  userRole: UserRole;
  total?: number;
  page?: number;
  clinicInfo?: ClinicInfo | null;
}) {
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateType, setTemplateType] = useState("CONSENT_FORM");
  const [templateName, setTemplateName] = useState("");
  const [builderMode, setBuilderMode] = useState<"visual" | "html" | "preview">(
    "visual",
  );

  // Visual Builder fields
  const [docTitle, setDocTitle] = useState(PRESETS.CONSENT_FORM.title);
  const [bodyText, setBodyText] = useState(PRESETS.CONSENT_FORM.body);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  // Raw HTML field
  const [rawHtmlContent, setRawHtmlContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [printContent, setPrintContent] = useState<string | null>(null);
  const router = useRouter();

  function handleTypeChange(newType: string) {
    setTemplateType(newType);
    const preset = PRESETS[newType] || PRESETS.CONSENT_FORM;
    setDocTitle(preset.title);
    setBodyText(preset.body);
  }

  function handleInsertTag(tag: string) {
    if (builderMode === "html") {
      setRawHtmlContent((prev) => prev + " " + tag);
    } else {
      setBodyText((prev) => prev + " " + tag);
    }
  }

  const activeHtml =
    builderMode === "html"
      ? rawHtmlContent
      : generateHtmlFromVisual({
          title: docTitle,
          body: bodyText,
          includeHeader,
          includeSignatures,
        });

  async function handleCreateTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!templateName.trim()) {
      toast.error("Please provide a template name");
      return;
    }

    setLoading(true);
    const finalContent = activeHtml;

    const res = await fetch("/api/templates", {
      method: "POST",
      body: JSON.stringify({
        clinicSlug,
        type: templateType,
        name: templateName.trim(),
        content: finalContent,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Template created successfully");
      setTemplateOpen(false);
      setTemplateName("");
      router.refresh();
    } else {
      toast.error("Failed to create template");
    }
    setLoading(false);
  }

  async function handleDeleteTemplate(id: string) {
    setLoading(true);
    const res = await fetch(`/api/templates?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Template removed");
      router.refresh();
    } else {
      toast.error("Failed to delete template");
    }
    setLoading(false);
  }

  function handlePrint(content: string) {
    const html = renderSamplePreview(content, clinicInfo);
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            <style>
              body { margin: 0; padding: 24px; background: #ffffff; color: #1e293b; }
              @media print {
                body { padding: 0; margin: 0; }
              }
            </style>
          </head>
          <body>
            ${html}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  }

  return (
    <Tabs defaultValue="recent">
      {/* ... tabs content ... */}
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No documents yet
                    </td>
                  </tr>
                )}
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {doc.patient.firstName} {doc.patient.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {DOC_TYPE_LABELS[doc.type] || doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {doc.content && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPrintContent(doc.content)}
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Print
                        </Button>
                      )}
                      {doc.fileUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <TablePagination total={total} page={page} itemName="documents" />
      </TabsContent>

      {/* Templates */}
      <TabsContent value="templates" className="mt-4">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Create Document Template
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCreateTemplate} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Template Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g. Tooth Extraction Consent Form"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category / Type</Label>
                      <Select
                        value={templateType}
                        onValueChange={handleTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSENT_FORM">
                            Consent Form
                          </SelectItem>
                          <SelectItem value="PRESCRIPTION">
                            Prescription (Rx)
                          </SelectItem>
                          <SelectItem value="MEDICAL_CERTIFICATE">
                            Medical Certificate
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Builder Mode Selector */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBuilderMode("visual")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          builderMode === "visual"
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Visual Builder (Easy)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderMode("html")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          builderMode === "html"
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Code className="h-3.5 w-3.5" />
                        HTML Code (Advanced)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setBuilderMode(
                          builderMode === "preview" ? "visual" : "preview",
                        )
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        builderMode === "preview"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {builderMode === "preview"
                        ? "Edit Template"
                        : "Live Sample Preview"}
                    </button>
                  </div>

                  {/* Clickable Placeholder Tag Chips */}
                  <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Click to Insert Dynamic Field:
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PLACEHOLDER_TAGS.map(({ tag, label }) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors text-xs py-1"
                          onClick={() => handleInsertTag(tag)}
                        >
                          + {label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Mode 1: Visual Builder */}
                  {builderMode === "visual" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Document Heading / Title</Label>
                        <Input
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          placeholder="e.g. INFORMED CONSENT FORM"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Document Text / Instructions</Label>
                        <p className="text-xs text-muted-foreground">
                          Write your standard text in plain English. Paragraphs
                          separated by double newlines will format
                          automatically.
                        </p>
                        <Textarea
                          value={bodyText}
                          onChange={(e) => setBodyText(e.target.value)}
                          rows={7}
                          className="text-sm leading-relaxed"
                          placeholder="Enter template content..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-700">
                          <Checkbox
                            checked={includeHeader}
                            onCheckedChange={(c) => setIncludeHeader(!!c)}
                          />
                          Include Clinic Letterhead Header
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-700">
                          <Checkbox
                            checked={includeSignatures}
                            onCheckedChange={(c) => setIncludeSignatures(!!c)}
                          />
                          Include Patient & Dentist Signature Lines
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: HTML Code */}
                  {builderMode === "html" && (
                    <div className="space-y-2">
                      <Label>Raw HTML Code</Label>
                      <Textarea
                        value={rawHtmlContent || activeHtml}
                        onChange={(e) => setRawHtmlContent(e.target.value)}
                        rows={10}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  {/* Mode 3: Live Preview */}
                  {builderMode === "preview" && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Live Preview with Sample Clinic & Patient Data:
                      </Label>
                      <div
                        className="border rounded-lg p-4 bg-white shadow-inner max-h-[400px] overflow-y-auto"
                        dangerouslySetInnerHTML={{
                          __html: renderSamplePreview(activeHtml, clinicInfo),
                        }}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating Template..." : "Save Template"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No templates yet. Click &quot;New Template&quot; above to create
                one.
              </p>
            )}
            {templates.map((t) => (
              <Card key={t.id} className="relative group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {t.name}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {DOC_TYPE_LABELS[t.type] || t.type.replace("_", " ")}
                      </span>
                    </div>
                    {t.isDefault && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-blue-600 border-blue-200 bg-blue-50"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPrintContent(t.content)}
                      className="flex-1 text-xs"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      Preview & Print
                    </Button>
                    {userRole === UserRole.DENTIST_ADMIN && !t.isDefault && (
                      <ConfirmActionDialog
                        title="Delete Template"
                        description={`Are you sure you want to delete the template "${t.name}"?`}
                        loading={loading}
                        onConfirm={() => handleDeleteTemplate(t.id)}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Print Dialog */}
      <Dialog
        open={!!printContent}
        onOpenChange={(v) => !v && setPrintContent(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="no-print">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>Document Preview</DialogTitle>
              <Button size="sm" onClick={() => handlePrint(printContent || "")}>
                <Printer className="h-4 w-4 mr-1" />
                Print Document
              </Button>
            </div>
          </DialogHeader>
          <div
            id="printable-document"
            className="border rounded-lg p-6 bg-white shadow-sm print:border-0 print:p-0 print:shadow-none"
            dangerouslySetInnerHTML={{
              __html: renderSamplePreview(printContent || "", clinicInfo),
            }}
          />
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
