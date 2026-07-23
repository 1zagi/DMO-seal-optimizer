// ============================================================
//  newSeals.ts  —  Sistema de resaltado de seals nuevas
//
//  Las seals en NEW_SEALS_DMO se resaltan como "nueva" durante
//  HIGHLIGHT_DAYS dias desde RELEASE_DATE.
//  Actualizar lista y fecha con cada patch nuevo.
// ============================================================

const RELEASE_DATE   = new Date("2026-07-23").getTime();
const HIGHLIGHT_DAYS = 30;

export const NEW_SEALS_DMO = new Set<string>([
  "Digital Vacation AT Seal",
]);

export function isDMONew(sealName: string): boolean {
  if (!NEW_SEALS_DMO.has(sealName)) return false;
  if (Date.now() - RELEASE_DATE > HIGHLIGHT_DAYS * 86_400_000) return false;
  return true;
}
