import styles from "./FlagIcon.module.scss";

const SIZE_TO_CLASS = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

export default function FlagIcon({
  flagCode,
  label,
  size = "md",
  squared = false,
  className,
  decorative = false,
}) {
  if (!flagCode) return null;

  const sizeClass = SIZE_TO_CLASS[size] || SIZE_TO_CLASS.md;
  const classes = [
    "fi",
    `fi-${flagCode}`,
    squared ? "fis" : null,
    styles.flag,
    sizeClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (decorative) {
    return <span className={classes} aria-hidden="true" />;
  }

  return (
    <span
      className={classes}
      role="img"
      aria-label={label ? `Bandera de ${label}` : "Bandera"}
    />
  );
}
