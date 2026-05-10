"use client";

import { memo } from "react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import styles from "./StickerCard.module.scss";

function getSectionLabel(sticker) {
  switch (sticker.category) {
    case "fwc":
      return "FWC";
    case "team":
      return sticker.teamName || sticker.teamCode || "Selección";
    default:
      return "";
  }
}

function getFwcNumberLabel(sticker) {
  if (sticker.category === "fwc") return sticker.code.replace(/^FWC/, "");
  return "";
}

/** Pastilla bajo el nombre de sección (FWC sigue usando "Especial"). */
function getHeadPillLabel(sticker) {
  if (sticker.category === "team") {
    if (sticker.isSpecial) return "Escudo";
    if (sticker.number === 13) return "Equipo";
    return null;
  }
  if (sticker.isSpecial) return "Especial";
  return null;
}

function getTeamPlayerName(sticker) {
  if (sticker.category !== "team") return null;
  if (sticker.number === 1 || sticker.number === 13) return null;
  const name = sticker.playerName?.trim();
  return name || null;
}

function StickerCardComponent({ sticker, owned, duplicateCount = 0, onToggle }) {
  const isOwned = !!owned;
  const sectionLabel = getSectionLabel(sticker);
  const fwcNumberLabel = getFwcNumberLabel(sticker);
  const headPillLabel = getHeadPillLabel(sticker);
  const teamPlayerName = getTeamPlayerName(sticker);

  const baseClasses = [
    styles.card,
    isOwned ? styles.owned : styles.missing,
    sticker.isSpecial ? styles.special : null,
    sticker.fwcArt === "gold" ? styles.fwcGold : null,
    sticker.category === "team" ? `teamColor--${sticker.teamCode}` : null,
    sticker.teamCode === "ARG" ? styles.teamArgentina : null,
  ]
    .filter(Boolean)
    .join(" ");

  const nameHint = teamPlayerName ? ` (${teamPlayerName})` : "";
  const accessibleLabel = isOwned
    ? `Marcar ${sticker.displayCode}${nameHint} como faltante`
    : `Marcar ${sticker.displayCode}${nameHint} como conseguida`;

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
        {sticker.category === "team" ? (
          <span className={styles.headTeamTitles}>
            <span className={styles.section}>{sectionLabel}</span>
            {headPillLabel ? <span className={styles.specialPill}>{headPillLabel}</span> : null}
          </span>
        ) : (
          <>
            <span className={styles.section}>{sectionLabel}</span>
            {headPillLabel ? <span className={styles.specialPill}>{headPillLabel}</span> : null}
          </>
        )}
      </span>

      <span className={`${styles.body} ${sticker.category === "team" ? styles.bodyTeam : ""}`}>
        {sticker.category === "team" ? (
          <>
            <span className={styles.teamBodyRow}>
              <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="lg" decorative />
              <span className={styles.numberCol}>
                <span className={`${styles.number} ${styles.numberStickerCode}`}>
                  {sticker.displayCode}
                </span>
                {duplicateCount > 0 ? (
                  <span className={styles.repeated}>x{duplicateCount + 1}</span>
                ) : null}
              </span>
            </span>
            <span className={styles.playerNameSlot}>
              {teamPlayerName ? (
                <span className={styles.playerName}>{teamPlayerName}</span>
              ) : null}
            </span>
          </>
        ) : sticker.category === "fwc" ? (
          <>
            <FwcStickerVisual sticker={sticker} variant="card" isOwned={isOwned} />
            <span className={styles.number}>{fwcNumberLabel}</span>
          </>
        ) : null}
      </span>

      {sticker.category === "fwc" ? (
        <span className={styles.foot}>
          <span className={styles.code}>{sticker.displayCode}</span>
          {duplicateCount > 0 ? (
            <span className={styles.repeated}>x{duplicateCount + 1}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

const StickerCard = memo(StickerCardComponent);
StickerCard.displayName = "StickerCard";
export default StickerCard;
