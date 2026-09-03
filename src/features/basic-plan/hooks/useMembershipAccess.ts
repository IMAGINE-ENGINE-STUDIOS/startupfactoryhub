// Real (non-simulated) membership gating for the whole app.
//
// Free accounts can browse, but the platform features listed in
// DEFAULT_ENTITLEMENTS require an active paid membership (Basic or any
// higher tier). Use `useMembershipAccess()` for logic and <MembershipGate>
// for UI.
import { useMemo } from "react";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import { DEFAULT_ENTITLEMENTS } from "../config/entitlements";
import type { Entitlement } from "../types";

/** Entitlement keys that require a paid membership. */
export type EntitlementKey = (typeof DEFAULT_ENTITLEMENTS)[number]["key"];

/** Tiers that unlock the gated feature set. `free` is the only locked tier. */
const FREE_TIERS = new Set(["free", "", "none"]);

export function useMembershipAccess() {
  const { isSubscribed, tier, loading, subscriptionEnd, refetch } = useMembershipStatus();

  const isMember = isSubscribed && !FREE_TIERS.has((tier || "free").toLowerCase());

  return useMemo(
    () => ({
      /** True when the viewer holds Basic or any higher paid membership. */
      isMember,
      tier,
      loading,
      subscriptionEnd,
      /** Gated features are all-or-nothing today; kept per-key for future tiers. */
      hasEntitlement: (_key: EntitlementKey | string) => isMember,
      entitlements: DEFAULT_ENTITLEMENTS as Entitlement[],
      refetch,
    }),
    [isMember, tier, loading, subscriptionEnd, refetch]
  );
}
