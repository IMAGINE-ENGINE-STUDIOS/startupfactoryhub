// Simulated membership state for the /basic-plan preview.
// Local React state only — it never writes to the database, never touches
// localStorage, and does not leak into any other page. When the viewer
// already has a real active membership, that status is reported alongside
// the simulated role so the page can show both.
import { useMemo, useState } from "react";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import type { SimulatedRole } from "../types";

export function useSimulatedMembership() {
  const real = useMembershipStatus();
  const [simulatedRole, setSimulatedRole] = useState<SimulatedRole>("free");

  const isMember = simulatedRole === "basic";

  return useMemo(
    () => ({
      /** Role the simulation is currently pretending the viewer has. */
      simulatedRole,
      setSimulatedRole,
      /** Effective access used by the entitlement grid. */
      isMember,
      /** Real subscription data (informational only on this page). */
      realIsSubscribed: real.isSubscribed,
      realTier: real.tier,
      refetchReal: real.refetch,
    }),
    [simulatedRole, isMember, real.isSubscribed, real.tier, real.refetch]
  );
}
