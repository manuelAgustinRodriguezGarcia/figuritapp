"use client";

import styles from "./SectionTransitionOverlay.module.scss";

export default function SectionTransitionOverlay({ open, animationKey }) {
  if (!open) return null;

  return (
    <div
      className={styles.root}
      aria-hidden="true"
      data-section-transition-overlay
    >
      <div className={styles.inner} key={animationKey}>
        <img
          src="/logo.png"
          alt=""
          className={styles.logo}
          decoding="async"
        />
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
