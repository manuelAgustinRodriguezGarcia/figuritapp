"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import {
  parseRepeatedShareText,
  buildRepesTradeAwayPreview,
  formatStickerCodeSpaced,
  mergeParsedRepeatedStickerCounts,
} from "@/utils/repeatedSharing";
import c from "../CompareRepeatedPanel/CompareRepeatedPanel.module.scss";

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

  const rowClass = [c.tradeRow, notInRepes ? c.tradeRowMissing : "", insufficient ? c.tradeRowShort : ""]
    .filter(Boolean)
    .join(" ");

  let statusNote = null;
  if (notInRepes) {
    statusNote = <span className={c.tradeRowStatus}>No está en tus repes</span>;
  } else if (insufficient) {
    statusNote = (
      <span className={c.tradeRowStatus}>
        Pedidas ×{requestedCount}, tenés ×{myDuplicateCount}
      </span>
    );
  }

  return (
    <li className={rowClass}>
      <div className={c.tradeRowHead}>
        {isTeam ? (
          <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="lg" />
        ) : sticker.category === "fwc" ? (
          <FwcStickerVisual sticker={sticker} variant="list" isOwned />
        ) : (
          <span className={c.tradeRowGlyph} aria-hidden>
            ◆
          </span>
        )}
        <div className={c.tradeRowBody}>
          <span className={c.tradeRowCode}>{formatStickerCodeSpaced(sticker.code)}</span>
          {playerLine ? <span className={c.tradeRowName}>{playerLine}</span> : null}
          {kind ? <span className={c.tradeRowName}>{kind}</span> : null}
          <span className={c.tradeRowSection}>{sectionLine}</span>
          <span className={c.tradeRowCounts}>
            En la lista: ×{requestedCount} · Tus repes: ×{myDuplicateCount}
            {subtractPlan > 0 ? <span className={c.tradeRowDeduction}> · A descontar: ×{subtractPlan}</span> : null}
          </span>
          {statusNote}
        </div>
      </div>
    </li>
  );
}

export default function RepesSwapClearModal({
  open,
  onClose,
  album,
  progress,
  hydrated,
  onApplyTradeDeductions,
  onAfterDeduction,
}) {
  const textareaRef = useRef(null);
  const titleId = useId();
  const pasteId = useId();

  const [pasteText, setPasteText] = useState("");
  const [parseResult, setParseResult] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [acknowledgedPartial, setAcknowledgedPartial] = useState(false);

  const stickers = useMemo(() => album?.stickers || [], [album]);

  const resetForm = useCallback(() => {
    setPasteText("");
    setParseResult(null);
    setParseError(null);
    setAcknowledgedPartial(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose?.();
  }, [onClose, resetForm]);

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

  const totalToSubtract = useMemo(() => deductionPlan.reduce((s, r) => s + r.count, 0), [deductionPlan]);

  useEffect(() => {
    if (!open) return undefined;
    resetForm();
    return undefined;
  }, [open, resetForm]);

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
    const mergedQuick = mergeParsedRepeatedStickerCounts(pr.parsed, { uniqueOnly: true });
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
    const msg = `Listo: descontamos ${totalToSubtract} ${totalToSubtract === 1 ? "copia" : "copias"} de tus repes.`;
    resetForm();
    onClose?.();
    onAfterDeduction?.(msg);
  }, [
    hydrated,
    onApplyTradeDeductions,
    deductionPlan,
    totalToSubtract,
    resetForm,
    onClose,
    onAfterDeduction,
  ]);

  const confirmDisabled =
    !tradePreview ||
    tradePreview.rows.length === 0 ||
    deductionPlan.length === 0 ||
    !hydrated ||
    (tradePreview.hasProblems && totalToSubtract > 0 && !acknowledgedPartial);

  if (!open) return null;

  return (
    <div
      className={c.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className={c.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={c.dialogHeader}>
          <h2 id={titleId} className={c.dialogTitle}>
            Borrar repes cambiadas
          </h2>
          <button type="button" className={c.closeBtn} onClick={handleClose} aria-label="Cerrar">
            Cerrar
          </button>
        </div>

        <div className={c.dialogBody}>
          <p className={c.intro}>
            Pegá acá el mensaje “Figus que me sirven” que te mandó tu amigo/a. Al apretar confirmar se borran de tu lista de repes.
          </p>
          <label htmlFor={pasteId} className={c.pasteLabel}>
            Texto pegado
          </label>
          <textarea
            ref={textareaRef}
            id={pasteId}
            className={c.pasteArea}
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

          <div className={c.actions}>
            <button type="button" className={c.btnPrimary} onClick={handleAnalyze}>
              Analizar lista
            </button>
            <button type="button" className={c.btnSecondary} onClick={handleClear}>
              Limpiar
            </button>
          </div>

          {parseError ? (
            <p className={c.error} role="alert" aria-live="assertive">
              {parseError}
            </p>
          ) : null}

          {tradePreview ? (
            <>
              <p className={c.tradeSummary}>
                Figuritas en la lista: <strong>{tradePreview.totalEnLista}</strong>
                {totalToSubtract > 0 ? (
                  <>
                    {" "}
                    · Se van a descontar de tus repes: <strong>{totalToSubtract}</strong>
                  </>
                ) : null}
              </p>

              {tradePreview.warnings.length > 0 ? (
                <ul className={c.warnings} aria-label="Advertencias de lectura">
                  {tradePreview.warnings.map((w, i) => (
                    <li key={`w-${i}`}>{w.message || w.reason}</li>
                  ))}
                </ul>
              ) : null}

              {tradePreview.hasProblems ? (
                <div className={c.riskBanner} role="region" aria-label="Diferencias con tus repes">
                  <p className={c.riskBannerText}>
                    Hay figuritas en rojo que no tenés en repes o no alcanza la cantidad. Solo podemos descontar lo que
                    realmente tenés repetido.
                  </p>
                  {totalToSubtract === 0 ? (
                    <p className={c.riskBannerText}>
                      Con tus repes actuales no se puede descontar nada de esta lista.
                    </p>
                  ) : null}
                  {totalToSubtract > 0 && !acknowledgedPartial ? (
                    <button type="button" className={c.riskAckBtn} onClick={handleAcknowledgePartial}>
                      Entendido, descontar solo lo disponible
                    </button>
                  ) : null}
                  {totalToSubtract > 0 && acknowledgedPartial ? (
                    <p className={c.riskAckDone}>Continuamos con el descuento parcial.</p>
                  ) : null}
                </div>
              ) : null}

              {tradePreview.rows.length > 0 ? (
                <section className={c.tradePreviewSection} aria-labelledby={`${titleId}-list`}>
                  <h3 id={`${titleId}-list`} className={c.tradePreviewHeading}>
                    Detalle
                  </h3>
                  <ul className={c.tradePreviewList}>
                    {tradePreview.rows.map((row) => (
                      <TradePreviewRow key={row.code} row={row} />
                    ))}
                  </ul>
                </section>
              ) : null}

              {tradePreview.unknown.length > 0 ? (
                <section className={c.tradeUnknownSection} aria-labelledby={`${titleId}-unk`}>
                  <h3 id={`${titleId}-unk`} className={c.tradePreviewHeading}>
                    No reconocidas
                  </h3>
                  <ul className={c.tradeUnknownList}>
                    {tradePreview.unknown.map((item, i) => (
                      <li key={`unk-${i}`} className={c.tradeUnknownItem}>
                        <span className={c.tradeUnknownVal}>{item.value}</span>
                        <span className={c.tradeUnknownReason}>{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}
        </div>

        {tradePreview ? (
          <div className={c.dialogTradeFooter} role="group" aria-label="Confirmar borrado de repes cambiadas">
            <div className={c.tradeConfirmRow}>
              <button type="button" className={c.btnSecondary} onClick={handleClose}>
                Cancelar
              </button>
              <button
                type="button"
                className={c.btnConfirmTrade}
                disabled={confirmDisabled}
                onClick={handleConfirmTrade}
              >
                <ArrowLeftRight size={18} strokeWidth={2} aria-hidden className={c.btnConfirmTradeIcon} />
                Confirmar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
