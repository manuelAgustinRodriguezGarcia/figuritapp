import { COUNTRY_META } from "@/data/countryMeta";
import { normalizeStickerCode, getStickerByCode, isValidStickerCode } from "./stickerCode";
import {
  TEAM_FLAG_EMOJIS,
  SECTION_EMOJIS,
  TEAM_CODES,
  getEmojiToTeamsMap,
} from "./flagEmojiMap";

export const REPEATED_SHARE_TYPE = "PANINI_2026_REPEATED_STICKERS";
export const REPEATED_SHARE_VERSION = 1;

const SHARE_TITLE = "FIGURITAPP . Lista de Repes:";
const USEFUL_TITLE = "FIGURITAPP . Figus que me sirven:";
const FOOTER_LINE_1 = "Guardá tus figuritas en FIGURITAPP:";
const FOOTER_URL = "https://figuritapp-eight.vercel.app/";

/* --- Legacy JSON (import / compare fallback) --- */

export function createRepeatedSharePayload(duplicates) {
  const dup = duplicates && typeof duplicates === "object" && !Array.isArray(duplicates) ? duplicates : {};
  const stickers = [];
  for (const [rawKey, rawCount] of Object.entries(dup)) {
    const n = Number(rawCount);
    if (!Number.isInteger(n) || n < 1) continue;
    const code = normalizeStickerCode(rawKey);
    if (!code) continue;
    stickers.push({ code, count: n });
  }
  stickers.sort((a, b) => a.code.localeCompare(b.code));
  return {
    type: REPEATED_SHARE_TYPE,
    version: REPEATED_SHARE_VERSION,
    generatedAt: new Date().toISOString(),
    stickers,
  };
}

export function stringifyRepeatedSharePayload(payload) {
  return JSON.stringify(payload);
}

export function parseRepeatedSharePayload(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return { ok: false, error: "El texto está vacío." };
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "No es un JSON válido. Revisá que pegaste el texto completo." };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "El contenido no es un objeto JSON válido." };
  }
  return { ok: true, payload: parsed };
}

export function validateRepeatedShareEnvelope(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("Los datos no tienen el formato esperado.");
    return { ok: false, errors };
  }
  if (payload.type !== REPEATED_SHARE_TYPE) {
    errors.push("Este texto no es una lista de repetidas compatible con Figuritapp.");
  }
  if (payload.version !== REPEATED_SHARE_VERSION) {
    errors.push("Esta versión del mensaje no es compatible. Actualizá la app e intentá de nuevo.");
  }
  if (!Array.isArray(payload.stickers)) {
    errors.push('Falta la lista "stickers" o no es válida.');
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, errors: [] };
}

export function validateRepeatedSharePayload(payload, _stickers) {
  return validateRepeatedShareEnvelope(payload);
}

function collectDuplicateEntries(duplicates, albumStickers) {
  const dup = duplicates && typeof duplicates === "object" && !Array.isArray(duplicates) ? duplicates : {};
  const list = [];
  for (const [rawKey, rawCount] of Object.entries(dup)) {
    const n = Number(rawCount);
    if (!Number.isInteger(n) || n < 1) continue;
    const code = normalizeStickerCode(rawKey);
    if (!code || !isValidStickerCode(code, albumStickers)) continue;
    list.push({ code, count: n });
  }
  return list;
}

function newGroups() {
  return {
    panini: 0,
    fwc: new Map(),
    teams: new Map(),
  };
}

function feedGroups(groups, code, count) {
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

function formatNumChunk(n, c, isZeroZero) {
  if (isZeroZero) {
    return c > 1 ? `0-0(x${c})` : "0-0";
  }
  return c > 1 ? `${n}(x${c})` : `${n}`;
}

function formatFwcLine(groups) {
  if (groups.fwc.size === 0) return null;
  const nums = [...groups.fwc.entries()].sort((a, b) => a[0] - b[0]);
  const parts = nums.map(([n, c]) => formatNumChunk(n, c, false));
  return `FWC ${SECTION_EMOJIS.FWC}: ${parts.join(", ")}`;
}

function formatPaniniLine(paniniTotal) {
  if (paniniTotal <= 0) return null;
  return `PANINI ${SECTION_EMOJIS.PANINI}: ${formatNumChunk(0, paniniTotal, true)}`;
}

function formatTeamLine(teamCode, numMap) {
  const emoji = TEAM_FLAG_EMOJIS[teamCode];
  if (!emoji) return null;
  const nums = [...numMap.entries()].sort((a, b) => a[0] - b[0]);
  const parts = nums.map(([n, c]) => formatNumChunk(n, c, false));
  return `${teamCode} ${emoji}: ${parts.join(", ")}`;
}

/**
 * @param {Record<string, unknown>} duplicates
 * @param {object[]} albumStickers
 * @returns {string}
 */
export function formatRepeatedShareText(duplicates, albumStickers) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const entries = collectDuplicateEntries(duplicates, stickers);
  if (entries.length === 0) return "";

  const groups = newGroups();
  for (const { code, count } of entries) {
    feedGroups(groups, code, count);
  }

  const lines = [SHARE_TITLE];

  const paniniLine = formatPaniniLine(groups.panini);
  if (paniniLine) lines.push(paniniLine);

  const fwcLine = formatFwcLine(groups);
  if (fwcLine) lines.push(fwcLine);

  for (const country of COUNTRY_META) {
    const m = groups.teams.get(country.code);
    if (!m || m.size === 0) continue;
    const tl = formatTeamLine(country.code, m);
    if (tl) lines.push(tl);
  }

  lines.push("");
  lines.push(FOOTER_LINE_1);
  lines.push(FOOTER_URL);

  return lines.join("\n");
}

function looksLikeAnySectionOrTeamEmoji(str) {
  if (!str) return false;
  if (str.includes(SECTION_EMOJIS.FWC) || str.includes(SECTION_EMOJIS.PANINI)) return true;
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
  if (t === SECTION_EMOJIS.FWC || t.startsWith(SECTION_EMOJIS.FWC)) {
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
        return { error: "Bandera ambigua (falta el código de país, ej. ENG o SCO)." };
      }
      return { section: "team", teamCode: teams[0] };
    }
  }

  for (const [emoji, teams] of map.entries()) {
    if (!emoji || t === emoji) continue;
    if (t.startsWith(emoji)) {
      if (teams.length > 1) {
        return { error: "Bandera ambigua (falta el código de país, ej. ENG o SCO)." };
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
          message: "El emoji junto a PANINI no coincide con el esperado.",
          sourceLine: line,
        });
      }
      return { section: "panini" };
    }
    if (w === "FWC") {
      if (rest && hasUnexpectedEmoji(rest, SECTION_EMOJIS.FWC)) {
        warnings.push({
          message: "El emoji junto a FWC no coincide con 🌎.",
          sourceLine: line,
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
        message: `La bandera no coincide con ${w} (se esperaba ${expected}).`,
        sourceLine: line,
      });
    }
    return { section: "team", teamCode: w };
  }
  return inferFromEmojiOnly(sp.rest);
}

function expandRightTokens(right) {
  return right
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
      return { ok: false, reason: `FWC: ${n} no es válido (del 1 al 19).` };
    }
  } else {
    if (n < 1 || n > 20) {
      return { ok: false, reason: `Número ${n} inválido para una selección (1 a 20).` };
    }
  }
  return { ok: true, num: n, count: c };
}

function pushParsed(code, count, sourceLine, albumStickers, parsed, unknown) {
  if (!isValidStickerCode(code, albumStickers)) {
    unknown.push({ value: code, reason: "Este código no existe en el álbum." });
    return;
  }
  parsed.push({ code, count, sourceLine });
}

function tryStandalonePanini(line, albumStickers, parsed, unknown) {
  const t = line.trim();
  if (t.includes(":")) return false;
  const m = t.match(/^0-0(?:\s*\(\s*x\s*(\d+)\s*\)|\s+x\s*(\d+)|x(\d+))?$/i);
  if (!m) return false;
  const c = Number(m[1] || m[2] || m[3] || 1);
  if (!Number.isInteger(c) || c < 1) {
    unknown.push({ value: t, reason: "Cantidad inválida para 0-0." });
    return true;
  }
  pushParsed("FWC00", c, t, albumStickers, parsed, unknown);
  return true;
}

/**
 * Títulos y pie de mensaje FIGURITAPP / Figuritapp (no son líneas de figuritas).
 */
function isShareMessageNoiseLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^FIGURITAPP\b/i.test(t)) return true;
  if (/^Guardá tus figuritas\b/i.test(t)) return true;
  if (/^Descargá\b/i.test(t) || /^Download\b/i.test(t)) return true;
  return false;
}

function parseHumanListLine(line, albumStickers, parsed, unknown, warnings) {
  const colon = line.indexOf(":");
  const left = line.slice(0, colon).trim();
  const right = line.slice(colon + 1).trim();
  if (!right) {
    if (isShareMessageNoiseLine(line)) return;
    unknown.push({ value: line, reason: "Falta la lista de números después de ':'." });
    return;
  }

  const prefix = classifyPrefix(left, line, warnings);
  if (prefix.error) {
    unknown.push({ value: line, reason: prefix.error });
    return;
  }

  const tokens = expandRightTokens(right);

  if (prefix.section === "panini") {
    for (const tok of tokens) {
      const r = parsePaniniQuantityToken(tok);
      if (!r.ok) {
        unknown.push({ value: `${line} → ${tok}`, reason: r.reason });
        continue;
      }
      pushParsed("FWC00", r.count, line, albumStickers, parsed, unknown);
    }
    return;
  }

  if (prefix.section === "fwc") {
    for (const tok of tokens) {
      const r = parseNumericStickerToken(tok, "fwc");
      if (!r.ok) {
        unknown.push({ value: `${line} → ${tok}`, reason: r.reason });
        continue;
      }
      pushParsed(`FWC${r.num}`, r.count, line, albumStickers, parsed, unknown);
    }
    return;
  }

  if (prefix.section === "team" && prefix.teamCode) {
    for (const tok of tokens) {
      const r = parseNumericStickerToken(tok, "team");
      if (!r.ok) {
        unknown.push({ value: `${line} → ${tok}`, reason: r.reason });
        continue;
      }
      pushParsed(`${prefix.teamCode}${r.num}`, r.count, line, albumStickers, parsed, unknown);
    }
  }
}

function parseHumanRepeatedLines(text, albumStickers) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const parsed = [];
  const unknown = [];
  const warnings = [];
  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (isShareMessageNoiseLine(line)) continue;
    if (tryStandalonePanini(line, stickers, parsed, unknown)) continue;
    if (!line.includes(":")) continue;
    parseHumanListLine(line, stickers, parsed, unknown, warnings);
  }

  return { parsed, unknown, warnings, fromJson: false };
}

function tryParseJsonStickers(text, albumStickers) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const j = parseRepeatedSharePayload(text);
  if (!j.ok) return null;
  const env = validateRepeatedShareEnvelope(j.payload);
  if (!env.ok) return null;

  const parsed = [];
  const unknown = [];
  for (const entry of j.payload.stickers) {
    if (!entry || typeof entry !== "object") {
      unknown.push({ value: String(entry), reason: "Entrada JSON inválida." });
      continue;
    }
    const code = normalizeStickerCode(entry.code != null ? String(entry.code) : "");
    const cnt = Number(entry.count);
    if (!code || !Number.isInteger(cnt) || cnt < 1) {
      unknown.push({ value: String(entry.code ?? ""), reason: "Entrada JSON inválida." });
      continue;
    }
    if (!isValidStickerCode(code, stickers)) {
      unknown.push({ value: code, reason: "Este código no existe en el álbum." });
      continue;
    }
    parsed.push({ code, count: cnt, sourceLine: `JSON: ${code}` });
  }
  return { parsed, unknown, warnings: [], fromJson: true };
}

/**
 * Texto humano o JSON legacy. Intenta JSON si empieza con "{"; si no aplica, parsea líneas.
 * @returns {{ parsed: { code: string, count: number, sourceLine: string }[], unknown: { value: string, reason: string }[], warnings: { message: string, sourceLine?: string }[], fromJson?: boolean }}
 */
export function parseRepeatedShareText(text, albumStickers) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return { parsed: [], unknown: [], warnings: [] };
  }
  if (trimmed.startsWith("{")) {
    const jsonR = tryParseJsonStickers(trimmed, stickers);
    if (jsonR) return jsonR;
  }
  return parseHumanRepeatedLines(trimmed, stickers);
}

function enrichStickerComparisonRow(sticker, count) {
  let flagEmoji = "";
  if (sticker.category === "team") {
    flagEmoji = TEAM_FLAG_EMOJIS[sticker.teamCode] || "";
  } else if (sticker.code === "FWC00") {
    flagEmoji = SECTION_EMOJIS.PANINI;
  } else if (sticker.category === "fwc") {
    flagEmoji = SECTION_EMOJIS.FWC;
  }

  let number = 0;
  if (sticker.category === "team") {
    number = sticker.number;
  } else if (sticker.code === "FWC00") {
    number = 0;
  } else if (sticker.code?.startsWith("FWC")) {
    number = Number(sticker.code.slice(3)) || 0;
  }

  return {
    code: sticker.code,
    displayCode: formatStickerCodeSpaced(sticker.code),
    number,
    count,
    teamCode: sticker.teamCode ?? null,
    teamName: sticker.teamName ?? "",
    flagEmoji,
    playerName: sticker.playerName ?? "",
    isSpecial: !!sticker.isSpecial,
    category: sticker.category,
    sticker,
  };
}

/**
 * @param {{ code: string, count: number }[]} parsedRepeated
 * @param {object[]} albumStickers
 * @param {Record<string, boolean>} owned
 */
export function compareRepeatedListWithProgress(parsedRepeated, albumStickers, owned) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const ownedMap = owned && typeof owned === "object" && !Array.isArray(owned) ? owned : {};

  const merged = new Map();
  const list = Array.isArray(parsedRepeated) ? parsedRepeated : [];
  for (const p of list) {
    if (!p || typeof p !== "object") continue;
    const code = p.code;
    const cnt = Number(p.count);
    if (!code || !Number.isInteger(cnt) || cnt < 1) continue;
    merged.set(code, (merged.get(code) || 0) + cnt);
  }

  let receivedTotal = 0;
  for (const c of merged.values()) {
    receivedTotal += c;
  }

  const useful = [];
  const alreadyOwned = [];
  const unknown = [];

  for (const [code, count] of merged) {
    const sticker = getStickerByCode(code, stickers);
    if (!sticker) {
      unknown.push({ code, value: code, reason: "Este código no existe en el álbum." });
      continue;
    }
    const row = enrichStickerComparisonRow(sticker, count);
    if (ownedMap[code]) {
      alreadyOwned.push(row);
    } else {
      useful.push(row);
    }
  }

  useful.sort((a, b) => a.code.localeCompare(b.code));
  alreadyOwned.sort((a, b) => a.code.localeCompare(b.code));
  unknown.sort((a, b) => String(a.code).localeCompare(String(b.code)));

  return {
    useful,
    alreadyOwned,
    unknown,
    receivedTotal,
    usefulTotal: useful.length,
    alreadyOwnedTotal: alreadyOwned.length,
    unknownTotal: unknown.length,
  };
}

/** @deprecated prefer compareRepeatedListWithProgress */
export function compareRepeatedPayloadWithProgress(payload, albumStickers, owned) {
  const stickersList = Array.isArray(payload?.stickers) ? payload.stickers : [];
  const parsed = [];
  for (const entry of stickersList) {
    if (!entry || typeof entry !== "object") continue;
    const code = normalizeStickerCode(String(entry.code ?? ""));
    const count = Number(entry.count);
    if (!code || !Number.isInteger(count) || count < 1) continue;
    parsed.push({
      code,
      count,
      sourceLine: `JSON: ${entry.code}`,
    });
  }
  return compareRepeatedListWithProgress(parsed, albumStickers, owned);
}

export function formatStickerCodeSpaced(code) {
  if (!code) return "";
  if (code === "FWC00" || code === "0-0") return "0-0";
  if (code.startsWith("FWC")) {
    const rest = code.slice(3);
    return `FWC ${rest}`;
  }
  const match = /^([A-Z]{3})(\d{1,2})$/.exec(code);
  if (match) {
    return `${match[1]} ${match[2].padStart(3, "0")}`;
  }
  return code;
}

function groupsFromEnrichedRows(rows) {
  const groups = newGroups();
  for (const row of rows) {
    const st = row.sticker;
    if (!st) continue;
    feedGroups(groups, st.code, row.count);
  }
  return groups;
}

/**
 * Lista útil para WhatsApp (mismo estilo que export, sin pie de URL).
 * @param {object[]} usefulRows — filas de compareRepeatedListWithProgress.useful
 */
export function formatUsefulHumanShareText(usefulRows) {
  if (!Array.isArray(usefulRows) || usefulRows.length === 0) return "";
  const groups = groupsFromEnrichedRows(usefulRows);
  const lines = [USEFUL_TITLE];

  const paniniLine = formatPaniniLine(groups.panini);
  if (paniniLine) lines.push(paniniLine);

  const fwcLine = formatFwcLine(groups);
  if (fwcLine) lines.push(fwcLine);

  for (const country of COUNTRY_META) {
    const m = groups.teams.get(country.code);
    if (!m || m.size === 0) continue;
    const tl = formatTeamLine(country.code, m);
    if (tl) lines.push(tl);
  }

  return lines.join("\n");
}

/** Alias legible (una línea por figurita útil, estilo anterior) */
export function formatUsefulListForCopy(usefulRows) {
  return formatUsefulHumanShareText(usefulRows);
}

/*
  Casos manuales (sin test runner):

  1) formatRepeatedShareText({ ARG19:1, NZL19:2, CPV20:3, FWC5:1, FWC6:1 }, stickers)
     → incluye FWC 🌎: 5, 6 y ARG/NZL/CPV con (xN).

  2) parse: "FWC 🌎: 5, 6\\nARG 🇦🇷: 6, 10, 13, 19" → FWC5,FWC6,ARG6,ARG10,ARG13,ARG19.

  3) Ruido: títulos y URLs → parsed vacío.

  4) 🏴: 7, 11 sin código → unknown ambiguo.

  5) ENG 🏴 / SCO 🏴 con números → ENG007, SCO004, etc.
*/
