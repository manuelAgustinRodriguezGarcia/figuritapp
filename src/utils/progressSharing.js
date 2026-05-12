import { getCountryMetaInAlbumOrder } from "@/data/countryMeta";
import { formatStickerCodeSpaced } from "./repeatedSharing";
import { normalizeStickerCode, getStickerByCode, isValidStickerCode } from "./stickerCode";
import {
  TEAM_FLAG_EMOJIS,
  SECTION_EMOJIS,
  TEAM_CODES,
  getEmojiToTeamsMap,
} from "./flagEmojiMap";

const SHARE_TITLE = "FIGURITAPP . Mi progreso:";
const FOOTER_LINE_1 = "Guardá tus figuritas en FIGURITAPP:";
const FOOTER_URL = "https://figuritapp-eight.vercel.app/";

const OWNED_HEADING_KEYS = new Set([
  "figuritas",
  "mis figuritas",
  "conseguidas",
  "tengo",
  "album",
  "owned",
  "stickers",
]);

const REPES_HEADING_KEYS = new Set([
  "repes",
  "repetidas",
  "mis repetidas",
  "swaps",
  "duplicates",
  "repeated",
]);

function normalizeHeadingKey(line) {
  let s = String(line || "").trim();
  if (s.endsWith(":")) s = s.slice(0, -1).trim();
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0300/g, "");
}

/** @param {string} line */
export function detectProgressSectionHeading(line) {
  const t = String(line || "").trim();
  if (!t) return null;
  const key = normalizeHeadingKey(t);
  if (REPES_HEADING_KEYS.has(key)) return "repeated";
  if (OWNED_HEADING_KEYS.has(key)) return "owned";
  if (/^lista\s+de\s+repes$/i.test(key)) return "repeated";
  return null;
}

function analyzeTextHeadings(text) {
  const lines = String(text || "").split(/\r?\n/);
  let hasOwnedHeading = false;
  let hasRepesHeading = false;
  for (const raw of lines) {
    const h = detectProgressSectionHeading(raw);
    if (h === "owned") hasOwnedHeading = true;
    if (h === "repeated") hasRepesHeading = true;
  }
  const full = String(text || "");
  const hasRepesContext =
    /\b(lista\s+de\s+repes|repes\b|repetidas\b|swaps\b|duplicates\b|repeated\b)/i.test(full);
  return { hasOwnedHeading, hasRepesHeading, hasRepesContext };
}

function looksLikeAnySectionOrTeamEmoji(str) {
  if (!str) return false;
  if (str.includes(SECTION_EMOJIS.FWC) || str.includes("🏆") || str.includes("📜")) return true;
  if (str.includes(SECTION_EMOJIS.PANINI)) return true;
  return Object.values(TEAM_FLAG_EMOJIS).some((e) => str.includes(e));
}

function hasUnexpectedEmoji(rest, expectedEmoji) {
  if (!rest || !expectedEmoji) return false;
  return looksLikeAnySectionOrTeamEmoji(rest) && !rest.includes(expectedEmoji);
}

function splitPrefixWord(s) {
  const t = s.trim();
  if (!t) return { kind: "empty" };
  if (/^PANINI\b/i.test(t)) {
    return { kind: "word", word: "PANINI", rest: t.replace(/^PANINI\s*/i, "").trim() };
  }
  if (/^FWC\b/i.test(t)) {
    return { kind: "word", word: "FWC", rest: t.replace(/^FWC\s*/i, "").trim() };
  }
  const m = t.match(/^([A-Za-z]{3})(?:\s+|$)/);
  if (m) {
    return { kind: "word", word: m[1].toUpperCase(), rest: t.slice(m[0].length).trim() };
  }
  return { kind: "emoji", rest: t };
}

function inferFromEmojiOnly(s) {
  const t = s.trim();
  if (t === SECTION_EMOJIS.FWC || t.startsWith(SECTION_EMOJIS.FWC) || t === "🏆" || t === "📜") {
    return { section: "fwc" };
  }
  if (t.includes(SECTION_EMOJIS.PANINI) || /^🅿️/.test(t)) {
    return { section: "panini" };
  }

  const map = getEmojiToTeamsMap();
  for (const [emoji, teams] of map.entries()) {
    if (!emoji) continue;
    if (t === emoji) {
      if (teams.length > 1) {
        return { error: "Bandera ambigua. Usá el código ENG o SCO." };
      }
      return { section: "team", teamCode: teams[0] };
    }
  }

  for (const [emoji, teams] of map.entries()) {
    if (!emoji || t === emoji) continue;
    if (t.startsWith(emoji)) {
      if (teams.length > 1) {
        return { error: "Bandera ambigua. Usá el código ENG o SCO." };
      }
      return { section: "team", teamCode: teams[0] };
    }
  }

  return { error: "No se reconoce el emoji o el código de país." };
}

function classifyPrefix(left, line, warnings) {
  const sp = splitPrefixWord(left);
  if (sp.kind === "empty") {
    return { error: "Prefijo vacío." };
  }
  if (sp.kind === "word") {
    const w = sp.word;
    const rest = sp.rest || "";
    if (w === "PANINI") {
      if (hasUnexpectedEmoji(rest, SECTION_EMOJIS.PANINI)) {
        warnings.push({
          sourceLine: line,
          reason: "El emoji junto a PANINI no coincide con el esperado.",
        });
      }
      return { section: "panini" };
    }
    if (w === "FWC") {
      const restOnlyFwcDecor = rest && /^[\s🌎🏆📜]*$/u.test(rest);
      if (rest && !restOnlyFwcDecor && hasUnexpectedEmoji(rest, SECTION_EMOJIS.FWC)) {
        warnings.push({
          sourceLine: line,
          reason: "El emoji junto a FWC no coincide con el esperado.",
        });
      }
      return { section: "fwc" };
    }
    if (!TEAM_CODES.has(w)) {
      return { error: `Código de país no reconocido (${w}).` };
    }
    const expected = TEAM_FLAG_EMOJIS[w];
    if (rest && expected && hasUnexpectedEmoji(rest, expected)) {
      warnings.push({
        sourceLine: line,
        reason: `El código y la bandera no coinciden. Se usó el código ${w}.`,
      });
    }
    return { section: "team", teamCode: w };
  }
  return inferFromEmojiOnly(sp.rest);
}

function expandShareTokens(right) {
  const normalized = String(right).replace(/\s*\/\s*/g, ",");
  return normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((part) => {
      if (/^\s*0-0/i.test(part)) return [part.trim()];
      if (/\(x/i.test(part) || /x\d+\s*$/i.test(part)) return [part.trim()];
      if (/\s/.test(part)) return part.split(/\s+/).filter(Boolean);
      return [part.trim()];
    });
}

function parsePaniniQuantityToken(tok) {
  const t = tok.trim();
  const m = t.match(/^0-0(?:\s*\(\s*x\s*(\d+)\s*\)|\s+x\s*(\d+)|x(\d+))?$/i);
  if (!m) {
    return { ok: false, reason: "Solo se admite 0-0 en PANINI." };
  }
  const c = Number(m[1] || m[2] || m[3] || 1);
  if (!Number.isInteger(c) || c < 1) {
    return { ok: false, reason: "Cantidad inválida para 0-0." };
  }
  return { ok: true, count: c };
}

function parseNumericStickerToken(tok, section) {
  const t = tok.trim().replace(/\s+/g, " ");
  let n;
  let c = 1;
  const paren = t.match(/^(\d{1,3})\s*\(\s*x\s*(\d+)\s*\)$/i);
  const sp = t.match(/^(\d{1,3})\s+x\s*(\d+)$/i);
  const nxTight = t.match(/^(\d{1,3})x(\d+)$/i);
  if (paren) {
    n = Number.parseInt(paren[1], 10);
    c = Number.parseInt(paren[2], 10);
  } else if (sp) {
    n = Number.parseInt(sp[1], 10);
    c = Number.parseInt(sp[2], 10);
  } else if (nxTight) {
    n = Number.parseInt(nxTight[1], 10);
    c = Number.parseInt(nxTight[2], 10);
  } else if (/^\d{1,3}$/.test(t)) {
    n = Number.parseInt(t, 10);
  } else {
    return { ok: false, reason: `No se entendió el número "${tok}".` };
  }
  if (!Number.isInteger(c) || c < 1) {
    return { ok: false, reason: "La cantidad repetida debe ser un entero mayor a 0." };
  }
  if (section === "fwc") {
    if (n < 1 || n > 19) {
      return { ok: false, reason: `El número debe estar entre 1 y 19 (FWC).` };
    }
  } else {
    if (n < 1 || n > 20) {
      return { ok: false, reason: "El número debe estar entre 1 y 20." };
    }
  }
  return { ok: true, num: n, count: c };
}

export function isProgressNoiseLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^FIGURITAPP\b/i.test(t)) return true;
  if (/^Guardá tus figuritas\b/i.test(t)) return true;
  if (/^Descargá\b/i.test(t) || /^Download\b/i.test(t)) return true;
  if (/^Figuritas App\b/i.test(t)) return true;
  if (/^Usa Mex Can\b/i.test(t)) return true;
  return false;
}

function pushOwned(code, sourceLine, albumStickers, ownedList, invalidList) {
  if (!isValidStickerCode(code, albumStickers)) {
    invalidList.push({
      value: code,
      sourceLine,
      reason: "Este código no existe en el álbum.",
    });
    return;
  }
  ownedList.push({ code, sourceLine });
}

function pushDuplicate(code, count, sourceLine, albumStickers, dupList, invalidList) {
  if (!isValidStickerCode(code, albumStickers)) {
    invalidList.push({
      value: code,
      sourceLine,
      reason: "Este código no existe en el álbum.",
    });
    return;
  }
  dupList.push({ code, count, sourceLine });
}

function tryStandalonePanini(line, section, albumStickers, owned, duplicates, unknown, invalid, mode) {
  const t = line.trim();
  if (t.includes(":")) return false;
  const m = t.match(/^0-0(?:\s*\(\s*x\s*(\d+)\s*\)|\s+x\s*(\d+)|x(\d+))?$/i);
  if (!m) return false;
  const c = Number(m[1] || m[2] || m[3] || 1);
  if (!Number.isInteger(c) || c < 1) {
    invalid.push({ value: t, sourceLine: t, reason: "Cantidad inválida para 0-0." });
    return true;
  }
  if (mode === "infer") {
    if (section === "owned") {
      pushOwned("FWC00", t, albumStickers, owned, invalid);
    } else if (section === "repeated") {
      pushDuplicate("FWC00", c, t, albumStickers, duplicates, invalid);
    } else {
      unknown.push({ code: "FWC00", count: c, sourceLine: t });
    }
    return true;
  }
  if (mode === "owned") {
    pushOwned("FWC00", t, albumStickers, owned, invalid);
  } else {
    pushDuplicate("FWC00", c, t, albumStickers, duplicates, invalid);
  }
  return true;
}

/**
 * @param {"owned" | "repeated" | "infer"} mode infer: use dup counts only in repeated
 */
function parseStickerListLine(line, lineMode, albumStickers, owned, duplicates, invalid, warnings) {
  const colon = line.indexOf(":");
  const left = line.slice(0, colon).trim();
  const right = line.slice(colon + 1).trim();
  if (!right) {
    invalid.push({
      value: line,
      sourceLine: line,
      reason: "Falta la lista de números después de ':'.",
    });
    return;
  }

  const prefix = classifyPrefix(left, line, warnings);
  if (prefix.error) {
    invalid.push({
      value: line,
      sourceLine: line,
      reason: prefix.error,
    });
    return;
  }

  const tokens = expandShareTokens(right);

  if (prefix.section === "panini") {
    for (const tok of tokens) {
      const r = parsePaniniQuantityToken(tok);
      if (!r.ok) {
        invalid.push({ value: `${line} → ${tok}`, sourceLine: line, reason: r.reason });
        continue;
      }
      const effectiveCount = lineMode === "owned" ? 1 : r.count;
      if (lineMode === "owned") {
        pushOwned("FWC00", line, albumStickers, owned, invalid);
      } else {
        pushDuplicate("FWC00", effectiveCount, line, albumStickers, duplicates, invalid);
      }
    }
    return;
  }

  if (prefix.section === "fwc") {
    for (const tok of tokens) {
      const r = parseNumericStickerToken(tok, "fwc");
      if (!r.ok) {
        invalid.push({ value: `${line} → ${tok}`, sourceLine: line, reason: r.reason });
        continue;
      }
      const code = `FWC${r.num}`;
      if (lineMode === "owned") {
        pushOwned(code, line, albumStickers, owned, invalid);
      } else {
        pushDuplicate(code, r.count, line, albumStickers, duplicates, invalid);
      }
    }
    return;
  }

  if (prefix.section === "team" && prefix.teamCode) {
    for (const tok of tokens) {
      const r = parseNumericStickerToken(tok, "team");
      if (!r.ok) {
        invalid.push({ value: `${line} → ${tok}`, sourceLine: line, reason: r.reason });
        continue;
      }
      const code = `${prefix.teamCode}${r.num}`;
      if (lineMode === "owned") {
        pushOwned(code, line, albumStickers, owned, invalid);
      } else {
        pushDuplicate(code, r.count, line, albumStickers, duplicates, invalid);
      }
    }
  }
}

function parseLineToUnknownCandidates(line, albumStickers, invalid, warnings) {
  const colon = line.indexOf(":");
  const left = line.slice(0, colon).trim();
  const right = line.slice(colon + 1).trim();
  if (!right) {
    invalid.push({ value: line, sourceLine: line, reason: "Falta la lista de números después de ':'." });
    return [];
  }
  const prefix = classifyPrefix(left, line, warnings);
  if (prefix.error) {
    invalid.push({ value: line, sourceLine: line, reason: prefix.error });
    return [];
  }
  const tokens = expandShareTokens(right);
  const out = [];
  if (prefix.section === "panini") {
    for (const tok of tokens) {
      const r = parsePaniniQuantityToken(tok);
      if (!r.ok) {
        invalid.push({ value: `${line} → ${tok}`, sourceLine: line, reason: r.reason });
        continue;
      }
      out.push({ code: "FWC00", count: r.count, sourceLine: line });
    }
    return out;
  }
  if (prefix.section === "fwc") {
    for (const tok of tokens) {
      const r = parseNumericStickerToken(tok, "fwc");
      if (!r.ok) {
        invalid.push({ value: `${line} → ${tok}`, sourceLine: line, reason: r.reason });
        continue;
      }
      out.push({ code: `FWC${r.num}`, count: r.count, sourceLine: line });
    }
    return out;
  }
  if (prefix.section === "team" && prefix.teamCode) {
    for (const tok of tokens) {
      const r = parseNumericStickerToken(tok, "team");
      if (!r.ok) {
        invalid.push({ value: `${line} → ${tok}`, sourceLine: line, reason: r.reason });
        continue;
      }
      out.push({ code: `${prefix.teamCode}${r.num}`, count: r.count, sourceLine: line });
    }
  }
  return out;
}

// Remove broken handleStickerLine and replace with clean implementation.

function handleStickerLineV2(
  line,
  bucket,
  albumStickers,
  owned,
  duplicates,
  unknownSection,
  invalid,
  warnings,
) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];

  const standaloneMode =
    bucket === "owned" ? "owned" : bucket === "repeated" ? "repeated" : "infer";
  if (tryStandalonePanini(line, bucket === "unknown" ? null : bucket, stickers, owned, duplicates, unknownSection, invalid, standaloneMode)) {
    return;
  }
  if (!line.includes(":")) return;

  if (bucket === "unknown") {
    const candidates = parseLineToUnknownCandidates(line, stickers, invalid, warnings);
    for (const c of candidates) {
      if (!isValidStickerCode(c.code, stickers)) {
        invalid.push({
          value: c.code,
          sourceLine: c.sourceLine,
          reason: "Este código no existe en el álbum.",
        });
        continue;
      }
      unknownSection.push({
        code: c.code,
        count: c.count,
        sourceLine: c.sourceLine,
      });
    }
    return;
  }

  if (bucket === "owned") {
    parseStickerListLine(line, "owned", stickers, owned, duplicates, invalid, warnings);
  } else {
    parseStickerListLine(line, "repeated", stickers, owned, duplicates, invalid, warnings);
  }
}

function dedupeOwnedEntries(entries) {
  const seen = new Set();
  const out = [];
  for (const e of entries) {
    if (seen.has(e.code)) continue;
    seen.add(e.code);
    out.push(e);
  }
  return out;
}

function mergeDuplicateEntries(entries) {
  const map = new Map();
  for (const e of entries) {
    const prev = map.get(e.code) || 0;
    map.set(e.code, prev + (Number(e.count) || 0));
  }
  const out = [];
  for (const [code, count] of map.entries()) {
    const sourceLine = entries.find((x) => x.code === code)?.sourceLine || "";
    out.push({ code, count, sourceLine });
  }
  return out;
}

/**
 * @param {Record<string, unknown>} progress
 * @param {object[]} albumStickers
 * @param {object[]} [teams]
 */
export function groupStickerCodesForShare(stickerCodes, albumStickers, teams) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const order = Array.isArray(teams) && teams.length ? teams : getCountryMetaInAlbumOrder();
  const validCodes = [];
  for (const raw of stickerCodes || []) {
    const code = normalizeStickerCode(typeof raw === "string" ? raw : String(raw));
    if (code && isValidStickerCode(code, stickers)) validCodes.push(code);
  }

  let panini = false;
  const fwc = new Set();
  const teamMap = new Map();

  for (const code of validCodes) {
    if (code === "FWC00") {
      panini = true;
      continue;
    }
    if (code.startsWith("FWC")) {
      const n = Number(code.slice(3));
      if (Number.isFinite(n) && n >= 1 && n <= 19) fwc.add(n);
      continue;
    }
    const m = /^([A-Z]{3})(\d{1,2})$/.exec(code);
    if (m) {
      const tc = m[1];
      const n = Number(m[2]);
      if (!teamMap.has(tc)) teamMap.set(tc, new Set());
      teamMap.get(tc).add(n);
    }
  }

  return {
    panini,
    fwcNums: [...fwc].sort((a, b) => a - b),
    teamNums: teamMap,
    countryOrder: order,
  };
}

function newDupGroups() {
  return {
    panini: 0,
    fwc: new Map(),
    teams: new Map(),
  };
}

function feedDupGroups(groups, code, count) {
  if (code === "FWC00") {
    groups.panini += count;
    return;
  }
  if (code.startsWith("FWC")) {
    const num = Number(code.slice(3));
    if (Number.isFinite(num)) {
      groups.fwc.set(num, (groups.fwc.get(num) || 0) + count);
    }
    return;
  }
  const m = /^([A-Z]{3})(\d{1,2})$/.exec(code);
  if (!m) return;
  const tc = m[1];
  const num = Number(m[2]);
  if (!groups.teams.has(tc)) groups.teams.set(tc, new Map());
  const tm = groups.teams.get(tc);
  tm.set(num, (tm.get(num) || 0) + count);
}

/**
 * @param {Record<string, unknown>} duplicates
 * @param {object[]} albumStickers
 * @param {object[]} [teams]
 */
export function groupDuplicateCodesForShare(duplicates, albumStickers, teams) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const order = Array.isArray(teams) && teams.length ? teams : getCountryMetaInAlbumOrder();
  const dup = duplicates && typeof duplicates === "object" && !Array.isArray(duplicates) ? duplicates : {};
  const groups = newDupGroups();
  for (const [rawKey, rawCount] of Object.entries(dup)) {
    const n = Number(rawCount);
    if (!Number.isInteger(n) || n < 1) continue;
    const code = normalizeStickerCode(rawKey);
    if (!code || !isValidStickerCode(code, stickers)) continue;
    feedDupGroups(groups, code, n);
  }
  return { groups, countryOrder: order };
}

function formatRepesNumChunk(n, c, isZeroZero) {
  if (isZeroZero) {
    return c > 1 ? `0-0(x${c})` : "0-0";
  }
  return c > 1 ? `${n}(x${c})` : `${n}`;
}

function formatFwcShareLine(groups) {
  if (groups.fwc.size === 0) return null;
  const nums = [...groups.fwc.entries()].sort((a, b) => a[0] - b[0]);
  const parts = nums.map(([n, c]) => formatRepesNumChunk(n, c, false));
  return `FWC ${SECTION_EMOJIS.FWC}: ${parts.join(", ")}`;
}

function formatPaniniShareLine(paniniTotal) {
  if (paniniTotal <= 0) return null;
  return `PANINI ${SECTION_EMOJIS.PANINI}: ${formatRepesNumChunk(0, paniniTotal, true)}`;
}

function formatTeamShareLine(teamCode, numMap) {
  const emoji = TEAM_FLAG_EMOJIS[teamCode];
  if (!emoji) return null;
  const nums = [...numMap.entries()].sort((a, b) => a[0] - b[0]);
  const parts = nums.map(([n, c]) => formatRepesNumChunk(n, c, false));
  return `${teamCode} ${emoji}: ${parts.join(", ")}`;
}

function formatOwnedFwcLine(nums) {
  if (!nums.length) return null;
  const parts = nums.map((n) => String(n));
  return `FWC ${SECTION_EMOJIS.FWC}: ${parts.join(", ")}`;
}

function formatOwnedPaniniLine() {
  return `PANINI ${SECTION_EMOJIS.PANINI}: 0-0`;
}

function formatOwnedTeamLine(teamCode, numSet) {
  const emoji = TEAM_FLAG_EMOJIS[teamCode];
  if (!emoji) return null;
  const nums = [...numSet].sort((a, b) => a - b);
  const parts = nums.map((n) => String(n));
  return `${teamCode} ${emoji}: ${parts.join(", ")}`;
}

/**
 * @param {{ owned?: Record<string, boolean>, duplicates?: Record<string, unknown> }} progress
 * @param {object[]} albumStickers
 * @param {object[]} [teams]
 */
export function formatProgressShareText(progress, albumStickers, teams) {
  const ownedMap = progress?.owned && typeof progress.owned === "object" ? progress.owned : {};
  const ownedCodes = Object.keys(ownedMap).filter((k) => ownedMap[k] === true);

  const grouped = groupStickerCodesForShare(ownedCodes, albumStickers, teams);
  const dupBundle = groupDuplicateCodesForShare(progress?.duplicates || {}, albumStickers, teams);
  const { groups: dupGroups, countryOrder } = dupBundle;

  const lines = [SHARE_TITLE, ""];

  lines.push("Figuritas:");
  const ownedLines = [];
  if (grouped.panini) ownedLines.push(formatOwnedPaniniLine());
  const olFwc = formatOwnedFwcLine(grouped.fwcNums);
  if (olFwc) ownedLines.push(olFwc);
  for (const country of grouped.countryOrder || getCountryMetaInAlbumOrder()) {
    const m = grouped.teamNums.get(country.code);
    if (!m || m.size === 0) continue;
    const tl = formatOwnedTeamLine(country.code, m);
    if (tl) ownedLines.push(tl);
  }
  if (ownedLines.length === 0) {
    lines.push("Todavía no marcaste figuritas conseguidas.");
  } else {
    for (const ol of ownedLines) lines.push(ol);
  }

  lines.push("");
  lines.push("Repes:");
  const repLines = [];
  const pl = formatPaniniShareLine(dupGroups.panini);
  if (pl) repLines.push(pl);
  const fl = formatFwcShareLine(dupGroups);
  if (fl) repLines.push(fl);
  for (const country of countryOrder || getCountryMetaInAlbumOrder()) {
    const m = dupGroups.teams.get(country.code);
    if (!m || m.size === 0) continue;
    const tl = formatTeamShareLine(country.code, m);
    if (tl) repLines.push(tl);
  }
  if (repLines.length === 0) {
    lines.push("Todavía no tenés figuritas repetidas.");
  } else {
    for (const rl of repLines) lines.push(rl);
  }

  lines.push("");
  lines.push(FOOTER_LINE_1);
  lines.push(FOOTER_URL);

  return lines.join("\n");
}

/**
 * Texto FIGURITAPP solo con la sección "Figuritas" (sin Repes), para copiar resultado del calculador.
 * @param {string[]} ownedCodes
 * @param {object[]} albumStickers
 * @param {object[]} [teams]
 */
export function formatProgressFiguritasOnlyShareText(ownedCodes, albumStickers, teams) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const grouped = groupStickerCodesForShare(ownedCodes, stickers, teams);

  const lines = [SHARE_TITLE, "", "Figuritas:"];
  const ownedLines = [];
  if (grouped.panini) ownedLines.push(formatOwnedPaniniLine());
  const olFwc = formatOwnedFwcLine(grouped.fwcNums);
  if (olFwc) ownedLines.push(olFwc);
  for (const country of grouped.countryOrder || getCountryMetaInAlbumOrder()) {
    const m = grouped.teamNums.get(country.code);
    if (!m || m.size === 0) continue;
    const tl = formatOwnedTeamLine(country.code, m);
    if (tl) ownedLines.push(tl);
  }
  if (ownedLines.length === 0) {
    lines.push("Todavía no marcaste figuritas conseguidas.");
  } else {
    for (const ol of ownedLines) lines.push(ol);
  }

  lines.push("");
  lines.push(FOOTER_LINE_1);
  lines.push(FOOTER_URL);

  return lines.join("\n");
}

const MISSING_SHARE_TITLE = "FIGURITAPP . Me faltan estas figus:";

/**
 * Lista FIGURITAPP de figuritas del álbum que todavía no están marcadas como conseguidas.
 * @param {{ owned?: Record<string, boolean>, duplicates?: Record<string, unknown> }} progress
 * @param {object[]} albumStickers
 * @param {object[]} [teams]
 */
export function formatMissingFiguritasShareText(progress, albumStickers, teams) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const ownedMap = progress?.owned && typeof progress.owned === "object" ? progress.owned : {};
  const missingCodes = stickers.map((s) => s.code).filter((code) => Boolean(code) && !ownedMap[code]);
  const grouped = groupStickerCodesForShare(missingCodes, stickers, teams);

  const lines = [MISSING_SHARE_TITLE, "", "Figuritas:"];
  const bodyLines = [];
  if (grouped.panini) bodyLines.push(formatOwnedPaniniLine());
  const olFwc = formatOwnedFwcLine(grouped.fwcNums);
  if (olFwc) bodyLines.push(olFwc);
  for (const country of grouped.countryOrder || getCountryMetaInAlbumOrder()) {
    const m = grouped.teamNums.get(country.code);
    if (!m || m.size === 0) continue;
    const tl = formatOwnedTeamLine(country.code, m);
    if (tl) bodyLines.push(tl);
  }
  if (bodyLines.length === 0) {
    if (!stickers.length) {
      lines.push("Todavía no hay datos del álbum para armar la lista.");
    } else {
      lines.push("¡Ya marcaste todas las figuritas! No te falta ninguna.");
    }
  } else {
    for (const ol of bodyLines) lines.push(ol);
  }

  lines.push("");
  lines.push(FOOTER_LINE_1);
  lines.push(FOOTER_URL);

  return lines.join("\n");
}

/**
 * Interpreta una línea estilo export (con ":") como lista de figuritas conseguidas y devuelve códigos.
 * @param {string} line
 * @param {object[]} albumStickers
 * @param {object[]} [warnings]
 */
export function parseShareFormatLineAsOwnedEntries(line, albumStickers, warnings) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const owned = [];
  const invalid = [];
  const w = warnings || [];
  if (tryStandalonePanini(line, "owned", stickers, owned, [], [], invalid, "owned")) {
    return { entries: dedupeOwnedEntries(owned), invalid };
  }
  if (!line.includes(":")) {
    return { entries: [], invalid };
  }
  parseStickerListLine(line, "owned", stickers, owned, [], invalid, w);
  return { entries: dedupeOwnedEntries(owned), invalid };
}

/**
 * @param {string} text
 * @param {object[]} albumStickers
 */
export function parseProgressShareText(text, albumStickers) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const trimmed = String(text ?? "").trim();
  const owned = [];
  const duplicates = [];
  const unknownSection = [];
  const invalid = [];
  const warnings = [];

  if (!trimmed) {
    return { owned: [], duplicates: [], unknownSection: [], invalid: [], warnings: [] };
  }

  if (trimmed.startsWith("{")) {
    return {
      owned: [],
      duplicates: [],
      unknownSection: [],
      invalid: [
        {
          value: "{…}",
          sourceLine: trimmed.slice(0, 80),
          reason: "Este importador no admite JSON. Pegá una lista de texto.",
        },
      ],
      warnings: [],
    };
  }

  const { hasOwnedHeading, hasRepesHeading, hasRepesContext } = analyzeTextHeadings(trimmed);
  let section = /** @type {null | "owned" | "repeated"} */ (null);

  const lines = trimmed.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (isProgressNoiseLine(line)) continue;

    const h = detectProgressSectionHeading(line);
    if (h) {
      section = h;
      continue;
    }

    let bucket = /** @type {"owned" | "repeated" | "unknown"} */ ("unknown");
    if (section === "owned") bucket = "owned";
    else if (section === "repeated") bucket = "repeated";
    else {
      if (hasRepesContext && !hasOwnedHeading) bucket = "repeated";
      else if (!hasOwnedHeading && !hasRepesHeading && !hasRepesContext) bucket = "unknown";
      else if (hasOwnedHeading || hasRepesHeading) bucket = "unknown";
      else bucket = "unknown";
    }

    handleStickerLineV2(line, bucket, stickers, owned, duplicates, unknownSection, invalid, warnings);
  }

  return {
    owned: dedupeOwnedEntries(owned),
    duplicates: mergeDuplicateEntries(duplicates),
    unknownSection,
    invalid,
    warnings,
  };
}

/**
 * @param {ReturnType<typeof parseProgressShareText>} parsed
 * @param {"owned" | "repeated"} choice
 */
export function mergeParsedWithUnknownResolution(parsed, choice) {
  const owned = [...(parsed.owned || [])];
  const duplicates = [...(parsed.duplicates || [])];
  for (const u of parsed.unknownSection || []) {
    if (choice === "owned") {
      owned.push({ code: u.code, sourceLine: u.sourceLine });
    } else {
      duplicates.push({
        code: u.code,
        count: Number(u.count) > 0 ? Number(u.count) : 1,
        sourceLine: u.sourceLine,
      });
    }
  }
  return {
    owned: dedupeOwnedEntries(owned),
    duplicates: mergeDuplicateEntries(duplicates),
    unknownSection: [],
    invalid: [...(parsed.invalid || [])],
    warnings: [...(parsed.warnings || [])],
  };
}

function consolidateParsedArrays(parsed) {
  const ownedObj = {};
  for (const o of parsed.owned || []) {
    if (o.code) ownedObj[o.code] = true;
  }
  const dupObj = {};
  for (const d of parsed.duplicates || []) {
    const c = Number(d.count);
    if (!Number.isInteger(c) || c < 1) continue;
    dupObj[d.code] = (dupObj[d.code] || 0) + c;
  }
  for (const code of Object.keys(dupObj)) {
    ownedObj[code] = true;
  }
  return { owned: ownedObj, duplicates: dupObj };
}

export function enrichStickerPreviewRow(code, albumStickers, duplicateCount) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const sticker = getStickerByCode(code, stickers);
  if (!sticker) {
    return {
      code,
      displayCode: formatStickerCodeSpaced(code),
      playerName: "",
      teamName: "",
      sectionTitle: "",
      flagEmoji: "",
      isSpecial: false,
      duplicateCount: duplicateCount ?? null,
      sticker: null,
    };
  }
  let flagEmoji = "";
  if (sticker.category === "team") {
    flagEmoji = TEAM_FLAG_EMOJIS[sticker.teamCode] || "";
  } else if (sticker.code === "FWC00") {
    flagEmoji = SECTION_EMOJIS.PANINI;
  } else if (sticker.category === "fwc") {
    flagEmoji = SECTION_EMOJIS.FWC;
  }
  const playerName = sticker.playerName || "";
  const teamName = sticker.teamName || "";
  const sectionTitle = sticker.title || "";
  return {
    code: sticker.code,
    displayCode: formatStickerCodeSpaced(sticker.code),
    playerName,
    teamName,
    sectionTitle,
    flagEmoji,
    isSpecial: !!sticker.isSpecial,
    duplicateCount: duplicateCount ?? null,
    sticker,
  };
}

/**
 * @param {ReturnType<typeof parseProgressShareText>} parsedProgress
 * @param {{ owned?: object, duplicates?: object }} currentProgress
 * @param {object[]} albumStickers
 */
export function previewProgressImport(parsedProgress, currentProgress, albumStickers) {
  const currentOwned = currentProgress?.owned && typeof currentProgress.owned === "object" ? currentProgress.owned : {};
  const currentDup =
    currentProgress?.duplicates && typeof currentProgress.duplicates === "object"
      ? currentProgress.duplicates
      : {};

  const ownedParsed = dedupeOwnedEntries(parsedProgress.owned || []);
  const dupParsed = mergeDuplicateEntries(parsedProgress.duplicates || []);

  const ownedToAdd = [];
  const ownedAlreadyPresent = [];
  for (const o of ownedParsed) {
    const row = enrichStickerPreviewRow(o.code, albumStickers, null);
    row.sourceLine = o.sourceLine;
    if (currentOwned[o.code]) ownedAlreadyPresent.push(row);
    else ownedToAdd.push(row);
  }

  const duplicatesToAdd = [];
  const duplicatesAlreadyPresent = [];
  for (const d of dupParsed) {
    const row = enrichStickerPreviewRow(d.code, albumStickers, d.count);
    row.sourceLine = d.sourceLine;
    const had = Number(currentDup[d.code]) > 0;
    if (had) duplicatesAlreadyPresent.push(row);
    else duplicatesToAdd.push(row);
  }

  const invalid = [...(parsedProgress.invalid || [])];
  const warnings = [...(parsedProgress.warnings || [])];

  const unknownRows = (parsedProgress.unknownSection || []).map((u) => {
    const row = enrichStickerPreviewRow(u.code, albumStickers, u.count);
    row.sourceLine = u.sourceLine;
    return row;
  });

  const summary = {
    ownedDetected: ownedParsed.length,
    duplicatesDetected: dupParsed.length,
    ownedToAddCount: ownedToAdd.length,
    duplicatesToAddCount: duplicatesToAdd.length,
    invalidCount: invalid.length + unknownRows.length,
  };

  return {
    ownedToAdd,
    ownedAlreadyPresent,
    duplicatesToAdd,
    duplicatesAlreadyPresent,
    unknownRows,
    invalid,
    warnings,
    summary,
  };
}

/**
 * @param {{ owned?: object, duplicates?: object, updatedAt?: string | null }} currentProgress
 * @param {ReturnType<typeof parseProgressShareText>} parsedProgress
 * @param {"merge" | "replace"} mode
 */
export function applyProgressImport(currentProgress, parsedProgress, mode) {
  const patch = consolidateParsedArrays(parsedProgress);
  const prevOwned = currentProgress?.owned && typeof currentProgress.owned === "object" ? currentProgress.owned : {};
  const prevDup =
    currentProgress?.duplicates && typeof currentProgress.duplicates === "object"
      ? currentProgress.duplicates
      : {};

  if (mode === "replace") {
    return {
      owned: { ...patch.owned },
      duplicates: { ...patch.duplicates },
      updatedAt: new Date().toISOString(),
    };
  }

  const owned = { ...prevOwned, ...patch.owned };
  const duplicates = { ...prevDup };
  for (const [code, n] of Object.entries(patch.duplicates)) {
    const add = Number(n);
    if (!Number.isInteger(add) || add < 1) continue;
    duplicates[code] = (Number(duplicates[code]) || 0) + add;
  }
  for (const code of Object.keys(patch.duplicates)) {
    owned[code] = true;
  }

  return {
    owned,
    duplicates,
    updatedAt: new Date().toISOString(),
  };
}
