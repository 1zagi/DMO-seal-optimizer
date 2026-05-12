// ============================================================
//  calculator.ts  —  Lógica de cálculo de eficiencia (portado de dmw)
// ============================================================

import type { AppData, AttrProgress, Attribute, Rank } from "./types";
import { ATTRIBUTES, RANKS, RANK_ORDER } from "./types";
import { formatM } from "./currency";

export function computeAttrProgress(data: AppData): AttrProgress[] {
  return ATTRIBUTES.map(attr => {
    let vActual = 0, vMax = 0;
    for (const seal of Object.values(data.seals)) {
      const attrStats = seal.stats?.[attr];
      if (!attrStats) continue;
      vMax += attrStats["Master"] ?? 0;
      if (seal.currentRank) vActual += attrStats[seal.currentRank] ?? 0;
    }
    return { attribute: attr, vActual, vMax, progress: vMax > 0 ? vActual / vMax : 0 };
  });
}

export interface Candidate {
  id: string;
  name: string;
  rank: Rank;
  priceM: number;
  qty: number;
  totalCostM: number;
  statBonus: number;
  statFrom: number;
  statTo: number;
  efficiency: number;
  fPrice: string;
  fTotal: string;
  fEfficiency: string;
}

/**
 * Costo real incluyendo openers.
 * Cada opener abre hasta 50 sellos → ceil(qty/50) openers necesarios.
 */
export function calcEffectiveCost(sealPrice: number, qty: number, openerPrice: number) {
  const openersNeeded = openerPrice > 0 ? Math.ceil(qty / 50) : 0;
  const totalOpenerCost = openersNeeded * openerPrice;
  const totalCost = sealPrice * qty + totalOpenerCost;
  const effectivePricePerSeal = qty > 0 ? totalCost / qty : sealPrice;
  return { totalCost, openersNeeded, totalOpenerCost, effectivePricePerSeal };
}

export function calcCandidates(data: AppData, attribute: Attribute, openerPrice?: number): Candidate[] {
  const results: Candidate[] = [];
  for (const seal of Object.values(data.seals)) {
    // Si no hay rank actual, asumir "Unopened" como inicio
    const currentRank = seal.currentRank ?? "Unopened";
    const currentOrder = RANK_ORDER[currentRank];
    const attrStats = seal.stats[attribute];
    if (!attrStats) continue;
    if (seal.priceM <= 0) continue;
    if (currentRank === "Master") continue;

    const currentStat = attrStats[currentRank] ?? 0;
    const currentRankQty = seal.qty[currentRank] ?? 0;

    for (const rank of RANKS) {
      if (RANK_ORDER[rank] <= currentOrder) continue;

      const totalQtyNeeded = seal.qty[rank] ?? 0;
      const statTo = attrStats[rank] ?? 0;
      const statBonus = statTo - currentStat;
      const qty = totalQtyNeeded - currentRankQty;
      if (qty <= 0 || statBonus <= 0) continue;

      const { totalCost: totalCostM } = calcEffectiveCost(seal.priceM, qty, openerPrice ?? 0);
      const efficiency = totalCostM / statBonus;

      results.push({
        id: seal.id,
        name: seal.name, rank, priceM: seal.priceM, qty, totalCostM,
        statBonus, statFrom: currentStat, statTo, efficiency,
        fPrice: formatM(seal.priceM),
        fTotal: formatM(totalCostM),
        fEfficiency: formatM(efficiency),
      });
    }
  }
  return results.sort((a, b) => a.efficiency - b.efficiency);
}

/**
 * Calcula candidatos para RankingTab - sin restricción de Normal.
 * Para cada sello, solo devuelve el rank más barato (la mejor opción por sello).
 */
export function calcRankingCandidates(data: AppData, attribute: Attribute, openerPrice?: number): Candidate[] {
  const results: Candidate[] = [];
  for (const seal of Object.values(data.seals)) {
    const currentRank = seal.currentRank ?? "Unopened";
    const currentOrder = RANK_ORDER[currentRank];
    const attrStats = seal.stats[attribute];
    if (!attrStats) continue;
    if (seal.priceM <= 0) continue;
    if (currentRank === "Master") continue;

    const currentStat = attrStats[currentRank] ?? 0;
    const currentRankQty = seal.qty[currentRank] ?? 0;

    let bestCandidate: Candidate | null = null;
    let bestEfficiency = Infinity;

    for (const rank of RANKS) {
      if (RANK_ORDER[rank] <= currentOrder) continue;

      const totalQtyNeeded = seal.qty[rank] ?? 0;
      const statTo = attrStats[rank] ?? 0;
      const statBonus = statTo - currentStat;
      const qty = totalQtyNeeded - currentRankQty;
      if (qty <= 0 || statBonus <= 0) continue;

      const { totalCost: totalCostM } = calcEffectiveCost(seal.priceM, qty, openerPrice ?? 0);
      const efficiency = totalCostM / statBonus;

      // Solo guardar el más barato (mejor eficiencia)
      if (efficiency < bestEfficiency) {
        bestEfficiency = efficiency;
        bestCandidate = {
          id: seal.id,
          name: seal.name, rank, priceM: seal.priceM, qty, totalCostM,
          statBonus, statFrom: currentStat, statTo, efficiency,
          fPrice: formatM(seal.priceM),
          fTotal: formatM(totalCostM),
          fEfficiency: formatM(efficiency),
        };
      }
    }

    if (bestCandidate) results.push(bestCandidate);
  }
  return results.sort((a, b) => a.efficiency - b.efficiency);
}
