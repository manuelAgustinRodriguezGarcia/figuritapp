import styles from "./ProgressSummary.module.scss";

function StatBlock({ label, value, sublabel, tone = "default" }) {
  const toneClass =
    tone === "ink" ? styles.statInk : tone === "accent" ? styles.statAccent : styles.statDefault;
  return (
    <div className={`${styles.stat} ${toneClass}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {sublabel ? <span className={styles.statSublabel}>{sublabel}</span> : null}
    </div>
  );
}

export default function ProgressSummary({ stats, hydrated }) {
  const percent = hydrated ? stats.percent : 0;
  const obtained = hydrated ? stats.obtained : 0;
  const missing = hydrated ? stats.missing : stats.total;
  const repeated = hydrated ? stats.repeatedCopies : 0;
  const repeatedUnique = hydrated ? stats.repeatedUnique : 0;
  const specialObtained = hydrated ? stats.specialObtained : 0;

  return (
    <section className={styles.summary} aria-label="Resumen del álbum">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Tu progreso</p>
        <h2 className={styles.title}>
          <span className={styles.percent}>{percent}%</span>
          <span className={styles.titleLabel}>completado</span>
        </h2>
        <p className={styles.subtitle}>
          {obtained} de {stats.total} figuritas conseguidas
        </p>
        <progress
          className={styles.progress}
          value={percent}
          max={100}
          aria-label="Porcentaje completado"
        />
        <span className={styles.progressReadout} aria-hidden="true">
          {percent}% / 100%
        </span>
      </header>

      <div className={styles.stats}>
        <StatBlock label="Total del álbum" value={stats.total} sublabel="figuritas" tone="default" />
        <StatBlock label="Conseguidas" value={obtained} sublabel="figuritas" tone="ink" />
        <StatBlock label="Faltantes" value={missing} sublabel="figuritas" tone="default" />
        <StatBlock label="Repetidas" value={repeated} sublabel={`${repeatedUnique} únicas`} tone="accent" />
        <StatBlock
          label="Especiales"
          value={`${specialObtained}/${stats.specialTotal}`}
          sublabel="conseguidas"
          tone="default"
        />
      </div>
    </section>
  );
}
