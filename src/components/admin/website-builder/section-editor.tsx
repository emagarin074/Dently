"use client";

import { SectionBlock, LayoutVariant } from "@/lib/website-builder/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SECTION_LABELS } from "./section-list";

interface Props {
  section: SectionBlock;
  sections: SectionBlock[];
  clinic: {
    name: string;
    description: string | null;
    procedures: {
      id: string;
      name: string;
      description: string | null;
      category: string | null;
    }[];
    users: { id: string; name: string; specialization: string | null }[];
  } | null;
  onUpdateContent: (content: Record<string, unknown>) => void;
  onUpdateStyle: (style: Partial<SectionBlock["style"]>) => void;
  onUpdateLayout: (layout: LayoutVariant) => void;
}

const LAYOUTS: { value: LayoutVariant; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "centered", label: "Centered" },
  { value: "split", label: "Split" },
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "minimal", label: "Minimal" },
];

const PADDINGS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];
export function SectionEditor({
  section,
  sections,
  clinic,
  onUpdateContent,
  onUpdateStyle,
  onUpdateLayout,
}: Props) {
  const content = section.content as Record<string, unknown>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {SECTION_LABELS[section.type]} Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layout & Style */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={section.layout}
              onValueChange={(v) => onUpdateLayout(v as LayoutVariant)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUTS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Padding</Label>
            <Select
              value={section.style.padding || "lg"}
              onValueChange={(v) =>
                onUpdateStyle({
                  padding: v as SectionBlock["style"]["padding"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PADDINGS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={section.style.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdateStyle({ backgroundColor: e.target.value })
                }
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={section.style.backgroundColor || ""}
                onChange={(e) =>
                  onUpdateStyle({ backgroundColor: e.target.value })
                }
                placeholder="Default"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={section.style.textColor || "#000000"}
                onChange={(e) => onUpdateStyle({ textColor: e.target.value })}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={section.style.textColor || ""}
                onChange={(e) => onUpdateStyle({ textColor: e.target.value })}
                placeholder="Inherit"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Content fields based on section type */}
        <ContentFields
          type={section.type}
          content={content}
          clinic={clinic}
          sections={sections}
          onUpdate={onUpdateContent}
        />
      </CardContent>
    </Card>
  );
}

function ContentFields({
  type,
  content,
  clinic,
  sections,
  onUpdate,
}: {
  type: SectionBlock["type"];
  content: Record<string, unknown>;
  clinic: Props["clinic"];
  sections: SectionBlock[];
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  switch (type) {
    case "hero":
      return (
        <div className="space-y-4">
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-semibold text-sm">Navigation Bar</h4>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showNavBar !== false}
                onCheckedChange={(v) => onUpdate({ showNavBar: v })}
              />
              <Label className="text-sm">Show Navigation Bar</Label>
            </div>
            {content.showNavBar !== false && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Logo Image URL</Label>
                    <Input
                      value={(content.logoUrl as string) || ""}
                      onChange={(e) => onUpdate({ logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo Text</Label>
                    <Input
                      value={(content.logoText as string) || ""}
                      onChange={(e) => onUpdate({ logoText: e.target.value })}
                      placeholder={clinic?.name || "Logo Text"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo Text Font</Label>
                    <Select
                      value={(content.logoFont as string) || "inter"}
                      onValueChange={(v) => onUpdate({ logoFont: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="poppins">Poppins</SelectItem>
                        <SelectItem value="playfair">
                          Playfair Display
                        </SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Navbar Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={(content.navBarBgColor as string) || "#ffffff"}
                        onChange={(e) =>
                          onUpdate({ navBarBgColor: e.target.value })
                        }
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={(content.navBarBgColor as string) || ""}
                        onChange={(e) =>
                          onUpdate({ navBarBgColor: e.target.value })
                        }
                        placeholder="Transparent"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Navbar Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={(content.navBarTextColor as string) || "#000000"}
                        onChange={(e) =>
                          onUpdate({ navBarTextColor: e.target.value })
                        }
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={(content.navBarTextColor as string) || ""}
                        onChange={(e) =>
                          onUpdate({ navBarTextColor: e.target.value })
                        }
                        placeholder="Inherit"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <NavLinksEditor
                    items={
                      (content.navLinks as {
                        sectionId: string;
                        label: string;
                      }[]) || []
                    }
                    sections={sections}
                    onChange={(items) => onUpdate({ navLinks: items })}
                  />
                </div>
              </>
            )}
          </div>

          <Separator />
          <h4 className="font-semibold text-sm">Banner Content</h4>
          <div className="space-y-2">
            <Label>Content Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={(content.bannerTextColor as string) || "#ffffff"}
                onChange={(e) => onUpdate({ bannerTextColor: e.target.value })}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={(content.bannerTextColor as string) || ""}
                onChange={(e) => onUpdate({ bannerTextColor: e.target.value })}
                placeholder="Inherit"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder={clinic?.name || "Your Clinic Name"}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use clinic name
            </p>
          </div>
          <div className="space-y-2">
            <Label>Subheading</Label>
            <Textarea
              value={(content.subheading as string) || ""}
              onChange={(e) => onUpdate({ subheading: e.target.value })}
              placeholder={clinic?.description || "Your clinic description"}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Button Text</Label>
            <Input
              value={(content.ctaText as string) || ""}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="Book an Appointment"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showAddress !== false}
                onCheckedChange={(v) => onUpdate({ showAddress: v })}
              />
              <Label className="text-sm">Show Address</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showPhone !== false}
                onCheckedChange={(v) => onUpdate({ showPhone: v })}
              />
              <Label className="text-sm">Show Phone</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showEmail !== false}
                onCheckedChange={(v) => onUpdate({ showEmail: v })}
              />
              <Label className="text-sm">Show Email</Label>
            </div>
          </div>
        </div>
      );

    case "services":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Our Services"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheading</Label>
            <Input
              value={(content.subheading as string) || ""}
              onChange={(e) => onUpdate({ subheading: e.target.value })}
              placeholder="Quality dental care"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showPrices !== false}
                onCheckedChange={(v) => onUpdate({ showPrices: v })}
              />
              <Label className="text-sm">Show Prices</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showDescriptions !== false}
                onCheckedChange={(v) => onUpdate({ showDescriptions: v })}
              />
              <Label className="text-sm">Show Descriptions</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Services are loaded from your Procedures settings.{" "}
            {clinic?.procedures.length || 0} active procedures.
          </p>
        </div>
      );

    case "team":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Meet Our Team"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheading</Label>
            <Input
              value={(content.subheading as string) || ""}
              onChange={(e) => onUpdate({ subheading: e.target.value })}
              placeholder="Experienced professionals"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={content.showSpecialization !== false}
              onCheckedChange={(v) => onUpdate({ showSpecialization: v })}
            />
            <Label className="text-sm">Show Specialization</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Team members are loaded from your Users settings.{" "}
            {clinic?.users.length || 0} active dentists.
          </p>
        </div>
      );

    case "booking":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Book an Appointment"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheading</Label>
            <Input
              value={(content.subheading as string) || ""}
              onChange={(e) => onUpdate({ subheading: e.target.value })}
              placeholder="Schedule your visit"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showDentistPreference !== false}
                onCheckedChange={(v) => onUpdate({ showDentistPreference: v })}
              />
              <Label className="text-sm">Dentist Preference</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showConcernField !== false}
                onCheckedChange={(v) => onUpdate({ showConcernField: v })}
              />
              <Label className="text-sm">Concern Field</Label>
            </div>
          </div>
        </div>
      );

    case "about":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="About Us"
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={(content.content as string) || ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Tell visitors about your clinic, your mission, and what makes you special..."
              rows={5}
            />
          </div>
        </div>
      );

    case "testimonials":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="What Our Patients Say"
            />
          </div>
          <TestimonialEditor
            items={
              (content.items as {
                name: string;
                text: string;
                rating: number;
              }[]) || []
            }
            onChange={(items) => onUpdate({ items })}
          />
        </div>
      );

    case "faq":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Frequently Asked Questions"
            />
          </div>
          <FaqEditor
            items={
              (content.items as { question: string; answer: string }[]) || []
            }
            onChange={(items) => onUpdate({ items })}
          />
        </div>
      );

    case "contact":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Contact Us"
            />
          </div>
          <div className="space-y-2">
            <Label>Google Maps Embed URL</Label>
            <Input
              value={(content.mapEmbedUrl as string) || ""}
              onChange={(e) => onUpdate({ mapEmbedUrl: e.target.value })}
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showMap === true}
                onCheckedChange={(v) => onUpdate({ showMap: v })}
              />
              <Label className="text-sm">Show Map</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showForm !== false}
                onCheckedChange={(v) => onUpdate({ showForm: v })}
              />
              <Label className="text-sm">Show Contact Form</Label>
            </div>
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Ready to Transform Your Smile?"
            />
          </div>
          <div className="space-y-2">
            <Label>Subheading</Label>
            <Input
              value={(content.subheading as string) || ""}
              onChange={(e) => onUpdate({ subheading: e.target.value })}
              placeholder="Book your appointment today"
            />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input
              value={(content.buttonText as string) || ""}
              onChange={(e) => onUpdate({ buttonText: e.target.value })}
              placeholder="Book Now"
            />
          </div>
        </div>
      );

    case "custom":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={(content.heading as string) || ""}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Section Heading"
            />
          </div>
          <div className="space-y-2">
            <Label>Content (HTML supported)</Label>
            <Textarea
              value={(content.content as string) || ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="<p>Your custom content here...</p>"
              rows={8}
            />
          </div>
        </div>
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          No editable fields for this section type.
        </p>
      );
  }
}

// ─── Testimonial Editor ──────────────────────────────────────────────────────

function TestimonialEditor({
  items,
  onChange,
}: {
  items: { name: string; text: string; rating: number }[];
  onChange: (items: { name: string; text: string; rating: number }[]) => void;
}) {
  function addItem() {
    onChange([...items, { name: "", text: "", rating: 5 }]);
  }
  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function updateItem(index: number, field: string, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <Label>Testimonials</Label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Patient Name"
              value={item.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => removeItem(i)}
              className="text-destructive text-sm px-2"
            >
              ✕
            </button>
          </div>
          <Textarea
            placeholder="Their testimonial..."
            value={item.text}
            onChange={(e) => updateItem(i, "text", e.target.value)}
            rows={2}
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-sm text-primary hover:underline"
      >
        + Add testimonial
      </button>
    </div>
  );
}

// ─── FAQ Editor ──────────────────────────────────────────────────────────────

function FaqEditor({
  items,
  onChange,
}: {
  items: { question: string; answer: string }[];
  onChange: (items: { question: string; answer: string }[]) => void;
}) {
  function addItem() {
    onChange([...items, { question: "", answer: "" }]);
  }
  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function updateItem(index: number, field: string, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <Label>Questions & Answers</Label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Question"
              value={item.question}
              onChange={(e) => updateItem(i, "question", e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => removeItem(i)}
              className="text-destructive text-sm px-2"
            >
              ✕
            </button>
          </div>
          <Textarea
            placeholder="Answer"
            value={item.answer}
            onChange={(e) => updateItem(i, "answer", e.target.value)}
            rows={2}
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-sm text-primary hover:underline"
      >
        + Add question
      </button>
    </div>
  );
}

// ─── Nav Links Editor ────────────────────────────────────────────────────────

function NavLinksEditor({
  items,
  sections,
  onChange,
}: {
  items: { sectionId: string; label: string }[];
  sections: SectionBlock[];
  onChange: (items: { sectionId: string; label: string }[]) => void;
}) {
  const availableSections = sections.filter(
    (s) => s.type !== "hero" && s.enabled,
  );

  function addItem() {
    onChange([...items, { sectionId: "", label: "" }]);
  }
  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function updateItem(index: number, field: string, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-fill label based on section type when selected if label is empty
    if (field === "sectionId" && !updated[index].label) {
      const sectionType = sections.find((s) => s.id === value)?.type;
      if (sectionType) {
        updated[index].label = SECTION_LABELS[sectionType] || "";
      }
    }
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <Label>Navigation Links</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Select
            value={item.sectionId}
            onValueChange={(v) => updateItem(i, "sectionId", v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select section..." />
            </SelectTrigger>
            <SelectContent>
              {availableSections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {SECTION_LABELS[s.type] || "Section"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Link Label"
            value={item.label}
            onChange={(e) => updateItem(i, "label", e.target.value)}
            className="flex-1"
          />
          <button
            onClick={() => removeItem(i)}
            className="text-destructive text-sm px-2"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-sm text-primary hover:underline block mt-2"
      >
        + Add Nav Link
      </button>
    </div>
  );
}
