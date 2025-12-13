-- Normalize industry values to fix typos
UPDATE public.companies
SET industry = 'ecommerce'
WHERE LOWER(industry) IN ('ecomerce', 'e-commerce', 'e commerce');

UPDATE public.companies
SET industry = 'fintech'
WHERE LOWER(industry) IN ('fin-tech', 'fin tech');

UPDATE public.companies
SET industry = 'healthtech'
WHERE LOWER(industry) IN ('health-tech', 'health tech');

UPDATE public.companies
SET industry = 'edtech'
WHERE LOWER(industry) IN ('ed-tech', 'ed tech');

UPDATE public.companies
SET industry = 'cleantech'
WHERE LOWER(industry) IN ('clean-tech', 'clean tech');

UPDATE public.companies
SET industry = 'biotech'
WHERE LOWER(industry) IN ('bio-tech', 'bio tech');

-- Lowercase all industry values for consistency
UPDATE public.companies
SET industry = LOWER(industry)
WHERE industry IS NOT NULL;