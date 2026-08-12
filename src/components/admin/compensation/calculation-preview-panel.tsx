"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { evaluateLivePreview } from "@/app/actions/compensation";
import { formatCurrency } from "@/lib/utils";
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { EngineExecutionOutput } from "@/lib/compensation/types";

interface Props {
  clinicSlug: string;
  programId: string;
}

export function CalculationPreviewPanel({ clinicSlug, programId }: Props) {
  const [procedureName, setProcedureName] = useState("Root Canal Treatment");
  const [grossFee, setGrossFee] = useState("10000");
  const [discount, setDiscount] = useState("0");
  const [labFee, setLabFee] = useState("2000");
  const [paymentStatus, setPaymentStatus] = useState<
    "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID"
  >("FULLY_PAID");
  const [treatmentStatus, setTreatmentStatus] = useState<
    "PENDING" | "CHECKED_IN" | "COMPLETED" | "CANCELLED"
  >("COMPLETED");

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<EngineExecutionOutput | null>(null);

  async function handleTestCalculation() {
    setLoading(true);
    const input = {
      dentistId: "test-dentist",
      procedureName,
      grossFee: parseFloat(grossFee) || 0,
      discount: parseFloat(discount) || 0,
      labFee: parseFloat(labFee) || 0,
      paymentStatus,
      treatmentStatus,
    };

    const res = await evaluateLivePreview(clinicSlug, programId, input);
    setLoading(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else if (res.output) {
      setOutput(res.output);
      toast.success("Calculation preview updated!");
    }
  }

  return (
    <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white shadow-sm">
      <CardHeader className="py-3 px-4 border-b border-indigo-100 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-600" />
          Live Calculation Preview Panel
        </CardTitle>
        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Real-time Tester
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Sample Treatment Input Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700">
              Sample Procedure
            </Label>
            <Input
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="e.g. Cleaning, Root Canal"
              className="h-8 text-xs bg-white border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700">
              Gross Treatment Fee (₱)
            </Label>
            <Input
              type="number"
              value={grossFee}
              onChange={(e) => setGrossFee(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700">
              Patient Discount (₱)
            </Label>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700">
              Lab / Hardware Fee (₱)
            </Label>
            <Input
              type="number"
              value={labFee}
              onChange={(e) => setLabFee(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700">
              Payment Status
            </Label>
            <Select
              value={paymentStatus}
              onValueChange={(
                val: "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID",
              ) => setPaymentStatus(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-700">
              Treatment Status
            </Label>
            <Select
              value={treatmentStatus}
              onValueChange={(
                val: "PENDING" | "CHECKED_IN" | "COMPLETED" | "CANCELLED",
              ) => setTreatmentStatus(val)}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleTestCalculation}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 rounded-lg shadow-2xs"
        >
          <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Run Test
          Calculation
        </Button>

        {/* Calculation Output Results */}
        {output && (
          <div className="space-y-3 pt-2 border-t border-indigo-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">
                  Net Revenue
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatCurrency(output.netRevenue)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/20">
                <span className="text-[10px] text-emerald-700 block font-medium">
                  Dentist Payout
                </span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(output.commission + output.bonuses)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/20 col-span-2">
                <span className="text-[10px] text-indigo-700 block font-medium">
                  Clinic Net Earnings
                </span>
                <span className="font-bold text-indigo-900 text-base">
                  {formatCurrency(output.clinicRevenue)}
                </span>
              </div>
            </div>

            {/* Triggered Rule Audit Log List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block">
                Triggered Rule Sequence:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {output.appliedRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2 rounded-md border border-slate-200 text-[11px] space-y-0.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center">
                          {rule.priority}
                        </span>
                        {rule.ruleType.replace("_", " ")}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          rule.behavior === "REPLACE"
                            ? "bg-blue-100 text-blue-800"
                            : rule.behavior === "ADD"
                              ? "bg-emerald-100 text-emerald-800"
                              : rule.behavior === "BLOCK"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {rule.behavior}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[10px] leading-tight">
                      {rule.description}
                    </p>
                    {rule.isBlocked && (
                      <p className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {rule.blockReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
