"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AdminPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Clinic Admin Portal Error:", error);
  }, [error]);

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            Workspace Unavailable
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            We encountered an unexpected error loading this workspace section.
            Your clinical data remains secure.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => reset()}
            variant="default"
            className="gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Action
          </Button>
        </div>
      </div>
    </div>
  );
}
