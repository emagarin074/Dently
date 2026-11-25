"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approvePayrollRun,
  createPayrollRun,
  markPayrollRunPaid,
} from "@/app/actions/compensation";
import { formatCurrency } from "@/lib/utils";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export interface PayrollStaffUI {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PayrollRunUI {
  id: string;
  staffId: string;
  runType?: string;
  attendanceSummary?: {
    days?: number;
    statusCounts?: Record<string, number>;
  } | null;
  periodStart: Date | string;
  periodEnd: Date | string;
  grossRevenue: number | string;
  netRevenue: number | string;
  commission: number | string;
  bonuses: number | string;
  adjustments: number | string;
  totalPayable: number | string;
  status: string;
  paidAt: Date | string | null;
  paymentMethod: string | null;
  reference: string | null;
  staff?: {
    name: string;
    email: string;
  };
  items?: Array<{ id: string }>;
}

interface Props {
  clinicSlug: string;
  staff: PayrollStaffUI[];
  payrollRuns: PayrollRunUI[];
}

const PAGE_SIZE = 8;

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PayrollRunClient({
  clinicSlug,
  staff,
  payrollRuns: initialPayrollRuns,
}: Props) {
  const [payrollRuns, setPayrollRuns] =
    useState<PayrollRunUI[]>(initialPayrollRuns);
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(payrollRuns.length / PAGE_SIZE));
  const visiblePayrollRuns = useMemo(
    () => payrollRuns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, payrollRuns],
  );

  async function handleCreatePayroll() {
    if (!staffId || !periodStart || !periodEnd) {
      toast.error("Choose staff and payroll period");
      return;
    }

    setLoading(true);
    try {
      const result = await createPayrollRun(clinicSlug, {
        staffId,
        periodStart,
        periodEnd,
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      if (result.payroll) {
        toast.success("Payroll draft created");
        setPayrollRuns((prev) => [result.payroll as PayrollRunUI, ...prev]);
        setPage(1);
      }
    } catch {
      toast.error(
        "Network error while creating payroll draft. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(payrollRunId: string) {
    setLoading(true);
    try {
      const result = await approvePayrollRun(clinicSlug, payrollRunId);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Payroll approved");
      setPayrollRuns((prev) =>
        prev.map((run) =>
          run.id === payrollRunId ? { ...run, status: "APPROVED" } : run,
        ),
      );
    } catch {
      toast.error("Network error while approving payroll. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(payrollRunId: string) {
    setLoading(true);
    try {
      const result = await markPayrollRunPaid(clinicSlug, payrollRunId, {
        paymentMethod,
        reference,
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Payroll marked as paid");
      setPayrollRuns((prev) =>
        prev.map((run) =>
          run.id === payrollRunId
            ? {
                ...run,
                status: "PAID",
                paidAt: new Date().toISOString(),
                paymentMethod,
                reference,
              }
            : run,
        ),
      );
      setReference("");
    } catch {
      toast.error(
        "Network error while marking payroll as paid. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-3 px-4 border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-primary" />
          Payroll Runs
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Staff</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Period Start</Label>
            <Input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Period End</Label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <ConfirmActionDialog
            title="Create payroll draft?"
            description="This will reserve all payable ledger rows in the selected period for this payroll run."
            loading={loading}
            onConfirm={handleCreatePayroll}
            trigger={
              <Button disabled={loading || staff.length === 0} className="h-9">
                Create Draft
              </Button>
            }
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="space-y-1">
            <Label className="text-xs">Payment Method</Label>
            <Input
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Payment Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-9 text-xs"
              placeholder="Check number, bank ref, or notes"
            />
          </div>
        </div>

        {payrollRuns.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            No payroll runs recorded yet.
          </div>
        ) : (
          <>
            <Table className="text-xs">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Staff</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Period</TableHead>
                  <TableHead className="font-bold text-right">Basis</TableHead>
                  <TableHead className="font-bold text-right">
                    Total Payable
                  </TableHead>
                  <TableHead className="font-bold text-center">
                    Status
                  </TableHead>
                  <TableHead className="font-bold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePayrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {run.staff?.name || "Staff"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {run.staff?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase">
                        {run.runType === "DAILY_SALARY"
                          ? "Daily Salary"
                          : "Commission"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDate(run.periodStart)} -{" "}
                      {formatDate(run.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {run.runType === "DAILY_SALARY"
                        ? `${run.attendanceSummary?.days ?? 0} days`
                        : `${run.items?.length ?? 0} ledgers`}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(Number(run.totalPayable))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`text-[9px] font-bold uppercase ${
                          run.status === "PAID"
                            ? "bg-blue-100 text-blue-800"
                            : run.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {run.status === "DRAFT" && (
                          <ConfirmActionDialog
                            title="Approve payroll?"
                            description="Approved payroll runs can be marked as paid and will no longer be editable."
                            loading={loading}
                            onConfirm={() => handleApprove(run.id)}
                            trigger={
                              <Button size="sm" variant="outline">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>
                            }
                          />
                        )}
                        {run.status === "APPROVED" && (
                          <ConfirmActionDialog
                            title="Mark payroll as paid?"
                            description="This will mark included compensation ledger rows as PAID and lock them from formula recomputation."
                            loading={loading}
                            onConfirm={() => handleMarkPaid(run.id)}
                            trigger={<Button size="sm">Mark Paid</Button>}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
