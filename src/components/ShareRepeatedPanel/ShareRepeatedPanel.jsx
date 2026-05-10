"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import { formatRepeatedShareText } from "@/utils/repeatedSharing";
import styles from "./ShareRepeatedPanel.module.scss";

const TOAST_VISIBLE_MS = 2600;
const TOAST_EXIT_MS = 380;

export default function ShareRepeatedPanel({ duplicates, album }) {
  const statusId = useId();
  const [toast, setToast] = useState(null);
  const [manualFallback, setManualFallback] = useState(false);
  const [manualText, setManualText] = useState("");

  const hideTimerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const toastGenRef = useRef(0);

  const stickers = useMemo(() => album?.stickers || [], [album]);

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

  const handleShare = useCallback(async () => {
    setManualFallback(false);
    setManualText("");

    const text = formatRepeatedShareText(duplicates, stickers);
    if (!text) {
      showToast("Todavía no tenés repes cargadas para compartir. Sumá figuritas arriba primero.", "neutral");
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Tus repes se copiaron al portapapeles.", "success");
        return;
      } catch {
        // fall through to manual copy
      }
    }

    setManualText(text);
    setManualFallback(true);
    showToast("No pudimos copiar automáticamente. Copiá el texto manualmente.", "notice");
  }, [duplicates, stickers, showToast]);

  return (
    <>
      <div className={styles.root}>
        <div className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden="true">
            <Users size={22} strokeWidth={2} />
          </span>
          <h4 className={styles.cardTitle}>Compartir repes</h4>
        </div>
        <p className={styles.hint}>
          Usa las mismas repes que cargaste arriba: generamos el texto FIGURITAPP listo para WhatsApp.
        </p>
        <button type="button" className={styles.actionBtn} onClick={handleShare}>
          Compartir repes
        </button>
        {manualFallback ? (
          <div className={styles.fallback}>
            <label htmlFor={`${statusId}-manual`} className={styles.fallbackLabel}>
              Texto para copiar manualmente
            </label>
            <textarea
              id={`${statusId}-manual`}
              className={styles.fallbackTextarea}
              readOnly
              rows={8}
              value={manualText}
              onFocus={(e) => e.target.select()}
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
