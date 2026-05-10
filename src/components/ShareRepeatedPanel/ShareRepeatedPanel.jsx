"use client";

import { useCallback, useId, useState } from "react";
import { Users } from "lucide-react";
import {
  createRepeatedSharePayload,
  stringifyRepeatedSharePayload,
} from "@/utils/repeatedSharing";
import styles from "./ShareRepeatedPanel.module.scss";

export default function ShareRepeatedPanel({ duplicates }) {
  const statusId = useId();
  const [status, setStatus] = useState(null);
  const [manualFallback, setManualFallback] = useState(false);
  const [manualText, setManualText] = useState("");

  const handleShare = useCallback(async () => {
    setStatus(null);
    setManualFallback(false);
    setManualText("");

    const payload = createRepeatedSharePayload(duplicates);
    if (payload.stickers.length === 0) {
      setStatus({
        tone: "neutral",
        message: "Todavía no tenés figuritas repetidas para compartir.",
      });
      return;
    }

    const text = stringifyRepeatedSharePayload(payload);

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setStatus({
          tone: "success",
          message: "Tus repetidas se copiaron al portapapeles.",
        });
        return;
      } catch {
        // fall through to manual copy
      }
    }

    setManualText(text);
    setManualFallback(true);
    setStatus({
      tone: "notice",
      message:
        "No pudimos copiar automáticamente. Seleccioná y copiá el texto de abajo, o usá Ctrl+C / Cmd+C.",
    });
  }, [duplicates]);

  return (
    <div className={styles.root}>
      <div className={styles.cardHead}>
        <span className={styles.cardIcon} aria-hidden="true">
          <Users size={22} strokeWidth={2} />
        </span>
        <h4 className={styles.cardTitle}>Compartir Repetidas</h4>
      </div>
      <p className={styles.hint}>
        Copiá este texto y envialo por WhatsApp u otra app a alguien que también use Figuritapp.
      </p>
      <button type="button" className={styles.actionBtn} onClick={handleShare}>
        Compartir Repetidas
      </button>
      {status ? (
        <p
          id={statusId}
          className={`${styles.status} ${styles[`status--${status.tone}`]}`}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}
      {manualFallback ? (
        <div className={styles.fallback}>
          <label htmlFor={`${statusId}-manual`} className={styles.fallbackLabel}>
            Texto para copiar manualmente
          </label>
          <textarea
            id={`${statusId}-manual`}
            className={styles.fallbackTextarea}
            readOnly
            rows={6}
            value={manualText}
            onFocus={(e) => e.target.select()}
          />
        </div>
      ) : null}
    </div>
  );
}
