import { randomBytes } from "node:crypto";

/** Identifiant d'URL lisible et unique : "angy-tech-3f9a1c". */
export function makeSlug(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base || "organisation"}-${suffix}`;
}
