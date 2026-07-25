
UPDATE public.marketing_templates
SET headline = 'Welcome {startup_name} to Startup Factory Hub',
    subtext = '{startup_name} just joined our accelerator — a {stage} venture reshaping {industry}.

We''re proud to support their journey with mentorship, capital access, and a global network of founders, investors and operators building the next generation of companies.

Follow along as they build. → startupfactoryhub.com

#StartupFactoryHub #Startups #Innovation'
WHERE type = 'startup_announcement' AND is_default = true;
