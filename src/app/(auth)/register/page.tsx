"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/app/actions/auth";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";

function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Step 1 of 2: Set up your administrator credentials
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedPlan && (
          <input type="hidden" name="plan" value={selectedPlan} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="firstName"
              className="text-xs font-semibold text-gray-700"
            >
              First Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                name="firstName"
                placeholder="Maria"
                required
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="middleName"
              className="text-xs font-semibold text-gray-700"
            >
              Middle Name (Optional)
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="middleName"
                name="middleName"
                placeholder="Cruz"
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="lastName"
              className="text-xs font-semibold text-gray-700"
            >
              Last Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                name="lastName"
                placeholder="Santos"
                required
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="suffix"
              className="text-xs font-semibold text-gray-700"
            >
              Suffix (Optional)
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="suffix"
                name="suffix"
                placeholder="Jr., III, etc."
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
            </div>
          </div>
        </div>

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
              placeholder="admin@lunadental.com"
              required
              className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-gray-700"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                required
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-semibold text-gray-700"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                required
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="phoneNumber"
            className="text-xs font-semibold text-gray-700"
          >
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+63 917 123 4567"
              required
              className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="gender"
              className="text-xs font-semibold text-gray-700"
            >
              Gender
            </Label>
            <select
              id="gender"
              name="gender"
              required
              className="flex h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="dateOfBirth"
              className="text-xs font-semibold text-gray-700"
            >
              Birthdate
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                className="pl-10 h-11 border-slate-200/80 focus-visible:ring-primary focus-visible:border-primary rounded-xl text-gray-900"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/10 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing up...
            </>
          ) : (
            <>
              Sign Up <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="pt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-bold">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-muted-foreground py-8">
          Loading registration form...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
