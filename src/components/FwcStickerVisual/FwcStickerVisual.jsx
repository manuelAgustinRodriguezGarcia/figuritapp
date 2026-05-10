"use client";

import FlagIcon from "@/components/FlagIcon/FlagIcon";
import { Trophy, Volleyball } from "lucide-react";
import styles from "./FwcStickerVisual.module.scss";

export default function FwcStickerVisual({ sticker, variant = "card", isOwned = false }) {
  const { fwcArt, flagCode, title } = sticker;
  const iconSize = variant === "card" ? 22 : 18;
  const lucideProps = { size: iconSize, strokeWidth: 2 };

  if (fwcArt === "flag" && flagCode) {
    const flagSize = variant === "card" ? "lg" : "md";
    return <FlagIcon flagCode={flagCode} label={title} size={flagSize} decorative />;
  }

  if (fwcArt === "volleyball") {
    const slotClass =
      variant === "card"
        ? `${styles.iconSlot} ${isOwned ? styles.iconSlotOwned : ""}`
        : `${styles.iconSlotSm} ${isOwned ? styles.iconSlotOwned : ""}`;
    return (
      <span className={slotClass} aria-hidden>
        <Volleyball className={styles.lucide} {...lucideProps} />
      </span>
    );
  }

  if (fwcArt === "gold") {
    const slotClass =
      variant === "card"
        ? `${styles.iconSlot} ${isOwned ? styles.iconSlotGoldOwned : styles.iconSlotGoldMissing}`
        : isOwned
          ? styles.iconSlotGoldOwnedSm
          : styles.iconSlotGoldMissingSm;
    const iconClass = `${styles.lucide} ${isOwned ? styles.lucideGoldOwned : styles.lucideGoldMissing}`;
    return (
      <span className={slotClass} aria-hidden>
        <Trophy className={iconClass} {...lucideProps} />
      </span>
    );
  }

  if (fwcArt === "trophy") {
    const slotClass =
      variant === "card"
        ? `${styles.iconSlot} ${isOwned ? styles.iconSlotOwned : ""}`
        : `${styles.iconSlotSm} ${isOwned ? styles.iconSlotOwned : ""}`;
    return (
      <span className={slotClass} aria-hidden>
        <Trophy className={styles.lucide} {...lucideProps} />
      </span>
    );
  }

  const fallbackSlot =
    variant === "card"
      ? `${styles.iconSlot} ${isOwned ? styles.iconSlotOwned : ""}`
      : `${styles.iconSlotSm} ${isOwned ? styles.iconSlotOwned : ""}`;
  return (
    <span className={fallbackSlot} aria-hidden>
      ◆
    </span>
  );
}
