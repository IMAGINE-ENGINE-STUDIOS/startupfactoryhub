
-- Change all entrepreneur_center resources to accelerator_incubator
UPDATE public.resources SET resource_type = 'accelerator_incubator' WHERE resource_type = 'entrepreneur_center';

-- Update Alabama SBDCs journey_steps: SBDCs help at all stages from idea to growth
UPDATE public.resources SET journey_steps = '{idea,research,mvp,validation,launch,growth}' WHERE title LIKE 'Alabama SBDC%' OR title = 'Greater Birmingham SBDC' OR title = 'Alabama International Trade Center';

-- Capital Access Team & AssistAL focus on funding/growth
UPDATE public.resources SET journey_steps = '{mvp,validation,launch,growth}' WHERE title IN ('SBDC Capital Access Team', 'AssistAL: SSBCI Technical Assistance');

-- Jacksonville Women's Business Center: idea through launch
UPDATE public.resources SET journey_steps = '{idea,research,mvp,validation,launch}' WHERE title = 'Jacksonville Women''s Business Center';

-- Tokyo accelerators: set appropriate stages
-- Techstars: mvp through growth (established accelerator)
UPDATE public.resources SET journey_steps = '{mvp,validation,launch,growth}' WHERE title = 'Techstars Tokyo Accelerator';

-- Forge: idea through validation (early-stage focused)
UPDATE public.resources SET journey_steps = '{idea,research,mvp,validation}' WHERE title = 'Forge Tokyo';

-- ASAC: idea through launch (government-backed, broad support)
UPDATE public.resources SET journey_steps = '{idea,research,mvp,validation,launch}' WHERE title = 'ASAC - Aoyama Startup Acceleration Center';

-- APT Women: idea through validation (women entrepreneur support)
UPDATE public.resources SET journey_steps = '{idea,research,mvp,validation}' WHERE title = 'APT Women Accelerator';

-- X-HUB TOKYO: mvp through growth (global market entry)
UPDATE public.resources SET journey_steps = '{mvp,validation,launch,growth}' WHERE title = 'X-HUB TOKYO Global Startup Accelerator';
