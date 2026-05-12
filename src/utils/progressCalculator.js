import { getCountryMetaInAlbumOrder } from "@/data/countryMeta";
import { normalizeStickerCode, isValidStickerCode } from "./stickerCode";
import {
  isProgressNoiseLine,
  parseShareFormatLineAsOwnedEntries,
  enrichStickerPreviewRow,
} from "./progressSharing";

const MISSING_HEADING_KEYS = new Set([
  "i need",
  "need",
  "needs",
  "missing",
  "faltan",
  "faltantes",
  "me faltan",
  "busco",
  "necesito",
  "no tengo",
  "nola",
]);

const STOP_HEADING_KEYS = new Set([
  "swaps",
  "repes",
  "repetidas",
  "duplicates",
  "repeated",
  "tengo",
  "conseguidas",
]);

const IMPLICIT_MISSING_WARNING = {
  reason:
    "No encontramos un título de faltantes, pero interpretamos las líneas válidas como figuritas faltantes.",
};

const COMPLEMENT_WARNING = {
  reason: "Las selecciones que no aparecen en la lista se toman como completas.",
};

function normHeadingKey(line) {
  let s = String(line || "").trim();
  if (/^figuritas\s*:?\s*$/i.test(s)) return "figuritas";
  if (s.endsWith(":")) s = s.slice(0, -1).trim();
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0300/g, "");
}

function isMissingHeadingLine(line) {
  const key = normHeadingKey(line);
  return MISSING_HEADING_KEYS.has(key);
}

function isStopHeadingLine(line) {
  const key = normHeadingKey(line);
  if (STOP_HEADING_KEYS.has(key)) return true;
  if (key === "figuritas") return true;
  return false;
}

function isSkippableLine(line) {
  const t = String(line || "").trim();
  if (!t) return true;
  if (isProgressNoiseLine(line)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^www\./i.test(t)) return true;
  return false;
}

function textHasMissingHeading(lines) {
  for (const raw of lines) {
    if (isMissingHeadingLine(raw)) return true;
  }
  return false;
}

/**
 * @param {string} text
 * @param {object[]} albumStickers
 * @param {object[]} _teams
 */
export function parseMissingProgressText(text, albumStickers, _teams) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd());

  const warnings = [];
  const invalid = [];
  const missingMap = new Map();

  const hasHeading = textHasMissingHeading(lines);
  let active = !hasHeading;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isMissingHeadingLine(raw)) {
      active = true;
      continue;
    }
    if (isStopHeadingLine(raw)) {
      active = false;
      continue;
    }
    if (!active) continue;
    if (isSkippableLine(line)) continue;

    if (!line.includes(":")) continue;

    const w = [];
    const { entries, invalid: inv } = parseShareFormatLineAsOwnedEntries(line, stickers, w);
    for (const x of w) {
      if (x && typeof x === "object" && x.reason) warnings.push({ reason: x.reason, sourceLine: x.sourceLine });
    }
    for (const it of inv) invalid.push(it);
    for (const e of entries) {
      if (e.code) missingMap.set(e.code, e.sourceLine || line);
    }
  }

  if (!hasHeading && missingMap.size > 0) {
    warnings.push(IMPLICIT_MISSING_WARNING);
  }

  if (missingMap.size > 0) {
    warnings.push(COMPLEMENT_WARNING);
  }

  const missing = [...missingMap.entries()].map(([code, sourceLine]) => ({ code, sourceLine }));

  return { missing, invalid, warnings };
}

/**
 * @param {{ code: string, sourceLine?: string }[]} missing
 * @param {object[]} albumStickers
 */
export function calculateOwnedFromMissing(missing, albumStickers) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const missingSet = new Set();
  for (const m of missing || []) {
    const c = normalizeStickerCode(m.code);
    if (c && isValidStickerCode(c, stickers)) missingSet.add(c);
  }

  const allCodes = [];
  for (const s of stickers) {
    if (s && s.code && isValidStickerCode(s.code, stickers)) allCodes.push(s.code);
  }

  const ownedCodes = allCodes.filter((c) => !missingSet.has(c));

  return {
    ownedCodes,
    missingCodes: [...missingSet].sort((a, b) => a.localeCompare(b)),
    ownedCount: ownedCodes.length,
    missingCount: missingSet.size,
    totalCount: stickers.length,
  };
}

/**
 * @param {ReturnType<typeof calculateOwnedFromMissing>} calculatedProgress
 * @param {{ owned?: object, duplicates?: object }} currentProgress
 * @param {object[]} albumStickers
 */
export function previewCalculatedProgress(calculatedProgress, currentProgress, albumStickers, parseExtras) {
  const stickers = Array.isArray(albumStickers) ? albumStickers : [];
  const currentOwned =
    currentProgress?.owned && typeof currentProgress.owned === "object" ? currentProgress.owned : {};

  const ownedCalcCodes = calculatedProgress?.ownedCodes || [];
  const missingCodes = calculatedProgress?.missingCodes || [];

  const ownedCalculated = ownedCalcCodes.map((code) => enrichStickerPreviewRow(code, stickers, null));
  const missingDetected = missingCodes.map((code) => enrichStickerPreviewRow(code, stickers, null));

  const ownedAlreadyPresent = [];
  const ownedToAdd = [];
  for (const row of ownedCalculated) {
    if (currentOwned[row.code]) ownedAlreadyPresent.push(row);
    else ownedToAdd.push(row);
  }

  const missingSet = new Set(missingCodes);
  const currentlyOwnedButCalculatedMissing = [];
  for (const code of Object.keys(currentOwned)) {
    if (currentOwned[code] === true && missingSet.has(code)) {
      currentlyOwnedButCalculatedMissing.push(enrichStickerPreviewRow(code, stickers, null));
    }
  }

  const invalid = Array.isArray(parseExtras?.invalid) ? [...parseExtras.invalid] : [];
  const warnings = Array.isArray(parseExtras?.warnings) ? [...parseExtras.warnings] : [];

  const summary = {
    totalAlbum: calculatedProgress?.totalCount ?? stickers.length,
    missingDetectedCount: missingDetected.length,
    ownedCalculatedCount: ownedCalculated.length,
    ownedToAddCount: ownedToAdd.length,
    currentlyOwnedButCalculatedMissingCount: currentlyOwnedButCalculatedMissing.length,
    invalidCount: invalid.length,
  };

  return {
    ownedCalculated,
    missingDetected,
    ownedAlreadyPresent,
    ownedToAdd,
    currentlyOwnedButCalculatedMissing,
    invalid,
    warnings,
    summary,
  };
}

/**
 * @param {{ owned?: object, duplicates?: object, updatedAt?: string | null }} currentProgress
 * @param {ReturnType<typeof calculateOwnedFromMissing>} calculatedProgress
 * @param {"replace-owned" | "merge-owned"} mode
 */
export function applyCalculatedProgress(currentProgress, calculatedProgress, mode) {
  const prevOwned =
    currentProgress?.owned && typeof currentProgress.owned === "object" ? { ...currentProgress.owned } : {};
  const prevDup =
    currentProgress?.duplicates && typeof currentProgress.duplicates === "object"
      ? { ...currentProgress.duplicates }
      : {};

  const codes = calculatedProgress?.ownedCodes || [];
  const nextOwned = mode === "replace-owned" ? {} : { ...prevOwned };

  for (const c of codes) {
    nextOwned[c] = true;
  }

  const duplicates = { ...prevDup };
  for (const c of Object.keys(duplicates)) {
    nextOwned[c] = true;
  }

  return {
    owned: nextOwned,
    duplicates,
    updatedAt: new Date().toISOString(),
  };
}

/** Agrupa códigos para vista estilo WhatsApp (orden álbum). */
export function groupCodesForCalculatorPreview(codes, albumStickers, teams) {
  const order = Array.isArray(teams) && teams.length ? teams : getCountryMetaInAlbumOrder();
  const set = new Set(codes || []);
  const sections = [];

  if (set.has("FWC00")) {
    sections.push({ key: "panini", title: "PANINI", lines: [{ code: "FWC00", label: "0-0" }] });
  }

  const fwcNums = [];
  for (let n = 1; n <= 19; n += 1) {
    const code = `FWC${n}`;
    if (set.has(code)) fwcNums.push(n);
  }
  if (fwcNums.length) {
    sections.push({
      key: "fwc",
      title: "FWC",
      lines: fwcNums.map((n) => ({ code: `FWC${n}`, label: String(n) })),
    });
  }

  for (const country of order) {
    if (!country?.code) continue;
    const nums = [];
    for (let n = 1; n <= 20; n += 1) {
      const code = `${country.code}${n}`;
      if (set.has(code)) nums.push(n);
    }
    if (nums.length) {
      sections.push({
        key: country.code,
        title: country.name ? `${country.code} (${country.name})` : country.code,
        lines: nums.map((n) => ({ code: `${country.code}${n}`, label: String(n) })),
      });
    }
  }

  return sections;
}
