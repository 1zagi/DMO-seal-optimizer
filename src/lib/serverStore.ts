// ============================================================
//  serverStore.ts  —  Gestión del servidor activo
// ============================================================

import type { ServerId } from "./supabase";
import omegamonLogo from "../assets/omegamon.png";
import alphamonLogo from "../assets/alphamon.png";

const SERVER_KEY = "izagi-active-server";

// ── Definición de los servidores disponibles ─────────────────
export interface ServerDef {
  id:          ServerId;
  name:        string;
  icon:        string;   // emoji fallback
  logo:        string;   // imagen importada
  color:       string;
  description: string;
}

export const SERVERS: ServerDef[] = [
  {
    id:          "omegamon",
    name:        "Omegamon",
    icon:        "⚔️",
    logo:        omegamonLogo,
    color:       "#00c8f0",
    description: "Servidor principal — mercado Omegamon",
  },
  {
    id:          "alphamon",
    name:        "Alphamon",
    icon:        "🔥",
    logo:        alphamonLogo,
    color:       "#ff6b35",
    description: "Servidor secundario — mercado Alphamon",
  },
];

// ── Persistencia del servidor activo ─────────────────────────

export function getActiveServer(): ServerId | null {
  return (localStorage.getItem(SERVER_KEY) as ServerId) ?? null;
}

export function setActiveServer(id: ServerId): void {
  localStorage.setItem(SERVER_KEY, id);
}

export function clearActiveServer(): void {
  localStorage.removeItem(SERVER_KEY);
}

export function getServerDef(id: ServerId): ServerDef {
  return SERVERS.find(s => s.id === id) ?? SERVERS[0];
}

// ── Keys de localStorage por servidor ────────────────────────

export function serverUserKey(serverId: ServerId): string {
  return `izagi-seals-v2-user-${serverId}`;
}

export function serverBaseKey(): string {
  return "izagi-seals-v2-base";
}
