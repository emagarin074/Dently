import nodemailer from "nodemailer";

export interface ClinicSmtpSettings {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpFromEmail?: string | null;
  smtpFromName?: string | null;
}

/**
 * Validates whether clinic SMTP settings are complete enough to send emails.
 */
export function isClinicSmtpConfigured(
  settings?: ClinicSmtpSettings | null,
): boolean {
  if (!settings) return false;
  return Boolean(
    settings.smtpHost && settings.smtpUser && settings.smtpPassword,
  );
}

/**
 * Creates a transporter for a specific clinic using only the clinic's own SMTP settings.
 * Returns null if clinic SMTP is unconfigured.
 */
function createClinicTransporter(settings?: ClinicSmtpSettings | null) {
  if (!isClinicSmtpConfigured(settings)) return null;

  const host = settings!.smtpHost!;
  const port = settings!.smtpPort || 587;
  const user = settings!.smtpUser!;
  const pass = settings!.smtpPassword!;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Creates a transporter for Dently SaaS Platform administration using system environment variables.
 */
function createPlatformTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

/**
 * Sends an email from a clinic to a patient using the clinic's SMTP settings.
 * Skips gracefully if clinic SMTP is not configured.
 */
export async function sendClinicEmail({
  to,
  subject,
  html,
  clinicSettings,
  clinicName,
}: {
  to: string;
  subject: string;
  html: string;
  clinicSettings?: ClinicSmtpSettings | null;
  clinicName?: string;
}) {
  if (!isClinicSmtpConfigured(clinicSettings)) {
    console.warn(
      `[Clinic Email Skipped] Clinic "${clinicName || "Unknown"}" has not configured SMTP settings.`,
    );
    return { success: false, reason: "NOT_CONFIGURED" };
  }

  try {
    const transporter = createClinicTransporter(clinicSettings);
    if (!transporter) return { success: false, reason: "NOT_CONFIGURED" };

    const fromName =
      clinicSettings?.smtpFromName || clinicName || "Dental Clinic";
    let fromEmail =
      clinicSettings?.smtpFromEmail ||
      clinicSettings?.smtpUser ||
      "noreply@clinic.com";

    // If using Gmail SMTP, default fromEmail to smtpUser to prevent Gmail sender address rejection
    if (
      clinicSettings?.smtpHost?.toLowerCase().includes("gmail") &&
      clinicSettings?.smtpUser
    ) {
      if (
        !clinicSettings.smtpFromEmail ||
        clinicSettings.smtpFromEmail.includes("yourclinic.com")
      ) {
        fromEmail = clinicSettings.smtpUser;
      }
    }

    const from = `"${fromName}" <${fromEmail}>`;

    await transporter.sendMail({ from, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error("[Clinic Email Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Sends a Dently platform email to clinic owners (e.g. subscription notices, plan changes)
 * using process.env.SMTP_* environment credentials.
 */
export async function sendPlatformEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const transporter = createPlatformTransporter();
    if (!transporter) {
      console.warn(
        "[Platform Email Skipped] System SMTP environment variables not configured.",
      );
      return { success: false, reason: "NOT_CONFIGURED" };
    }

    const fromName = process.env.SMTP_FROM_NAME || "Dently SaaS Platform";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@dently.app";
    const from = `"${fromName}" <${fromEmail}>`;

    await transporter.sendMail({ from, to, subject, html });
    return { success: true };
  } catch (error) {
    console.error("[Platform Email Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Verifies SMTP settings and optionally sends a test email to the specified recipient.
 */
export async function verifySmtpConnection(
  settings: ClinicSmtpSettings,
  testRecipientEmail?: string,
) {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
    return {
      success: false,
      error: "SMTP Host, Username, and Password are required.",
    };
  }

  try {
    const transporter = createClinicTransporter(settings);
    if (!transporter) {
      return {
        success: false,
        error: "Invalid SMTP configuration parameters.",
      };
    }

    // Verify SMTP connection
    await transporter.verify();

    // Optionally send a test email
    if (testRecipientEmail) {
      const fromName = settings.smtpFromName || "Dently Test";
      let fromEmail = settings.smtpFromEmail || settings.smtpUser;
      if (
        settings.smtpHost?.toLowerCase().includes("gmail") &&
        settings.smtpUser
      ) {
        if (
          !settings.smtpFromEmail ||
          settings.smtpFromEmail.includes("yourclinic.com")
        ) {
          fromEmail = settings.smtpUser;
        }
      }
      const from = `"${fromName}" <${fromEmail}>`;

      await transporter.sendMail({
        from,
        to: testRecipientEmail,
        subject: "Dently SMTP Test Connection",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #0891b2; margin-top: 0;">SMTP Test Successful! 🎉</h3>
            <p>Your clinic's outgoing email server is properly connected and functioning.</p>
            <p style="color: #64748b; font-size: 12px;">Sent from Dently Practice Management System</p>
          </div>
        `,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[SMTP Verify Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to SMTP server.",
    };
  }
}

/**
 * Legacy wrapper for backwards compatibility
 */
export async function sendEmail({
  to,
  subject,
  html,
  clinicSettings,
}: {
  to: string;
  subject: string;
  html: string;
  clinicSettings?: ClinicSmtpSettings;
}) {
  return sendClinicEmail({ to, subject, html, clinicSettings });
}

export function bookingConfirmationEmail({
  clinicName,
  patientName,
  preferredDate,
  service,
}: {
  clinicName: string;
  patientName: string;
  preferredDate: string;
  service: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0891b2;">Booking Confirmation</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment request at <strong>${clinicName}</strong> has been received.</p>
      <ul>
        <li><strong>Service:</strong> ${service}</li>
        <li><strong>Preferred Date:</strong> ${preferredDate}</li>
      </ul>
      <p>Our team will confirm your appointment shortly.</p>
      <p>Thank you for choosing ${clinicName}.</p>
    </div>
  `;
}

export function appointmentConfirmedEmail({
  clinicName,
  patientName,
  date,
  time,
  dentistName,
  address,
}: {
  clinicName: string;
  patientName: string;
  date: string;
  time?: string;
  dentistName?: string;
  address?: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0891b2; margin-top: 0;">Appointment Confirmed! 🎉</h2>
      <p>Dear ${patientName},</p>
      <p>Great news! Your appointment at <strong>${clinicName}</strong> has been officially confirmed.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #0891b2; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 4px 0;"><strong>Date:</strong> ${date}</p>
        ${time ? `<p style="margin: 4px 0;"><strong>Time:</strong> ${time}</p>` : ""}
        ${dentistName ? `<p style="margin: 4px 0;"><strong>Attending Dentist:</strong> ${dentistName}</p>` : ""}
        ${address ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${address}</p>` : ""}
      </div>
      <p>Please arrive 10 minutes prior to your scheduled time.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Warm regards,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function appointmentRescheduledEmail({
  clinicName,
  patientName,
  newDate,
  newTime,
}: {
  clinicName: string;
  patientName: string;
  newDate: string;
  newTime?: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0284c7; margin-top: 0;">Appointment Rescheduled 📅</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment at <strong>${clinicName}</strong> has been updated to a new schedule.</p>
      <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 4px 0;"><strong>New Date:</strong> ${newDate}</p>
        ${newTime ? `<p style="margin: 4px 0;"><strong>New Time:</strong> ${newTime}</p>` : ""}
      </div>
      <p>If this new date or time does not work for you, please contact our clinic directly.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Warm regards,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function bookingDeclinedEmail({
  clinicName,
  patientName,
  reason,
}: {
  clinicName: string;
  patientName: string;
  reason?: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #e11d48; margin-top: 0;">Booking Request Update</h2>
      <p>Dear ${patientName},</p>
      <p>Thank you for reaching out to <strong>${clinicName}</strong>.</p>
      <p>Unfortunately, we are unable to accept your booking request for the selected date.</p>
      ${reason ? `<div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 16px; margin: 20px 0; border-radius: 4px; color: #9f1239;"><p style="margin: 0;"><strong>Reason:</strong> ${reason}</p></div>` : ""}
      <p>We invite you to submit a new request for an alternative open date or give us a call.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Sincerely,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function appointmentCancelledEmail({
  clinicName,
  patientName,
  reason,
}: {
  clinicName: string;
  patientName: string;
  reason?: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #dc2626; margin-top: 0;">Confirmed Appointment Canceled</h2>
      <p>Dear ${patientName},</p>
      <p>This email is to notify you that your scheduled appointment at <strong>${clinicName}</strong> has been canceled.</p>
      ${reason ? `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px; color: #991b1b;"><p style="margin: 0;"><strong>Cancellation Reason:</strong> ${reason}</p></div>` : ""}
      <p>If you wish to reschedule, please visit our clinic booking page or call our reception desk.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Sincerely,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function inquiryReceivedEmail({
  clinicName,
  patientName,
}: {
  clinicName: string;
  patientName: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0891b2; margin-top: 0;">Thank You for Contacting Us!</h2>
      <p>Dear ${patientName},</p>
      <p>We have received your message sent to <strong>${clinicName}</strong>.</p>
      <p>Our team is reviewing your message and will reply to you as soon as possible.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Best regards,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function inquiryReplyEmail({
  clinicName,
  patientName,
  originalMessage,
  replyMessage,
}: {
  clinicName: string;
  patientName: string;
  originalMessage: string;
  replyMessage: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0891b2; margin-top: 0;">Response from ${clinicName}</h2>
      <p>Dear ${patientName},</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #0891b2; padding: 16px; margin: 20px 0; border-radius: 4px; white-space: pre-wrap;">
        ${replyMessage}
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #64748b; font-size: 13px; font-weight: bold; margin-bottom: 8px;">Your Original Message:</p>
      <blockquote style="margin: 0; padding-left: 12px; border-left: 2px solid #cbd5e1; color: #64748b; font-size: 13px; font-style: italic; white-space: pre-wrap;">
        "${originalMessage}"
      </blockquote>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Warm regards,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function installmentReminderEmail({
  clinicName,
  patientName,
  installmentNumber,
  dueDate,
  amount,
  remainingBalance,
}: {
  clinicName: string;
  patientName: string;
  installmentNumber: number;
  dueDate: string;
  amount: string;
  remainingBalance?: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0891b2; margin-top: 0;">Upcoming Installment Payment Reminder 💳</h2>
      <p>Dear ${patientName},</p>
      <p>This is a friendly reminder regarding your upcoming treatment installment payment for <strong>${clinicName}</strong>.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #0891b2; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 4px 0;"><strong>Installment #:</strong> ${installmentNumber}</p>
        <p style="margin: 4px 0;"><strong>Amount Due:</strong> <span style="font-size: 18px; font-weight: bold; color: #0f172a;">${amount}</span></p>
        <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDate}</p>
        ${remainingBalance ? `<p style="margin: 4px 0; color: #64748b;"><strong>Remaining Plan Balance:</strong> ${remainingBalance}</p>` : ""}
      </div>
      <p>Please visit our clinic on or before the due date to make your payment, or contact our reception desk if you have any questions.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Warm regards,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function installmentOverdueEmail({
  clinicName,
  patientName,
  installmentNumber,
  dueDate,
  amount,
}: {
  clinicName: string;
  patientName: string;
  installmentNumber: number;
  dueDate: string;
  amount: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #e11d48; margin-top: 0;">Payment Overdue Notice ⚠️</h2>
      <p>Dear ${patientName},</p>
      <p>According to our records, installment payment #${installmentNumber} for <strong>${clinicName}</strong> is now past due.</p>
      <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 16px; margin: 20px 0; border-radius: 4px; color: #9f1239;">
        <p style="margin: 4px 0;"><strong>Overdue Amount:</strong> <span style="font-size: 18px; font-weight: bold;">${amount}</span></p>
        <p style="margin: 4px 0;"><strong>Original Due Date:</strong> ${dueDate}</p>
      </div>
      <p>Please settle this payment as soon as possible or contact our clinic to arrange a suitable payment schedule.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Sincerely,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}

export function installmentReceiptEmail({
  clinicName,
  patientName,
  installmentNumber,
  amountPaid,
  paymentMethod,
  remainingBalance,
}: {
  clinicName: string;
  patientName: string;
  installmentNumber: number;
  amountPaid: string;
  paymentMethod: string;
  remainingBalance: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #10b981; margin-top: 0;">Installment Payment Received ✅</h2>
      <p>Dear ${patientName},</p>
      <p>Thank you! We have received your installment payment at <strong>${clinicName}</strong>.</p>
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; color: #065f46;">
        <p style="margin: 4px 0;"><strong>Installment #:</strong> ${installmentNumber}</p>
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> <span style="font-size: 18px; font-weight: bold;">${amountPaid}</span></p>
        <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p style="margin: 4px 0;"><strong>Remaining Plan Balance:</strong> ${remainingBalance}</p>
      </div>
      <p>Thank you for choosing ${clinicName}.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Best regards,<br><strong>${clinicName} Team</strong></p>
    </div>
  `;
}
