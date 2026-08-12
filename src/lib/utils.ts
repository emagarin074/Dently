import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function renderDocumentTemplate(
  content: string,
  data?: {
    clinicName?: string | null;
    clinicAddress?: string | null;
    clinicPhone?: string | null;
    patientName?: string | null;
    dentistName?: string | null;
    procedureName?: string | null;
    date?: string | null;
  },
) {
  const blankLine = "_______________________";
  const finalClinicName = data?.clinicName || "Clinic Workspace";
  const finalClinicAddress = data?.clinicAddress || "Clinic Address";
  const finalClinicPhone = data?.clinicPhone || "Clinic Phone";

  return content
    .replace(/\{\{clinic_name\}\}/gi, finalClinicName)
    .replace(/\{\{clinic_address\}\}/gi, finalClinicAddress)
    .replace(/\{\{clinic_phone\}\}/gi, finalClinicPhone)
    .replace(/\{\{patient_name\}\}/gi, data?.patientName || blankLine)
    .replace(/\{\{dentist_name\}\}/gi, data?.dentistName || blankLine)
    .replace(/\{\{procedure_name\}\}/gi, data?.procedureName || blankLine)
    .replace(/\{\{date\}\}/gi, data?.date || blankLine);
}

export function handlePrintDocument(renderedHtml: string) {
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document - Short Bond Paper</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.5in;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #1e293b;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .paper-container {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 24px;
              box-sizing: border-box;
            }
            @media print {
              .paper-container {
                padding: 0;
                max-width: 100%;
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
