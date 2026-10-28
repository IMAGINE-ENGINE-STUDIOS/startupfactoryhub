/**
 * Sitewide per-route title, description and self-referencing canonical.
 * Pages that call usePageSeo themselves override these values.
 * Credits: Imagine Engine Studios Corp.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'https://startupfactoryhub.com';
const BRAND = 'Startup Factory Hub';
// Optional third element overrides og:description/twitter:description (defaults to the meta description).
const ROUTES: Record<string, [string, string, string?]> = {
  '/': ['Startup Factory Hub', 'We build, accelerate, scale, and invest in startups globally.', 'Startup Factory Hub is an AI-powered global venture builder creating the infrastructure to build and scale the next generation of startups.'],
  '/about': ['About Us', 'Meet the Startup Factory Hub team and learn how we are building AI-powered infrastructure for the global startup ecosystem.'],
  '/auth': ['Sign In or Join', 'Sign in or create your Startup Factory Hub account to start your founder journey.'],
  '/dashboard': ['Dashboard', 'Your Startup Factory Hub dashboard: journey, network, resources and Genius AI.'],
  '/tools': ['Founder Tools & Perks', 'Startup tools and partner perks available to Startup Factory Hub members.'],
  '/lightpaper': ['LightPaper', 'Read and publish startup LightPapers on Startup Factory Hub.'],
  '/guidelines': ['Community Guidelines', 'The community guidelines for founders, mentors, advisors and investors on Startup Factory Hub.'],
  '/privacy-policy': ['Privacy Policy', 'How Startup Factory Hub collects, uses and protects your personal data.'],
  '/terms-of-service': ['Terms of Service', 'The terms that govern use of the Startup Factory Hub platform.'],
  '/cookie-policy': ['Cookie Policy', 'How Startup Factory Hub uses cookies and similar technologies.'],
  '/sponsorship': ['Sponsorship Opportunities', 'Sponsor Startup Factory Hub programs and events to reach founders and innovators.'],
  '/marketing': ['Marketing', 'Marketing resources and campaigns from Startup Factory Hub.'],
  '/ignition': ['Ignition Accelerator Cohort', 'Ignition is the Startup Factory Hub accelerator cohort for aerospace, deep tech, photonics and AI startups.'],
  '/partners': ['Corporate Partners', 'Partner with Startup Factory Hub to access startups, innovation programs and the venture network.'],
  '/forpartners': ['For Partners', 'Accelerator-as-a-service for organizations, powered by Startup Factory Hub.'],
  '/japan-accelerator': ['Japan Accelerator Program', 'The Startup Factory Hub Japan accelerator partnership for startups expanding across borders.'],
  '/resources': ['Startup Resources', 'Free and member resources for founders building with Startup Factory Hub.'],
  '/deck': ['Pitch Deck', 'The Startup Factory Hub company pitch deck.'],
  '/uof': ['Use of Funds', 'How Startup Factory Hub allocates its $1,622,440 plan ($1.5M seed + $122,440 added), line by line, with the 5-year financial projections from the deck: $6.09M in Year 1 to $60.9M in Year 5. Downloadable as PDF.'],
  '/overview': ['Company Overview', 'An overview of Startup Factory Hub, the AI startup accelerator and venture builder.'],
  '/hubs': ['Innovation Hubs', 'Find Startup Factory Hub innovation hubs and office spaces around the world.'],
  '/mvp-program': ['MVP Program', 'Build your minimum viable product with the Startup Factory Hub MVP program.'],
  '/equity-program': ['Equity Program', 'The Startup Factory Hub equity program for startups and venture partners.'],
  '/imagine-engine': ['Imagine Engine — AI App Builder', 'Imagine Engine is the AI coding application founders use to build their product on Startup Factory Hub.'],
  '/imagine-studio': ['Imagine Studio — 3D Level Editor', 'Create and publish 3D worlds and levels with Imagine Studio.'],
  '/live-video': ['Live Video Events', 'Join live startup events, pitches and sessions on Startup Factory Hub.'],
  '/accelerated-fundraising': ['Accelerated Fundraising Program', 'Prepare for and connect with investors through the Startup Factory Hub accelerated fundraising program.'],
  '/plaza': ['Plaza — Virtual Venture District', 'Meet founders and investors in the Startup Factory Hub 3D virtual plaza.'],
  '/referral': ['Referral Program', 'Earn rewards by referring founders and partners to Startup Factory Hub.'],
  '/install': ['Install the App', 'Install the Startup Factory Hub app on your phone or desktop.'],
  '/official': ['Official Program', 'The official Startup Factory Hub accelerator program.'],
  '/brochure': ['Platform Brochure', 'The Startup Factory Hub brochure: the operating system for innovation ecosystems.'],
  '/brochure-academia': ['Academia Brochure', 'How universities partner with Startup Factory Hub to commercialize research and support founders.'],
  '/certifications': ['Certifications', 'Startup Factory Hub certifications for founders and programs.'],
  '/members-club': ['Members Club — Venture Network', 'Join the Startup Factory Hub Venture Network for $50/month and unlock the full platform.'],
  '/apex': ['APEX Partnership Brochure', 'APEX accelerators powered by Startup Factory Hub.'],
  '/wtcpartnership': ['WTC Partnership', 'The World Trade Center partnership with Startup Factory Hub.'],
  '/ar-world': ['AR World', 'Explore augmented reality events and experiences with Startup Factory Hub.'],
};

const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = value;
};

export default function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
    const hit = ROUTES[path.toLowerCase()];
    const name = path.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const title = hit ? (path === '/' ? hit[0] : `${hit[0]} | ${BRAND}`) : `${name ?? 'Home'} | ${BRAND}`;
    const description = hit ? hit[1] : `${name ?? 'Home'} on ${BRAND}, the AI startup accelerator and venture builder.`;
    const socialDescription = (hit && hit[2]) || description;
    const url = `${SITE}${path === '/' ? '/' : path}`;
    document.title = title;
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', socialDescription);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', socialDescription);
  }, [pathname]);
  return null;
}
