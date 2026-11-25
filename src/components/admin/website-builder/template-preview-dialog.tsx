"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTemplate } from "@/lib/website-builder/templates";
import { Monitor, Tablet, Smartphone, Check, X, Loader2 } from "lucide-react";

interface Props {
  templateId: string | null;
  onClose: () => void;
  onApply: (templateId: string) => void;
  clinic: unknown;
  clinicSlug: string;
}

export function TemplatePreviewDialog({
  templateId,
  onClose,
  onApply,
  clinicSlug,
}: Props) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const currentKey = `${templateId}-${device}`;
  const [loadingKey, setLoadingKey] = useState(currentKey);
  const [loading, setLoading] = useState(true);

  if (loadingKey !== currentKey) {
    setLoadingKey(currentKey);
    setLoading(true);
  }

  if (!templateId) return null;

  const template = getTemplate(templateId);
  if (!template) return null;

  const iframeSrc = `/clinic/${clinicSlug}?previewTemplate=${templateId}`;

  return (
    <Dialog open={!!templateId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[96vw] w-[1440px] h-[94vh] p-0 flex flex-col overflow-hidden bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
        {/* Top Control Bar */}
        <DialogHeader className="px-6 py-3.5 border-b border-slate-800 flex flex-row items-center justify-between space-y-0 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{template.preview}</div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                {template.name}
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Live Viewport
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-400">{template.description}</p>
            </div>
          </div>

          {/* Viewport Device Switcher */}
          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                device === "desktop"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("tablet")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                device === "tablet"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              Tablet (768px)
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                device === "mobile"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile (390px)
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                onApply(templateId);
                onClose();
              }}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply This Template
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg h-8 w-8 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Viewport Frame with Realistic Device Containers */}
        <div className="flex-1 bg-slate-950/90 overflow-hidden p-3 sm:p-5 flex justify-center items-center relative">
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-xl text-slate-200 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                Loading {device} preview...
              </div>
            </div>
          )}

          <div
            className={`transition-all duration-300 relative bg-white overflow-hidden shadow-2xl flex flex-col ${
              device === "desktop"
                ? "w-full h-full rounded-xl border border-slate-800"
                : device === "tablet"
                  ? "w-[768px] h-full rounded-2xl border-8 border-slate-800 ring-1 ring-white/10"
                  : "w-[390px] h-full rounded-[44px] border-[12px] border-slate-800 ring-1 ring-white/10"
            }`}
          >
            {/* Mobile Notch / Speaker Bar */}
            {device === "mobile" && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-20 pointer-events-none flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
                <div className="w-2 h-2 rounded-full bg-blue-900/60" />
              </div>
            )}

            {/* Embedded Live Iframe with True Viewport Resolution */}
            <iframe
              key={`${templateId}-${device}`}
              src={iframeSrc}
              title={`${template.name} Viewport Preview`}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setLoading(false)}
            />

            {/* Mobile Home Indicator */}
            {device === "mobile" && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-400/80 rounded-full z-20 pointer-events-none" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
