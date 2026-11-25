"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  createUser,
  toggleUserActive,
  resetUserPassword,
  updateUser,
} from "@/app/actions/users";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, KeyRound, Edit2, Power } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TablePagination } from "@/components/ui/pagination";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  phoneNumber: string | null;
  licenseNumber: string | null;
  specialization: string | null;
  createdAt: string;
  staffPayProfile: {
    payType: string;
    dailyRate: number | string;
    expectedTimeIn: string | null;
    expectedTimeOut: string | null;
    breakMinutes: number;
    lateGraceMinutes: number;
    lateDeductionType: string;
    lateDeductionValue: number | string;
  } | null;
}

type PayType = "FIXED_DAILY" | "PROCEDURE_BASED";

function getPayType(user: User): PayType {
  const payType = user.staffPayProfile?.payType;
  return payType === "FIXED_DAILY" || payType === "DAILY"
    ? "FIXED_DAILY"
    : "PROCEDURE_BASED";
}

function formatPayType(user: User) {
  if (getPayType(user) === "FIXED_DAILY") {
    return `Fixed daily ₱${Number(
      user.staffPayProfile?.dailyRate ?? 0,
    ).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return "Procedure based";
}

export function UsersClient({
  users,
  clinicSlug,
  currentUserId,
  total,
  page,
}: {
  users: User[];
  clinicSlug: string;
  currentUserId: string;
  total: number;
  page: number;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState<User | null>(null);
  const [role, setRole] = useState("ASSISTANT");
  const [editRole, setEditRole] = useState("ASSISTANT");
  const [payType, setPayType] = useState<PayType>("PROCEDURE_BASED");
  const [editPayType, setEditPayType] = useState<PayType>("PROCEDURE_BASED");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("role", role);
      fd.set("payType", payType);
      fd.set("lateDeductionType", "PER_MINUTE");
      const result = await createUser(clinicSlug, fd);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("User created");
        setCreateOpen(false);
        setRole("ASSISTANT");
        setPayType("PROCEDURE_BASED");
        router.refresh();
      }
    } catch {
      toast.error("Network error while creating user. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(userId: string, isActive: boolean) {
    try {
      const result = await toggleUserActive(clinicSlug, userId, !isActive);
      if ("error" in result) toast.error(result.error);
      else router.refresh();
    } catch {
      toast.error(
        "Network error while updating user status. Please try again.",
      );
    }
  }

  async function handleResetPassword() {
    if (!resetOpen || !newPassword) return;
    setLoading(true);
    try {
      const result = await resetUserPassword(
        clinicSlug,
        resetOpen,
        newPassword,
      );
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Password reset");
        setResetOpen(null);
        setNewPassword("");
      }
    } catch {
      toast.error("Network error while resetting password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editOpen) return;
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("role", editRole);
      fd.set("payType", editPayType);
      fd.set("lateDeductionType", "PER_MINUTE");
      const result = await updateUser(clinicSlug, editOpen.id, fd);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("User updated");
        setEditOpen(null);
        router.refresh();
      }
    } catch {
      toast.error("Network error while updating user. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Pay
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Since
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {u.name}{" "}
                        {u.id === currentUserId && (
                          <span className="text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      {u.specialization && (
                        <p className="text-xs text-muted-foreground">
                          {u.specialization}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${u.role === "DENTIST_ADMIN" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}
                    >
                      {u.role === "DENTIST_ADMIN"
                        ? "Dentist Admin"
                        : "Assistant"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatPayType(u)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditOpen(u);
                          setEditRole(u.role);
                          setEditPayType(getPayType(u));
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResetOpen(u.id)}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUserId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggle(u.id, u.isActive)}
                        >
                          <Power
                            className={`h-3.5 w-3.5 ${u.isActive ? "text-red-500" : "text-green-500"}`}
                          />
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

      <TablePagination total={total} page={page} itemName="users" />

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Staff User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DENTIST_ADMIN">
                    Dentist Administrator
                  </SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phoneNumber" />
            </div>
            <div className="space-y-2">
              <Label>License No.</Label>
              <Input name="licenseNumber" />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input name="specialization" placeholder="e.g. Orthodontics" />
            </div>
            <div className="space-y-2">
              <Label>Payroll Type</Label>
              <Select
                value={payType}
                onValueChange={(value) =>
                  setPayType(
                    value === "FIXED_DAILY" ? "FIXED_DAILY" : "PROCEDURE_BASED",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCEDURE_BASED">
                    Procedure based computation
                  </SelectItem>
                  <SelectItem value="FIXED_DAILY">
                    Fixed daily salary
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {payType === "FIXED_DAILY" && (
              <div className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Daily Rate</Label>
                  <Input name="dailyRate" type="number" min="0" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Expected Time In</Label>
                  <Input
                    name="expectedTimeIn"
                    type="time"
                    defaultValue="08:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Time Out</Label>
                  <Input
                    name="expectedTimeOut"
                    type="time"
                    defaultValue="17:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break Minutes</Label>
                  <Input
                    name="breakMinutes"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue="60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Late Grace Minutes</Label>
                  <Input
                    name="lateGraceMinutes"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue="0"
                  />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editOpen} onOpenChange={(v) => !v && setEditOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editOpen && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" defaultValue={editOpen.name} required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DENTIST_ADMIN">
                      Dentist Administrator
                    </SelectItem>
                    <SelectItem value="ASSISTANT">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  name="phoneNumber"
                  defaultValue={editOpen.phoneNumber || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>License No.</Label>
                <Input
                  name="licenseNumber"
                  defaultValue={editOpen.licenseNumber || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input
                  name="specialization"
                  defaultValue={editOpen.specialization || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Payroll Type</Label>
                <Select
                  value={editPayType}
                  onValueChange={(value) =>
                    setEditPayType(
                      value === "FIXED_DAILY"
                        ? "FIXED_DAILY"
                        : "PROCEDURE_BASED",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCEDURE_BASED">
                      Procedure based computation
                    </SelectItem>
                    <SelectItem value="FIXED_DAILY">
                      Fixed daily salary
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editPayType === "FIXED_DAILY" && (
                <div className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Daily Rate</Label>
                    <Input
                      name="dailyRate"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={String(
                        editOpen.staffPayProfile?.dailyRate ?? "",
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Time In</Label>
                    <Input
                      name="expectedTimeIn"
                      type="time"
                      defaultValue={
                        editOpen.staffPayProfile?.expectedTimeIn ?? "08:00"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Time Out</Label>
                    <Input
                      name="expectedTimeOut"
                      type="time"
                      defaultValue={
                        editOpen.staffPayProfile?.expectedTimeOut ?? "17:00"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Break Minutes</Label>
                    <Input
                      name="breakMinutes"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={String(
                        editOpen.staffPayProfile?.breakMinutes ?? 60,
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Late Grace Minutes</Label>
                    <Input
                      name="lateGraceMinutes"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={String(
                        editOpen.staffPayProfile?.lateGraceMinutes ?? 0,
                      )}
                    />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update User"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetOpen} onOpenChange={(v) => !v && setResetOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleResetPassword}
              disabled={!newPassword || loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
