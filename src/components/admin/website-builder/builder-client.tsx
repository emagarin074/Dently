"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { WEBSITE_TEMPLATES } from "@/lib/website-builder/templates";
import {
  SectionBlock,
  GlobalStyles,
  DEFAULT_GLOBAL_STYLES,
} from "@/lib/website-builder/types";
import {
  initializeWebsitePage,
  saveWebsiteSections,
  saveWebsiteGlobalStyles,
} from "@/app/actions/website";
import { SectionEditor } from "./section-editor";
import { StyleEditor } from "./style-editor";
import { SectionList } from "./section-list";
import { AddSectionDialog } from "./add-section-dialog";
import { Eye, Save, Palette, Layers, Plus } from "lucide-react";
import Link from "next/link";

interface Props {
  clinicSlug: string;
  initialPage: {
    templateId: string;
    sections: SectionBlock[];
    globalStyles: GlobalStyles;
    isPublished: boolean;
  } | null;
  clinic: {
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    procedures: {
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      priceType: string;
      price: number | null;
      priceMin: number | null;
      priceMax: number | null;
    }[];
    users: { id: string; name: string; specialization: string | null }[];
  } | null;
}

export function WebsiteBuilderClient({
  clinicSlug,
  initialPage,
  clinic,
}: Props) {
  const [page, setPage] = useState(initialPage);
  const [sections, setSections] = useState<SectionBlock[]>(
    initialPage?.sections || [],
  );
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>(
    initialPage?.globalStyles || DEFAULT_GLOBAL_STYLES,
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  async function handleSelectTemplate(templateId: string) {
    const result = await initializeWebsitePage(clinicSlug, templateId);
    if ("error" in result) {
      toast.error(result.error);
    } else if (result.page) {
      const p = result.page as unknown as typeof page;
      setPage(p);
      setSections(p?.sections || []);
      setGlobalStyles(p?.globalStyles || DEFAULT_GLOBAL_STYLES);
      toast.success("Template applied!");
    }
  }

  async function handleSave() {
    setSaving(true);
    const [sectionsResult, stylesResult] = await Promise.all([
      saveWebsiteSections(clinicSlug, sections),
      saveWebsiteGlobalStyles(clinicSlug, globalStyles),
    ]);
    if ("error" in sectionsResult) toast.error(sectionsResult.error);
    else if ("error" in stylesResult) toast.error(stylesResult.error);
    else toast.success("Website saved!");
    setSaving(false);
  }

  function handleReorder(fromIndex: number, toIndex: number) {
    const updated = [...sections];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updated.forEach((s, i) => (s.order = i));
    setSections(updated);
  }

  function handleToggleSection(sectionId: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s)),
    );
  }

  function handleRemoveSection(sectionId: string) {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (selectedSection === sectionId) setSelectedSection(null);
  }

  function handleUpdateContent(
    sectionId: string,
    content: Record<string, unknown>,
  ) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, content: { ...s.content, ...content } }
          : s,
      ),
    );
  }

  function handleUpdateStyle(
    sectionId: string,
    style: Partial<SectionBlock["style"]>,
  ) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, style: { ...s.style, ...style } } : s,
      ),
    );
  }

  function handleUpdateLayout(
    sectionId: string,
    layout: SectionBlock["layout"],
  ) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, layout } : s)),
    );
  }

  function handleAddSection(section: SectionBlock) {
    setSections((prev) => [...prev, { ...section, order: prev.length }]);
    setShowAddSection(false);
  }

  // Template picker (no page configured yet)
  if (!page) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Choose a Template</h2>
          <p className="text-muted-foreground mt-1">
            Select a starting template for your clinic&apos;s public page. You
            can fully customize it after.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WEBSITE_TEMPLATES.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => handleSelectTemplate(t.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">{t.preview}</div>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground text-center">
                  {t.sections.length} sections
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeSectionData = sections.find((s) => s.id === selectedSection);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Website Builder</h2>
          <p className="text-sm text-muted-foreground">
            Customize your public clinic page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/clinic/${clinicSlug}`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
          </Link>
          <Button onClick={handleSave} size="sm" disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">
            <Layers className="h-4 w-4 mr-1" /> Sections
          </TabsTrigger>
          <TabsTrigger value="styles">
            <Palette className="h-4 w-4 mr-1" /> Styles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Section list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Page Sections</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSection(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              <SectionList
                sections={sections}
                selectedId={selectedSection}
                onSelect={setSelectedSection}
                onReorder={handleReorder}
                onToggle={handleToggleSection}
                onRemove={handleRemoveSection}
              />
            </div>

            {/* Section editor */}
            <div className="lg:col-span-2">
              {activeSectionData ? (
                <SectionEditor
                  section={activeSectionData}
                  clinic={clinic}
                  onUpdateContent={(content) =>
                    handleUpdateContent(activeSectionData.id, content)
                  }
                  onUpdateStyle={(style) =>
                    handleUpdateStyle(activeSectionData.id, style)
                  }
                  onUpdateLayout={(layout) =>
                    handleUpdateLayout(activeSectionData.id, layout)
                  }
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Select a section to edit its content and appearance
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="styles">
          <StyleEditor globalStyles={globalStyles} onChange={setGlobalStyles} />
        </TabsContent>
      </Tabs>

      {showAddSection && (
        <AddSectionDialog
          existingSections={sections}
          onAdd={handleAddSection}
          onClose={() => setShowAddSection(false)}
        />
      )}
    </div>
  );
}
