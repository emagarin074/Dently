"use client";

import {
  SectionBlock,
  SectionType,
  DEFAULT_SECTION_CONTENT,
} from "@/lib/website-builder/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SECTION_LABELS, SECTION_ICONS } from "./section-list";
import { X } from "lucide-react";

const ALL_SECTION_TYPES: SectionType[] = [
  "hero",
  "services",
  "team",
  "booking",
  "about",
  "testimonials",
  "gallery",
  "faq",
  "contact",
  "cta",
  "custom",
];

interface Props {
  existingSections: SectionBlock[];
  onAdd: (section: SectionBlock) => void;
  onClose: () => void;
}

function generateSectionId(type: SectionType): string {
  return `${type}-${Date.now().toString(36)}`;
}

export function AddSectionDialog({ existingSections, onAdd, onClose }: Props) {
  function handleAdd(type: SectionType) {
    const id = generateSectionId(type);
    const section: SectionBlock = {
      id,
      type,
      enabled: true,
      order: existingSections.length,
      layout: "default",
      content: { ...DEFAULT_SECTION_CONTENT[type] },
      style: { padding: "lg" },
    };
    onAdd(section);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add Section</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ALL_SECTION_TYPES.map((type) => {
              const Icon = SECTION_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => handleAdd(type)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {SECTION_LABELS[type]}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
