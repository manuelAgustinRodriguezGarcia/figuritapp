import { COUNTRY_META } from "./countryMeta";
import { FWC_STICKERS, STICKERS_PER_TEAM, SECTIONS } from "./albumConfig";
import { PLAYER_STICKERS } from "./playerStickers";

function buildPlayerNameLookup() {
  const map = new Map();
  for (const entry of PLAYER_STICKERS) {
    if (entry.teamCode == null || entry.number == null) continue;
    const key = `${entry.teamCode}:${Number(entry.number)}`;
    map.set(key, entry.playerName);
  }
  return map;
}

const PLAYER_NAME_BY_TEAM_AND_NUMBER = buildPlayerNameLookup();

function buildSpecialSticker(entry) {
  const { code, title, category, ...rest } = entry;
  return {
    id: code,
    code,
    displayCode: code,
    category,
    title,
    type: "special",
    isSpecial: true,
    ...rest,
  };
}

function buildTeamSticker(team, number) {
  const numStr = String(number);
  const code = `${team.code}${numStr}`;
  const isEmblem = number === 1;
  const playerName = PLAYER_NAME_BY_TEAM_AND_NUMBER.get(`${team.code}:${number}`);
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
    ...(playerName
      ? {
          playerName,
          title: playerName,
        }
      : {}),
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
