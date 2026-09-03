// /basic-plan — internal simulation page for the upcoming Basic Plan.
// Not linked from navigation, the landing page or the dashboard while the
// product is in development. All membership state shown here is simulated
// locally; the only real side effect is the optional Stripe test checkout.
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useBasicPlan } from "@/features/basic-plan/hooks/useBasicPlan";
import { useSimulatedMembership } from "@/features/basic-plan/hooks/useSimulatedMembership";
import BasicPlanHero from "@/features/basic-plan/components/BasicPlanHero";
import SimulationControls from "@/features/basic-plan/components/SimulationControls";
import BasicPlanPricingCard from "@/features/basic-plan/components/BasicPlanPricingCard";
import EntitlementGrid from "@/features/basic-plan/components/EntitlementGrid";
import AdminPricePanel from "@/features/basic-plan/components/AdminPricePanel";
import type { BillingCycle } from "@/features/basic-plan/types";

export default function BasicPlanLab() {
  const { plan, entitlements, savingsPercent, savePrices, refetch } = useBasicPlan();
  const {
    simulatedRole,
    setSimulatedRole,
    isMember,
    realIsSubscribed,
    realTier,
  } = useSimulatedMembership();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <BasicPlanHero />

        <SimulationControls
          role={simulatedRole}
          onRoleChange={setSimulatedRole}
          realIsSubscribed={realIsSubscribed}
          realTier={realTier}
        />

        <BasicPlanPricingCard
          plan={plan}
          entitlements={entitlements}
          cycle={cycle}
          onCycleChange={setCycle}
          savingsPercent={savingsPercent}
        />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">
              What {isMember ? "you unlock" : "Basic unlocks"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {entitlements.length} services included in the Basic Plan
            </p>
          </div>
          <EntitlementGrid entitlements={entitlements} isMember={isMember} />
        </section>

        <AdminPricePanel plan={plan} onSave={savePrices} onSaved={refetch} />
      </div>
    </DashboardLayout>
  );
}
