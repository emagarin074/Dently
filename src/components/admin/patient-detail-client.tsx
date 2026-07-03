"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { updatePatient, saveHealthQuestionnaire, addPatientNote } from "@/app/actions/patients"
import { toast } from "sonner"
import { formatDate, formatCurrency, calculateAge } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@prisma/client"
import { Edit2, Save, Plus } from "lucide-react"
import { AddProcedureDialog, type ProcedureOption } from "@/components/admin/add-procedure-dialog"

interface Patient {
  id: string; firstName: string; lastName: string; middleName: string | null
  dateOfBirth: string | null; gender: string | null; phone: string | null
  email: string | null; address: string | null; bloodType: string | null
  emergencyContactName: string | null; emergencyContactPhone: string | null
  notes: string | null; createdAt: string
  healthQuestionnaire: {
    hasHypertension: boolean; hasDiabetes: boolean; hasHeartDisease: boolean
    hasBleedingDisorder: boolean; isPregnant: boolean; hasAllergies: boolean
    allergiesDetail: string | null; currentMedications: string | null
    previousDentalWork: string | null; chiefComplaint: string | null; additionalNotes: string | null
  } | null
  appointments: {
    id: string; preferredDate: string; serviceType: string | null; status: string
    dentist: { name: string } | null
    procedures: { id: string; price: unknown; procedure: { name: string } }[]
    billing: { totalAmount: unknown; paidAmount: unknown; status: string; payments: { amount: unknown; method: string; paidAt: string }[] } | null
  }[]
  patientNotes: { id: string; content: string; createdAt: string }[]
  documents: { id: string; title: string; type: string; createdAt: string }[]
  followUps: { id: string; followUpDate: string; notes: string | null; status: string }[]
}

interface Props {
  patient: Patient
  dentists: { id: string; name: string; role: string }[]
  procedures: ProcedureOption[]
  clinicSlug: string
  userRole: UserRole
  defaultTab?: string
}

export function PatientDetailClient({ patient, clinicSlug, procedures, defaultTab = "overview" }: Props) {
  const [editing, setEditing] = useState(false)
  const [gender, setGender] = useState(patient.gender || "")
  const [loading, setLoading] = useState(false)
  const [noteText, setNoteText] = useState("")
  const router = useRouter()

  async function handleUpdatePatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("gender", gender)
    const result = await updatePatient(clinicSlug, patient.id, fd)
    if ("error" in result) toast.error(result.error)
    else { toast.success("Patient updated"); setEditing(false); router.refresh() }
    setLoading(false)
  }

  async function handleQuestionnaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await saveHealthQuestionnaire(clinicSlug, patient.id, fd)
    if ("error" in result) toast.error(result.error)
    else { toast.success("Health questionnaire saved"); router.refresh() }
    setLoading(false)
  }

  async function handleNote() {
    if (!noteText.trim()) return
    const result = await addPatientNote(clinicSlug, patient.id, noteText)
    if ("error" in result) toast.error(result.error)
    else { toast.success("Note added"); setNoteText(""); router.refresh() }
  }

  const q = patient.healthQuestionnaire

  return (
    <div className="space-y-4">
      {/* Patient header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold flex-shrink-0">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{patient.firstName} {patient.middleName ? patient.middleName + " " : ""}{patient.lastName}</h2>
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                {patient.dateOfBirth && <span>Age: {calculateAge(patient.dateOfBirth)}</span>}
                {patient.gender && <span>{patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}</span>}
                {patient.phone && <span>{patient.phone}</span>}
                {patient.email && <span>{patient.email}</span>}
                {patient.bloodType && <span>Blood: {patient.bloodType}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questionnaire">Health Form</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Patient Information</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? <Save className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
                {editing ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleUpdatePatient} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label>First Name</Label><Input name="firstName" defaultValue={patient.firstName} required /></div>
                    <div className="space-y-2"><Label>Middle Name</Label><Input name="middleName" defaultValue={patient.middleName || ""} /></div>
                    <div className="space-y-2"><Label>Last Name</Label><Input name="lastName" defaultValue={patient.lastName} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Date of Birth</Label><Input name="dateOfBirth" type="date" defaultValue={patient.dateOfBirth?.split("T")[0] || ""} /></div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"].map(g => <SelectItem key={g} value={g}>{g.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={patient.phone || ""} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" defaultValue={patient.email || ""} /></div>
                  </div>
                  <div className="space-y-2"><Label>Address</Label><Input name="address" defaultValue={patient.address || ""} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Blood Type</Label><Input name="bloodType" defaultValue={patient.bloodType || ""} placeholder="A+, O-, etc." /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Emergency Contact</Label><Input name="emergencyContactName" defaultValue={patient.emergencyContactName || ""} /></div>
                    <div className="space-y-2"><Label>Emergency Phone</Label><Input name="emergencyContactPhone" defaultValue={patient.emergencyContactPhone || ""} /></div>
                  </div>
                  <Button type="submit" disabled={loading}>Save Changes</Button>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  {[
                    ["Phone", patient.phone],
                    ["Email", patient.email],
                    ["Address", patient.address],
                    ["Blood Type", patient.bloodType],
                    ["Emergency Contact", patient.emergencyContactName],
                    ["Emergency Phone", patient.emergencyContactPhone],
                    ["Patient Since", formatDate(patient.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Questionnaire */}
        <TabsContent value="questionnaire" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Health Questionnaire</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleQuestionnaire} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "hasHypertension", label: "Hypertension / High Blood Pressure", defaultChecked: q?.hasHypertension },
                    { name: "hasDiabetes", label: "Diabetes", defaultChecked: q?.hasDiabetes },
                    { name: "hasHeartDisease", label: "Heart Disease", defaultChecked: q?.hasHeartDisease },
                    { name: "hasBleedingDisorder", label: "Bleeding Disorder", defaultChecked: q?.hasBleedingDisorder },
                    { name: "isPregnant", label: "Pregnant", defaultChecked: q?.isPregnant },
                    { name: "hasAllergies", label: "Known Allergies", defaultChecked: q?.hasAllergies },
                  ].map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <input
                        type="hidden"
                        name={field.name}
                        value="false"
                      />
                      <input
                        type="checkbox"
                        id={field.name}
                        name={field.name}
                        value="true"
                        defaultChecked={field.defaultChecked || false}
                        className="rounded"
                      />
                      <Label htmlFor={field.name}>{field.label}</Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2"><Label>Allergies Detail</Label><Textarea name="allergiesDetail" defaultValue={q?.allergiesDetail || ""} rows={2} /></div>
                <div className="space-y-2"><Label>Current Medications</Label><Textarea name="currentMedications" defaultValue={q?.currentMedications || ""} rows={2} /></div>
                <div className="space-y-2"><Label>Previous Dental Work</Label><Textarea name="previousDentalWork" defaultValue={q?.previousDentalWork || ""} rows={2} /></div>
                <div className="space-y-2"><Label>Chief Complaint</Label><Textarea name="chiefComplaint" defaultValue={q?.chiefComplaint || ""} rows={2} /></div>
                <div className="space-y-2"><Label>Additional Notes</Label><Textarea name="additionalNotes" defaultValue={q?.additionalNotes || ""} rows={2} /></div>
                <Button type="submit" disabled={loading}>Save Questionnaire</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Appointment History</CardTitle></CardHeader>
            <CardContent>
              {patient.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No appointments</p>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{formatDate(a.preferredDate)}</p>
                        <div className="flex items-center gap-2">
                          {a.status === "CHECKED_IN" && (
                            <AddProcedureDialog
                              appointmentId={a.id}
                              clinicSlug={clinicSlug}
                              procedures={procedures}
                              trigger={
                                <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                  <Plus className="h-3 w-3 mr-0.5" />Add Procedure
                                </Button>
                              }
                            />
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "COMPLETED" ? "bg-green-100 text-green-800" : a.status === "CANCELLED" ? "bg-red-100 text-red-800" : a.status === "CHECKED_IN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>{a.status}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.serviceType || "General"} {a.dentist ? `· ${a.dentist.name}` : ""}</p>
                      {a.procedures.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.procedures.map((p) => <span key={p.id} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.procedure.name}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Billing History</CardTitle></CardHeader>
            <CardContent>
              {patient.appointments.filter(a => a.billing).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No billing records</p>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.filter(a => a.billing).map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{formatDate(a.preferredDate)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.billing!.status === "FULLY_PAID" ? "bg-green-100 text-green-800" : a.billing!.status === "PARTIALLY_PAID" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{a.billing!.status}</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>Total: {formatCurrency(Number(a.billing!.totalAmount))}</span>
                        <span>Paid: {formatCurrency(Number(a.billing!.paidAmount))}</span>
                        <span className="text-red-600">Balance: {formatCurrency(Number(a.billing!.totalAmount) - Number(a.billing!.paidAmount))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
            <CardContent>
              {patient.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No documents</p>
              ) : (
                <div className="space-y-2">
                  {patient.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.type} · {formatDate(d.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleNote} disabled={!noteText.trim()}>Add</Button>
              </div>
              {patient.patientNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes</p>
              ) : (
                <div className="space-y-2">
                  {patient.patientNotes.map((n) => (
                    <div key={n.id} className="border rounded-lg p-3">
                      <p className="text-sm">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups */}
        <TabsContent value="followups" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Follow-ups</CardTitle></CardHeader>
            <CardContent>
              {patient.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups</p>
              ) : (
                <div className="space-y-2">
                  {patient.followUps.map((f) => (
                    <div key={f.id} className="border rounded-lg p-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{formatDate(f.followUpDate)}</p>
                        {f.notes && <p className="text-xs text-muted-foreground mt-0.5">{f.notes}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.status === "COMPLETED" ? "bg-green-100 text-green-800" : f.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{f.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
