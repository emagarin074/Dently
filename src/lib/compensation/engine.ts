import {
  TreatmentInput,
  EngineExecutionOutput,
  RuleEvaluationResult,
} from "./types";
import { evaluatorsRegistry } from "./evaluators";

export interface ProgramRuleRecord {
  id: string;
  ruleType: string;
  priority: number;
  enabled: boolean;
  behavior: string;
  config: Record<string, unknown>;
}

export interface ProgramData {
  id: string;
  name: string;
  version: number;
  rules: ProgramRuleRecord[];
}

export function runCompensationEngine(
  program: ProgramData,
  input: TreatmentInput,
): EngineExecutionOutput {
  const gross = Number(input.grossFee || 0);
  const discount = Number(input.discount || 0);
  const labFee = Number(input.labFee || 0);
  const tax = Number(input.tax || 0);
  const netRevenue = Math.max(0, gross - discount - labFee - tax);

  let currentCommission = 0;
  let currentBonuses = 0;
  let currentAdjustments = 0;
  let isBlocked = false;
  let blockReason: string | undefined = undefined;

  const appliedRules: RuleEvaluationResult[] = [];

  // Sort rules by priority ascending
  const sortedRules = [...program.rules]
    .filter((r) => r.enabled)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const evaluator = evaluatorsRegistry[rule.ruleType];
    if (!evaluator) continue;

    const configWithId = {
      ...rule.config,
      ruleId: rule.id,
      priority: rule.priority,
    };
    const result = evaluator.evaluate(
      configWithId,
      input,
      currentCommission,
      currentBonuses,
      currentAdjustments,
    );

    appliedRules.push(result);

    if (result.isBlocked) {
      isBlocked = true;
      blockReason = result.blockReason || "Blocked by compensation rule";
      break;
    }

    if (
      result.behavior === "REPLACE" &&
      result.commissionChange !== undefined
    ) {
      currentCommission = result.commissionChange;
    } else if (result.behavior === "ADD") {
      if (result.bonusChange !== undefined) {
        currentBonuses += result.bonusChange;
      }
      if (result.commissionChange !== undefined) {
        currentCommission += result.commissionChange;
      }
    } else if (result.behavior === "MODIFY") {
      if (result.deductionChange !== undefined) {
        currentAdjustments -= result.deductionChange;
      }
      if (result.adjustmentChange !== undefined) {
        currentAdjustments += result.adjustmentChange;
      }
    }
  }

  const finalCommission = isBlocked
    ? 0
    : Math.max(0, currentCommission + currentAdjustments);
  const finalBonuses = isBlocked ? 0 : currentBonuses;

  const totalDentistPayout = finalCommission + finalBonuses;
  const clinicRevenue = Math.max(0, netRevenue - totalDentistPayout);

  return {
    programId: program.id,
    programName: program.name,
    programVersion: program.version,
    grossFee: gross,
    discount,
    labFee,
    tax,
    netRevenue,
    commission: Number(finalCommission.toFixed(2)),
    bonuses: Number(finalBonuses.toFixed(2)),
    adjustments: Number(currentAdjustments.toFixed(2)),
    clinicRevenue: Number(clinicRevenue.toFixed(2)),
    isBlocked,
    blockReason,
    status: isBlocked ? "BLOCKED" : "PAYABLE",
    appliedRules,
  };
}
