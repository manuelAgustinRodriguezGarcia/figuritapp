"use client";

import styles from "./AppBootSplash.module.scss";

/**
 * Pantalla inicial mientras se obtiene el JSON del álbum (misma marca que la transición entre secciones).
 */
export default function AppBootSplash() {
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-busy="true" aria-label="Cargando Figuritapp">
      <div className={styles.inner}>
        <img src="/logo.png" alt="" className={styles.logo} decoding="async" />
        <div className={styles.wordmark}>
          <div className={styles.wordmarkGhost} aria-hidden>
            FIGURIT<span className={styles.brandSuffix}>APP</span>
          </div>
          <div className={styles.wordmarkFill} aria-hidden>
            FIGURIT<span className={styles.brandSuffix}>APP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
