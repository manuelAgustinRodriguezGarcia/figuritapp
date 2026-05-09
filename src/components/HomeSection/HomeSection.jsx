"use client";

import ProgressSummary from "@/components/ProgressSummary/ProgressSummary";
import styles from "./HomeSection.module.scss";

export default function HomeSection({ stats, hydrated, onNavigate }) {
  return (
    <section className={styles.section} aria-labelledby="home-heading">
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Panini FIFA World Cup 2026</p>
        <h1 id="home-heading" className={styles.title}>
          <span className={styles.titleTop}>Vivilo,</span>
          <span className={styles.titleBottom}>completalo.</span>
        </h1>
        <p className={styles.subtitle}>
          Seguí el progreso de tu álbum, marcá tus figuritas conseguidas
          y ordená tus repetidas en un solo lugar.
        </p>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => onNavigate?.("album")}
          >
            Ir a Mi álbum
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => onNavigate?.("repeated")}
          >
            Ver Repetidas
          </button>
        </div>
      </div>

      <ProgressSummary stats={stats} hydrated={hydrated} />

      <div className={styles.quickGrid}>
        <article className={styles.quickCard}>
          <p className={styles.quickEyebrow}>Sección Mi álbum</p>
          <h2 className={styles.quickTitle}>Marcá lo que tenés</h2>
          <p className={styles.quickBody}>
            Tocá una figurita para marcarla como conseguida o faltante.
            El estado se guarda en tu navegador.
          </p>
          <button type="button" className={styles.quickLink} onClick={() => onNavigate?.("album")}>
            Abrir Mi álbum →
          </button>
        </article>
        <article className={styles.quickCard}>
          <p className={styles.quickEyebrow}>Sección Repetidas</p>
          <h2 className={styles.quickTitle}>Sumá tus repetidas</h2>
          <p className={styles.quickBody}>
            Cargá un código y vamos a contar tus copias extra,
            mostrar la bandera y marcarla como conseguida.
          </p>
          <button type="button" className={styles.quickLink} onClick={() => onNavigate?.("repeated")}>
            Cargar repetidas →
          </button>
        </article>
      </div>
    </section>
  );
}
