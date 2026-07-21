"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TablePagination } from "@/components/ui/pagination";

interface BillingRow {
  id: string;
  patientName: string;
  procedures: string;
  totalAmount: number;
  transactionAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  date: string;
}

const statusColors: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
  FULLY_PAID: "bg-green-100 text-green-800",
};

export function BillingClient({
  rows,
  total,
  page,
}: {
  rows: BillingRow[];
  total: number;
  page: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["UNPAID", "PARTIALLY_PAID", "FULLY_PAID"].map((s) => (
          <Card key={s}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">
                {s.replace("_", " ")}
              </p>
              <p className="text-2xl font-bold">
                {rows.filter((r) => r.status === s).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Procedures
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Total Paid
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No billing records
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.patientName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {r.procedures}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(r.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(r.transactionAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {formatCurrency(r.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {formatCurrency(r.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TablePagination total={total} page={page} itemName="billing records" />
    </div>
  );
}
