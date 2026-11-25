"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types & Tooth Metadata
// ============================================================================

export type ToothMorphology = "molar" | "premolar" | "canine" | "incisor";
export type ArchType = "upper" | "lower";

export interface ToothMeta {
  number: number;
  quadrant: 1 | 2 | 3 | 4;
  quadrantName: string;
  name: string;
  shortName: string;
  arch: ArchType;
  type: ToothMorphology;
}

const TOOTH_METADATA: Record<number, ToothMeta> = {
  // Upper Right (Q1)
  18: {
    number: 18,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right 3rd Molar",
    shortName: "3rd Molar",
    arch: "upper",
    type: "molar",
  },
  17: {
    number: 17,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right 2nd Molar",
    shortName: "2nd Molar",
    arch: "upper",
    type: "molar",
  },
  16: {
    number: 16,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right 1st Molar",
    shortName: "1st Molar",
    arch: "upper",
    type: "molar",
  },
  15: {
    number: 15,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right 2nd Premolar",
    shortName: "2nd Premolar",
    arch: "upper",
    type: "premolar",
  },
  14: {
    number: 14,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right 1st Premolar",
    shortName: "1st Premolar",
    arch: "upper",
    type: "premolar",
  },
  13: {
    number: 13,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Canine",
    shortName: "Canine",
    arch: "upper",
    type: "canine",
  },
  12: {
    number: 12,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Lateral Incisor",
    shortName: "Lateral",
    arch: "upper",
    type: "incisor",
  },
  11: {
    number: 11,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Central Incisor",
    shortName: "Central",
    arch: "upper",
    type: "incisor",
  },

  // Upper Left (Q2)
  21: {
    number: 21,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Central Incisor",
    shortName: "Central",
    arch: "upper",
    type: "incisor",
  },
  22: {
    number: 22,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Lateral Incisor",
    shortName: "Lateral",
    arch: "upper",
    type: "incisor",
  },
  23: {
    number: 23,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Canine",
    shortName: "Canine",
    arch: "upper",
    type: "canine",
  },
  24: {
    number: 24,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left 1st Premolar",
    shortName: "1st Premolar",
    arch: "upper",
    type: "premolar",
  },
  25: {
    number: 25,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left 2nd Premolar",
    shortName: "2nd Premolar",
    arch: "upper",
    type: "premolar",
  },
  26: {
    number: 26,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left 1st Molar",
    shortName: "1st Molar",
    arch: "upper",
    type: "molar",
  },
  27: {
    number: 27,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left 2nd Molar",
    shortName: "2nd Molar",
    arch: "upper",
    type: "molar",
  },
  28: {
    number: 28,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left 3rd Molar",
    shortName: "3rd Molar",
    arch: "upper",
    type: "molar",
  },

  // Lower Right (Q4)
  48: {
    number: 48,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right 3rd Molar",
    shortName: "3rd Molar",
    arch: "lower",
    type: "molar",
  },
  47: {
    number: 47,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right 2nd Molar",
    shortName: "2nd Molar",
    arch: "lower",
    type: "molar",
  },
  46: {
    number: 46,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right 1st Molar",
    shortName: "1st Molar",
    arch: "lower",
    type: "molar",
  },
  45: {
    number: 45,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right 2nd Premolar",
    shortName: "2nd Premolar",
    arch: "lower",
    type: "premolar",
  },
  44: {
    number: 44,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right 1st Premolar",
    shortName: "1st Premolar",
    arch: "lower",
    type: "premolar",
  },
  43: {
    number: 43,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Canine",
    shortName: "Canine",
    arch: "lower",
    type: "canine",
  },
  42: {
    number: 42,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Lateral Incisor",
    shortName: "Lateral",
    arch: "lower",
    type: "incisor",
  },
  41: {
    number: 41,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Central Incisor",
    shortName: "Central",
    arch: "lower",
    type: "incisor",
  },

  // Lower Left (Q3)
  31: {
    number: 31,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Central Incisor",
    shortName: "Central",
    arch: "lower",
    type: "incisor",
  },
  32: {
    number: 32,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Lateral Incisor",
    shortName: "Lateral",
    arch: "lower",
    type: "incisor",
  },
  33: {
    number: 33,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Canine",
    shortName: "Canine",
    arch: "lower",
    type: "canine",
  },
  34: {
    number: 34,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left 1st Premolar",
    shortName: "1st Premolar",
    arch: "lower",
    type: "premolar",
  },
  35: {
    number: 35,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left 2nd Premolar",
    shortName: "2nd Premolar",
    arch: "lower",
    type: "premolar",
  },
  36: {
    number: 36,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left 1st Molar",
    shortName: "1st Molar",
    arch: "lower",
    type: "molar",
  },
  37: {
    number: 37,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left 2nd Molar",
    shortName: "2nd Molar",
    arch: "lower",
    type: "molar",
  },
  38: {
    number: 38,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left 3rd Molar",
    shortName: "3rd Molar",
    arch: "lower",
    type: "molar",
  },
};

const UPPER_Q1 = [18, 17, 16, 15, 14, 13, 12, 11] as const;
const UPPER_Q2 = [21, 22, 23, 24, 25, 26, 27, 28] as const;
const LOWER_Q4 = [48, 47, 46, 45, 44, 43, 42, 41] as const;
const LOWER_Q3 = [31, 32, 33, 34, 35, 36, 37, 38] as const;

export const CLINICAL_SURFACES = [
  { key: "Mesial", label: "Mesial (M)", short: "M" },
  { key: "Occlusal", label: "Occlusal / Incisal (O/I)", short: "O" },
  { key: "Distal", label: "Distal (D)", short: "D" },
  { key: "Buccal", label: "Buccal / Facial (B)", short: "B" },
  { key: "Lingual", label: "Lingual / Palatal (L)", short: "L" },
] as const;

interface OdontogramProps {
  selectedTeeth?: number[];
  selectedSurfaces?: Record<number, string[]>;
  onChange?: (teeth: number[], surfaces: Record<number, string[]>) => void;
  readOnly?: boolean;
  hasToothSurface?: boolean;
}

// ============================================================================
// Anatomical Root & Crown SVG (Consistent with Smart Chart)
// ============================================================================

function AnatomicalRootCrownSvg({
  type,
  arch,
  isSelected,
}: {
  type: ToothMorphology;
  arch: ArchType;
  isSelected: boolean;
}) {
  const isUpper = arch === "upper";
  const rootStroke = isSelected ? "#0393b8" : "#94a3b8";
  const crownStroke = isSelected ? "#0393b8" : "#64748b";
  const crownFill = isSelected ? "#ecfeff" : "#ffffff";
  const rootFill = isSelected ? "#f0fdfa" : "#f8fafc";

  return (
    <svg viewBox="0 0 70 96" className="w-full h-full">
      {/* ─── Biological Roots ─── */}
      <g>
        {isUpper ? (
          type === "molar" ? (
            <>
              <path
                d="M 18 56 C 16 38, 12 24, 18 10 C 22 10, 27 22, 30 56 Z"
                fill={rootFill}
                stroke={rootStroke}
                strokeWidth="1.5"
              />
              <path
                d="M 40 56 C 43 22, 48 10, 52 10 C 58 24, 54 38, 52 56 Z"
                fill={rootFill}
                stroke={rootStroke}
                strokeWidth="1.5"
              />
              <path
                d="M 28 56 C 31 34, 33 16, 35 6 C 37 16, 39 34, 42 56 Z"
                fill={rootFill}
                stroke={rootStroke}
                strokeWidth="1.5"
              />
            </>
          ) : type === "premolar" ? (
            <path
              d="M 22 56 C 20 36, 24 20, 29 10 C 33 22, 34 38, 35 56 C 36 38, 37 22, 41 10 C 46 20, 50 36, 48 56 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.5"
            />
          ) : type === "canine" ? (
            <path
              d="M 22 56 C 24 38, 30 18, 35 6 C 40 18, 46 38, 48 56 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.5"
            />
          ) : (
            <path
              d="M 24 56 C 26 38, 31 20, 35 8 C 39 20, 44 38, 46 56 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.5"
            />
          )
        ) : type === "molar" ? (
          <>
            <path
              d="M 18 40 C 16 58, 14 74, 20 88 C 24 88, 28 74, 30 40 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.5"
            />
            <path
              d="M 40 40 C 42 74, 46 88, 50 88 C 56 74, 54 58, 52 40 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.5"
            />
          </>
        ) : type === "premolar" ? (
          <path
            d="M 24 40 C 25 58, 30 76, 35 88 C 40 76, 45 58, 46 40 Z"
            fill={rootFill}
            stroke={rootStroke}
            strokeWidth="1.5"
          />
        ) : type === "canine" ? (
          <path
            d="M 23 40 C 24 58, 30 78, 35 90 C 40 78, 46 58, 47 40 Z"
            fill={rootFill}
            stroke={rootStroke}
            strokeWidth="1.5"
          />
        ) : (
          <path
            d="M 26 40 C 27 58, 31 76, 35 88 C 39 76, 43 58, 44 40 Z"
            fill={rootFill}
            stroke={rootStroke}
            strokeWidth="1.5"
          />
        )}
      </g>

      {/* ─── Anatomical Crown ─── */}
      <g>
        {isUpper ? (
          type === "molar" ? (
            <>
              <path
                d="M 14 56 C 14 68, 12 84, 18 90 C 24 93, 30 89, 35 91 C 40 89, 46 93, 52 90 C 58 84, 56 68, 56 56 Z"
                fill={crownFill}
                stroke={crownStroke}
                strokeWidth="2"
              />
              <path
                d="M 22 84 Q 35 80 48 84"
                stroke={crownStroke}
                strokeWidth="1"
                fill="none"
                opacity="0.6"
              />
            </>
          ) : type === "premolar" ? (
            <path
              d="M 18 56 C 17 70, 22 87, 28 90 C 35 92, 42 90, 48 87 C 53 70, 52 56, 52 56 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
            />
          ) : type === "canine" ? (
            <path
              d="M 19 56 C 18 70, 24 85, 35 92 C 46 85, 52 70, 51 56 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
            />
          ) : (
            <path
              d="M 18 56 C 18 70, 20 86, 21 89 C 23 90, 47 90, 49 89 C 50 86, 52 70, 52 56 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
            />
          )
        ) : type === "molar" ? (
          <>
            <path
              d="M 14 40 C 14 28, 12 12, 18 6 C 24 3, 30 7, 35 5 C 40 7, 46 3, 52 6 C 58 12, 56 28, 56 40 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
            />
            <path
              d="M 22 12 Q 35 16 48 12"
              stroke={crownStroke}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
          </>
        ) : type === "premolar" ? (
          <path
            d="M 18 40 C 17 26, 22 9, 28 6 C 35 4, 42 6, 48 9 C 53 26, 52 40, 52 40 Z"
            fill={crownFill}
            stroke={crownStroke}
            strokeWidth="2"
          />
        ) : type === "canine" ? (
          <path
            d="M 19 40 C 18 26, 24 11, 35 4 C 46 11, 52 26, 51 40 Z"
            fill={crownFill}
            stroke={crownStroke}
            strokeWidth="2"
          />
        ) : (
          <path
            d="M 20 40 C 20 26, 22 10, 23 7 C 25 6, 45 6, 47 7 C 48 10, 50 26, 50 40 Z"
            fill={crownFill}
            stroke={crownStroke}
            strokeWidth="2"
          />
        )}
      </g>
    </svg>
  );
}

// ============================================================================
// 5-Surface Facet Diagram SVG (Consistent with Smart Chart)
// ============================================================================

function FacetSurfaceSvg({
  surfaces = [],
  isSelected,
}: {
  surfaces?: string[];
  isSelected: boolean;
}) {
  const norm = useMemo(
    () => (surfaces || []).map((s) => s.toLowerCase()),
    [surfaces],
  );

  const hasM = norm.some((s) => s.includes("mesial"));
  const hasD = norm.some((s) => s.includes("distal"));
  const hasO = norm.some(
    (s) => s.includes("occlusal") || s.includes("incisal"),
  );
  const hasB = norm.some((s) => s.includes("buccal") || s.includes("facial"));
  const hasL = norm.some((s) => s.includes("lingual") || s.includes("palatal"));

  const surfaceActiveColor = "#0393b8"; // signature cyan

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="14"
        className={cn(
          "stroke-[3]",
          isSelected
            ? "stroke-primary fill-white"
            : "stroke-slate-300 fill-slate-50/50",
        )}
      />
      {/* Buccal (Top) */}
      <polygon
        points="14,14 86,14 70,30 30,30"
        fill={hasB ? surfaceActiveColor : "#f8fafc"}
        className="stroke-slate-300 stroke-[1.5]"
      />
      {/* Lingual (Bottom) */}
      <polygon
        points="30,70 70,70 86,86 14,86"
        fill={hasL ? surfaceActiveColor : "#f8fafc"}
        className="stroke-slate-300 stroke-[1.5]"
      />
      {/* Mesial (Left) */}
      <polygon
        points="14,14 30,30 30,70 14,86"
        fill={hasM ? surfaceActiveColor : "#f1f5f9"}
        className="stroke-slate-300 stroke-[1.5]"
      />
      {/* Distal (Right) */}
      <polygon
        points="86,14 86,86 70,70 70,30"
        fill={hasD ? surfaceActiveColor : "#f1f5f9"}
        className="stroke-slate-300 stroke-[1.5]"
      />
      {/* Occlusal / Incisal (Center) */}
      <rect
        x="30"
        y="30"
        width="40"
        height="40"
        rx="6"
        fill={hasO ? surfaceActiveColor : "#ffffff"}
        className="stroke-slate-400 stroke-[1.5]"
      />
    </svg>
  );
}

// ============================================================================
// Main Odontogram Component (Exported for Treatment & Procedure Dialogs)
// ============================================================================

export function Odontogram({
  selectedTeeth,
  selectedSurfaces,
  onChange,
  readOnly = false,
  hasToothSurface = true,
}: OdontogramProps) {
  const [internalTeeth, setInternalTeeth] = useState<number[]>([]);
  const [internalSurfaces, setInternalSurfaces] = useState<
    Record<number, string[]>
  >({});

  const teeth = selectedTeeth !== undefined ? selectedTeeth : internalTeeth;
  const surfaces =
    selectedSurfaces !== undefined ? selectedSurfaces : internalSurfaces;

  const [activeTooth, setActiveTooth] = useState<number | null>(null);

  const effectiveActiveTooth =
    activeTooth && teeth.includes(activeTooth)
      ? activeTooth
      : teeth.length > 0
        ? teeth[teeth.length - 1]
        : null;

  function toggleTooth(n: number) {
    if (readOnly) return;
    const isSelected = teeth.includes(n);
    const nextTeeth = isSelected ? teeth.filter((t) => t !== n) : [...teeth, n];
    const nextSurfaces = { ...surfaces };

    if (isSelected) {
      delete nextSurfaces[n];
      if (effectiveActiveTooth === n) {
        const remaining = nextTeeth;
        setActiveTooth(
          remaining.length > 0 ? remaining[remaining.length - 1] : null,
        );
      }
    } else {
      setActiveTooth(n);
    }

    if (selectedTeeth === undefined) {
      setInternalTeeth(nextTeeth);
    }
    if (selectedSurfaces === undefined) {
      setInternalSurfaces(nextSurfaces);
    }
    onChange?.(nextTeeth, nextSurfaces);
  }

  function toggleSurface(tooth: number, surfaceKey: string) {
    if (readOnly) return;
    const currentList = surfaces[tooth] || [];
    const nextList = currentList.includes(surfaceKey)
      ? currentList.filter((s) => s !== surfaceKey)
      : [...currentList, surfaceKey];

    const nextSurfaces = { ...surfaces, [tooth]: nextList };
    if (selectedSurfaces === undefined) {
      setInternalSurfaces(nextSurfaces);
    }
    onChange?.(teeth, nextSurfaces);
  }

  function handleSelectAllSurfaces(tooth: number) {
    if (readOnly) return;
    const all = CLINICAL_SURFACES.map((s) => s.key);
    const nextSurfaces = { ...surfaces, [tooth]: all };
    if (selectedSurfaces === undefined) {
      setInternalSurfaces(nextSurfaces);
    }
    onChange?.(teeth, nextSurfaces);
  }

  function handleClearSurfaces(tooth: number) {
    if (readOnly) return;
    const nextSurfaces = { ...surfaces, [tooth]: [] };
    if (selectedSurfaces === undefined) {
      setInternalSurfaces(nextSurfaces);
    }
    onChange?.(teeth, nextSurfaces);
  }

  const activeToothMeta = effectiveActiveTooth
    ? TOOTH_METADATA[effectiveActiveTooth]
    : null;

  return (
    <div className="space-y-4">
      {/* ─── Dental Chart Container (Upper & Lower Arch) ────────────────── */}
      <div className="border border-slate-200/90 rounded-2xl p-3 sm:p-4 bg-slate-50/50 space-y-4 shadow-2xs">
        {/* UPPER ARCH (MAXILLARY) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Patient&apos;s Right (Q1)</span>
            <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              MAXILLARY (UPPER ARCH)
            </span>
            <span>Patient&apos;s Left (Q2)</span>
          </div>

          <div className="relative p-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            {/* Midline Divider */}
            <div className="absolute left-1/2 top-1 bottom-1 w-px border-l border-slate-300 border-dashed z-10 pointer-events-none" />

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Quadrant 1 (18-11) */}
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1">
                {UPPER_Q1.map((num) => {
                  const meta = TOOTH_METADATA[num];
                  const isSelected = teeth.includes(num);
                  const isActive = effectiveActiveTooth === num;
                  const toothSurfaces = surfaces[num] || [];

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleTooth(num)}
                      className={cn(
                        "group flex flex-col items-center justify-between p-1 rounded-lg border transition-all duration-150 select-none",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40 -translate-y-0.5"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        isActive && "ring-2 ring-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold px-1 rounded",
                          isSelected
                            ? "bg-primary text-white"
                            : "text-slate-600",
                        )}
                      >
                        {num}
                      </span>

                      {/* Anatomical Graphic */}
                      <div className="w-5 h-7 sm:w-6 sm:h-8 my-0.5">
                        <AnatomicalRootCrownSvg
                          type={meta.type}
                          arch={meta.arch}
                          isSelected={isSelected}
                        />
                      </div>

                      {/* 5-Surface Facet */}
                      <div className="w-4 h-4 sm:w-5 sm:h-5">
                        <FacetSurfaceSvg
                          surfaces={toothSurfaces}
                          isSelected={isSelected}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quadrant 2 (21-28) */}
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1">
                {UPPER_Q2.map((num) => {
                  const meta = TOOTH_METADATA[num];
                  const isSelected = teeth.includes(num);
                  const isActive = effectiveActiveTooth === num;
                  const toothSurfaces = surfaces[num] || [];

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleTooth(num)}
                      className={cn(
                        "group flex flex-col items-center justify-between p-1 rounded-lg border transition-all duration-150 select-none",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40 -translate-y-0.5"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        isActive && "ring-2 ring-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold px-1 rounded",
                          isSelected
                            ? "bg-primary text-white"
                            : "text-slate-600",
                        )}
                      >
                        {num}
                      </span>

                      <div className="w-5 h-7 sm:w-6 sm:h-8 my-0.5">
                        <AnatomicalRootCrownSvg
                          type={meta.type}
                          arch={meta.arch}
                          isSelected={isSelected}
                        />
                      </div>

                      <div className="w-4 h-4 sm:w-5 sm:h-5">
                        <FacetSurfaceSvg
                          surfaces={toothSurfaces}
                          isSelected={isSelected}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* OCCLUSAL PLANE DIVIDER */}
        <div className="relative py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 border-dashed" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-100 text-slate-500 font-bold uppercase tracking-widest text-[8.5px] px-2.5 py-0.2 rounded-full border border-slate-200">
              Occlusal Plane
            </span>
          </div>
        </div>

        {/* LOWER ARCH (MANDIBULAR) */}
        <div className="space-y-1.5">
          <div className="relative p-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            {/* Midline Divider */}
            <div className="absolute left-1/2 top-1 bottom-1 w-px border-l border-slate-300 border-dashed z-10 pointer-events-none" />

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Quadrant 4 (48-41) */}
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1">
                {LOWER_Q4.map((num) => {
                  const meta = TOOTH_METADATA[num];
                  const isSelected = teeth.includes(num);
                  const isActive = effectiveActiveTooth === num;
                  const toothSurfaces = surfaces[num] || [];

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleTooth(num)}
                      className={cn(
                        "group flex flex-col items-center justify-between p-1 rounded-lg border transition-all duration-150 select-none",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40 -translate-y-0.5"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        isActive && "ring-2 ring-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold px-1 rounded",
                          isSelected
                            ? "bg-primary text-white"
                            : "text-slate-600",
                        )}
                      >
                        {num}
                      </span>

                      <div className="w-4 h-4 sm:w-5 sm:h-5 my-0.5">
                        <FacetSurfaceSvg
                          surfaces={toothSurfaces}
                          isSelected={isSelected}
                        />
                      </div>

                      <div className="w-5 h-7 sm:w-6 sm:h-8">
                        <AnatomicalRootCrownSvg
                          type={meta.type}
                          arch={meta.arch}
                          isSelected={isSelected}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quadrant 3 (31-38) */}
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1">
                {LOWER_Q3.map((num) => {
                  const meta = TOOTH_METADATA[num];
                  const isSelected = teeth.includes(num);
                  const isActive = effectiveActiveTooth === num;
                  const toothSurfaces = surfaces[num] || [];

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleTooth(num)}
                      className={cn(
                        "group flex flex-col items-center justify-between p-1 rounded-lg border transition-all duration-150 select-none",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40 -translate-y-0.5"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        isActive && "ring-2 ring-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold px-1 rounded",
                          isSelected
                            ? "bg-primary text-white"
                            : "text-slate-600",
                        )}
                      >
                        {num}
                      </span>

                      <div className="w-4 h-4 sm:w-5 sm:h-5 my-0.5">
                        <FacetSurfaceSvg
                          surfaces={toothSurfaces}
                          isSelected={isSelected}
                        />
                      </div>

                      <div className="w-5 h-7 sm:w-6 sm:h-8">
                        <AnatomicalRootCrownSvg
                          type={meta.type}
                          arch={meta.arch}
                          isSelected={isSelected}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Patient&apos;s Right (Q4)</span>
            <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              MANDIBULAR (LOWER ARCH)
            </span>
            <span>Patient&apos;s Left (Q3)</span>
          </div>
        </div>
      </div>

      {/* ─── Selected Teeth Summary & Surface Selector ──────────────────── */}
      {teeth.length > 0 && !readOnly && (
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-2xs">
          {/* Header Summary */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700">
                Selected Teeth:
              </span>
              {teeth
                .slice()
                .sort((a, b) => a - b)
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTooth(t)}
                    className={cn(
                      "text-xs font-mono font-bold px-2 py-0.5 rounded-md border transition-all",
                      effectiveActiveTooth === t
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300",
                    )}
                  >
                    #{t}
                    {surfaces[t]?.length ? ` (${surfaces[t].length})` : ""}
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedTeeth === undefined) {
                  setInternalTeeth([]);
                }
                if (selectedSurfaces === undefined) {
                  setInternalSurfaces({});
                }
                setActiveTooth(null);
                onChange?.([], {});
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Clear All Teeth
            </button>
          </div>

          {/* Surface Selector for Active Tooth */}
          {hasToothSurface && effectiveActiveTooth && (
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-semibold text-slate-800">
                  Surfaces for Tooth #{effectiveActiveTooth}{" "}
                  <span className="text-slate-500 font-normal">
                    ({activeToothMeta?.shortName})
                  </span>
                  :
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectAllSurfaces(effectiveActiveTooth)
                    }
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">&bull;</span>
                  <button
                    type="button"
                    onClick={() => handleClearSurfaces(effectiveActiveTooth)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    Clear Surfaces
                  </button>
                </div>
              </div>

              {/* Surface Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {CLINICAL_SURFACES.map((surf) => {
                  const isChecked = (
                    surfaces[effectiveActiveTooth] || []
                  ).includes(surf.key);

                  return (
                    <button
                      key={surf.key}
                      type="button"
                      onClick={() =>
                        toggleSurface(effectiveActiveTooth, surf.key)
                      }
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1.5",
                        isChecked
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isChecked ? "bg-white" : "bg-slate-300",
                        )}
                      />
                      {surf.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Read Only Summary */}
      {readOnly && teeth.length > 0 && (
        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <p className="font-semibold text-slate-800">
            Teeth Involved:{" "}
            {teeth
              .sort((a, b) => a - b)
              .map((t) => `#${t}`)
              .join(", ")}
          </p>
          {Object.entries(surfaces)
            .filter(([, s]) => s.length > 0)
            .map(([tooth, sList]) => (
              <p key={tooth} className="text-slate-500 font-mono">
                #{tooth}: {sList.join(", ")}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
