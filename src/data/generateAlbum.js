import { COUNTRY_META } from "./countryMeta";
import { FWC_STICKERS, STICKERS_PER_TEAM, SECTIONS } from "./albumConfig";

function buildSpecialSticker({ code, title, category }) {
  return {
    id: code,
    code,
    displayCode: code,
    category,
    title,
    type: "special",
    isSpecial: true,
  };
}

function buildTeamSticker(team, number) {
  const numStr = String(number);
  const code = `${team.code}${numStr}`;
  const isEmblem = number === 1;
  return {
    id: code,
    code,
    displayCode: code,
    teamCode: team.code,
    teamName: team.name,
    flagCode: team.flagCode,
    colors: team.colors,
    number,
    category: "team",
    type: isEmblem ? "foil-emblem" : "player",
    isSpecial: isEmblem,
  };
}

let cachedAlbum = null;

export function generateAlbum() {
  if (cachedAlbum) return cachedAlbum;

  const stickers = [];

  for (const fwc of FWC_STICKERS) {
    stickers.push(buildSpecialSticker(fwc));
  }

  for (const team of COUNTRY_META) {
    for (let i = 1; i <= STICKERS_PER_TEAM; i++) {
      stickers.push(buildTeamSticker(team, i));
    }
  }

  const teams = COUNTRY_META.map((team) => ({
    ...team,
    stickerIds: stickers
      .filter((s) => s.category === "team" && s.teamCode === team.code)
      .map((s) => s.code),
  }));

  const sections = [
    {
      id: SECTIONS.panini.id,
      label: SECTIONS.panini.label,
      stickerIds: stickers.filter((s) => s.category === "panini").map((s) => s.code),
    },
    {
      id: SECTIONS.fwc.id,
      label: SECTIONS.fwc.label,
      stickerIds: stickers.filter((s) => s.category === "fwc").map((s) => s.code),
    },
    {
      id: SECTIONS.team.id,
      label: SECTIONS.team.label,
      stickerIds: stickers.filter((s) => s.category === "team").map((s) => s.code),
    },
  ];

  const specialStickers = stickers.filter((s) => s.isSpecial);

  cachedAlbum = {
    total: stickers.length,
    specialTotal: specialStickers.length,
    teamsTotal: teams.length,
    stickers,
    teams,
    sections,
  };

  return cachedAlbum;
}
