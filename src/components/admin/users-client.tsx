"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { createUser, toggleUserActive, resetUserPassword, updateUser } from "@/app/actions/users"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus, KeyRound, Edit2, Power } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface User {
  id: string; name: string; email: string; role: string; isActive: boolean
  phoneNumber: string | null; licenseNumber: string | null; specialization: string | null; createdAt: string
}

export function UsersClient({ users, clinicSlug, currentUserId }: { users: User[]; clinicSlug: string; currentUserId: string }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState<User | null>(null)
  const [role, setRole] = useState("ASSISTANT")
  const [editRole, setEditRole] = useState("ASSISTANT")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("role", role)
    const result = await createUser(clinicSlug, fd)
    if ("error" in result) toast.error(result.error)
    else { toast.success("User created"); setCreateOpen(false); router.refresh() }
    setLoading(false)
  }

  async function handleToggle(userId: string, isActive: boolean) {
    const result = await toggleUserActive(clinicSlug, userId, !isActive)
    if ("error" in result) toast.error(result.error)
    else router.refresh()
  }

  async function handleResetPassword() {
    if (!resetOpen || !newPassword) return
    setLoading(true)
    const result = await resetUserPassword(clinicSlug, resetOpen, newPassword)
    if ("error" in result) toast.error(result.error)
    else { toast.success("Password reset"); setResetOpen(null); setNewPassword("") }
    setLoading(false)
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editOpen) return
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("role", editRole)
    const result = await updateUser(clinicSlug, editOpen.id, fd)
    if ("error" in result) toast.error(result.error)
    else { toast.success("User updated"); setEditOpen(null); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />Add User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Since</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{u.name} {u.id === currentUserId && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                      {u.specialization && <p className="text-xs text-muted-foreground">{u.specialization}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "DENTIST_ADMIN" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                      {u.role === "DENTIST_ADMIN" ? "Dentist Admin" : "Assistant"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditOpen(u); setEditRole(u.role) }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setResetOpen(u.id)}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUserId && (
                        <Button size="sm" variant="ghost" onClick={() => handleToggle(u.id, u.isActive)}>
                          <Power className={`h-3.5 w-3.5 ${u.isActive ? "text-red-500" : "text-green-500"}`} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff User</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input name="name" required /></div>
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required /></div>
            <div className="space-y-2"><Label>Password</Label><Input name="password" type="password" placeholder="Min. 8 characters" required /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DENTIST_ADMIN">Dentist Administrator</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Phone</Label><Input name="phoneNumber" /></div>
            <div className="space-y-2"><Label>License No.</Label><Input name="licenseNumber" /></div>
            <div className="space-y-2"><Label>Specialization</Label><Input name="specialization" placeholder="e.g. Orthodontics" /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create User"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editOpen} onOpenChange={(v) => !v && setEditOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editOpen && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input name="name" defaultValue={editOpen.name} required /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DENTIST_ADMIN">Dentist Administrator</SelectItem>
                    <SelectItem value="ASSISTANT">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phoneNumber" defaultValue={editOpen.phoneNumber || ""} /></div>
              <div className="space-y-2"><Label>License No.</Label><Input name="licenseNumber" defaultValue={editOpen.licenseNumber || ""} /></div>
              <div className="space-y-2"><Label>Specialization</Label><Input name="specialization" defaultValue={editOpen.specialization || ""} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating..." : "Update User"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetOpen} onOpenChange={(v) => !v && setResetOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <Button className="w-full" onClick={handleResetPassword} disabled={!newPassword || loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
