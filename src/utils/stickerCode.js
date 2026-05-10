// Sticker code parsing helpers.
//
// Canonical format used internally — natural number, no leading zero, no space:
//   "FWC00", "ARG1", "ARG18", "FWC5", "FWC19".
//
// Accepted user inputs (case-insensitive, ignores spaces/hyphens/underscores):
//   "FWC00", "FWC0", "0-0", "00", "0 0" (Panini logo → FWC00),
//   "ARG1", "ARG01", "ARG001", "ARG 1", "ARG 18", "ARG-018", "arg1",
//   "FWC1", "FWC01", "FWC005", "FWC 5", "fwc 5", "FWC-19".

const FWC00_CODE = "FWC00";

function stripFormatting(input) {
  return String(input || "").replace(/[\s\-_.]/g, "").toUpperCase();
}

export function normalizeStickerCode(input) {
  if (input === null || input === undefined) return null;

  const raw = String(input).trim();
  if (!raw) return null;

  const compact = stripFormatting(raw);
  if (!compact) return null;

  // Panini logo sticker — legacy "0-0" / "00" and explicit FWC00.
  if (compact === "00") return FWC00_CODE;

  // FWC stickers (00 and 1..19).
  if (compact.startsWith("FWC")) {
    const numericPart = compact.slice(3);
    if (!/^\d+$/.test(numericPart)) return null;
    if (numericPart === "00" || numericPart === "0") return FWC00_CODE;
    const num = Number.parseInt(numericPart, 10);
    if (!Number.isFinite(num) || num < 1 || num > 19) return null;
    return `FWC${num}`;
  }

  // Team stickers — three letter code + 1..3 digits, value 1..20.
  const match = compact.match(/^([A-Z]{3})(\d{1,3})$/);
  if (!match) return null;
  const teamCode = match[1];
  const num = Number.parseInt(match[2], 10);
  if (!Number.isFinite(num) || num < 1 || num > 20) return null;
  return `${teamCode}${num}`;
}

export function isValidStickerCode(code, stickers) {
  if (!code) return false;
  return stickers.some((s) => s.code === code);
}

export function getStickerByCode(code, stickers) {
  if (!code) return null;
  return stickers.find((s) => s.code === code) || null;
}

export function getTeamCodeFromStickerCode(code) {
  if (!code) return null;
  if (code.startsWith("FWC")) return null;
  const match = code.match(/^([A-Z]{3})\d{1,2}$/);
  return match ? match[1] : null;
}

export function getDisplayCode(code) {
  if (!code) return "";
  return code;
}
