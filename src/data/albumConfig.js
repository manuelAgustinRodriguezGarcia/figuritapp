// Top-level invariants of the Panini FIFA World Cup 2026 album.
// Generation rules: 1 Panini sticker (0-0) + 19 FWC stickers + 48 teams * 20 stickers = 980.

export const STICKERS_PER_TEAM = 20;

export const FWC_STICKERS = [
  { code: "0-0",   title: "Panini / We Are Panini",            category: "panini" },
  { code: "FWC1",  title: "Emblema Oficial",                   category: "fwc" },
  { code: "FWC2",  title: "Emblema Oficial",                   category: "fwc" },
  { code: "FWC3",  title: "Mascotas Oficiales",                category: "fwc" },
  { code: "FWC4",  title: "Eslogan Oficial",                   category: "fwc" },
  { code: "FWC5",  title: "Pelota Oficial",                    category: "fwc" },
  { code: "FWC6",  title: "Canadá - Países y Ciudades Sede",   category: "fwc" },
  { code: "FWC7",  title: "México - Países y Ciudades Sede",   category: "fwc" },
  { code: "FWC8",  title: "EE.UU. - Países y Ciudades Sede",   category: "fwc" },
  { code: "FWC9",  title: "Italia 1934",                       category: "fwc" },
  { code: "FWC10", title: "Uruguay 1950",                      category: "fwc" },
  { code: "FWC11", title: "Alemania Federal 1954",             category: "fwc" },
  { code: "FWC12", title: "Brasil 1962",                       category: "fwc" },
  { code: "FWC13", title: "Alemania Federal 1974",             category: "fwc" },
  { code: "FWC14", title: "Argentina 1986",                    category: "fwc" },
  { code: "FWC15", title: "Brasil 1994",                       category: "fwc" },
  { code: "FWC16", title: "Brasil 2002",                       category: "fwc" },
  { code: "FWC17", title: "Italia 2006",                       category: "fwc" },
  { code: "FWC18", title: "Alemania 2014",                     category: "fwc" },
  { code: "FWC19", title: "Argentina 2022",                    category: "fwc" },
];

export const SECTIONS = {
  panini: { id: "panini", label: "Panini" },
  fwc:    { id: "fwc",    label: "FWC" },
  team:   { id: "team",   label: "Selecciones" },
};

export const FILTER_OWNERSHIP = {
  ALL:      "all",
  OWNED:    "owned",
  MISSING:  "missing",
  REPEATED: "repeated",
  SPECIAL:  "special",
};

export const STORAGE_KEY = "panini-2026-progress-v3";
