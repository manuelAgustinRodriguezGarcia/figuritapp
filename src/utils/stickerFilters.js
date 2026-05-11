import { FILTER_OWNERSHIP } from "@/data/albumConfig";
import { sortStickers } from "@/utils/stickerSorting";

export { sortStickers, groupFilteredAlbumStickers, orderTeamsForDisplay } from "@/utils/stickerSorting";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function applyStickerFilters(stickers, filters, progress) {
  const owned = progress?.owned || {};
  const duplicates = progress?.duplicates || {};

  const ownership = filters.ownership || FILTER_OWNERSHIP.ALL;
  const sectionId = filters.sectionId || "all";
  const teamCode = filters.teamCode || "all";
  const query = normalize(filters.query || "").trim();

  return stickers.filter((s) => {
    if (sectionId !== "all" && s.category !== sectionId) return false;

    if (teamCode !== "all") {
      if (s.category !== "team") return false;
      if (s.teamCode !== teamCode) return false;
    }

    switch (ownership) {
      case FILTER_OWNERSHIP.OWNED:
        if (!owned[s.code]) return false;
        break;
      case FILTER_OWNERSHIP.MISSING:
        if (owned[s.code]) return false;
        break;
      case FILTER_OWNERSHIP.REPEATED:
        if (!duplicates[s.code] || duplicates[s.code] < 1) return false;
        break;
      case FILTER_OWNERSHIP.SPECIAL:
        if (!s.isSpecial) return false;
        break;
      case FILTER_OWNERSHIP.ALL:
      default:
        break;
    }

    if (query) {
      const haystack = [
        s.code,
        s.displayCode,
        s.teamCode,
        s.teamName,
        s.title,
        s.playerName,
        s.category,
      ]
        .filter(Boolean)
        .map(normalize)
        .join(" ");
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

/**
 * @param {object[]} stickers
 * @param {object} filters
 * @param {object} progress
 * @param {string} sortMode
 * @param {string[]} albumTeamOrder
 */
export function applyStickerFiltersAndSort(stickers, filters, progress, sortMode, albumTeamOrder) {
  const filtered = applyStickerFilters(stickers, filters, progress);
  return sortStickers(filtered, sortMode, albumTeamOrder);
}
