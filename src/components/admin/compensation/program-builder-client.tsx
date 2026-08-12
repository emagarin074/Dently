"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateDraftProgramRules } from "@/app/actions/compensation";
import { RuleBehavior, RuleType } from "@/lib/compensation/types";
import { CalculationPreviewPanel } from "./calculation-preview-panel";
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Layers,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

export interface ProgramRuleUI {
  id?: string;
  ruleType: RuleType;
  priority: number;
  enabled: boolean;
  behavior: RuleBehavior;
  config: Record<string, unknown>;
}

interface Props {
  clinicSlug: string;
  program: {
    id: string;
    name: string;
    version: number;
    status: string;
    rules: Array<{
      id: string;
      ruleType: string;
      priority: number;
      enabled: boolean;
      behavior: string;
      config: unknown;
    }>;
  };
  onClose: () => void;
  onSaveRules?: (rules: ProgramRuleUI[]) => void;
}

const AVAILABLE_RULE_TYPES: Array<{
  type: RuleType;
  name: string;
  defaultBehavior: RuleBehavior;
  description: string;
}> = [
  {
    type: "REVENUE_SPLIT",
    name: "Revenue Split",
    defaultBehavior: "REPLACE",
    description: "Base percentage or fixed split",
  },
  {
    type: "PROCEDURE_OVERRIDE",
    name: "Procedure Override",
    defaultBehavior: "REPLACE",
    description: "Specific procedure commission override",
  },
  {
    type: "LAB_FEE_RULE",
    name: "Laboratory Fee Rule",
    defaultBehavior: "MODIFY",
    description: "Deduct lab hardware fees before/after split",
  },
  {
    type: "COLLECTION_RULE",
    name: "Collection Rule",
    defaultBehavior: "BLOCK",
    description: "Block payout until invoice or payment condition",
  },
  {
    type: "PRODUCTION_TIER",
    name: "Production Tier",
    defaultBehavior: "REPLACE",
    description: "Tiered percentage based on monthly YTD",
  },
  {
    type: "VOLUME_BONUS",
    name: "Volume Bonus",
    defaultBehavior: "ADD",
    description: "Bonus add-on when threshold is reached",
  },
  {
    type: "FIXED_BONUS",
    name: "Fixed Bonus",
    defaultBehavior: "ADD",
    description: "Fixed bonus amount",
  },
  {
    type: "SALARY",
    name: "Salary",
    defaultBehavior: "REPLACE",
    description: "Fixed base monthly salary",
  },
  {
    type: "REFERRAL_COMMISSION",
    name: "Referral Commission",
    defaultBehavior: "ADD",
    description: "Referral dentist incentive",
  },
  {
    type: "ASSISTANT_SHARE",
    name: "Assistant Share",
    defaultBehavior: "ADD",
    description: "Assistant incentive share",
  },
  {
    type: "HYGIENIST_SHARE",
    name: "Hygienist Share",
    defaultBehavior: "ADD",
    description: "Hygienist incentive share",
  },
];

export function ProgramBuilderClient({
  clinicSlug,
  program,
  onClose,
  onSaveRules,
}: Props) {
  const [rules, setRules] = useState<ProgramRuleUI[]>(
    program.rules.map((r) => ({
      id: r.id,
      ruleType: r.ruleType as RuleType,
      priority: r.priority,
      enabled: r.enabled,
      behavior: r.behavior as RuleBehavior,
      config: (r.config as Record<string, unknown>) || {},
    })),
  );

  const [saving, setSaving] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // Form state for rule editor modal
  const [selectedType, setSelectedType] = useState<RuleType>("REVENUE_SPLIT");
  const [selectedBehavior, setSelectedBehavior] =
    useState<RuleBehavior>("REPLACE");
  const [percentage, setPercentage] = useState("40");
  const [fixedAmount, setFixedAmount] = useState("0");
  const [procedureName, setProcedureName] = useState("");
  const [calculationBase, setCalculationBase] = useState("Gross Fee");
  const [payableWhen, setPayableWhen] = useState("Fully Paid");
  const [deductionTiming, setDeductionTiming] = useState(
    "Deduct Before Commission",
  );

  const isReadOnly =
    program.status === "PUBLISHED" || program.status === "ARCHIVED";

  function handleOpenAddModal() {
    setEditingRuleIndex(null);
    setSelectedType("REVENUE_SPLIT");
    setSelectedBehavior("REPLACE");
    setPercentage("40");
    setFixedAmount("0");
    setProcedureName("");
    setCalculationBase("Gross Fee");
    setPayableWhen("Fully Paid");
    setDeductionTiming("Deduct Before Commission");
    setRuleModalOpen(true);
  }

  function handleOpenEditModal(index: number) {
    const r = rules[index];
    setEditingRuleIndex(index);
    setSelectedType(r.ruleType);
    setSelectedBehavior(r.behavior);
    setPercentage(String(r.config.percentage ?? 40));
    setFixedAmount(String(r.config.fixedAmount ?? 0));
    setProcedureName(String(r.config.procedure ?? ""));
    setCalculationBase(String(r.config.calculationBase ?? "Gross Fee"));
    setPayableWhen(String(r.config.payableWhen ?? "Fully Paid"));
    setDeductionTiming(
      String(r.config.deductionTiming ?? "Deduct Before Commission"),
    );
    setRuleModalOpen(true);
  }

  function handleSaveRuleConfig() {
    const config: Record<string, unknown> = {};
    if (selectedType === "REVENUE_SPLIT") {
      config.percentage = parseFloat(percentage) || 0;
      config.fixedAmount = parseFloat(fixedAmount) || 0;
      config.calculationBase = calculationBase;
    } else if (selectedType === "PROCEDURE_OVERRIDE") {
      config.procedure = procedureName;
      config.percentage = parseFloat(percentage) || 0;
      config.fixedAmount = parseFloat(fixedAmount) || 0;
    } else if (selectedType === "LAB_FEE_RULE") {
      config.deductionTiming = deductionTiming;
    } else if (selectedType === "COLLECTION_RULE") {
      config.payableWhen = payableWhen;
    } else {
      config.percentage = parseFloat(percentage) || 0;
      config.fixedAmount = parseFloat(fixedAmount) || 0;
    }

    const newRule: ProgramRuleUI = {
      ruleType: selectedType,
      priority:
        editingRuleIndex !== null
          ? rules[editingRuleIndex].priority
          : rules.length + 1,
      enabled:
        editingRuleIndex !== null ? rules[editingRuleIndex].enabled : true,
      behavior: selectedBehavior,
      config,
    };

    if (editingRuleIndex !== null) {
      const updated = [...rules];
      updated[editingRuleIndex] = newRule;
      setRules(updated);
    } else {
      setRules([...rules, newRule]);
    }

    setRuleModalOpen(false);
    toast.success("Rule updated in draft program");
  }

  function moveRule(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rules.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...rules];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    // Update priorities
    const updated = reordered.map((r, i) => ({ ...r, priority: i + 1 }));
    setRules(updated);
  }

  function removeRule(index: number) {
    const updated = rules
      .filter((_, i) => i !== index)
      .map((r, i) => ({ ...r, priority: i + 1 }));
    setRules(updated);
  }

  function toggleRuleEnabled(index: number, enabled: boolean) {
    const updated = [...rules];
    updated[index].enabled = enabled;
    setRules(updated);
  }

  async function handleSaveProgram() {
    setSaving(true);
    const res = await updateDraftProgramRules(clinicSlug, program.id, rules);
    setSaving(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else {
      toast.success("Compensation rules saved successfully!");
      onSaveRules?.(rules);
      onClose();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{program.name}</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              v{program.version}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                program.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-800"
                  : program.status === "DRAFT"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {program.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure draggable rules, evaluation priorities, and behaviors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {!isReadOnly && (
            <Button
              size="sm"
              onClick={handleSaveProgram}
              disabled={saving}
              className="bg-primary text-white font-bold"
            >
              <Save className="w-4 h-4 mr-1.5" />{" "}
              {saving ? "Saving..." : "Save Program Rules"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Builder Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Rules Evaluation
              Sequence
            </h3>
            {!isReadOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenAddModal}
                className="h-8 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Rule Card
              </Button>
            )}
          </div>

          {rules.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-slate-500">
                No rules added yet. Click &quot;Add Rule Card&quot; to build
                your program.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <Card
                  key={idx}
                  className={`transition-all border ${
                    !rule.enabled
                      ? "opacity-60 bg-slate-50 border-slate-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    {!isReadOnly && (
                      <div className="flex flex-col items-center gap-1 text-slate-400 pt-1">
                        <button
                          type="button"
                          onClick={() => moveRule(idx, "up")}
                          disabled={idx === 0}
                          className="hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <GripVertical className="w-4 h-4 text-slate-300" />
                        <button
                          type="button"
                          onClick={() => moveRule(idx, "down")}
                          disabled={idx === rules.length - 1}
                          className="hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {rule.ruleType.replace("_", " ")}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              rule.behavior === "REPLACE"
                                ? "bg-blue-100 text-blue-800"
                                : rule.behavior === "ADD"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rule.behavior === "BLOCK"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {rule.behavior}
                          </span>
                        </div>

                        {!isReadOnly && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(val) =>
                                toggleRuleEnabled(idx, val)
                              }
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-primary"
                              onClick={() => handleOpenEditModal(idx)}
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-600"
                              onClick={() => removeRule(idx)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 pl-7 space-y-0.5">
                        {rule.ruleType === "REVENUE_SPLIT" && (
                          <p>
                            Base Split:{" "}
                            <span className="font-semibold text-slate-800">
                              {String(rule.config.percentage)}%
                            </span>{" "}
                            on{" "}
                            {String(rule.config.calculationBase || "Gross Fee")}
                          </p>
                        )}
                        {rule.ruleType === "PROCEDURE_OVERRIDE" && (
                          <p>
                            Override for{" "}
                            <span className="font-semibold text-slate-800">
                              {String(rule.config.procedure || "All")}
                            </span>
                            :{" "}
                            <span className="font-semibold text-slate-800">
                              {String(rule.config.percentage)}%
                            </span>
                          </p>
                        )}
                        {rule.ruleType === "COLLECTION_RULE" && (
                          <p>
                            Payable condition:{" "}
                            <span className="font-semibold text-slate-800">
                              {String(rule.config.payableWhen || "Fully Paid")}
                            </span>
                          </p>
                        )}
                        {rule.ruleType === "LAB_FEE_RULE" && (
                          <p>
                            Lab deduction:{" "}
                            <span className="font-semibold text-slate-800">
                              {String(
                                rule.config.deductionTiming ||
                                  "Deduct Before Commission",
                              )}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Live Calculation Preview Column (1 Col) */}
        <div>
          <CalculationPreviewPanel
            clinicSlug={clinicSlug}
            programId={program.id}
          />
        </div>
      </div>

      {/* Rule Editor Modal */}
      <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRuleIndex !== null ? "Edit Rule Card" : "Add Rule Card"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div className="space-y-1">
              <Label>Rule Type</Label>
              <Select
                value={selectedType}
                onValueChange={(val: RuleType) => {
                  setSelectedType(val);
                  const matched = AVAILABLE_RULE_TYPES.find(
                    (t) => t.type === val,
                  );
                  if (matched) setSelectedBehavior(matched.defaultBehavior);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_RULE_TYPES.map((t) => (
                    <SelectItem key={t.type} value={t.type}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Behavior Action</Label>
              <Select
                value={selectedBehavior}
                onValueChange={(val: RuleBehavior) => setSelectedBehavior(val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REPLACE">
                    REPLACE (Overrides calculated value)
                  </SelectItem>
                  <SelectItem value="MODIFY">
                    MODIFY (Adjusts deduction or base)
                  </SelectItem>
                  <SelectItem value="ADD">
                    ADD (Adds bonus/incentive)
                  </SelectItem>
                  <SelectItem value="BLOCK">
                    BLOCK (Stops commission generation)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedType === "REVENUE_SPLIT" ||
              selectedType === "PROCEDURE_OVERRIDE") && (
              <>
                {selectedType === "PROCEDURE_OVERRIDE" && (
                  <div className="space-y-1">
                    <Label>Procedure Name</Label>
                    <Input
                      value={procedureName}
                      onChange={(e) => setProcedureName(e.target.value)}
                      placeholder="e.g. Root Canal Treatment"
                      className="h-9"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Commission Percentage (%)</Label>
                    <Input
                      type="number"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Fixed Amount (₱)</Label>
                    <Input
                      type="number"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </>
            )}

            {selectedType === "COLLECTION_RULE" && (
              <div className="space-y-1">
                <Label>Commission Payable When</Label>
                <Select value={payableWhen} onValueChange={setPayableWhen}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                    <SelectItem value="Partial Payment">
                      Partial Payment
                    </SelectItem>
                    <SelectItem value="Treatment Completed">
                      Treatment Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedType === "LAB_FEE_RULE" && (
              <div className="space-y-1">
                <Label>Lab Fee Deduction Timing</Label>
                <Select
                  value={deductionTiming}
                  onValueChange={setDeductionTiming}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deduct Before Commission">
                      Deduct Before Commission
                    </SelectItem>
                    <SelectItem value="Deduct After Commission">
                      Deduct After Commission
                    </SelectItem>
                    <SelectItem value="Ignore">Ignore Lab Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRuleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRuleConfig}
              className="bg-primary text-white"
            >
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
