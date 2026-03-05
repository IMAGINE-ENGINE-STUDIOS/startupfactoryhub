export const MEMBERSHIP_TIERS = {
  free: {
    name: "Free",
    price: 0,
    product_id: null,
    price_id: null,
    yearly_price: 0,
    yearly_product_id: null,
    yearly_price_id: null,
  },
  community: {
    name: "Community",
    price: 350,
    product_id: "prod_U3oDmSPMy4Lher",
    price_id: "price_1T5gbKK5N1RcUVuY9hOEPizG",
    yearly_price: 3780,
    yearly_product_id: "prod_U5ckFYb3Xqa9SZ",
    yearly_price_id: "price_1T7RV3K5N1RcUVuYMhTIZLSV",
  },
  self_paced_office: {
    name: "Self-Paced + Desk",
    price: 550,
    product_id: "prod_U3oENLbFqHIiRA",
    price_id: "price_1T5gbrK5N1RcUVuYcLTffimY",
    yearly_price: 5940,
    yearly_product_id: "prod_U5ckRlglYZ8Ffn",
    yearly_price_id: "price_1T7RVKK5N1RcUVuYitID8wLL",
  },
  global_access: {
    name: "Global Access + Office",
    price: 950,
    product_id: "prod_U5cjB9wci6HRRg",
    price_id: "price_1T7RUQK5N1RcUVuYcgiZRLiH",
    yearly_price: 10260,
    yearly_product_id: "prod_U5clE9BMHJn7es",
    yearly_price_id: "price_1T7RVeK5N1RcUVuYtobuBLHA",
  },
  corporate: {
    name: "Corporate",
    price: 1500,
    product_id: "prod_U5ck4Q7g8fNZ9L",
    price_id: "price_1T7RUiK5N1RcUVuYJnD08hEl",
    yearly_price: 16200,
    yearly_product_id: "prod_U5clTYgMxNAnYI",
    yearly_price_id: "price_1T7RVuK5N1RcUVuY3vVk6mWC",
  },
} as const;

export type MembershipTier = keyof typeof MEMBERSHIP_TIERS;

export const getTierLabel = (tier: string): string => {
  return MEMBERSHIP_TIERS[tier as MembershipTier]?.name || tier;
};
