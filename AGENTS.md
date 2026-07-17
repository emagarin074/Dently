<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

# Dently

Dently is a modern multi-tenant SaaS Dental Practice Management Platform.

The platform is designed to support multiple dental clinics while ensuring complete data isolation between tenants.

Each clinic has its own:

- Website
- Users
- Patients
- Appointments
- Procedures
- Billing
- Documents
- Reports
- Settings

The application must never assume a single clinic.

---

# Core Philosophy

Always favor configurable solutions over hardcoded implementations.

If a feature can be configured by a clinic administrator, it should not require code changes.

Examples:

✅ Procedure Builder
✅ Document Templates
✅ Consent Templates
✅ Clinic Branding
✅ Clinic Settings
✅ Revenue Rules

Avoid hardcoding clinic-specific values.

---

# Multi-Tenant Rules

Every clinic-owned resource must belong to a clinic.

Use `clinic_id` for tenant isolation.

Never expose another clinic's data.

Never query tenant tables without filtering by `clinic_id`.

Luna Dental Care is only sample seed data.

Do not hardcode:

- clinic name
- logo
- colors
- email
- dentists
- services

Everything must come from the database.

---

# User Roles

Current roles:

- Dentist Administrator
- Assistant

Future roles may be added.

Never hardcode permissions.

Always use role-based authorization.

---

# Appointment Flow

Appointments represent scheduled visits before patient arrival.

Queue represents patients physically inside the clinic.

Workflow:

Appointment
↓
Patient Arrives
↓
Check In
↓
Queue
↓
Consultation
↓
Treatment
↓
Payment
↓
Completed

Appointment statuses:

- PENDING
- CONFIRMED
- CHECKED_IN
- COMPLETED
- CANCELLED
- NO_SHOW

Queue statuses:

- WAITING
- IN_CONSULTATION
- IN_TREATMENT
- FOR_PAYMENT
- COMPLETED

Rules:

- Queue records are created only after Check In.
- One appointment may have only one active queue.
- Queue belongs to Appointment.
- Queue numbers reset daily per clinic.

---

# Patient Records

Patient records are internal clinic records.

Patients do not have login accounts.

Each patient contains:

- Personal Information
- Health Questionnaire
- Appointments
- Procedures
- Billing
- Documents
- Notes
- Follow-ups

Treat patient history as immutable.

Never delete historical treatments.

Prefer soft deletes where appropriate.

---

# Procedure Builder

Procedure Builder is the core feature of Dently.

Clinics can configure procedures without developer intervention.

Do not hardcode procedures.

Support dynamic fields.

Procedure configuration should drive the UI.

Possible configuration:

- Fixed price
- Manual price
- Tooth selection
- Surface selection
- Quantity
- Notes
- Photo upload
- X-ray upload
- Follow-up
- Consent required
- Prescription
- Medical Certificate

Future procedures should work without code changes.

---

# Odontogram

Use a reusable odontogram component.

Support:

- Adult teeth
- Multiple tooth selection
- Surface selection

Never hardcode procedures into the odontogram.

---

# Billing

Billing is procedure-based.

Support:

- Full payment
- Partial payment
- Installments

Revenue calculations should be configurable.

Avoid embedding formulas directly into components.

---

# Documents

Generated documents include:

- Prescriptions
- Medical Certificates
- Consent Forms

Documents should use templates.

Avoid hardcoded layouts whenever possible.

---

# File Uploads

Support:

- Photos
- X-rays
- PDFs
- Signed Consent Forms

Store references in the database.

Never store business logic inside upload components.

---

# Notifications

Use notification services.

Do not send emails directly from UI components.

Current notification provider:

- SMTP

Future providers:

- SMS
- WhatsApp

---

# Development Standards

Prefer:

- Small reusable components
- Server Actions
- Shared validation schemas
- Type-safe code
- Clean architecture

Avoid:

- Duplicate components
- Duplicate business logic
- Inline SQL
- Inline permissions

---

# UI Principles

The UI should feel like a premium SaaS application.

Prioritize:

- Simplicity
- Speed
- Accessibility
- Tablet usability
- Consistency

Inspiration:

- Linear
- Stripe
- Notion
- Vercel

---

# Coding Guidelines

Always:

- Reuse existing components
- Preserve existing architecture
- Refactor instead of rewriting
- Keep functions small
- Prefer composition over duplication

Before creating a new component:

1. Check if one already exists.
2. Extend existing implementations whenever possible.
3. Avoid introducing multiple ways of solving the same problem.

---

# Database Principles

Use Prisma.

Prefer:

- Soft deletes
- Foreign keys
- Enums
- Transactions
- Optimistic updates when appropriate

Never bypass tenant filtering.

---

# Future Vision

Dently should be scalable to hundreds of dental clinics.

Every feature should be implemented with multi-tenancy in mind.

When making architectural decisions, prioritize:

1. Maintainability
2. Scalability
3. Extensibility
4. Security
5. Developer experience

Never optimize for only the first clinic.

Build features that any dental clinic can adopt through configuration rather than code changes.
