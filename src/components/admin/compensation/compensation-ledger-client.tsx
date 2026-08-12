"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { FileText, Search, ShieldCheck } from "lucide-react";

export interface LedgerRecordUI {
  id: string;
  treatmentId: string | null;
  dentistId: string;
  procedureName: string;
  grossFee: number | string;
  discount: number | string;
  labFee: number | string;
  netRevenue: number | string;
  programVersion: number;
  commission: number | string;
  bonuses: number | string;
  clinicRevenue: number | string;
  status: string;
  createdAt: Date | string;
  program?: { name: string; version: number };
}

interface Props {
  ledgers: LedgerRecordUI[];
}

export function CompensationLedgerClient({ ledgers }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = ledgers.filter(
    (l) =>
      l.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.program?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Immutable
          Compensation Ledger
        </CardTitle>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search procedure or program..."
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No completed treatment ledger records found.
          </div>
        ) : (
          <Table className="text-xs">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Procedure</TableHead>
                <TableHead className="font-bold">Program Version</TableHead>
                <TableHead className="font-bold text-right">
                  Gross Fee
                </TableHead>
                <TableHead className="font-bold text-right">Lab Fee</TableHead>
                <TableHead className="font-bold text-right">
                  Net Revenue
                </TableHead>
                <TableHead className="font-bold text-right">
                  Dentist Payout
                </TableHead>
                <TableHead className="font-bold text-right">
                  Clinic Net
                </TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-700">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {item.procedureName}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.program?.name || "Program"} (v{item.programVersion})
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(item.grossFee))}
                  </TableCell>
                  <TableCell className="text-right text-rose-600 font-medium">
                    {Number(item.labFee) > 0
                      ? `-${formatCurrency(Number(item.labFee))}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-800">
                    {formatCurrency(Number(item.netRevenue))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-700">
                    {formatCurrency(
                      Number(item.commission) + Number(item.bonuses),
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-indigo-900">
                    {formatCurrency(Number(item.clinicRevenue))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={`text-[9px] font-bold uppercase ${
                        item.status === "PAYABLE"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "BLOCKED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
