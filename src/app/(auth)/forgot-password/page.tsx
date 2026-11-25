"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/app/actions/password-reset";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setMessage(
      result.message ||
        "If an account with that email exists, reset instructions have been sent.",
    );
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your registered email address to receive password reset
          instructions.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-5 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Check your inbox</p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl border-emerald-200 text-emerald-800 hover:bg-emerald-100/50 text-xs font-semibold"
              >
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-gray-700"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@clinic.com"
                required
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/10 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
