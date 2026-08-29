import { MEMBERSHIP_TIERS } from "@/lib/membership-tiers";

export type InvoiceBilling = "one_time" | "monthly" | "yearly";

export interface CatalogItem {
  id: string;
  group: "Subscriptions" | "Accelerator Programs";
  label: string;
  description: string;
  unit_price: number;
  billing: InvoiceBilling;
}

const subscriptionItems: CatalogItem[] = Object.entries(MEMBERSHIP_TIERS)
  .filter(([key]) => key !== "free")
  .flatMap(([key, tier]) => {
    const items: CatalogItem[] = [
      {
        id: `${key}_monthly`,
        group: "Subscriptions",
        label: `${tier.name} — Monthly`,
        description: `Startup Factory Hub ${tier.name} membership — monthly subscription`,
        unit_price: tier.price,
        billing: "monthly",
      },
    ];
    if (tier.yearly_price) {
      items.push({
        id: `${key}_yearly`,
        group: "Subscriptions",
        label: `${tier.name} — Yearly`,
        description: `Startup Factory Hub ${tier.name} membership — annual subscription`,
        unit_price: tier.yearly_price,
        billing: "yearly",
      });
    }
    return items;
  });

const programItems: CatalogItem[] = [
  {
    id: "mvp_program",
    group: "Accelerator Programs",
    label: "MVP Development Program",
    description: "MVP Development Program — build your MVP, mentorship and advisory",
    unit_price: 5000,
    billing: "one_time",
  },
  {
    id: "accelerator_batch",
    group: "Accelerator Programs",
    label: "Accelerator Batch — per Startup",
    description: "Startup Factory Hub Accelerator Batch participation — per startup",
    unit_price: 5000,
    billing: "one_time",
  },
  {
    id: "accelerator_as_a_service",
    group: "Accelerator Programs",
    label: "Accelerator-as-a-Service (Partner)",
    description: "Accelerator-as-a-Service partner program — full batch operation",
    unit_price: 25000,
    billing: "one_time",
  },
];

export const INVOICE_CATALOG: CatalogItem[] = [...subscriptionItems, ...programItems];

export const CATALOG_GROUPS = ["Subscriptions", "Accelerator Programs"] as const;
