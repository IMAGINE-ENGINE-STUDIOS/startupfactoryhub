export const MEMBERSHIP_TIERS = {
  free: {
    name: "Free",
    price: 0,
    product_id: null,
    price_id: null,
  },
  community: {
    name: "Community",
    price: 350,
    product_id: "prod_U3oDmSPMy4Lher",
    price_id: "price_1T5gbKK5N1RcUVuY9hOEPizG",
  },
  self_paced_office: {
    name: "Self-Paced + Desk",
    price: 550,
    product_id: "prod_U3oENLbFqHIiRA",
    price_id: "price_1T5gbrK5N1RcUVuYcLTffimY",
  },
  global_access: {
    name: "Global Access + Office",
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
