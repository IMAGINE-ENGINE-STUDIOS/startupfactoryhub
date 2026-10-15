/**
 * Per-page title, description and self-referencing canonical for the SPA.
 * Restores the previous values on unmount. Credits: Imagine Engine Studios Corp.
 */
import { useEffect } from 'react';

const SITE = 'https://startupfactoryhub.com';

const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  const prev = el.content; el.content = value; return () => { el!.content = prev; };
};

export function usePageSeo({ title, description, path }: { title: string; description: string; path: string }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const url = `${SITE}${path}`;
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    const prevHref = link.href; link.href = url;
    const undo = [
      setMeta('name', 'description', description),
      setMeta('property', 'og:title', title),
      setMeta('property', 'og:description', description),
      setMeta('property', 'og:url', url),
    ];
    return () => { document.title = prevTitle; link!.href = prevHref; undo.forEach((u) => u()); };
  }, [title, description, path]);
}
