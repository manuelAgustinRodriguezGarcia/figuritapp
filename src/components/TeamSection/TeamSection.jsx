"use client";

import StickerGrid from "@/components/StickerGrid/StickerGrid";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import styles from "./TeamSection.module.scss";

export default function TeamSection({
  team,
  stickers,
  owned,
  duplicates,
  stats,
  onToggle,
  onAddDuplicate,
  onDecreaseDuplicate,
}) {
  if (!stickers?.length) return null;
  const teamColorClass = `teamColor--${team.code}`;
  const obtained = stats?.obtained ?? 0;
  const total = stats?.total ?? stickers.length;

  const sectionClass =
    team.code === "ARG" ? `${styles.section} ${styles.sectionArgentina} ${teamColorClass}` : `${styles.section} ${teamColorClass}`;

  return (
    <article className={sectionClass} aria-label={`Selección de ${team.name}`}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <FlagIcon flagCode={team.flagCode} label={team.name} size="lg" />
          <div className={styles.titles}>
            <p className={styles.code}>{team.code}</p>
            <h3 className={styles.name}>{team.name}</h3>
          </div>
        </div>
        <div className={styles.progressWrap}>
          <span className={styles.progressLabel}>Progreso</span>
          <span className={styles.progressValue}>{obtained}/{total}</span>
        </div>
      </header>
      <div className={styles.colorStrip} aria-hidden="true">
        <span className={styles.colorPrimary} />
        <span className={styles.colorSecondary} />
        <span className={styles.colorAccent} />
      </div>
      <StickerGrid
        stickers={stickers}
        owned={owned}
        duplicates={duplicates}
        onToggle={onToggle}
        onAddDuplicate={onAddDuplicate}
        onDecreaseDuplicate={onDecreaseDuplicate}
      />
    </article>
  );
}
