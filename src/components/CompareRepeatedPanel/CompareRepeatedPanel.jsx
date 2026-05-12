"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, ScanSearch } from "lucide-react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import {
  parseRepeatedShareText,
  buildRepesTradeAwayPreview,
  formatStickerCodeSpaced,
  mergeParsedRepeatedStickerCounts,
} from "@/utils/repeatedSharing";
import styles from "./CompareRepeatedPanel.module.scss";

function describeStickerSection(sticker) {
  switch (sticker.category) {
    case "fwc":
      return sticker.title || "FWC";
    case "team":
      return sticker.teamName || sticker.teamCode || "";
    default:
      return "";
  }
}

function stickerKindLabel(sticker) {
  if (sticker.category === "team") {
    if (sticker.isSpecial) return "Escudo";
    if (sticker.number === 13) return "Equipo";
  }
  if (sticker.category === "fwc" && sticker.isSpecial) return "Especial";
  return null;
}

function TradePreviewRow({ row }) {
  const { sticker, notInRepes, insufficient, requestedCount, myDuplicateCount, subtractPlan } = row;
  const isTeam = sticker.category === "team";
  const kind = stickerKindLabel(sticker);
  const playerLine = sticker.playerName?.trim() || null;
  const sectionLine = `${describeStickerSection(sticker)}${row.flagEmoji ? ` ${row.flagEmoji}` : ""}`;

  const rowClass = [
    styles.tradeRow,
    notInRepes ? styles.tradeRowMissing : "",
    insufficient ? styles.tradeRowShort : "",
  ]
    .filter(Boolean)
    .join(" ");

  let statusNote = null;
  if (notInRepes) {
    statusNote = <span className={styles.tradeRowStatus}>No está en tus repes</span>;
  } else if (insufficient) {
    statusNote = (
      <span className={styles.tradeRowStatus}>
        Pedidas ×{requestedCount}, tenés ×{myDuplicateCount}
      </span>
    );
  }

  return (
    <li className={rowClass}>
      <div className={styles.tradeRowHead}>
        {isTeam ? (
          <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="lg" />
        ) : sticker.category === "fwc" ? (
          <FwcStickerVisual sticker={sticker} variant="list" isOwned />
        ) : (
          <span className={styles.tradeRowGlyph} aria-hidden>
            ◆
          </span>
        )}
        <div className={styles.tradeRowBody}>
          <span className={styles.tradeRowCode}>{formatStickerCodeSpaced(sticker.code)}</span>
          {playerLine ? <span className={styles.tradeRowName}>{playerLine}</span> : null}
          {kind ? <span className={styles.tradeRowName}>{kind}</span> : null}
          <span className={styles.tradeRowSection}>{sectionLine}</span>
          <span className={styles.tradeRowCounts}>
            En la lista: ×{requestedCount} · Tus repes: ×{myDuplicateCount}
            {subtractPlan > 0 ? (
              <span className={styles.tradeRowDeduction}> · A descontar: ×{subtractPlan}</span>
            ) : null}
          </span>
          {statusNote}
        </div>
      </div>
    </li>
  );
}

export default function CompareRepeatedPanel({ album, progress, hydrated, onApplyTradeDeductions }) {
  const openButtonRef = useRef(null);
  const textareaRef = useRef(null);
  const titleId = useId();
  const pasteId = useId();

  const [open, setOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parseResult, setParseResult] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [acknowledgedPartial, setAcknowledgedPartial] = useState(false);
  const [toast, setToast] = useState(null);

  const stickers = useMemo(() => album?.stickers || [], [album]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setPasteText("");
    setParseResult(null);
    setParseError(null);
    setAcknowledgedPartial(false);
    setToast(null);
    requestAnimationFrame(() => openButtonRef.current?.focus());
  }, []);

  const tradePreview = useMemo(() => {
    if (!parseResult || !stickers.length) return null;
    return buildRepesTradeAwayPreview(parseResult, progress?.duplicates, stickers);
  }, [parseResult, progress?.duplicates, stickers]);

  const deductionPlan = useMemo(() => {
    if (!tradePreview?.rows?.length) return [];
    return tradePreview.rows
      .filter((r) => r.subtractPlan > 0)
      .map((r) => ({ code: r.code, count: r.subtractPlan }));
  }, [tradePreview]);

  const totalToSubtract = useMemo(
    () => deductionPlan.reduce((s, r) => s + r.count, 0),
    [deductionPlan],
  );

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setPasteText("");
    setParseResult(null);
    setParseError(null);
    setAcknowledgedPartial(false);
    setToast(null);
  }, []);

  const handleClear = useCallback(() => {
    setPasteText("");
    setParseResult(null);
    setParseError(null);
    setAcknowledgedPartial(false);
    textareaRef.current?.focus();
  }, []);

  const handleAnalyze = useCallback(() => {
    setParseError(null);
    setParseResult(null);
    setAcknowledgedPartial(false);

    const pr = parseRepeatedShareText(pasteText, stickers);
    const mergedQuick = mergeParsedRepeatedStickerCounts(pr.parsed);
    if (mergedQuick.length === 0) {
      setParseError(
        "No encontramos figuritas en el texto. Pegá el mensaje FIGURITAPP con “Figus que me sirven” o una lista compatible (país + números).",
      );
      return;
    }
    setParseResult(pr);
  }, [pasteText, stickers]);

  const handleAcknowledgePartial = useCallback(() => {
    setAcknowledgedPartial(true);
  }, []);

  const handleConfirmTrade = useCallback(() => {
    if (!hydrated || !onApplyTradeDeductions || deductionPlan.length === 0) return;
    onApplyTradeDeductions(deductionPlan);
    setOpen(false);
    setPasteText("");
    setParseResult(null);
    setParseError(null);
    setAcknowledgedPartial(false);
    setToast(
      `Listo: descontamos ${totalToSubtract} ${totalToSubtract === 1 ? "copia" : "copias"} de tus repes.`,
    );
    requestAnimationFrame(() => openButtonRef.current?.focus());
  }, [hydrated, onApplyTradeDeductions, deductionPlan, totalToSubtract]);

  const confirmDisabled =
    !tradePreview ||
    tradePreview.rows.length === 0 ||
    deductionPlan.length === 0 ||
    !hydrated ||
    (tradePreview.hasProblems && totalToSubtract > 0 && !acknowledgedPartial);

  return (
    <>
      <div className={styles.root}>
        <div className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden>
            <ScanSearch size={22} strokeWidth={2} />
          </span>
          <h4 className={styles.cardTitle}>Recibir repes de otro</h4>
        </div>
        <div className={styles.bodyRow}>
          <p className={styles.hint}>
            Pegá la lista de figus que le sirven a tu amigo para borrarlas de tu lista de repes.
          </p>
          <button type="button" ref={openButtonRef} className={styles.openBtn} onClick={handleOpen}>
            <ScanSearch size={18} strokeWidth={2} aria-hidden className={styles.openBtnIcon} />
            Recibir repes de otro
          </button>
        </div>
      </div>

      {open ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
        >
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className={styles.dialogHeader}>
              <h2 id={titleId} className={styles.dialogTitle}>
                Descontar repes según lista
              </h2>
              <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">
                Cerrar
              </button>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.intro}>
                Pegá el mensaje con el encabezado FIGURITAPP y “Figus que me sirven”. Vamos a reconocer países y
                jugadores, mostrar cuántas figus trae la lista y descontar de tus repes (si tenés una sola, desaparece
                de la lista; si tenés más, baja el conteo).
              </p>
              <label htmlFor={pasteId} className={styles.pasteLabel}>
                Texto pegado
              </label>
              <textarea
                ref={textareaRef}
                id={pasteId}
                className={styles.pasteArea}
                value={pasteText}
                onChange={(event) => {
                  setPasteText(event.target.value);
                  if (parseError) setParseError(null);
                  if (parseResult) setParseResult(null);
                  setAcknowledgedPartial(false);
                }}
                rows={10}
                autoComplete="off"
                spellCheck={false}
              />

              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} onClick={handleAnalyze}>
                  Analizar lista
                </button>
                <button type="button" className={styles.btnSecondary} onClick={handleClear}>
                  Limpiar
                </button>
              </div>

              {parseError ? (
                <p className={styles.error} role="alert" aria-live="assertive">
                  {parseError}
                </p>
              ) : null}

              {tradePreview ? (
                <>
                  <p className={styles.tradeSummary}>
                    Figuritas en la lista: <strong>{tradePreview.totalEnLista}</strong>
                    {totalToSubtract > 0 ? (
                      <>
                        {" "}
                        · Se van a descontar de tus repes: <strong>{totalToSubtract}</strong>
                      </>
                    ) : null}
                  </p>

                  {tradePreview.warnings.length > 0 ? (
                    <ul className={styles.warnings} aria-label="Advertencias de lectura">
                      {tradePreview.warnings.map((w, i) => (
                        <li key={`w-${i}`}>{w.message || w.reason}</li>
                      ))}
                    </ul>
                  ) : null}

                  {tradePreview.hasProblems ? (
                    <div
                      className={styles.riskBanner}
                      role="region"
                      aria-label="Diferencias con tus repes"
                    >
                      <p className={styles.riskBannerText}>
                        Hay figuritas en rojo que no tenés en repes o no alcanza la cantidad. Solo podemos descontar lo
                        que realmente tenés repetido.
                      </p>
                      {totalToSubtract === 0 ? (
                        <p className={styles.riskBannerText}>
                          Con tus repes actuales no se puede descontar nada de esta lista.
                        </p>
                      ) : null}
                      {totalToSubtract > 0 && !acknowledgedPartial ? (
                        <button type="button" className={styles.riskAckBtn} onClick={handleAcknowledgePartial}>
                          Entendido, descontar solo lo disponible
                        </button>
                      ) : null}
                      {totalToSubtract > 0 && acknowledgedPartial ? (
                        <p className={styles.riskAckDone}>Continuamos con el descuento parcial.</p>
                      ) : null}
                    </div>
                  ) : null}

                  {tradePreview.rows.length > 0 ? (
                    <section className={styles.tradePreviewSection} aria-labelledby={`${titleId}-list`}>
                      <h3 id={`${titleId}-list`} className={styles.tradePreviewHeading}>
                        Detalle
                      </h3>
                      <ul className={styles.tradePreviewList}>
                        {tradePreview.rows.map((row) => (
                          <TradePreviewRow key={row.code} row={row} />
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {tradePreview.unknown.length > 0 ? (
                    <section className={styles.tradeUnknownSection} aria-labelledby={`${titleId}-unk`}>
                      <h3 id={`${titleId}-unk`} className={styles.tradePreviewHeading}>
                        No reconocidas
                      </h3>
                      <ul className={styles.tradeUnknownList}>
                        {tradePreview.unknown.map((item, i) => (
                          <li key={`unk-${i}`} className={styles.tradeUnknownItem}>
                            <span className={styles.tradeUnknownVal}>{item.value}</span>
                            <span className={styles.tradeUnknownReason}>{item.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <div className={styles.tradeConfirmRow}>
                    <button type="button" className={styles.btnSecondary} onClick={handleClose}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={styles.btnConfirmTrade}
                      disabled={confirmDisabled}
                      onClick={handleConfirmTrade}
                    >
                      <ArrowLeftRight size={18} strokeWidth={2} aria-hidden className={styles.btnConfirmTradeIcon} />
                      Confirmar cambio
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={styles.copyToast} role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </>
  );
}
