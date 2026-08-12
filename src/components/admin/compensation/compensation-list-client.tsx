"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createCompensationProgram,
  cloneAndCreateNewVersion,
  publishProgram,
  archiveProgram,
} from "@/app/actions/compensation";
import { ProgramBuilderClient } from "./program-builder-client";
import {
  Plus,
  Copy,
  CheckCircle2,
  Archive,
  Sliders,
  Layers,
  Users,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface ProgramRecordUI {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: string;
  isLatest: boolean;
  branch: string | null;
  updatedBy: string | null;
  updatedAt: Date | string;
  rules: Array<{
    id: string;
    ruleType: string;
    priority: number;
    enabled: boolean;
    behavior: string;
    config: unknown;
  }>;
  assignments: Array<{
    id: string;
    targetType: string;
    targetId: string | null;
  }>;
}

interface Props {
  clinicSlug: string;
  programs: ProgramRecordUI[];
}

export function CompensationListClient({
  clinicSlug,
  programs: initialPrograms,
}: Props) {
  const [programs, setPrograms] = useState<ProgramRecordUI[]>(initialPrograms);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProgram = programs.find((p) => p.id === activeProgramId);

  async function handleCreateProgram() {
    if (!name.trim()) {
      toast.error("Please enter a program name");
      return;
    }

    setLoading(true);
    const res = await createCompensationProgram(clinicSlug, {
      name,
      description,
      branch,
    });
    setLoading(false);

    if ("error" in res && res.error) {
      toast.error(res.error);
    } else if (res.program) {
      toast.success("Draft compensation program created!");
      const newProgram = res.program as ProgramRecordUI;
      setPrograms((prev) => [newProgram, ...prev]);
      setCreateDialogOpen(false);
      setName("");
      setDescription("");
      setBranch("");
      setActiveProgramId(newProgram.id);
    }
  }

  async function handleClone(programId: string) {
    toast.loading("Cloning to new version...");
    const res = await cloneAndCreateNewVersion(clinicSlug, programId);
    toast.dismiss();
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else if (res.program) {
      toast.success(`Created Version ${res.program.version} draft!`);
      const clonedProg = res.program as ProgramRecordUI;
      setPrograms((prev) => [
        clonedProg,
        ...prev.map((p) =>
          p.name === clonedProg.name ? { ...p, isLatest: false } : p,
        ),
      ]);
      setActiveProgramId(clonedProg.id);
    }
  }

  async function handlePublish(programId: string) {
    const res = await publishProgram(clinicSlug, programId);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else {
      toast.success("Program published successfully!");
      setPrograms(
        programs.map((p) =>
          p.id === programId ? { ...p, status: "PUBLISHED" } : p,
        ),
      );
    }
  }

  async function handleArchive(programId: string) {
    const res = await archiveProgram(clinicSlug, programId);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else {
      toast.success("Program archived");
      setPrograms(
        programs.map((p) =>
          p.id === programId ? { ...p, status: "ARCHIVED" } : p,
        ),
      );
    }
  }

  function handleRulesUpdated(programId: string, updatedRules: unknown[]) {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId
          ? {
              ...p,
              rules: updatedRules as ProgramRecordUI["rules"],
            }
          : p,
      ),
    );
  }

  if (selectedProgram) {
    return (
      <ProgramBuilderClient
        clinicSlug={clinicSlug}
        program={selectedProgram}
        onClose={() => setActiveProgramId(null)}
        onSaveRules={(updatedRules) =>
          handleRulesUpdated(selectedProgram.id, updatedRules)
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" /> Compensation Programs
            Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rule-driven compensation policies, drag-and-drop rule priorities,
            and versioning.
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create Program Draft
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No Compensation Programs
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Create your first rule-driven compensation program to configure
            dentist commission splits, production tiers, and bonuses.
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="bg-primary text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create First Program
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((prog) => (
            <Card
              key={prog.id}
              className="hover:shadow-md transition-shadow border-slate-200"
            >
              <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">
                    v{prog.version}
                  </Badge>
                  <Badge
                    className={`text-[10px] font-bold uppercase ${
                      prog.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        : prog.status === "DRAFT"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {prog.status}
                  </Badge>
                </div>
                {prog.isLatest && (
                  <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Latest Version
                  </span>
                )}
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {prog.name}
                  </h3>
                  {prog.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {prog.description}
                    </p>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span>Rules Configured:</span>
                    <span className="font-bold text-slate-800">
                      {prog.rules.length} rules
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Branch Scope:</span>
                    <span className="font-medium text-slate-700">
                      {prog.branch || "All Branches"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveProgramId(prog.id)}
                    className="flex-1 text-xs font-semibold"
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1" />
                    {prog.status === "PUBLISHED" ? "View Rules" : "Edit Rules"}
                  </Button>

                  {prog.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() => handlePublish(prog.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Publish
                    </Button>
                  )}

                  {prog.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClone(prog.id)}
                      className="text-xs font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" /> Clone (v
                      {prog.version + 1})
                    </Button>
                  )}

                  {prog.status !== "ARCHIVED" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleArchive(prog.id)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Program Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Compensation Program</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div className="space-y-1">
              <Label>Program Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. General Dentist Standard Program"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label>Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Base 40% split with 50% root canal override"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label>Branch (Optional)</Label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Main Clinic, Downtown Branch"
                className="h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateProgram}
              disabled={loading}
              className="bg-primary text-white"
            >
              {loading ? "Creating..." : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
