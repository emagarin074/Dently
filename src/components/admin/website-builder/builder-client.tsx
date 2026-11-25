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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  WEBSITE_TEMPLATES,
  getTemplate,
} from "@/lib/website-builder/templates";
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
import { ModernTemplateEditor } from "./modern-template-editor";
import { TemplateThumbnail } from "./template-thumbnail";
import { TemplatePreviewDialog } from "./template-preview-dialog";
import { Eye, Save, Palette, Layers, Plus, LayoutTemplate } from "lucide-react";
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
  const [confirmTemplateId, setConfirmTemplateId] = useState<string | null>(
    null,
  );
  const [previewingTemplateId, setPreviewingTemplateId] = useState<
    string | null
  >(null);

  async function handleSelectTemplate(templateId: string) {
    const result = await initializeWebsitePage(clinicSlug, templateId);
    if ("error" in result) {
      toast.error(result.error);
    } else if (result.page) {
      const p = result.page as unknown as typeof page;
      setPage(p);
      setSections(p?.sections || []);
      setGlobalStyles(p?.globalStyles || DEFAULT_GLOBAL_STYLES);
      setConfirmTemplateId(null);
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
    setSections((prev) => {
      if (prev.length === 0 && currentTemplate?.sections[0]) {
        return [
          {
            ...currentTemplate.sections[0],
            content: { ...currentTemplate.sections[0].content, ...content },
          },
        ];
      }
      return prev.map((s) =>
        s.id === sectionId
          ? { ...s, content: { ...s.content, ...content } }
          : s,
      );
    });
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

  const renderTemplateGrid = (onSelect: (id: string) => void) => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {WEBSITE_TEMPLATES.map((t) => (
        <Card
          key={t.id}
          className="group overflow-hidden border border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            {/* Visual Thumbnail Mockup */}
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <TemplateThumbnail templateId={t.id} />
            </div>

            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <span>{t.preview}</span>
                  <span>{t.name}</span>
                </CardTitle>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                  Template
                </span>
              </div>
              <CardDescription className="text-xs leading-relaxed line-clamp-2">
                {t.description}
              </CardDescription>
            </CardHeader>
          </div>

          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 flex items-center justify-center gap-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewingTemplateId(t.id);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Demo
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs h-8 font-medium cursor-pointer"
                onClick={() => onSelect(t.id)}
              >
                Use Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Template picker (no page configured yet)
  if (!page) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Choose a Template</h2>
          <p className="text-muted-foreground mt-1">
            Select a starting template for your clinic&apos;s public page. You
            can preview live demos or apply immediately and customize it after.
          </p>
        </div>
        {renderTemplateGrid(handleSelectTemplate)}

        <TemplatePreviewDialog
          templateId={previewingTemplateId}
          onClose={() => setPreviewingTemplateId(null)}
          onApply={handleSelectTemplate}
          clinic={clinic}
          clinicSlug={clinicSlug}
        />
      </div>
    );
  }

  const activeSectionData = sections.find((s) => s.id === selectedSection);
  const currentTemplate = getTemplate(page.templateId);
  const isRigid = currentTemplate?.templateType === "rigid";

  if (isRigid) {
    const editorSection =
      sections[0] ||
      (currentTemplate?.sections[0]
        ? { ...currentTemplate.sections[0] }
        : null);

    return (
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">Template Editor</h2>
            <p className="text-sm text-muted-foreground">
              Customize your {currentTemplate?.name} template
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmTemplateId("show-picker")}
            >
              <LayoutTemplate className="h-4 w-4 mr-1" /> Change Template
            </Button>
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

        {editorSection && (
          <ModernTemplateEditor
            section={editorSection}
            onUpdateContent={(content) =>
              handleUpdateContent(editorSection.id, content)
            }
          />
        )}

        {/* Dialog for changing templates from the rigid editor */}
        <Dialog
          open={confirmTemplateId === "show-picker"}
          onOpenChange={(open) => !open && setConfirmTemplateId(null)}
        >
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
              <DialogDescription>
                Preview or select a new template layout for your clinic.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[72vh] overflow-y-auto p-4">
              {renderTemplateGrid((id) => {
                setConfirmTemplateId(id);
              })}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmTemplateId(null)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation dialog for actual template switch */}
        <Dialog
          open={!!confirmTemplateId && confirmTemplateId !== "show-picker"}
          onOpenChange={(open) => !open && setConfirmTemplateId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to apply this template? This will
                overwrite your current sections and global styles. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmTemplateId(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  confirmTemplateId &&
                  confirmTemplateId !== "show-picker" &&
                  handleSelectTemplate(confirmTemplateId)
                }
              >
                Apply Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TemplatePreviewDialog
          templateId={previewingTemplateId}
          onClose={() => setPreviewingTemplateId(null)}
          onApply={(id) => {
            setConfirmTemplateId(id);
          }}
          clinic={clinic}
          clinicSlug={clinicSlug}
        />
      </div>
    );
  }

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
          <TabsTrigger value="templates">
            <LayoutTemplate className="h-4 w-4 mr-1" /> Templates
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
                  sections={sections}
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

        <TabsContent value="templates">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Choose a Template</h3>
              <p className="text-sm text-muted-foreground">
                Warning: Selecting a new template will overwrite your current
                sections and styles.
              </p>
            </div>
            {renderTemplateGrid((id) => setConfirmTemplateId(id))}
          </div>
        </TabsContent>
      </Tabs>

      {showAddSection && (
        <AddSectionDialog
          existingSections={sections}
          onAdd={handleAddSection}
          onClose={() => setShowAddSection(false)}
        />
      )}

      <Dialog
        open={!!confirmTemplateId}
        onOpenChange={(open) => !open && setConfirmTemplateId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply this template? This will overwrite
              your current sections and global styles. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTemplateId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                confirmTemplateId && handleSelectTemplate(confirmTemplateId)
              }
            >
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplatePreviewDialog
        templateId={previewingTemplateId}
        onClose={() => setPreviewingTemplateId(null)}
        onApply={(id) => {
          setConfirmTemplateId(id);
        }}
        clinic={clinic}
        clinicSlug={clinicSlug}
      />
    </div>
  );
}
