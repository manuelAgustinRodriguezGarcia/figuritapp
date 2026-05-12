"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { formatProgressShareText } from "@/utils/progressSharing";
import styles from "./ProgressExportPanel.module.scss";

const TOAST_VISIBLE_MS = 2600;
const TOAST_EXIT_MS = 380;

export default function ProgressExportPanel({ progress, albumStickers, teams, hydrated }) {
  const manualLabelId = useId();
  const [toast, setToast] = useState(null);
  const [copyFailedText, setCopyFailedText] = useState(null);

  const hideTimerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const toastGenRef = useRef(0);

  const shareText = useMemo(
    () => formatProgressShareText(progress || {}, albumStickers || [], teams),
    [progress, albumStickers, teams],
  );

  const clearToastTimers = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (exitTimerRef.current != null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (message, tone) => {
      clearToastTimers();
      toastGenRef.current += 1;
      setToast({ message, tone, exiting: false, gen: toastGenRef.current });
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        setToast((prev) => (prev ? { ...prev, exiting: true } : null));
        exitTimerRef.current = window.setTimeout(() => {
          exitTimerRef.current = null;
          setToast(null);
        }, TOAST_EXIT_MS);
      }, TOAST_VISIBLE_MS);
    },
    [clearToastTimers],
  );

  useEffect(() => () => clearToastTimers(), [clearToastTimers]);

  const copyToClipboard = useCallback(async () => {
    if (!hydrated) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyFailedText(null);
      showToast("Tu progreso se copió al portapapeles.", "success");
    } catch {
      setCopyFailedText(shareText);
      showToast("No pudimos copiar automáticamente. Copiá el texto manualmente.", "notice");
    }
  }, [hydrated, shareText, showToast]);

  return (
    <>
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
            <Share2 size={18} strokeWidth={2} aria-hidden className={styles.primaryBtnIcon} />
            Copiar progreso
          </button>
        </div>

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
      </div>

      {toast ? (
        <div className={styles.toastAnchor} aria-live="polite" role="status">
          <div
            key={toast.gen}
            className={`${styles.toast} ${styles[`toast--${toast.tone}`]} ${toast.exiting ? styles.toastExiting : ""}`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </>
  );
}
