/**
 * Languages a book can be written in. Adding a new language is a one-line entry
 * here — the story prompt, create-flow picker, and admin all read from this list.
 * `promptName` is the exact wording handed to the model; `native` is what the
 * customer sees in their own language.
 *
 * Note: only Latin-script languages are listed because the print PDF font covers
 * Latin-1 accents (á, é, í, ñ, ç, ã…). Non-Latin scripts would need a font change.
 */
export interface BookLanguage {
  code: string;
  label: string; // English name, for admin
  native: string; // endonym, shown to the customer
  promptName: string; // exact phrase given to the model
}

export const LANGUAGES: BookLanguage[] = [
  { code: "en", label: "English", native: "English", promptName: "English" },
  { code: "es", label: "Spanish", native: "Español", promptName: "Latin American Spanish" },
  { code: "fr", label: "French", native: "Français", promptName: "French" },
  { code: "pt", label: "Portuguese", native: "Português", promptName: "Brazilian Portuguese" },
];

export const DEFAULT_LANGUAGE = "en";

export function resolveLanguage(code?: string | null): BookLanguage {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
