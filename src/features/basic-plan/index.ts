// Barrel export for the Basic Plan feature. Internal imports outside this
// folder should go through here so the feature boundary stays explicit.
export { default as BasicPlanLab } from "@/pages/BasicPlanLab";
export { useBasicPlan, formatCents } from "./hooks/useBasicPlan";
export { useSimulatedMembership } from "./hooks/useSimulatedMembership";
export { DEFAULT_ENTITLEMENTS } from "./config/entitlements";
export * as basicPlanApi from "./api/basicPlanApi";
export type {
  BasicPlanConfig,
  BillingCycle,
  Entitlement,
  SimulatedRole,
} from "./types";
