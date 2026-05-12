// ============================================================
//  ServerSelector.tsx  —  Modal de selección de servidor
//                          + badge en el header
// ============================================================

import { useState } from "react";
import type { ServerId } from "../lib/supabase";
import { SERVERS, type ServerDef } from "../lib/serverStore";

// ── Modal inicial ────────────────────────────────────────────
interface ModalProps {
  onSelect: (id: ServerId) => void;
  lang: "es" | "en";
}

export function ServerSelectorModal({ onSelect, lang }: ModalProps) {
  const [hovering, setHovering] = useState<ServerId | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060d18]">
      {/* Fondo con efecto */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00c8f0]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff6b35]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Título */}
        <div className="text-center mb-10">
          <p className="text-[#2a4558] font-mono text-xs uppercase tracking-[0.3em] mb-3">
            Digimon Masters Online
          </p>
          <h1 className="text-3xl font-bold tracking-widest uppercase text-white mb-2">
            Seal Optimizer
          </h1>
          <p className="text-[#5a8aaa] font-mono text-sm">
            {lang === "es"
              ? "Selecciona tu servidor para ver los precios del mercado"
              : "Select your server to view market prices"}
          </p>
        </div>

        {/* Cards de servidor */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {SERVERS.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              isHovered={hovering === server.id}
              onMouseEnter={() => setHovering(server.id)}
              onMouseLeave={() => setHovering(null)}
              onClick={() => onSelect(server.id)}
              lang={lang}
            />
          ))}
        </div>

        <p className="text-center text-[#2a4558] font-mono text-xs">
          {lang === "es"
            ? "Los precios de cada servidor son independientes y se sincronizan en tiempo real"
            : "Each server's prices are independent and sync in real time"}
        </p>
      </div>
    </div>
  );
}

function ServerCard({ server, isHovered, onMouseEnter, onMouseLeave, onClick, lang }: {
  server: ServerDef;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  lang: "es" | "en";
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="relative p-6 rounded-2xl border-2 text-left transition-all duration-200 focus:outline-none"
      style={{
        borderColor: isHovered ? server.color : `${server.color}30`,
        background: isHovered
          ? `linear-gradient(145deg, #09141f, ${server.color}18)`
          : "#09141f",
        boxShadow: isHovered ? `0 0 30px ${server.color}25` : "none",
      }}
    >
      {/* Barra superior de color */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl transition-all"
        style={{ background: isHovered ? server.color : `${server.color}40` }} />

      {/* Logo del servidor */}
      <div className="mb-3 w-14 h-14">
        <img
          src={server.logo}
          alt={server.name}
          className="w-full h-full object-contain drop-shadow-lg"
          style={{ filter: isHovered ? `drop-shadow(0 0 8px ${server.color}80)` : "none", transition: "filter 0.2s" }}
        />
      </div>

      <p className="text-lg font-bold tracking-wider uppercase mb-1 transition-colors"
        style={{ color: isHovered ? server.color : "#fff" }}>
        {server.name}
      </p>
      <p className="text-[#5a8aaa] text-xs font-mono leading-relaxed">
        {server.description}
      </p>

      <div className="mt-4 pt-3 border-t transition-all"
        style={{ borderColor: `${server.color}25` }}>
        <span className="text-xs font-mono font-bold uppercase tracking-widest transition-colors"
          style={{ color: isHovered ? server.color : "#2a4558" }}>
          {lang === "es" ? "Entrar →" : "Enter →"}
        </span>
      </div>
    </button>
  );
}

// ── Badge en el header ────────────────────────────────────────
interface BadgeProps {
  serverId: ServerId;
  onChangeServer: () => void;
  isConnected: boolean;
  lang: "es" | "en";
}

export function ServerBadge({ serverId, onChangeServer, isConnected, lang }: BadgeProps) {
  const server = SERVERS.find(s => s.id === serverId)!;

  return (
    <button
      onClick={onChangeServer}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
      style={{ borderColor: `${server.color}50`, background: `${server.color}12` }}
      title={lang === "es" ? "Cambiar servidor" : "Change server"}
    >
      <img src={server.logo} alt={server.name} className="w-5 h-5 object-contain" />
      <span className="text-xs font-bold font-mono uppercase tracking-wider"
        style={{ color: server.color }}>
        {server.name}
      </span>
      <span className="w-1.5 h-1.5 rounded-full transition-colors"
        style={{ background: isConnected ? "#00e676" : "#5a8aaa" }}
        title={isConnected
          ? (lang === "es" ? "Sincronizado" : "Synced")
          : (lang === "es" ? "Conectando..." : "Connecting...")}
      />
    </button>
  );
}

// ── Modal para cambiar de servidor ───────────────────────────
interface ChangeModalProps {
  currentServer: ServerId;
  onSelect: (id: ServerId) => void;
  onClose: () => void;
  lang: "es" | "en";
}

export function ChangeServerModal({ currentServer, onSelect, onClose, lang }: ChangeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(6,13,24,0.9)" }} onClick={onClose}>
      <div className="bg-[#09141f] border border-[#1a3f6e] rounded-2xl p-6 w-96"
        onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-1">
          {lang === "es" ? "Cambiar Servidor" : "Change Server"}
        </h2>
        <p className="text-[#5a8aaa] font-mono text-xs mb-5">
          {lang === "es"
            ? "Los precios de cada servidor son independientes"
            : "Each server has independent prices"}
        </p>

        <div className="space-y-2">
          {SERVERS.map(server => {
            const isCurrent = server.id === currentServer;
            return (
              <button key={server.id}
                onClick={() => !isCurrent && onSelect(server.id)}
                disabled={isCurrent}
                className="w-full p-4 rounded-xl border text-left transition-all disabled:cursor-default"
                style={{
                  borderColor: isCurrent ? server.color : `${server.color}30`,
                  background:  isCurrent ? `${server.color}15` : "#060d18",
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={server.logo} alt={server.name} className="w-8 h-8 object-contain" />
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wider"
                        style={{ color: isCurrent ? server.color : "#fff" }}>
                        {server.name}
                      </p>
                      <p className="text-[#5a8aaa] text-xs font-mono">{server.description}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                      style={{ color: server.color, borderColor: `${server.color}50`, background: `${server.color}20` }}>
                      {lang === "es" ? "ACTIVO" : "ACTIVE"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={onClose}
          className="w-full mt-4 py-2 text-xs font-mono text-[#5a8aaa] border border-[#1a3f6e] rounded-lg hover:text-white transition-colors">
          {lang === "es" ? "Cancelar" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
