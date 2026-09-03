// Real (non-simulated) membership gating for the whole app.
//
// Access is granted when ANY of the following is true:
//   1. The viewer is a platform admin (`user_roles.role = 'admin'`).
//   2. An admin issued an active membership grant (`membership_grants`).
//   3. The viewer holds ANY paid membership — Basic ($50/mo, $480/yr) or higher.
//
// Everyone else is a free account: browse / read-only. Use
// `useMembershipAccess()` for logic and <MembershipGate> for UI.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import { DEFAULT_ENTITLEMENTS } from "../config/entitlements";
import type { Entitlement } from "../types";

/** Entitlement keys that require a paid membership. */
export type EntitlementKey = (typeof DEFAULT_ENTITLEMENTS)[number]["key"];

/** Tiers that do NOT unlock the gated feature set. */
const FREE_TIERS = new Set(["free", "", "none"]);

/** Admin role or an admin-issued grant (server-evaluated). */
function useComplimentaryAccess() {
  return useQuery({
    queryKey: ["membership-complimentary-access"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { granted: false, isAdmin: false };

      const [{ data: granted }, { data: roles }] = await Promise.all([
        supabase.rpc("has_membership_access", { _user_id: user.id }),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      const isAdmin = (roles || []).some((r: { role: string }) => r.role === "admin");
      return { granted: Boolean(granted) || isAdmin, isAdmin };
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });
}

export function useMembershipAccess() {
  const { isSubscribed, tier, loading, subscriptionEnd, refetch } = useMembershipStatus();
  const comp = useComplimentaryAccess();

  const isPaid = isSubscribed && !FREE_TIERS.has((tier || "free").toLowerCase());
  const isAdmin = comp.data?.isAdmin ?? false;
  const isGranted = comp.data?.granted ?? false;
  const isMember = isPaid || isGranted;

  const refetchAll = useMemo(
    () => async () => {
      await Promise.all([refetch(), comp.refetch()]);
    },
    [refetch, comp]
  );

  return useMemo(
    () => ({
      /** True when the viewer holds any paid membership, a grant, or is admin. */
      isMember,
      /** Paid Stripe membership (Basic or higher). */
      isPaid,
      /** Complimentary access issued by an admin. */
      isGranted: isGranted && !isPaid,
      isAdmin,
      tier: isPaid ? tier : isAdmin ? "admin" : isGranted ? "granted" : tier,
      loading: loading || comp.isLoading,
      subscriptionEnd,
      /** Gated features are all-or-nothing today; kept per-key for future tiers. */
      hasEntitlement: (_key: EntitlementKey | string) => isMember,
      entitlements: DEFAULT_ENTITLEMENTS as Entitlement[],
      refetch: refetchAll,
    }),
    [isMember, isPaid, isGranted, isAdmin, tier, loading, comp.isLoading, subscriptionEnd, refetchAll]
  );
}
