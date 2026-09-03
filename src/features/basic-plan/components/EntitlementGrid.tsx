// Grid of all Basic Plan entitlements rendered in the current access state.
import type { Entitlement } from "../types";
import EntitlementTile from "./EntitlementTile";

interface Props {
  entitlements: Entitlement[];
  isMember: boolean;
}

export default function EntitlementGrid({ entitlements, isMember }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {entitlements.map((e) => (
        <EntitlementTile key={e.key} entitlement={e} unlocked={isMember} />
      ))}
    </div>
  );
}
