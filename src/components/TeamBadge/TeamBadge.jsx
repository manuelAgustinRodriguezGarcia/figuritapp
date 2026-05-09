import FlagIcon from "@/components/FlagIcon/FlagIcon";
import styles from "./TeamBadge.module.scss";

export default function TeamBadge({
  team,
  showName = true,
  showColors = true,
  size = "md",
  className,
}) {
  if (!team) return null;
  const teamColorClass = `teamColor--${team.code}`;
  const sizeClass = size === "sm" ? styles.sizeSm : styles.sizeMd;
  const classes = [styles.badge, sizeClass, teamColorClass, className].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      {showColors ? (
        <span className={styles.colors} aria-hidden="true">
          <span className={`${styles.swatch} ${styles.swatchPrimary}`} />
          <span className={`${styles.swatch} ${styles.swatchSecondary}`} />
          <span className={`${styles.swatch} ${styles.swatchAccent}`} />
        </span>
      ) : null}
      <FlagIcon
        flagCode={team.flagCode}
        label={team.name}
        size={size === "sm" ? "sm" : "md"}
      />
      <span className={styles.code}>{team.code}</span>
      {showName ? <span className={styles.name}>{team.name}</span> : null}
    </span>
  );
}
