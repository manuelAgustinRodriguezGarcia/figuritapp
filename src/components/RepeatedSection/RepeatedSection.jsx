"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import EmptyState from "@/components/EmptyState/EmptyState";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import SectionScrollFab from "@/components/SectionScrollFab/SectionScrollFab";
import ShareRepeatedPanel from "@/components/ShareRepeatedPanel/ShareRepeatedPanel";
import CompareRepeatedPanel from "@/components/CompareRepeatedPanel/CompareRepeatedPanel";
import {
  mergeParsedRepeatedStickerCounts,
  parseRepeatedShareText,
  previewRepeatedStickerWhatsAppImport,
} from "@/utils/repeatedSharing";
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

function ImportPreviewRow({ row }) {
  const { sticker, displayCode, playerName, flagEmoji, countToImport, existingDuplicateCount } = row;
  const isTeam = sticker.category === "team";
  const sectionLabel =
    sticker.category === "fwc" ? sticker.title || "FWC" : describeStickerSection(sticker);
  const sectionLine = `${sectionLabel}${flagEmoji ? ` ${flagEmoji}` : ""}`;

  return (
    <li className={styles.importPreviewItem}>
      <div className={styles.importPreviewHead}>
        {isTeam ? (
          <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="sm" decorative />
        ) : sticker.category === "fwc" ? (
          <FwcStickerVisual sticker={sticker} variant="list" isOwned />
        ) : (
          <span className={styles.importPreviewGlyph} aria-hidden>
            ◆
          </span>
        )}
        <div className={styles.importPreviewBody}>
          <span className={styles.importPreviewCode}>{displayCode}</span>
          {playerName ? <span className={styles.importPreviewName}>{playerName}</span> : null}
          <span className={styles.importPreviewMeta}>{sectionLine}</span>
          <span className={styles.importPreviewCounts}>
            A importar: ×{countToImport}
            {existingDuplicateCount > 0 ? (
              <span className={styles.importPreviewHad}> · Ya tenías: ×{existingDuplicateCount}</span>
            ) : null}
          </span>
        </div>
      </div>
    </li>
  );
}

const SUGGESTION_LIMIT = 3;

function stickerMatchesQuery(sticker, q) {
  if (!q) return false;
  const code = (sticker.code || "").toLowerCase();
  const display = (sticker.displayCode || "").toLowerCase();
  return code.includes(q) || display.includes(q);
}

export default function RepeatedSection({
  album,
  progress,
  hydrated,
  onAddDuplicate,
  onDecreaseDuplicate,
  onMergeDuplicatesFromParsed,
}) {
  const inputId = useId();
  const listboxId = useId();
  const importDialogTitleId = useId();
  const importTextareaId = useId();
  const inputRef = useRef(null);
  const [rawCode, setRawCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [suggestDismissed, setSuggestDismissed] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importParseResult, setImportParseResult] = useState(null);
  const [repesImportToast, setRepesImportToast] = useState(null);

  const stickers = useMemo(() => album?.stickers || [], [album]);

  const importPreview = useMemo(() => {
    if (!importParseResult || !stickers.length) return null;
    return previewRepeatedStickerWhatsAppImport(importParseResult, progress, stickers);
  }, [importParseResult, progress, stickers]);

  const importMerged = useMemo(() => {
    if (!importParseResult?.parsed?.length) return [];
    return mergeParsedRepeatedStickerCounts(importParseResult.parsed);
  }, [importParseResult]);

  const closeImportModal = useCallback(() => {
    setImportModalOpen(false);
    setImportText("");
    setImportParseResult(null);
  }, []);

  useEffect(() => {
    if (!importModalOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeImportModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [importModalOpen, closeImportModal]);

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

  const scrollFabLayoutKey = useMemo(
    () => `${repeatedItems.length}-${totalCopies}-${hydrated ? 1 : 0}`,
    [repeatedItems.length, totalCopies, hydrated],
  );

  const suggestions = useMemo(() => {
    const q = rawCode.trim().toLowerCase();
    if (!q || repeatedItems.length === 0) return [];
    return repeatedItems
      .filter(({ sticker }) => stickerMatchesQuery(sticker, q))
      .slice(0, SUGGESTION_LIMIT);
  }, [rawCode, repeatedItems]);

  const showSuggestionList = suggestions.length > 0 && !suggestDismissed;

  function focusInputSoon() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!album) {
      setFeedback({ tone: "error", message: "Esperá a que termine de cargar el álbum." });
      focusInputSoon();
      return;
    }
    const normalized = normalizeStickerCode(rawCode);
    if (!normalized) {
      setFeedback({
        tone: "error",
        message: "Código inválido. Probá con formatos como ARG1, ARG18, FWC5 o FWC00.",
      });
      focusInputSoon();
      return;
    }
    const sticker = getStickerByCode(normalized, stickers);
    if (!sticker) {
      setFeedback({ tone: "error", message: `El código "${normalized}" no existe en el álbum.` });
      focusInputSoon();
      return;
    }
    onAddDuplicate?.(normalized);
    setFeedback({
      tone: "success",
      message: `Sumamos una repetida de ${sticker.displayCode}.`,
    });
    setSuggestDismissed(false);
    setRawCode("");
    focusInputSoon();
  }

  function applySuggestion(sticker) {
    setSuggestDismissed(true);
    setRawCode(sticker.displayCode);
    if (feedback) setFeedback(null);
    focusInputSoon();
  }

  const handleImportRepes = useCallback(() => {
    setRepesImportToast(null);
    setImportParseResult(null);
    setImportText("");
    setImportModalOpen(true);
  }, []);

  const handleAnalyzeImport = useCallback(() => {
    if (!stickers.length || !importText.trim()) return;
    setImportParseResult(parseRepeatedShareText(importText, stickers));
  }, [importText, stickers]);

  const handleApplyImport = useCallback(() => {
    if (!hydrated || !onMergeDuplicatesFromParsed || importMerged.length === 0) return;
    onMergeDuplicatesFromParsed(importMerged);
    closeImportModal();
    setRepesImportToast("Repetidas importadas correctamente.");
  }, [hydrated, onMergeDuplicatesFromParsed, importMerged, closeImportModal]);

  const handleClearImport = useCallback(() => {
    setImportText("");
    setImportParseResult(null);
  }, []);

  useEffect(() => {
    if (!repesImportToast) return undefined;
    const t = window.setTimeout(() => setRepesImportToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [repesImportToast]);

  function handleComboBlur(event) {
    const { relatedTarget, currentTarget } = event;
    if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) return;
    setSuggestDismissed(true);
  }

  return (
    <section className={styles.section} aria-label="Repes: tus repetidas e intercambio">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Repes</p>
        <h2 className={styles.title}>Cargá tus figus repetidas</h2>
        <p className={styles.subtitle}>
          Ingresá el código de la figurita y la sumamos a tus repetidas.
          Si era faltante, queda marcada como conseguida automáticamente.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label htmlFor={inputId} className={styles.label}>Código de figurita</label>
          <div className={styles.inputRow}>
            <div
              className={styles.inputCombo}
              onBlur={handleComboBlur}
            >
              <input
                ref={inputRef}
                id={inputId}
                className={styles.input}
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestionList}
                aria-controls={showSuggestionList ? listboxId : undefined}
                placeholder="Ej: ARG1, ARG18, FWC5, FWC00"
                value={rawCode}
                onChange={(event) => {
                  setSuggestDismissed(false);
                  setRawCode(event.target.value);
                  if (feedback) setFeedback(null);
                }}
                onFocus={() => setSuggestDismissed(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && showSuggestionList) {
                    event.preventDefault();
                    setSuggestDismissed(true);
                  }
                }}
                aria-describedby={feedback ? `${inputId}-feedback` : undefined}
              />
              {showSuggestionList ? (
                <ul id={listboxId} className={styles.suggestList} role="listbox" aria-label="Repetidas que coinciden">
                  {suggestions.map(({ sticker, count }) => (
                    <li key={sticker.code} className={styles.suggestItem} role="presentation">
                      <button
                        type="button"
                        className={styles.suggestOption}
                        role="option"
                        aria-selected={false}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applySuggestion(sticker);
                        }}
                      >
                        <span className={styles.suggestCode}>{sticker.displayCode}</span>
                        <span className={styles.suggestMeta}>
                          {describeStickerSection(sticker)}
                          <span className={styles.suggestCount}>×{count}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="submit"
              className={styles.submit}
              onMouseDown={(event) => event.preventDefault()}
            >
              Agregar repetida
            </button>
          </div>
          <div className={styles.importRepesRow}>
            <button type="button" className={styles.importRepesBtn} onClick={handleImportRepes}>
              <Download size={18} strokeWidth={2} aria-hidden className={styles.importRepesBtnIcon} />
              Importar repetidas
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

      {repesImportToast ? (
        <p className={styles.importSuccessToast} role="status" aria-live="polite">
          {repesImportToast}
        </p>
      ) : null}

      <div
        id="repes-compartir-recibir"
        className={styles.tradeZone}
        aria-label="Compartir y recibir listas de repes"
      >
        <div className={styles.tradeHeader}>
          <p className={styles.tradeEyebrow}>Intercambio</p>
          <h3 className={styles.tradeTitle}>Compartir y recibir repes</h3>
          <p className={styles.tradeSubtitle}>
            <span className={styles.tradeLead}>Exportar</span> arma el texto FIGURITAPP con las mismas
            repes que cargaste arriba (ideal para WhatsApp).{" "}
            <span className={styles.tradeLead}>Recibir</span> analiza la lista de otra persona y te
            muestra cuáles te sirven según lo que te falta en el álbum. Nada se guarda en un servidor:
            todo pasa en tu dispositivo.
          </p>
        </div>
        <div className={styles.tradeGrid}>
          <div className={styles.tradeCard}>
            <ShareRepeatedPanel duplicates={progress?.duplicates} album={album} />
          </div>
          <div className={styles.tradeCard}>
            <CompareRepeatedPanel album={album} progress={progress} />
          </div>
        </div>
      </div>

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

      {importModalOpen ? (
        <div
          className={styles.importOverlay}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeImportModal();
          }}
        >
          <div className={styles.importDialog} role="dialog" aria-modal="true" aria-labelledby={importDialogTitleId}>
            <div className={styles.importDialogHeader}>
              <h2 id={importDialogTitleId} className={styles.importDialogTitle}>
                Importar repetidas
              </h2>
              <button type="button" className={styles.importCloseBtn} onClick={closeImportModal}>
                Cerrar
              </button>
            </div>
            <div className={styles.importDialogBody}>
              <p className={styles.importIntro}>
                Pegá una lista de WhatsApp con encabezado <strong>Swaps</strong>, <strong>Repes</strong>,{" "}
                <strong>Repetidas</strong> u otro título de intercambio. Solo se importa lo que aparece debajo de ese
                título.
              </p>
              <label className={styles.importLabel} htmlFor={importTextareaId}>
                Texto pegado
              </label>
              <textarea
                id={importTextareaId}
                className={styles.importTextarea}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                spellCheck={false}
                autoComplete="off"
              />
              <div className={styles.importActions}>
                <button
                  type="button"
                  className={styles.importBtnPrimary}
                  onClick={handleAnalyzeImport}
                  disabled={!importText.trim() || !stickers.length}
                >
                  Analizar lista
                </button>
                <button type="button" className={styles.importBtnSecondary} onClick={handleClearImport}>
                  Limpiar
                </button>
              </div>

              {importParseResult && importPreview ? (
                <>
                  {importPreview.summary.detectedCount === 0 ? (
                    <p className={styles.importNotice} role="status">
                      No encontramos repetidas válidas en el texto. Revisá que haya un encabezado como Swaps y líneas
                      con formato EQUIPO: números.
                    </p>
                  ) : null}

                  {importPreview.detected.length > 0 ? (
                    <section className={styles.importPreviewSection} aria-labelledby={`${importDialogTitleId}-det`}>
                      <h3 id={`${importDialogTitleId}-det`} className={styles.importPreviewHeading}>
                        Repetidas detectadas
                      </h3>
                      <ul className={styles.importPreviewList}>
                        {importPreview.detected.map((row) => (
                          <ImportPreviewRow key={row.code} row={row} />
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {importPreview.notRecognized.length > 0 ? (
                    <section className={styles.importPreviewSection} aria-labelledby={`${importDialogTitleId}-unk`}>
                      <h3 id={`${importDialogTitleId}-unk`} className={styles.importPreviewHeading}>
                        No reconocidas
                      </h3>
                      <ul className={styles.importUnknownList}>
                        {importPreview.notRecognized.map((item, i) => (
                          <li key={`unk-${i}`} className={styles.importUnknownItem}>
                            <span className={styles.importUnknownVal}>{item.value}</span>
                            <span className={styles.importUnknownReason}>{item.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {importPreview.warnings.length > 0 ? (
                    <section className={styles.importPreviewSection} aria-labelledby={`${importDialogTitleId}-warn`}>
                      <h3 id={`${importDialogTitleId}-warn`} className={styles.importPreviewHeading}>
                        Advertencias
                      </h3>
                      <ul className={styles.importWarnList}>
                        {importPreview.warnings.map((w, i) => (
                          <li key={`w-${i}`} className={styles.importWarnItem}>
                            {w.reason}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <button
                    type="button"
                    className={styles.importBtnPrimary}
                    onClick={handleApplyImport}
                    disabled={!hydrated || importMerged.length === 0}
                  >
                    Aplicar importación
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <SectionScrollFab
        enabled={Boolean(album)}
        layoutKey={scrollFabLayoutKey}
        variant="aboveBottomNav"
        downLabel="Ir al final de Repes"
        upLabel="Volver arriba de Repes"
      />
    </section>
  );
}
