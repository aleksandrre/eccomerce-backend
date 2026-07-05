import { Request } from "express";

export type Lang = "en" | "ka" | "ru";

const VALID_LANGS: Lang[] = ["en", "ka", "ru"];

export function getLang(req: Request): Lang {
  const q = req.query.lang;
  if (typeof q === "string" && (VALID_LANGS as string[]).includes(q)) {
    return q as Lang;
  }
  return "en";
}

export interface ILocalizedString {
  en: string;
  ka: string;
  ru: string;
}

export function localize(obj: ILocalizedString | undefined, lang: Lang): string {
  if (!obj) return "";
  return obj[lang] ?? obj.en ?? "";
}

// Replaces multilingual field paths in a lean document with plain localized strings.
// fieldPaths supports dot notation for nested arrays: "questions.question"
export function localizeDoc<T extends Record<string, unknown>>(
  doc: T,
  fieldPaths: string[],
  lang: Lang
): T {
  const result = { ...doc } as Record<string, unknown>;
  for (const path of fieldPaths) {
    const parts = path.split(".");
    applyLocalize(result, parts, lang);
  }
  return result as T;
}

function applyLocalize(
  obj: Record<string, unknown>,
  parts: string[],
  lang: Lang
): void {
  const [head, ...rest] = parts;
  if (!(head in obj)) return;

  if (rest.length === 0) {
    obj[head] = localize(obj[head] as ILocalizedString, lang);
    return;
  }

  const child = obj[head];
  if (Array.isArray(child)) {
    obj[head] = child.map((item) => {
      if (item && typeof item === "object") {
        const copy = { ...(item as Record<string, unknown>) };
        applyLocalize(copy, rest, lang);
        return copy;
      }
      return item;
    });
  } else if (child && typeof child === "object") {
    const copy = { ...(child as Record<string, unknown>) };
    applyLocalize(copy, rest, lang);
    obj[head] = copy;
  }
}
