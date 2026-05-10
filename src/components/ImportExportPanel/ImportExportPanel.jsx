"use client";

import { useState } from "react";
import ProgressExportPanel from "@/components/ProgressExportPanel/ProgressExportPanel";
import ProgressImportPanel from "@/components/ProgressImportPanel/ProgressImportPanel";
import styles from "./ImportExportPanel.module.scss";

export default function ImportExportPanel({
  album,
  progress,
  hydrated,
  onResetProgress,
  onReplaceProgress,
}) {
  const [feedback, setFeedback] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const stickers = album?.stickers || [];
  const teams = album?.teams || [];

  function handleReset() {
    setConfirmingReset(true);
    setFeedback(null);
  }

  function confirmReset() {
    onResetProgress?.();
    setConfirmingReset(false);
    setFeedback({ tone: "success", message: "Reiniciamos tu progreso." });
  }

  function cancelReset() {
    setConfirmingReset(false);
  }

  return (
    <section className={styles.panel} aria-label="Importar, exportar y reiniciar progreso">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Tu progreso</p>
        <h3 className={styles.title}>Exportar, importar o reiniciar</h3>
        <p className={styles.subtitle}>
          Compartí tu álbum por WhatsApp, restaurá una lista o empezá desde cero.
        </p>
      </header>

      <ProgressExportPanel
        progress={progress}
        albumStickers={stickers}
        teams={teams}
        hydrated={hydrated}
      />

      <ProgressImportPanel
        albumStickers={stickers}
        currentProgress={progress}
        hydrated={hydrated}
        onReplaceProgress={onReplaceProgress}
      />

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.dangerAction}
          onClick={handleReset}
          disabled={!hydrated}
        >
          Reiniciar progreso
        </button>
      </div>

      {confirmingReset ? (
        <div className={styles.confirm} role="alertdialog" aria-live="assertive">
          <p className={styles.confirmText}>
            ¿Seguro que querés reiniciar tu progreso? Esta acción no se puede deshacer.
          </p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.secondaryAction} onClick={cancelReset}>
              Cancelar
            </button>
            <button type="button" className={styles.dangerAction} onClick={confirmReset}>
              Sí, reiniciar
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`${styles.feedback} ${feedback.tone === "error" ? styles.feedbackError : styles.feedbackSuccess}`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
