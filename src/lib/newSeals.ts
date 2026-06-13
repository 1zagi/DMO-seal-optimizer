// ============================================================
//  newSeals.ts  —  Sistema de resaltado de seals nuevas
//
//  Las seals en NEW_SEALS_DMO se resaltan como "nueva" hasta
//  que el usuario las ve (click en la card) o pasan 14 días
//  desde RELEASE_DATE. Actualizar esta lista con cada patch.
// ============================================================

// ── Fecha de release de la tanda actual ──────────────────────
const RELEASE_DATE = new Date("2026-06-13").getTime();
const HIGHLIGHT_DAYS = 14;
const STORAGE_KEY = "dmo_seen_new_seals";

// ── Lista de seals nuevas del último patch ────────────────────
// Actualizar aquí cuando salga un nuevo patch con seals nuevas.
export const NEW_SEALS_DMO = new Set<string>([
  // Patch Jun 2026 — ejemplo, ajustar según patch real
]);

// ── API pública ───────────────────────────────────────────────

function getSeenSeals(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")); }
  catch { return new Set(); }
}

function markSeen(sealName: string) {
  const seen = getSeenSeals();
  seen.add(sealName);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

/** Devuelve true si el sello debe mostrarse como "nuevo" */
export function isDMONew(sealName: string): boolean {
  if (!NEW_SEALS_DMO.has(sealName)) return false;
  if (Date.now() - RELEASE_DATE > HIGHLIGHT_DAYS * 86_400_000) return false;
  return !getSeenSeals().has(sealName);
}

/** Llamar cuando el usuario interactúa con la card */
export function markDMOSeen(sealName: string) {
  markSeen(sealName);
}
