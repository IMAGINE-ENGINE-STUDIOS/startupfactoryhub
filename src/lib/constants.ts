// Standardized industry options for the platform
export const INDUSTRIES = [
  { value: 'aerospace', label: 'Aerospace' },
  { value: 'ai', label: 'AI/ML' },
  { value: 'biotech', label: 'Biotech' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'cleantech', label: 'CleanTech' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'defense', label: 'Defense' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'quantum', label: 'Quantum Computing' },
  { value: 'robotics', label: 'Robotics' },
  { value: 'saas', label: 'SaaS' },
  { value: 'semiconductor', label: 'Semiconductors' },
  { value: 'software', label: 'Software' },
  { value: 'space', label: 'Space Tech' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'other', label: 'Other' },
] as const;

export type IndustryValue = typeof INDUSTRIES[number]['value'];

// Helper to get industry label from value
export const getIndustryLabel = (value: string): string => {
  const industry = INDUSTRIES.find(i => i.value === value);
  return industry?.label || value;
};

// Helper to normalize industry values (handle legacy typos)
export const normalizeIndustry = (value: string | null | undefined): string => {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();
  
  // Map legacy values to standardized ones
  const legacyMappings: Record<string, string> = {
    'ecomerce': 'ecommerce',
    'e-commerce': 'ecommerce',
    'e commerce': 'ecommerce',
    'fintech': 'fintech',
    'fin-tech': 'fintech',
    'healthtech': 'healthtech',
    'health-tech': 'healthtech',
    'edtech': 'edtech',
    'ed-tech': 'edtech',
    'cleantech': 'cleantech',
    'clean-tech': 'cleantech',
    'biotech': 'biotech',
    'bio-tech': 'biotech',
  };
  
  return legacyMappings[normalized] || normalized;
};
