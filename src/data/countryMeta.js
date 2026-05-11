// Metadata for the 48 national teams in the Panini FIFA World Cup 2026 album.
// Note: Panini/FIFA team codes do not always match flag-icons codes
// (e.g. ARG -> ar, ENG -> gb-eng, KOR -> kr, KSA -> sa, RSA -> za, CIV -> ci, COD -> cd).

/** Official FIFA World Cup 2026 group order (Group A → L). Source of truth for album UI order. */
export const ALBUM_TEAM_ORDER = [
  "MEX", "RSA", "KOR", "CZE",
  "CAN", "BIH", "QAT", "SUI",
  "BRA", "MAR", "HAI", "SCO",
  "USA", "PAR", "AUS", "TUR",
  "GER", "CUW", "CIV", "ECU",
  "NED", "JPN", "SWE", "TUN",
  "BEL", "EGY", "IRN", "NZL",
  "ESP", "CPV", "KSA", "URU",
  "FRA", "SEN", "IRQ", "NOR",
  "ARG", "ALG", "AUT", "JOR",
  "POR", "COD", "UZB", "COL",
  "ENG", "CRO", "GHA", "PAN",
];

function validateAlbumTeamOrder(metaList) {
  const metaCodes = new Set(metaList.map((c) => c.code));
  const order = ALBUM_TEAM_ORDER;

  if (order.length !== 48) {
    throw new Error(`[ALBUM_TEAM_ORDER] Expected 48 team codes, got ${order.length}.`);
  }
  if (order[0] !== "MEX") {
    throw new Error(`[ALBUM_TEAM_ORDER] First team must be MEX, got "${order[0]}".`);
  }
  if (order[order.length - 1] !== "PAN") {
    throw new Error(`[ALBUM_TEAM_ORDER] Last team must be PAN, got "${order[order.length - 1]}".`);
  }

  const seen = new Set();
  for (const code of order) {
    if (seen.has(code)) {
      throw new Error(`[ALBUM_TEAM_ORDER] Duplicate team code: "${code}".`);
    }
    seen.add(code);
    if (!metaCodes.has(code)) {
      throw new Error(`[ALBUM_TEAM_ORDER] Unknown team code "${code}" (not in COUNTRY_META / team metadata).`);
    }
  }

  for (const code of metaCodes) {
    if (!seen.has(code)) {
      throw new Error(`[ALBUM_TEAM_ORDER] Team metadata code "${code}" is missing from ALBUM_TEAM_ORDER.`);
    }
  }
}

export const COUNTRY_META = [
  { code: "ALG", name: "Argelia",                  flagCode: "dz",     colors: { primary: "#006233", secondary: "#FFFFFF", accent: "#D21034" } },
  { code: "ARG", name: "Argentina",                flagCode: "ar",     colors: { primary: "#75AADB", secondary: "#FFFFFF", accent: "#F6B40E" } },
  { code: "AUS", name: "Australia",                flagCode: "au",     colors: { primary: "#012169", secondary: "#FFFFFF", accent: "#E4002B" } },
  { code: "AUT", name: "Austria",                  flagCode: "at",     colors: { primary: "#ED2939", secondary: "#FFFFFF", accent: "#C8102E" } },
  { code: "BEL", name: "Bélgica",                  flagCode: "be",     colors: { primary: "#000000", secondary: "#FFD90C", accent: "#EF3340" } },
  { code: "BIH", name: "Bosnia y Herzegovina",     flagCode: "ba",     colors: { primary: "#002395", secondary: "#FECB00", accent: "#FFFFFF" } },
  { code: "BRA", name: "Brasil",                   flagCode: "br",     colors: { primary: "#009739", secondary: "#FEDD00", accent: "#012169" } },
  { code: "CAN", name: "Canadá",                   flagCode: "ca",     colors: { primary: "#D52B1E", secondary: "#FFFFFF", accent: "#A6192E" } },
  { code: "CIV", name: "Costa de Marfil",          flagCode: "ci",     colors: { primary: "#F77F00", secondary: "#FFFFFF", accent: "#009E60" } },
  { code: "COD", name: "RD del Congo",             flagCode: "cd",     colors: { primary: "#007FFF", secondary: "#F7D618", accent: "#CE1021" } },
  { code: "COL", name: "Colombia",                 flagCode: "co",     colors: { primary: "#FCD116", secondary: "#003893", accent: "#CE1126" } },
  { code: "CPV", name: "Cabo Verde",               flagCode: "cv",     colors: { primary: "#003893", secondary: "#FFFFFF", accent: "#CF2027" } },
  { code: "CRO", name: "Croacia",                  flagCode: "hr",     colors: { primary: "#FF0000", secondary: "#FFFFFF", accent: "#171796" } },
  { code: "CUW", name: "Curazao",                  flagCode: "cw",     colors: { primary: "#002B7F", secondary: "#F9E814", accent: "#FFFFFF" } },
  { code: "CZE", name: "Chequia",                  flagCode: "cz",     colors: { primary: "#11457E", secondary: "#FFFFFF", accent: "#D7141A" } },
  { code: "ECU", name: "Ecuador",                  flagCode: "ec",     colors: { primary: "#FFD100", secondary: "#034EA2", accent: "#ED1C24" } },
  { code: "EGY", name: "Egipto",                   flagCode: "eg",     colors: { primary: "#CE1126", secondary: "#FFFFFF", accent: "#000000" } },
  { code: "ENG", name: "Inglaterra",               flagCode: "gb-eng", colors: { primary: "#FFFFFF", secondary: "#CE1124", accent: "#1C1C1C" } },
  { code: "ESP", name: "España",                   flagCode: "es",     colors: { primary: "#AA151B", secondary: "#F1BF00", accent: "#AA151B" } },
  { code: "FRA", name: "Francia",                  flagCode: "fr",     colors: { primary: "#0055A4", secondary: "#FFFFFF", accent: "#EF4135" } },
  { code: "GER", name: "Alemania",                 flagCode: "de",     colors: { primary: "#000000", secondary: "#DD0000", accent: "#FFCE00" } },
  { code: "GHA", name: "Ghana",                    flagCode: "gh",     colors: { primary: "#CE1126", secondary: "#FCD116", accent: "#006B3F" } },
  { code: "HAI", name: "Haití",                    flagCode: "ht",     colors: { primary: "#00209F", secondary: "#D21034", accent: "#FFFFFF" } },
  { code: "IRN", name: "Irán",                     flagCode: "ir",     colors: { primary: "#239F40", secondary: "#FFFFFF", accent: "#DA0000" } },
  { code: "IRQ", name: "Irak",                     flagCode: "iq",     colors: { primary: "#CE1126", secondary: "#FFFFFF", accent: "#000000" } },
  { code: "JOR", name: "Jordania",                 flagCode: "jo",     colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#CE1126" } },
  { code: "JPN", name: "Japón",                    flagCode: "jp",     colors: { primary: "#FFFFFF", secondary: "#BC002D", accent: "#1C1C1C" } },
  { code: "KOR", name: "Corea del Sur",            flagCode: "kr",     colors: { primary: "#FFFFFF", secondary: "#CD2E3A", accent: "#0047A0" } },
  { code: "KSA", name: "Arabia Saudita",           flagCode: "sa",     colors: { primary: "#006C35", secondary: "#FFFFFF", accent: "#004B2F" } },
  { code: "MAR", name: "Marruecos",                flagCode: "ma",     colors: { primary: "#C1272D", secondary: "#006233", accent: "#FFFFFF" } },
  { code: "MEX", name: "México",                   flagCode: "mx",     colors: { primary: "#006847", secondary: "#FFFFFF", accent: "#CE1126" } },
  { code: "NED", name: "Países Bajos",             flagCode: "nl",     colors: { primary: "#AE1C28", secondary: "#FFFFFF", accent: "#21468B" } },
  { code: "NOR", name: "Noruega",                  flagCode: "no",     colors: { primary: "#BA0C2F", secondary: "#FFFFFF", accent: "#00205B" } },
  { code: "NZL", name: "Nueva Zelanda",            flagCode: "nz",     colors: { primary: "#00247D", secondary: "#FFFFFF", accent: "#CC142B" } },
  { code: "PAN", name: "Panamá",                   flagCode: "pa",     colors: { primary: "#005293", secondary: "#FFFFFF", accent: "#D21034" } },
  { code: "PAR", name: "Paraguay",                 flagCode: "py",     colors: { primary: "#D52B1E", secondary: "#FFFFFF", accent: "#0038A8" } },
  { code: "POR", name: "Portugal",                 flagCode: "pt",     colors: { primary: "#006600", secondary: "#FF0000", accent: "#FFFF00" } },
  { code: "QAT", name: "Catar",                    flagCode: "qa",     colors: { primary: "#8A1538", secondary: "#FFFFFF", accent: "#5B0A24" } },
  { code: "RSA", name: "Sudáfrica",                flagCode: "za",     colors: { primary: "#007A4D", secondary: "#FFB612", accent: "#DE3831" } },
  { code: "SCO", name: "Escocia",                  flagCode: "gb-sct", colors: { primary: "#005EB8", secondary: "#FFFFFF", accent: "#003865" } },
  { code: "SEN", name: "Senegal",                  flagCode: "sn",     colors: { primary: "#00853F", secondary: "#FDEF42", accent: "#E31B23" } },
  { code: "SUI", name: "Suiza",                    flagCode: "ch",     colors: { primary: "#FF0000", secondary: "#FFFFFF", accent: "#D52B1E" } },
  { code: "SWE", name: "Suecia",                   flagCode: "se",     colors: { primary: "#006AA7", secondary: "#FECC00", accent: "#004B87" } },
  { code: "TUN", name: "Túnez",                    flagCode: "tn",     colors: { primary: "#E70013", secondary: "#FFFFFF", accent: "#C10010" } },
  { code: "TUR", name: "Türkiye",                  flagCode: "tr",     colors: { primary: "#E30A17", secondary: "#FFFFFF", accent: "#B00012" } },
  { code: "URU", name: "Uruguay",                  flagCode: "uy",     colors: { primary: "#0038A8", secondary: "#FFFFFF", accent: "#FCD116" } },
  { code: "USA", name: "Estados Unidos",           flagCode: "us",     colors: { primary: "#3C3B6E", secondary: "#FFFFFF", accent: "#B22234" } },
  { code: "UZB", name: "Uzbekistán",               flagCode: "uz",     colors: { primary: "#1EB53A", secondary: "#0099B5", accent: "#CE1126" } },
];

export const COUNTRY_BY_CODE = COUNTRY_META.reduce((acc, country) => {
  acc[country.code] = country;
  return acc;
}, {});

validateAlbumTeamOrder(COUNTRY_META);

/** Country metadata rows in official album (group) order. */
export function getCountryMetaInAlbumOrder() {
  return ALBUM_TEAM_ORDER.map((code) => COUNTRY_BY_CODE[code]);
}
