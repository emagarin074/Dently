import { RuleEvaluator } from "../types";

export const RevenueSplitEvaluator: RuleEvaluator = {
  ruleType: "REVENUE_SPLIT",
  evaluate(config, input) {
    const percentage = Number(config.percentage ?? 0);
    const fixedAmount = Number(config.fixedAmount ?? 0);
    const calcBase = (config.calculationBase as string) || "Gross Fee";

    let baseAmount = input.grossFee;
    const discount = input.discount ?? 0;
    const labFee = input.labFee ?? 0;
    const tax = input.tax ?? 0;

    if (calcBase === "Net After Discount") {
      baseAmount = Math.max(0, input.grossFee - discount);
    } else if (calcBase === "Net After Laboratory Fee") {
      baseAmount = Math.max(0, input.grossFee - labFee);
    } else if (calcBase === "Net After Tax") {
      baseAmount = Math.max(0, input.grossFee - tax);
    } else if (calcBase === "Net Revenue") {
      baseAmount = Math.max(0, input.grossFee - discount - labFee - tax);
    }

    const calculated =
      percentage > 0 ? (baseAmount * percentage) / 100 : fixedAmount;

    return {
      ruleId: (config.ruleId as string) || "revenue-split",
      ruleType: "REVENUE_SPLIT",
      priority: Number(config.priority ?? 1),
      behavior: "REPLACE",
      description: `Base Revenue Split (${percentage > 0 ? `${percentage}%` : `$${fixedAmount}`} on ${calcBase})`,
      commissionChange: calculated,
      appliedValue: percentage > 0 ? `${percentage}%` : fixedAmount,
    };
  },
};

export const ProcedureOverrideEvaluator: RuleEvaluator = {
  ruleType: "PROCEDURE_OVERRIDE",
  evaluate(config, input) {
    const targetProcedure = (config.procedure as string) || "";
    const percentage = Number(config.percentage ?? 0);
    const fixedAmount = Number(config.fixedAmount ?? 0);

    const matches =
      targetProcedure.toLowerCase().trim() ===
      input.procedureName.toLowerCase().trim();

    if (!matches) {
      return {
        ruleId: (config.ruleId as string) || "procedure-override",
        ruleType: "PROCEDURE_OVERRIDE",
        priority: Number(config.priority ?? 2),
        behavior: "REPLACE",
        description: `Procedure Override for ${targetProcedure} (No match)`,
      };
    }

    const baseAmount = Math.max(0, input.grossFee - (input.discount ?? 0));
    const calculated =
      percentage > 0 ? (baseAmount * percentage) / 100 : fixedAmount;

    return {
      ruleId: (config.ruleId as string) || "procedure-override",
      ruleType: "PROCEDURE_OVERRIDE",
      priority: Number(config.priority ?? 2),
      behavior: "REPLACE",
      description: `Procedure Override triggered for "${input.procedureName}" (${percentage > 0 ? `${percentage}%` : `$${fixedAmount}`})`,
      commissionChange: calculated,
      appliedValue: percentage > 0 ? `${percentage}%` : fixedAmount,
    };
  },
};

export const LabFeeEvaluator: RuleEvaluator = {
  ruleType: "LAB_FEE_RULE",
  evaluate(config, input, currentCommission) {
    const deductionTiming =
      (config.deductionTiming as string) || "Deduct Before Commission";
    const labFee = input.labFee ?? 0;

    if (labFee <= 0 || deductionTiming === "Ignore") {
      return {
        ruleId: (config.ruleId as string) || "lab-fee-rule",
        ruleType: "LAB_FEE_RULE",
        priority: Number(config.priority ?? 3),
        behavior: "MODIFY",
        description: "Laboratory Fee Rule (No lab fee applied)",
      };
    }

    if (deductionTiming === "Deduct After Commission") {
      const deduction = Math.min(currentCommission, labFee);
      return {
        ruleId: (config.ruleId as string) || "lab-fee-rule",
        ruleType: "LAB_FEE_RULE",
        priority: Number(config.priority ?? 3),
        behavior: "MODIFY",
        description: `Deducted $${labFee.toFixed(2)} Lab Fee from Dentist Commission`,
        deductionChange: deduction,
        appliedValue: labFee,
      };
    }

    return {
      ruleId: (config.ruleId as string) || "lab-fee-rule",
      ruleType: "LAB_FEE_RULE",
      priority: Number(config.priority ?? 3),
      behavior: "MODIFY",
      description: `Laboratory Fee ($${labFee.toFixed(2)}) deducted prior to split`,
      appliedValue: labFee,
    };
  },
};

export const CollectionRuleEvaluator: RuleEvaluator = {
  ruleType: "COLLECTION_RULE",
  evaluate(config, input) {
    const payableWhen = (config.payableWhen as string) || "Fully Paid";
    const paymentStatus = input.paymentStatus || "UNPAID";
    const treatmentStatus = input.treatmentStatus || "COMPLETED";

    let block = false;
    let reason = "";

    if (
      payableWhen === "Treatment Completed" &&
      treatmentStatus !== "COMPLETED"
    ) {
      block = true;
      reason = "Treatment is not yet completed";
    } else if (payableWhen === "Fully Paid" && paymentStatus !== "FULLY_PAID") {
      block = true;
      reason = `Commission blocked: Payment status is ${paymentStatus} (Requires FULLY_PAID)`;
    } else if (
      payableWhen === "Partial Payment" &&
      paymentStatus !== "PARTIALLY_PAID" &&
      paymentStatus !== "FULLY_PAID"
    ) {
      block = true;
      reason = "Commission blocked: Requires at least partial payment";
    }

    return {
      ruleId: (config.ruleId as string) || "collection-rule",
      ruleType: "COLLECTION_RULE",
      priority: Number(config.priority ?? 0),
      behavior: "BLOCK",
      description: block
        ? `Collection Rule Blocked: ${reason}`
        : `Collection Rule Passed (Condition: ${payableWhen})`,
      isBlocked: block,
      blockReason: block ? reason : undefined,
    };
  },
};

export const ProductionTierEvaluator: RuleEvaluator = {
  ruleType: "PRODUCTION_TIER",
  evaluate(config, input) {
    const tiers =
      (config.tiers as Array<{
        min: number;
        max: number;
        percentage: number;
      }>) || [];
    const monthlyYtd = input.monthlyYtdProduction ?? 0;

    const matchedTier = tiers.find(
      (t) => monthlyYtd >= t.min && (t.max === 0 || monthlyYtd <= t.max),
    );

    if (!matchedTier) {
      return {
        ruleId: (config.ruleId as string) || "production-tier",
        ruleType: "PRODUCTION_TIER",
        priority: Number(config.priority ?? 4),
        behavior: "REPLACE",
        description: `Production Tier (Monthly YTD $${monthlyYtd.toFixed(2)} - No tier matched)`,
      };
    }

    const baseAmount = Math.max(0, input.grossFee - (input.discount ?? 0));
    const calculated = (baseAmount * matchedTier.percentage) / 100;

    return {
      ruleId: (config.ruleId as string) || "production-tier",
      ruleType: "PRODUCTION_TIER",
      priority: Number(config.priority ?? 4),
      behavior: "REPLACE",
      description: `Production Tier Triggered (${matchedTier.percentage}% for YTD $${monthlyYtd.toFixed(2)})`,
      commissionChange: calculated,
      appliedValue: `${matchedTier.percentage}%`,
    };
  },
};

export const VolumeBonusEvaluator: RuleEvaluator = {
  ruleType: "VOLUME_BONUS",
  evaluate(config, input) {
    const threshold = Number(config.threshold ?? 0);
    const reward = Number(config.reward ?? 0);
    const monthlyYtd = input.monthlyYtdProduction ?? 0;

    if (threshold > 0 && monthlyYtd >= threshold && reward > 0) {
      return {
        ruleId: (config.ruleId as string) || "volume-bonus",
        ruleType: "VOLUME_BONUS",
        priority: Number(config.priority ?? 5),
        behavior: "ADD",
        description: `Volume Bonus Triggered ($${reward.toFixed(2)} for exceeding $${threshold.toFixed(2)} YTD)`,
        bonusChange: reward,
        appliedValue: reward,
      };
    }

    return {
      ruleId: (config.ruleId as string) || "volume-bonus",
      ruleType: "VOLUME_BONUS",
      priority: Number(config.priority ?? 5),
      behavior: "ADD",
      description: `Volume Bonus (Threshold $${threshold.toFixed(2)} not reached)`,
    };
  },
};

export const FixedBonusEvaluator: RuleEvaluator = {
  ruleType: "FIXED_BONUS",
  evaluate(config) {
    const fixedAmount = Number(config.fixedAmount ?? 0);
    return {
      ruleId: (config.ruleId as string) || "fixed-bonus",
      ruleType: "FIXED_BONUS",
      priority: Number(config.priority ?? 6),
      behavior: "ADD",
      description: `Fixed Bonus ($${fixedAmount.toFixed(2)})`,
      bonusChange: fixedAmount,
      appliedValue: fixedAmount,
    };
  },
};

export const SalaryEvaluator: RuleEvaluator = {
  ruleType: "SALARY",
  evaluate(config) {
    const monthlySalary = Number(config.monthlySalary ?? 0);
    return {
      ruleId: (config.ruleId as string) || "salary",
      ruleType: "SALARY",
      priority: Number(config.priority ?? 7),
      behavior: "REPLACE",
      description: `Monthly Fixed Base Salary ($${monthlySalary.toFixed(2)})`,
      bonusChange: monthlySalary,
      appliedValue: monthlySalary,
    };
  },
};

export const ReferralCommissionEvaluator: RuleEvaluator = {
  ruleType: "REFERRAL_COMMISSION",
  evaluate(config, input) {
    const percentage = Number(config.percentage ?? 0);
    if (input.referralDentistId && percentage > 0) {
      const base = Math.max(0, input.grossFee - (input.discount ?? 0));
      const bonus = (base * percentage) / 100;
      return {
        ruleId: (config.ruleId as string) || "referral-commission",
        ruleType: "REFERRAL_COMMISSION",
        priority: Number(config.priority ?? 8),
        behavior: "ADD",
        description: `Referral Incentive (${percentage}% - $${bonus.toFixed(2)})`,
        bonusChange: bonus,
        appliedValue: `${percentage}%`,
      };
    }
    return {
      ruleId: (config.ruleId as string) || "referral-commission",
      ruleType: "REFERRAL_COMMISSION",
      priority: Number(config.priority ?? 8),
      behavior: "ADD",
      description: "Referral Commission (No referral dentist assigned)",
    };
  },
};

export const AssistantShareEvaluator: RuleEvaluator = {
  ruleType: "ASSISTANT_SHARE",
  evaluate(config, input) {
    const percentage = Number(config.percentage ?? 0);
    if (input.assistantUserId && percentage > 0) {
      const base = Math.max(0, input.grossFee - (input.discount ?? 0));
      const bonus = (base * percentage) / 100;
      return {
        ruleId: (config.ruleId as string) || "assistant-share",
        ruleType: "ASSISTANT_SHARE",
        priority: Number(config.priority ?? 9),
        behavior: "ADD",
        description: `Assistant Incentive Share (${percentage}% - $${bonus.toFixed(2)})`,
        bonusChange: bonus,
        appliedValue: `${percentage}%`,
      };
    }
    return {
      ruleId: (config.ruleId as string) || "assistant-share",
      ruleType: "ASSISTANT_SHARE",
      priority: Number(config.priority ?? 9),
      behavior: "ADD",
      description: "Assistant Share (No assistant assigned)",
    };
  },
};

export const HygienistShareEvaluator: RuleEvaluator = {
  ruleType: "HYGIENIST_SHARE",
  evaluate(config, input) {
    const percentage = Number(config.percentage ?? 0);
    if (input.hygienistUserId && percentage > 0) {
      const base = Math.max(0, input.grossFee - (input.discount ?? 0));
      const bonus = (base * percentage) / 100;
      return {
        ruleId: (config.ruleId as string) || "hygienist-share",
        ruleType: "HYGIENIST_SHARE",
        priority: Number(config.priority ?? 10),
        behavior: "ADD",
        description: `Hygienist Incentive Share (${percentage}% - $${bonus.toFixed(2)})`,
        bonusChange: bonus,
        appliedValue: `${percentage}%`,
      };
    }
    return {
      ruleId: (config.ruleId as string) || "hygienist-share",
      ruleType: "HYGIENIST_SHARE",
      priority: Number(config.priority ?? 10),
      behavior: "ADD",
      description: "Hygienist Share (No hygienist assigned)",
    };
  },
};

export const PromotionRuleEvaluator: RuleEvaluator = {
  ruleType: "PROMOTION_RULE",
  evaluate(config, input) {
    const mode = (config.mode as string) || "Use Discounted Price";
    if (input.isPromotional && mode === "Ignore Promotional Procedures") {
      return {
        ruleId: (config.ruleId as string) || "promotion-rule",
        ruleType: "PROMOTION_RULE",
        priority: Number(config.priority ?? 11),
        behavior: "BLOCK",
        description:
          "Promotion Rule: Promotional procedure ignored for commission",
        isBlocked: true,
        blockReason: "Promotional procedure is excluded from commission",
      };
    }

    return {
      ruleId: (config.ruleId as string) || "promotion-rule",
      ruleType: "PROMOTION_RULE",
      priority: Number(config.priority ?? 11),
      behavior: "MODIFY",
      description: `Promotion Rule Applied (${mode})`,
    };
  },
};

export const InsuranceRuleEvaluator: RuleEvaluator = {
  ruleType: "INSURANCE_RULE",
  evaluate(config, input) {
    const mode = (config.mode as string) || "Patient Payment";
    if (input.insuranceClaimed) {
      return {
        ruleId: (config.ruleId as string) || "insurance-rule",
        ruleType: "INSURANCE_RULE",
        priority: Number(config.priority ?? 12),
        behavior: "MODIFY",
        description: `Insurance Rule Evaluated (${mode} calculation base)`,
      };
    }

    return {
      ruleId: (config.ruleId as string) || "insurance-rule",
      ruleType: "INSURANCE_RULE",
      priority: Number(config.priority ?? 12),
      behavior: "MODIFY",
      description: "Insurance Rule (Standard non-insurance patient)",
    };
  },
};

export const evaluatorsRegistry: Record<string, RuleEvaluator> = {
  REVENUE_SPLIT: RevenueSplitEvaluator,
  PROCEDURE_OVERRIDE: ProcedureOverrideEvaluator,
  LAB_FEE_RULE: LabFeeEvaluator,
  COLLECTION_RULE: CollectionRuleEvaluator,
  PRODUCTION_TIER: ProductionTierEvaluator,
  VOLUME_BONUS: VolumeBonusEvaluator,
  FIXED_BONUS: FixedBonusEvaluator,
  SALARY: SalaryEvaluator,
  REFERRAL_COMMISSION: ReferralCommissionEvaluator,
  ASSISTANT_SHARE: AssistantShareEvaluator,
  HYGIENIST_SHARE: HygienistShareEvaluator,
  PROMOTION_RULE: PromotionRuleEvaluator,
  INSURANCE_RULE: InsuranceRuleEvaluator,
};
