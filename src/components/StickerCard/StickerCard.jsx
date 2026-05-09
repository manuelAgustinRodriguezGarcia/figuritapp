"use client";

import { memo } from "react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import styles from "./StickerCard.module.scss";

function getSectionLabel(sticker) {
  switch (sticker.category) {
    case "panini":
      return "Panini";
    case "fwc":
      return "FWC";
    case "team":
      return sticker.teamName || sticker.teamCode || "Selección";
    default:
      return "";
  }
}

function getNumberLabel(sticker) {
  if (sticker.category === "team") return String(sticker.number);
  if (sticker.category === "fwc") return sticker.code.replace("FWC", "");
  if (sticker.category === "panini") return "0-0";
  return "";
}

function StickerCardComponent({ sticker, owned, duplicateCount = 0, onToggle }) {
  const isOwned = !!owned;
  const sectionLabel = getSectionLabel(sticker);
  const numberLabel = getNumberLabel(sticker);

  const baseClasses = [
    styles.card,
    isOwned ? styles.owned : styles.missing,
    sticker.isSpecial ? styles.special : null,
    sticker.category === "team" ? `teamColor--${sticker.teamCode}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const accessibleLabel = isOwned
    ? `Marcar ${sticker.displayCode} como faltante`
    : `Marcar ${sticker.displayCode} como conseguida`;

  return (
    <button
      type="button"
      className={baseClasses}
      onClick={() => onToggle?.(sticker.code)}
      aria-pressed={isOwned}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <span className={styles.head}>
        <span className={styles.section}>{sectionLabel}</span>
        {sticker.isSpecial ? <span className={styles.specialPill}>Especial</span> : null}
      </span>

      <span className={styles.body}>
        {sticker.category === "team" ? (
          <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="lg" decorative />
        ) : (
          <span className={styles.glyph} aria-hidden="true">
            {sticker.category === "panini" ? "★" : "◆"}
          </span>
        )}
        <span className={styles.number}>{numberLabel}</span>
      </span>

      <span className={styles.foot}>
        <span className={styles.code}>{sticker.displayCode}</span>
        {duplicateCount > 0 ? (
          <span className={styles.repeated}>x{duplicateCount + 1}</span>
        ) : null}
      </span>

      <span className={styles.state} aria-hidden="true">
        {isOwned ? "Conseguida" : "Faltante"}
      </span>
    </button>
  );
}

const StickerCard = memo(StickerCardComponent);
StickerCard.displayName = "StickerCard";
export default StickerCard;
