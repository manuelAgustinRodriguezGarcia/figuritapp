"use client";

import { useId, useMemo, useState } from "react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import EmptyState from "@/components/EmptyState/EmptyState";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import { normalizeStickerCode, getStickerByCode } from "@/utils/stickerCode";
import styles from "./RepeatedSection.module.scss";

function describeStickerSection(sticker) {
  switch (sticker.category) {
    case "fwc":
      return "FWC";
    case "team":
      return sticker.teamName;
    default:
      return "";
  }
}

export default function RepeatedSection({
  album,
  progress,
  hydrated,
  onAddDuplicate,
  onDecreaseDuplicate,
}) {
  const inputId = useId();
  const [rawCode, setRawCode] = useState("");
  const [feedback, setFeedback] = useState(null);

  const stickers = useMemo(() => album?.stickers || [], [album]);

  const repeatedItems = useMemo(() => {
    if (!album) return [];
    const entries = Object.entries(progress.duplicates || {});
    const items = [];
    for (const [code, count] of entries) {
      const numericCount = Number(count);
      if (!Number.isFinite(numericCount) || numericCount <= 0) continue;
      const sticker = getStickerByCode(code, stickers);
      if (!sticker) continue;
      items.push({ sticker, count: numericCount });
    }
    items.sort((a, b) => a.sticker.code.localeCompare(b.sticker.code));
    return items;
  }, [album, progress, stickers]);

  const totalCopies = repeatedItems.reduce((sum, item) => sum + item.count, 0);

  function handleSubmit(event) {
    event.preventDefault();
    if (!album) {
      setFeedback({ tone: "error", message: "Esperá a que termine de cargar el álbum." });
      return;
    }
    const normalized = normalizeStickerCode(rawCode);
    if (!normalized) {
      setFeedback({
        tone: "error",
        message: "Código inválido. Probá con formatos como ARG1, ARG18, FWC5 o FWC00.",
      });
      return;
    }
    const sticker = getStickerByCode(normalized, stickers);
    if (!sticker) {
      setFeedback({ tone: "error", message: `El código "${normalized}" no existe en el álbum.` });
      return;
    }
    onAddDuplicate?.(normalized);
    setFeedback({
      tone: "success",
      message: `Sumamos una repetida de ${sticker.displayCode}.`,
    });
    setRawCode("");
  }

  return (
    <section className={styles.section} aria-label="Repetidas">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Repetidas</p>
        <h2 className={styles.title}>Cargá tus copias extra</h2>
        <p className={styles.subtitle}>
          Ingresá el código de la figurita y la sumamos a tus repetidas.
          Si era faltante, queda marcada como conseguida automáticamente.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label htmlFor={inputId} className={styles.label}>Código de figurita</label>
          <div className={styles.inputRow}>
            <input
              id={inputId}
              className={styles.input}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Ej: ARG1, ARG18, FWC5, FWC00"
              value={rawCode}
              onChange={(event) => {
                setRawCode(event.target.value);
                if (feedback) setFeedback(null);
              }}
              aria-describedby={feedback ? `${inputId}-feedback` : undefined}
            />
            <button type="submit" className={styles.submit}>
              Agregar repetida
            </button>
          </div>
          {feedback ? (
            <p
              id={`${inputId}-feedback`}
              className={`${styles.feedback} ${feedback.tone === "error" ? styles.feedbackError : styles.feedbackSuccess}`}
              role={feedback.tone === "error" ? "alert" : "status"}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
        <div className={styles.summary} aria-live="polite">
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Copias extra</span>
            <span className={styles.summaryValue}>{hydrated ? totalCopies : 0}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Figuritas únicas</span>
            <span className={styles.summaryValue}>{hydrated ? repeatedItems.length : 0}</span>
          </div>
        </div>
      </form>

      {repeatedItems.length === 0 ? (
        <EmptyState
          title="Todavía no agregaste figuritas repetidas."
          description="Cuando saques una repetida, cargá su código acá para llevar el conteo."
          icon="✦"
        />
      ) : (
        <ul className={styles.list} role="list">
          {repeatedItems.map(({ sticker, count }) => {
            const isTeam = sticker.category === "team";
            const teamColorClass = isTeam ? `teamColor--${sticker.teamCode}` : "";
            return (
              <li key={sticker.code} className={`${styles.item} ${teamColorClass}`}>
                <div className={styles.itemHead}>
                  {isTeam ? (
                    <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="lg" />
                  ) : sticker.category === "fwc" ? (
                    <FwcStickerVisual sticker={sticker} variant="list" isOwned />
                  ) : (
                    <span className={styles.itemGlyph} aria-hidden="true">
                      ◆
                    </span>
                  )}
                  <div className={styles.itemTitles}>
                    <span className={styles.itemCode}>{sticker.displayCode}</span>
                    <span className={styles.itemSection}>{describeStickerSection(sticker)}</span>
                  </div>
                  <span className={styles.itemBadge}>x{count}</span>
                </div>
                <div className={styles.itemControls}>
                  <button
                    type="button"
                    className={styles.controlSecondary}
                    onClick={() => onDecreaseDuplicate?.(sticker.code)}
                    aria-label={`Quitar una repetida de ${sticker.displayCode}`}
                  >
                    −1
                  </button>
                  <button
                    type="button"
                    className={styles.controlPrimary}
                    onClick={() => onAddDuplicate?.(sticker.code)}
                    aria-label={`Sumar una repetida de ${sticker.displayCode}`}
                  >
                    +1
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
