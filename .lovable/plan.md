

# Create NVIDIA Inception Program Email Template

## What
Create a new Supabase Edge Function `send-nvidia-inception-invite` that sends a branded email inviting startups to join the NVIDIA Inception Program through Startup Factory Hub's direct link.

## Email Content
- **Subject**: "Join NVIDIA Inception Program — Apply Through Startup Factory Hub"
- **Hero**: NVIDIA Inception badge image + "You're Invited to NVIDIA Inception"
- **Body**: Brief description of the program benefits (GPU credits, technical support, investor connections, NVIDIA expertise)
- **CTA 1**: "Apply Now" button linking to `https://www.nvidia.com/en-us/startups/?ncid=em-even-511353-vt53&nvweb_e=&mkt_tok=MTU2LU9GTi03NDIAAAGgyaJn1WUfrxhH43ovtwTdC_rG321mnwq0cbQ9CEJ2XbvZXRLL7KusQ_vPt6DC3_BRV-qBgU024vMbOIIYOEpDJ8jUnKLz4Kt-8IQbcR38AGjpuP-ZCGHosA`
- **CTA 2**: "Sign In to Startup Factory Hub" button linking to `https://startupfactoryhub.com/auth`
- **Steps**: 1) Click the NVIDIA link to apply, 2) Sign in to SFH to track your application, 3) Access resources and support
- **Style**: Matches existing email templates (dark theme, #0ea270 green brand color, SFH logo in header/footer)

## Parameters
- `to` — recipient email
- `recipientName` — personalized greeting
- `companyName` — optional company name

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-nvidia-inception-invite/index.ts` | New edge function with NVIDIA Inception email template |

