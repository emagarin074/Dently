"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const ADULT_TEETH = {
  upper: [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28],
  lower: [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38],
}

const SURFACES = ["Mesial", "Distal", "Occlusal", "Buccal", "Lingual", "Facial", "Incisal"]

interface OdontogramProps {
  selectedTeeth?: number[]
  selectedSurfaces?: Record<number, string[]>
  onChange?: (teeth: number[], surfaces: Record<number, string[]>) => void
  readOnly?: boolean
}

function ToothIcon({ number, selected, onClick }: { number: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 p-1 rounded transition-all hover:bg-gray-100",
        selected && "bg-primary/10"
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-md border-2 flex items-center justify-center transition-colors",
        selected ? "border-primary bg-primary text-white" : "border-gray-300 bg-white hover:border-primary"
      )}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill={selected ? "white" : "#d1d5db"} stroke={selected ? "white" : "#6b7280"} strokeWidth={1}>
          <path d="M12 2C9.5 2 8 4 8 6c0 1.5.5 2.5 1 3.5C8 11 7 13 7 15c0 3 2 5 5 5s5-2 5-5c0-2-1-4-2-5.5.5-1 1-2 1-3.5C16 4 14.5 2 12 2z" />
        </svg>
      </div>
      <span className={cn("text-[9px] font-mono", selected ? "text-primary font-bold" : "text-muted-foreground")}>{number}</span>
    </button>
  )
}

export function Odontogram({ selectedTeeth = [], selectedSurfaces = {}, onChange, readOnly = false }: OdontogramProps) {
  const [teeth, setTeeth] = useState<number[]>(selectedTeeth)
  const [surfaces, setSurfaces] = useState<Record<number, string[]>>(selectedSurfaces)
  const [activeTooth, setActiveTooth] = useState<number | null>(null)

  function toggleTooth(n: number) {
    if (readOnly) return
    const next = teeth.includes(n) ? teeth.filter(t => t !== n) : [...teeth, n]
    const nextSurfaces = { ...surfaces }
    if (!next.includes(n)) delete nextSurfaces[n]
    setTeeth(next)
    setSurfaces(nextSurfaces)
    setActiveTooth(next.includes(n) ? n : null)
    onChange?.(next, nextSurfaces)
  }

  function toggleSurface(tooth: number, surface: string) {
    if (readOnly) return
    const current = surfaces[tooth] || []
    const next = current.includes(surface) ? current.filter(s => s !== surface) : [...current, surface]
    const nextSurfaces = { ...surfaces, [tooth]: next }
    setSurfaces(nextSurfaces)
    onChange?.(teeth, nextSurfaces)
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-xl p-3 bg-gray-50 space-y-3">
        <div>
          <p className="text-xs text-center text-muted-foreground mb-2 font-medium">UPPER</p>
          <div className="flex justify-center gap-0.5 flex-wrap">
            {ADULT_TEETH.upper.map(n => (
              <ToothIcon key={n} number={n} selected={teeth.includes(n)} onClick={() => toggleTooth(n)} />
            ))}
          </div>
        </div>
        <div className="border-t border-dashed" />
        <div>
          <div className="flex justify-center gap-0.5 flex-wrap">
            {ADULT_TEETH.lower.map(n => (
              <ToothIcon key={n} number={n} selected={teeth.includes(n)} onClick={() => toggleTooth(n)} />
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2 font-medium">LOWER</p>
        </div>
      </div>

      {teeth.length > 0 && !readOnly && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Selected: {teeth.sort((a,b) => a-b).join(", ")}</p>
          {activeTooth && (
            <div>
              <p className="text-xs font-medium mb-1">Surfaces for tooth {activeTooth}:</p>
              <div className="flex flex-wrap gap-1.5">
                {SURFACES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSurface(activeTooth, s)}
                    className={cn(
                      "text-xs px-2 py-1 rounded border transition-colors",
                      (surfaces[activeTooth] || []).includes(s)
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-gray-200 hover:border-primary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {teeth.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {teeth.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTooth(t)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded border",
                    activeTooth === t ? "bg-primary text-white" : "bg-white hover:border-primary"
                  )}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {readOnly && teeth.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground">Teeth: {teeth.sort((a,b) => a-b).join(", ")}</p>
          {Object.entries(surfaces).filter(([,s]) => s.length > 0).map(([tooth, slist]) => (
            <p key={tooth} className="text-xs text-muted-foreground">#{tooth}: {slist.join(", ")}</p>
          ))}
        </div>
      )}
    </div>
  )
}
