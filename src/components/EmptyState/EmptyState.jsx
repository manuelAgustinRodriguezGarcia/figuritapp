import styles from "./EmptyState.module.scss";

export default function EmptyState({ title, description, action, icon = "·" }) {
  return (
    <div className={styles.empty} role="status">
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      {title ? <p className={styles.title}>{title}</p> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
