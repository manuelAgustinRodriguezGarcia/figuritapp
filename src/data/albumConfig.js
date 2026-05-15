// Top-level invariants of the Panini FIFA World Cup 2026 album.
// Generation rules: 20 FWC stickers (FWC00–FWC19) + 48 teams * 20 stickers = 980.

export const STICKERS_PER_TEAM = 20;

export const FWC_STICKERS = [
  { code: "FWC00", title: "Panini / We Are Panini", category: "fwc", fwcArt: "gold" },
  { code: "FWC1", title: "Emblema Oficial", category: "fwc", fwcArt: "trophy" },
  { code: "FWC2", title: "Emblema Oficial", category: "fwc", fwcArt: "trophy" },
  { code: "FWC3", title: "Mascotas Oficiales", category: "fwc", fwcArt: "trophy" },
  { code: "FWC4", title: "Eslogan Oficial", category: "fwc", fwcArt: "trophy" },
  { code: "FWC5", title: "Pelota Oficial", category: "fwc", fwcArt: "volleyball" },
  { code: "FWC6", title: "Canadá - Países y Ciudades Sede", category: "fwc", fwcArt: "flag", flagCode: "ca" },
  { code: "FWC7", title: "México - Países y Ciudades Sede", category: "fwc", fwcArt: "flag", flagCode: "mx" },
  { code: "FWC8", title: "EE.UU. - Países y Ciudades Sede", category: "fwc", fwcArt: "flag", flagCode: "us" },
  { code: "FWC9", title: "Italia 1934", category: "fwc", fwcArt: "flag", flagCode: "it" },
  { code: "FWC10", title: "Uruguay 1950", category: "fwc", fwcArt: "flag", flagCode: "uy" },
  { code: "FWC11", title: "Alemania Federal 1954", category: "fwc", fwcArt: "flag", flagCode: "de" },
  { code: "FWC12", title: "Brasil 1962", category: "fwc", fwcArt: "flag", flagCode: "br" },
  { code: "FWC13", title: "Alemania Federal 1974", category: "fwc", fwcArt: "flag", flagCode: "de" },
  { code: "FWC14", title: "Argentina 1986", category: "fwc", fwcArt: "flag", flagCode: "ar" },
  { code: "FWC15", title: "Brasil 1994", category: "fwc", fwcArt: "flag", flagCode: "br" },
  { code: "FWC16", title: "Brasil 2002", category: "fwc", fwcArt: "flag", flagCode: "br" },
  { code: "FWC17", title: "Italia 2006", category: "fwc", fwcArt: "flag", flagCode: "it" },
  { code: "FWC18", title: "Alemania 2014", category: "fwc", fwcArt: "flag", flagCode: "de" },
  { code: "FWC19", title: "Argentina 2022", category: "fwc", fwcArt: "flag", flagCode: "ar" },
];

export const SECTIONS = {
  fwc: { id: "fwc", label: "FWC" },
  team: { id: "team", label: "Selecciones" },
};

export const FILTER_OWNERSHIP = {
  ALL: "all",
  OWNED: "owned",
  MISSING: "missing",
  REPEATED: "repeated",
  SPECIAL: "special",
};

/** Album grid sort modes (internal values). */
export const SORT_MODES = Object.freeze({
  /** Figurita 0 → última (orden oficial del álbum). */
  ALBUM: "album",
  /** Figurita última → 0 (orden inverso). */
  ALBUM_DESC: "album-desc",
  AZ: "az",
  ZA: "za",
});

export const STORAGE_KEY = "panini-2026-progress-v3";

/** Legacy progress / import keys mapped to FWC00 */
export const LEGACY_PANINI_STICKER_CODE = "0-0";
