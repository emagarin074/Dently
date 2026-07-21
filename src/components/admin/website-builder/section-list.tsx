"use client";

import { SectionBlock, SectionType } from "@/lib/website-builder/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Image,
  Stethoscope,
  Users,
  CalendarPlus,
  Info,
  MessageSquareQuote,
  ImageIcon,
  HelpCircle,
  Phone,
  Megaphone,
  LayoutTemplate,
  Code,
} from "lucide-react";

const SECTION_ICONS: Record<SectionType, typeof Image> = {
  hero: Image,
  services: Stethoscope,
  team: Users,
  booking: CalendarPlus,
  about: Info,
  testimonials: MessageSquareQuote,
  gallery: ImageIcon,
  faq: HelpCircle,
  contact: Phone,
  cta: Megaphone,
  custom: LayoutTemplate,
  modern_data: LayoutTemplate,
};

const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero Banner",
  services: "Services List",
  team: "Our Team",
  booking: "Booking Form",
  about: "About Us",
  testimonials: "Testimonials",
  gallery: "Photo Gallery",
  faq: "FAQ",
  contact: "Contact Info",
  cta: "Call to Action",
  custom: "Custom Section",
  modern_data: "Modern Template Data",
};

interface Props {
  sections: SectionBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SectionList({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onToggle,
  onRemove,
}: Props) {
  return (
    <div className="space-y-1">
      {sections
        .sort((a, b) => a.order - b.order)
        .map((section, index) => {
          const Icon = SECTION_ICONS[section.type] || Code;
          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors",
                selectedId === section.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent",
                !section.enabled && "opacity-50",
              )}
              onClick={() => onSelect(section.id)}
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorder(index, index - 1);
                  }}
                >
                  <span className="text-xs">▲</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={index === sections.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorder(index, index + 1);
                  }}
                >
                  <span className="text-xs">▼</span>
                </Button>
              </div>

              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium truncate">
                {SECTION_LABELS[section.type]}
              </span>
              <Switch
                checked={section.enabled}
                onCheckedChange={() => onToggle(section.id)}
                onClick={(e) => e.stopPropagation()}
                className="scale-75"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(section.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
    </div>
  );
}

export { SECTION_LABELS, SECTION_ICONS };
