"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createPatient } from "@/app/actions/patients"
import { toast } from "sonner"
import { Plus, Search, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Patient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  phone: string | null
  email: string | null
  gender: string | null
  dateOfBirth: string | null
  createdAt: string
  _count: { appointments: number }
}

interface Props {
  patients: Patient[]
  total: number
  page: number
  clinicSlug: string
}

export function PatientsClient({ patients, total, page, clinicSlug }: Props) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [gender, setGender] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`?q=${encodeURIComponent(search)}`)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("gender", gender)
    const result = await createPatient(clinicSlug, fd)
    if ("error" in result) { toast.error(result.error) }
    else {
      toast.success("Patient created")
      setOpen(false)
      router.refresh()
      if ("patientId" in result) router.push(`/clinic/${clinicSlug}/admin/patients/${result.patientId}`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </form>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />New Patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Add New Patient</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input name="middleName" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input name="lastName" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input name="dateOfBirth" type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" placeholder="+63 912 345 6789" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input name="address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input name="emergencyContactName" placeholder="Name" />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input name="emergencyContactPhone" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Patient"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gender</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">DOB</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Appointments</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Since</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No patients found</td></tr>
                )}
                {patients.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <span className="font-medium">{p.lastName}, {p.firstName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone || p.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.gender ? p.gender.charAt(0) + p.gender.slice(1).toLowerCase() : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.dateOfBirth ? formatDate(p.dateOfBirth) : "—"}</td>
                    <td className="px-4 py-3 text-center">{p._count.appointments}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/clinic/${clinicSlug}/admin/patients/${p.id}`} className="flex items-center justify-end text-primary hover:underline text-xs">
                        View <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing {patients.length} of {total} patients</p>
        <div className="flex gap-2">
          {page > 1 && <Button variant="outline" size="sm" onClick={() => router.push(`?page=${page - 1}`)}>Previous</Button>}
          {patients.length === 20 && <Button variant="outline" size="sm" onClick={() => router.push(`?page=${page + 1}`)}>Next</Button>}
        </div>
      </div>
    </div>
  )
}
