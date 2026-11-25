// ============================================================================
// Treatment Planning Utilities & Types
// Shared between SmartOdontogram, Treatment & Charting, and Patient Records
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

export interface PlannedTreatmentItem {
  id: string;
  toothNumber: number;
  kind: ProcedureKind;
  procedureName: string;
  category: string;
  surfaces: string[];
  stage: "planned" | "completed";
  price: number | null;
  date: string;
}

export interface ClinicProcedureOption {
  id: string;
  name: string;
  category: string | null;
  priceType?: string | null;
  price?: unknown;
  priceMin?: unknown;
  priceMax?: unknown;
  hasOdontogram?: boolean | null;
  hasToothSurface?: boolean | null;
  hasUpperLower?: boolean | null;
  requireSignedConsent?: boolean | null;
  requirePhoto?: boolean | null;
  requireXray?: boolean | null;
  requireLabDocs?: boolean | null;
}

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
    text.includes("retainer") ||
    text.includes("aligner")
  ) {
    return "orthodontic";
  }

  return "general";
}

export function getSurfaceAcronym(
  surfaces: string[],
  isAnterior = false,
): string {
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

export function isSurfaceMatch(keyOrFull: string, surfaces: string[]): boolean {
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

export function getCanonicalSurface(
  keyOrFull: string,
  isAnterior = false,
): string {
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

export function parsePlannedTreatments(
  notes: { id: string; content: string; createdAt: Date | string }[],
): PlannedTreatmentItem[] {
  const map = new Map<string, PlannedTreatmentItem>();

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  for (const note of sortedNotes) {
    // Clear tag: [TOOTH_CLEAR:16] or [TOOTH_CLEAR:16:restoration] or [TOOTH_CONSUMED:16:restoration]
    const clearMatches = note.content.matchAll(
      /\[(?:TOOTH_CLEAR|TOOTH_CONSUMED):(\d+)(?::([a-z_]+))?\]/gi,
    );
    for (const cm of clearMatches) {
      const tooth = parseInt(cm[1], 10);
      const clearKind = cm[2]?.toLowerCase();
      for (const [key, item] of Array.from(map.entries())) {
        if (item.toothNumber === tooth) {
          if (!clearKind) {
            map.delete(key);
          } else {
            const itemKind = item.kind.toLowerCase();
            const itemCat = item.category.toLowerCase();
            const isMatch =
              itemKind === clearKind ||
              itemCat === clearKind ||
              (clearKind === "restoration" && itemCat === "restorative") ||
              (clearKind === "restorative" && itemKind === "restoration");
            if (isMatch) {
              map.delete(key);
            }
          }
        }
      }
    }

    // Structured stamp tag: [TOOTH_STAMP:16:restoration:Occlusal:planned:1500]
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
      const stage = sm[4] === "completed" ? "completed" : "planned";
      const price = sm[5] ? parseFloat(sm[5]) : null;

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

      const acronym = getSurfaceAcronym(surfaces);
      const procName =
        kind === "restoration"
          ? `Composite Restoration (${acronym || surfaces.join(", ") || "Occlusal"})`
          : kind === "crown"
            ? "Full Coverage Crown"
            : kind === "endodontic"
              ? "Root Canal Therapy"
              : kind === "implant"
                ? "Dental Implant"
                : "Chairside Finding";

      const key = `${tooth}-${category}`;
      if (stage === "planned") {
        map.set(key, {
          id: `planned-${note.id}-${tooth}`,
          toothNumber: tooth,
          kind,
          procedureName: procName,
          category,
          surfaces,
          stage: "planned",
          price,
          date:
            typeof note.createdAt === "string"
              ? note.createdAt
              : note.createdAt.toISOString(),
        });
      } else {
        // If completed or cleared, remove from active planned treatments
        map.delete(key);
      }
    }
  }

  return Array.from(map.values());
}

export function matchClinicProcedure(
  kind: ProcedureKind,
  procName: string,
  category: string,
  procedures: ClinicProcedureOption[],
): ClinicProcedureOption | undefined {
  if (!procedures || procedures.length === 0) return undefined;

  const normProc = procName.toLowerCase();
  const normCat = category.toLowerCase();

  // 1. Try exact name match
  let matched = procedures.find((p) => p.name.toLowerCase() === normProc);
  if (matched) return matched;

  // 2. Try matching procedure name containing core keywords
  if (kind === "restoration") {
    matched = procedures.find(
      (p) =>
        p.name.toLowerCase().includes("filling") ||
        p.name.toLowerCase().includes("composite") ||
        p.name.toLowerCase().includes("restoration") ||
        p.category?.toLowerCase() === "restorative",
    );
  } else if (kind === "endodontic") {
    matched = procedures.find(
      (p) =>
        p.name.toLowerCase().includes("root canal") ||
        p.name.toLowerCase().includes("rct") ||
        p.name.toLowerCase().includes("endo") ||
        p.category?.toLowerCase() === "endodontics",
    );
  } else if (kind === "crown") {
    matched = procedures.find(
      (p) =>
        p.name.toLowerCase().includes("crown") ||
        p.category?.toLowerCase() === "prosthodontics",
    );
  } else if (kind === "implant") {
    matched = procedures.find(
      (p) =>
        p.name.toLowerCase().includes("implant") ||
        p.category?.toLowerCase() === "implantology",
    );
  }

  // 3. Match by category
  if (!matched && category) {
    matched = procedures.find((p) => p.category?.toLowerCase() === normCat);
  }

  // 4. Fallback to first available procedure
  return matched || procedures[0];
}
