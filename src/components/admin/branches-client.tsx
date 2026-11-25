"use client";

import { useMemo, useState } from "react";
import {
  createBranch,
  setPrimaryBranch,
  toggleBranchActive,
  updateBranch,
  updateBranchAssignments,
} from "@/app/actions/branches";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { Edit2, MapPin, Plus, Power, Star, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  userAssignments: Array<{
    user: StaffUser;
  }>;
}

interface Props {
  clinicSlug: string;
  branches: Branch[];
  users: StaffUser[];
  branchLimit: number;
  total: number;
  page: number;
}

function branchAssignmentIds(branch: Branch | null) {
  return new Set(
    branch?.userAssignments.map((assignment) => assignment.user.id),
  );
}

export function BranchesClient({
  clinicSlug,
  branches,
  users,
  branchLimit,
  total,
  page,
}: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Branch | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState<Branch | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const activeBranchCount = branches.filter((branch) => branch.isActive).length;
  const selectedBranchUsers = useMemo(
    () => Array.from(selectedUserIds),
    [selectedUserIds],
  );

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createBranch(
        clinicSlug,
        new FormData(e.currentTarget),
      );
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Branch created");
      setCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error while creating branch. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editOpen) return;

    setLoading(true);
    try {
      const result = await updateBranch(
        clinicSlug,
        editOpen.id,
        new FormData(e.currentTarget),
      );

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Branch updated");
      setEditOpen(null);
      router.refresh();
    } catch {
      toast.error("Network error while updating branch. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(branch: Branch) {
    setLoading(true);
    try {
      const result = await toggleBranchActive(
        clinicSlug,
        branch.id,
        !branch.isActive,
      );

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        branch.isActive ? "Branch deactivated" : "Branch activated",
      );
      router.refresh();
    } catch {
      toast.error(
        "Network error while toggling branch status. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPrimary(branchId: string) {
    setLoading(true);
    try {
      const result = await setPrimaryBranch(clinicSlug, branchId);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Primary branch updated");
      router.refresh();
    } catch {
      toast.error(
        "Network error while setting primary branch. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignments() {
    if (!assignmentOpen) return;

    setLoading(true);
    try {
      const result = await updateBranchAssignments(
        clinicSlug,
        assignmentOpen.id,
        selectedBranchUsers,
      );

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Branch assignments updated");
      setAssignmentOpen(null);
      router.refresh();
    } catch {
      toast.error(
        "Network error while updating branch assignments. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openAssignments(branch: Branch) {
    setAssignmentOpen(branch);
    setSelectedUserIds(branchAssignmentIds(branch));
  }

  function toggleSelectedUser(userId: string) {
    setSelectedUserIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <span className="font-bold text-slate-900">{activeBranchCount}</span>{" "}
          of <span className="font-bold text-slate-900">{branchLimit}</span>{" "}
          active branches used
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={activeBranchCount >= branchLimit}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Branch
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Staff
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {branch.name}
                        </p>
                        {branch.isPrimary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                        <Badge
                          className={
                            branch.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          {branch.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        /{branch.slug}
                      </p>
                      {branch.address && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {branch.address}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{branch.phone || "No phone"}</p>
                    <p>{branch.email || "No email"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {branch.userAssignments.length === 0
                      ? "No assigned staff"
                      : `${branch.userAssignments.length} assigned`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(branch.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAssignments(branch)}
                        title="Assign staff"
                      >
                        <Users className="h-3.5 w-3.5" />
                      </Button>
                      {!branch.isPrimary && branch.isActive && (
                        <ConfirmActionDialog
                          title="Set primary branch?"
                          description="This branch will become the clinic default for future branch-aware workflows."
                          loading={loading}
                          onConfirm={() => handleSetPrimary(branch.id)}
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Set primary"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditOpen(branch)}
                        title="Edit branch"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <ConfirmActionDialog
                        title={
                          branch.isActive
                            ? "Deactivate branch?"
                            : "Activate branch?"
                        }
                        description={
                          branch.isActive
                            ? "Inactive branches are hidden from branch selection until reactivated."
                            : "This branch will count against the clinic plan branch limit."
                        }
                        loading={loading}
                        onConfirm={() => handleToggle(branch)}
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={branch.isPrimary}
                            title={
                              branch.isPrimary
                                ? "Primary branch cannot be deactivated"
                                : "Toggle branch"
                            }
                          >
                            <Power
                              className={`h-3.5 w-3.5 ${
                                branch.isActive
                                  ? "text-red-500"
                                  : "text-emerald-500"
                              }`}
                            />
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <TablePagination total={total} page={page} itemName="branches" />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
          </DialogHeader>
          <BranchForm
            loading={loading}
            submitLabel="Create Branch"
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editOpen}
        onOpenChange={(open) => !open && setEditOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
          </DialogHeader>
          {editOpen && (
            <BranchForm
              branch={editOpen}
              loading={loading}
              submitLabel="Update Branch"
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!assignmentOpen}
        onOpenChange={(open) => !open && setAssignmentOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-slate-100">
              {users.map((staffUser) => (
                <label
                  key={staffUser.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
                >
                  <Checkbox
                    checked={selectedUserIds.has(staffUser.id)}
                    onCheckedChange={() => toggleSelectedUser(staffUser.id)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">
                      {staffUser.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {staffUser.email} · {staffUser.role}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={loading}
              onClick={handleAssignments}
            >
              {loading ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BranchForm({
  branch,
  loading,
  submitLabel,
  onSubmit,
}: {
  branch?: Branch;
  loading: boolean;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Branch Name</Label>
        <Input name="name" defaultValue={branch?.name || ""} required />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input name="address" defaultValue={branch?.address || ""} />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input name="phone" defaultValue={branch?.phone || ""} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input name="email" type="email" defaultValue={branch?.email || ""} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
