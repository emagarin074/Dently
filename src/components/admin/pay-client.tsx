"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { compressImage } from "@/lib/image-compression";

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return {
    base64: btoa(binary),
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
    fileSize: file.size,
  };
}

function computeSchedulePreview(
  remainingPlanBalance: number,
  frequency: string,
  count: number,
  fixedPaymentAmount?: number,
) {
  if (remainingPlanBalance <= 0 || count <= 0) return [];
  const items: Array<{ dueDate: string; amount: number }> = [];
  const perItem = fixedPaymentAmount
    ? Number(fixedPaymentAmount.toFixed(2))
    : Number((remainingPlanBalance / count).toFixed(2));

  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today.getTime());
    if (frequency === "MONTHLY") {
      d.setMonth(d.getMonth() + i);
    } else if (frequency === "BIWEEKLY") {
      d.setDate(d.getDate() + i * 14);
    } else {
      d.setDate(d.getDate() + i * 7);
    }
    const coveredBefore = perItem * (i - 1);
    const remainingForItem = Number(
      (remainingPlanBalance - coveredBefore).toFixed(2),
    );
    const amt = fixedPaymentAmount
      ? Math.min(perItem, remainingForItem)
      : i === count
        ? Number((remainingPlanBalance - perItem * (count - 1)).toFixed(2))
        : perItem;
    if (amt <= 0) break;
    items.push({
      dueDate: d.toISOString().split("T")[0],
      amount: Number(amt.toFixed(2)),
    });
  }
  return items;
}
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
import {
  CheckCircle,
  ArrowLeft,
  DollarSign,
  Landmark,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    details: Array<{ label: string; value: string }>;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [instAmount, setInstAmount] = useState("");
  const [instMethod, setInstMethod] = useState("CASH");
  const [instReference, setInstReference] = useState("");
  const [instNotes, setInstNotes] = useState("");
  const [instFrequency, setInstFrequency] = useState<
    "MONTHLY" | "BIWEEKLY" | "WEEKLY"
  >("MONTHLY");
  const [scheduleMode, setScheduleMode] = useState<"COUNT" | "MONTHLY_AMOUNT">(
    "COUNT",
  );
  const [instCount, setInstCount] = useState("3");
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState("");
  const [debouncedMonthlyAmount, setDebouncedMonthlyAmount] = useState("");
  const monthlyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expandSchedule, setExpandSchedule] = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  // Debounce the monthly payment amount for schedule calculation
  // so typing doesn't freeze the UI with expensive re-renders
  useEffect(() => {
    if (monthlyDebounceRef.current) {
      clearTimeout(monthlyDebounceRef.current);
    }
    monthlyDebounceRef.current = setTimeout(() => {
      setDebouncedMonthlyAmount(monthlyPaymentAmount);
      setExpandSchedule(false);
    }, 500);
    return () => {
      if (monthlyDebounceRef.current) {
        clearTimeout(monthlyDebounceRef.current);
      }
    };
  }, [monthlyPaymentAmount]);

  const getSchedulePreview = useCallback(
    (remainingPlanBalance: number) => {
      if (scheduleMode === "MONTHLY_AMOUNT") {
        const monthlyAmount = parseFloat(debouncedMonthlyAmount);
        if (isNaN(monthlyAmount) || monthlyAmount <= 0) return [];
        const months = Math.ceil(remainingPlanBalance / monthlyAmount);
        return computeSchedulePreview(
          remainingPlanBalance,
          "MONTHLY",
          months,
          monthlyAmount,
        );
      }

      const count = parseInt(instCount, 10);
      if (isNaN(count) || count <= 0) return [];
      return computeSchedulePreview(remainingPlanBalance, instFrequency, count);
    },
    [scheduleMode, debouncedMonthlyAmount, instCount, instFrequency],
  );

  const getScheduleValidationError = useCallback(
    (remainingPlanBalance: number) => {
      if (remainingPlanBalance <= 0) return null;

      if (scheduleMode === "MONTHLY_AMOUNT") {
        const monthlyAmount = parseFloat(monthlyPaymentAmount);
        if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
          return "Enter a valid monthly payment amount.";
        }
        return null;
      }

      const count = parseInt(instCount, 10);
      if (isNaN(count) || count <= 0) {
        return "Enter a valid number of installments.";
      }
      return null;
    },
    [scheduleMode, monthlyPaymentAmount, instCount],
  );

  const getScheduleBasisLabel = useCallback(
    (remainingPlanBalance: number) => {
      if (scheduleMode === "MONTHLY_AMOUNT") {
        const monthlyAmount = parseFloat(debouncedMonthlyAmount);
        if (isNaN(monthlyAmount) || monthlyAmount <= 0)
          return "Monthly payment amount";
        const months = Math.ceil(remainingPlanBalance / monthlyAmount);
        return `${formatCurrency(monthlyAmount)} per month for ${months} month${months === 1 ? "" : "s"}`;
      }

      const count = parseInt(instCount, 10);
      return `${Number.isNaN(count) ? 0 : count} installment${count === 1 ? "" : "s"} (${instFrequency.toLowerCase()})`;
    },
    [scheduleMode, debouncedMonthlyAmount, instCount, instFrequency],
  );

  const isInstallmentAllowed = useMemo(
    () =>
      !!activePlan ||
      billing.appointment.procedures.some(
        (p) => p.procedure.isInstallmentAvailable,
      ),
    [activePlan, billing.appointment.procedures],
  );

  const planTotal = useMemo(
    () =>
      billing.appointment.procedures
        .filter((p) => p.procedure.isInstallmentAvailable)
        .reduce((sum, p) => sum + Number(p.price), 0),
    [billing.appointment.procedures],
  );

  const oneTimeTotal = useMemo(
    () =>
      billing.appointment.procedures
        .filter((p) => !p.procedure.isInstallmentAvailable)
        .reduce((sum, p) => sum + Number(p.price), 0),
    [billing.appointment.procedures],
  );

  const patientName = billing.appointment.patient
    ? `${billing.appointment.patient.firstName} ${billing.appointment.patient.lastName}`
    : "Anonymous Patient";

  function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    // One-time payment is always the full remaining balance — no partial allowed
    const payVal = balance;
    if (payVal <= 0) return toast.error("No outstanding balance to pay");

    setConfirmModal({
      title: "Review & Confirm One-Time Payment",
      description:
        "Please review the payment details before completing this transaction.",
      details: [
        { label: "Patient Name", value: patientName },
        { label: "Payment Type", value: "One-time Payment" },
        { label: "Amount to Collect", value: formatCurrency(payVal) },
        { label: "Payment Method", value: method },
        { label: "Reference / Receipt No.", value: reference || "N/A" },
        { label: "Notes / Remarks", value: payNotes || "None" },
      ],
      onConfirm: async () => {
        setLoading(true);
        try {
          const result = await recordPayment(
            clinicSlug,
            billing.id,
            payVal,
            method,
            reference,
            payNotes,
          );

          if ("error" in result) {
            toast.error(result.error);
          } else {
            toast.success("Payment recorded successfully");
            setShowSuccessModal(true);
            router.refresh();
          }
        } catch {
          toast.error(
            "Network error while recording payment. Please try again.",
          );
        } finally {
          setLoading(false);
        }
      },
    });
  }

  function handleRecordInstPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!activePlan) return toast.error("No active installment plan found");

    const amt = parseFloat(instAmount);
    if (isNaN(amt) || amt <= 0)
      return toast.error("Enter a valid installment payment amount");

    if (amt > planBalance)
      return toast.error("Payment cannot exceed remaining plan balance");

    const totalCollected = (balance > 0 ? balance : 0) + amt;

    const details: Array<{ label: string; value: string }> = [
      { label: "Patient Name", value: patientName },
      { label: "Payment Type", value: "Installment Payment" },
      { label: "Installment Amount", value: formatCurrency(amt) },
    ];

    if (balance > 0) {
      details.push(
        { label: "Today's One-Time Balance", value: formatCurrency(balance) },
        {
          label: "Total Cash Collected",
          value: formatCurrency(totalCollected),
        },
      );
    }

    details.push(
      { label: "Payment Method", value: instMethod },
      { label: "Reference / Receipt No.", value: instReference || "N/A" },
      { label: "Notes / Remarks", value: instNotes || "None" },
    );

    setConfirmModal({
      title: "Review & Confirm Installment Payment",
      description:
        "Please review the installment payment summary before completing this transaction.",
      details,
      onConfirm: async () => {
        setLoading(true);
        try {
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
              toast.error(standardResult.error);
              return;
            }
          }

          const result = await recordInstallmentPayment(
            clinicSlug,
            activePlan.id,
            {
              amount: amt,
              method: instMethod,
              reference: instReference,
              notes: instNotes,
              currentAppointmentId: billing.appointment.id,
            },
          );

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
        } catch {
          toast.error(
            "Network error while recording installment payment. Please try again.",
          );
        } finally {
          setLoading(false);
        }
      },
    });
  }

  async function handleCreatePlanWithDownpayment(e: React.FormEvent) {
    e.preventDefault();
    if (!billing.appointment.patient?.id)
      return toast.error("Patient profile not found");

    const inputPayment = parseFloat(downpayment);
    if (isNaN(inputPayment) || inputPayment < 0)
      return toast.error("Enter a valid payment amount");

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

    const remainingPlanBal = Math.max(0, planTotal - actualDownpayment);
    const scheduleError = getScheduleValidationError(remainingPlanBal);
    if (scheduleError) return toast.error(scheduleError);
    const scheduleItems = getSchedulePreview(remainingPlanBal);

    if (!agreementFile) {
      return toast.error(
        "Please upload a photo of the signed Installment Agreement contract to create the plan.",
      );
    }

    const details: Array<{ label: string; value: string }> = [
      { label: "Patient Name", value: patientName },
      { label: "Payment Type", value: "Installment Plan Creation" },
      { label: "Installment Plan Total", value: formatCurrency(planTotal) },
      { label: "Total Amount Collected", value: formatCurrency(inputPayment) },
      {
        label: "Downpayment Applied to Plan",
        value: formatCurrency(actualDownpayment),
      },
      {
        label: "Balance Used for Monthly Dues",
        value: formatCurrency(remainingPlanBal),
      },
      {
        label: "Schedule Basis",
        value: getScheduleBasisLabel(remainingPlanBal),
      },
      {
        label: "Payment Duration",
        value: `${scheduleItems.length} payment${scheduleItems.length === 1 ? "" : "s"}`,
      },
    ];

    if (oneTimeTotal > 0) {
      details.push(
        { label: "One-Time Treatments", value: formatCurrency(oneTimeTotal) },
        {
          label: "Actual Plan Downpayment",
          value: formatCurrency(actualDownpayment),
        },
      );
    }

    details.push(
      { label: "Payment Method", value: instMethod },
      { label: "Reference / Receipt No.", value: instReference || "N/A" },
      { label: "Plan Notes", value: planNotes || "None" },
    );

    let agreementDocument:
      | {
          base64: string;
          mimeType: string;
          fileName: string;
          fileSize: number;
        }
      | undefined;
    if (agreementFile) {
      try {
        const { file: compressed } = await compressImage(agreementFile);
        agreementDocument = await fileToBase64(compressed);
      } catch {
        agreementDocument = await fileToBase64(agreementFile);
      }
    }

    setConfirmModal({
      title: "Review & Confirm Installment Plan",
      description:
        "Please review the installment plan details and downpayment before creating the plan.",
      details,
      onConfirm: async () => {
        setLoading(true);
        try {
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
              toast.error(standardResult.error);
              return;
            }
          }

          // 2. Process installment plan creation
          const result = await createInstallmentPlanWithDownpayment(
            clinicSlug,
            billing.appointment.patient!.id,
            {
              totalAmount: planTotal,
              billingId: billing.id,
              downpayment: actualDownpayment,
              method: instMethod,
              reference: instReference,
              notes: planNotes,
              scheduleItems,
              agreementDocument,
            },
          );

          if ("error" in result) {
            toast.error(result.error);
          } else {
            toast.success("Installment plan created and downpayment recorded!");
            setShowSuccessModal(true);
            router.refresh();
          }
        } catch {
          toast.error(
            "Network error while creating installment plan. Please try again.",
          );
        } finally {
          setLoading(false);
        }
      },
    });
  }

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
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ── Header Bar with inline balance summary ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href={`/clinic/${clinicSlug}/admin/bookings?tab=queue`}>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800 truncate">
                Checkout: {patientName}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 ${statusColors[billing.status]}`}
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

        {/* Inline balance summary */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
          <div className="text-center sm:text-right">
            <span className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              {activePlan ? "Plan Total" : "Invoice Total"}
            </span>
            <span className="text-sm font-bold text-slate-800">
              {formatCurrency(summaryTotal)}
            </span>
          </div>
          <div className="text-center sm:text-right">
            <span className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Paid To Date
            </span>
            <span className="text-sm font-bold text-emerald-600">
              {formatCurrency(summaryPaid)}
            </span>
          </div>
          <div className="text-center sm:text-right">
            <span className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Remaining
            </span>
            <span className="text-sm font-bold text-red-600">
              {formatCurrency(summaryRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Performed Treatments (full-width compact card) ── */}
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

      {/* ── Checkout Form Card (full-width) ── */}
      <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {billing.appointment.status === "COMPLETED" ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-800 text-xs">
                  Queue Satisfied!
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  This checkout session is complete and the patient has left the
                  queue.
                </p>
              </div>
              <Link
                href={`/clinic/${clinicSlug}/admin/bookings?tab=queue`}
                className="block w-full max-w-xs mx-auto"
              >
                <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs h-9">
                  Back to Appointments
                </Button>
              </Link>
            </div>
          ) : activePlan &&
            activePlan.status === "ACTIVE" &&
            billing.status === "FULLY_PAID" ? (
            /* Go straight to the installment option directly */
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      rows={1}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
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
                      🎉 Today&apos;s procedure invoice has been fully settled.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            rows={1}
                            className="rounded-xl border-slate-200"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 text-white font-bold bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm text-xs"
                      >
                        {loading ? "Recording..." : "Record One-time Payment"}
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
                          treatment amount. Enter the downpayment to start the
                          plan.
                        </p>
                      </div>

                      {oneTimeTotal > 0 && (
                        <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 space-y-1">
                          <p className="text-xs font-bold text-indigo-900">
                            Combined Payment Notice
                          </p>
                          <p className="text-[10px] text-indigo-700 leading-relaxed">
                            This patient has{" "}
                            <strong>{formatCurrency(oneTimeTotal)}</strong> in
                            one-time treatments for today. The downpayment you
                            enter below will first pay off this balance, and the
                            remainder will be recorded as the plan&apos;s
                            downpayment.
                          </p>
                        </div>
                      )}

                      {/* ── Two-column layout: Left = form fields, Right = schedule generator ── */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left Column: Payment form fields */}
                        <div className="lg:col-span-5 space-y-4">
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

                          {/* Downpayment amount */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">
                              Total Payment Amount (₱) *
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min={oneTimeTotal > 0 ? oneTimeTotal : 0}
                              max={Number(billing.totalAmount)}
                              value={downpayment}
                              onChange={(e) => setDownpayment(e.target.value)}
                              placeholder={`Min ${formatCurrency(oneTimeTotal)}...`}
                              className="rounded-xl border-slate-200 h-10"
                              required
                            />
                          </div>

                          {/* Payment method */}
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

                          {/* Installment Agreement Contract Photo Upload */}
                          <div className="space-y-2 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                            <Label className="text-xs font-bold text-amber-900 flex items-center justify-between">
                              <span>Signed Installment Agreement Photo *</span>
                              <span className="text-[10px] text-amber-700 font-semibold uppercase">
                                Required
                              </span>
                            </Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setAgreementFile(e.target.files?.[0] ?? null)
                              }
                              className="rounded-xl border-amber-300 h-9 bg-white text-xs"
                              required
                            />
                            <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                              Upload a photo of the patient&apos;s signed
                              Installment Agreement contract to complete the
                              plan setup.
                            </p>
                            {agreementFile && (
                              <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {agreementFile.name}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Schedule Generator */}
                        <div className="lg:col-span-7">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 sticky top-6">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                              Installment Schedule Generator
                            </Label>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-slate-600">
                                  Schedule Basis
                                </Label>
                                <Select
                                  value={scheduleMode}
                                  onValueChange={(
                                    val: "COUNT" | "MONTHLY_AMOUNT",
                                  ) => setScheduleMode(val)}
                                >
                                  <SelectTrigger className="rounded-lg border-slate-200 h-8 text-xs bg-white">
                                    <SelectValue placeholder="Basis" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="COUNT">
                                      Number of Payments
                                    </SelectItem>
                                    <SelectItem value="MONTHLY_AMOUNT">
                                      Monthly Amount
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-slate-600">
                                  Payment Frequency
                                </Label>
                                <Select
                                  value={instFrequency}
                                  onValueChange={(
                                    val: "MONTHLY" | "BIWEEKLY" | "WEEKLY",
                                  ) => setInstFrequency(val)}
                                  disabled={scheduleMode === "MONTHLY_AMOUNT"}
                                >
                                  <SelectTrigger className="rounded-lg border-slate-200 h-8 text-xs bg-white">
                                    <SelectValue placeholder="Frequency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MONTHLY">
                                      Monthly
                                    </SelectItem>
                                    <SelectItem value="BIWEEKLY">
                                      Bi-Weekly (14 days)
                                    </SelectItem>
                                    <SelectItem value="WEEKLY">
                                      Weekly
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {scheduleMode === "COUNT" ? (
                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-slate-600">
                                  Number of Installments
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={instCount}
                                  onChange={(e) => setInstCount(e.target.value)}
                                  placeholder="Enter number of payments"
                                  className="rounded-lg border-slate-200 h-8 text-xs bg-white"
                                />
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-slate-600">
                                  Target Monthly Payment (₱)
                                </Label>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={monthlyPaymentAmount}
                                  onChange={(e) =>
                                    setMonthlyPaymentAmount(e.target.value)
                                  }
                                  placeholder="Enter monthly amount"
                                  className="rounded-lg border-slate-200 h-8 text-xs bg-white"
                                />
                              </div>
                            )}

                            {/* Schedule Items Preview */}
                            {(() => {
                              const inputPayment = parseFloat(downpayment) || 0;
                              const actualDP = Math.max(
                                0,
                                inputPayment - oneTimeTotal,
                              );
                              const remainingPlanBal = Math.max(
                                0,
                                planTotal - actualDP,
                              );
                              const items =
                                getSchedulePreview(remainingPlanBal);

                              return (
                                <div className="space-y-1.5 pt-1">
                                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-2 text-[11px]">
                                    <div>
                                      <span className="block text-slate-500">
                                        Plan Total
                                      </span>
                                      <span className="font-bold text-slate-900">
                                        {formatCurrency(planTotal)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-slate-500">
                                        Less Downpayment
                                      </span>
                                      <span className="font-bold text-emerald-700">
                                        {formatCurrency(actualDP)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-slate-500">
                                        Monthly Due Basis
                                      </span>
                                      <span className="font-bold text-indigo-700">
                                        {formatCurrency(remainingPlanBal)}
                                      </span>
                                    </div>
                                  </div>

                                  {items.length === 0
                                    ? null
                                    : (() => {
                                        const COLLAPSED_LIMIT = 4;
                                        const shouldCollapse =
                                          items.length > COLLAPSED_LIMIT;
                                        const visibleItems =
                                          shouldCollapse && !expandSchedule
                                            ? [
                                                ...items.slice(0, 3),
                                                items[items.length - 1],
                                              ]
                                            : items;
                                        const hiddenCount = items.length - 4;

                                        return (
                                          <>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                              Generated Schedule Preview (
                                              {items.length} Payments)
                                            </span>
                                            {scheduleMode ===
                                              "MONTHLY_AMOUNT" && (
                                              <p className="text-[10px] text-slate-500">
                                                Full payment will take{" "}
                                                {items.length} month
                                                {items.length === 1 ? "" : "s"}.
                                                The final payment is adjusted if
                                                the balance does not divide
                                                evenly.
                                              </p>
                                            )}
                                            <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg text-xs overflow-hidden max-h-[320px] overflow-y-auto">
                                              {visibleItems.map((item, idx) => {
                                                const realIdx =
                                                  shouldCollapse &&
                                                  !expandSchedule &&
                                                  idx === 3
                                                    ? items.length - 1
                                                    : shouldCollapse &&
                                                        !expandSchedule
                                                      ? idx
                                                      : idx;
                                                const displayNumber =
                                                  shouldCollapse &&
                                                  !expandSchedule &&
                                                  idx === 3
                                                    ? items.length
                                                    : realIdx + 1;

                                                return (
                                                  <div
                                                    key={displayNumber}
                                                    className="p-2 flex items-center justify-between"
                                                  >
                                                    <span className="font-medium text-slate-700">
                                                      Installment #
                                                      {displayNumber}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                      <span className="text-slate-500 text-[11px]">
                                                        Due: {item.dueDate}
                                                      </span>
                                                      <span className="font-bold text-slate-900">
                                                        {formatCurrency(
                                                          item.amount,
                                                        )}
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                              {shouldCollapse && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setExpandSchedule(
                                                      !expandSchedule,
                                                    )
                                                  }
                                                  className="w-full p-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                                                >
                                                  {expandSchedule ? (
                                                    <>
                                                      <ChevronUp className="h-3.5 w-3.5" />
                                                      Show less
                                                    </>
                                                  ) : (
                                                    <>
                                                      <ChevronDown className="h-3.5 w-3.5" />
                                                      Show all {items.length}{" "}
                                                      payments ({hiddenCount}{" "}
                                                      hidden)
                                                    </>
                                                  )}
                                                </button>
                                              )}
                                            </div>
                                          </>
                                        );
                                      })()}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
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
                            {formatCurrency(Number(activePlan.paidAmount))} /{" "}
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
                                <strong>{formatCurrency(balance)}</strong> for
                                today&apos;s treatments. Submitting this form
                                will automatically settle the{" "}
                                {formatCurrency(balance)} one-time balance
                                <strong> PLUS </strong>your specified
                                installment payment amount below.
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                rows={1}
                                className="rounded-xl border-slate-200"
                              />
                            </div>
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

      {/* ── Standard Payment History (full-width bottom) ── */}
      <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-slate-500" />
            Standard Payment Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {billing.payments.length === 0 ? (
            <p className="text-slate-400 text-xs py-4 text-center">
              No payment transactions recorded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

      {/* Payment Confirmation Review Dialog */}
      <Dialog
        open={!!confirmModal}
        onOpenChange={(open) => {
          if (!open && !loading) setConfirmModal(null);
        }}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              {confirmModal?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {confirmModal?.description}
            </DialogDescription>
          </DialogHeader>

          {confirmModal && (
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2 text-xs">
                {confirmModal.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-slate-500 font-medium">
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-800 text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setConfirmModal(null)}
              disabled={loading}
              className="rounded-xl text-xs h-9 px-4 border-slate-200"
            >
              Cancel & Edit
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (confirmModal) {
                  const action = confirmModal.onConfirm;
                  await action();
                  setConfirmModal(null);
                }
              }}
              disabled={loading}
              className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-sm"
            >
              {loading ? "Processing..." : "Confirm & Complete Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
