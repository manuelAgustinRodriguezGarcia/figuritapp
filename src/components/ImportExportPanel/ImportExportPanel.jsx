"use client";

import { useId, useLayoutEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import ProgressExportPanel from "@/components/ProgressExportPanel/ProgressExportPanel";
import ProgressImportPanel from "@/components/ProgressImportPanel/ProgressImportPanel";
import ProgressCalculatorPanel from "@/components/ProgressCalculatorPanel/ProgressCalculatorPanel";
import styles from "./ImportExportPanel.module.scss";

const MOBILE_MAX_MQ = "(max-width: 1023px)";

export default function ImportExportPanel({
  album,
  progress,
  hydrated,
  onResetProgress,
  onReplaceProgress,
}) {
  const optionsRegionId = useId();
  const [feedback, setFeedback] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  const stickers = album?.stickers || [];
  const teams = album?.teams || [];

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MAX_MQ);
    const sync = () => setIsNarrowViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
    <section
      className={`${styles.panel} ${mobileOptionsOpen ? styles.panelOptionsOpen : ""}`}
      aria-label="Importar, exportar y reiniciar progreso"
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Tu progreso</p>
        <h3 className={styles.title}>Exportar, importar o reiniciar</h3>
        <p className={styles.subtitle}>
          Compartí tu álbum por WhatsApp, restaurá una lista o empezá desde cero.
        </p>
      </header>

      <div className={styles.optionsMobileShell}>
        <button
          type="button"
          className={`${styles.mobileOptionsToggle} ${mobileOptionsOpen ? styles.mobileOptionsToggleOpen : ""}`}
          aria-expanded={mobileOptionsOpen}
          aria-controls={optionsRegionId}
          onClick={() => setMobileOptionsOpen((v) => !v)}
        >
          <span className={styles.mobileOptionsToggleIconWrap} aria-hidden>
            <ChevronDown size={22} strokeWidth={2} className={styles.mobileOptionsToggleIcon} />
          </span>
          <span className={styles.mobileOptionsToggleLabelWrap}>
            <span
              className={`${styles.mobileOptionsToggleText} ${!mobileOptionsOpen ? styles.mobileOptionsToggleTextVisible : ""}`}
            >
              Mostrar mis opciones
            </span>
            <span
              className={`${styles.mobileOptionsToggleText} ${mobileOptionsOpen ? styles.mobileOptionsToggleTextVisible : ""}`}
            >
              Cerrar mis opciones
            </span>
          </span>
        </button>

        <div className={styles.optionsBody}>
          <div
            id={optionsRegionId}
            className={styles.optionsBodyInner}
            inert={isNarrowViewport && !mobileOptionsOpen ? true : undefined}
          >
            <ProgressExportPanel
              progress={progress}
              albumStickers={stickers}
              teams={teams}
              hydrated={hydrated}
            />

            <div className={styles.toolsRow}>
              <div className={styles.toolsCell}>
                <ProgressImportPanel
                  albumStickers={stickers}
                  currentProgress={progress}
                  hydrated={hydrated}
                  onReplaceProgress={onReplaceProgress}
                />
              </div>
              <div className={styles.toolsCell}>
                <ProgressCalculatorPanel
                  albumStickers={stickers}
                  teams={teams}
                  currentProgress={progress}
                  hydrated={hydrated}
                  onReplaceProgress={onReplaceProgress}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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
