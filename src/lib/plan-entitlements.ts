export type PlanName = "Starter" | "Clinic" | "Enterprise";

export interface PlanEntitlements {
  plan: PlanName;
  maxBranches: number | "custom";
  maxUsers: number | "custom";
  canCreateCustomProcedures: boolean;
  canEditProcedureAdvancedFields: boolean;
  canUseWebsiteBuilder: boolean;
  canUsePayrollAutomation: boolean;
  canUseAdvancedReports: boolean;
  canUseRevenueFormulaBuilder: boolean;
  canUseCustomDocumentTemplates: boolean;
}

export const PLAN_ENTITLEMENTS: Record<PlanName, PlanEntitlements> = {
  Starter: {
    plan: "Starter",
    maxBranches: 1,
    maxUsers: 3,
    canCreateCustomProcedures: false,
    canEditProcedureAdvancedFields: false,
    canUseWebsiteBuilder: false,
    canUsePayrollAutomation: false,
    canUseAdvancedReports: false,
    canUseRevenueFormulaBuilder: false,
    canUseCustomDocumentTemplates: false,
  },
  Clinic: {
    plan: "Clinic",
    maxBranches: 3,
    maxUsers: 10,
    canCreateCustomProcedures: true,
    canEditProcedureAdvancedFields: true,
    canUseWebsiteBuilder: true,
    canUsePayrollAutomation: true,
    canUseAdvancedReports: true,
    canUseRevenueFormulaBuilder: true,
    canUseCustomDocumentTemplates: true,
  },
  Enterprise: {
    plan: "Enterprise",
    maxBranches: "custom",
    maxUsers: "custom",
    canCreateCustomProcedures: true,
    canEditProcedureAdvancedFields: true,
    canUseWebsiteBuilder: true,
    canUsePayrollAutomation: true,
    canUseAdvancedReports: true,
    canUseRevenueFormulaBuilder: true,
    canUseCustomDocumentTemplates: true,
  },
};

export function normalizePlanName(plan?: string | null): PlanName {
  if (plan === "Clinic" || plan === "Enterprise") return plan;
  return "Starter";
}

export function getPlanEntitlements(plan?: string | null) {
  return PLAN_ENTITLEMENTS[normalizePlanName(plan)];
}

export function getDefaultBranchLimitForPlan(plan?: string | null) {
  const maxBranches = getPlanEntitlements(plan).maxBranches;
  return typeof maxBranches === "number" ? maxBranches : 1;
}
