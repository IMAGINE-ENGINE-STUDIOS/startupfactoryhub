export const STORAGE_PLANS = {
  free: { name: 'Free', price: 0, limit_gb: 1, limit_bytes: 1_073_741_824 },
  basic: { name: 'Basic', price: 239, limit_gb: 100, limit_bytes: 107_374_182_400 },
  standard: { name: 'Standard', price: 359, limit_gb: 200, limit_bytes: 214_748_364_800 },
  premium: { name: 'Premium', price: 1199, limit_gb: 2048, limit_bytes: 2_199_023_255_552 },
} as const;

export type StoragePlanKey = keyof typeof STORAGE_PLANS;

export const OVERAGE_COST_PER_GB_CENTS = 250; // $2.50

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getPlanByKey = (key: string) => {
  return STORAGE_PLANS[key as StoragePlanKey] || STORAGE_PLANS.free;
};
