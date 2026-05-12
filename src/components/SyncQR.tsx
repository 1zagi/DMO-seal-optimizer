// ============================================================
//  SyncQR.tsx  —  Sincronización PC ↔ Cel via QR
//
//  ¿Qué codifica el QR?
//  Solo los ranks personales (SealUserData) — los precios ya
//  están en Supabase, la base data viene del JSON del servidor.
//  Formato: { v:1, s: ServerId, r: {sealId: rankIndex} }
//  Usando índice numérico de rank (0-6) para ahorrar espacio.
//
//  Flujo:
//    PC  → muestra QR  → cel escanea → importa ranks
//    CEL → muestra QR  → PC escanea  → importa ranks
// ============================================================

import { useState, useEffect, useRef } from "react";
import type { AppData, SealUserData } from "../lib/types";
import { RANKS, RANK_ORDER } from "../lib/types";
import type { ServerId } from "../lib/supabase";
import type { Lang } from "../lib/i18n";

// ── QR generator (sin dependencias externas — puro canvas) ───

// Usamos la API de QR vía Google Charts como fallback ligero,
// pero con detección de jsQR para el scanner del cel.
const QR_API = (data: string, size = 280) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&ecc=M&margin=2`;

// ── Codificación compacta ─────────────────────────────────────

interface QRPayload {
  v: 1;
  s: ServerId;
  r: Record<string, number>; // sealId → RANKS index (0-6), omite null/Unopened
}

function encodeRanks(userData: Map<string, SealUserData>, serverId: ServerId): string {
  const r: Record<string, number> = {};
  for (const [id, u] of userData.entries()) {
    if (u.currentRank && u.currentRank !== "Unopened") {
      r[id] = RANK_ORDER[u.currentRank];
    }
  }
  const payload: QRPayload = { v: 1, s: serverId, r };
  return JSON.stringify(payload);
}

function decodeRanks(raw: string): { serverId: ServerId; userData: Map<string, SealUserData> } | null {
  try {
    const p = JSON.parse(raw) as QRPayload;
    if (p.v !== 1 || !p.s || !p.r) return null;
    const userData = new Map<string, SealUserData>();
    for (const [id, idx] of Object.entries(p.r)) {
      const rank = RANKS[idx] ?? null;
      userData.set(id, { sealId: id, currentRank: rank });
    }
    return { serverId: p.s as ServerId, userData };
  } catch {
    return null;
  }
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  data: AppData;
  serverId: ServerId;
  lang: Lang;
  onImport: (userData: Map<string, SealUserData>, serverId: ServerId) => void;
  onClose: () => void;
}

// ── Componente principal ──────────────────────────────────────

export function SyncQRModal({ data, serverId, lang, onImport, onClose }: Props) {
  const [mode, setMode] = useState<"show" | "scan">("show");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [sealCount, setSealCount] = useState(0);
  const [scanResult, setScanResult] = useState<{ serverId: ServerId; count: number } | null>(null);
  const [scanError, setScanError] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const t = lang === "es" ? {
    title: "Sincronizar con celular",
    showQR: "Mostrar QR",
    scanQR: "Escanear QR",
    showDesc: "Escanea este QR desde tu celular para importar tus ranks.",
    scanDesc: "Toma una captura del QR desde tu cel y cárgala aquí.",
    loadImg: "Cargar imagen del QR",
    orManual: "O pega el texto del QR manualmente:",
    manual: "Pegar texto JSON...",
    import: "Importar ranks",
    importing: "Importando...",
    imported: "¡Ranks importados!",
    seals: "sellos con rank",
    server: "Servidor",
    wrongServer: "El QR es de otro servidor. ¿Importar de todos modos?",
    noRanks: "No hay ranks que exportar aún.",
    error: "QR inválido — no se pudo leer.",
    close: "Cerrar",
    tip: "💡 Solo se sincronizan los ranks (datos personales). Los precios ya están en la nube.",
  } : {
    title: "Sync with mobile",
    showQR: "Show QR",
    scanQR: "Scan QR",
    showDesc: "Scan this QR from your phone to import your ranks.",
    scanDesc: "Take a screenshot of the QR from your phone and load it here.",
    loadImg: "Load QR image",
    orManual: "Or paste the QR text manually:",
    manual: "Paste JSON text...",
    import: "Import ranks",
    importing: "Importing...",
    imported: "Ranks imported!",
    seals: "seals with rank",
    server: "Server",
    wrongServer: "QR is from a different server. Import anyway?",
    noRanks: "No ranks to export yet.",
    error: "Invalid QR — could not read.",
    close: "Close",
    tip: "💡 Only ranks (personal data) are synced. Prices are already in the cloud.",
  };

  // Generar QR al abrir
  useEffect(() => {
    const userData = new Map<string, SealUserData>();
    let count = 0;
    for (const seal of Object.values(data.seals)) {
      if (seal.currentRank && seal.currentRank !== "Unopened") {
        userData.set(seal.name, { sealId: seal.name, currentRank: seal.currentRank });
        count++;
      }
    }
    setSealCount(count);
    if (count === 0) { setQrUrl(""); return; }
    const encoded = encodeRanks(userData, serverId);
    setQrUrl(QR_API(encoded));
  }, [data, serverId]);

  // ── Leer QR desde imagen ──────────────────────────────────
  const handleImageFile = (file: File) => {
    setScanError("");
    setScanResult(null);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Intentar leer con BarcodeDetector (Chrome/Android nativo)
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        detector.detect(canvas)
          .then((codes: any[]) => {
            if (codes.length === 0) { setScanError(t.error); return; }
            processQRText(codes[0].rawValue);
          })
          .catch(() => setScanError(t.error));
      } else {
        // Fallback: pedir texto manual (no hay jsQR disponible sin npm)
        setScanError("⚠️ " + (lang === "es"
          ? "Tu navegador no soporta lectura de QR automática. Usa la opción de texto manual."
          : "Your browser doesn't support automatic QR reading. Use the manual text option."));
      }
    };
    img.onerror = () => setScanError(t.error);
    img.src = url;
  };

  const processQRText = (raw: string) => {
    const result = decodeRanks(raw.trim());
    if (!result) { setScanError(t.error); return; }
    setScanResult({ serverId: result.serverId, count: result.userData.size });
    setScanError("");
    // Guardar para usar en handleImport
    (window as any).__qrImportData = result;
  };

  const handleImport = () => {
    const result: { serverId: ServerId; userData: Map<string, SealUserData> } | undefined =
      (window as any).__qrImportData;
    if (!result) return;

    if (result.serverId !== serverId) {
      if (!confirm(t.wrongServer)) return;
    }

    setImporting(true);
    setTimeout(() => {
      onImport(result.userData, result.serverId);
      setImporting(false);
      setImported(true);
      setTimeout(() => onClose(), 1500);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="bg-[#09141f] border border-[#1a3f6e] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[#1a3f6e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📱</span>
              <h2 className="text-white font-bold text-sm">{t.title}</h2>
            </div>
            <button onClick={onClose}
              className="text-[#5a8aaa] hover:text-white text-lg transition-colors">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {(["show", "scan"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setScanResult(null); setScanError(""); }}
                className={`flex-1 py-1.5 rounded text-xs font-mono font-bold border transition-all ${mode === m
                  ? "border-[#00c8f0] text-[#00c8f0] bg-[#00c8f0]/12"
                  : "border-[#1a3f6e] text-[#5a8aaa] hover:text-white"
                  }`}>
                {m === "show" ? `📤 ${t.showQR}` : `📷 ${t.scanQR}`}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* ── MODO MOSTRAR QR ── */}
          {mode === "show" && (
            <>
              <p className="text-[#5a8aaa] text-xs font-mono">{t.showDesc}</p>

              {sealCount === 0 ? (
                <div className="py-8 text-center text-[#2a4558] font-mono text-sm">{t.noRanks}</div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="p-2 bg-white rounded-xl">
                      <img src={qrUrl} alt="QR Sync" width={240} height={240}
                        className="rounded-lg" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#060d18] border border-[#1a3f6e]">
                    <div>
                      <p className="text-white text-xs font-bold font-mono">{sealCount} {t.seals}</p>
                      <p className="text-[#5a8aaa] text-[10px] font-mono">{t.server}: {serverId}</p>
                    </div>
                    <div className="text-2xl">⚔️</div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── MODO ESCANEAR ── */}
          {mode === "scan" && (
            <>
              <p className="text-[#5a8aaa] text-xs font-mono">{t.scanDesc}</p>

              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />

              <button onClick={() => fileRef.current?.click()}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[#1a3f6e] text-[#5a8aaa] text-sm font-mono hover:border-[#00c8f0] hover:text-[#00c8f0] transition-all">
                📂 {t.loadImg}
              </button>

              {/* Texto manual */}
              <div>
                <p className="text-[#2a4558] text-[10px] font-mono mb-1">{t.orManual}</p>
                <textarea rows={3}
                  placeholder={t.manual}
                  onChange={e => { if (e.target.value.trim()) processQRText(e.target.value); }}
                  className="w-full px-3 py-2 rounded-lg bg-[#060d18] border border-[#1a3f6e] text-white font-mono text-xs focus:border-[#00c8f0] focus:outline-none resize-none placeholder-[#2a4558]" />
              </div>

              {/* Error */}
              {scanError && (
                <p className="text-red-400 text-xs font-mono">{scanError}</p>
              )}

              {/* Preview resultado */}
              {scanResult && !scanError && (
                <div className="px-3 py-2 rounded-lg border border-[#00e676]/30 bg-[#00e676]/05">
                  <p className="text-[#00e676] text-xs font-bold font-mono">✓ QR leído</p>
                  <p className="text-[#5a8aaa] text-[10px] font-mono mt-0.5">
                    {scanResult.count} {t.seals} · {t.server}: {scanResult.serverId}
                  </p>
                </div>
              )}

              {/* Botón importar */}
              {scanResult && (
                <button onClick={handleImport} disabled={importing || imported}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold font-mono border transition-all ${imported
                    ? "border-[#00e676] text-[#00e676] bg-[#00e676]/10"
                    : "border-[#00c8f0] text-[#00c8f0] bg-[#00c8f0]/10 hover:bg-[#00c8f0]/20"
                    }`}>
                  {imported ? `✓ ${t.imported}` : importing ? t.importing : `⬇ ${t.import}`}
                </button>
              )}
            </>
          )}

          {/* Tip */}
          <p className="text-[#2a4558] text-[10px] font-mono leading-relaxed">{t.tip}</p>
        </div>
      </div>
    </div>
  );
}
