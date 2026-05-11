import { SORT_MODES } from "@/data/albumConfig";

function compareFwcAlbumOrder(a, b) {
  const aFwc = a.category === "fwc";
  const bFwc = b.category === "fwc";
  if (aFwc && bFwc) {
    if (a.code === "FWC00" && b.code !== "FWC00") return -1;
    if (b.code === "FWC00" && a.code !== "FWC00") return 1;
    const na = Number(String(a.code).replace(/^FWC/i, ""));
    const nb = Number(String(b.code).replace(/^FWC/i, ""));
    const va = Number.isFinite(na) ? na : 999;
    const vb = Number.isFinite(nb) ? nb : 999;
    return va - vb;
  }
  return 0;
}

function sortFwcStickersAlbumOrder(fwcs) {
  return [...fwcs].sort(compareFwcAlbumOrder);
}

/**
 * Teams array from album in display order (for dropdowns, grouping).
 * @param {object[]} teamsFromAlbum
 * @param {string[]} albumTeamOrder
 */
export function orderTeamsForAlbum(teamsFromAlbum, albumTeamOrder) {
  const list = Array.isArray(teamsFromAlbum) ? teamsFromAlbum : [];
  const order = Array.isArray(albumTeamOrder) ? albumTeamOrder : [];
  const byCode = new Map(list.map((t) => [t.code, t]));
  const seen = new Set();
  const out = [];
  for (const code of order) {
    const t = byCode.get(code);
    if (t) {
      out.push(t);
      seen.add(code);
    }
  }
  for (const t of list) {
    if (!seen.has(t.code)) out.push(t);
  }
  return out;
}

/**
 * Orden de equipos en la UI: álbum oficial, A-Z por nombre de selección, o Z-A.
 * @param {object[]} teams — metadatos de equipos del álbum
 * @param {string} sortMode
 * @param {string[]} albumTeamOrder
 */
export function orderTeamsForDisplay(teams, sortMode, albumTeamOrder) {
  const list = Array.isArray(teams) ? [...teams] : [];
  if (sortMode === SORT_MODES.ALBUM) {
    return orderTeamsForAlbum(list, albumTeamOrder);
  }
  if (sortMode === SORT_MODES.AZ) {
    return list.sort((a, b) => {
      const cmp = String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      return String(a.code || "").localeCompare(String(b.code || ""), "es", { numeric: true });
    });
  }
  if (sortMode === SORT_MODES.ZA) {
    return list.sort((a, b) => {
      const cmp = String(b.name || "").localeCompare(String(a.name || ""), "es", { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      return String(b.code || "").localeCompare(String(a.code || ""), "es", { numeric: true });
    });
  }
  return list;
}

/**
 * FWC fijos al inicio (sin orden A-Z). Equipos ordenados por selección; figuritas 1–20 dentro de cada equipo.
 * @param {object[]} filtered — resultado de applyStickerFilters
 * @param {object[]} teams — equipos del álbum (metadatos)
 * @param {string} sortMode
 * @param {string[]} albumTeamOrder
 */
export function groupFilteredAlbumStickers(filtered, teams, sortMode, albumTeamOrder) {
  const list = Array.isArray(filtered) ? filtered : [];
  const fwcStickers = sortFwcStickersAlbumOrder(list.filter((s) => s.category === "fwc"));
  const orderedTeams = orderTeamsForDisplay([...(teams || [])], sortMode, albumTeamOrder || []);
  const teamGroups = orderedTeams
    .map((team) => ({
      team,
      stickers: list
        .filter((s) => s.category === "team" && s.teamCode === team.code)
        .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0)),
    }))
    .filter((g) => g.stickers.length > 0);

  return { fwcStickers, teamGroups };
}

/**
 * @param {object[]} stickers
 * @param {"album" | "az" | "za"} sortMode
 * @param {string[]} albumTeamOrder
 * @returns {object[]}
 */
export function sortStickers(stickers, sortMode, albumTeamOrder) {
  const list = Array.isArray(stickers) ? [...stickers] : [];
  const order = Array.isArray(albumTeamOrder) ? albumTeamOrder : [];
  const teamIndex = new Map(order.map((code, i) => [code, i]));

  if (sortMode === SORT_MODES.AZ || sortMode === SORT_MODES.ZA) {
    const fwcs = sortFwcStickersAlbumOrder(list.filter((s) => s.category === "fwc"));
    const teamStickers = list.filter((s) => s.category === "team");
    const byTeam = new Map();
    for (const s of teamStickers) {
      const code = s.teamCode;
      if (!code) continue;
      if (!byTeam.has(code)) byTeam.set(code, []);
      byTeam.get(code).push(s);
    }
    for (const arr of byTeam.values()) {
      arr.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
    }
    const teamCodes = [...byTeam.keys()];
    const dir = sortMode === SORT_MODES.AZ ? 1 : -1;
    teamCodes.sort((codeA, codeB) => {
      const rowA = byTeam.get(codeA)[0];
      const rowB = byTeam.get(codeB)[0];
      const nameA = rowA?.teamName || codeA;
      const nameB = rowB?.teamName || codeB;
      const cmp = String(nameA).localeCompare(String(nameB), "es", { sensitivity: "base" });
      if (cmp !== 0) return dir * cmp;
      return dir * String(codeA).localeCompare(String(codeB), "es", { numeric: true });
    });
    const out = [...fwcs];
    for (const code of teamCodes) {
      out.push(...byTeam.get(code));
    }
    return out;
  }

  return list.sort((a, b) => {
    const aFwc = a.category === "fwc";
    const bFwc = b.category === "fwc";
    const aTeam = a.category === "team";
    const bTeam = b.category === "team";

    if (aFwc && bFwc) {
      return compareFwcAlbumOrder(a, b);
    }
    if (aFwc && !bFwc) return -1;
    if (!aFwc && bFwc) return 1;

    if (aTeam && bTeam) {
      const ia = teamIndex.has(a.teamCode) ? teamIndex.get(a.teamCode) : 9999;
      const ib = teamIndex.has(b.teamCode) ? teamIndex.get(b.teamCode) : 9999;
      if (ia !== ib) return ia - ib;
      const na = Number(a.number) || 0;
      const nb = Number(b.number) || 0;
      return na - nb;
    }
    if (aTeam && !bTeam) return 1;
    if (!aTeam && bTeam) return -1;

    return String(a.code || "").localeCompare(String(b.code || ""), "es", { numeric: true });
  });
}
