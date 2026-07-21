import nodemailer from "nodemailer"

function createTransporter(settings?: {
  host?: string | null
  port?: number | null
  user?: string | null
  password?: string | null
  fromEmail?: string | null
  fromName?: string | null
}) {
  const host = settings?.host || process.env.SMTP_HOST
  const port = settings?.port || parseInt(process.env.SMTP_PORT || "587")
  const user = settings?.user || process.env.SMTP_USER
  const pass = settings?.password || process.env.SMTP_PASSWORD

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  })
}

export async function sendEmail({
  to,
  subject,
  html,
  clinicSettings,
}: {
  to: string
  subject: string
  html: string
  clinicSettings?: {
    smtpHost?: string | null
    smtpPort?: number | null
    smtpUser?: string | null
    smtpPassword?: string | null
    smtpFromEmail?: string | null
    smtpFromName?: string | null
  }
}) {
  const transporter = createTransporter({
    host: clinicSettings?.smtpHost,
    port: clinicSettings?.smtpPort,
    user: clinicSettings?.smtpUser,
    password: clinicSettings?.smtpPassword,
  })

  const from = `"${clinicSettings?.smtpFromName || process.env.SMTP_FROM_NAME || "Dently"}" <${
    clinicSettings?.smtpFromEmail || process.env.SMTP_FROM_EMAIL || "noreply@dently.app"
  }>`

  await transporter.sendMail({ from, to, subject, html })
}

export function bookingConfirmationEmail({
  clinicName,
  patientName,
  preferredDate,
  service,
}: {
  clinicName: string
  patientName: string
  preferredDate: string
  service: string
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
  `
}
