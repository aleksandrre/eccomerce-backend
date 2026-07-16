/**
 * Shared definition for multilingual `{ en, ka, ru }` fields. Previously this
 * object was copy-pasted into five separate model files; centralizing it keeps
 * the localization contract consistent everywhere.
 *
 * `en` is required (the canonical fallback used by `localize()`); `ka`/`ru`
 * default to an empty string so partially-translated content is allowed.
 */
export const localizedStringSchema = {
  en: { type: String, required: true },
  ka: { type: String, default: "" },
  ru: { type: String, default: "" },
};
