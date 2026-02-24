

# Boost SEO Ranking for Startup Factory Hub

## Overview
Maximize search engine visibility by adding a sitemap, structured data, canonical URLs, and improved meta tags -- all using `https://startupfactoryhub.com` as the primary domain.

## Changes

### 1. Create `public/sitemap.xml` (new file)
- List all public pages with `https://startupfactoryhub.com` as the base URL
- Include routes: `/`, `/about`, `/blog`, `/sponsorship`, `/partners`, `/resources`, `/lightpaper`, `/guidelines`, `/overview`, `/hubs`, `/japan-accelerator`, `/join/mentor`, `/join/advisor`, `/mvp-program`, `/privacy-policy`, `/terms-of-service`, `/cookie-policy`
- Set priority values (1.0 for homepage, 0.8 for main pages, 0.5 for legal pages)

### 2. Update `public/robots.txt`
- Add `Sitemap: https://startupfactoryhub.com/sitemap.xml`

### 3. Update `index.html`
- Add `<link rel="canonical" href="https://startupfactoryhub.com/" />`
- Add `<meta property="og:url" content="https://startupfactoryhub.com/" />`
- Add `<meta property="og:site_name" content="Startup Factory Hub" />`
- Add `<meta name="robots" content="index, follow" />`
- Add `<meta name="theme-color" content="#00C853" />`
- Expand keywords meta tag with more relevant terms
- Add `defer` to Jitsi script tag to improve page load speed
- Add JSON-LD structured data for `Organization` and `WebSite` schemas using `https://startupfactoryhub.com`

### JSON-LD structured data to be added
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Startup Factory Hub",
  "url": "https://startupfactoryhub.com",
  "logo": "https://startupfactoryhub.com/startup-factory-hub-logo.png",
  "description": "AI-Powered Startup Accelerator Platform connecting startups, mentors, investors, and students worldwide.",
  "sameAs": ["https://twitter.com/StartupFactoryHub"]
}
```

## What stays the same
- All existing meta tags for title, description, OG image, and Twitter cards remain unchanged
- No changes to any React components or application code
- No changes to styling or UI

