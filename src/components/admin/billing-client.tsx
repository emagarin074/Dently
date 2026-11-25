"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TablePagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface BillingRow {
  id: string;
  patientName: string;
  procedures: string;
  totalAmount: number;
  transactionAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  branchName: string;
  date: string;
}

export function BillingClient({
  rows = [],
  total = 0,
  page = 1,
  branches = [],
  selectedBranchId = "ALL",
}: {
  rows?: BillingRow[];
  total?: number;
  page?: number;
  branches?: { id: string; name: string; isPrimary: boolean }[];
  selectedBranchId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeBranchFilter(branchId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (branchId === "ALL") params.delete("branch");
    else params.set("branch", branchId);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "UNPAID":
        return (
          <Badge variant="destructive" className="font-mono text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Unpaid
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge variant="warning" className="font-mono text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Partially Paid
          </Badge>
        );
      case "FULLY_PAID":
        return (
          <Badge variant="success" className="font-mono text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Fully Paid
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status.replace("_", " ")}</Badge>;
    }
  }

  const unpaidCount = rows.filter((r) => r.status === "UNPAID").length;
  const partialCount = rows.filter((r) => r.status === "PARTIALLY_PAID").length;
  const paidCount = rows.filter((r) => r.status === "FULLY_PAID").length;

  return (
    <div className="space-y-4">
      {/* Top Summary & Filter Row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Unpaid
                </p>
                <p className="text-xl font-bold font-mono text-rose-600 mt-0.5">
                  {unpaidCount}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Partially Paid
                </p>
                <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                  {partialCount}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
                <Clock className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Fully Paid
                </p>
                <p className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                  {paidCount}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedBranchId} onValueChange={changeBranchFilter}>
            <SelectTrigger className="h-9 w-full md:w-[200px] text-xs bg-white">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modern Data Table */}
      <Card className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
                <TableHead>Patient</TableHead>
                <TableHead>Procedures</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Total Invoice</TableHead>
                <TableHead className="text-right">Tx Amount</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-xs text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                      <CreditCard className="h-6 w-6 text-slate-400" />
                      <p className="font-medium text-slate-700">
                        No billing records found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Invoices will appear here once procedures are completed.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <TableCell className="font-semibold text-xs sm:text-sm text-slate-900">
                      {r.patientName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                      {r.procedures}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {r.branchName}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-700">
                      {formatCurrency(r.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-900">
                      {formatCurrency(r.transactionAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-600 font-medium">
                      {formatCurrency(r.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-rose-600 font-semibold">
                      {formatCurrency(r.balance)}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TablePagination total={total} page={page} itemName="billing records" />
    </div>
  );
}
