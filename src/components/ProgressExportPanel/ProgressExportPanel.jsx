"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FileUser, Share2 } from "lucide-react";
import { formatProgressShareText, formatMissingFiguritasShareText } from "@/utils/progressSharing";
import styles from "./ProgressExportPanel.module.scss";

const TOAST_VISIBLE_MS = 2600;
const TOAST_EXIT_MS = 380;

export default function ProgressExportPanel({ progress, albumStickers, teams, hydrated }) {
  const manualLabelId = useId();
  const missingManualLabelId = useId();
  const [toast, setToast] = useState(null);
  const [copyFailedText, setCopyFailedText] = useState(null);
  const [missingCopyFailedText, setMissingCopyFailedText] = useState(null);

  const hideTimerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const toastGenRef = useRef(0);

  const shareText = useMemo(
    () => formatProgressShareText(progress || {}, albumStickers || [], teams),
    [progress, albumStickers, teams],
  );

  const missingShareText = useMemo(
    () => formatMissingFiguritasShareText(progress || {}, albumStickers || [], teams),
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

  const copyMissingToClipboard = useCallback(async () => {
    if (!hydrated) return;
    try {
      await navigator.clipboard.writeText(missingShareText);
      setMissingCopyFailedText(null);
      showToast("La lista de faltantes se copió al portapapeles.", "success");
    } catch {
      setMissingCopyFailedText(missingShareText);
      showToast("No pudimos copiar automáticamente. Copiá el texto manualmente.", "notice");
    }
  }, [hydrated, missingShareText, showToast]);

  return (
    <>
      <div className={styles.block}>
        <div className={styles.blockRow}>
          <div className={styles.blockColumn}>
            <div className={styles.cardHead}>
              <span className={styles.cardIcon} aria-hidden>
                <Share2 size={22} strokeWidth={2} />
              </span>
              <h4 className={styles.cardTitle}>Compartir mi álbum</h4>
            </div>
            <p className={styles.helper}>Copiá todo tu album y tus repes para compartirlo por WhatsApp.</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={copyToClipboard}
                disabled={!hydrated}
              >
                <Share2 size={18} strokeWidth={2} aria-hidden className={styles.primaryBtnIcon} />
                Copiar mi album
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

          <div className={styles.missingSubsection}>
            <h4 className={styles.missingTitle}>Compartir figus que me faltan</h4>
            <p className={styles.missingHelper}>
              Armamos el texto FIGURITAPP con lo que todavía no marcaste, para mandarlo por WhatsApp.
            </p>
            <button
              type="button"
              className={styles.missingShareBtn}
              onClick={copyMissingToClipboard}
              disabled={!hydrated}
            >
              <FileUser size={18} strokeWidth={2} aria-hidden className={styles.missingShareBtnIcon} />
              Copiar mis faltantes
            </button>

            {missingCopyFailedText ? (
              <div className={styles.manualWrap}>
                <label className={styles.manualLabel} htmlFor={missingManualLabelId}>
                  Texto para copiar
                </label>
                <textarea
                  id={missingManualLabelId}
                  className={styles.textarea}
                  readOnly
                  value={missingCopyFailedText}
                  rows={12}
                />
              </div>
            ) : null}
          </div>
        </div>
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
