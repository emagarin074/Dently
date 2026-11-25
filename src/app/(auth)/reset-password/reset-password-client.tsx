"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithToken } from "@/app/actions/password-reset";
import { toast } from "sonner";
import {
  Lock,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ResetPasswordClientProps {
  token: string;
  isValid: boolean;
  errorMessage?: string;
  email?: string;
}

export function ResetPasswordClient({
  token,
  isValid,
  errorMessage,
  email,
}: ResetPasswordClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isValid) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Link Expired
          </h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed">
            {errorMessage ||
              "Password reset links expire 1 hour after creation for security purposes. Please request a new link."}
          </div>
        </div>

        <div className="pt-2">
          <Link href="/forgot-password">
            <Button className="w-full h-11 rounded-xl font-semibold">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Password Updated
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account password has been reset successfully.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-5 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed font-medium">
            You can now sign in with your new password.
          </div>
        </div>

        <div className="pt-2">
          <Link href="/login">
            <Button className="w-full h-11 rounded-xl font-semibold">
              Proceed to Sign In <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    const result = await resetPasswordWithToken(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Password reset successfully!");
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create new password
        </h1>
        <p className="text-sm text-muted-foreground">
          {email
            ? `Resetting password for ${email}`
            : "Enter your new password below"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-xs font-semibold text-gray-700"
          >
            New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-xs font-semibold text-gray-700"
          >
            Confirm New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              required
              minLength={8}
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
              <Loader2 className="h-4 w-4 animate-spin" /> Saving password...
            </>
          ) : (
            "Save New Password"
          )}
        </Button>
      </form>
    </div>
  );
}
