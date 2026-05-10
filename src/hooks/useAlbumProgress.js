"use client";

import { useCallback, useMemo } from "react";
import { LEGACY_PANINI_STICKER_CODE, STORAGE_KEY } from "@/data/albumConfig";

const FWC00_CODE = "FWC00";

function migrateLegacyOwnedKeys(owned) {
  if (!owned || typeof owned !== "object") return {};
  const next = { ...owned };
  if (!Object.prototype.hasOwnProperty.call(next, LEGACY_PANINI_STICKER_CODE)) return next;
  const legacyOwned = next[LEGACY_PANINI_STICKER_CODE] === true;
  delete next[LEGACY_PANINI_STICKER_CODE];
  if (legacyOwned) next[FWC00_CODE] = true;
  return next;
}

function migrateLegacyDuplicateKeys(duplicates) {
  if (!duplicates || typeof duplicates !== "object") return {};
  const next = { ...duplicates };
  if (!Object.prototype.hasOwnProperty.call(next, LEGACY_PANINI_STICKER_CODE)) return next;
  const legacy = Number(next[LEGACY_PANINI_STICKER_CODE]) || 0;
  delete next[LEGACY_PANINI_STICKER_CODE];
  const current = Number(next[FWC00_CODE]) || 0;
  const merged = Math.max(current, legacy);
  if (merged > 0) next[FWC00_CODE] = merged;
  else delete next[FWC00_CODE];
  return next;
}
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_PROGRESS = Object.freeze({
  owned: {},
  duplicates: {},
  updatedAt: null,
});

function withTimestamp(next) {
  return { ...next, updatedAt: new Date().toISOString() };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeProgress(parsed, fallback) {
  if (!isPlainObject(parsed)) return fallback;
  const owned = isPlainObject(parsed.owned) ? { ...parsed.owned } : {};
  const duplicates = isPlainObject(parsed.duplicates) ? { ...parsed.duplicates } : {};

  const cleanedOwned = {};
  for (const [code, value] of Object.entries(migrateLegacyOwnedKeys(owned))) {
    if (value === true) cleanedOwned[code] = true;
  }

  const cleanedDuplicates = {};
  for (const [code, value] of Object.entries(migrateLegacyDuplicateKeys(duplicates))) {
    const num = Number(value);
    if (Number.isInteger(num) && num > 0) cleanedDuplicates[code] = num;
  }

  return {
    owned: cleanedOwned,
    duplicates: cleanedDuplicates,
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
  };
}

export function useAlbumProgress() {
  const [progress, setProgress, hydrated] = useLocalStorage(
    STORAGE_KEY,
    DEFAULT_PROGRESS,
    { deserializer: sanitizeProgress },
  );

  const setOwned = useCallback((code, value) => {
    if (!code) return;
    setProgress((prev) => {
      const owned = { ...prev.owned };
      const duplicates = { ...prev.duplicates };
      if (value) {
        owned[code] = true;
      } else {
        delete owned[code];
        delete duplicates[code];
      }
      return withTimestamp({ ...prev, owned, duplicates });
    });
  }, [setProgress]);

  const toggleOwned = useCallback((code) => {
    if (!code) return;
    setProgress((prev) => {
      const owned = { ...prev.owned };
      const duplicates = { ...prev.duplicates };
      if (owned[code]) {
        delete owned[code];
        delete duplicates[code];
      } else {
        owned[code] = true;
      }
      return withTimestamp({ ...prev, owned, duplicates });
    });
  }, [setProgress]);

  const addDuplicate = useCallback((code) => {
    if (!code) return;
    setProgress((prev) => {
      const owned = { ...prev.owned, [code]: true };
      const current = Number(prev.duplicates[code]) || 0;
      const duplicates = { ...prev.duplicates, [code]: current + 1 };
      return withTimestamp({ ...prev, owned, duplicates });
    });
  }, [setProgress]);

  const decreaseDuplicate = useCallback((code) => {
    if (!code) return;
    setProgress((prev) => {
      const current = Number(prev.duplicates[code]) || 0;
      if (current <= 0) return prev;
      const duplicates = { ...prev.duplicates };
      const next = current - 1;
      if (next <= 0) delete duplicates[code];
      else duplicates[code] = next;
      return withTimestamp({ ...prev, duplicates });
    });
  }, [setProgress]);

  const removeDuplicate = useCallback((code) => {
    if (!code) return;
    setProgress((prev) => {
      if (!prev.duplicates[code]) return prev;
      const duplicates = { ...prev.duplicates };
      delete duplicates[code];
      return withTimestamp({ ...prev, duplicates });
    });
  }, [setProgress]);

  const resetProgress = useCallback(() => {
    setProgress(() => withTimestamp({ owned: {}, duplicates: {} }));
  }, [setProgress]);

  const replaceProgress = useCallback((next) => {
    const safe = sanitizeProgress(next, DEFAULT_PROGRESS);
    setProgress(() => withTimestamp(safe));
  }, [setProgress]);

  const exportSnapshot = useCallback(() => ({
    owned: { ...progress.owned },
    duplicates: { ...progress.duplicates },
    updatedAt: progress.updatedAt,
  }), [progress]);

  const actions = useMemo(() => ({
    setOwned,
    toggleOwned,
    addDuplicate,
    decreaseDuplicate,
    removeDuplicate,
    resetProgress,
    replaceProgress,
    exportSnapshot,
  }), [setOwned, toggleOwned, addDuplicate, decreaseDuplicate, removeDuplicate, resetProgress, replaceProgress, exportSnapshot]);

  return { progress, hydrated, ...actions };
}
