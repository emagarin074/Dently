"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { updateClinicInfo, updateClinicSettings } from "@/app/actions/settings"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Clinic {
  id: string; name: string; slug: string; address: string | null; phone: string | null
  email: string | null; website: string | null; description: string | null
  settings: {
    brandColor: string; appointmentLeadDays: number; maxBookingsPerDay: number | null
    autoConfirmBookings: boolean; revenueFormula: string | null
    smtpHost: string | null; smtpPort: number | null; smtpUser: string | null
    smtpPassword: string | null; smtpFromEmail: string | null; smtpFromName: string | null
  } | null
}

export function SettingsClient({ clinic, clinicSlug }: { clinic: Clinic; clinicSlug: string }) {
  const [loading, setLoading] = useState(false)
  const [autoConfirm, setAutoConfirm] = useState(clinic.settings?.autoConfirmBookings ?? false)
  const router = useRouter()

  async function handleInfoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const result = await updateClinicInfo(clinicSlug, new FormData(e.currentTarget))
    if ("error" in result) toast.error(result.error)
    else { toast.success("Clinic info updated"); router.refresh() }
    setLoading(false)
  }

  async function handleSettingsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("autoConfirmBookings", String(autoConfirm))
    const result = await updateClinicSettings(clinicSlug, fd)
    if ("error" in result) toast.error(result.error)
    else { toast.success("Settings saved"); router.refresh() }
    setLoading(false)
  }

  return (
    <Tabs defaultValue="info" className="space-y-4">
      <TabsList>
        <TabsTrigger value="info">Clinic Info</TabsTrigger>
        <TabsTrigger value="booking">Booking</TabsTrigger>
        <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
        <TabsTrigger value="revenue">Revenue</TabsTrigger>
      </TabsList>

      {/* Clinic Info */}
      <TabsContent value="info">
        <Card>
          <CardHeader><CardTitle className="text-base">Clinic Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Clinic Name</Label><Input name="name" defaultValue={clinic.name} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={clinic.phone || ""} /></div>
                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" defaultValue={clinic.email || ""} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input name="address" defaultValue={clinic.address || ""} /></div>
              <div className="space-y-2"><Label>Website</Label><Input name="website" type="url" defaultValue={clinic.website || ""} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={clinic.description || ""} rows={3} /></div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p className="text-muted-foreground">Your clinic URL: <strong>your-domain/clinic/{clinic.slug}</strong></p>
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Booking Settings */}
      <TabsContent value="booking">
        <Card>
          <CardHeader><CardTitle className="text-base">Booking Settings</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" name="brandColor" defaultValue={clinic.settings?.brandColor || "#0891b2"} className="h-9 w-16 rounded border cursor-pointer" />
                    <Input name="brandColorText" defaultValue={clinic.settings?.brandColor || "#0891b2"} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Appointment Lead Days</Label>
                  <Input name="appointmentLeadDays" type="number" defaultValue={clinic.settings?.appointmentLeadDays || 30} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Bookings Per Day</Label>
                <Input name="maxBookingsPerDay" type="number" defaultValue={clinic.settings?.maxBookingsPerDay || ""} placeholder="Leave empty for unlimited" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-confirm Bookings</Label>
                  <p className="text-xs text-muted-foreground">Automatically confirm online bookings without manual review</p>
                </div>
                <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Settings"}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SMTP Settings */}
      <TabsContent value="email">
        <Card>
          <CardHeader><CardTitle className="text-base">SMTP Email Settings</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>SMTP Host</Label><Input name="smtpHost" defaultValue={clinic.settings?.smtpHost || ""} placeholder="smtp.gmail.com" /></div>
                <div className="space-y-2"><Label>SMTP Port</Label><Input name="smtpPort" type="number" defaultValue={clinic.settings?.smtpPort || 587} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Username</Label><Input name="smtpUser" defaultValue={clinic.settings?.smtpUser || ""} /></div>
                <div className="space-y-2"><Label>Password</Label><Input name="smtpPassword" type="password" defaultValue={clinic.settings?.smtpPassword || ""} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>From Email</Label><Input name="smtpFromEmail" type="email" defaultValue={clinic.settings?.smtpFromEmail || ""} /></div>
                <div className="space-y-2"><Label>From Name</Label><Input name="smtpFromName" defaultValue={clinic.settings?.smtpFromName || ""} /></div>
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save SMTP Settings"}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Revenue Formula */}
      <TabsContent value="revenue">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Computation</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Revenue Formula</Label>
                <Textarea
                  name="revenueFormula"
                  defaultValue={clinic.settings?.revenueFormula || ""}
                  rows={4}
                  placeholder="e.g. dentist_rate = 70%, clinic_rate = 30%"
                />
                <p className="text-xs text-muted-foreground">Define how revenue is split between the clinic and dentists. This is used for reports.</p>
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Formula"}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
