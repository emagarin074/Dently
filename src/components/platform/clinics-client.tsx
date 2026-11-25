"use client";

import { useState, useTransition } from "react";
import {
  PlatformClinicItem,
  GetPlatformClinicsResult,
  getPlatformClinics,
  updateClinicPlan,
  toggleClinicStatus,
} from "@/app/actions/platform";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2,
  Users,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  PowerOff,
  Power,
  Lock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  initialData: GetPlatformClinicsResult;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

const PLAN_BADGES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Starter: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  Clinic: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  Enterprise: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
};

export function ClinicsClient({ initialData }: Props) {
  const [data, setData] = useState<GetPlatformClinicsResult>(initialData);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Edit / Plan modal state
  const [selectedClinic, setSelectedClinic] =
    useState<PlatformClinicItem | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState("Starter");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editBranchLimit, setEditBranchLimit] = useState(1);
  const [editNotes, setEditNotes] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Status toggle confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    clinic: PlatformClinicItem;
    targetStatus: boolean;
  } | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Refetch helper
  const refetch = (
    targetPage = page,
    s = search,
    p = planFilter,
    st = statusFilter,
  ) => {
    startTransition(async () => {
      try {
        const result = await getPlatformClinics({
          search: s,
          plan: p,
          status: st,
          page: targetPage,
          limit: 10,
        });
        setData(result);
        setPage(targetPage);
      } catch (err: unknown) {
        toast.error((err as Error)?.message || "Failed to load clinics.");
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch(1, search, planFilter, statusFilter);
  };

  const handlePlanFilterChange = (newPlan: string) => {
    setPlanFilter(newPlan);
    refetch(1, search, newPlan, statusFilter);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    refetch(1, search, planFilter, newStatus);
  };

  const addDaysToExpiry = (days: number) => {
    const base =
      editExpiresAt && new Date(editExpiresAt) > new Date()
        ? new Date(editExpiresAt)
        : new Date();
    base.setDate(base.getDate() + days);
    setEditExpiresAt(base.toISOString().split("T")[0]);
  };

  const openEditModal = (clinic: PlatformClinicItem) => {
    setSelectedClinic(clinic);
    setEditPlan(clinic.plan || "Starter");
    setEditIsActive(clinic.isActive);
    setEditBranchLimit(clinic.branchLimit);
    setEditNotes(clinic.planNotes || "");
    setEditExpiresAt(
      clinic.planExpiresAt ? clinic.planExpiresAt.split("T")[0] : "",
    );
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;

    setIsSavingPlan(true);
    const res = await updateClinicPlan({
      clinicId: selectedClinic.id,
      plan: editPlan,
      branchLimit: editBranchLimit,
      isActive: editIsActive,
      planNotes: editNotes.trim() ? editNotes.trim() : null,
      planExpiresAt: editExpiresAt ? editExpiresAt : null,
    });
    setIsSavingPlan(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Plan updated for ${selectedClinic.name}`);
      setPlanModalOpen(false);
      refetch();
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!confirmModal) return;

    setIsTogglingStatus(true);
    const res = await toggleClinicStatus({
      clinicId: confirmModal.clinic.id,
      isActive: confirmModal.targetStatus,
    });
    setIsTogglingStatus(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(
        confirmModal.targetStatus
          ? `Account lifted & activated for ${confirmModal.clinic.name}`
          : `Account suspended for ${confirmModal.clinic.name}`,
      );
      setConfirmModal(null);
      refetch();
    }
  };

  const { overview } = data;

  return (
    <div className="space-y-6">
      {/* ── 1. Top Title & Actions Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Platform Clinics & Subscriptions
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              {data.total} {data.total === 1 ? "Clinic" : "Clinics"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage tenant plans, lift or suspend accounts, and view platform
            customer traffic.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isPending}
          className="rounded-xl border-slate-200 text-slate-700 text-xs h-9 gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
          />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* ── 2. Platform Overview Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clinics */}
        <Card className="rounded-2xl border-slate-200/70 shadow-xs bg-white">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Clinics
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">
              {overview.totalClinics}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">
                {overview.activeClinics} Active
              </span>
              <span>•</span>
              <span className="text-red-500 font-medium">
                {overview.suspendedClinics} Suspended
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="rounded-2xl border-slate-200/70 shadow-xs bg-white">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Plans
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-emerald-700">
              {overview.activeClinics}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {overview.totalClinics > 0
                ? `${Math.round((overview.activeClinics / overview.totalClinics) * 100)}% platform health`
                : "No clinics registered"}
            </p>
          </CardContent>
        </Card>

        {/* Daily Customer Visits Today (Zero Revenue) */}
        <Card className="rounded-2xl border-slate-200/70 shadow-xs bg-white">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Visits Today
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">
              {overview.todayVisits}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Platform-wide daily customer appointments
            </p>
          </CardContent>
        </Card>

        {/* Monthly Customer Visits (Zero Revenue) */}
        <Card className="rounded-2xl border-slate-200/70 shadow-xs bg-white">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Visits This Month
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold text-slate-900">
              {overview.monthVisits}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{overview.totalPatients} total registered patients</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Search & Filter Bar ── */}
      <Card className="rounded-2xl border-slate-200/70 shadow-xs bg-white p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clinic name, slug, owner email, or phone..."
              className="pl-9 rounded-xl border-slate-200 h-10 text-xs bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Plan Filter */}
            <Select value={planFilter} onValueChange={handlePlanFilterChange}>
              <SelectTrigger className="w-[140px] rounded-xl border-slate-200 h-10 text-xs bg-slate-50/50">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Plans</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Clinic">Clinic</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[140px] rounded-xl border-slate-200 h-10 text-xs bg-slate-50/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-10 rounded-xl px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
            >
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* ── 4. Clinics Directory Table ── */}
      <Card className="rounded-2xl border-slate-200/70 shadow-xs bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Clinic Workspace</th>
                <th className="py-3.5 px-4">Primary Contact / Owner</th>
                <th className="py-3.5 px-4">Plan & Status</th>
                <th className="py-3.5 px-4 text-center">Customer Traffic</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.clinics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No clinics found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Try adjusting your search query or filter options.
                    </p>
                  </td>
                </tr>
              ) : (
                data.clinics.map((clinic) => {
                  const planStyle = PLAN_BADGES[clinic.plan] || {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                  };

                  return (
                    <tr
                      key={clinic.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Clinic Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {clinic.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {clinic.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400">
                                /{clinic.slug}
                              </span>
                              <span>•</span>
                              <Link
                                href={`/clinic/${clinic.slug}`}
                                target="_blank"
                                className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 font-medium"
                              >
                                <span>Public Website</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td className="py-3.5 px-4">
                        {clinic.owner ? (
                          <div>
                            <p className="font-semibold text-slate-800">
                              {clinic.owner.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {clinic.owner.email}
                            </p>
                            {clinic.owner.phoneNumber && (
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                {clinic.owner.phoneNumber}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            No admin assigned
                          </span>
                        )}
                      </td>

                      {/* Plan & Status Badges */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${planStyle.bg} ${planStyle.text} ${planStyle.border}`}
                            >
                              {clinic.plan}
                            </span>
                            {clinic.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                                <Lock className="h-2.5 w-2.5" />
                                Suspended
                              </span>
                            )}
                          </div>

                          {clinic.planExpiresAt ? (
                            (() => {
                              const expiry = new Date(clinic.planExpiresAt);
                              const now = new Date();
                              const diffDays = Math.ceil(
                                (expiry.getTime() - now.getTime()) /
                                  (1000 * 60 * 60 * 24),
                              );

                              if (diffDays < 0) {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                    ⚠️ Expired {Math.abs(diffDays)}d ago
                                  </span>
                                );
                              }
                              if (diffDays === 0) {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    ⏳ Expires today
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  ⏳ {diffDays}d left (
                                  {formatDate(clinic.planExpiresAt)})
                                </span>
                              );
                            })()
                          ) : (
                            <p className="text-[10px] text-slate-400 font-medium">
                              No expiration (Indefinite)
                            </p>
                          )}
                          {clinic.planNotes && (
                            <p
                              className="text-[10px] text-slate-500 italic max-w-[200px] truncate"
                              title={clinic.planNotes}
                            >
                              Note: {clinic.planNotes}
                            </p>
                          )}
                          <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <MapPin className="h-2.5 w-2.5" />
                            {clinic.metrics.activeBranches}/{clinic.branchLimit}{" "}
                            active branches
                          </p>
                        </div>
                      </td>

                      {/* Customer Traffic (Zero Revenue) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                          <div className="px-1">
                            <span className="block text-[9px] uppercase font-bold text-slate-400">
                              Today
                            </span>
                            <span className="font-extrabold text-xs text-blue-700">
                              {clinic.metrics.todayVisits}
                            </span>
                          </div>
                          <div className="px-1 border-x border-slate-200">
                            <span className="block text-[9px] uppercase font-bold text-slate-400">
                              Month
                            </span>
                            <span className="font-extrabold text-xs text-indigo-700">
                              {clinic.metrics.monthVisits}
                            </span>
                          </div>
                          <div className="px-1">
                            <span className="block text-[9px] uppercase font-bold text-slate-400">
                              Patients
                            </span>
                            <span className="font-extrabold text-xs text-slate-800">
                              {clinic.metrics.totalPatients}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-700 font-medium">
                          {formatDate(clinic.createdAt)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {clinic.metrics.totalStaff} staff{" "}
                          {clinic.metrics.totalStaff === 1
                            ? "member"
                            : "members"}
                        </p>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl"
                          >
                            <DropdownMenuLabel className="text-xs">
                              {clinic.name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => openEditModal(clinic)}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Manage Plan & Activity</span>
                            </DropdownMenuItem>

                            {clinic.isActive ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmModal({
                                    clinic,
                                    targetStatus: false,
                                  })
                                }
                                className="text-xs gap-2 cursor-pointer text-red-600 focus:text-red-700"
                              >
                                <PowerOff className="h-3.5 w-3.5 text-red-600" />
                                <span>Suspend Account</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmModal({
                                    clinic,
                                    targetStatus: true,
                                  })
                                }
                                className="text-xs gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700"
                              >
                                <Power className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Lift / Activate Account</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              asChild
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Link
                                href={`/clinic/${clinic.slug}`}
                                target="_blank"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                <span>View Public Website</span>
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Showing Page <strong className="text-slate-800">{data.page}</strong>{" "}
            of <strong className="text-slate-800">{data.totalPages}</strong> (
            {data.total} Total Clinics)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch(data.page - 1)}
              disabled={data.page <= 1 || isPending}
              className="h-8 rounded-lg text-xs gap-1 border-slate-200"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch(data.page + 1)}
              disabled={data.page >= data.totalPages || isPending}
              className="h-8 rounded-lg text-xs gap-1 border-slate-200"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ── 5. Manage Plan & Activity Modal ── */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-0 overflow-hidden shadow-2xl border-slate-100">
          <DialogHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span>Manage Clinic Plan & Traffic</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Workspace:{" "}
              <strong className="text-slate-800">{selectedClinic?.name}</strong>{" "}
              (/{selectedClinic?.slug})
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="plan" className="w-full">
            <div className="px-5 pt-3 border-b border-slate-100 bg-slate-50/30">
              <TabsList className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <TabsTrigger
                  value="plan"
                  className="text-xs rounded-lg font-bold"
                >
                  Plan & Subscription
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="text-xs rounded-lg font-bold"
                >
                  Customer Volume
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Plan Settings Form */}
            <TabsContent value="plan" className="p-5 space-y-4 m-0">
              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Plan Tier *
                    </Label>
                    <Select value={editPlan} onValueChange={setEditPlan}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-10 text-xs">
                        <SelectValue placeholder="Select Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Starter">Starter Plan</SelectItem>
                        <SelectItem value="Clinic">Clinic Plan</SelectItem>
                        <SelectItem value="Enterprise">
                          Enterprise Plan
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Account Status *
                    </Label>
                    <Select
                      value={editIsActive ? "ACTIVE" : "SUSPENDED"}
                      onValueChange={(val) => setEditIsActive(val === "ACTIVE")}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 h-10 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active (Lifted)</SelectItem>
                        <SelectItem value="SUSPENDED">
                          Suspended (Locked)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                  <Label
                    htmlFor="branchLimit"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Allowed Active Branches</span>
                  </Label>
                  <Input
                    id="branchLimit"
                    type="number"
                    min={selectedClinic?.metrics.activeBranches || 1}
                    max={100}
                    value={editBranchLimit}
                    onChange={(e) =>
                      setEditBranchLimit(Math.max(1, Number(e.target.value)))
                    }
                    className="rounded-xl border-slate-200 h-10 text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-500">
                    Current usage: {selectedClinic?.metrics.activeBranches || 0}{" "}
                    active of {selectedClinic?.metrics.totalBranches || 0} total
                    branches.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Trial & Subscription Period</span>
                    </Label>
                    {editExpiresAt && (
                      <span className="text-[11px] font-semibold text-indigo-600">
                        Target: {editExpiresAt}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={editExpiresAt}
                      onChange={(e) => setEditExpiresAt(e.target.value)}
                      className="rounded-xl border-slate-200 h-9 text-xs bg-white flex-1"
                    />
                    {editExpiresAt && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditExpiresAt("")}
                        className="h-9 px-2.5 text-xs text-slate-500 hover:text-red-600 rounded-xl border-slate-200"
                      >
                        Clear (Indefinite)
                      </Button>
                    )}
                  </div>

                  {/* Quick Extension Presets */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Quick Adjust & Extend:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDaysToExpiry(7)}
                        className="h-7 text-[11px] px-2 rounded-lg bg-white border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                      >
                        +7 Days Trial
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDaysToExpiry(14)}
                        className="h-7 text-[11px] px-2 rounded-lg bg-white border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                      >
                        +14 Days Trial
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDaysToExpiry(30)}
                        className="h-7 text-[11px] px-2 rounded-lg bg-white border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      >
                        +30 Days (1 Month)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDaysToExpiry(365)}
                        className="h-7 text-[11px] px-2 rounded-lg bg-white border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                      >
                        +1 Year
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Admin Payment Notes / Reference (Optional)
                  </Label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Paid ₱999 via GCash Ref #12345 on Aug 31 - Valid for 1 month"
                    rows={2}
                    className="rounded-xl border-slate-200 text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    Private note for your reference regarding payments settled
                    offline.
                  </p>
                </div>

                <DialogFooter className="pt-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPlanModalOpen(false)}
                    disabled={isSavingPlan}
                    className="rounded-xl text-xs h-9 border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingPlan}
                    className="rounded-xl text-xs h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    {isSavingPlan ? "Saving..." : "Save Plan Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* Tab 2: Privacy-First Customer Volume Activity */}
            <TabsContent value="activity" className="p-5 space-y-4 m-0">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-indigo-900 text-xs flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Privacy-Protected Activity</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                    This breakdown tracks patient traffic and completed visits.
                    All clinic billing amounts, revenues, and pricing remain
                    strictly confidential.
                  </p>
                </div>
              </div>

              {selectedClinic && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
                    <Clock className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      Today&apos;s Customer Visits
                    </span>
                    <span className="text-xl font-extrabold text-blue-700">
                      {selectedClinic.metrics.todayVisits}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
                    <TrendingUp className="h-4 w-4 mx-auto text-indigo-600 mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      This Month&apos;s Visits
                    </span>
                    <span className="text-xl font-extrabold text-indigo-700">
                      {selectedClinic.metrics.monthVisits}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
                    <Users className="h-4 w-4 mx-auto text-slate-700 mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      Total Patient Base
                    </span>
                    <span className="text-xl font-extrabold text-slate-800">
                      {selectedClinic.metrics.totalPatients}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center">
                    <Calendar className="h-4 w-4 mx-auto text-slate-700 mb-1" />
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      Lifetime Appointments
                    </span>
                    <span className="text-xl font-extrabold text-slate-800">
                      {selectedClinic.metrics.totalVisits}
                    </span>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPlanModalOpen(false)}
                  className="rounded-xl text-xs h-9 border-slate-200 w-full"
                >
                  Close
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── 6. Status Toggle Confirmation Dialog ── */}
      <Dialog
        open={!!confirmModal}
        onOpenChange={(open) => {
          if (!open && !isTogglingStatus) setConfirmModal(null);
        }}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {confirmModal?.targetStatus ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span>
                {confirmModal?.targetStatus
                  ? "Lift & Reactivate Clinic Account"
                  : "Suspend Clinic Account"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Clinic:{" "}
              <strong className="text-slate-800">
                {confirmModal?.clinic.name}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 text-xs text-slate-600 space-y-2">
            {confirmModal?.targetStatus ? (
              <p>
                Are you sure you want to <strong>lift the suspension</strong>{" "}
                for{" "}
                <span className="font-bold text-slate-900">
                  {confirmModal?.clinic.name}
                </span>
                ? This will immediately restore full portal access for the
                clinic&apos;s dentists and staff.
              </p>
            ) : (
              <p className="text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
                Are you sure you want to <strong>suspend</strong>{" "}
                <span className="font-bold text-slate-900">
                  {confirmModal?.clinic.name}
                </span>
                ? The clinic&apos;s dentists and staff will be locked out of the
                portal until you lift the account.
              </p>
            )}
          </div>

          <DialogFooter className="p-4 bg-slate-50/50 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isTogglingStatus}
              onClick={() => setConfirmModal(null)}
              className="rounded-xl text-xs h-9 border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isTogglingStatus}
              onClick={handleToggleStatusConfirm}
              className={`rounded-xl text-xs h-9 font-bold text-white shadow-xs ${
                confirmModal?.targetStatus
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isTogglingStatus
                ? "Processing..."
                : confirmModal?.targetStatus
                  ? "Confirm Lift / Reactivation"
                  : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
