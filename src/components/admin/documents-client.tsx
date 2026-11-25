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
  Download,
} from "lucide-react";
import {
  formatDate,
  renderDocumentTemplate,
  handlePrintDocument,
} from "@/lib/utils";
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
  mimeType?: string | null;
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
  INSTALLMENT_AGREEMENT: "Installment Agreement",
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
  { tag: "{{clinic_email}}", label: "Clinic Email" },
];

const PRESETS: Record<string, { title: string; body: string }> = {
  CONSENT_FORM: {
    title: "INFORMED CONSENT FOR DENTAL TREATMENT",
    body: `I, {{patient_name}} (or authorized parent/guardian), hereby authorize and consent to Dr. {{dentist_name}} and the dental team at {{clinic_name}} to perform the dental procedure: {{procedure_name}} on {{date}}.\n\n1. Purpose & Clinical Benefits: The nature, purpose, expected aesthetic and functional outcomes, and clinical necessity of this dental treatment have been clearly explained to me.\n\n2. Potential Risks & Complications: I understand that as with any dental procedure, there are inherent risks including post-operative discomfort, sensitivity, bleeding, swelling, or allergic reactions to materials or local anesthetics. I have disclosed all known medical conditions, allergies, and current medications.\n\n3. Alternative Options: Available alternative treatment options, including the consequences of not undergoing treatment, have been presented and discussed.\n\n4. Patient Confirmation: I have had ample opportunity to ask questions, clarify doubts, and receive answers to my satisfaction. I voluntarily agree to proceed with the recommended procedure.`,
  },
  PRESCRIPTION: {
    title: "PRESCRIPTION (Rx)",
    body: `Rx / Medical Orders:\n\n1. Amoxicillin 500mg (Oral Capsule)\n   Sig: Take 1 capsule every 8 hours for 7 consecutive days after meals. (Dispense: 21 capsules)\n\n2. Mefenamic Acid 500mg (Oral Tablet)\n   Sig: Take 1 tablet every 8 hours as needed for moderate-to-severe pain. (Dispense: 10 tablets)\n\nSpecial Clinical Instructions: Complete the full antibiotic course without interruption. Avoid carbonated drinks, alcohol, or strenuous activity while taking these medications. Contact the clinic immediately if any adverse rash, swelling, or reaction occurs.`,
  },
  MEDICAL_CERTIFICATE: {
    title: "OFFICIAL MEDICAL CERTIFICATE",
    body: `TO WHOM IT MAY CONCERN:\n\nThis is to certify that {{patient_name}} was personally examined and received dental clinical attendance at {{clinic_name}} on {{date}} under the professional care of Dr. {{dentist_name}} for the procedure: {{procedure_name}}.\n\nClinical Recommendation & Work Clearance: Due to the procedural nature of the treatment and required tissue recovery, the patient is advised to rest and refrain from strenuous physical exertion, prolonged speaking, or workplace duties for a period of two (2) days, commencing on {{date}}.\n\nThis certification is issued upon the request of the above-named patient for whatever medical or official purpose it may serve, excluding medico-legal proceedings.`,
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
        `<p style="margin: 0 0 14px 0; line-height: 1.7; font-size: 13.5px; color: #334155;">${p.replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n");

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 44px 48px; max-width: 760px; margin: 0 auto; color: #0f172a; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08); box-sizing: border-box;">
${
  includeHeader
    ? `  <!-- Executive Medical Letterhead -->
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
          <span style="color: #1e293b; font-size: 12px; font-weight: 600;">{{procedure_name}}</span>
        </td>
      </tr>
    </table>
  </div>`
    : ""
}
  <!-- Document Title Badge -->
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0f172a; background: #ffffff; border: 1.5px solid #cbd5e1; padding: 6px 22px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      ${title}
    </span>
  </div>

  <!-- Document Content Body -->
  <div style="font-size: 13.5px; color: #334155; margin-bottom: 30px; line-height: 1.7;">
    ${paragraphs}
  </div>

${
  includeSignatures
    ? `  <!-- Official Signature Block -->
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
  </div>`
    : ""
}

  <!-- Official Footer & Verification Mark -->
  <div style="margin-top: 40px; padding-top: 12px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
    <span>CONFIDENTIAL MEDICAL RECORD · {{clinic_name}}</span>
    <span>OFFICIAL CLINIC DOCUMENT · VERIFIED VIA DENTLY</span>
  </div>
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
    clinicAddress: clinicInfo?.address || "123 Medical Arts Center, Suite 402",
    clinicPhone: clinicInfo?.phone || "+63 (2) 8888-3368",
    clinicEmail: clinicInfo?.email || "reception@dentalclinic.com",
    patientName: "Juan dela Cruz",
    dentistName: "Maria Santos, DMD",
    procedureName: "Comprehensive Dental Examination",
    date: formatDate(new Date()),
  });
}

function getFileSource(doc: {
  content: string | null;
  fileUrl: string | null;
  mimeType?: string | null;
  title?: string;
}): {
  source: string | null;
  isImage: boolean;
  isPdf: boolean;
  isHtml: boolean;
} {
  if (doc.fileUrl) {
    const isImg = !!doc.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
    const isP = !!doc.fileUrl.match(/\.pdf$/i);
    return {
      source: doc.fileUrl,
      isImage: isImg,
      isPdf: isP,
      isHtml: !isImg && !isP,
    };
  }

  if (!doc.content) {
    return { source: null, isImage: false, isPdf: false, isHtml: false };
  }

  const trimmed = doc.content.trim();

  // Explicit HTML check
  if (
    trimmed.startsWith("<") &&
    (trimmed.includes("<div") ||
      trimmed.includes("<p") ||
      trimmed.includes("<!DOCTYPE") ||
      trimmed.includes("<html") ||
      trimmed.includes("<table"))
  ) {
    return { source: trimmed, isImage: false, isPdf: false, isHtml: true };
  }

  // Already prefixed Data URLs
  if (trimmed.startsWith("data:image/")) {
    return { source: trimmed, isImage: true, isPdf: false, isHtml: false };
  }
  if (trimmed.startsWith("data:application/pdf")) {
    return { source: trimmed, isImage: false, isPdf: true, isHtml: false };
  }

  // Check explicit mimeType
  if (doc.mimeType) {
    if (doc.mimeType.startsWith("image/")) {
      return {
        source: `data:${doc.mimeType};base64,${trimmed}`,
        isImage: true,
        isPdf: false,
        isHtml: false,
      };
    }
    if (doc.mimeType === "application/pdf") {
      return {
        source: `data:application/pdf;base64,${trimmed}`,
        isImage: false,
        isPdf: true,
        isHtml: false,
      };
    }
  }

  // Check title file extension
  if (doc.title) {
    const imgMatch = doc.title.match(/\.(webp|png|jpg|jpeg|gif|svg)$/i);
    if (imgMatch) {
      const ext = imgMatch[1].toLowerCase();
      const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      return {
        source: `data:${mime};base64,${trimmed}`,
        isImage: true,
        isPdf: false,
        isHtml: false,
      };
    }
    if (doc.title.match(/\.pdf$/i)) {
      return {
        source: `data:application/pdf;base64,${trimmed}`,
        isImage: false,
        isPdf: true,
        isHtml: false,
      };
    }
  }

  // Base64 magic headers
  if (
    trimmed.startsWith("/9j/") ||
    trimmed.startsWith("iVBORw0KGgo") ||
    trimmed.startsWith("UklGR") ||
    trimmed.startsWith("R0lGOD") ||
    trimmed.startsWith("0AAA")
  ) {
    let mime = "image/png";
    if (trimmed.startsWith("/9j/")) mime = "image/jpeg";
    else if (trimmed.startsWith("UklGR") || trimmed.startsWith("0AAA"))
      mime = "image/webp";
    else if (trimmed.startsWith("R0lGOD")) mime = "image/gif";

    return {
      source: `data:${mime};base64,${trimmed}`,
      isImage: true,
      isPdf: false,
      isHtml: false,
    };
  }

  if (trimmed.startsWith("JVBERi0")) {
    return {
      source: `data:application/pdf;base64,${trimmed}`,
      isImage: false,
      isPdf: true,
      isHtml: false,
    };
  }

  return { source: trimmed, isImage: false, isPdf: false, isHtml: true };
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
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    type: string;
    content: string | null;
    fileUrl: string | null;
    mimeType?: string | null;
    isTemplate?: boolean;
  } | null>(null);
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
    try {
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
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to create template");
      }
    } catch {
      toast.error("Network error while creating template. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Template removed");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to delete template");
      }
    } catch {
      toast.error("Network error while deleting template. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrintPreview(doc: {
    title: string;
    type: string;
    content: string | null;
    fileUrl: string | null;
    mimeType?: string | null;
    isTemplate?: boolean;
  }) {
    const file = getFileSource(doc);
    if (file.isImage && file.source) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${doc.title || "Print Document"}</title>
              <style>
                @page { margin: 10mm; size: auto; }
                body { margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 90vh; background: #fff; font-family: sans-serif; }
                img { max-width: 100%; max-height: 92vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${file.source}" onload="window.print();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else if (file.isPdf && file.source) {
      const printWindow = window.open(file.source, "_blank");
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      const html = doc.isTemplate
        ? renderSamplePreview(doc.content || "", clinicInfo)
        : doc.content || "";
      handlePrintDocument(html);
    }
  }

  function handleDownloadPreview(doc: {
    title: string;
    type: string;
    content: string | null;
    fileUrl: string | null;
    mimeType?: string | null;
    isTemplate?: boolean;
  }) {
    const file = getFileSource(doc);
    if (!file.source) return;

    if (file.isImage || file.isPdf) {
      const a = document.createElement("a");
      a.href = file.source;
      a.download = doc.title || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([file.source], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title || "document"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
                      {doc.content || doc.fileUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setPreviewDoc({
                              title: doc.title,
                              type: doc.type,
                              content: doc.content,
                              fileUrl: doc.fileUrl,
                              mimeType: doc.mimeType,
                              isTemplate: false,
                            })
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No file
                        </span>
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
                      onClick={() =>
                        setPreviewDoc({
                          title: t.name,
                          type: t.type,
                          content: t.content,
                          fileUrl: null,
                          isTemplate: true,
                        })
                      }
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
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

      {/* Document / Template Preview Dialog */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(v) => !v && setPreviewDoc(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          {previewDoc &&
            (() => {
              const file = getFileSource(previewDoc);
              return (
                <>
                  <DialogHeader className="p-4 sm:p-5 border-b flex-shrink-0 bg-gray-50/70">
                    <div className="flex items-center justify-between gap-3 pr-6">
                      <div className="min-w-0">
                        <DialogTitle className="text-base sm:text-lg font-semibold truncate">
                          {previewDoc.title}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {DOC_TYPE_LABELS[previewDoc.type] ||
                            previewDoc.type.replace(/_/g, " ")}
                          {previewDoc.isTemplate && " · Sample Preview"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {file.source && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPreview(previewDoc)}
                            className="text-xs"
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handlePrintPreview(previewDoc)}
                          className="text-xs"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1.5" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 flex justify-center items-start">
                    {file.isImage && file.source ? (
                      <div className="max-w-full flex flex-col items-center justify-center p-3 bg-white rounded-xl border shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.source}
                          alt={previewDoc.title}
                          className="max-h-[70vh] w-auto max-w-full object-contain rounded-md"
                        />
                      </div>
                    ) : file.isPdf && file.source ? (
                      <iframe
                        src={file.source}
                        title={previewDoc.title}
                        className="w-full h-[70vh] border rounded-lg bg-white"
                      />
                    ) : file.source ? (
                      <div
                        id="printable-document"
                        className="w-full max-w-[760px] print:max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: previewDoc.isTemplate
                            ? renderSamplePreview(file.source, clinicInfo)
                            : renderDocumentTemplate(file.source, {
                                clinicName: clinicInfo?.name,
                                clinicAddress: clinicInfo?.address,
                                clinicPhone: clinicInfo?.phone,
                                clinicEmail: clinicInfo?.email,
                              }),
                        }}
                      />
                    ) : (
                      <div className="py-12 text-center text-muted-foreground text-sm">
                        No preview available for this document.
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
