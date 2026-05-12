// ============================================================
//  noMarketSeals.ts  —  Sellos sin precio de mercado en DMO
//  Incluye: eventos, aniversarios, season pass, cash-only, etc.
//  Estos sellos NO tienen precio de mercado activo (o son tan
//  raros que no aplica mostrar "oportunidad de ganancia").
//
//  Tamer Seals: fueron cash shop / temporada, ya no comprables
//  con dinero real, pero AÚN pueden aparecer en el mercado
//  de jugadores. Se marcan igual para no generar falsas alarmas
//  de "sin datos" — si alguien los vende, aparecerán con precio.
// ============================================================

export const DMO_NO_MARKET_SEALS = new Set<string>([
  // ── Aniversarios ────────────────────────────────────────
  "10th Year Anniversary Seal",
  "11th Year Anniversary Seal",
  "12th Year Anniversary Seal",
  "Sweet! 16th Anniversary Cake Seal",

  // ── Aniversario 13 (por atributo) ───────────────────────
  "13th Year Anniversary AT Seal",
  "13th Year Anniversary BL Seal",
  "13th Year Anniversary CT Seal",
  "13th Year Anniversary DE Seal",
  "13th Year Anniversary DS Seal",
  "13th Year Anniversary EV Seal",
  "13th Year Anniversary HP Seal",
  "13th Year Anniversary HT Seal",

  // ── Serie 16th (por atributo) ───────────────────────────
  "16th AT Seal",
  "16th BL Seal",
  "16th CT Seal",
  "16th DE Seal",
  "16th DS Seal",
  "16th EV Seal",
  "16th HP Seal",
  "16th HT Seal",

  // ── Dungeon Masters (por atributo, 3 series) ────────────
  "Dungeon Masters AT Seal",
  "Dungeon Masters BL Seal",
  "Dungeon Masters CT Seal",
  "Dungeon Masters DE Seal",
  "Dungeon Masters DS Seal",
  "Dungeon Masters EV Seal",
  "Dungeon Masters HP Seal",
  "Dungeon Masters HT Seal",
  "Dungeon Masters2 AT Seal",
  "Dungeon Masters2 BL Seal",
  "Dungeon Masters2 CT Seal",
  "Dungeon Masters2 DE Seal",
  "Dungeon Masters2 DS Seal",
  "Dungeon Masters2 EV Seal",
  "Dungeon Masters2 HP Seal",
  "Dungeon Masters2 HT Seal",
  "Dungeon Masters3 AT Seal",
  "Dungeon Masters3 BL Seal",
  "Dungeon Masters3 CT Seal",
  "Dungeon Masters3 DE Seal",
  "Dungeon Masters3 DS Seal",
  "Dungeon Masters3 EV Seal",
  "Dungeon Masters3 HP Seal",
  "Dungeon Masters3 HT Seal",

  // ── Season Pass (por atributo) ──────────────────────────
  "Season Pass AT Seal",
  "Season Pass BL Seal",
  "Season Pass CT Seal",
  "Season Pass DE Seal",
  "Season Pass DS Seal",
  "Season Pass EV Seal",
  "Season Pass HP Seal",
  "Season Pass HT Seal",

  // ── Exploration (por atributo, A/B/C + el genérico) ─────
  "Exploration AT Seal A",
  "Exploration AT Seal B",
  "Exploration AT Seal C",
  "Exploration BL Seal A",
  "Exploration BL Seal B",
  "Exploration BL Seal C",
  "Exploration CT Seal A",
  "Exploration CT Seal B",
  "Exploration CT Seal C",
  "Exploration DE Seal A",
  "Exploration DE Seal B",
  "Exploration DE Seal C",
  "Exploration DS Seal A",
  "Exploration DS Seal B",
  "Exploration DS Seal C",
  "Exploration EV Seal A",
  "Exploration EV Seal B",
  "Exploration EV Seal C",
  "Exploration HP Seal A",
  "Exploration HP Seal B",
  "Exploration HP Seal C",
  "Exploration HT Seal A",
  "Exploration HT Seal B",
  "Exploration HT Seal C",
  "Exploration Seal",

  // ── Estacionales ─────────────────────────────────────────
  "Autumn AT Seal",
  "Autumn CT Seal",
  "Autumn HT Seal",
  "Christmas AT Seal",
  "Christmas DE Seal",
  "Christmas HT Seal",
  "Happy Christmas Seal",
  "Last Seal of 2023",
  "Scorching Summer AT Seal",
  "Scorching Summer CT Seal",
  "Scorching Summer HT Seal",

  // ── [Awaken] ─────────────────────────────────────────────
  "[Awaken] Gallantmon",
  "[Awaken] Gallantmon Crimson Mode",
  "[Awaken] ImperialDramon Paladinmode",
  "[Awaken] Ordinemon",
  "[Awaken] SaintGalgomon",
  "[Awaken] Sakuyamon",
  "[Awaken] Susanoomon",
  "[Awaken] ZeedMillenniumon",

  // ── Tamer Seals (cash/temporada — ya no comprables,
  //    pero pueden aparecer vendidos por jugadores) ─────────
  "Tamer Seal: Patamon T.K.",
  "Tamer Seal: Princess Mimi",
  "Tamer Seal: Matt",
  "Tamer Seal: Gatomon Hikari",

  // ── Eventos / misceláneos ────────────────────────────────
  "Armor Seal",
  "Beginning Seal",
  "Blue Serpent Seal",
  "Brave Seal",
  "Conversion Seal",
  "Environment Seal",
  "Family Seal",
  "Firm Seal",
  "Friendship Seal",
  "Grand Prix Seal",
  "Grow Well Seal",
  "Happiness Seal",
  "Heat Wave Seal",
  "Hope Seal",
  "Knowledge Seal",
  "Life Reversal AT Seal",
  "New Semester Seal",
  "Passionate Seal",
  "Power Digimon Seal",
  "Seal of Coolness",
  "Seal of Heat",
  "Seal of Marksman",
  "Seal of Spring",
  "Seal of Summer",
  "Sincerity Seal",
  "Sprout\u00b4s Seal",
  "Vampiric Seal",
]);

/** Devuelve true si el sello NO tiene mercado activo */
export function isDMONoMarket(sealName: string): boolean {
  return DMO_NO_MARKET_SEALS.has(sealName);
}
