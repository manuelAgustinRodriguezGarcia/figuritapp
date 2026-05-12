"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Copy, ListChecks, ScanSearch } from "lucide-react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import {
  parseRepeatedShareText,
  compareRepeatedListWithProgress,
  formatUsefulHumanShareText,
  formatStickerCodeSpaced,
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

function CompareResultRow({ row, selectable = false, selected = false, onToggle }) {
  const { sticker, count, flagEmoji } = row;
  const isTeam = sticker.category === "team";
  const kind = stickerKindLabel(sticker);
  const playerLine = sticker.playerName?.trim() || null;
  const sectionLine = `${describeStickerSection(sticker)}${flagEmoji ? ` ${flagEmoji}` : ""}`;

  const head = (
    <div className={styles.resultHead}>
      {isTeam ? (
        <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="lg" />
      ) : sticker.category === "fwc" ? (
        <FwcStickerVisual sticker={sticker} variant="list" isOwned />
      ) : (
        <span className={styles.resultGlyph} aria-hidden="true">
          ◆
        </span>
      )}
      <div className={styles.resultBody}>
        <span className={styles.resultCode}>{formatStickerCodeSpaced(sticker.code)}</span>
        {playerLine ? <span className={styles.resultName}>{playerLine}</span> : null}
        {kind ? <span className={styles.resultName}>{kind}</span> : null}
        <span className={styles.resultSection}>{sectionLine}</span>
        <span className={styles.avail}>Disponible: x{count}</span>
      </div>
    </div>
  );

  if (selectable) {
    return (
      <li className={`${styles.resultItem} ${styles.resultItemPick}`}>
        <button
          type="button"
          className={`${styles.resultItemSelect} ${selected ? styles.resultItemSelectOn : ""}`}
          aria-pressed={selected}
          onClick={() => onToggle?.(row.code)}
        >
          {head}
        </button>
      </li>
    );
  }

  return <li className={styles.resultItem}>{head}</li>;
}

export default function CompareRepeatedPanel({ album, progress }) {
  const openButtonRef = useRef(null);
  const textareaRef = useRef(null);
  const titleId = useId();
  const pasteId = useId();

  const [open, setOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parseError, setParseError] = useState(null);
  const [partialNotice, setPartialNotice] = useState(null);
  const [result, setResult] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [tradePickMode, setTradePickMode] = useState(false);
  const [tradePickCodes, setTradePickCodes] = useState([]);

  const stickers = useMemo(() => album?.stickers || [], [album]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setParseError(null);
    setPartialNotice(null);
    setResult(null);
    setCopyFeedback(null);
    setTradePickMode(false);
    setTradePickCodes([]);
    requestAnimationFrame(() => openButtonRef.current?.focus());
  }, []);

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
    if (!copyFeedback) return undefined;
    const id = window.setTimeout(() => setCopyFeedback(null), 3800);
    return () => window.clearTimeout(id);
  }, [copyFeedback]);

  const handleToggleTradePick = useCallback((code) => {
    setTradePickCodes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code].sort((a, b) => a.localeCompare(b)),
    );
  }, []);

  const handleStartTradePick = useCallback(() => {
    setTradePickMode(true);
    setTradePickCodes([]);
    setCopyFeedback(null);
  }, []);

  const handleCancelTradePick = useCallback(() => {
    setTradePickMode(false);
    setTradePickCodes([]);
  }, []);

  const handleCopyPickedList = useCallback(async () => {
    if (!result || tradePickCodes.length === 0) return;
    const pickSet = new Set(tradePickCodes);
    const rows = result.useful.filter((r) => pickSet.has(r.code));
    if (rows.length === 0) return;
    const text = formatUsefulHumanShareText(rows);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopyFeedback("Lista armada copiada al portapapeles.");
      } catch {
        setParseError("No pudimos copiar la lista. Intentá de nuevo.");
      }
    } else {
      setParseError("Tu navegador no permite copiar al portapapeles desde acá.");
    }
  }, [result, tradePickCodes]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setParseError(null);
    setPartialNotice(null);
    setResult(null);
    setCopyFeedback(null);
    setTradePickMode(false);
    setTradePickCodes([]);
  }, []);

  const handleClear = useCallback(() => {
    setPasteText("");
    setResult(null);
    setParseError(null);
    setPartialNotice(null);
    setCopyFeedback(null);
    setTradePickMode(false);
    setTradePickCodes([]);
    textareaRef.current?.focus();
  }, []);

  const handleCompare = useCallback(() => {
    setParseError(null);
    setPartialNotice(null);
    setResult(null);
    setCopyFeedback(null);
    setTradePickMode(false);
    setTradePickCodes([]);

    const pr = parseRepeatedShareText(pasteText, stickers);
    if (pr.parsed.length === 0) {
      setParseError("No encontramos figuritas repetidas válidas en el texto.");
      return;
    }

    const cmp = compareRepeatedListWithProgress(pr.parsed, stickers, progress?.owned || {});
    setResult({
      ...cmp,
      lineUnknown: pr.unknown,
      lineWarnings: pr.warnings,
    });
    if (pr.unknown.length > 0) {
      setPartialNotice("Algunas líneas no se pudieron interpretar.");
    }
  }, [pasteText, stickers, progress?.owned]);

  const handleCopyUseful = useCallback(async () => {
    if (!result || result.useful.length === 0) return;
    const text = formatUsefulHumanShareText(result.useful);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopyFeedback("Lista útil copiada al portapapeles.");
        return;
      } catch {
        setParseError("No pudimos copiar la lista. Intentá de nuevo o copiá manualmente desde la lista.");
      }
    } else {
      setParseError("Tu navegador no permite copiar al portapapeles desde acá.");
    }
  }, [result]);

  const allUnknown = useMemo(() => {
    if (!result) return [];
    const line = Array.isArray(result.lineUnknown) ? result.lineUnknown : [];
    const cmpU = Array.isArray(result.unknown) ? result.unknown : [];
    return [...line, ...cmpU];
  }, [result]);

  const unknownCount = allUnknown.length;

  const tradePickSet = useMemo(() => new Set(tradePickCodes), [tradePickCodes]);

  const summarySentence =
    result && result.receivedTotal > 0
      ? `De ${result.receivedTotal} figuritas repetidas recibidas, ${result.useful.length} te sirven para completar tu álbum.`
      : null;

  return (
    <>
      <div className={styles.root}>
        <div className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden="true">
            <ScanSearch size={22} strokeWidth={2} />
          </span>
          <h4 className={styles.cardTitle}>Recibir repes</h4>
        </div>
        <div className={styles.bodyRow}>
          <p className={styles.hint}>
            Pegá la lista FIGURITAPP (u otro texto compatible) y comparala con lo que te falta en el
            álbum.
          </p>
          <button
            type="button"
            ref={openButtonRef}
            className={styles.openBtn}
            onClick={handleOpen}
          >
            <ScanSearch size={18} strokeWidth={2} aria-hidden className={styles.openBtnIcon} />
            Recibir repes
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
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className={styles.dialogHeader}>
              <h2 id={titleId} className={styles.dialogTitle}>
                Recibir repes de otra persona
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
                aria-label="Cerrar ventana de repes"
              >
                Cerrar
              </button>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.intro}>
                Pegá la lista de repes que te pasaron. Comparamos contra tu álbum (solo lectura: no
                marcamos nada como conseguido).
              </p>
              <label htmlFor={pasteId} className={styles.pasteLabel}>
                Pegá acá la lista de repes
              </label>
              <textarea
                ref={textareaRef}
                id={pasteId}
                className={styles.pasteArea}
                value={pasteText}
                onChange={(event) => {
                  setPasteText(event.target.value);
                  if (parseError) setParseError(null);
                  if (copyFeedback) setCopyFeedback(null);
                  if (partialNotice) setPartialNotice(null);
                }}
                rows={8}
                autoComplete="off"
                spellCheck={false}
              />

              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} onClick={handleCompare}>
                  Comparar
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

              {partialNotice ? (
                <p className={styles.partial} role="status" aria-live="polite">
                  {partialNotice}
                </p>
              ) : null}

              {result?.lineWarnings?.length ? (
                <ul className={styles.warnings} aria-label="Advertencias de lectura">
                  {result.lineWarnings.map((w, i) => (
                    <li key={`${w.message}-${i}`}>{w.message}</li>
                  ))}
                </ul>
              ) : null}

              {result ? (
                <>
                  {summarySentence ? (
                    <p className={styles.summary}>{summarySentence}</p>
                  ) : null}

                  <dl className={styles.counts}>
                    <div className={styles.countRow}>
                      <dt>Total de repetidas recibidas</dt>
                      <dd>{result.receivedTotal}</dd>
                    </div>
                    <div className={styles.countRow}>
                      <dt>Figuritas que te sirven</dt>
                      <dd>{result.useful.length}</dd>
                    </div>
                    <div className={styles.countRow}>
                      <dt>Figuritas que ya tenés</dt>
                      <dd>{result.alreadyOwned.length}</dd>
                    </div>
                    {unknownCount > 0 ? (
                      <div className={styles.countRow}>
                        <dt>Códigos no reconocidos</dt>
                        <dd>{unknownCount}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <button
                    type="button"
                    className={styles.copyUseful}
                    disabled={result.useful.length === 0}
                    onClick={handleCopyUseful}
                  >
                    <Copy size={18} strokeWidth={2} aria-hidden className={styles.copyUsefulIcon} />
                    Copiar lista útil
                  </button>

                  <div className={styles.tradePickBlock}>
                    <button
                      type="button"
                      className={styles.pickListBtn}
                      disabled={result.useful.length === 0}
                      onClick={handleStartTradePick}
                    >
                      <ListChecks size={20} strokeWidth={2.25} aria-hidden className={styles.pickListIcon} />
                      Armar lista de repes
                    </button>
                    <p className={styles.pickListHint}>
                      Armá la lista de las repes que querés cambiar con tu amigo/a.
                    </p>
                  </div>

                  <section className={styles.group} aria-labelledby={`${titleId}-g-useful`}>
                    <h3 id={`${titleId}-g-useful`} className={styles.groupTitle}>
                      Te sirven
                    </h3>
                    {result.useful.length === 0 ? (
                      <p className={styles.emptyGroup}>
                        No hay coincidencias útiles para tu álbum.
                      </p>
                    ) : (
                      <ul className={styles.resultList}>
                        {result.useful.map((row) => (
                          <CompareResultRow
                            key={row.code}
                            row={row}
                            selectable={tradePickMode}
                            selected={tradePickSet.has(row.code)}
                            onToggle={handleToggleTradePick}
                          />
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className={styles.group} aria-labelledby={`${titleId}-g-owned`}>
                    <h3 id={`${titleId}-g-owned`} className={styles.groupTitle}>
                      Ya las tenés
                    </h3>
                    {result.alreadyOwned.length === 0 ? (
                      <p className={styles.emptyGroupMuted}>
                        No hay figuritas repetidas que ya tengas marcadas como conseguidas.
                      </p>
                    ) : (
                      <ul className={`${styles.resultList} ${styles.resultListMuted}`}>
                        {result.alreadyOwned.map((row) => (
                          <CompareResultRow key={row.code} row={row} />
                        ))}
                      </ul>
                    )}
                  </section>

                  {unknownCount > 0 ? (
                    <section className={styles.group} aria-labelledby={`${titleId}-g-unknown`}>
                      <h3 id={`${titleId}-g-unknown`} className={styles.groupTitle}>
                        No reconocidas
                      </h3>
                      <ul className={styles.resultListPlain}>
                        {allUnknown.map((item, index) => (
                          <li
                            key={`${String(item.value ?? item.code)}-${String(index)}`}
                            className={styles.unknownItem}
                          >
                            <span className={styles.unknownCode}>
                              {item.value ?? item.code ?? "—"}
                            </span>
                            <span className={styles.unknownReason}>{item.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>

            {tradePickMode && result ? (
              <div className={styles.tradePickFooter}>
                <div className={styles.tradePickToolbar}>
                  <span className={styles.tradePickCount} aria-live="polite">
                    Seleccionadas: <strong>{tradePickCodes.length}</strong>
                  </span>
                  <div className={styles.tradePickToolbarActions}>
                    <button
                      type="button"
                      className={styles.copyPickedBtn}
                      disabled={tradePickCodes.length === 0}
                      onClick={handleCopyPickedList}
                    >
                      <Copy size={18} strokeWidth={2} aria-hidden className={styles.copyUsefulIcon} />
                      Copiar lista creada
                    </button>
                    <button type="button" className={styles.cancelTradePick} onClick={handleCancelTradePick}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {copyFeedback ? (
        <div className={styles.copyToast} role="status" aria-live="polite">
          {copyFeedback}
        </div>
      ) : null}
    </>
  );
}
