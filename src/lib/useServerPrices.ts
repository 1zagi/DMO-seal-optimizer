// ============================================================
//  useServerPrices.ts  —  DMO
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import type { ServerId } from "./supabase";
import { fetchServerPrices, upsertSealPrice, subscribeToServerPrices } from "./supabase";

export interface UseServerPricesResult {
  prices:      Map<string, number>;
  loading:     boolean;
  connected:   boolean;
  updatePrice: (sealId: string, priceM: number, prevPriceM?: number) => Promise<void>;
}

export function useServerPrices(serverId: ServerId | null): UseServerPricesResult {
  const [prices,    setPrices]    = useState<Map<string, number>>(new Map());
  const [loading,   setLoading]   = useState(false);
  const [connected, setConnected] = useState(false);

  const activeRef = useRef(serverId);
  activeRef.current = serverId;

  useEffect(() => {
    if (!serverId) { setPrices(new Map()); return; }
    setLoading(true); setConnected(false);
    fetchServerPrices(serverId).then(map => {
      if (activeRef.current === serverId) { setPrices(map); setLoading(false); }
    });
  }, [serverId]);

  useEffect(() => {
    if (!serverId) return;
    const unsubscribe = subscribeToServerPrices(serverId, (sealId, priceM) => {
      if (activeRef.current !== serverId) return;
      setPrices(prev => { const n = new Map(prev); n.set(sealId, priceM); return n; });
      setConnected(true);
    });
    const timer = setTimeout(() => { if (activeRef.current === serverId) setConnected(true); }, 2_000);
    return () => { unsubscribe(); clearTimeout(timer); setConnected(false); };
  }, [serverId]);

  const updatePrice = useCallback(async (sealId: string, priceM: number, prevPriceM?: number) => {
    if (!serverId) return;
    setPrices(prev => { const n = new Map(prev); n.set(sealId, priceM); return n; });
    await upsertSealPrice(serverId, sealId, priceM, prevPriceM);
  }, [serverId]);

  return { prices, loading, connected, updatePrice };
}
