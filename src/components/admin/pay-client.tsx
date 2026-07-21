"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { recordPayment } from "@/app/actions/billing";
import {
  createInstallmentPlanWithDownpayment,
  recordInstallmentPayment,
} from "@/app/actions/installments";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowLeft, DollarSign, Landmark } from "lucide-react";

interface Props {
  clinicSlug: string;
  billing: {
    id: string;
    totalAmount: unknown;
    paidAmount: unknown;
    status: string;
    notes: string | null;
    appointment: {
      id: string;
      status: string;
      patient: {
        id: string;
        firstName: string;
        lastName: string;
        installmentPlans: {
          id: string;
          totalAmount: unknown;
          paidAmount: unknown;
          status: string;
          notes: string | null;
          installments: {
            id: string;
            amount: unknown;
            method: string;
            reference: string | null;
            paidAt: string;
          }[];
        }[];
      } | null;
      dentist: { id: string; name: string } | null;
      procedures: {
        id: string;
        price: unknown;
        toothSelection: unknown;
        surfaceSelection: unknown;
        material: string | null;
        shade: string | null;
        severity: string | null;
        procedure: {
          name: string;
          category: string | null;
          isInstallmentAvailable: boolean;
        };
      }[];
      queueEntry: { id: string; queueNumber: number; status: string } | null;
    };
    payments: {
      id: string;
      amount: unknown;
      method: string;
      reference: string | null;
      paidAt: string;
    }[];
    installmentPlan: {
      id: string;
      totalAmount: unknown;
      paidAmount: unknown;
      status: string;
      notes: string | null;
      installments: {
        id: string;
        amount: unknown;
        method: string;
        reference: string | null;
        paidAt: string;
      }[];
    } | null;
    createdAt: string;
  };
}

const statusColors: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800 border-red-200",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800 border-yellow-200",
  FULLY_PAID: "bg-green-100 text-green-800 border-green-200",
};

export function PayClient({ clinicSlug, billing }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const balance = Number(billing.totalAmount) - Number(billing.paidAmount);
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [payNotes, setPayNotes] = useState("");

  // Downpayment (first installment) states
  const [downpayment, setDownpayment] = useState("");
  const [planNotes, setPlanNotes] = useState("");

  // Installment plan details (linked to today's billing or patient's first active plan)
  const activePlan =
    billing.installmentPlan ||
    billing.appointment.patient?.installmentPlans?.[0];
  const planBalance = activePlan
    ? Number(activePlan.totalAmount) - Number(activePlan.paidAmount)
    : 0;

  const summaryTotal = activePlan
    ? Number(activePlan.totalAmount)
    : Number(billing.totalAmount);
  const summaryPaid = activePlan
    ? Number(activePlan.paidAmount)
    : Number(billing.paidAmount);
  const summaryRemaining = activePlan ? planBalance : balance;

  const [showSuccessModal, setShowSuccessModal] = useState(
    billing.status === "FULLY_PAID" &&
      (!activePlan || activePlan.status === "COMPLETED"),
  );

  const [instAmount, setInstAmount] = useState("");
  const [instMethod, setInstMethod] = useState("CASH");
  const [instReference, setInstReference] = useState("");
  const [instNotes, setInstNotes] = useState("");

  const isInstallmentAllowed =
    !!activePlan ||
    billing.appointment.procedures.some(
      (p) => p.procedure.isInstallmentAvailable,
    );

  const planTotal = billing.appointment.procedures
    .filter((p) => p.procedure.isInstallmentAvailable)
    .reduce((sum, p) => sum + Number(p.price), 0);

  const oneTimeTotal = billing.appointment.procedures
    .filter((p) => !p.procedure.isInstallmentAvailable)
    .reduce((sum, p) => sum + Number(p.price), 0);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    // One-time payment is always the full remaining balance — no partial allowed
    const payVal = balance;
    if (payVal <= 0) return toast.error("No outstanding balance to pay");

    setLoading(true);
    const result = await recordPayment(
      clinicSlug,
      billing.id,
      payVal,
      method,
      reference,
      payNotes,
    );
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Payment recorded successfully");
      setShowSuccessModal(true);
      router.refresh();
    }
  }

  async function handleRecordInstPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlan) return toast.error("No active installment plan found");

    const amt = parseFloat(instAmount);
    if (isNaN(amt) || amt <= 0)
      return toast.error("Enter a valid installment payment amount");

    if (amt > planBalance)
      return toast.error("Payment cannot exceed remaining plan balance");

    setLoading(true);

    // If there is an outstanding balance for the current visit, record it first
    if (balance > 0) {
      const standardResult = await recordPayment(
        clinicSlug,
        billing.id,
        balance,
        instMethod,
        instReference,
        instNotes,
      );
      if ("error" in standardResult) {
        setLoading(false);
        return toast.error(standardResult.error);
      }
    }

    const result = await recordInstallmentPayment(clinicSlug, activePlan.id, {
      amount: amt,
      method: instMethod,
      reference: instReference,
      notes: instNotes,
      currentAppointmentId: billing.appointment.id,
    });
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Installment payment recorded successfully");
      setInstAmount("");
      setInstReference("");
      setInstNotes("");
      setShowSuccessModal(true);
      router.refresh();
    }
  }

  async function handleCreatePlanWithDownpayment(e: React.FormEvent) {
    e.preventDefault();
    if (!billing.appointment.patient?.id)
      return toast.error("Patient profile not found");

    const inputPayment = parseFloat(downpayment);
    if (isNaN(inputPayment) || inputPayment <= 0)
      return toast.error("Enter a valid downpayment amount");

    // The payment must cover any one-time treatments first
    if (inputPayment < oneTimeTotal) {
      return toast.error(
        `Payment must be at least ${formatCurrency(oneTimeTotal)} to cover non-installment treatments.`,
      );
    }

    const actualDownpayment = inputPayment - oneTimeTotal;
    if (actualDownpayment > planTotal) {
      return toast.error(
        "Downpayment cannot exceed the installment plan amount",
      );
    }

    setLoading(true);

    // 1. Process one-time payment part if exists
    if (oneTimeTotal > 0) {
      const standardResult = await recordPayment(
        clinicSlug,
        billing.id,
        oneTimeTotal,
        instMethod,
        instReference,
        "Combined one-time treatment payment",
      );
      if ("error" in standardResult) {
        setLoading(false);
        return toast.error(standardResult.error);
      }
    }

    // 2. Process installment plan creation
    const result = await createInstallmentPlanWithDownpayment(
      clinicSlug,
      billing.appointment.patient.id,
      {
        totalAmount: planTotal,
        billingId: billing.id,
        downpayment: actualDownpayment,
        method: instMethod,
        reference: instReference,
        notes: planNotes,
      },
    );
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Installment plan created and downpayment recorded!");
      setShowSuccessModal(true);
      router.refresh();
    }
  }

  const patientName = billing.appointment.patient
    ? `${billing.appointment.patient.firstName} ${billing.appointment.patient.lastName}`
    : "Anonymous Patient";

  const progressPercent = activePlan
    ? Math.min(
        100,
        Math.round(
          (Number(activePlan.paidAmount) / Number(activePlan.totalAmount)) *
            100,
        ),
      )
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center gap-3 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
        <Link href={`/clinic/${clinicSlug}/admin/bookings?tab=queue`}>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">
              Checkout: {patientName}
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${statusColors[billing.status]}`}
            >
              {billing.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Attending Dentist:{" "}
            {billing.appointment.dentist?.name || "No dentist assigned"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Details & Payments */}
        <div className="md:col-span-7 space-y-6">
          {/* Performed Procedures */}
          <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Performed Treatments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 divide-y divide-slate-100">
              {billing.appointment.procedures.map((p) => (
                <div
                  key={p.id}
                  className="py-3 flex justify-between items-start gap-4"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">
                      {p.procedure.name}
                    </h4>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                      {p.severity && (
                        <span>
                          Severity:{" "}
                          <span className="font-semibold text-slate-700">
                            {p.severity}
                          </span>
                        </span>
                      )}
                      {p.material && (
                        <span>
                          Material:{" "}
                          <span className="font-semibold text-slate-700">
                            {p.material}
                          </span>
                        </span>
                      )}
                      {p.shade && (
                        <span>
                          Shade:{" "}
                          <span className="font-semibold text-slate-700">
                            {p.shade}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    {formatCurrency(Number(p.price))}
                  </span>
                </div>
              ))}
              <div className="pt-4 flex justify-between items-center bg-slate-50/50 -mx-4 -mb-4 p-4 mt-2 font-semibold">
                <span className="text-xs text-slate-500 font-bold">
                  Total Treatment Bill:
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(Number(billing.totalAmount))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Standard Payment History */}
          <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-500" />
                Standard Payment Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {billing.payments.length === 0 ? (
                <p className="text-slate-400 text-xs py-8 text-center">
                  No payment transactions recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {billing.payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {pay.method} Payment
                        </p>
                        {pay.reference && (
                          <p className="text-[10px] text-slate-500">
                            Ref: {pay.reference}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          {formatDate(pay.paidAt)}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600">
                        +{formatCurrency(Number(pay.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Checkout Mode selection */}
        <div className="md:col-span-5">
          <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white overflow-hidden sticky top-6">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Checkout Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {/* Account Outstanding balance summary */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 text-xs space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    {activePlan ? "Installment Plan Total:" : "Invoice Total:"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(summaryTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Paid To Date:
                  </span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(summaryPaid)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold">
                  <span className="text-slate-700">
                    {activePlan
                      ? "Remaining Installment Balance (OB):"
                      : "Remaining Balance:"}
                  </span>
                  <span className="text-red-600 text-sm">
                    {formatCurrency(summaryRemaining)}
                  </span>
                </div>
              </div>

              {billing.appointment.status === "COMPLETED" ? (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">
                      Queue Satisfied!
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      This checkout session is complete and the patient has left
                      the queue.
                    </p>
                  </div>
                  <Link
                    href={`/clinic/${clinicSlug}/admin/bookings?tab=queue`}
                    className="block w-full"
                  >
                    <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs h-9">
                      Back to Appointments
                    </Button>
                  </Link>
                </div>
              ) : activePlan &&
                activePlan.status === "ACTIVE" &&
                billing.status === "FULLY_PAID" ? (
                /* Go straight to the installment option directly (no Tabs switcher, no One-time option) */
                <div className="space-y-4 animate-page-fade">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Installment Plan Detail</span>
                      <span className="text-[10px] uppercase text-indigo-600">
                        {activePlan.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Progress: {progressPercent}%</span>
                      <span>
                        {formatCurrency(Number(activePlan.paidAmount))} /{" "}
                        {formatCurrency(Number(activePlan.totalAmount))}
                      </span>
                    </div>
                    {activePlan.notes && (
                      <div className="text-[10px] bg-white border border-slate-200/50 p-2.5 rounded-lg text-slate-600 italic whitespace-pre-line mt-1">
                        {activePlan.notes}
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handleRecordInstPayment}
                    className="space-y-4 border-t border-slate-100 pt-3"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Flexible Installment Payment (₱) *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={planBalance}
                        value={instAmount}
                        onChange={(e) => setInstAmount(e.target.value)}
                        className="rounded-xl border-slate-200 h-10"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Payment Method *
                      </Label>
                      <Select value={instMethod} onValueChange={setInstMethod}>
                        <SelectTrigger className="rounded-xl border-slate-200 h-10">
                          <SelectValue placeholder="Select method..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CARD">
                            Debit / Credit Card
                          </SelectItem>
                          <SelectItem value="BANK_TRANSFER">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="ONLINE">
                            Online Payment (eWallet)
                          </SelectItem>
                          <SelectItem value="INSURANCE">
                            Dental Insurance
                          </SelectItem>
                          <SelectItem value="OTHER">Other Method</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Reference Receipt No.
                      </Label>
                      <Input
                        value={instReference}
                        onChange={(e) => setInstReference(e.target.value)}
                        placeholder="Ref number..."
                        className="rounded-xl border-slate-200 h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Notes / Remarks
                      </Label>
                      <Textarea
                        value={instNotes}
                        onChange={(e) => setInstNotes(e.target.value)}
                        placeholder="Log installment specific comments..."
                        rows={2}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 text-white font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm text-xs"
                    >
                      {loading ? "Recording..." : "Record Installment Payment"}
                    </Button>
                  </form>
                </div>
              ) : (
                <Tabs defaultValue="onetime" className="w-full">
                  <TabsList
                    className={`grid ${isInstallmentAllowed ? "grid-cols-2" : "grid-cols-1"} mb-4 rounded-xl border p-1 bg-slate-100/50`}
                  >
                    <TabsTrigger
                      value="onetime"
                      className="rounded-lg text-xs font-semibold"
                    >
                      One-time
                    </TabsTrigger>
                    {isInstallmentAllowed && (
                      <TabsTrigger
                        value="installment"
                        className="rounded-lg text-xs font-semibold"
                      >
                        Installment
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* One-time Payment Flow */}
                  <TabsContent value="onetime" className="space-y-4">
                    <form onSubmit={handleRecordPayment} className="space-y-4">
                      {billing.status === "FULLY_PAID" ? (
                        <div className="py-8 text-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl w-full">
                          🎉 Today&apos;s procedure invoice has been fully
                          settled.
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Payment Amount (₱)
                            </Label>
                            <div className="h-10 flex items-center px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800">
                              {formatCurrency(balance)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              One-time payment covers the full outstanding
                              balance.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Payment Method *
                            </Label>
                            <Select value={method} onValueChange={setMethod}>
                              <SelectTrigger className="rounded-xl border-slate-200 h-10">
                                <SelectValue placeholder="Select method..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="CARD">
                                  Debit / Credit Card
                                </SelectItem>
                                <SelectItem value="BANK_TRANSFER">
                                  Bank Transfer
                                </SelectItem>
                                <SelectItem value="ONLINE">
                                  Online Payment (eWallet)
                                </SelectItem>
                                <SelectItem value="INSURANCE">
                                  Dental Insurance
                                </SelectItem>
                                <SelectItem value="OTHER">
                                  Other Method
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Reference / Receipt Number
                            </Label>
                            <Input
                              value={reference}
                              onChange={(e) => setReference(e.target.value)}
                              placeholder="Ref code..."
                              className="rounded-xl border-slate-200 h-10"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Notes / Remarks
                            </Label>
                            <Textarea
                              value={payNotes}
                              onChange={(e) => setPayNotes(e.target.value)}
                              placeholder="Notes..."
                              rows={2}
                              className="rounded-xl border-slate-200"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 text-white font-bold bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm text-xs"
                          >
                            {loading
                              ? "Recording..."
                              : "Record One-time Payment"}
                          </Button>
                        </>
                      )}
                    </form>
                  </TabsContent>

                  {isInstallmentAllowed && (
                    <TabsContent value="installment" className="space-y-4">
                      {!activePlan ? (
                        /* A. Setup installment plan + downpayment in one step */
                        <form
                          onSubmit={handleCreatePlanWithDownpayment}
                          className="space-y-4"
                        >
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] text-indigo-800 space-y-1">
                            <p className="font-bold">Installment Plan Setup</p>
                            <p>
                              The plan total is automatically set to the full
                              treatment amount. Enter the downpayment to start
                              the plan.
                            </p>
                          </div>

                          {/* Plan total — locked, read-only */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Installment Plan Total (₱)
                            </Label>
                            <div className="h-10 flex items-center px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800">
                              {formatCurrency(planTotal)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Based on installment-eligible treatments.
                            </p>
                          </div>

                          {oneTimeTotal > 0 && (
                            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 space-y-1">
                              <p className="text-xs font-bold text-indigo-900">
                                Combined Payment Notice
                              </p>
                              <p className="text-[10px] text-indigo-700 leading-relaxed">
                                This patient has{" "}
                                <strong>{formatCurrency(oneTimeTotal)}</strong>{" "}
                                in one-time treatments for today. The
                                downpayment you enter below will first pay off
                                this balance, and the remainder will be recorded
                                as the plan&apos;s downpayment.
                              </p>
                            </div>
                          )}

                          {/* Downpayment amount */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Total Payment Amount (₱) *
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min={oneTimeTotal > 0 ? oneTimeTotal : 0.01}
                              max={Number(billing.totalAmount)}
                              value={downpayment}
                              onChange={(e) => setDownpayment(e.target.value)}
                              placeholder={`Min ${formatCurrency(oneTimeTotal)}...`}
                              className="rounded-xl border-slate-200 h-10"
                              required
                            />
                          </div>

                          {/* Payment method (shared with installment method) */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Payment Method *
                            </Label>
                            <Select
                              value={instMethod}
                              onValueChange={setInstMethod}
                            >
                              <SelectTrigger className="rounded-xl border-slate-200 h-10">
                                <SelectValue placeholder="Select method..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="CARD">
                                  Debit / Credit Card
                                </SelectItem>
                                <SelectItem value="BANK_TRANSFER">
                                  Bank Transfer
                                </SelectItem>
                                <SelectItem value="ONLINE">
                                  Online Payment (eWallet)
                                </SelectItem>
                                <SelectItem value="INSURANCE">
                                  Dental Insurance
                                </SelectItem>
                                <SelectItem value="OTHER">
                                  Other Method
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Reference / Receipt No.
                            </Label>
                            <Input
                              value={instReference}
                              onChange={(e) => setInstReference(e.target.value)}
                              placeholder="Ref number..."
                              className="rounded-xl border-slate-200 h-10"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Plan Notes / Installment Agreements
                            </Label>
                            <Textarea
                              value={planNotes}
                              onChange={(e) => setPlanNotes(e.target.value)}
                              placeholder="e.g. Monthly payments, 6-month scheme..."
                              rows={2}
                              className="rounded-xl border-slate-200"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 text-white font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm text-xs"
                          >
                            {loading
                              ? "Creating plan..."
                              : "Create Plan & Record Downpayment"}
                          </Button>
                        </form>
                      ) : (
                        /* B. Log Installment payments */
                        <div className="space-y-4">
                          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span>Installment Plan Detail</span>
                              <span className="text-[10px] uppercase text-indigo-600">
                                {activePlan.status}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Progress: {progressPercent}%</span>
                              <span>
                                {formatCurrency(Number(activePlan.paidAmount))}{" "}
                                /{" "}
                                {formatCurrency(Number(activePlan.totalAmount))}
                              </span>
                            </div>
                            {activePlan.notes && (
                              <p className="text-[10px] text-slate-500 italic mt-1">
                                Note: {activePlan.notes}
                              </p>
                            )}
                          </div>

                          {activePlan.status === "ACTIVE" ? (
                            <form
                              onSubmit={handleRecordInstPayment}
                              className="space-y-4 border-t border-slate-100 pt-3"
                            >
                              {balance > 0 && (
                                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 space-y-1">
                                  <p className="text-xs font-bold text-indigo-900">
                                    Combined Payment Notice
                                  </p>
                                  <p className="text-[10px] text-indigo-700 leading-relaxed">
                                    This patient has an unpaid balance of{" "}
                                    <strong>{formatCurrency(balance)}</strong>{" "}
                                    for today&apos;s treatments. Submitting this
                                    form will automatically settle the{" "}
                                    {formatCurrency(balance)} one-time balance
                                    <strong> PLUS </strong> your specified
                                    installment payment amount below.
                                  </p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Flexible Installment Payment (₱) *
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={planBalance}
                                  value={instAmount}
                                  onChange={(e) =>
                                    setInstAmount(e.target.value)
                                  }
                                  className="rounded-xl border-slate-200 h-10"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Payment Method *
                                </Label>
                                <Select
                                  value={instMethod}
                                  onValueChange={setInstMethod}
                                >
                                  <SelectTrigger className="rounded-xl border-slate-200 h-10">
                                    <SelectValue placeholder="Select method..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="CARD">
                                      Debit / Credit Card
                                    </SelectItem>
                                    <SelectItem value="BANK_TRANSFER">
                                      Bank Transfer
                                    </SelectItem>
                                    <SelectItem value="ONLINE">
                                      Online Payment (eWallet)
                                    </SelectItem>
                                    <SelectItem value="INSURANCE">
                                      Dental Insurance
                                    </SelectItem>
                                    <SelectItem value="OTHER">
                                      Other Method
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Reference Receipt No.
                                </Label>
                                <Input
                                  value={instReference}
                                  onChange={(e) =>
                                    setInstReference(e.target.value)
                                  }
                                  placeholder="Ref number..."
                                  className="rounded-xl border-slate-200 h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">
                                  Notes / Remarks
                                </Label>
                                <Textarea
                                  value={instNotes}
                                  onChange={(e) => setInstNotes(e.target.value)}
                                  placeholder="Log installment specific comments..."
                                  rows={2}
                                  className="rounded-xl border-slate-200"
                                />
                              </div>

                              <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 text-white font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm text-xs"
                              >
                                {loading
                                  ? "Recording..."
                                  : balance > 0
                                    ? `Pay ${formatCurrency(balance + (parseFloat(instAmount) || 0))} (Treatments + Installment)`
                                    : "Record Installment Payment"}
                              </Button>
                            </form>
                          ) : (
                            <div className="py-8 text-center text-xs font-bold text-green-600 bg-green-50 border border-green-100 rounded-xl w-full">
                              🎉 This installment plan has been fully paid off.
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal Overlay */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1.5">
              The payment has been successfully recorded for{" "}
              <strong className="text-slate-700">{patientName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 flex justify-end gap-3 bg-slate-50/30">
            <Link href={`/clinic/${clinicSlug}/admin/bookings?tab=queue`}>
              <Button className="h-9 px-5 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white shadow-sm transition-all">
                Back to Appointment Queue
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
