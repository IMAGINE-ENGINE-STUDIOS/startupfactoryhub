

# Add NVIDIA Inception Accelerator to Upcoming Accelerator Programs

## What
Add a permanent NVIDIA Inception Accelerator card to the "Upcoming Accelerator Programs" section in both Dashboard.tsx and StudentDashboard.tsx. This card will always be visible (even when no database cohorts exist), uses the uploaded NVIDIA image, and links to the NVIDIA application page.

## Details
- **Program**: NVIDIA Inception Accelerator
- **Status**: Always open for applications (no deadline)
- **Link**: `https://www.nvidia.com/en-us/startups/?ncid=em-even-511353-vt53&nvweb_e=&mkt_tok=MTU2LU9GTi03NDIAAAGgyaJn1WUfrxhH43ovtwTdC_rG321mnwq0cbQ9CEJ2XbvZXRLL7KusQ_vPt6DC3_BRV-qBgU024vMbOIIYOEpDJ8jUnKLz4Kt-8IQbcR38AGjpuP-ZCGHosA`
- **Image**: The uploaded NVIDIA Inception Member badge

## Changes

| File | Change |
|------|--------|
| `src/assets/NVIDIA.jpeg` | Copy uploaded image into project assets |
| `src/pages/Dashboard.tsx` | Add NVIDIA Inception card after dynamic cohorts in the horizontal scroll. Make the "Upcoming Accelerator Programs" section always visible (remove the `openCohorts.length > 0` condition) |
| `src/pages/StudentDashboard.tsx` | Same changes as Dashboard.tsx |

## Card Design
- Matches existing cohort card style (320-380px width, rounded border, hover effect)
- Shows the NVIDIA image as the logo
- Title: "NVIDIA Inception Program"
- Subtitle: "NVIDIA"
- Description: "Free program for AI, data science & HPC startups. Access GPU credits, technical support, investor connections & NVIDIA expertise."
- Badge: "Always Open" (green)
- Single CTA button: "Apply" linking to the NVIDIA URL (opens in new tab)

