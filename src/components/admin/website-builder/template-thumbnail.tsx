"use client";

import React from "react";
import { Sparkles, Shield, Leaf, Flame, Star } from "lucide-react";

interface Props {
  templateId: string;
}

export function TemplateThumbnail({ templateId }: Props) {
  if (templateId === "classic") {
    return (
      <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-amber-200/80 bg-[#fdfbf7] flex flex-col shadow-xs group-hover:shadow-md transition-all relative">
        {/* Top Browser Bar */}
        <div className="bg-[#f2ece1] px-2.5 py-1.5 border-b border-amber-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="bg-white/80 rounded px-2 py-0.5 text-[9px] text-slate-500 font-mono">
            classic.dently.site
          </div>
          <div className="w-3" />
        </div>

        {/* Mini Content */}
        <div className="p-3.5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#faf7f2] to-[#f4ede2]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-950 text-amber-300 flex items-center justify-center text-[8px]">
                <Shield className="w-2.5 h-2.5 text-amber-400" />
              </div>
              <div className="h-2 w-16 bg-blue-950/80 rounded-xs" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-8 bg-slate-400/60 rounded-xs" />
              <div className="h-1.5 w-8 bg-slate-400/60 rounded-xs" />
              <div className="h-3.5 px-2 bg-blue-950 rounded text-[7px] text-amber-200 font-serif flex items-center">
                Consult
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="grid grid-cols-12 gap-2.5 items-center my-auto">
            <div className="col-span-7 space-y-1.5">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100/80 border border-amber-300/80 text-[7px] text-amber-900 font-serif font-semibold">
                <Star className="w-2 h-2 fill-amber-500 text-amber-600" />
                Est. 2005 • Heritage Care
              </div>
              <div className="space-y-0.5">
                <div className="h-2.5 w-full bg-blue-950 rounded-xs" />
                <div className="h-2.5 w-4/5 bg-amber-800 rounded-xs" />
              </div>
              <div className="h-1.5 w-full bg-slate-400/50 rounded-xs" />
              <div className="flex items-center gap-1 pt-1">
                <div className="h-3.5 px-2 bg-blue-950 rounded text-[7px] text-white font-medium flex items-center">
                  Book Visit
                </div>
                <div className="h-3.5 px-1.5 border border-slate-300 rounded text-[7px] text-slate-700 flex items-center">
                  Services
                </div>
              </div>
            </div>

            <div className="col-span-5 relative">
              <div className="aspect-[4/5] rounded-lg bg-gradient-to-tr from-amber-100 via-blue-900/20 to-blue-950/30 border-2 border-white shadow-sm flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-700/60" />
              </div>
            </div>
          </div>

          {/* Bottom Palette Badges */}
          <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/50 text-[8px] text-slate-600 font-serif">
            <span className="font-semibold text-blue-950">
              Classic Heritage
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] border border-white shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#b45309] border border-white shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#faf8f5] border border-slate-300 shadow-2xs" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "minimal") {
    return (
      <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-stone-200 bg-[#fafaf9] flex flex-col shadow-xs group-hover:shadow-md transition-all relative">
        {/* Top Browser Bar */}
        <div className="bg-[#f5f5f4] px-2.5 py-1.5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="bg-white rounded px-2 py-0.5 text-[9px] text-stone-500 font-mono">
            minimal.dently.site
          </div>
          <div className="w-3" />
        </div>

        {/* Mini Content */}
        <div className="p-3.5 flex-1 flex flex-col justify-between bg-[#fafaf9]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[8px]">
                <Leaf className="w-2.5 h-2.5 text-emerald-600" />
              </div>
              <div className="h-2 w-14 bg-stone-900 rounded-xs" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-6 bg-stone-300 rounded-xs" />
              <div className="h-1.5 w-6 bg-stone-300 rounded-xs" />
              <div className="h-3 px-2 bg-stone-900 text-white rounded-full text-[7px] uppercase tracking-wider flex items-center">
                Visit
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="grid grid-cols-12 gap-2.5 items-center my-auto">
            <div className="col-span-7 space-y-1.5">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[7px] text-emerald-800">
                <Leaf className="w-2 h-2 text-emerald-600" />
                Mindful Wellness
              </div>
              <div className="space-y-0.5">
                <div className="h-2.5 w-full bg-stone-900 rounded-xs font-light" />
                <div className="h-2.5 w-3/4 bg-emerald-800 rounded-xs" />
              </div>
              <div className="h-1.5 w-full bg-stone-300/80 rounded-xs" />
              <div className="pt-1">
                <div className="h-3.5 px-2 bg-emerald-700 rounded-full text-[7px] text-white font-medium inline-flex items-center">
                  Reserve Visit
                </div>
              </div>
            </div>

            <div className="col-span-5 relative">
              <div className="aspect-[3/4] rounded-xl bg-stone-200/80 border border-stone-200 shadow-2xs flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-700/50" />
              </div>
            </div>
          </div>

          {/* Bottom Palette Badges */}
          <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/70 text-[8px] text-stone-600">
            <span className="font-medium text-stone-900">Boutique Zen</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] border border-white shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#fafaf9] border border-stone-300 shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#18181b] border border-white shadow-2xs" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "bold") {
    return (
      <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-zinc-800 bg-[#09090b] flex flex-col shadow-xs group-hover:shadow-md transition-all relative">
        {/* Top Browser Bar */}
        <div className="bg-[#121216] px-2.5 py-1.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="bg-black/80 rounded px-2 py-0.5 text-[9px] text-zinc-400 font-mono">
            bold.dently.site
          </div>
          <div className="w-3" />
        </div>

        {/* Mini Content */}
        <div className="p-3.5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#09090b] via-[#121218] to-[#09090b] text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center text-[8px]">
                <Flame className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="h-2 w-14 bg-white rounded-xs font-black" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-6 bg-zinc-600 rounded-xs" />
              <div className="h-1.5 w-6 bg-zinc-600 rounded-xs" />
              <div className="h-3 px-2 bg-gradient-to-r from-rose-600 to-orange-500 text-white rounded text-[7px] font-black tracking-wider flex items-center">
                BOOK
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="grid grid-cols-12 gap-2.5 items-center my-auto">
            <div className="col-span-7 space-y-1.5">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-[7px] text-rose-400 font-bold uppercase">
                <Flame className="w-2 h-2 text-orange-400" />
                Next-Gen Studio
              </div>
              <div className="space-y-0.5">
                <div className="h-2.5 w-full bg-white rounded-xs font-black" />
                <div className="h-2.5 w-4/5 bg-gradient-to-r from-rose-500 to-orange-400 rounded-xs" />
              </div>
              <div className="h-1.5 w-full bg-zinc-600 rounded-xs" />
              <div className="pt-1">
                <div className="h-3.5 px-2.5 bg-gradient-to-r from-rose-600 to-orange-500 rounded text-[7px] text-white font-black uppercase flex items-center">
                  TRANSFORM
                </div>
              </div>
            </div>

            <div className="col-span-5 relative">
              <div className="aspect-[4/5] rounded-xl bg-zinc-900 border border-white/20 shadow-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/30 via-orange-500/10 to-transparent" />
                <Sparkles className="w-6 h-6 text-rose-400" />
              </div>
            </div>
          </div>

          {/* Bottom Palette Badges */}
          <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[8px] text-zinc-400">
            <span className="font-bold text-white">High-Impact Bold</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] border border-white/20 shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] border border-white/20 shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#09090b] border border-zinc-700 shadow-2xs" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modern Template (default)
  return (
    <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-white flex flex-col shadow-xs group-hover:shadow-md transition-all relative">
      {/* Top Browser Bar */}
      <div className="bg-slate-100 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="bg-white rounded px-2 py-0.5 text-[9px] text-slate-500 font-mono">
          modern.dently.site
        </div>
        <div className="w-3" />
      </div>

      {/* Mini Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[8px]">
              <Sparkles className="w-2.5 h-2.5 text-blue-600" />
            </div>
            <div className="h-2 w-14 bg-slate-900 rounded-xs font-bold" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-6 bg-slate-300 rounded-xs" />
            <div className="h-1.5 w-6 bg-slate-300 rounded-xs" />
            <div className="h-3 px-2 bg-blue-50 text-blue-600 rounded-full text-[7px] font-semibold flex items-center">
              Book
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-12 gap-2.5 items-center my-auto">
          <div className="col-span-7 space-y-1.5">
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[7px] text-blue-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              True 24/7 Care
            </div>
            <div className="space-y-0.5">
              <div className="h-2.5 w-full bg-slate-900 rounded-xs font-bold" />
              <div className="h-2.5 w-4/5 bg-blue-600 rounded-xs" />
            </div>
            <div className="h-1.5 w-full bg-slate-300/80 rounded-xs" />
            <div className="pt-1">
              <div className="h-3.5 px-2 bg-blue-500 rounded-full text-[7px] text-white font-medium inline-flex items-center">
                Book Appointment
              </div>
            </div>
          </div>

          <div className="col-span-5 relative">
            <div className="aspect-[4/5] rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-blue-100 to-slate-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-500/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Palette Badges */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[8px] text-slate-500">
          <span className="font-semibold text-slate-800">Clean & Modern</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0891b2] border border-white shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] border border-white shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-200 shadow-2xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
