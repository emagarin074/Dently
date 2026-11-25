"use client";

import { useState, useMemo, useTransition } from "react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { addPatientNote } from "@/app/actions/patients";
import {
  Activity,
  CheckCircle2,
  X,
  AlertTriangle,
  Layers,
  FileText,
  Calendar,
  User,
  Sparkles,
  Search,
  RotateCcw,
  Filter,
  Plus,
  Eye,
  Printer,
  Wand2,
  GitCommit,
  Check,
} from "lucide-react";

// ============================================================================
// Types & DTOs
// ============================================================================

export type TreatmentStage = "completed" | "planned" | "existing";
export type NumberingSystem = "fdi" | "universal" | "palmer";
export type ChartDisplayMode = "comprehensive" | "anatomical" | "occlusal";
export type ToothMorphology = "molar" | "premolar" | "canine" | "incisor";
export type ArchType = "upper" | "lower";

export interface ToothProcedureRecord {
  id: string;
  procedureName: string;
  category?: string | null;
  appointmentId: string;
  appointmentDate: string;
  appointmentStatus: string;
  dentistName?: string | null;
  surfaces: string[];
  findings?: string | null;
  diagnosis?: string | null;
  remarks?: string | null;
  price?: number | string | null;
  paymentStatus?: string | null;
  stage: TreatmentStage;
}

export interface PatientAppointmentData {
  id: string;
  preferredDate: string;
  status: string;
  dentist?: { name: string } | null;
  procedures: {
    id: string;
    price?: unknown;
    findings?: string | null;
    diagnosis?: string | null;
    remarks?: string | null;
    toothSelection?: unknown;
    surfaceSelection?: unknown;
    procedure: {
      name: string;
      category?: string | null;
    };
    dentist?: { name: string } | null;
  }[];
}

interface SmartOdontogramProps {
  patientId: string;
  clinicSlug: string;
  appointments: PatientAppointmentData[];
  patientNotes?: { id: string; content: string; createdAt: string }[];
  onSelectToothAction?: (toothNumber: number) => void;
}

export interface ToothMeta {
  number: number;
  quadrant: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  quadrantName: string;
  name: string;
  shortName: string;
  arch: ArchType;
  type: ToothMorphology;
  isPediatric?: boolean;
}

export interface PerioData {
  bop: boolean;
  mobility: 0 | 1 | 2 | 3;
  db: number; // Distobuccal (mm)
  b: number; // Mid-Buccal (mm)
  mb: number; // Mesiobuccal (mm)
  dl: number; // Distolingual (mm)
  l: number; // Mid-Lingual (mm)
  ml: number; // Mesiolingual (mm)
}

// ============================================================================
// Numbering Systems Mapper (FDI, Universal ADA, Palmer)
// ============================================================================

const FDI_TO_UNIVERSAL_ADULT: Record<number, string> = {
  18: "1",
  17: "2",
  16: "3",
  15: "4",
  14: "5",
  13: "6",
  12: "7",
  11: "8",
  21: "9",
  22: "10",
  23: "11",
  24: "12",
  25: "13",
  26: "14",
  27: "15",
  28: "16",
  38: "17",
  37: "18",
  36: "19",
  35: "20",
  34: "21",
  33: "22",
  32: "23",
  31: "24",
  41: "25",
  42: "26",
  43: "27",
  44: "28",
  45: "29",
  46: "30",
  47: "31",
  48: "32",
};

const FDI_TO_UNIVERSAL_PEDIATRIC: Record<number, string> = {
  55: "A",
  54: "B",
  53: "C",
  52: "D",
  51: "E",
  61: "F",
  62: "G",
  63: "H",
  64: "I",
  65: "J",
  75: "K",
  74: "L",
  73: "M",
  72: "N",
  71: "O",
  81: "P",
  82: "Q",
  83: "R",
  84: "S",
  85: "T",
};

export function formatToothNumber(
  fdiNumber: number,
  system: NumberingSystem,
  isPediatric = false,
): string {
  if (system === "fdi") return String(fdiNumber);

  if (system === "universal") {
    if (isPediatric) {
      return FDI_TO_UNIVERSAL_PEDIATRIC[fdiNumber] || String(fdiNumber);
    }
    return FDI_TO_UNIVERSAL_ADULT[fdiNumber] || String(fdiNumber);
  }

  // Palmer Notation
  const q = Math.floor(fdiNumber / 10);
  const pos = fdiNumber % 10;
  const posLetter = isPediatric
    ? ["", "A", "B", "C", "D", "E"][pos] || String(pos)
    : String(pos);

  switch (q) {
    case 1:
    case 5:
      return `${posLetter}┘`;
    case 2:
    case 6:
      return `└${posLetter}`;
    case 3:
    case 7:
      return `┌${posLetter}`;
    case 4:
    case 8:
      return `${posLetter}┐`;
    default:
      return String(fdiNumber);
  }
}

// ============================================================================
// FDI Dental Chart Metadata (Permanent 32 & Primary 20)
// ============================================================================

const PERMANENT_TEETH_META: Record<number, ToothMeta> = {
  // Upper Right (Quadrant 1)
  18: {
    number: 18,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Third Molar",
    shortName: "3rd Molar (Wisdom)",
    arch: "upper",
    type: "molar",
  },
  17: {
    number: 17,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Second Molar",
    shortName: "2nd Molar",
    arch: "upper",
    type: "molar",
  },
  16: {
    number: 16,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right First Molar",
    shortName: "1st Molar",
    arch: "upper",
    type: "molar",
  },
  15: {
    number: 15,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Second Premolar",
    shortName: "2nd Premolar",
    arch: "upper",
    type: "premolar",
  },
  14: {
    number: 14,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right First Premolar",
    shortName: "1st Premolar",
    arch: "upper",
    type: "premolar",
  },
  13: {
    number: 13,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Canine",
    shortName: "Canine (Cuspid)",
    arch: "upper",
    type: "canine",
  },
  12: {
    number: 12,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Lateral Incisor",
    shortName: "Lateral Incisor",
    arch: "upper",
    type: "incisor",
  },
  11: {
    number: 11,
    quadrant: 1,
    quadrantName: "Upper Right (Q1)",
    name: "Maxillary Right Central Incisor",
    shortName: "Central Incisor",
    arch: "upper",
    type: "incisor",
  },

  // Upper Left (Quadrant 2)
  21: {
    number: 21,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Central Incisor",
    shortName: "Central Incisor",
    arch: "upper",
    type: "incisor",
  },
  22: {
    number: 22,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Lateral Incisor",
    shortName: "Lateral Incisor",
    arch: "upper",
    type: "incisor",
  },
  23: {
    number: 23,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Canine",
    shortName: "Canine (Cuspid)",
    arch: "upper",
    type: "canine",
  },
  24: {
    number: 24,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left First Premolar",
    shortName: "1st Premolar",
    arch: "upper",
    type: "premolar",
  },
  25: {
    number: 25,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Second Premolar",
    shortName: "2nd Premolar",
    arch: "upper",
    type: "premolar",
  },
  26: {
    number: 26,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left First Molar",
    shortName: "1st Molar",
    arch: "upper",
    type: "molar",
  },
  27: {
    number: 27,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Second Molar",
    shortName: "2nd Molar",
    arch: "upper",
    type: "molar",
  },
  28: {
    number: 28,
    quadrant: 2,
    quadrantName: "Upper Left (Q2)",
    name: "Maxillary Left Third Molar",
    shortName: "3rd Molar (Wisdom)",
    arch: "upper",
    type: "molar",
  },

  // Lower Right (Quadrant 4)
  48: {
    number: 48,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Third Molar",
    shortName: "3rd Molar (Wisdom)",
    arch: "lower",
    type: "molar",
  },
  47: {
    number: 47,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Second Molar",
    shortName: "2nd Molar",
    arch: "lower",
    type: "molar",
  },
  46: {
    number: 46,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right First Molar",
    shortName: "1st Molar",
    arch: "lower",
    type: "molar",
  },
  45: {
    number: 45,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Second Premolar",
    shortName: "2nd Premolar",
    arch: "lower",
    type: "premolar",
  },
  44: {
    number: 44,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right First Premolar",
    shortName: "1st Premolar",
    arch: "lower",
    type: "premolar",
  },
  43: {
    number: 43,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Canine",
    shortName: "Canine (Cuspid)",
    arch: "lower",
    type: "canine",
  },
  42: {
    number: 42,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Lateral Incisor",
    shortName: "Lateral Incisor",
    arch: "lower",
    type: "incisor",
  },
  41: {
    number: 41,
    quadrant: 4,
    quadrantName: "Lower Right (Q4)",
    name: "Mandibular Right Central Incisor",
    shortName: "Central Incisor",
    arch: "lower",
    type: "incisor",
  },

  // Lower Left (Quadrant 3)
  31: {
    number: 31,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Central Incisor",
    shortName: "Central Incisor",
    arch: "lower",
    type: "incisor",
  },
  32: {
    number: 32,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Lateral Incisor",
    shortName: "Lateral Incisor",
    arch: "lower",
    type: "incisor",
  },
  33: {
    number: 33,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Canine",
    shortName: "Canine (Cuspid)",
    arch: "lower",
    type: "canine",
  },
  34: {
    number: 34,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left First Premolar",
    shortName: "1st Premolar",
    arch: "lower",
    type: "premolar",
  },
  35: {
    number: 35,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Second Premolar",
    shortName: "2nd Premolar",
    arch: "lower",
    type: "premolar",
  },
  36: {
    number: 36,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left First Molar",
    shortName: "1st Molar",
    arch: "lower",
    type: "molar",
  },
  37: {
    number: 37,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Second Molar",
    shortName: "2nd Molar",
    arch: "lower",
    type: "molar",
  },
  38: {
    number: 38,
    quadrant: 3,
    quadrantName: "Lower Left (Q3)",
    name: "Mandibular Left Third Molar",
    shortName: "3rd Molar (Wisdom)",
    arch: "lower",
    type: "molar",
  },
};

const PEDIATRIC_TEETH_META: Record<number, ToothMeta> = {
  // Upper Right (Quadrant 5)
  55: {
    number: 55,
    quadrant: 5,
    quadrantName: "Upper Right Primary (Q5)",
    name: "Primary Maxillary Right Second Molar",
    shortName: "2nd Primary Molar (A)",
    arch: "upper",
    type: "molar",
    isPediatric: true,
  },
  54: {
    number: 54,
    quadrant: 5,
    quadrantName: "Upper Right Primary (Q5)",
    name: "Primary Maxillary Right First Molar",
    shortName: "1st Primary Molar (B)",
    arch: "upper",
    type: "molar",
    isPediatric: true,
  },
  53: {
    number: 53,
    quadrant: 5,
    quadrantName: "Upper Right Primary (Q5)",
    name: "Primary Maxillary Right Canine",
    shortName: "Primary Canine (C)",
    arch: "upper",
    type: "canine",
    isPediatric: true,
  },
  52: {
    number: 52,
    quadrant: 5,
    quadrantName: "Upper Right Primary (Q5)",
    name: "Primary Maxillary Right Lateral Incisor",
    shortName: "Primary Lateral (D)",
    arch: "upper",
    type: "incisor",
    isPediatric: true,
  },
  51: {
    number: 51,
    quadrant: 5,
    quadrantName: "Upper Right Primary (Q5)",
    name: "Primary Maxillary Right Central Incisor",
    shortName: "Primary Central (E)",
    arch: "upper",
    type: "incisor",
    isPediatric: true,
  },

  // Upper Left (Quadrant 6)
  61: {
    number: 61,
    quadrant: 6,
    quadrantName: "Upper Left Primary (Q6)",
    name: "Primary Maxillary Left Central Incisor",
    shortName: "Primary Central (F)",
    arch: "upper",
    type: "incisor",
    isPediatric: true,
  },
  62: {
    number: 62,
    quadrant: 6,
    quadrantName: "Upper Left Primary (Q6)",
    name: "Primary Maxillary Left Lateral Incisor",
    shortName: "Primary Lateral (G)",
    arch: "upper",
    type: "incisor",
    isPediatric: true,
  },
  63: {
    number: 63,
    quadrant: 6,
    quadrantName: "Upper Left Primary (Q6)",
    name: "Primary Maxillary Left Canine",
    shortName: "Primary Canine (H)",
    arch: "upper",
    type: "canine",
    isPediatric: true,
  },
  64: {
    number: 64,
    quadrant: 6,
    quadrantName: "Upper Left Primary (Q6)",
    name: "Primary Maxillary Left First Molar",
    shortName: "1st Primary Molar (I)",
    arch: "upper",
    type: "molar",
    isPediatric: true,
  },
  65: {
    number: 65,
    quadrant: 6,
    quadrantName: "Upper Left Primary (Q6)",
    name: "Primary Maxillary Left Second Molar",
    shortName: "2nd Primary Molar (J)",
    arch: "upper",
    type: "molar",
    isPediatric: true,
  },

  // Lower Right (Quadrant 8)
  85: {
    number: 85,
    quadrant: 8,
    quadrantName: "Lower Right Primary (Q8)",
    name: "Primary Mandibular Right Second Molar",
    shortName: "2nd Primary Molar (T)",
    arch: "lower",
    type: "molar",
    isPediatric: true,
  },
  84: {
    number: 84,
    quadrant: 8,
    quadrantName: "Lower Right Primary (Q8)",
    name: "Primary Mandibular Right First Molar",
    shortName: "1st Primary Molar (S)",
    arch: "lower",
    type: "molar",
    isPediatric: true,
  },
  83: {
    number: 83,
    quadrant: 8,
    quadrantName: "Lower Right Primary (Q8)",
    name: "Primary Mandibular Right Canine",
    shortName: "Primary Canine (R)",
    arch: "lower",
    type: "canine",
    isPediatric: true,
  },
  82: {
    number: 82,
    quadrant: 8,
    quadrantName: "Lower Right Primary (Q8)",
    name: "Primary Mandibular Right Lateral Incisor",
    shortName: "Primary Lateral (Q)",
    arch: "lower",
    type: "incisor",
    isPediatric: true,
  },
  81: {
    number: 81,
    quadrant: 8,
    quadrantName: "Lower Right Primary (Q8)",
    name: "Primary Mandibular Right Central Incisor",
    shortName: "Primary Central (P)",
    arch: "lower",
    type: "incisor",
    isPediatric: true,
  },

  // Lower Left (Quadrant 7)
  71: {
    number: 71,
    quadrant: 7,
    quadrantName: "Lower Left Primary (Q7)",
    name: "Primary Mandibular Left Central Incisor",
    shortName: "Primary Central (O)",
    arch: "lower",
    type: "incisor",
    isPediatric: true,
  },
  72: {
    number: 72,
    quadrant: 7,
    quadrantName: "Lower Left Primary (Q7)",
    name: "Primary Mandibular Left Lateral Incisor",
    shortName: "Primary Lateral (N)",
    arch: "lower",
    type: "incisor",
    isPediatric: true,
  },
  73: {
    number: 73,
    quadrant: 7,
    quadrantName: "Lower Left Primary (Q7)",
    name: "Primary Mandibular Left Canine",
    shortName: "Primary Canine (M)",
    arch: "lower",
    type: "canine",
    isPediatric: true,
  },
  74: {
    number: 74,
    quadrant: 7,
    quadrantName: "Lower Left Primary (Q7)",
    name: "Primary Mandibular Left First Molar",
    shortName: "1st Primary Molar (L)",
    arch: "lower",
    type: "molar",
    isPediatric: true,
  },
  75: {
    number: 75,
    quadrant: 7,
    quadrantName: "Lower Left Primary (Q7)",
    name: "Primary Mandibular Left Second Molar",
    shortName: "2nd Primary Molar (K)",
    arch: "lower",
    type: "molar",
    isPediatric: true,
  },
};

const ADULT_Q1 = [18, 17, 16, 15, 14, 13, 12, 11] as const;
const ADULT_Q2 = [21, 22, 23, 24, 25, 26, 27, 28] as const;
const ADULT_Q4 = [48, 47, 46, 45, 44, 43, 42, 41] as const;
const ADULT_Q3 = [31, 32, 33, 34, 35, 36, 37, 38] as const;

const PEDIATRIC_Q5 = [55, 54, 53, 52, 51] as const;
const PEDIATRIC_Q6 = [61, 62, 63, 64, 65] as const;
const PEDIATRIC_Q8 = [85, 84, 83, 82, 81] as const;
const PEDIATRIC_Q7 = [71, 72, 73, 74, 75] as const;

const ALL_ADULT_TEETH = [...ADULT_Q1, ...ADULT_Q2, ...ADULT_Q4, ...ADULT_Q3];
const ALL_PEDIATRIC_TEETH = [
  ...PEDIATRIC_Q5,
  ...PEDIATRIC_Q6,
  ...PEDIATRIC_Q8,
  ...PEDIATRIC_Q7,
];

// ============================================================================
// Clinical Category Classification Helper
// ============================================================================

export type ProcedureKind =
  | "missing"
  | "endodontic"
  | "restoration"
  | "crown"
  | "implant"
  | "periodontic"
  | "orthodontic"
  | "general";

export function classifyProcedure(
  name: string,
  category?: string | null,
): ProcedureKind {
  const text = `${name} ${category || ""}`.toLowerCase();

  if (
    text.includes("extract") ||
    text.includes("bunot") ||
    text.includes("odontectomy") ||
    text.includes("exodontia") ||
    text.includes("missing") ||
    text.includes("avuls") ||
    text.includes("tooth loss")
  ) {
    return "missing";
  }

  if (
    text.includes("root canal") ||
    text.includes("endodontic") ||
    text.includes("pulpectomy") ||
    text.includes("pulpotomy") ||
    text.includes("rct") ||
    text.includes("apexification")
  ) {
    return "endodontic";
  }

  if (
    text.includes("crown") ||
    text.includes("bridge") ||
    text.includes("veneer") ||
    text.includes("pontic") ||
    text.includes("jacket") ||
    text.includes("inlay") ||
    text.includes("onlay") ||
    text.includes("denture")
  ) {
    return "crown";
  }

  if (
    text.includes("implant") ||
    text.includes("abutment") ||
    text.includes("bone graft") ||
    text.includes("sinus lift")
  ) {
    return "implant";
  }

  if (
    text.includes("restoration") ||
    text.includes("filling") ||
    text.includes("composite") ||
    text.includes("amalgam") ||
    text.includes("gic") ||
    text.includes("sealant")
  ) {
    return "restoration";
  }

  if (
    text.includes("prophy") ||
    text.includes("scaling") ||
    text.includes("curettage") ||
    text.includes("periodont") ||
    text.includes("deep clean")
  ) {
    return "periodontic";
  }

  if (
    text.includes("bracket") ||
    text.includes("ortho") ||
    text.includes("braces") ||
    text.includes("aligner")
  ) {
    return "orthodontic";
  }

  return "general";
}

export function getProcedureBadgeStyle(kind: ProcedureKind) {
  switch (kind) {
    case "missing":
      return "bg-rose-100 text-rose-800 border-rose-300";
    case "endodontic":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "crown":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "implant":
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    case "restoration":
      return "bg-cyan-100 text-cyan-900 border-cyan-300";
    case "periodontic":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "orthodontic":
      return "bg-pink-100 text-pink-800 border-pink-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

// Helper to safely parse tooth array
function parseTeethNumbers(raw: unknown): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "number") return item;
        if (typeof item === "string") {
          const parsed = parseInt(item, 10);
          return isNaN(parsed) ? null : parsed;
        }
        return null;
      })
      .filter((n): n is number => n !== null);
  }
  if (typeof raw === "number") return [raw];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseTeethNumbers(parsed);
    } catch {
      const matches = raw.match(/\b([1-4][1-8]|[5-8][1-5])\b/g);
      if (matches) return matches.map((m) => parseInt(m, 10));
    }
  }
  return [];
}

// Helper to parse surfaces for a given tooth
function parseSurfacesForTooth(raw: unknown, toothNumber: number): string[] {
  if (!raw) return [];
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const record = raw as Record<string | number, unknown>;
    const val = record[toothNumber] || record[String(toothNumber)];
    if (Array.isArray(val)) {
      return val.filter((v): v is string => typeof v === "string");
    }
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parseSurfacesForTooth(parsed, toothNumber);
    } catch {
      return [];
    }
  }
  return [];
}

// ============================================================================
// Anatomical Root & Crown SVG Component (Morphology + Canals + Crowns)
// ============================================================================

interface AnatomicalToothProps {
  toothType: ToothMorphology;
  arch: ArchType;
  primaryKind?: ProcedureKind;
  hasEndo?: boolean;
  hasCrown?: boolean;
  hasImplant?: boolean;
  isMissing: boolean;
  isPlanned?: boolean;
  isPontic?: boolean;
  className?: string;
}

function AnatomicalToothSvg({
  toothType,
  arch,
  primaryKind = "general",
  hasEndo = false,
  hasCrown = false,
  hasImplant = false,
  isMissing,
  isPlanned = false,
  isPontic = false,
  className,
}: AnatomicalToothProps) {
  const isUpper = arch === "upper";
  const isEndo = hasEndo || primaryKind === "endodontic";
  const isCrown = hasCrown || primaryKind === "crown";
  const isImplant = hasImplant || primaryKind === "implant";

  // Crown base colors
  const crownFill = isPontic
    ? "#fef3c7"
    : isCrown
      ? "#fef3c7" // amber-100 for prosthetic crown
      : "#ffffff";
  const crownStroke = isPontic
    ? "#b45309"
    : isCrown
      ? "#d97706" // amber-600
      : "#64748b"; // slate-500

  // Biological Root colors
  const rootFill = "#f8fafc";
  const rootStroke = isPlanned ? "#94a3b8" : "#94a3b8";

  // Endo gutta-percha color
  const canalStroke = "#9333ea"; // purple-600

  return (
    <svg
      viewBox="0 0 70 96"
      className={cn(
        "w-full h-full transition-transform duration-150",
        isMissing && !isPontic && "opacity-30",
        isPlanned && "stroke-dashed opacity-85",
        className,
      )}
    >
      <defs>
        {/* Implant Titanium Thread Pattern */}
        <pattern
          id="implantThreads"
          width="70"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="20"
            y1="2"
            x2="50"
            y2="2"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1="22"
            y1="5"
            x2="48"
            y2="5"
            stroke="#94a3b8"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* ─── IMPLANT FIXTURE (IF APPLICABLE) ─── */}
      {isImplant ? (
        <g>
          {isUpper ? (
            <>
              <rect
                x="25"
                y="10"
                width="20"
                height="42"
                rx="3"
                fill="#cbd5e1"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <rect
                x="25"
                y="10"
                width="20"
                height="42"
                rx="3"
                fill="url(#implantThreads)"
              />
              <polygon
                points="23,52 47,52 44,58 26,58"
                fill="#64748b"
                stroke="#334155"
                strokeWidth="1"
              />
            </>
          ) : (
            <>
              <polygon
                points="26,38 44,38 47,44 23,44"
                fill="#64748b"
                stroke="#334155"
                strokeWidth="1"
              />
              <rect
                x="25"
                y="44"
                width="20"
                height="42"
                rx="3"
                fill="#cbd5e1"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <rect
                x="25"
                y="44"
                width="20"
                height="42"
                rx="3"
                fill="url(#implantThreads)"
              />
            </>
          )}
        </g>
      ) : !isPontic ? (
        /* ─── NATURAL BIOLOGICAL ROOTS ─── */
        <g>
          {isUpper ? (
            toothType === "molar" ? (
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
                {isEndo && (
                  <>
                    <path
                      d="M 20 54 Q 18 32 19 12"
                      stroke={canalStroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 35 54 L 35 8"
                      stroke={canalStroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 50 54 Q 52 32 51 12"
                      stroke={canalStroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </>
            ) : toothType === "premolar" ? (
              <>
                <path
                  d="M 22 56 C 20 36, 24 20, 29 10 C 33 22, 34 38, 35 56 C 36 38, 37 22, 41 10 C 46 20, 50 36, 48 56 Z"
                  fill={rootFill}
                  stroke={rootStroke}
                  strokeWidth="1.5"
                />
                {isEndo && (
                  <>
                    <path
                      d="M 27 54 Q 25 32 28 12"
                      stroke={canalStroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 43 54 Q 45 32 42 12"
                      stroke={canalStroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </>
            ) : toothType === "canine" ? (
              <>
                <path
                  d="M 22 56 C 24 38, 30 18, 35 6 C 40 18, 46 38, 48 56 Z"
                  fill={rootFill}
                  stroke={rootStroke}
                  strokeWidth="1.5"
                />
                {isEndo && (
                  <path
                    d="M 35 54 L 35 8"
                    stroke={canalStroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}
              </>
            ) : (
              <>
                <path
                  d="M 24 56 C 26 38, 31 20, 35 8 C 39 20, 44 38, 46 56 Z"
                  fill={rootFill}
                  stroke={rootStroke}
                  strokeWidth="1.5"
                />
                {isEndo && (
                  <path
                    d="M 35 54 L 35 10"
                    stroke={canalStroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}
              </>
            )
          ) : toothType === "molar" ? (
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
              {isEndo && (
                <>
                  <path
                    d="M 20 42 Q 18 64 20 86"
                    stroke={canalStroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50 42 Q 52 64 50 86"
                    stroke={canalStroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}
            </>
          ) : toothType === "premolar" ? (
            <>
              <path
                d="M 24 40 C 25 58, 30 76, 35 88 C 40 76, 45 58, 46 40 Z"
                fill={rootFill}
                stroke={rootStroke}
                strokeWidth="1.5"
              />
              {isEndo && (
                <path
                  d="M 35 42 L 35 86"
                  stroke={canalStroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
            </>
          ) : toothType === "canine" ? (
            <>
              <path
                d="M 23 40 C 24 58, 30 78, 35 90 C 40 78, 46 58, 47 40 Z"
                fill={rootFill}
                stroke={rootStroke}
                strokeWidth="1.5"
              />
              {isEndo && (
                <path
                  d="M 35 42 L 35 88"
                  stroke={canalStroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
            </>
          ) : (
            <>
              <path
                d="M 26 40 C 27 58, 31 76, 35 88 C 39 76, 43 58, 44 40 Z"
                fill={rootFill}
                stroke={rootStroke}
                strokeWidth="1.5"
              />
              {isEndo && (
                <path
                  d="M 35 42 L 35 86"
                  stroke={canalStroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
            </>
          )}
        </g>
      ) : null}

      {/* ─── ANATOMICAL CROWN ─── */}
      <g>
        {isUpper ? (
          toothType === "molar" ? (
            <>
              <path
                d="M 14 56 C 14 68, 12 84, 18 90 C 24 93, 30 89, 35 91 C 40 89, 46 93, 52 90 C 58 84, 56 68, 56 56 Z"
                fill={crownFill}
                stroke={crownStroke}
                strokeWidth="2"
                strokeDasharray={isPlanned ? "4 2" : "none"}
              />
              <path
                d="M 22 84 Q 35 80 48 84"
                stroke={crownStroke}
                strokeWidth="1"
                fill="none"
                opacity="0.6"
              />
              <line
                x1="35"
                y1="80"
                x2="35"
                y2="68"
                stroke={crownStroke}
                strokeWidth="1"
                opacity="0.6"
              />
            </>
          ) : toothType === "premolar" ? (
            <>
              <path
                d="M 18 56 C 17 70, 22 87, 28 90 C 35 92, 42 90, 48 87 C 53 70, 52 56, 52 56 Z"
                fill={crownFill}
                stroke={crownStroke}
                strokeWidth="2"
                strokeDasharray={isPlanned ? "4 2" : "none"}
              />
              <path
                d="M 26 82 Q 35 78 44 82"
                stroke={crownStroke}
                strokeWidth="1"
                fill="none"
                opacity="0.6"
              />
            </>
          ) : toothType === "canine" ? (
            <>
              <path
                d="M 19 56 C 18 70, 24 85, 35 92 C 46 85, 52 70, 51 56 Z"
                fill={crownFill}
                stroke={crownStroke}
                strokeWidth="2"
                strokeDasharray={isPlanned ? "4 2" : "none"}
              />
              <line
                x1="35"
                y1="91"
                x2="35"
                y2="72"
                stroke={crownStroke}
                strokeWidth="1"
                opacity="0.5"
              />
            </>
          ) : (
            <>
              <path
                d="M 18 56 C 18 70, 20 86, 21 89 C 23 90, 47 90, 49 89 C 50 86, 52 70, 52 56 Z"
                fill={crownFill}
                stroke={crownStroke}
                strokeWidth="2"
                strokeDasharray={isPlanned ? "4 2" : "none"}
              />
              <line
                x1="22"
                y1="88"
                x2="48"
                y2="88"
                stroke={crownStroke}
                strokeWidth="1"
                opacity="0.6"
              />
            </>
          )
        ) : toothType === "molar" ? (
          <>
            <path
              d="M 14 40 C 14 28, 12 12, 18 6 C 24 3, 30 7, 35 5 C 40 7, 46 3, 52 6 C 58 12, 56 28, 56 40 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
              strokeDasharray={isPlanned ? "4 2" : "none"}
            />
            <path
              d="M 22 12 Q 35 16 48 12"
              stroke={crownStroke}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
            <line
              x1="35"
              y1="16"
              x2="35"
              y2="28"
              stroke={crownStroke}
              strokeWidth="1"
              opacity="0.6"
            />
          </>
        ) : toothType === "premolar" ? (
          <>
            <path
              d="M 18 40 C 17 26, 22 9, 28 6 C 35 4, 42 6, 48 9 C 53 26, 52 40, 52 40 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
              strokeDasharray={isPlanned ? "4 2" : "none"}
            />
            <path
              d="M 26 14 Q 35 18 44 14"
              stroke={crownStroke}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
          </>
        ) : toothType === "canine" ? (
          <>
            <path
              d="M 19 40 C 18 26, 24 11, 35 4 C 46 11, 52 26, 51 40 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
              strokeDasharray={isPlanned ? "4 2" : "none"}
            />
            <line
              x1="35"
              y1="5"
              x2="35"
              y2="24"
              stroke={crownStroke}
              strokeWidth="1"
              opacity="0.5"
            />
          </>
        ) : (
          <>
            <path
              d="M 20 40 C 20 26, 22 10, 23 7 C 25 6, 45 6, 47 7 C 48 10, 50 26, 50 40 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="2"
              strokeDasharray={isPlanned ? "4 2" : "none"}
            />
            <line
              x1="23"
              y1="8"
              x2="47"
              y2="8"
              stroke={crownStroke}
              strokeWidth="1"
              opacity="0.6"
            />
          </>
        )}

        <line
          x1="18"
          y1={isUpper ? 56 : 40}
          x2="52"
          y2={isUpper ? 56 : 40}
          stroke={crownStroke}
          strokeWidth="1.5"
          strokeDasharray="2 1"
          opacity="0.7"
        />
      </g>

      {/* ─── CROWN / PONTIC TEXT ─── */}
      {(isCrown || isPontic) && (
        <text
          x="35"
          y={isUpper ? 75 : 25}
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="bold"
          fill="#b45309"
        >
          {isPontic ? "PONT" : "CRW"}
        </text>
      )}

      {/* ─── MISSING / EXTRACTED OVERLAY (BOLD ✕) ─── */}
      {isMissing && !isPontic && (
        <g stroke="#e11d48" strokeWidth="8" strokeLinecap="round">
          <line x1="10" y1="10" x2="60" y2="86" />
          <line x1="60" y1="10" x2="10" y2="86" />
        </g>
      )}
    </svg>
  );
}

// ============================================================================
// 5-Surface Occlusal / Incisal Facet Diagram SVG
// ============================================================================

interface OcclusalFacetProps {
  surfaces: string[];
  surfaceColor: string;
  isSelected: boolean;
  hasProcedures: boolean;
  isPlanned?: boolean;
  className?: string;
}

function OcclusalFacetSvg({
  surfaces,
  surfaceColor,
  isSelected,
  hasProcedures,
  isPlanned = false,
  className,
}: OcclusalFacetProps) {
  const normSurfaces = useMemo(
    () => surfaces.map((s) => s.toLowerCase()),
    [surfaces],
  );

  const hasM = normSurfaces.some((s) => s.includes("mesial") || s === "m");
  const hasD = normSurfaces.some((s) => s.includes("distal") || s === "d");
  const hasO = normSurfaces.some(
    (s) =>
      s.includes("occlusal") || s.includes("incisal") || s === "o" || s === "i",
  );
  const hasB = normSurfaces.some(
    (s) =>
      s.includes("buccal") || s.includes("facial") || s === "b" || s === "f",
  );
  const hasL = normSurfaces.some(
    (s) =>
      s.includes("lingual") || s.includes("palatal") || s === "l" || s === "p",
  );

  return (
    <svg viewBox="0 0 100 100" className={cn("w-full h-full", className)}>
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="16"
        className={cn(
          "stroke-[3]",
          isPlanned ? "stroke-dashed stroke-amber-500 fill-amber-50/20" : "",
          isSelected
            ? "stroke-primary fill-white"
            : hasProcedures
              ? "stroke-slate-400 fill-white"
              : "stroke-slate-300 fill-slate-50/50",
        )}
      />

      <polygon
        points="14,14 86,14 70,30 30,30"
        fill={hasB ? surfaceColor : "#f8fafc"}
        className="stroke-slate-300 stroke-[2] transition-colors"
      />
      <polygon
        points="30,70 70,70 86,86 14,86"
        fill={hasL ? surfaceColor : "#f8fafc"}
        className="stroke-slate-300 stroke-[2] transition-colors"
      />
      <polygon
        points="14,14 30,30 30,70 14,86"
        fill={hasM ? surfaceColor : "#f1f5f9"}
        className="stroke-slate-300 stroke-[2] transition-colors"
      />
      <polygon
        points="86,14 86,86 70,70 70,30"
        fill={hasD ? surfaceColor : "#f1f5f9"}
        className="stroke-slate-300 stroke-[2] transition-colors"
      />
      <rect
        x="30"
        y="30"
        width="40"
        height="40"
        rx="6"
        fill={hasO ? surfaceColor : "#ffffff"}
        className="stroke-slate-400 stroke-[2] transition-colors"
      />
    </svg>
  );
}

// ============================================================================
// Interactive Tooth Cell Component
// ============================================================================

interface ToothCellProps {
  toothMeta: ToothMeta;
  surfaces: string[];
  isMissing: boolean;
  hasProcedures: boolean;
  primaryKind: ProcedureKind;
  hasEndo?: boolean;
  hasCrown?: boolean;
  hasImplant?: boolean;
  procedureKinds?: ProcedureKind[];
  procedureCount: number;
  isSelected: boolean;
  displayMode: ChartDisplayMode;
  numberingSystem: NumberingSystem;
  stage: TreatmentStage;
  isPontic?: boolean;
  activeStampTool?:
    "none" | "restoration" | "crown" | "endo" | "implant" | "extract" | "sound";
  onClick: () => void;
}

function ToothCell({
  toothMeta,
  surfaces,
  isMissing,
  hasProcedures,
  primaryKind,
  hasEndo = false,
  hasCrown = false,
  hasImplant = false,
  procedureKinds = [],
  procedureCount,
  isSelected,
  displayMode,
  numberingSystem,
  stage,
  isPontic = false,
  activeStampTool = "none",
  onClick,
}: ToothCellProps) {
  const isPlanned = stage === "planned";
  const isExisting = stage === "existing";
  const isStampActive = Boolean(activeStampTool && activeStampTool !== "none");

  const stampHoverClass = isStampActive
    ? activeStampTool === "restoration"
      ? "hover:border-cyan-400 hover:ring-2 hover:ring-cyan-400/80 hover:scale-[1.03]"
      : activeStampTool === "crown"
        ? "hover:border-amber-400 hover:ring-2 hover:ring-amber-400/80 hover:scale-[1.03]"
        : activeStampTool === "endo"
          ? "hover:border-purple-400 hover:ring-2 hover:ring-purple-400/80 hover:scale-[1.03]"
          : activeStampTool === "extract"
            ? "hover:border-rose-400 hover:ring-2 hover:ring-rose-400/80 hover:scale-[1.03]"
            : "hover:border-emerald-400 hover:ring-2 hover:ring-emerald-400/80 hover:scale-[1.03]"
    : "";

  // Surface highlight fill color
  const surfaceColor = isExisting
    ? "#94a3b8" // slate for prior work
    : isPlanned
      ? "#f59e0b" // amber for planned work
      : surfaces.length > 0
        ? "#0393b8" // signature cyan for restorative fillings
        : primaryKind === "endodontic"
          ? "#a855f7" // purple-500
          : primaryKind === "crown"
            ? "#f59e0b" // amber-500
            : primaryKind === "implant"
              ? "#6366f1" // indigo-500
              : primaryKind === "periodontic"
                ? "#10b981" // emerald-500
                : "#0393b8"; // signature cyan

  const displayNum = formatToothNumber(
    toothMeta.number,
    numberingSystem,
    toothMeta.isPediatric,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        isStampActive
          ? `Click to apply ${activeStampTool.toUpperCase()} to tooth #${toothMeta.number}`
          : `Tooth #${toothMeta.number} (${toothMeta.name})`
      }
      className={cn(
        "group relative flex flex-col items-center justify-between p-1 rounded-xl border transition-all duration-200 select-none min-h-[96px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected
          ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/40 -translate-y-0.5"
          : isPlanned
            ? "border-amber-400/90 border-dashed bg-amber-50/20 hover:bg-amber-50/40"
            : "border-slate-200/90 bg-white hover:border-slate-400 hover:bg-slate-50/80 shadow-xs",
        isMissing && !isPontic && "bg-rose-50/60 border-rose-200/80 opacity-80",
        isStampActive && "cursor-crosshair",
        stampHoverClass,
      )}
    >
      {/* Top Header: Tooth Number & Multi-Procedure Pill */}
      <div className="w-full flex items-center justify-between gap-0.5 mb-1 px-1">
        <span
          className={cn(
            "text-[10px] font-mono font-bold tracking-tight px-1 py-0.2 rounded",
            isSelected
              ? "bg-primary text-white"
              : isMissing && !isPontic
                ? "text-rose-700 bg-rose-100/70"
                : isPlanned
                  ? "text-amber-800 bg-amber-100/80"
                  : hasProcedures
                    ? "text-slate-900 bg-slate-100 font-extrabold"
                    : "text-slate-600",
          )}
        >
          {displayNum}
        </span>

        {/* Treatment stage micro-badge or procedure count */}
        {isPlanned ? (
          <span className="text-[8px] font-bold px-1 rounded bg-amber-500 text-white uppercase tracking-tight">
            Plan
          </span>
        ) : procedureCount > 1 ? (
          <span
            title={`${procedureCount} procedures recorded on this tooth`}
            className="text-[9px] font-extrabold px-1 py-0.1 rounded-full bg-cyan-600 text-white shadow-xs tracking-tight animate-pulse"
          >
            {procedureCount}x
          </span>
        ) : null}
      </div>

      {/* ─── GRAPHIC CONTAINER ─── */}
      <div className="flex-1 flex flex-col items-center justify-center w-full my-0.5 gap-1">
        {(displayMode === "comprehensive" || displayMode === "anatomical") && (
          <div
            className={cn(
              "relative transition-transform duration-150 group-hover:scale-105",
              displayMode === "comprehensive"
                ? "w-8 h-11 sm:w-9 sm:h-12"
                : "w-10 h-14 sm:w-11 sm:h-16",
            )}
          >
            <AnatomicalToothSvg
              toothType={toothMeta.type}
              arch={toothMeta.arch}
              primaryKind={primaryKind}
              hasEndo={hasEndo}
              hasCrown={hasCrown}
              hasImplant={hasImplant}
              isMissing={isMissing}
              isPlanned={isPlanned}
              isPontic={isPontic}
            />
          </div>
        )}

        {(displayMode === "comprehensive" || displayMode === "occlusal") && (
          <div
            className={cn(
              "relative transition-transform duration-150 group-hover:scale-105",
              displayMode === "comprehensive"
                ? "w-5 h-5 sm:w-6 sm:h-6"
                : "w-9 h-9 sm:w-10 sm:h-10",
            )}
          >
            <OcclusalFacetSvg
              surfaces={surfaces}
              surfaceColor={surfaceColor}
              isSelected={isSelected}
              hasProcedures={hasProcedures}
              isPlanned={isPlanned}
            />
          </div>
        )}
      </div>

      {/* Bottom Status Dot or Text */}
      <div className="mt-1 flex items-center justify-center w-full min-h-[14px]">
        {isPontic ? (
          <span className="text-[8.5px] font-extrabold text-amber-700 uppercase tracking-tight">
            Pontic
          </span>
        ) : isMissing ? (
          <span className="text-[8.5px] font-black uppercase text-rose-600 tracking-wider">
            Gone
          </span>
        ) : hasProcedures ? (
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {procedureKinds && procedureKinds.length > 1 ? (
              <div className="flex items-center gap-0.5">
                {Array.from(new Set(procedureKinds)).map((k) => (
                  <span
                    key={k}
                    title={k}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      k === "endodontic"
                        ? "bg-purple-500"
                        : k === "crown"
                          ? "bg-amber-500"
                          : k === "implant"
                            ? "bg-indigo-500"
                            : k === "restoration"
                              ? "bg-cyan-500"
                              : k === "missing"
                                ? "bg-rose-500"
                                : "bg-slate-400",
                    )}
                  />
                ))}
                <span className="text-[8.5px] font-bold text-slate-700 ml-0.5">
                  {procedureCount}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isPlanned
                      ? "bg-amber-500 animate-pulse"
                      : primaryKind === "endodontic"
                        ? "bg-purple-500"
                        : primaryKind === "crown"
                          ? "bg-amber-500"
                          : primaryKind === "implant"
                            ? "bg-indigo-500"
                            : primaryKind === "periodontic"
                              ? "bg-emerald-500"
                              : "bg-cyan-500",
                  )}
                />
                <span className="text-[8px] font-medium text-slate-500 capitalize truncate max-w-[42px]">
                  {primaryKind}
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-[8px] font-medium text-slate-400">Sound</span>
        )}
      </div>
    </button>
  );
}

function generateStampId(toothNumber: number): string {
  return `stamp-${toothNumber}-${Date.now()}`;
}

const SURFACE_OPTIONS = [
  { key: "M", full: "Mesial", label: "Mesial" },
  { key: "O", full: "Occlusal", label: "Occlusal / Incisal" },
  { key: "D", full: "Distal", label: "Distal" },
  { key: "B", full: "Buccal", label: "Buccal / Facial" },
  { key: "L", full: "Lingual", label: "Lingual / Palatal" },
] as const;

const SURFACE_PRESETS = [
  { label: "O", surfaces: ["Occlusal"] },
  { label: "MO", surfaces: ["Mesial", "Occlusal"] },
  { label: "DO", surfaces: ["Distal", "Occlusal"] },
  { label: "MOD", surfaces: ["Mesial", "Occlusal", "Distal"] },
  { label: "B", surfaces: ["Buccal"] },
  { label: "L", surfaces: ["Lingual"] },
  {
    label: "All (5)",
    surfaces: ["Mesial", "Occlusal", "Distal", "Buccal", "Lingual"],
  },
] as const;

function getSurfaceAcronym(surfaces: string[], isAnterior = false): string {
  if (!surfaces || surfaces.length === 0) return "";
  const norm = surfaces.map((s) => s.toLowerCase());
  const parts: string[] = [];
  if (norm.some((s) => s.includes("mesial") || s === "m")) parts.push("M");
  if (
    norm.some(
      (s) =>
        s.includes("occlusal") ||
        s.includes("incisal") ||
        s === "o" ||
        s === "i",
    )
  ) {
    parts.push(isAnterior ? "I" : "O");
  }
  if (norm.some((s) => s.includes("distal") || s === "d")) parts.push("D");
  if (
    norm.some(
      (s) =>
        s.includes("buccal") ||
        s.includes("facial") ||
        s.includes("labial") ||
        s === "b" ||
        s === "f",
    )
  ) {
    parts.push(isAnterior ? "F" : "B");
  }
  if (
    norm.some(
      (s) =>
        s.includes("lingual") ||
        s.includes("palatal") ||
        s === "l" ||
        s === "p",
    )
  ) {
    parts.push(
      norm.some((s) => s.includes("palatal") || s === "p") ? "P" : "L",
    );
  }
  return parts.length > 0 ? parts.join("") : surfaces.join(", ");
}

function isSurfaceMatch(keyOrFull: string, surfaces: string[]): boolean {
  if (!surfaces || surfaces.length === 0) return false;
  const norm = surfaces.map((s) => s.toLowerCase());
  const target = keyOrFull.toLowerCase();

  if (target === "m" || target === "mesial") {
    return norm.some((s) => s.includes("mesial") || s === "m");
  }
  if (
    target === "o" ||
    target === "i" ||
    target === "occlusal" ||
    target === "incisal"
  ) {
    return norm.some(
      (s) =>
        s.includes("occlusal") ||
        s.includes("incisal") ||
        s === "o" ||
        s === "i",
    );
  }
  if (target === "d" || target === "distal") {
    return norm.some((s) => s.includes("distal") || s === "d");
  }
  if (
    target === "b" ||
    target === "f" ||
    target === "buccal" ||
    target === "facial" ||
    target === "labial"
  ) {
    return norm.some(
      (s) =>
        s.includes("buccal") ||
        s.includes("facial") ||
        s.includes("labial") ||
        s === "b" ||
        s === "f",
    );
  }
  if (
    target === "l" ||
    target === "p" ||
    target === "lingual" ||
    target === "palatal"
  ) {
    return norm.some(
      (s) =>
        s.includes("lingual") ||
        s.includes("palatal") ||
        s === "l" ||
        s === "p",
    );
  }

  return norm.includes(target);
}

function getCanonicalSurface(keyOrFull: string, isAnterior = false): string {
  const norm = keyOrFull.toLowerCase();
  if (norm === "m" || norm === "mesial") return "Mesial";
  if (
    norm === "o" ||
    norm === "i" ||
    norm === "occlusal" ||
    norm === "incisal"
  ) {
    return isAnterior ? "Incisal" : "Occlusal";
  }
  if (norm === "d" || norm === "distal") return "Distal";
  if (
    norm === "b" ||
    norm === "f" ||
    norm === "buccal" ||
    norm === "facial" ||
    norm === "labial"
  ) {
    return isAnterior ? "Facial" : "Buccal";
  }
  if (
    norm === "l" ||
    norm === "p" ||
    norm === "lingual" ||
    norm === "palatal"
  ) {
    return "Lingual";
  }
  return keyOrFull;
}

// ============================================================================
// Main SmartOdontogram Component
// ============================================================================

export function SmartOdontogram({
  patientId,
  clinicSlug,
  appointments,
  patientNotes = [],
  onSelectToothAction,
}: SmartOdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(16);
  const [dentitionType, setDentitionType] = useState<"adult" | "pediatric">(
    "adult",
  );
  const [numberingSystem, setNumberingSystem] =
    useState<NumberingSystem>("fdi");
  const [displayMode, setDisplayMode] =
    useState<ChartDisplayMode>("comprehensive");
  const [filterMode, setFilterMode] = useState<
    | "all"
    | "completed"
    | "planned"
    | "missing"
    | "multi"
    | "restoration"
    | "endodontic"
    | "crown"
    | "sound"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabSub, setActiveTabSub] = useState<"history" | "perio">(
    "history",
  );

  // Fast Chairside Stamping State
  const [stampTool, setStampTool] = useState<
    "none" | "restoration" | "crown" | "endo" | "implant" | "extract" | "sound"
  >("none");
  const [activeStampSurfaces, setActiveStampSurfaces] = useState<string[]>([
    "Occlusal",
  ]);

  const toggleStampSurface = (surface: string) => {
    setActiveStampSurfaces((prev) => {
      const alreadyHas = isSurfaceMatch(surface, prev);
      if (alreadyHas) {
        const next = prev.filter((s) => !isSurfaceMatch(surface, [s]));
        return next.length > 0 ? next : ["Occlusal"];
      } else {
        return [...prev, surface];
      }
    });
  };

  // Perio probing state for selected tooth
  const [perioScores, setPerioScores] = useState<Record<number, PerioData>>({});

  // Dialogs
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Local state for manually toggled missing teeth
  const [localMissingOverrides, setLocalMissingOverrides] = useState<
    Record<number, boolean>
  >({});

  // Local optimistic state for fast chairside stamps (filling, crown, endo, clear)
  const [localStampedOverrides, setLocalStampedOverrides] = useState<
    Record<
      number,
      | {
          id: string;
          kind: ProcedureKind;
          procedureName: string;
          category: string;
          surfaces: string[];
          stage: TreatmentStage;
          price?: number | null;
          date: string;
        }[]
      | "cleared"
    >
  >({});

  // Bridge connection links (parsed from patient clinical notes, default empty)
  const initialBridgeGroups = useMemo(() => {
    let groups: number[][] = [];
    const sorted = [...patientNotes].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const note of sorted) {
      if (note.content.includes("[BRIDGE_CLEAR]")) {
        groups = [];
      }
      const bridgeMatches = note.content.matchAll(
        /\[BRIDGE_GROUP:([0-9,]+)\]/g,
      );
      for (const bm of bridgeMatches) {
        const teeth = bm[1]
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter(Boolean);
        if (teeth.length >= 2) {
          groups = [teeth];
        }
      }
      const removeMatches = note.content.matchAll(/\[BRIDGE_REMOVE:(\d+)\]/g);
      for (const rm of removeMatches) {
        const tooth = parseInt(rm[1], 10);
        groups = groups
          .map((g) => g.filter((t) => t !== tooth))
          .filter((g) => g.length >= 2);
      }
    }
    return groups;
  }, [patientNotes]);

  const [localBridgeGroups, setLocalBridgeGroups] = useState<number[][] | null>(
    null,
  );
  const bridgeGroups =
    localBridgeGroups !== null ? localBridgeGroups : initialBridgeGroups;

  // 1. Compile all procedure records grouped by tooth number
  const toothProceduresMap = useMemo(() => {
    const map = new Map<number, ToothProcedureRecord[]>();

    // 1a. Formal appointments
    for (const appt of appointments) {
      if (appt.status === "CANCELLED" || appt.status === "NO_SHOW") {
        continue;
      }
      const isPlannedAppt =
        appt.status === "PENDING" || appt.status === "CONFIRMED";
      const isCompletedAppt =
        appt.status === "COMPLETED" || appt.status === "CHECKED_IN";

      for (const proc of appt.procedures) {
        const teeth = parseTeethNumbers(proc.toothSelection);
        for (const t of teeth) {
          const surfaces = parseSurfacesForTooth(proc.surfaceSelection, t);
          const stage: TreatmentStage = isCompletedAppt
            ? "completed"
            : isPlannedAppt
              ? "planned"
              : "completed";

          const record: ToothProcedureRecord = {
            id: proc.id,
            procedureName: proc.procedure.name,
            category: proc.procedure.category,
            appointmentId: appt.id,
            appointmentDate: appt.preferredDate,
            appointmentStatus: appt.status,
            dentistName: proc.dentist?.name || appt.dentist?.name,
            surfaces,
            findings: proc.findings,
            diagnosis: proc.diagnosis,
            remarks: proc.remarks,
            price:
              typeof proc.price === "number" || typeof proc.price === "string"
                ? proc.price
                : null,
            stage,
          };

          const existing = map.get(t) || [];
          existing.push(record);
          map.set(t, existing);
        }
      }
    }

    // 1b. Stamped procedures & findings from patient clinical notes
    const sortedNotes = [...patientNotes].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    for (const note of sortedNotes) {
      // Clear tag: [TOOTH_CLEAR:16] or [TOOTH_CLEAR:16:restoration] or [TOOTH_CONSUMED:16:restoration]
      const clearMatches = note.content.matchAll(
        /\[(?:TOOTH_CLEAR|TOOTH_CONSUMED):(\d+)(?::([a-z_]+))?\]/gi,
      );
      for (const cm of clearMatches) {
        const tooth = parseInt(cm[1], 10);
        const clearKind = cm[2]?.toLowerCase();
        const existing = map.get(tooth);
        if (existing) {
          const preserved = existing.filter((p) => {
            if (
              !p.id.startsWith("note-stamp-") &&
              !p.id.startsWith("legacy-") &&
              !p.id.startsWith("local-")
            ) {
              return true; // Always preserve formal appointment procedures
            }
            if (clearKind) {
              const pKind = classifyProcedure(p.procedureName, p.category);
              const pCat = p.category?.toLowerCase();
              const isMatch =
                pKind === clearKind ||
                pCat === clearKind ||
                (clearKind === "restoration" && pCat === "restorative") ||
                (clearKind === "restorative" && pKind === "restoration");
              return !isMatch;
            }
            return false;
          });
          if (preserved.length > 0) {
            map.set(tooth, preserved);
          } else {
            map.delete(tooth);
          }
        }
      }

      // Structured stamp tag: [TOOTH_STAMP:16:restoration:Occlusal:completed:1500] or [TOOTH_STAMP:16:restoration:Occlusal]
      const stampMatches = note.content.matchAll(
        /\[TOOTH_STAMP:(\d+):([a-z_]+)(?::([A-Za-z,]*))?(?::([a-z]+))?(?::([0-9.]+))?\]/g,
      );
      for (const sm of stampMatches) {
        const tooth = parseInt(sm[1], 10);
        const kind = sm[2] as ProcedureKind;
        const surfaces = sm[3]
          ? sm[3].split(",").filter(Boolean)
          : kind === "restoration"
            ? ["Occlusal"]
            : [];
        const parsedStage: TreatmentStage =
          sm[4] === "completed" ? "completed" : "planned";
        const parsedPrice = sm[5] ? parseFloat(sm[5]) : undefined;

        const toothMeta =
          PERMANENT_TEETH_META[tooth] || PEDIATRIC_TEETH_META[tooth];
        const isAnterior =
          toothMeta?.type === "incisor" || toothMeta?.type === "canine";

        const acronym = getSurfaceAcronym(surfaces, isAnterior);
        const procName =
          kind === "restoration"
            ? `Composite Restoration (${acronym || surfaces.join(", ") || (isAnterior ? "Incisal" : "Occlusal")})`
            : kind === "crown"
              ? "Full Coverage Crown"
              : kind === "endodontic"
                ? "Root Canal Therapy"
                : kind === "implant"
                  ? "Dental Implant"
                  : "Chairside Finding";

        const category =
          kind === "restoration"
            ? "Restorative"
            : kind === "crown"
              ? "Prosthodontics"
              : kind === "endodontic"
                ? "Endodontics"
                : kind === "implant"
                  ? "Implantology"
                  : "General";

        const existing = map.get(tooth) || [];

        // Check if there is already a formal permanent appointment procedure recorded for this tooth that fulfills this kind/category
        const matchingFormalProc = existing.find((p) => {
          if (
            p.id.startsWith("note-stamp-") ||
            p.id.startsWith("legacy-") ||
            p.id.startsWith("local-")
          ) {
            return false;
          }
          const pKind = classifyProcedure(p.procedureName, p.category);
          const pCat = p.category?.toLowerCase();
          return (
            pKind === kind ||
            (pCat && pCat === category.toLowerCase()) ||
            (kind === "restoration" && pCat === "restorative") ||
            (category.toLowerCase() === "restorative" &&
              pKind === "restoration")
          );
        });

        if (matchingFormalProc) {
          // If a permanent procedure already exists in an appointment for this tooth fulfilling this kind/category,
          // the formal appointment procedure is the official permanent record.
          // Any planned treatment or chairside note stamp is fulfilled and must NOT be retained as a duplicate!
          continue;
        }

        const rec: ToothProcedureRecord = {
          id: `note-stamp-${note.id}-${tooth}`,
          procedureName: procName,
          category,
          appointmentId: `note-${note.id}`,
          appointmentDate: note.createdAt,
          appointmentStatus: "CONFIRMED",
          surfaces,
          findings: "Chairside Quick Stamp Finding",
          stage: parsedStage,
          price: parsedPrice,
        };

        // Replace previous stamp only if it has the matching clinical category (e.g. updating a filling's surfaces replaces the old filling stamp, but preserves endo, crown, etc. so treatments accumulate on the tooth)
        const withoutSameCategoryStamp = existing.filter(
          (e) =>
            !(
              e.findings === "Chairside Quick Stamp Finding" &&
              e.category === category
            ),
        );
        withoutSameCategoryStamp.push(rec);
        map.set(tooth, withoutSameCategoryStamp);
      }

      // Legacy fallback for notes saved in earlier tests: [TOOTH_PLANNED:16]
      const legacyPlanned = note.content.matchAll(
        /\[TOOTH_PLANNED:(\d+)\](?:\s*Proposed\s+([A-Za-z\s]+)\s+on\s+tooth)?/gi,
      );
      for (const lm of legacyPlanned) {
        const tooth = parseInt(lm[1], 10);
        const text = (lm[2] || note.content).toLowerCase();
        let procName = "Composite Restoration (Occlusal)";
        let category = "Restorative";
        let surfaces = ["Occlusal"];

        if (text.includes("crown")) {
          procName = "Full Coverage Crown";
          category = "Prosthodontics";
          surfaces = [];
        } else if (text.includes("root canal") || text.includes("endo")) {
          procName = "Root Canal Therapy";
          category = "Endodontics";
          surfaces = [];
        } else if (text.includes("implant")) {
          procName = "Dental Implant";
          category = "Implantology";
          surfaces = [];
        }

        const existing = map.get(tooth) || [];
        const hasFormalMatch = existing.some((p) => {
          if (
            p.id.startsWith("note-stamp-") ||
            p.id.startsWith("legacy-") ||
            p.id.startsWith("local-")
          ) {
            return false;
          }
          const pKind = classifyProcedure(p.procedureName, p.category);
          const pCat = p.category?.toLowerCase();
          return (
            pKind === classifyProcedure(procName, category) ||
            (pCat && pCat === category.toLowerCase())
          );
        });
        if (hasFormalMatch) {
          continue;
        }

        const rec: ToothProcedureRecord = {
          id: `legacy-${note.id}-${tooth}`,
          procedureName: procName,
          category,
          appointmentId: `note-${note.id}`,
          appointmentDate: note.createdAt,
          appointmentStatus: "CONFIRMED",
          surfaces,
          findings: "Chairside Quick Stamp Finding",
          stage: "planned",
        };

        if (!existing.some((e) => e.procedureName === procName)) {
          existing.push(rec);
          map.set(tooth, existing);
        }
      }
    }

    // 1c. Apply local optimistic overrides
    Object.entries(localStampedOverrides).forEach(([toothStr, override]) => {
      const tooth = parseInt(toothStr, 10);
      if (override === "cleared") {
        const existing = map.get(tooth);
        if (existing) {
          const preserved = existing.filter(
            (p) =>
              !p.id.startsWith("note-stamp-") &&
              !p.id.startsWith("legacy-") &&
              !p.id.startsWith("local-"),
          );
          if (preserved.length > 0) {
            map.set(tooth, preserved);
          } else {
            map.delete(tooth);
          }
        }
      } else if (Array.isArray(override)) {
        const current = map.get(tooth) || [];
        // Only include local optimistic items that haven't yet been committed to current from server notes,
        // and do not duplicate formal appointment procedures
        const pendingLocal = override.filter(
          (o) =>
            !current.some(
              (c) =>
                (!c.id.startsWith("note-") &&
                  !c.id.startsWith("local-") &&
                  (c.category === o.category ||
                    classifyProcedure(c.procedureName, c.category) === o.kind ||
                    (o.kind === "restoration" &&
                      c.category?.toLowerCase() === "restorative"))) ||
                c.procedureName === o.procedureName,
            ),
        );
        if (pendingLocal.length > 0) {
          const stampedRecs: ToothProcedureRecord[] = pendingLocal.map((o) => ({
            id: `local-${o.id}`,
            procedureName: o.procedureName,
            category: o.category,
            appointmentId: "local",
            appointmentDate: o.date,
            appointmentStatus: "CONFIRMED" as const,
            surfaces: o.surfaces,
            findings: "Chairside Quick Stamp Finding",
            stage: o.stage,
            price: o.price,
          }));
          // Only clean out previous stamps of the matching category so multiple different treatments accumulate
          const cleanCurrent = current.filter(
            (c) =>
              !(
                c.findings === "Chairside Quick Stamp Finding" &&
                pendingLocal.some((p) => p.category === c.category)
              ),
          );
          map.set(tooth, [...stampedRecs, ...cleanCurrent]);
        }
      }
    });

    // Sort procedures chronologically
    map.forEach((list) => {
      list.sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() -
          new Date(a.appointmentDate).getTime(),
      );
    });

    return map;
  }, [appointments, patientNotes, localStampedOverrides]);

  // 2. Identify missing / extracted teeth from procedures and notes
  const missingTeethSet = useMemo(() => {
    const set = new Set<number>();

    // Check procedure records
    toothProceduresMap.forEach((procs, tooth) => {
      const hasExtraction = procs.some((p) => {
        const kind = classifyProcedure(p.procedureName, p.category);
        return kind === "missing" && p.stage === "completed";
      });
      if (hasExtraction) set.add(tooth);
    });

    // Check patient notes
    const sortedNotes = [...patientNotes].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    for (const note of sortedNotes) {
      const missingMatches = note.content.matchAll(/\[TOOTH_MISSING:(\d+)\]/g);
      for (const m of missingMatches) {
        set.add(parseInt(m[1], 10));
      }
      const presentMatches = note.content.matchAll(/\[TOOTH_PRESENT:(\d+)\]/g);
      for (const p of presentMatches) {
        set.delete(parseInt(p[1], 10));
      }
      const clearMatches = note.content.matchAll(
        /\[(?:TOOTH_CLEAR|TOOTH_CONSUMED):(\d+)(?::([a-z_]+))?\]/gi,
      );
      for (const c of clearMatches) {
        set.delete(parseInt(c[1], 10));
      }
    }

    // Apply any local optimistic overrides
    Object.entries(localMissingOverrides).forEach(([toothStr, isMissing]) => {
      const tooth = parseInt(toothStr, 10);
      if (isMissing) set.add(tooth);
      else set.delete(tooth);
    });

    // Also check localStampedOverrides for "cleared"
    Object.entries(localStampedOverrides).forEach(([toothStr, override]) => {
      const tooth = parseInt(toothStr, 10);
      if (override === "cleared") {
        const procs = toothProceduresMap.get(tooth) || [];
        const hasFormalExtraction = procs.some(
          (p) =>
            !p.id.startsWith("note-") &&
            !p.id.startsWith("local-") &&
            classifyProcedure(p.procedureName, p.category) === "missing" &&
            p.stage === "completed",
        );
        if (!hasFormalExtraction) {
          set.delete(tooth);
        }
      }
    });

    return set;
  }, [
    toothProceduresMap,
    patientNotes,
    localMissingOverrides,
    localStampedOverrides,
  ]);

  // Active tooth metadata dictionary
  const currentTeethDict =
    dentitionType === "adult" ? PERMANENT_TEETH_META : PEDIATRIC_TEETH_META;

  // Arch arrays
  const upperQuadrant1 = dentitionType === "adult" ? ADULT_Q1 : PEDIATRIC_Q5;
  const upperQuadrant2 = dentitionType === "adult" ? ADULT_Q2 : PEDIATRIC_Q6;
  const lowerQuadrant4 = dentitionType === "adult" ? ADULT_Q4 : PEDIATRIC_Q8;
  const lowerQuadrant3 = dentitionType === "adult" ? ADULT_Q3 : PEDIATRIC_Q7;

  const allVisibleTeeth =
    dentitionType === "adult" ? ALL_ADULT_TEETH : ALL_PEDIATRIC_TEETH;

  // Statistics
  const stats = useMemo(() => {
    let completedCount = 0;
    let plannedCount = 0;
    let missingCount = 0;
    let multiCount = 0;
    let totalProcedures = 0;

    allVisibleTeeth.forEach((t) => {
      const isMissing = missingTeethSet.has(t);
      const procs = toothProceduresMap.get(t) || [];
      if (isMissing) missingCount++;
      if (procs.length > 0) {
        const hasPlanned = procs.some((p) => p.stage === "planned");
        if (hasPlanned) plannedCount++;
        else completedCount++;
        totalProcedures += procs.length;
        if (procs.length > 1) multiCount++;
      }
    });

    const soundCount =
      allVisibleTeeth.length - completedCount - plannedCount - missingCount;

    return {
      total: allVisibleTeeth.length,
      present: allVisibleTeeth.length - missingCount,
      completed: completedCount,
      planned: plannedCount,
      multi: multiCount,
      missing: missingCount,
      sound: Math.max(0, soundCount),
      totalProcedures,
    };
  }, [allVisibleTeeth, missingTeethSet, toothProceduresMap]);

  // Fast Chairside Stamping Action
  const handleFastStamp = (toothNumber: number) => {
    if (stampTool === "none") {
      setSelectedTooth(toothNumber);
      onSelectToothAction?.(toothNumber);
      return;
    }

    setSelectedTooth(toothNumber);

    const toothMeta = currentTeethDict[toothNumber];
    const isAnterior =
      toothMeta?.type === "incisor" || toothMeta?.type === "canine";
    const defaultSurface = isAnterior ? "Incisal" : "Occlusal";

    if (stampTool === "extract") {
      setLocalMissingOverrides((prev) => ({ ...prev, [toothNumber]: true }));
      startTransition(async () => {
        const content = `[TOOTH_MISSING:${toothNumber}] Tooth #${toothNumber} marked as extracted via chairside tool.`;
        const res = await addPatientNote(clinicSlug, patientId, content);
        if (res && "error" in res && res.error) {
          toast.error(res.error);
        } else {
          toast.success(`Marked Tooth #${toothNumber} as Extracted (✕ Gone)`);
        }
      });
      return;
    }

    if (stampTool === "sound") {
      setLocalMissingOverrides((prev) => ({ ...prev, [toothNumber]: false }));
      setLocalStampedOverrides((prev) => ({
        ...prev,
        [toothNumber]: "cleared",
      }));
      startTransition(async () => {
        const content = `[TOOTH_PRESENT:${toothNumber}] [TOOTH_CLEAR:${toothNumber}] Cleared chairside stamps for tooth #${toothNumber}.`;
        const res = await addPatientNote(clinicSlug, patientId, content);
        if (res && "error" in res && res.error) {
          toast.error(res.error);
        } else {
          toast.success(
            `Cleared chairside stamps for tooth #${toothNumber}. Official appointment records preserved.`,
          );
        }
      });
      return;
    }

    let kind: ProcedureKind = "restoration";
    let procName = `Composite Restoration (${defaultSurface})`;
    let category = "Restorative";
    let surfaces: string[] = [defaultSurface];

    if (stampTool === "restoration") {
      kind = "restoration";
      const resolvedSurfaces =
        activeStampSurfaces.length > 0
          ? activeStampSurfaces.map((s) => getCanonicalSurface(s, isAnterior))
          : [defaultSurface];
      const acronym = getSurfaceAcronym(resolvedSurfaces, isAnterior);
      procName = `Composite Restoration (${acronym || defaultSurface})`;
      category = "Restorative";
      surfaces = resolvedSurfaces;
    } else if (stampTool === "crown") {
      kind = "crown";
      procName = "Full Coverage Crown";
      category = "Prosthodontics";
      surfaces = [];
    } else if (stampTool === "endo") {
      kind = "endodontic";
      procName = "Root Canal Therapy";
      category = "Endodontics";
      surfaces = [];
    } else if (stampTool === "implant") {
      kind = "implant";
      procName = "Dental Implant";
      category = "Implantology";
      surfaces = [];
    }

    const currentProcs = toothProceduresMap.get(toothNumber) || [];
    const alreadyStamped = currentProcs.some(
      (p) => p.procedureName === procName,
    );
    if (alreadyStamped) {
      toast.info(`Tooth #${toothNumber} already has ${procName}.`);
      return;
    }

    const stampedItem = {
      id: generateStampId(toothNumber),
      kind,
      procedureName: procName,
      category,
      surfaces,
      stage: "planned" as const,
      date: new Date().toISOString(),
    };

    setLocalStampedOverrides((prev) => {
      const existing = prev[toothNumber];
      const list = Array.isArray(existing) ? existing : [];
      const filtered = list.filter((item) => item.category !== category);
      return {
        ...prev,
        [toothNumber]: [stampedItem, ...filtered],
      };
    });

    startTransition(async () => {
      const surfacesTag = surfaces.length > 0 ? `:${surfaces.join(",")}` : "";
      const content = `[TOOTH_STAMP:${toothNumber}:${kind}${surfacesTag}] ${procName} stamped on tooth #${toothNumber}.`;
      const res = await addPatientNote(clinicSlug, patientId, content);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        setLocalStampedOverrides((prev) => {
          const list = prev[toothNumber];
          if (Array.isArray(list)) {
            return {
              ...prev,
              [toothNumber]: list.filter((item) => item.id !== stampedItem.id),
            };
          }
          return prev;
        });
      } else {
        toast.success(`Stamped ${procName} on tooth #${toothNumber}!`);
        setLocalStampedOverrides((prev) => {
          const list = prev[toothNumber];
          if (Array.isArray(list)) {
            return {
              ...prev,
              [toothNumber]: list.filter((item) => item.id !== stampedItem.id),
            };
          }
          return prev;
        });
      }
    });
  };

  const handleUpdateSurfaces = (
    toothNumber: number,
    targetKeyOrFull: string,
    currentSurfaces: string[],
  ) => {
    const toothMeta = currentTeethDict[toothNumber];
    const isAnterior =
      toothMeta?.type === "incisor" || toothMeta?.type === "canine";
    const defaultSurface = isAnterior ? "Incisal" : "Occlusal";

    const alreadyHas = isSurfaceMatch(targetKeyOrFull, currentSurfaces);

    let newSurfaces: string[];
    if (alreadyHas) {
      newSurfaces = currentSurfaces.filter(
        (s) => !isSurfaceMatch(targetKeyOrFull, [s]),
      );
      if (newSurfaces.length === 0) {
        newSurfaces = [defaultSurface];
      }
    } else {
      const surfaceToAdd = getCanonicalSurface(targetKeyOrFull, isAnterior);
      newSurfaces = [...currentSurfaces, surfaceToAdd];
    }

    const acronym = getSurfaceAcronym(newSurfaces, isAnterior);
    const procName = `Composite Restoration (${acronym || defaultSurface})`;

    const existingProc = (toothProceduresMap.get(toothNumber) || []).find(
      (p) => p.category === "Restorative",
    );
    const existingStage = existingProc?.stage || "planned";
    const existingPrice =
      existingProc?.price != null ? Number(existingProc.price) : undefined;

    const updatedItem = {
      id: generateStampId(toothNumber),
      kind: "restoration" as ProcedureKind,
      procedureName: procName,
      category: "Restorative",
      surfaces: newSurfaces,
      stage: existingStage,
      price: existingPrice,
      date: new Date().toISOString(),
    };

    setLocalStampedOverrides((prev) => {
      const existing = prev[toothNumber];
      const list = Array.isArray(existing) ? existing : [];
      const filtered = list.filter((item) => item.category !== "Restorative");
      return {
        ...prev,
        [toothNumber]: [updatedItem, ...filtered],
      };
    });

    startTransition(async () => {
      const surfacesTag =
        newSurfaces.length > 0 ? `:${newSurfaces.join(",")}` : "";
      const priceTag = existingPrice != null ? `:${existingPrice}` : "";
      const content = `[TOOTH_STAMP:${toothNumber}:restoration${surfacesTag}:${existingStage}${priceTag}] ${procName} updated on tooth #${toothNumber}.`;
      const res = await addPatientNote(clinicSlug, patientId, content);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Updated Tooth #${toothNumber} surfaces to: ${acronym || newSurfaces.join(",")}`,
        );
        setLocalStampedOverrides((prev) => {
          const list = prev[toothNumber];
          if (Array.isArray(list)) {
            return {
              ...prev,
              [toothNumber]: list.filter((item) => item.id !== updatedItem.id),
            };
          }
          return prev;
        });
      }
    });
  };

  const handleRemovePlannedTreatment = (
    toothNumber: number,
    proc: ToothProcedureRecord,
  ) => {
    const kind = classifyProcedure(proc.procedureName, proc.category);

    setLocalStampedOverrides((prev) => {
      const existing = prev[toothNumber];
      const list = Array.isArray(existing) ? existing : [];
      const filtered = list.filter((item) => item.category !== proc.category);
      return {
        ...prev,
        [toothNumber]: filtered.length > 0 ? filtered : "cleared",
      };
    });

    startTransition(async () => {
      const content = `[TOOTH_CLEAR:${toothNumber}] [TOOTH_CLEAR:${toothNumber}:${kind}] [TOOTH_CONSUMED:${toothNumber}:${kind}] Cleared planned ${proc.procedureName} on tooth #${toothNumber}.`;
      const res = await addPatientNote(clinicSlug, patientId, content);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Removed planned treatment ${proc.procedureName} from Tooth #${toothNumber}`,
        );
      }
    });
  };

  const handleUpdatePrice = (
    toothNumber: number,
    proc: ToothProcedureRecord,
    newPrice: string,
  ) => {
    const trimmed = newPrice.trim();
    const numericPrice = parseFloat(trimmed);
    const validPrice =
      trimmed === "" || isNaN(numericPrice) || numericPrice < 0
        ? null
        : numericPrice;
    const kind = classifyProcedure(proc.procedureName, proc.category);

    const updatedItem = {
      id: generateStampId(toothNumber),
      kind,
      procedureName: proc.procedureName,
      category: proc.category || "General",
      surfaces: proc.surfaces,
      stage: proc.stage,
      price: validPrice,
      date: new Date().toISOString(),
    };

    setLocalStampedOverrides((prev) => {
      const existing = prev[toothNumber];
      const list = Array.isArray(existing) ? existing : [];
      const filtered = list.filter((item) => item.category !== proc.category);
      return {
        ...prev,
        [toothNumber]: [updatedItem, ...filtered],
      };
    });

    startTransition(async () => {
      const surfacesTag =
        proc.surfaces.length > 0 ? `:${proc.surfaces.join(",")}` : "";
      const priceTag = validPrice != null ? `:${validPrice}` : "";
      const content = `[TOOTH_STAMP:${toothNumber}:${kind}${surfacesTag}:${proc.stage}${priceTag}] ${proc.procedureName} planned fee set to ${validPrice != null ? `₱${validPrice.toLocaleString()}` : "none"} on tooth #${toothNumber}.`;
      const res = await addPatientNote(clinicSlug, patientId, content);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          validPrice != null
            ? `Estimated fee set to ₱${validPrice.toLocaleString()} for Tooth #${toothNumber}`
            : `Cleared estimated fee for Tooth #${toothNumber}`,
        );
        setLocalStampedOverrides((prev) => {
          const list = prev[toothNumber];
          if (Array.isArray(list)) {
            return {
              ...prev,
              [toothNumber]: list.filter((item) => item.id !== updatedItem.id),
            };
          }
          return prev;
        });
      }
    });
  };

  // Handler to toggle tooth missing state
  const handleToggleMissing = (toothNumber: number) => {
    const isCurrentlyMissing = missingTeethSet.has(toothNumber);
    const newMissingState = !isCurrentlyMissing;

    setLocalMissingOverrides((prev) => ({
      ...prev,
      [toothNumber]: newMissingState,
    }));

    startTransition(async () => {
      const content = newMissingState
        ? `[TOOTH_MISSING:${toothNumber}] Tooth #${toothNumber} recorded as missing / extracted.`
        : `[TOOTH_PRESENT:${toothNumber}] Tooth #${toothNumber} restored / marked as present.`;

      const res = await addPatientNote(clinicSlug, patientId, content);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        setLocalMissingOverrides((prev) => ({
          ...prev,
          [toothNumber]: isCurrentlyMissing,
        }));
      } else {
        toast.success(
          newMissingState
            ? `Tooth #${toothNumber} marked as Missing / Gone.`
            : `Tooth #${toothNumber} marked as Present.`,
        );
      }
    });
  };

  // Bridge Link / Unlink Helper
  const handleToggleBridge = (toothNumber: number) => {
    let nextGroups: number[][] = [];
    const existing = bridgeGroups.find((group) => group.includes(toothNumber));

    if (existing) {
      // remove tooth
      const updated = existing.filter((t) => t !== toothNumber);
      nextGroups =
        updated.length >= 2
          ? bridgeGroups.map((g) => (g === existing ? updated : g))
          : bridgeGroups.filter((g) => g !== existing);

      setLocalBridgeGroups(nextGroups);

      startTransition(async () => {
        const content =
          nextGroups.length === 0
            ? `[BRIDGE_CLEAR] Cleared all fixed bridge spans.`
            : `[BRIDGE_REMOVE:${toothNumber}] Tooth #${toothNumber} removed from bridge link.`;
        const res = await addPatientNote(clinicSlug, patientId, content);
        if (res && "error" in res && res.error) {
          toast.error(res.error);
        } else {
          toast.success(`Removed tooth #${toothNumber} from bridge link.`);
        }
      });
    } else {
      // add to adjacent bridge or create new
      if (bridgeGroups.length > 0) {
        const next = [...bridgeGroups];
        next[0] = [...next[0], toothNumber].sort((a, b) => a - b);
        nextGroups = next;
      } else {
        nextGroups = [[toothNumber]];
      }

      setLocalBridgeGroups(nextGroups);

      startTransition(async () => {
        const currentGroup = nextGroups[0] || [toothNumber];
        const content =
          currentGroup.length >= 2
            ? `[BRIDGE_GROUP:${currentGroup.join(",")}] Linked teeth #${currentGroup.join(", #")} in fixed bridge span.`
            : `[BRIDGE_GROUP:${currentGroup.join(",")}] Bridge anchor point on tooth #${toothNumber}.`;
        const res = await addPatientNote(clinicSlug, patientId, content);
        if (res && "error" in res && res.error) {
          toast.error(res.error);
        } else {
          toast.success(
            currentGroup.length >= 2
              ? `Linked bridge between teeth #${currentGroup.join(", #")}.`
              : `Added bridge anchor on tooth #${toothNumber}.`,
          );
        }
      });
    }
  };

  // Handler to add custom clinical note
  const handleAddToothNote = () => {
    if (!selectedTooth || !noteContent.trim()) return;

    startTransition(async () => {
      const toothMeta = currentTeethDict[selectedTooth];
      const toothName = toothMeta ? toothMeta.name : `Tooth #${selectedTooth}`;
      const content = `[TOOTH_NOTE:${selectedTooth}] ${toothName}: ${noteContent.trim()}`;

      const res = await addPatientNote(clinicSlug, patientId, content);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Clinical observation saved for tooth #${selectedTooth}.`,
        );
        setNoteContent("");
        setNoteDialogOpen(false);
      }
    });
  };

  // Perio Score update
  const currentPerio = selectedTooth
    ? perioScores[selectedTooth] || {
        bop: false,
        mobility: 0,
        db: 2,
        b: 2,
        mb: 2,
        dl: 2,
        l: 2,
        ml: 2,
      }
    : null;

  const updatePerio = (field: keyof PerioData, val: unknown) => {
    if (!selectedTooth) return;
    setPerioScores((prev) => ({
      ...prev,
      [selectedTooth]: {
        ...(prev[selectedTooth] || {
          bop: false,
          mobility: 0,
          db: 2,
          b: 2,
          mb: 2,
          dl: 2,
          l: 2,
          ml: 2,
        }),
        [field]: val,
      },
    }));
  };

  const handleSavePerio = () => {
    if (!selectedTooth || !currentPerio) return;
    startTransition(async () => {
      const content = `[TOOTH_PERIO:${selectedTooth}] PPD: B(${currentPerio.db}-${currentPerio.b}-${currentPerio.mb}) L(${currentPerio.dl}-${currentPerio.l}-${currentPerio.ml}) BOP:${currentPerio.bop ? "Yes" : "No"} Mob:${currentPerio.mobility}`;
      await addPatientNote(clinicSlug, patientId, content);
      toast.success(`Perio probing depths saved for tooth #${selectedTooth}.`);
    });
  };

  // Selected tooth data
  const activeToothMeta = selectedTooth
    ? currentTeethDict[selectedTooth]
    : null;
  const activeProcedures = selectedTooth
    ? toothProceduresMap.get(selectedTooth) || []
    : [];
  const isActiveMissing = selectedTooth
    ? missingTeethSet.has(selectedTooth)
    : false;
  const isSelectedInBridge = selectedTooth
    ? bridgeGroups.some((g) => g.includes(selectedTooth))
    : false;

  // Filter check helper
  const matchesFilter = (tooth: number) => {
    const isMissing = missingTeethSet.has(tooth);
    const procs = toothProceduresMap.get(tooth) || [];
    const meta = currentTeethDict[tooth];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const numMatch = String(tooth).includes(q);
      const nameMatch = meta?.name.toLowerCase().includes(q);
      const shortMatch = meta?.shortName.toLowerCase().includes(q);
      const procMatch = procs.some(
        (p) =>
          p.procedureName.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.diagnosis?.toLowerCase().includes(q),
      );
      if (!numMatch && !nameMatch && !shortMatch && !procMatch) return false;
    }

    if (filterMode === "all") return true;
    if (filterMode === "completed")
      return procs.some((p) => p.stage === "completed");
    if (filterMode === "planned")
      return procs.some((p) => p.stage === "planned");
    if (filterMode === "multi") return procs.length > 1;
    if (filterMode === "missing") return isMissing;
    if (filterMode === "sound") return procs.length === 0 && !isMissing;
    if (filterMode === "restoration")
      return procs.some(
        (p) => classifyProcedure(p.procedureName, p.category) === "restoration",
      );
    if (filterMode === "endodontic")
      return procs.some(
        (p) => classifyProcedure(p.procedureName, p.category) === "endodontic",
      );
    if (filterMode === "crown")
      return procs.some(
        (p) => classifyProcedure(p.procedureName, p.category) === "crown",
      );

    return true;
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Stats Header ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Teeth
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {stats.total}
            </span>
            <span className="text-xs text-slate-400">Tracked</span>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/90 rounded-xl p-3 shadow-xs bg-emerald-50/10">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Completed Care
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold text-emerald-600 font-mono">
              {stats.completed}
            </span>
            <span className="text-xs text-emerald-700/80">Teeth</span>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-xs bg-amber-50/20">
          <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Planned / Plan
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold text-amber-600 font-mono">
              {stats.planned}
            </span>
            <span className="text-xs text-amber-700/80">Proposed</span>
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-3 shadow-xs bg-rose-50/20">
          <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
            Gone / Missing
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold text-rose-600 font-mono">
              {stats.missing}
            </span>
            <span className="text-xs text-rose-600/80">Extracted</span>
          </div>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-3 shadow-xs bg-purple-50/20">
          <p className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider">
            Multi-Treated
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold text-purple-700 font-mono">
              {stats.multi}
            </span>
            <span className="text-xs text-purple-700/80">&gt;1 proc</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Sound / Intact
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold text-slate-700 font-mono">
              {stats.sound}
            </span>
            <span className="text-xs text-slate-400">Untreated</span>
          </div>
        </div>
      </div>

      {/* ─── Chairside Stamping Fast Toolbar ──────────────────────────────── */}
      <div
        className={cn(
          "p-3 rounded-2xl shadow-sm flex flex-col gap-3 transition-all",
          stampTool !== "none"
            ? "bg-slate-900 border-2 border-cyan-400/80 shadow-cyan-950/20"
            : "bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-800",
        )}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                stampTool !== "none"
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-primary/20 text-cyan-400",
              )}
            >
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold flex items-center gap-1.5 text-white">
                Chairside Quick Stamp Tool
                {stampTool !== "none" && (
                  <span className="text-[10px] uppercase font-black bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                    STAMPING: {stampTool.toUpperCase()}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-300">
                {stampTool !== "none" ? (
                  <span className="text-cyan-300 font-semibold">
                    👉 Click any tooth below to immediately stamp this condition
                    onto the patient&apos;s chart.
                  </span>
                ) : (
                  "Pick a tool then click any tooth to instantly apply restorative, surgical, or sound findings."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setStampTool(
                  stampTool === "restoration" ? "none" : "restoration",
                )
              }
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                stampTool === "restoration"
                  ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-md ring-2 ring-cyan-400/60 scale-105"
                  : "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700",
              )}
            >
              + Filling{" "}
              {stampTool === "restoration"
                ? `(${getSurfaceAcronym(activeStampSurfaces) || "O"})`
                : ""}
            </button>
            <button
              type="button"
              onClick={() =>
                setStampTool(stampTool === "crown" ? "none" : "crown")
              }
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                stampTool === "crown"
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/60 scale-105"
                  : "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700",
              )}
            >
              + Crown
            </button>
            <button
              type="button"
              onClick={() =>
                setStampTool(stampTool === "endo" ? "none" : "endo")
              }
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                stampTool === "endo"
                  ? "bg-purple-500 text-white border-purple-300 shadow-md ring-2 ring-purple-400/60 scale-105"
                  : "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700",
              )}
            >
              + Endo (RCT)
            </button>
            <button
              type="button"
              onClick={() =>
                setStampTool(stampTool === "extract" ? "none" : "extract")
              }
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                stampTool === "extract"
                  ? "bg-rose-500 text-white border-rose-300 shadow-md ring-2 ring-rose-400/60 scale-105"
                  : "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700",
              )}
            >
              ✕ Extract
            </button>
            <button
              type="button"
              onClick={() =>
                setStampTool(stampTool === "sound" ? "none" : "sound")
              }
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                stampTool === "sound"
                  ? "bg-emerald-400 text-slate-950 border-emerald-300 shadow-md ring-2 ring-emerald-400/60 scale-105"
                  : "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700",
              )}
            >
              Clear Stamp
            </button>
            {stampTool !== "none" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStampTool("none")}
                className="h-8 text-xs font-bold text-rose-300 hover:text-white border-rose-500/50 bg-rose-950/30 hover:bg-rose-900/60 px-2.5 cursor-pointer"
              >
                Cancel Stamp
              </Button>
            )}
          </div>
        </div>

        {/* Surface Selection Bar for Filling Tool */}
        {stampTool === "restoration" && (
          <div className="pt-2.5 border-t border-slate-800/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase flex items-center gap-1">
                Surfaces:
              </span>

              {/* Individual Surface Toggle Buttons */}
              <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/90 p-0.5">
                {SURFACE_OPTIONS.map(({ key, full, label }) => {
                  const isSelected = isSurfaceMatch(key, activeStampSurfaces);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleStampSurface(full)}
                      title={label}
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer",
                        isSelected
                          ? "bg-cyan-400 text-slate-950 shadow-xs font-black scale-105"
                          : "text-slate-300 hover:text-white hover:bg-slate-800",
                      )}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold ml-1">
                  Presets:
                </span>
                {SURFACE_PRESETS.map((preset) => {
                  const isMatch =
                    preset.surfaces.length === activeStampSurfaces.length &&
                    preset.surfaces.every((s) =>
                      isSurfaceMatch(s, activeStampSurfaces),
                    );
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setActiveStampSurfaces([...preset.surfaces])
                      }
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full border transition-all cursor-pointer",
                        isMatch
                          ? "bg-cyan-500/30 text-cyan-200 border-cyan-400/80 font-black"
                          : "bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Selected Acronym */}
            <div className="text-[11px] text-cyan-200 flex items-center gap-2 self-end md:self-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Stamping:
              </span>
              <span className="font-mono font-black bg-cyan-950 text-cyan-300 border border-cyan-400/50 px-2.5 py-0.5 rounded-md text-xs shadow-2xs">
                Composite (
                {getSurfaceAcronym(activeStampSurfaces) || "Occlusal"})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Filter & View Control Bar ────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />

          <Button
            size="sm"
            variant={filterMode === "all" ? "default" : "outline"}
            onClick={() => setFilterMode("all")}
            className="h-7 text-xs px-2.5 rounded-lg"
          >
            All Teeth ({stats.total})
          </Button>

          <Button
            size="sm"
            variant={filterMode === "completed" ? "default" : "outline"}
            onClick={() => setFilterMode("completed")}
            className="h-7 text-xs px-2.5 rounded-lg text-emerald-800 border-emerald-200 hover:bg-emerald-50"
          >
            Completed ({stats.completed})
          </Button>

          <Button
            size="sm"
            variant={filterMode === "planned" ? "default" : "outline"}
            onClick={() => setFilterMode("planned")}
            className="h-7 text-xs px-2.5 rounded-lg text-amber-800 border-amber-200 hover:bg-amber-50"
          >
            Planned ({stats.planned})
          </Button>

          <Button
            size="sm"
            variant={filterMode === "missing" ? "default" : "outline"}
            onClick={() => setFilterMode("missing")}
            className="h-7 text-xs px-2.5 rounded-lg text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            Gone / Missing ({stats.missing})
          </Button>

          <Button
            size="sm"
            variant={filterMode === "sound" ? "default" : "outline"}
            onClick={() => setFilterMode("sound")}
            className="h-7 text-xs px-2.5 rounded-lg text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            Sound ({stats.sound})
          </Button>
        </div>

        {/* Right: Controls & Numbering Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Real-time search */}
          <div className="relative min-w-[130px] sm:min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search tooth # or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs pl-8 pr-2.5 rounded-lg border-slate-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Numbering System Switcher (FDI vs Universal vs Palmer) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setNumberingSystem("fdi")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all",
                numberingSystem === "fdi"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              FDI
            </button>
            <button
              type="button"
              onClick={() => setNumberingSystem("universal")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all",
                numberingSystem === "universal"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Universal (#1-32)
            </button>
            <button
              type="button"
              onClick={() => setNumberingSystem("palmer")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all",
                numberingSystem === "palmer"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Palmer
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setDisplayMode("comprehensive")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1",
                displayMode === "comprehensive"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <Eye className="w-3 h-3 text-primary" />
              Dual
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("anatomical")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all",
                displayMode === "anatomical"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Roots
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("occlusal")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all",
                displayMode === "occlusal"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Surfaces
            </button>
          </div>

          {/* Adult / Pediatric */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setDentitionType("adult")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all",
                dentitionType === "adult"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Adult
            </button>
            <button
              type="button"
              onClick={() => setDentitionType("pediatric")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all",
                dentitionType === "pediatric"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              Pediatric
            </button>
          </div>

          {/* Print Sheet */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPrintDialogOpen(true)}
            className="h-7 text-xs px-2.5 rounded-lg border-slate-200 text-slate-700"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Report
          </Button>
        </div>
      </div>

      {/* ─── Main Grid: Dental Chart on Left, Tooth Dossier on Right ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── Dental Chart Arches (8 cols) ───────────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Card className="border-slate-200/90 shadow-xs overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Clinical Dental Chart
                  <span className="text-[10.5px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Notation: {numberingSystem.toUpperCase()}
                  </span>
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Anatomical root &amp; crown views with 5-surface restoration
                  facets and bridge spans.
                </p>
              </div>

              {/* Status Color Legend */}
              <div className="hidden xl:flex items-center gap-2.5 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-600">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 border-dashed" />
                  <span className="text-slate-600">Planned</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-600">Endo</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Crown</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Gone</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6 bg-slate-50/30">
              {/* ─── UPPER ARCH (MAXILLARY) ─────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    Patient&apos;s Right (Q1 / Q5)
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    MAXILLARY (UPPER ARCH)
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    Patient&apos;s Left (Q2 / Q6)
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  </span>
                </div>

                {/* Bridge Connector Bar Indicator (Upper) */}
                {bridgeGroups.some(
                  (group) => group.length >= 2 && group.some((t) => t < 30),
                ) && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                    <GitCommit className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold">Active Fixed Bridge:</span>
                    <span>
                      Teeth #{bridgeGroups[0]?.join(", #")} linked with pontic
                      support
                    </span>
                  </div>
                )}

                <div className="relative p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="absolute left-1/2 top-2 bottom-2 w-px bg-dashed border-l border-slate-300 z-10 pointer-events-none" />

                  <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    {/* Quadrant 1 (Upper Right) */}
                    <div
                      className={cn(
                        "grid gap-1 sm:gap-1.5",
                        dentitionType === "adult"
                          ? "grid-cols-4 sm:grid-cols-8"
                          : "grid-cols-5",
                      )}
                    >
                      {upperQuadrant1.map((num) => {
                        const isMissing = missingTeethSet.has(num);
                        const procs = toothProceduresMap.get(num) || [];
                        const kinds = procs.map((p) =>
                          classifyProcedure(p.procedureName, p.category),
                        );
                        const hasEndo = kinds.includes("endodontic");
                        const hasCrown = kinds.includes("crown");
                        const hasImplant = kinds.includes("implant");
                        const primaryKind = procs[0]
                          ? kinds[0]
                          : isMissing
                            ? "missing"
                            : "general";

                        const allSurfaces = procs.flatMap((p) => p.surfaces);
                        const isFiltered = !matchesFilter(num);
                        const meta = currentTeethDict[num];
                        const isPontic = bridgeGroups.some(
                          (g) => g.includes(num) && isMissing,
                        );
                        const stage = procs[0]?.stage || "completed";

                        return (
                          <div
                            key={num}
                            className={cn(
                              "transition-opacity duration-150",
                              isFiltered && "opacity-20 pointer-events-none",
                            )}
                          >
                            <ToothCell
                              toothMeta={meta}
                              surfaces={allSurfaces}
                              isMissing={isMissing}
                              hasProcedures={procs.length > 0}
                              primaryKind={primaryKind}
                              hasEndo={hasEndo}
                              hasCrown={hasCrown}
                              hasImplant={hasImplant}
                              procedureKinds={kinds}
                              procedureCount={procs.length}
                              isSelected={selectedTooth === num}
                              displayMode={displayMode}
                              numberingSystem={numberingSystem}
                              stage={stage}
                              isPontic={isPontic}
                              activeStampTool={stampTool}
                              onClick={() => handleFastStamp(num)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Quadrant 2 (Upper Left) */}
                    <div
                      className={cn(
                        "grid gap-1 sm:gap-1.5",
                        dentitionType === "adult"
                          ? "grid-cols-4 sm:grid-cols-8"
                          : "grid-cols-5",
                      )}
                    >
                      {upperQuadrant2.map((num) => {
                        const isMissing = missingTeethSet.has(num);
                        const procs = toothProceduresMap.get(num) || [];
                        const kinds = procs.map((p) =>
                          classifyProcedure(p.procedureName, p.category),
                        );
                        const hasEndo = kinds.includes("endodontic");
                        const hasCrown = kinds.includes("crown");
                        const hasImplant = kinds.includes("implant");
                        const primaryKind = procs[0]
                          ? kinds[0]
                          : isMissing
                            ? "missing"
                            : "general";

                        const allSurfaces = procs.flatMap((p) => p.surfaces);
                        const isFiltered = !matchesFilter(num);
                        const meta = currentTeethDict[num];
                        const isPontic = bridgeGroups.some(
                          (g) => g.includes(num) && isMissing,
                        );
                        const stage = procs[0]?.stage || "completed";

                        return (
                          <div
                            key={num}
                            className={cn(
                              "transition-opacity duration-150",
                              isFiltered && "opacity-20 pointer-events-none",
                            )}
                          >
                            <ToothCell
                              toothMeta={meta}
                              surfaces={allSurfaces}
                              isMissing={isMissing}
                              hasProcedures={procs.length > 0}
                              primaryKind={primaryKind}
                              hasEndo={hasEndo}
                              hasCrown={hasCrown}
                              hasImplant={hasImplant}
                              procedureKinds={kinds}
                              procedureCount={procs.length}
                              isSelected={selectedTooth === num}
                              displayMode={displayMode}
                              numberingSystem={numberingSystem}
                              stage={stage}
                              isPontic={isPontic}
                              activeStampTool={stampTool}
                              onClick={() => handleFastStamp(num)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── OCCLUSAL PLANE DIVIDER ─────────────────────────────── */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 border-dashed" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-100 text-slate-500 font-bold uppercase tracking-widest text-[9.5px] px-3 py-0.5 rounded-full border border-slate-200">
                    Occlusal Plane
                  </span>
                </div>
              </div>

              {/* ─── LOWER ARCH (MANDIBULAR) ─────────────────────────────── */}
              <div className="space-y-2">
                <div className="relative p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="absolute left-1/2 top-2 bottom-2 w-px bg-dashed border-l border-slate-300 z-10 pointer-events-none" />

                  <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    {/* Quadrant 4 (Lower Right) */}
                    <div
                      className={cn(
                        "grid gap-1 sm:gap-1.5",
                        dentitionType === "adult"
                          ? "grid-cols-4 sm:grid-cols-8"
                          : "grid-cols-5",
                      )}
                    >
                      {lowerQuadrant4.map((num) => {
                        const isMissing = missingTeethSet.has(num);
                        const procs = toothProceduresMap.get(num) || [];
                        const kinds = procs.map((p) =>
                          classifyProcedure(p.procedureName, p.category),
                        );
                        const hasEndo = kinds.includes("endodontic");
                        const hasCrown = kinds.includes("crown");
                        const hasImplant = kinds.includes("implant");
                        const primaryKind = procs[0]
                          ? kinds[0]
                          : isMissing
                            ? "missing"
                            : "general";

                        const allSurfaces = procs.flatMap((p) => p.surfaces);
                        const isFiltered = !matchesFilter(num);
                        const meta = currentTeethDict[num];
                        const isPontic = bridgeGroups.some(
                          (g) => g.includes(num) && isMissing,
                        );
                        const stage = procs[0]?.stage || "completed";

                        return (
                          <div
                            key={num}
                            className={cn(
                              "transition-opacity duration-150",
                              isFiltered && "opacity-20 pointer-events-none",
                            )}
                          >
                            <ToothCell
                              toothMeta={meta}
                              surfaces={allSurfaces}
                              isMissing={isMissing}
                              hasProcedures={procs.length > 0}
                              primaryKind={primaryKind}
                              hasEndo={hasEndo}
                              hasCrown={hasCrown}
                              hasImplant={hasImplant}
                              procedureKinds={kinds}
                              procedureCount={procs.length}
                              isSelected={selectedTooth === num}
                              displayMode={displayMode}
                              numberingSystem={numberingSystem}
                              stage={stage}
                              isPontic={isPontic}
                              activeStampTool={stampTool}
                              onClick={() => handleFastStamp(num)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Quadrant 3 (Lower Left) */}
                    <div
                      className={cn(
                        "grid gap-1 sm:gap-1.5",
                        dentitionType === "adult"
                          ? "grid-cols-4 sm:grid-cols-8"
                          : "grid-cols-5",
                      )}
                    >
                      {lowerQuadrant3.map((num) => {
                        const isMissing = missingTeethSet.has(num);
                        const procs = toothProceduresMap.get(num) || [];
                        const kinds = procs.map((p) =>
                          classifyProcedure(p.procedureName, p.category),
                        );
                        const hasEndo = kinds.includes("endodontic");
                        const hasCrown = kinds.includes("crown");
                        const hasImplant = kinds.includes("implant");
                        const primaryKind = procs[0]
                          ? kinds[0]
                          : isMissing
                            ? "missing"
                            : "general";

                        const allSurfaces = procs.flatMap((p) => p.surfaces);
                        const isFiltered = !matchesFilter(num);
                        const meta = currentTeethDict[num];
                        const isPontic = bridgeGroups.some(
                          (g) => g.includes(num) && isMissing,
                        );
                        const stage = procs[0]?.stage || "completed";

                        return (
                          <div
                            key={num}
                            className={cn(
                              "transition-opacity duration-150",
                              isFiltered && "opacity-20 pointer-events-none",
                            )}
                          >
                            <ToothCell
                              toothMeta={meta}
                              surfaces={allSurfaces}
                              isMissing={isMissing}
                              hasProcedures={procs.length > 0}
                              primaryKind={primaryKind}
                              hasEndo={hasEndo}
                              hasCrown={hasCrown}
                              hasImplant={hasImplant}
                              procedureKinds={kinds}
                              procedureCount={procs.length}
                              isSelected={selectedTooth === num}
                              displayMode={displayMode}
                              numberingSystem={numberingSystem}
                              stage={stage}
                              isPontic={isPontic}
                              activeStampTool={stampTool}
                              onClick={() => handleFastStamp(num)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    Patient&apos;s Right (Q4 / Q8)
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    MANDIBULAR (LOWER ARCH)
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    Patient&apos;s Left (Q3 / Q7)
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column: Tooth Inspector, Perio & History Dossier ──────── */}
        <div className="lg:col-span-5 xl:col-span-4">
          {selectedTooth && activeToothMeta ? (
            <Card className="border-slate-200/90 shadow-xs h-full flex flex-col">
              <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary text-white font-mono font-extrabold rounded-md text-xs shadow-xs">
                        #
                        {formatToothNumber(
                          activeToothMeta.number,
                          numberingSystem,
                          activeToothMeta.isPediatric,
                        )}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {activeToothMeta.shortName}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {activeToothMeta.name} • {activeToothMeta.quadrantName}
                    </p>
                  </div>

                  {isActiveMissing ? (
                    <Badge
                      variant="destructive"
                      className="text-[10px] uppercase font-black tracking-wider"
                    >
                      Gone / Missing
                    </Badge>
                  ) : activeProcedures.length > 0 ? (
                    <Badge className="bg-cyan-100 text-cyan-900 border-cyan-300 text-[10px] font-bold">
                      {activeProcedures.length === 1
                        ? "1 Procedure"
                        : `${activeProcedures.length} Procedures`}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-slate-600 bg-white text-[10px] font-semibold"
                    >
                      Sound / Intact
                    </Badge>
                  )}
                </div>

                {/* Tooth Detail Sub-Tabs (History vs Periodontal) */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setActiveTabSub("history")}
                    className={cn(
                      "flex-1 py-1 text-xs font-semibold rounded-lg transition-all",
                      activeTabSub === "history"
                        ? "bg-slate-900 text-white"
                        : "bg-white border text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    Treatments ({activeProcedures.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabSub("perio")}
                    className={cn(
                      "flex-1 py-1 text-xs font-semibold rounded-lg transition-all",
                      activeTabSub === "perio"
                        ? "bg-slate-900 text-white"
                        : "bg-white border text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    Perio Probing
                  </button>
                </div>

                {/* Quick Clinical Actions Toolbar */}
                <div className="flex items-center gap-1.5 pt-2">
                  <Button
                    size="sm"
                    variant={isActiveMissing ? "default" : "outline"}
                    disabled={isPending}
                    onClick={() => handleToggleMissing(activeToothMeta.number)}
                    className={cn(
                      "h-7 text-xs px-2 font-semibold flex-1 rounded-lg",
                      isActiveMissing
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-rose-200 text-rose-700 hover:bg-rose-50",
                    )}
                  >
                    {isActiveMissing ? (
                      <>
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Present
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Extracted
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleBridge(activeToothMeta.number)}
                    className={cn(
                      "h-7 text-xs px-2 rounded-lg font-semibold",
                      isSelectedInBridge
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <GitCommit className="w-3 h-3 mr-1 text-amber-600" />
                    Bridge
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNoteDialogOpen(true)}
                    className="h-7 text-xs px-2 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Note
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[580px]">
                {activeTabSub === "history" ? (
                  <>
                    {/* Missing Alert */}
                    {isActiveMissing && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Tooth Marked as Gone / Missing
                          </p>
                          <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                            Tooth is physically absent or extracted from
                            alveolar socket.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Multiple Treatments Alert */}
                    {activeProcedures.length > 1 && (
                      <div className="p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl flex items-start gap-2.5 text-xs text-cyan-950">
                        <Layers className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Multiple Treatments Recorded (
                            {activeProcedures.length}x)
                          </p>
                          <p className="text-[11px] text-cyan-800 mt-0.5 leading-relaxed">
                            Chronological interventions across patient visits.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Procedures List */}
                    {activeProcedures.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          No Treatments Recorded
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                          Tooth #{activeToothMeta.number} has no active
                          restorative or surgical records.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeProcedures.map((proc, index) => {
                          const kind = classifyProcedure(
                            proc.procedureName,
                            proc.category,
                          );
                          const badgeStyle = getProcedureBadgeStyle(kind);

                          return (
                            <div
                              key={`${proc.id}-${index}`}
                              className={cn(
                                "bg-white border rounded-xl p-3.5 shadow-xs space-y-2 transition-colors",
                                proc.stage === "planned"
                                  ? "border-amber-300 bg-amber-50/20 border-dashed"
                                  : "border-slate-200/90",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                                        badgeStyle,
                                      )}
                                    >
                                      {proc.category || kind}
                                    </span>
                                    {proc.stage === "planned" ? (
                                      <span className="text-[8.5px] font-black px-1.5 py-0.5 bg-amber-500 text-white rounded uppercase tracking-wider">
                                        Planned
                                      </span>
                                    ) : (
                                      <span className="text-[8.5px] font-black px-1.5 py-0.5 bg-emerald-600 text-white rounded uppercase tracking-wider">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">
                                    {proc.procedureName}
                                  </h5>
                                </div>

                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  {/* Fee Display / Input */}
                                  {proc.stage === "planned" && selectedTooth ? (
                                    <div
                                      className="flex items-center gap-1 bg-amber-50/70 border border-amber-200/90 rounded-md px-1.5 py-0.5"
                                      title="Initial estimated fee for treatment plan (optional)"
                                    >
                                      <span className="text-[10px] font-bold text-amber-700">
                                        ₱
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="Set fee..."
                                        defaultValue={
                                          proc.price != null
                                            ? String(proc.price)
                                            : ""
                                        }
                                        onBlur={(e) => {
                                          const val = e.target.value.trim();
                                          const cur =
                                            proc.price != null
                                              ? String(proc.price)
                                              : "";
                                          if (val !== cur) {
                                            handleUpdatePrice(
                                              selectedTooth,
                                              proc,
                                              val,
                                            );
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.currentTarget.blur();
                                          }
                                        }}
                                        className="w-16 text-[11px] font-mono font-bold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal text-right"
                                      />
                                    </div>
                                  ) : (
                                    proc.price != null && (
                                      <span className="text-xs font-mono font-bold text-slate-800">
                                        {formatCurrency(Number(proc.price))}
                                      </span>
                                    )
                                  )}
                                  {/* Remove Plan / Clear Stamp Button */}
                                  {selectedTooth &&
                                    (proc.id.startsWith("note-stamp-") ||
                                      proc.id.startsWith("local-") ||
                                      proc.findings ===
                                        "Chairside Quick Stamp Finding") &&
                                    (proc.stage === "planned" ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemovePlannedTreatment(
                                            selectedTooth,
                                            proc,
                                          )
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
                                        title="Remove or discard this planned procedure from chart"
                                      >
                                        <X className="w-3 h-3 text-rose-600" />
                                        Remove Plan
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemovePlannedTreatment(
                                            selectedTooth,
                                            proc,
                                          )
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                                        title="Clear this chairside stamp from tooth"
                                      >
                                        <RotateCcw className="w-3 h-3 text-slate-500" />
                                        Clear Stamp
                                      </button>
                                    ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-1 border-t border-slate-100">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {formatDate(proc.appointmentDate)}
                                </span>
                                {proc.dentistName && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    Dr. {proc.dentistName}
                                  </span>
                                )}
                              </div>

                              {(proc.surfaces.length > 0 ||
                                (proc.category === "Restorative" &&
                                  (proc.id.startsWith("note-stamp-") ||
                                    proc.id.startsWith("local-")))) && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-600">
                                      Surfaces:
                                    </span>
                                    {proc.surfaces.length > 0 ? (
                                      proc.surfaces.map((s) => (
                                        <span
                                          key={s}
                                          className="text-[9.5px] font-mono font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 px-1.5 py-0.2 rounded"
                                        >
                                          {s}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[9.5px] italic text-slate-400">
                                        None specified
                                      </span>
                                    )}
                                  </div>

                                  {/* Interactive surface toggle if chairside stamp */}
                                  {selectedTooth &&
                                    (proc.id.startsWith("note-stamp-") ||
                                      proc.id.startsWith("local-")) &&
                                    proc.category === "Restorative" &&
                                    (() => {
                                      const toothMeta =
                                        currentTeethDict[selectedTooth];
                                      const isAnterior =
                                        toothMeta?.type === "incisor" ||
                                        toothMeta?.type === "canine";
                                      const dossierOptions = isAnterior
                                        ? [
                                            {
                                              key: "M",
                                              full: "Mesial",
                                              label: "Mesial",
                                            },
                                            {
                                              key: "I",
                                              full: "Incisal",
                                              label: "Incisal",
                                            },
                                            {
                                              key: "D",
                                              full: "Distal",
                                              label: "Distal",
                                            },
                                            {
                                              key: "F",
                                              full: "Facial",
                                              label: "Facial / Labial",
                                            },
                                            {
                                              key: "L",
                                              full: "Lingual",
                                              label: "Lingual / Palatal",
                                            },
                                          ]
                                        : [
                                            {
                                              key: "M",
                                              full: "Mesial",
                                              label: "Mesial",
                                            },
                                            {
                                              key: "O",
                                              full: "Occlusal",
                                              label: "Occlusal",
                                            },
                                            {
                                              key: "D",
                                              full: "Distal",
                                              label: "Distal",
                                            },
                                            {
                                              key: "B",
                                              full: "Buccal",
                                              label: "Buccal",
                                            },
                                            {
                                              key: "L",
                                              full: "Lingual",
                                              label: "Lingual",
                                            },
                                          ];
                                      return (
                                        <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                                          <span className="text-[9.5px] text-slate-500 font-medium">
                                            Toggle:
                                          </span>
                                          {dossierOptions.map(
                                            ({ key, full, label }) => {
                                              const isActive = isSurfaceMatch(
                                                key,
                                                proc.surfaces,
                                              );
                                              return (
                                                <button
                                                  key={key}
                                                  type="button"
                                                  onClick={() =>
                                                    handleUpdateSurfaces(
                                                      selectedTooth,
                                                      full,
                                                      proc.surfaces,
                                                    )
                                                  }
                                                  className={cn(
                                                    "px-2 py-0.5 text-[9.5px] font-bold rounded border transition-colors cursor-pointer",
                                                    isActive
                                                      ? "bg-cyan-500 text-white border-cyan-600 font-black shadow-2xs"
                                                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
                                                  )}
                                                  title={`Toggle ${label}`}
                                                >
                                                  {key}
                                                </button>
                                              );
                                            },
                                          )}
                                        </div>
                                      );
                                    })()}
                                </div>
                              )}

                              {(proc.diagnosis || proc.findings) && (
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] space-y-1">
                                  {proc.diagnosis && (
                                    <p className="text-slate-700">
                                      <strong className="text-slate-900 font-semibold">
                                        Diagnosis:
                                      </strong>{" "}
                                      {proc.diagnosis}
                                    </p>
                                  )}
                                  {proc.findings && (
                                    <p className="text-slate-700">
                                      <strong className="text-slate-900 font-semibold">
                                        Findings:
                                      </strong>{" "}
                                      {proc.findings}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  /* ─── Periodontal Probing Sub-Panel ─── */
                  currentPerio && (
                    <div className="space-y-4">
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          6-Point Pocket Probing Depths (PPD)
                        </p>
                        <p className="text-[11px] text-indigo-800">
                          Depths: 1-3mm = Normal, 4-5mm = Pocket, 6+mm = Severe
                        </p>
                      </div>

                      {/* Facial / Buccal Depths */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Facial / Buccal (Distobuccal &bull; Mid &bull;
                          Mesiobuccal)
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={currentPerio.db}
                            onChange={(e) =>
                              updatePerio(
                                "db",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className={cn(
                              "text-center font-mono font-bold text-xs h-8",
                              currentPerio.db >= 4
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "",
                            )}
                          />
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={currentPerio.b}
                            onChange={(e) =>
                              updatePerio(
                                "b",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className={cn(
                              "text-center font-mono font-bold text-xs h-8",
                              currentPerio.b >= 4
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "",
                            )}
                          />
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={currentPerio.mb}
                            onChange={(e) =>
                              updatePerio(
                                "mb",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className={cn(
                              "text-center font-mono font-bold text-xs h-8",
                              currentPerio.mb >= 4
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "",
                            )}
                          />
                        </div>
                      </div>

                      {/* Lingual / Palatal Depths */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Lingual / Palatal (Distolingual &bull; Mid &bull;
                          Mesiolingual)
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={currentPerio.dl}
                            onChange={(e) =>
                              updatePerio(
                                "dl",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className={cn(
                              "text-center font-mono font-bold text-xs h-8",
                              currentPerio.dl >= 4
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "",
                            )}
                          />
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={currentPerio.l}
                            onChange={(e) =>
                              updatePerio(
                                "l",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className={cn(
                              "text-center font-mono font-bold text-xs h-8",
                              currentPerio.l >= 4
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "",
                            )}
                          />
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={currentPerio.ml}
                            onChange={(e) =>
                              updatePerio(
                                "ml",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className={cn(
                              "text-center font-mono font-bold text-xs h-8",
                              currentPerio.ml >= 4
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "",
                            )}
                          />
                        </div>
                      </div>

                      {/* BOP & Mobility */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="flex items-center gap-2 border p-2 rounded-xl">
                          <input
                            type="checkbox"
                            id="perio-bop"
                            checked={currentPerio.bop}
                            onChange={(e) =>
                              updatePerio("bop", e.target.checked)
                            }
                            className="rounded text-rose-600 h-4 w-4"
                          />
                          <Label
                            htmlFor="perio-bop"
                            className="text-xs font-semibold text-rose-800 cursor-pointer"
                          >
                            Bleeding on Probing
                          </Label>
                        </div>

                        <div className="border p-2 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Mobility:
                          </span>
                          <select
                            value={currentPerio.mobility}
                            onChange={(e) =>
                              updatePerio(
                                "mobility",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className="text-xs font-bold bg-white border rounded px-1.5 py-0.5"
                          >
                            <option value={0}>0 (Normal)</option>
                            <option value={1}>Grade 1</option>
                            <option value={2}>Grade 2</option>
                            <option value={3}>Grade 3</option>
                          </select>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleSavePerio}
                        disabled={isPending}
                        className="w-full bg-primary text-white text-xs font-bold h-8 rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Save Perio Assessment
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200/90 shadow-xs h-full flex items-center justify-center p-8 text-center bg-slate-50/40">
              <div className="space-y-2">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Select a Tooth to Inspect
                </p>
                <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                  Click on any tooth to review treatments, roots, surfaces, or
                  launch chairside quick stamping.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Printable Clinical Odontogram Sheet Dialog ───────────────────── */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              Patient Odontogram Summary &bull; Clinical Referral Report
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Official dental charting snapshot formatted for clinical review,
              insurance claims, or specialist referrals.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border rounded-xl bg-slate-50/50 space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2 border-b pb-3 text-slate-700">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">
                  Chart Standard
                </p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {numberingSystem.toUpperCase()} Dental Notation
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">
                  Dentition
                </p>
                <p className="font-bold text-slate-900 mt-0.5 capitalize">
                  {dentitionType} ({stats.total} Teeth)
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">
                  Generated
                </p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white rounded border">
                <p className="text-[10px] text-slate-400">Present</p>
                <p className="font-bold text-emerald-600 text-base">
                  {stats.present}
                </p>
              </div>
              <div className="p-2 bg-white rounded border">
                <p className="text-[10px] text-slate-400">Missing</p>
                <p className="font-bold text-rose-600 text-base">
                  {stats.missing}
                </p>
              </div>
              <div className="p-2 bg-white rounded border">
                <p className="text-[10px] text-slate-400">Completed</p>
                <p className="font-bold text-cyan-800 text-base">
                  {stats.completed}
                </p>
              </div>
              <div className="p-2 bg-white rounded border">
                <p className="text-[10px] text-slate-400">Planned</p>
                <p className="font-bold text-amber-700 text-base">
                  {stats.planned}
                </p>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1.5">Missing Teeth:</p>
              <p className="text-slate-600">
                {missingTeethSet.size > 0
                  ? Array.from(missingTeethSet)
                      .sort((a, b) => a - b)
                      .map(
                        (t) =>
                          `#${formatToothNumber(t, numberingSystem, dentitionType === "pediatric")}`,
                      )
                      .join(", ")
                  : "None recorded (Full dentition intact)"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrintDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="bg-primary text-white font-bold"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print Chart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Clinical Observation Dialog ──────────────────────────────── */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Add Tooth Observation &bull; #{selectedTooth}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record a clinical finding or diagnostic observation for{" "}
              {activeToothMeta?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="observation-note"
                className="text-xs font-bold text-slate-700"
              >
                Clinical Observation / Findings
              </Label>
              <Textarea
                id="observation-note"
                rows={4}
                placeholder="e.g. Incipient caries on distal surface, Grade 1 mobility, or pulp vitality normal..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNoteDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending || !noteContent.trim()}
              onClick={handleAddToothNote}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs"
            >
              Save Observation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
