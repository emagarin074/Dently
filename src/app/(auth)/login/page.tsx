"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginGlobal } from "@/app/actions/auth";
import { toast } from "sonner";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await loginGlobal(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your dental workspace
        </p>
      </div>

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

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-gray-700"
            >
              Password
            </Label>
            <Link
              href="#"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
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
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="pt-2 text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link
          href="/register"
          className="text-primary hover:underline font-bold"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
