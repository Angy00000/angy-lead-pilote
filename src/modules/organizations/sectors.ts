// Secteurs d'activité — doit rester aligné avec la contrainte CHECK de
// app.organization_settings.sector (db/migrations/0001_foundation.sql).

export const SECTORS = [
  { value: "tech", label: "Technologie et électronique" },
  { value: "retail", label: "Commerce et distribution" },
  { value: "automotive", label: "Automobile" },
  { value: "real_estate", label: "Immobilier" },
  { value: "food", label: "Restauration" },
  { value: "services", label: "Services" },
  { value: "other", label: "Autre activité commerciale" },
] as const;

export type Sector = (typeof SECTORS)[number]["value"];

export function isSector(value: unknown): value is Sector {
  return typeof value === "string" && SECTORS.some((s) => s.value === value);
}

export function sectorLabel(value: string): string {
  return SECTORS.find((s) => s.value === value)?.label ?? value;
}
