import { normalizeStickerCode, getStickerByCode, isValidStickerCode } from "./stickerCode";

export const REPEATED_SHARE_TYPE = "PANINI_2026_REPEATED_STICKERS";
export const REPEATED_SHARE_VERSION = 1;

/**
 * @param {Record<string, unknown>} duplicates
 * @returns {{ type: string, version: number, generatedAt: string, stickers: { code: string, count: number }[] }}
 */
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

/**
 * @returns {{ ok: true, payload: object } | { ok: false, error: string }}
 */
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

/**
 * @returns {{ ok: true, errors: [] } | { ok: false, errors: string[] }}
 */
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

/**
 * Validación de alto nivel del sobre (tipo, versión, array).
 * El segundo argumento reserva espacio para validaciones futuras contra el álbum.
 * @param {object} payload
 * @param {object[]} [_stickers]
 * @returns {{ ok: true, errors: [] } | { ok: false, errors: string[] }}
 */
export function validateRepeatedSharePayload(payload, _stickers) {
  return validateRepeatedShareEnvelope(payload);
}

/**
 * @param {object} payload
 * @param {object[]} albumStickers
 * @param {Record<string, boolean>} owned
 * @returns {{
 *   useful: { code: string, count: number, sticker: object }[],
 *   alreadyOwned: { code: string, count: number, sticker: object }[],
 *   unknown: { code: string, count: number, reason: string }[],
 *   receivedTotal: number
 * }}
 */
export function compareRepeatedPayloadWithProgress(payload, albumStickers, owned) {
  const useful = [];
  const alreadyOwned = [];
  const unknown = [];
  const ownedMap = owned && typeof owned === "object" && !Array.isArray(owned) ? owned : {};
  const stickersList = Array.isArray(payload?.stickers) ? payload.stickers : [];
  const receivedTotal = stickersList.length;

  const merged = new Map();

  for (const entry of stickersList) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      unknown.push({ code: "—", count: 0, reason: "Entrada inválida en la lista." });
      continue;
    }
    const rawCode = entry.code;
    const code = normalizeStickerCode(rawCode != null ? String(rawCode) : "");
    const count = Number(entry.count);

    if (!code) {
      unknown.push({
        code: rawCode != null && String(rawCode).trim() ? String(rawCode).trim() : "—",
        count: Number.isFinite(count) ? count : 0,
        reason: "Código no reconocido o con formato inválido.",
      });
      continue;
    }
    if (!Number.isInteger(count) || count < 1) {
      unknown.push({
        code,
        count: entry.count,
        reason: "La cantidad debe ser un número entero mayor a 0.",
      });
      continue;
    }
    if (!isValidStickerCode(code, albumStickers)) {
      unknown.push({
        code,
        count,
        reason: "Este código no existe en el álbum Panini FIFA World Cup 2026.",
      });
      continue;
    }
    merged.set(code, (merged.get(code) || 0) + count);
  }

  for (const [code, count] of merged) {
    const sticker = getStickerByCode(code, albumStickers);
    if (!sticker) {
      unknown.push({ code, count, reason: "No se encontró la figurita en el álbum." });
      continue;
    }
    const row = { code, count, sticker };
    if (ownedMap[code]) {
      alreadyOwned.push(row);
    } else {
      useful.push(row);
    }
  }

  useful.sort((a, b) => a.code.localeCompare(b.code));
  alreadyOwned.sort((a, b) => a.code.localeCompare(b.code));
  unknown.sort((a, b) => String(a.code).localeCompare(String(b.code)));

  return { useful, alreadyOwned, unknown, receivedTotal };
}

/**
 * @param {{ sticker: object, count: number }[]} useful
 */
export function formatUsefulListForCopy(useful) {
  if (!Array.isArray(useful) || useful.length === 0) return "";
  return useful
    .map(({ sticker, count }) => {
      const name = sticker.playerName?.trim() || "—";
      const section =
        sticker.category === "team"
          ? sticker.teamName || sticker.teamCode || "Selección"
          : sticker.title || "FWC";
      return `${sticker.code} - ${name} - ${section} - x${count}`;
    })
    .join("\n");
}

/** Ej. ARG17 → "ARG 017", FWC5 → "FWC 5" */
export function formatStickerCodeSpaced(code) {
  if (!code) return "";
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
