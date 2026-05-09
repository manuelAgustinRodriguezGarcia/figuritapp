"use client";

import StickerCard from "@/components/StickerCard/StickerCard";
import styles from "./StickerGrid.module.scss";

export default function StickerGrid({ stickers, owned, duplicates, onToggle, density = "comfortable" }) {
  if (!stickers?.length) return null;

  const classes = [
    styles.grid,
    density === "compact" ? styles.compact : styles.comfortable,
  ].join(" ");

  return (
    <div className={classes} role="list">
      {stickers.map((sticker) => (
        <div key={sticker.code} role="listitem" className={styles.cell}>
          <StickerCard
            sticker={sticker}
            owned={!!owned?.[sticker.code]}
            duplicateCount={Number(duplicates?.[sticker.code]) || 0}
            onToggle={onToggle}
          />
        </div>
      ))}
    </div>
  );
}
