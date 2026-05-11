"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import styles from "./SectionScrollFab.module.scss";

/**
 * @param {object} props
 * @param {boolean} props.enabled
 * @param {string | number} props.layoutKey — cambia cuando el alto del documento puede variar
 * @param {"aboveAlbumFilters" | "aboveBottomNav"} [props.variant="aboveBottomNav"]
 * @param {string} props.upLabel
 * @param {string} props.downLabel
 */
export default function SectionScrollFab({
  enabled,
  layoutKey,
  variant = "aboveBottomNav",
  upLabel,
  downLabel,
}) {
  const [towardBottom, setTowardBottom] = useState(true);
  const [visible, setVisible] = useState(false);

  const update = useCallback(() => {
    if (typeof window === "undefined") return;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (maxScroll < 160) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const y = window.scrollY;
    const ratio = maxScroll === 0 ? 0 : y / maxScroll;
    setTowardBottom(ratio < 0.5);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return undefined;
    }
    update();
    const schedule = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(update);
      });
    };
    schedule();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(schedule);
      ro.observe(document.documentElement);
    }
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [enabled, layoutKey, update]);

  const handleClick = useCallback(() => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduceMotion ? "auto" : "smooth";
    if (towardBottom) {
      window.scrollTo({ top: maxScroll, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  }, [towardBottom]);

  if (!visible) return null;

  const rootClass =
    variant === "aboveAlbumFilters"
      ? `${styles.scrollFab} ${styles.scrollFabAlbumFilters}`
      : `${styles.scrollFab} ${styles.scrollFabNavOnly}`;

  return (
    <button
      type="button"
      className={rootClass}
      onClick={handleClick}
      aria-label={towardBottom ? downLabel : upLabel}
      title={towardBottom ? downLabel : upLabel}
    >
      {towardBottom ? (
        <ArrowDown size={22} strokeWidth={2} aria-hidden />
      ) : (
        <ArrowUp size={22} strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
