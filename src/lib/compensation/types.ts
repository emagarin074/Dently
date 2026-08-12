export type RuleType =
  | "REVENUE_SPLIT"
  | "PROCEDURE_OVERRIDE"
  | "PRODUCTION_TIER"
  | "VOLUME_BONUS"
  | "FIXED_BONUS"
  | "SALARY"
  | "COLLECTION_RULE"
  | "LAB_FEE_RULE"
  | "PROMOTION_RULE"
  | "INSURANCE_RULE"
  | "REFERRAL_COMMISSION"
  | "ASSISTANT_SHARE"
  | "HYGIENIST_SHARE";

export type RuleBehavior = "REPLACE" | "MODIFY" | "ADD" | "BLOCK";

export interface TreatmentInput {
  treatmentId?: string;
  patientId?: string;
  dentistId: string;
  dentistRole?: string;
  dentistSpecialization?: string;
  procedureName: string;
  branch?: string;
  grossFee: number;
  discount?: number;
  labFee?: number;
  tax?: number;
  paymentStatus?: "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID";
  treatmentStatus?: "PENDING" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  isPromotional?: boolean;
  insuranceClaimed?: boolean;
  insuranceAmount?: number;
  patientPaidAmount?: number;
  referralDentistId?: string;
  assistantUserId?: string;
  hygienistUserId?: string;
  monthlyYtdProduction?: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleType: RuleType;
  priority: number;
  behavior: RuleBehavior;
  description: string;
  commissionChange?: number;
  bonusChange?: number;
  deductionChange?: number;
  adjustmentChange?: number;
  isBlocked?: boolean;
  blockReason?: string;
  appliedValue?: number | string;
}

export interface EngineExecutionOutput {
  programId: string;
  programName: string;
  programVersion: number;
  grossFee: number;
  discount: number;
  labFee: number;
  tax: number;
  netRevenue: number;
  commission: number;
  bonuses: number;
  adjustments: number;
  clinicRevenue: number;
  isBlocked: boolean;
  blockReason?: string;
  status: "PENDING" | "PAYABLE" | "BLOCKED" | "PAID";
  appliedRules: RuleEvaluationResult[];
}

export interface RuleEvaluator {
  ruleType: RuleType;
  evaluate(
    config: Record<string, unknown>,
    input: TreatmentInput,
    currentCommission: number,
    currentBonus: number,
    currentAdjustment: number,
  ): RuleEvaluationResult;
}
