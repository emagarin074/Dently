"use client";

import { useState } from "react";
import {
  Clock,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Building2,
  QrCode,
  Copy,
  Check,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  plan?: string;
  planExpiresAt?: string | null;
  clinicSlug: string;
  clinicName?: string;
}

export function SubscriptionBanner({
  plan = "Starter",
  planExpiresAt,
  clinicSlug,
  clinicName = "Your Clinic",
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Calculate days remaining
  let diffDays: number | null = null;
  if (planExpiresAt) {
    const expiry = new Date(planExpiresAt);
    const now = new Date();
    diffDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  const isExpired = diffDays !== null && diffDays < 0;
  const isExpiringSoon = diffDays !== null && diffDays >= 0 && diffDays <= 3;

  const planPrice = plan === "Clinic" ? "₱2,499" : "₱999";

  return (
    <>
      {/* ── Header Badge Trigger ── */}
      {diffDays !== null ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
            isExpired
              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              : isExpiringSoon
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse"
                : "bg-indigo-50/80 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/80"
          }`}
          title="Click to view subscription & payment instructions"
        >
          {isExpired ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span>Plan Expired ({Math.abs(diffDays)}d ago)</span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              <span>
                {diffDays === 0
                  ? "Expires today"
                  : `Free Trial (${diffDays}d left)`}
              </span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>{plan} Plan</span>
        </button>
      )}

      {/* ── Manual Payment & Subscription Instructions Modal ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden shadow-2xl border-slate-100">
          <DialogHeader className="bg-slate-50/80 border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                {plan} Tier
              </span>
              <span className="text-xs font-bold text-slate-800">
                {planPrice}{" "}
                <span className="text-[10px] text-slate-400 font-normal">
                  / month
                </span>
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span>Subscription & Payment Details</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Workspace:{" "}
              <strong className="text-slate-800">{clinicName}</strong> (/
              {clinicSlug})
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            {/* Expiry Status Alert */}
            {diffDays !== null && (
              <div
                className={`p-3 rounded-2xl border ${
                  isExpired
                    ? "bg-red-50/80 border-red-200 text-red-800"
                    : isExpiringSoon
                      ? "bg-amber-50/80 border-amber-200 text-amber-800"
                      : "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                }`}
              >
                <p className="font-bold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {isExpired
                      ? `Your trial expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`
                      : diffDays === 0
                        ? "Your trial expires today"
                        : `You have ${diffDays} day${diffDays === 1 ? "" : "s"} left on your trial`}
                  </span>
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {isExpired
                    ? "Please complete your payment below to maintain uninterrupted access."
                    : "You can renew or activate your subscription at any time using the payment channels below."}
                </p>
              </div>
            )}

            {/* Payment Options Strip */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-indigo-600" />
                <span>Official Payment Channels</span>
              </Label>

              {/* Option 1: GCash / Maya */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    GCash / Maya (eWallet)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    0% Fee
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">
                      0917 123 4567
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Account Name: Dently PH
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard("09171234567", "GCash Number")
                    }
                    className="h-7 px-2 text-[10px] gap-1 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    {copiedField === "GCash Number" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Option 2: Bank Transfer */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-600" />
                    Bank Transfer (BDO / BPI / UnionBank)
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">
                      BDO: 1234 5678 9012
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Account Name: Dently Software Services
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard("123456789012", "BDO Account")
                    }
                    className="h-7 px-2 text-[10px] gap-1 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    {copiedField === "BDO Account" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification / Support Notice */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>After Sending Payment</span>
              </p>
              <p className="text-emerald-700 leading-relaxed">
                Send a screenshot of your payment receipt or reference number to{" "}
                <strong className="underline">support@dently.app</strong> or via
                Viber/WhatsApp at <strong>+63 917 123 4567</strong>. Your plan
                will be updated instantly!
              </p>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50/70 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl text-xs h-9 border-slate-200 w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              type="button"
              asChild
              className="rounded-xl text-xs h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs gap-1.5 w-full sm:w-auto"
            >
              <a href="mailto:support@dently.app?subject=Dently%20Subscription%20Payment%20Receipt">
                <Mail className="h-3.5 w-3.5" />
                <span>Notify Support</span>
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
