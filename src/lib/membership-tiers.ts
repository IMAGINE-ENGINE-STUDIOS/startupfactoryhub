export const MEMBERSHIP_TIERS = {
  free: {
    name: "Free",
    price: 0,
    product_id: null,
    price_id: null,
  },
  community: {
    name: "Community",
    price: 300,
    product_id: "prod_U1XG9MJn2KVcpW",
    price_id: "price_1T3UBmF2pD6kfaGMbqWQ17Jw",
  },
  self_paced_office: {
    name: "Self-Paced + Office",
    price: 500,
    product_id: "prod_U1XHGc8mHzhFhJ",
    price_id: "price_1T3UDQF2pD6kfaGMS4i4kbGj",
  },
  global_access: {
    name: "Global Access",
    price: 950,
    product_id: "prod_U1XQ4HPzkYzTHB",
    price_id: "price_1T3ULCF2pD6kfaGMDTRp9hAU",
  },
  corporate: {
    name: "Corporate",
    price: 1500,
    product_id: "prod_U1XRb2qaUuoVyH",
    price_id: "price_1T3UMQF2pD6kfaGMi5tNdTTp",
  },
} as const;

export type MembershipTier = keyof typeof MEMBERSHIP_TIERS;

export const getTierLabel = (tier: string): string => {
  return MEMBERSHIP_TIERS[tier as MembershipTier]?.name || tier;
};
