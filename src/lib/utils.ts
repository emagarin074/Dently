import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { escapeHtml } from "@/lib/sanitize";

export { escapeHtml };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(num);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateAge(dob: Date | string) {
  const d = typeof dob === "string" ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function getExecutiveLetterheadHtml(clinic: {
  name: string;
  address: string;
  phone: string;
  email: string;
}) {
  const safeName = escapeHtml(clinic.name);
  const safeAddress = escapeHtml(clinic.address);
  const safePhone = escapeHtml(clinic.phone);
  const safeEmail = escapeHtml(clinic.email);

  return `<!-- Executive Medical Letterhead -->
  <div style="margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="vertical-align: middle; width: 60%;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: #0f172a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; font-family: sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-shrink: 0;">
              ✚
            </div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #0f172a; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1.2;">
                ${safeName}
              </h2>
              <p style="margin: 3px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #0284c7; text-transform: uppercase;">
                Dental Clinic & Oral Healthcare Practice
              </p>
            </div>
          </div>
        </td>
        <td style="vertical-align: middle; width: 40%; text-align: right; font-size: 11px; color: #475569; line-height: 1.6;">
          <strong style="color: #0f172a;">${safeAddress}</strong><br/>
          <span>Tel: ${safePhone}</span><br/>
          <span style="color: #64748b;">${safeEmail}</span>
        </td>
      </tr>
    </table>
    <!-- Sophisticated Dual Accent Rule -->
    <div style="margin-top: 16px; border-bottom: 2.5px solid #0f172a;"></div>
    <div style="margin-top: 2px; border-bottom: 1px solid #0284c7;"></div>
  </div>`;
}

export function renderDocumentTemplate(
  content: string,
  data?: {
    clinicName?: string | null;
    clinicAddress?: string | null;
    clinicPhone?: string | null;
    clinicEmail?: string | null;
    patientName?: string | null;
    dentistName?: string | null;
    procedureName?: string | null;
    date?: string | null;
  },
) {
  const blankLine = "_______________________";
  const finalClinicName = escapeHtml(data?.clinicName || "Clinic Workspace");
  const finalClinicAddress = escapeHtml(
    data?.clinicAddress || "Clinic Address",
  );
  const finalClinicPhone = escapeHtml(data?.clinicPhone || "Clinic Phone");
  const finalClinicEmail = escapeHtml(data?.clinicEmail || "clinic@dently.app");
  const safePatientName = escapeHtml(data?.patientName || blankLine);
  const safeDentistName = escapeHtml(data?.dentistName || blankLine);
  const safeProcedureName = escapeHtml(data?.procedureName || blankLine);
  const safeDate = escapeHtml(data?.date || blankLine);

  let rendered = content
    .replace(/\{\{clinic_name\}\}/gi, finalClinicName)
    .replace(/\{\{clinic_address\}\}/gi, finalClinicAddress)
    .replace(/\{\{clinic_phone\}\}/gi, finalClinicPhone)
    .replace(/\{\{clinic_email\}\}/gi, finalClinicEmail)
    .replace(/\{\{patient_name\}\}/gi, safePatientName)
    .replace(/\{\{dentist_name\}\}/gi, safeDentistName)
    .replace(/\{\{procedure_name\}\}/gi, safeProcedureName)
    .replace(/\{\{date\}\}/gi, safeDate);

  // Upgrade legacy centered header with #0891b2 border if present
  const legacyHeaderPattern =
    /<div style="[^"]*text-align:\s*center;[^"]*border-bottom:\s*2px solid\s*#0891b2;[^"]*">[\s\S]*?<\/div>/gi;
  if (legacyHeaderPattern.test(rendered)) {
    rendered = rendered.replace(
      legacyHeaderPattern,
      getExecutiveLetterheadHtml({
        name: finalClinicName,
        address: finalClinicAddress,
        phone: finalClinicPhone,
        email: finalClinicEmail,
      }),
    );
  }

  // Upgrade legacy signature block if present
  const legacySignaturePattern =
    /<div style="[^"]*display:\s*flex;\s*justify-content:\s*space-between;[^"]*margin-top:\s*60px;[^"]*">[\s\S]*?<\/div>\s*<\/div>/gi;
  if (legacySignaturePattern.test(rendered)) {
    const upgradedSignatureBlock = `<!-- Official Signature Block -->
  <div style="margin-top: 48px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 24px;">
          <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; width: 220px;">
            <strong style="color: #0f172a; font-size: 13px;">${safePatientName}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">Patient / Authorized Representative</span><br/>
            <span style="font-size: 10px; color: #94a3b8;">Date Signed: ${safeDate}</span>
          </div>
        </td>
        <td style="width: 50%; vertical-align: top; text-align: right;">
          <div style="display: inline-block; text-align: left;">
            <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; width: 230px;">
              <strong style="color: #0f172a; font-size: 13px;">Dr. ${safeDentistName}</strong><br/>
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
    <span>CONFIDENTIAL MEDICAL RECORD · ${finalClinicName}</span>
    <span>OFFICIAL CLINIC DOCUMENT · VERIFIED VIA DENTLY</span>
  </div>
</div>`;
    rendered = rendered.replace(legacySignaturePattern, upgradedSignatureBlock);
  }

  // Upgrade legacy outer container styling to executive card standard
  rendered = rendered.replace(
    /max-width:\s*700px;[^"]*border-radius:\s*8px;[^"]*background:\s*#ffffff;/gi,
    "max-width: 760px; margin: 0 auto; color: #0f172a; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08); box-sizing: border-box;",
  );

  return rendered;
}

export function handlePrintDocument(renderedHtml: string) {
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinic Medical Document</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.5in;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #1e293b;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .paper-container {
              max-width: 8in;
              margin: 0 auto;
              padding: 16px 0;
            }
            @media print {
              html, body {
                padding: 0;
                margin: 0;
              }
              .paper-container {
                padding: 0;
                max-width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="paper-container">
            ${renderedHtml}
          </div>
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
