// ============================================================
//  sealMerger.ts  —  Combina base data + user data + global prices
// ============================================================

import type { SealBase, SealUserData, MergedSeal, Seal } from "./types";

export function mergeSealData(
  baseData: SealBase[],
  userData: Map<string, SealUserData>,
  globalPrices?: Record<string, number>
): Record<string, MergedSeal> {
  const prices = globalPrices || {};
  const result: Record<string, MergedSeal> = {};

  for (const base of baseData) {
    const user = userData.get(base.id);
    result[base.name] = {
      id:          base.id,
      name:        base.name,
      stats:       base.stats,
      qty:         base.qty,
      currentRank: user?.currentRank ?? null,
      priceM:      prices[base.id] ?? prices[base.name] ?? 0,
    };
  }
  return result;
}

/** Solo guarda rank (precio es global) */
export function extractUserData(seal: Seal, sealId: string): SealUserData {
  return { sealId, currentRank: seal.currentRank };
}

export function migrateOldSeal(oldSeal: Seal, id: string): { base: SealBase; user: SealUserData } {
  return {
    base: { id, name: oldSeal.name, stats: oldSeal.stats, qty: oldSeal.qty },
    user: { sealId: id, currentRank: oldSeal.currentRank },
  };
}

export function getCurrentStat(seal: MergedSeal, attribute: string): number {
  if (!seal.currentRank) return 0;
  return seal.stats[attribute as keyof typeof seal.stats]?.[seal.currentRank] ?? 0;
}
