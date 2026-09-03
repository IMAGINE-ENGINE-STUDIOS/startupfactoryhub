// Barrel export for the Basic Plan feature. Internal imports outside this
// folder should go through here so the feature boundary stays explicit.
export { default as BasicPlanBrochure } from "@/pages/BasicPlanBrochure";
export { useBasicPlan, formatCents } from "./hooks/useBasicPlan";
export { useMembershipAccess } from "./hooks/useMembershipAccess";
export { default as MembershipGate, useMembershipPrompt } from "./components/MembershipGate";
export { default as MembershipUpgradeDialog } from "./components/MembershipUpgradeDialog";
export { DEFAULT_ENTITLEMENTS } from "./config/entitlements";
export * as basicPlanApi from "./api/basicPlanApi";
export type {
  BasicPlanConfig,
  BillingCycle,
  Entitlement,
} from "./types";
