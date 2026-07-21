"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerClinicForUser, logoutGlobal } from "@/app/actions/auth";
import { toast } from "sonner";
import { Building, Loader2, ArrowRight, Check, LogOut } from "lucide-react";

interface Props {
  name: string;
  plan: string;
}

export default function ClinicNewClient({ name, plan }: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(plan);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("plan", selectedPlan);

    const result = await registerClinicForUser(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/50 relative font-sans">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-indigo-500/10 to-indigo-600/5 blur-[100px] animate-pulse duration-5000" />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 blur-[100px] animate-pulse duration-7000" />
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5 font-bold text-xl text-slate-900 select-none">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4.5 w-4.5"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M12 2C9.5 2 8 4 8 6c0 1.5.5 2.5 1 3.5C8 11 7 13 7 15c0 3 2 5 5 5s5-2 5-5c0-2-1-4-2-5.5.5-1 1-2 1-3.5C16 4 14.5 2 12 2z" />
          </svg>
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-bold tracking-tight">
          Dently
        </span>
      </div>

      {/* Sign Out Button in Header */}
      <div className="absolute top-8 right-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logoutGlobal()}
          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 gap-1.5 font-semibold text-xs rounded-xl transition-all duration-200"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8 p-8 sm:p-10 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-slate-200/40 relative z-10">
        <div className="space-y-2.5 text-center">
          <span className="text-[10px] text-primary uppercase font-bold tracking-widest font-mono bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            Step 2 of 2
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            Register your clinic
          </h1>
          <p className="text-sm text-slate-500">
            Welcome,{" "}
            <span className="font-semibold text-slate-800">{name}</span>!
            Let&apos;s set up your clinic workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="clinicName"
              className="text-xs font-semibold text-slate-700"
            >
              Clinic Name
            </Label>
            <div className="relative">
              <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="clinicName"
                name="clinicName"
                placeholder="Luna Dental Care"
                required
                className="pl-10 h-11 border-slate-200/80 bg-white/50 backdrop-blur-sm focus-visible:ring-primary focus-visible:border-primary rounded-xl transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              This will generate your clinic&apos;s workspace URL slug.
            </p>
          </div>

          {/* Plan Selector */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-700">
              Subscription Plan
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan("Starter")}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  selectedPlan === "Starter"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/50 shadow-sm"
                    : "border-slate-200/80 hover:border-slate-300 bg-white/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    Starter
                  </span>
                  {selectedPlan === "Starter" && (
                    <div className="h-4.5 w-4.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary stroke-[3.5]" />
                    </div>
                  )}
                </div>
                <p className="text-[12px] font-bold text-slate-900 mt-1">
                  ₱999
                  <span className="text-[9px] text-slate-400 font-normal">
                    /mo
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  1 Dentist Account
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("Clinic")}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden ${
                  selectedPlan === "Clinic"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/50 shadow-sm"
                    : "border-slate-200/80 hover:border-slate-300 bg-white/50"
                }`}
              >
                {/* Popular Badge */}
                <div className="absolute -top-3.5 -right-3.5 w-8 h-8 bg-emerald-500 rotate-45 pointer-events-none opacity-20" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                    Clinic
                  </span>
                  {selectedPlan === "Clinic" && (
                    <div className="h-4.5 w-4.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary stroke-[3.5]" />
                    </div>
                  )}
                </div>
                <p className="text-[12px] font-bold text-slate-900 mt-1">
                  ₱2,499
                  <span className="text-[9px] text-slate-400 font-normal">
                    /mo
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Up to 5 Dentists
                </p>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/15 transition-all hover:opacity-95 active:scale-[0.98] flex items-center justify-center gap-2 mt-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating clinic...
              </>
            ) : (
              <>
                Create Clinic Workspace <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Wrong account?{" "}
          <button
            type="button"
            onClick={() => logoutGlobal()}
            className="text-primary hover:text-indigo-600 hover:underline font-bold transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
