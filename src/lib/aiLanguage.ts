import { LANGUAGES, type LanguageCode } from "@/translations";

/**
 * Reads the app language outside of React (AI call sites, edge-function payloads).
 * Kept in sync with LanguageContext, which persists to `app-language`.
 */
export function getAppLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem("app-language") as LanguageCode | null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return "en";
}

/** Human-readable, model-friendly language name. */
export function getLanguageName(code?: LanguageCode | string): string {
  const c = (code || getAppLanguage()) as string;
  const match = LANGUAGES.find((l) => l.code === c);
  const englishNames: Record<string, string> = {
    en: "English",
    es: "Spanish (Latin American)",
    pt: "Portuguese (Brazilian)",
    fr: "French",
    de: "German",
    it: "Italian",
    nl: "Dutch",
    pl: "Polish",
    ru: "Russian",
    uk: "Ukrainian",
    tr: "Turkish",
    ar: "Arabic",
    he: "Hebrew",
    hi: "Hindi",
    id: "Indonesian",
    vi: "Vietnamese",
    th: "Thai",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese (Simplified)",
  };
  return englishNames[c] || match?.name || "English";
}

/** Native label used in badges/chips. */
export function getLanguageLabel(code?: LanguageCode | string): string {
  const c = (code || getAppLanguage()) as string;
  return LANGUAGES.find((l) => l.code === c)?.name || "English";
}

/**
 * Hard directive appended to every Genius system prompt so that answers,
 * clarifying questions, headings and generated documents follow the UI language.
 */
export function buildLanguageDirective(code?: LanguageCode | string): string {
  const name = getLanguageName(code);
  return `\n\nOUTPUT LANGUAGE — ABSOLUTE RULE:
- Write EVERY word of your response in ${name}.
- This includes document titles, headings, tables, bullet lists, clarifying questions and option buttons.
- Never mix languages and never answer in English unless ${name} is English.
- Only keep proper nouns, brand names, code and quoted source text in their original form.
- If the user writes in another language, still answer in ${name}.`;
}

/** Convenience: append the directive to a system prompt. */
export function withLanguage(systemPrompt: string, code?: LanguageCode | string): string {
  return `${systemPrompt}${buildLanguageDirective(code)}`;
}
