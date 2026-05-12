// ============================================================
//  storage.ts  —  Persistencia de datos en el navegador
// ============================================================

import type { AppData, SealBase, SealUserData, GlobalPrices, PriceBackup } from "./types";
import { ATTRIBUTES, RANKS, RANK_ORDER } from "./types";
import { mergeSealData, migrateOldSeal } from "./sealMerger";
import type { ServerId } from "./supabase";
import { serverUserKey } from "./serverStore";

const STORAGE_KEY_BASE           = "izagi-seals-v2-base";
const STORAGE_KEY_USER_LEGACY    = "izagi-seals-v2-user";
const STORAGE_KEY_PRICES_LEGACY  = "izagi-prices-global";
const STORAGE_KEY_BACKUPS_LEGACY = "izagi-prices-backups";
const OLD_STORAGE_KEY            = "izagi-seals-v1";
const STORAGE_KEY_OPENER_PRICE   = "izagi-opener-price";
const STORAGE_KEY_INCLUDE_OPENER = "izagi-include-opener";
const MAX_BACKUPS = 50;

export function userKey(serverId?: ServerId | null): string {
  return serverId ? serverUserKey(serverId) : STORAGE_KEY_USER_LEGACY;
}
function pricesKey(serverId?: ServerId | null): string {
  return serverId ? `izagi-prices-global-${serverId}` : STORAGE_KEY_PRICES_LEGACY;
}
function backupsKey(serverId?: ServerId | null): string {
  return serverId ? `izagi-prices-backups-${serverId}` : STORAGE_KEY_BACKUPS_LEGACY;
}

async function fetchServerJson(serverId?: ServerId | null): Promise<any | null> {
  if (serverId) {
    try { const r = await fetch(`/seals_data_${serverId}.json`); if (r.ok) return await r.json(); } catch {}
  }
  try { const r = await fetch("/seals_data.json"); if (r.ok) return await r.json(); } catch {}
  return null;
}

// ── Base data ─────────────────────────────────────────────────

export function loadBaseData(): SealBase[] {
  try { const r = localStorage.getItem(STORAGE_KEY_BASE); return r ? JSON.parse(r) : []; } catch { return []; }
}
export function saveBaseData(d: SealBase[]): void {
  try { localStorage.setItem(STORAGE_KEY_BASE, JSON.stringify(d)); } catch (e) { console.error(e); }
}

// ── User data ──────────────────────────────────────────────────

export function loadUserData(serverId?: ServerId | null): Map<string, SealUserData> {
  try {
    const r = localStorage.getItem(userKey(serverId));
    if (!r) return new Map();
    return new Map((JSON.parse(r) as SealUserData[]).map(u => [u.sealId, u]));
  } catch { return new Map(); }
}
export function saveUserData(d: Map<string, SealUserData>, serverId?: ServerId | null): void {
  try { localStorage.setItem(userKey(serverId), JSON.stringify(Array.from(d.values()))); } catch (e) { console.error(e); }
}

// ── Global prices + timestamps individuales ────────────────────

export function loadGlobalPrices(serverId?: ServerId | null): Record<string, number> {
  try {
    const r = localStorage.getItem(pricesKey(serverId));
    return r ? (JSON.parse(r) as GlobalPrices).prices || {} : {};
  } catch { return {}; }
}

export function loadPriceTimestamps(serverId?: ServerId | null): Record<string, number> {
  try {
    const r = localStorage.getItem(pricesKey(serverId));
    return r ? (JSON.parse(r) as GlobalPrices).priceTimestamps || {} : {};
  } catch { return {}; }
}

export function saveGlobalPrices(
  prices: Record<string, number>,
  serverId?: ServerId | null,
  updatedSealId?: string,          // si se pasa, solo actualiza el timestamp de ese sello
): void {
  try {
    const existing = loadGlobalPrices(serverId);
    if (Object.keys(existing).length > 0) createPriceBackup(existing, serverId);

    const existingTs = loadPriceTimestamps(serverId);
    const now = Date.now();
    const newTs = updatedSealId
      ? { ...existingTs, [updatedSealId]: now }        // solo el sello que cambió
      : { ...existingTs, ...Object.fromEntries(        // marca todos los que cambiaron
          Object.entries(prices)
            .filter(([id, p]) => existing[id] !== p)
            .map(([id]) => [id, now])
        ) };

    const data: GlobalPrices = { timestamp: now, prices, priceTimestamps: newTs };
    localStorage.setItem(pricesKey(serverId), JSON.stringify(data));
  } catch (e) { console.error("[storage] saveGlobalPrices:", e); }
}

/** Guarda un solo precio y actualiza su timestamp — para usar en handlePriceChange */
export function saveSinglePrice(sealId: string, priceM: number, serverId?: ServerId | null): void {
  const prices = loadGlobalPrices(serverId);
  prices[sealId] = priceM;
  saveGlobalPrices(prices, serverId, sealId);
}

// ── Price backups ──────────────────────────────────────────────

export function loadPriceBackups(serverId?: ServerId | null): PriceBackup[] {
  try { const r = localStorage.getItem(backupsKey(serverId)); return r ? JSON.parse(r) : []; } catch { return []; }
}

export function createPriceBackup(prices: Record<string, number>, serverId?: ServerId | null): void {
  try {
    const backups = loadPriceBackups(serverId);
    if (backups.length > 0 && JSON.stringify(backups[backups.length - 1].prices) === JSON.stringify(prices)) return;
    backups.push({ timestamp: Date.now(), prices, serverId: serverId ?? undefined });
    if (backups.length > MAX_BACKUPS) backups.shift();
    localStorage.setItem(backupsKey(serverId), JSON.stringify(backups));
  } catch (e) { console.error(e); }
}

export interface BackupInfo {
  index: number; timestamp: number; date: string; time: string;
  hoursAgo: number; daysAgo: number; label: string;
}

export function getAvailableBackups(serverId?: ServerId | null): BackupInfo[] {
  const now = Date.now();
  return loadPriceBackups(serverId).map((b, index) => {
    const hoursAgo = Math.round((now - b.timestamp) / 3_600_000);
    const daysAgo  = Math.round((now - b.timestamp) / 86_400_000);
    const d = new Date(b.timestamp);
    const label = hoursAgo < 1 ? "Justo ahora" : hoursAgo < 24 ? `${hoursAgo}h atrás` : daysAgo < 7 ? `${daysAgo}d atrás` : `${Math.round(daysAgo / 7)}sem atrás`;
    return { index, timestamp: b.timestamp, date: d.toLocaleDateString(), time: d.toLocaleTimeString(), hoursAgo, daysAgo, label };
  });
}

export function getRecommendedBackups(serverId?: ServerId | null) {
  const a = getAvailableBackups(serverId);
  return {
    day1: a.find(b => b.hoursAgo >= 18 && b.hoursAgo <= 30),
    day3: a.find(b => b.daysAgo >= 3  && b.daysAgo < 4),
    day7: a.find(b => b.daysAgo >= 6  && b.daysAgo < 8),
  };
}

export function restorePriceBackup(i: number, serverId?: ServerId | null): boolean {
  try {
    const backups = loadPriceBackups(serverId);
    if (i < 0 || i >= backups.length) return false;
    saveGlobalPrices(backups[i].prices, serverId);
    return true;
  } catch { return false; }
}

export function getBackupDiff(i: number, serverId?: ServerId | null): number {
  try {
    const backups = loadPriceBackups(serverId);
    if (i < 0 || i >= backups.length) return 0;
    const current = loadGlobalPrices(serverId);
    return Object.entries(backups[i].prices).filter(([id, p]) => current[id] !== p).length;
  } catch { return 0; }
}

// ── Merge ──────────────────────────────────────────────────────

export function mergeStorageToAppData(
  baseData: SealBase[], userData: Map<string, SealUserData>, globalPrices?: Record<string, number>
): AppData {
  return {
    seals: mergeSealData(baseData, userData, globalPrices ?? {}),
    attrProgress: ATTRIBUTES.map(attr => ({ attribute: attr, vActual: 0, vMax: 0, progress: 0 })),
    lastUpdated: Date.now(),
  };
}

// ── Load / Save ────────────────────────────────────────────────

export function loadData(serverId?: ServerId | null): AppData | null {
  try {
    const base = loadBaseData();
    if (base.length > 0) {
      return mergeStorageToAppData(base, loadUserData(serverId), loadGlobalPrices(serverId));
    }
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (raw) {
      const m = migrateOldData(JSON.parse(raw) as AppData);
      saveBaseData(m.base); saveUserData(m.user, serverId); saveGlobalPrices(m.prices, serverId);
      return mergeStorageToAppData(m.base, m.user, m.prices);
    }
    return null;
  } catch { return null; }
}

function migrateOldData(old: AppData) {
  const base: SealBase[] = [], user = new Map<string, SealUserData>(), prices: Record<string, number> = {};
  for (const [name, seal] of Object.entries(old.seals)) {
    const { base: b, user: u } = migrateOldSeal(seal, name);
    base.push(b); user.set(name, u);
    if (seal.priceM > 0) prices[name] = seal.priceM;
  }
  return { base, user, prices };
}

export function saveData(data: AppData, serverId?: ServerId | null): void {
  const userData = new Map<string, SealUserData>();
  const prices: Record<string, number> = {};
  for (const [name, seal] of Object.entries(data.seals)) {
    userData.set(seal.name || name, { sealId: seal.name || name, currentRank: seal.currentRank });
    if (seal.priceM > 0) prices[seal.name || name] = seal.priceM;
  }
  saveUserData(userData, serverId);
  if (Object.keys(prices).length > 0) saveGlobalPrices(prices, serverId);
}

export function clearData(serverId?: ServerId | null): void {
  [STORAGE_KEY_BASE, STORAGE_KEY_USER_LEGACY, STORAGE_KEY_PRICES_LEGACY, STORAGE_KEY_BACKUPS_LEGACY, OLD_STORAGE_KEY]
    .forEach(k => localStorage.removeItem(k));
  const servers = serverId ? [serverId] : ["omegamon", "alphamon"] as ServerId[];
  for (const s of servers) {
    localStorage.removeItem(userKey(s));
    localStorage.removeItem(pricesKey(s));
    localStorage.removeItem(backupsKey(s));
  }
}

export function emptyAppData(): AppData {
  return {
    seals: {},
    attrProgress: ATTRIBUTES.map(attr => ({ attribute: attr, vActual: 0, vMax: 0, progress: 0 })),
    lastUpdated: Date.now(),
  };
}

export async function loadDefaultData(serverId?: ServerId | null): Promise<AppData | null> {
  try {
    const json = await fetchServerJson(serverId);
    if (!json) return null;
    if (json.base && Array.isArray(json.base)) {
      saveBaseData(json.base);
      const prices = json.prices || {};
      if (Object.keys(prices).length > 0) saveGlobalPrices(prices, serverId);
      return mergeStorageToAppData(json.base, loadUserData(serverId), prices);
    }
    if (json.seals) {
      const m = migrateOldData(json as AppData);
      saveBaseData(m.base); saveUserData(m.user, serverId); saveGlobalPrices(m.prices, serverId);
      return mergeStorageToAppData(m.base, m.user, m.prices);
    }
    return null;
  } catch { return null; }
}

export async function autoUpdateFromJSON(serverId?: ServerId | null): Promise<boolean> {
  try {
    const json = await fetchServerJson(serverId);
    if (!json) return false;
    const newBase: SealBase[] = json.base && Array.isArray(json.base)
      ? json.base
      : json.seals ? Object.values(json.seals as any).map((s: any) => ({ id: s.name || s.id, name: s.name, stats: s.stats, qty: s.qty }))
      : null;
    if (!newBase) return false;
    const jsonPrices: Record<string, number> = json.prices || {};
    if (json.seals) for (const s of Object.values(json.seals as any)) if ((s as any).priceM > 0) jsonPrices[(s as any).name || (s as any).id] = (s as any).priceM;
    const hasSavedPrices = Object.keys(loadGlobalPrices(serverId)).length > 0;
    if (hasSavedPrices) smartImportData(newBase, undefined, undefined, "auto-sync", serverId);
    else smartImportData(newBase, undefined, jsonPrices, "auto-sync", serverId);
    return true;
  } catch (e) { console.error("[storage] autoUpdateFromJSON:", e); return false; }
}

export type ImportStrategy = "preserve" | "update-ranks" | "overwrite" | "auto-sync";

export function smartImportData(
  newBaseData: SealBase[], newUserData?: Map<string, SealUserData>,
  newPrices?: Record<string, number>, strategy: ImportStrategy = "update-ranks",
  serverId?: ServerId | null,
): void {
  const existingBase = loadBaseData();
  const existingIds  = new Set(existingBase.map(b => b.id));
  const existingPrices = loadGlobalPrices(serverId);

  if (strategy === "auto-sync") {
    saveBaseData(existingBase.map(e => { const i = newBaseData.find(b => b.id === e.id); return i ? { ...e, stats: i.stats, qty: i.qty } : e; }));
  }
  const toAdd = newBaseData.filter(b => !existingIds.has(b.id));
  if (toAdd.length > 0) saveBaseData([...(strategy === "auto-sync" ? loadBaseData() : existingBase), ...toAdd]);

  if (newPrices && Object.keys(newPrices).length > 0) {
    let updated = { ...existingPrices };
    if (strategy === "preserve")        toAdd.forEach(b => { if (newPrices[b.id] && !updated[b.id]) updated[b.id] = newPrices[b.id]; });
    else if (strategy === "overwrite")  updated = newPrices;
    else                                updated = { ...updated, ...newPrices };
    saveGlobalPrices(updated, serverId);
  }

  if (newUserData && newUserData.size > 0) {
    const existing = loadUserData(serverId);
    for (const [id, incoming] of newUserData.entries()) {
      const current = existing.get(id);
      if (strategy === "preserve")      { if (!current) existing.set(id, { sealId: id, currentRank: incoming.currentRank ?? null }); }
      else if (strategy === "update-ranks") {
        const cur = current?.currentRank ?? null;
        let nr = cur;
        if (incoming.currentRank && (!cur || RANK_ORDER[incoming.currentRank] > RANK_ORDER[cur])) nr = incoming.currentRank;
        existing.set(id, { sealId: id, currentRank: nr });
      } else if (strategy === "overwrite") existing.set(id, { sealId: id, currentRank: incoming.currentRank ?? null });
      else if (strategy === "auto-sync")   existing.set(id, { sealId: id, currentRank: current?.currentRank ?? null });
    }
    saveUserData(existing, serverId);
  }
}

export function emptySeal(name: string): SealBase {
  return {
    id: name, name,
    stats: Object.fromEntries(ATTRIBUTES.map(a => [a, Object.fromEntries(RANKS.map(r => [r, 0]))])) as any,
    qty:   Object.fromEntries(RANKS.map(r => [r, 0])) as any,
  };
}

export function saveOpenerPrice(v: number): void   { localStorage.setItem(STORAGE_KEY_OPENER_PRICE, String(v)); }
export function loadOpenerPrice(): number           { return parseFloat(localStorage.getItem(STORAGE_KEY_OPENER_PRICE) ?? "0") || 0; }
export function saveIncludeOpener(v: boolean): void { localStorage.setItem(STORAGE_KEY_INCLUDE_OPENER, v ? "1" : "0"); }
export function loadIncludeOpener(): boolean        { return localStorage.getItem(STORAGE_KEY_INCLUDE_OPENER) === "1"; }
