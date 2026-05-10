"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { formatProgressShareText } from "@/utils/progressSharing";
import styles from "./ProgressExportPanel.module.scss";

export default function ProgressExportPanel({ progress, albumStickers, teams, hydrated }) {
  const statusId = useId();
  const manualLabelId = useId();
  const [status, setStatus] = useState(null);
  const [copyFailedText, setCopyFailedText] = useState(null);
  const [showText, setShowText] = useState(false);

  const shareText = useMemo(
    () => formatProgressShareText(progress || {}, albumStickers || [], teams),
    [progress, albumStickers, teams],
  );

  const copyToClipboard = useCallback(async () => {
    if (!hydrated) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyFailedText(null);
      setStatus({ tone: "success", message: "Tu progreso se copió al portapapeles." });
    } catch {
      setCopyFailedText(shareText);
      setStatus({
        tone: "error",
        message: "No pudimos copiar automáticamente. Copiá el texto manualmente.",
      });
    }
  }, [hydrated, shareText]);

  return (
    <div className={styles.block}>
      <h4 className={styles.title}>Exportar progreso</h4>
      <p className={styles.helper}>
        Copiá tu progreso en formato de lista para compartirlo por WhatsApp o guardarlo como respaldo.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={copyToClipboard}
          disabled={!hydrated}
        >
          Copiar progreso
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => setShowText((v) => !v)}
          disabled={!hydrated}
        >
          {showText ? "Ocultar texto" : "Ver texto"}
        </button>
      </div>

      {status ? (
        <p
          id={statusId}
          className={`${styles.status} ${status.tone === "error" ? styles.statusError : styles.statusSuccess}`}
          role={status.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}

      {copyFailedText ? (
        <div className={styles.manualWrap}>
          <label className={styles.manualLabel} htmlFor={manualLabelId}>
            Texto para copiar
          </label>
          <textarea
            id={manualLabelId}
            className={styles.textarea}
            readOnly
            value={copyFailedText}
            rows={12}
          />
        </div>
      ) : null}

      {showText && !copyFailedText ? (
        <div className={`${styles.manualWrap} ${styles.textPreview}`}>
          <span className={styles.manualLabel}>Vista del texto</span>
          <textarea
            className={styles.textarea}
            readOnly
            value={shareText}
            rows={12}
            aria-label="Vista del texto exportado"
          />
        </div>
      ) : null}
    </div>
  );
}
