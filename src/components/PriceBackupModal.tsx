// ============================================================
//  PriceBackupModal.tsx  —  Historial y restauración de precios
//                            (portado de dmw, con soporte por servidor)
// ============================================================

import { useMemo, useState } from "react";
import type { Lang } from "../lib/i18n";
import {
  getAvailableBackups,
  getRecommendedBackups,
  getBackupDiff,
  restorePriceBackup,
  type BackupInfo,
} from "../lib/storage";
import type { ServerId } from "../lib/supabase";

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onRestore: (label: string) => void;
  lang:      Lang;
  serverId?: ServerId | null;
}

export function PriceBackupModal({ isOpen, onClose, onRestore, lang, serverId }: Props) {
  const [isRestoring, setIsRestoring] = useState(false);

  const allBackups  = useMemo(() => getAvailableBackups(serverId),  [isOpen, serverId]);
  const recommended = useMemo(() => getRecommendedBackups(serverId), [isOpen, serverId]);

  if (!isOpen) return null;

  const handleRestore = async (index: number, label: string) => {
    if (!confirm(lang === "es"
      ? `¿Restaurar precios desde ${label}? No se puede deshacer.`
      : `Restore prices from ${label}? This cannot be undone.`)) return;
    setIsRestoring(true);
    try {
      if (restorePriceBackup(index, serverId)) {
        onRestore(label);
        setTimeout(onClose, 300);
      } else {
        alert(lang === "es" ? "Error al restaurar backup" : "Error restoring backup");
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const diffLabel = (b: BackupInfo) => {
    const d = getBackupDiff(b.index, serverId);
    if (lang === "es") return d === 0 ? "Sin cambios" : `${d} precio${d > 1 ? "s" : ""} diferente${d > 1 ? "s" : ""}`;
    return d === 0 ? "No changes" : `${d} different price${d > 1 ? "s" : ""}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#09141f] border border-[#1a3f6e] rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#00c8f0]">
            📦 {lang === "es" ? "Restaurar Precios" : "Restore Prices"}
          </h2>
          <button onClick={onClose} className="text-[#5a8aaa] hover:text-white text-2xl">✕</button>
        </div>

        {allBackups.length === 0 ? (
          <p className="text-center text-[#5a8aaa] py-6">
            {lang === "es"
              ? "No hay backups. Se crean automáticamente al cambiar precios."
              : "No backups yet. They're created automatically when prices change."}
          </p>
        ) : (
          <>
            {/* Recomendados */}
            {(recommended.day1 || recommended.day3 || recommended.day7) && (
              <div className="mb-8 p-4 bg-[#0a1520] border border-[#1a3f6e] rounded-lg">
                <h3 className="text-sm font-bold text-[#ffd700] mb-4 uppercase tracking-wider">
                  ⭐ {lang === "es" ? "Puntos Recomendados" : "Recommended Restore Points"}
                </h3>
                <div className="space-y-2">
                  {[
                    { backup: recommended.day1, color: "#00c8f0", days: "1" },
                    { backup: recommended.day3, color: "#6aaccf", days: "3" },
                    { backup: recommended.day7, color: "#5a8aaa", days: "7" },
                  ].map(({ backup, color, days }) => backup && (
                    <button key={days}
                      onClick={() => handleRestore(backup.index, `${days} ${lang === "es" ? (days === "1" ? "día" : "días") : (days === "1" ? "day" : "days")}`)}
                      disabled={isRestoring}
                      className="w-full p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50"
                      style={{ borderColor: color, background: `${color}12` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold" style={{ color }}>
                            {days} {lang === "es" ? (days === "1" ? "día atrás" : "días atrás") : (days === "1" ? "day ago" : "days ago")} • {backup.label}
                          </div>
                          <div className="text-xs text-[#5a8aaa]">{backup.date} {backup.time}</div>
                          <div className="text-xs text-[#2a4558] mt-1">{diffLabel(backup)}</div>
                        </div>
                        <div className="text-lg">📅</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Todos los backups */}
            <div>
              <h3 className="text-sm font-bold text-[#5a8aaa] mb-3 uppercase tracking-wider">
                {lang === "es" ? "Todos los backups" : "All backups"}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...allBackups].reverse().map(backup => (
                  <button key={backup.index}
                    onClick={() => handleRestore(backup.index, backup.label)}
                    disabled={isRestoring}
                    className="w-full p-2.5 rounded-lg border border-[#1a3f6e] text-left hover:border-[#2a4558] hover:bg-[#0a1520] disabled:opacity-50 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-mono text-[#5a8aaa]">{backup.date} {backup.time}</div>
                        <div className="text-xs text-[#2a4558] mt-0.5">{diffLabel(backup)}</div>
                      </div>
                      <div className="text-xs font-mono text-[#00c8f0] ml-2">{backup.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 p-3 bg-[#0a1520] border border-[#1a3f6e] rounded-lg text-xs text-[#5a8aaa] space-y-1">
              <p>• {lang === "es" ? "Backups creados automáticamente al cambiar precios" : "Backups created automatically on price changes"}</p>
              <p>• {lang === "es" ? "Se guardan hasta 50 backups por servidor" : "Up to 50 backups kept per server"}</p>
              <p>• {lang === "es" ? "Restaurar reemplaza TODOS los precios del servidor activo" : "Restoring replaces ALL prices for the active server"}</p>
            </div>
          </>
        )}

        <button onClick={onClose}
          className="w-full mt-6 py-2 border border-[#1a3f6e] text-[#5a8aaa] rounded-lg hover:text-white transition-colors text-sm font-mono">
          {lang === "es" ? "Cerrar" : "Close"}
        </button>
      </div>
    </div>
  );
}
