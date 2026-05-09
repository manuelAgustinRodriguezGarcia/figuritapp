"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Safe localStorage hook for Next.js App Router.
// - Always renders the SSR-safe default on first paint to avoid hydration mismatches.
// - Hydrates from localStorage in a useEffect after mount.
// - Defensively parses; falls back to initialValue if storage is corrupted.
// - Updates other tabs via the "storage" event.

function readFromStorage(key, fallback, deserializer) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return typeof deserializer === "function" ? deserializer(parsed, fallback) : parsed;
  } catch {
    return fallback;
  }
}

export function useLocalStorage(key, initialValue, options = {}) {
  const { deserializer } = options;
  const [value, setValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const initialRef = useRef(initialValue);

  useEffect(() => {
    initialRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    setValue(readFromStorage(key, initialRef.current, deserializer));
    setHydrated(true);
  }, [key, deserializer]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled — silently ignore.
    }
  }, [key, value, hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function handleStorage(event) {
      if (event.key !== key) return;
      if (event.newValue === null) {
        setValue(initialRef.current);
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue);
        setValue(typeof deserializer === "function" ? deserializer(parsed, initialRef.current) : parsed);
      } catch {
        setValue(initialRef.current);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, deserializer]);

  const update = useCallback((updater) => {
    setValue((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  return [value, update, hydrated];
}
