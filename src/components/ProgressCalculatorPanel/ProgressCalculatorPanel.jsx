"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import { formatProgressFiguritasOnlyShareText, enrichStickerPreviewRow } from "@/utils/progressSharing";
import { getStickerByCode } from "@/utils/stickerCode";
import {
  parseMissingProgressText,
  calculateOwnedFromMissing,
  previewCalculatedProgress,
  applyCalculatedProgress,
  groupCodesForCalculatorPreview,
} from "@/utils/progressCalculator";
import styles from "./ProgressCalculatorPanel.module.scss";

function PreviewMiniRow({ code, albumStickers }) {
  const row = enrichStickerPreviewRow(code, albumStickers, null);
  const sticker = row.sticker || getStickerByCode(code, albumStickers);
  const isTeam = sticker?.category === "team";
  const isFwc = sticker?.category === "fwc" || code === "FWC00";
  return (
    <li className={styles.miniRow}>
      {isTeam && sticker ? (
        <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="sm" decorative />
      ) : isFwc && sticker ? (
        <FwcStickerVisual sticker={sticker} variant="list" isOwned />
      ) : (
        <span className={styles.miniGlyph} aria-hidden>
          ◆
        </span>
      )}
      <span className={styles.miniBody}>
        <span className={styles.miniCode}>{row.displayCode}</span>
        {row.playerName ? <span className={styles.miniName}>{row.playerName}</span> : null}
        <span className={styles.miniMeta}>
          {row.teamName || row.sectionTitle}
          {row.flagEmoji ? ` ${row.flagEmoji}` : ""}
        </span>
      </span>
    </li>
  );
}

function GroupedBlock({ title, codes, albumStickers }) {
  if (!codes?.length) return null;
  return (
    <div className={styles.groupBlock}>
      <h5 className={styles.groupTitle}>{title}</h5>
      <ul className={styles.miniList}>
        {codes.map((code) => (
          <PreviewMiniRow key={code} code={code} albumStickers={albumStickers} />
        ))}
      </ul>
    </div>
  );
}

export default function ProgressCalculatorPanel({
  albumStickers,
  teams,
  currentProgress,
  hydrated,
  onReplaceProgress,
}) {
  const titleId = useId();
  const fieldId = useId();
  const replaceModeId = useId();
  const mergeModeId = useId();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [parseSnapshot, setParseSnapshot] = useState(null);
  const [calculated, setCalculated] = useState(null);
  const [preview, setPreview] = useState(null);
  const [applyMode, setApplyMode] = useState("replace-owned");
  const [replaceConfirming, setReplaceConfirming] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [ownedListOpen, setOwnedListOpen] = useState(true);
  const [missingListOpen, setMissingListOpen] = useState(true);

  const ownedPanelId = useId();
  const missingPanelId = useId();

  const stickers = Array.isArray(albumStickers) ? albumStickers : [];

  const handleClose = useCallback(() => {
    setOpen(false);
    setText("");
    setParseSnapshot(null);
    setCalculated(null);
    setPreview(null);
    setReplaceConfirming(false);
    setErrorBanner(null);
    setCopyFeedback(null);
    setApplyMode("replace-owned");
    setOwnedListOpen(true);
    setMissingListOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!copyFeedback) return undefined;
    const t = window.setTimeout(() => setCopyFeedback(null), 3200);
    return () => window.clearTimeout(t);
  }, [copyFeedback]);

  useEffect(() => {
    if (!successToast) return undefined;
    const t = window.setTimeout(() => setSuccessToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [successToast]);

  const handleClear = useCallback(() => {
    setText("");
    setParseSnapshot(null);
    setCalculated(null);
    setPreview(null);
    setReplaceConfirming(false);
    setErrorBanner(null);
    setOwnedListOpen(true);
    setMissingListOpen(true);
  }, []);

  const handleCalculate = useCallback(() => {
    setErrorBanner(null);
    setCopyFeedback(null);
    setReplaceConfirming(false);
    const parsed = parseMissingProgressText(text, stickers, teams);
    setParseSnapshot(parsed);
    if (!parsed.missing.length) {
      setCalculated(null);
      setPreview(null);
      return;
    }
    const calc = calculateOwnedFromMissing(parsed.missing, stickers);
    const pv = previewCalculatedProgress(calc, currentProgress, stickers, {
      invalid: parsed.invalid,
      warnings: parsed.warnings,
    });
    setCalculated(calc);
    setPreview(pv);
    setOwnedListOpen(true);
    setMissingListOpen(true);
  }, [text, stickers, teams, currentProgress]);

  const handleCopyResult = useCallback(async () => {
    if (!calculated?.ownedCodes?.length) return;
    const body = formatProgressFiguritasOnlyShareText(calculated.ownedCodes, stickers, teams);
    try {
      await navigator.clipboard.writeText(body);
      setCopyFeedback("Texto copiado al portapapeles.");
    } catch {
      setErrorBanner("No pudimos copiar. Intentá de nuevo.");
    }
  }, [calculated, stickers, teams]);

  const handleApply = useCallback(() => {
    if (!calculated || !hydrated || !onReplaceProgress) return;
    if (applyMode === "replace-owned" && !replaceConfirming) {
      setReplaceConfirming(true);
      return;
    }
    const next = applyCalculatedProgress(currentProgress, calculated, applyMode);
    onReplaceProgress(next);
    setReplaceConfirming(false);
    handleClose();
    setSuccessToast("Progreso calculado aplicado correctamente.");
  }, [calculated, hydrated, onReplaceProgress, currentProgress, applyMode, replaceConfirming, handleClose]);

  const cancelReplace = useCallback(() => {
    setReplaceConfirming(false);
  }, []);

  const hasPreview = Boolean(preview && calculated);
  const noValidMissing = Boolean(parseSnapshot && !calculated && parseSnapshot.missing.length === 0);

  const ownedGroups = hasPreview
    ? groupCodesForCalculatorPreview(calculated.ownedCodes, stickers, teams)
    : [];
  const missingGroups = hasPreview
    ? groupCodesForCalculatorPreview(calculated.missingCodes, stickers, teams)
    : [];

  const showInvalidOnly = Boolean(parseSnapshot?.invalid?.length && !hasPreview);

  return (
    <>
      <div className={styles.root}>
        <button type="button" className={styles.openBtn} onClick={() => setOpen(true)}>
          <Calculator size={20} strokeWidth={2} aria-hidden className={styles.openIcon} />
          Calcular progreso
        </button>
      </div>

      {open ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className={styles.dialogHeader}>
              <h2 id={titleId} className={styles.dialogTitle}>
                Calcular progreso
              </h2>
              <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">
                Cerrar
              </button>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.intro}>
                Pegá una lista de figuritas faltantes y vamos a calcular cuáles ya tenés.
              </p>

              <label className={styles.label} htmlFor={fieldId}>
                Lista de faltantes
              </label>
              <textarea
                id={fieldId}
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                autoComplete="off"
                spellCheck={false}
              />

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleCalculate}
                  disabled={!text.trim()}
                >
                  Calcular
                </button>
                <button type="button" className={styles.btnSecondary} onClick={handleClear}>
                  Limpiar
                </button>
              </div>

              {noValidMissing ? (
                <p className={styles.notice} role="status">
                  No encontramos figuritas faltantes válidas en el texto.
                </p>
              ) : null}

              {showInvalidOnly ? (
                <section className={styles.previewSection} aria-labelledby={`${titleId}-inv0`}>
                  <h3 id={`${titleId}-inv0`} className={styles.previewHeading}>
                    No reconocidas
                  </h3>
                  <ul className={styles.plainList}>
                    {parseSnapshot.invalid.map((inv, i) => (
                      <li key={`inv0-${i}`} className={styles.invalidCard}>
                        <span className={styles.invalidVal}>{inv.value ?? inv.sourceLine}</span>
                        <span className={styles.invalidReason}>{inv.reason}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {hasPreview ? (
                <>
                  <section className={styles.previewSection} aria-labelledby={`${titleId}-res`}>
                    <h3 id={`${titleId}-res`} className={styles.previewHeading}>
                      Resultado calculado
                    </h3>
                    <dl className={styles.stats}>
                      <div className={styles.statRow}>
                        <dt>Total del álbum</dt>
                        <dd>{preview.summary.totalAlbum}</dd>
                      </div>
                      <div className={styles.statRow}>
                        <dt>Figuritas faltantes detectadas</dt>
                        <dd>{preview.summary.missingDetectedCount}</dd>
                      </div>
                      <div className={styles.statRow}>
                        <dt>Figuritas que tendrías</dt>
                        <dd>{preview.summary.ownedCalculatedCount}</dd>
                      </div>
                      <div className={styles.statRow}>
                        <dt>Códigos no reconocidos</dt>
                        <dd>{preview.summary.invalidCount}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className={styles.previewSection} aria-labelledby={`${titleId}-own`}>
                    <div className={styles.disclosureHeader}>
                      <h3 id={`${titleId}-own`} className={styles.previewHeading}>
                        Figuritas que tendrías
                      </h3>
                      {ownedGroups.length > 0 ? (
                        <button
                          type="button"
                          className={styles.disclosureToggle}
                          onClick={() => setOwnedListOpen((v) => !v)}
                          aria-expanded={ownedListOpen}
                          aria-controls={ownedPanelId}
                          aria-label={
                            ownedListOpen
                              ? "Ocultar lista de figuritas que tendrías"
                              : "Mostrar lista de figuritas que tendrías"
                          }
                        >
                          {ownedListOpen ? (
                            <ChevronUp size={22} strokeWidth={2} aria-hidden className={styles.disclosureChevron} />
                          ) : (
                            <ChevronDown size={22} strokeWidth={2} aria-hidden className={styles.disclosureChevron} />
                          )}
                        </button>
                      ) : null}
                    </div>
                    {ownedGroups.length === 0 ? (
                      <p className={styles.emptyHint}>No hay figuritas en este cálculo.</p>
                    ) : (
                      <div id={ownedPanelId} hidden={!ownedListOpen} className={styles.disclosurePanel}>
                        {ownedGroups.map((g) => (
                          <GroupedBlock
                            key={g.key}
                            title={g.title}
                            codes={g.lines.map((l) => l.code)}
                            albumStickers={stickers}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className={styles.previewSection} aria-labelledby={`${titleId}-miss`}>
                    <div className={styles.disclosureHeader}>
                      <h3 id={`${titleId}-miss`} className={styles.previewHeading}>
                        Faltantes detectadas
                      </h3>
                      {missingGroups.length > 0 ? (
                        <button
                          type="button"
                          className={styles.disclosureToggle}
                          onClick={() => setMissingListOpen((v) => !v)}
                          aria-expanded={missingListOpen}
                          aria-controls={missingPanelId}
                          aria-label={
                            missingListOpen
                              ? "Ocultar lista de faltantes detectadas"
                              : "Mostrar lista de faltantes detectadas"
                          }
                        >
                          {missingListOpen ? (
                            <ChevronUp size={22} strokeWidth={2} aria-hidden className={styles.disclosureChevron} />
                          ) : (
                            <ChevronDown size={22} strokeWidth={2} aria-hidden className={styles.disclosureChevron} />
                          )}
                        </button>
                      ) : null}
                    </div>
                    {missingGroups.length > 0 ? (
                      <div id={missingPanelId} hidden={!missingListOpen} className={styles.disclosurePanel}>
                        {missingGroups.map((g) => (
                          <GroupedBlock
                            key={`m-${g.key}`}
                            title={g.title}
                            codes={g.lines.map((l) => l.code)}
                            albumStickers={stickers}
                          />
                        ))}
                      </div>
                    ) : null}
                  </section>

                  {preview.invalid?.length ? (
                    <section className={styles.previewSection} aria-labelledby={`${titleId}-inv`}>
                      <h3 id={`${titleId}-inv`} className={styles.previewHeading}>
                        No reconocidas
                      </h3>
                      <ul className={styles.plainList}>
                        {preview.invalid.map((inv, i) => (
                          <li key={`inv-${i}`} className={styles.invalidCard}>
                            <span className={styles.invalidVal}>{inv.value ?? inv.sourceLine}</span>
                            <span className={styles.invalidReason}>{inv.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {preview.warnings?.length ? (
                    <section className={styles.previewSection} aria-labelledby={`${titleId}-warn`}>
                      <h3 id={`${titleId}-warn`} className={styles.previewHeading}>
                        Advertencias
                      </h3>
                      <ul className={styles.plainList}>
                        {preview.warnings.map((w, i) => (
                          <li key={`w-${i}`} className={styles.warnItem}>
                            {w.reason}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleCopyResult}
                      disabled={!calculated?.ownedCodes?.length}
                    >
                      Copiar resultado
                    </button>
                  </div>

                  <fieldset className={styles.modes}>
                    <legend className={styles.previewHeading}>Modo de aplicación</legend>
                    <label className={styles.modeRow} htmlFor={replaceModeId}>
                      <input
                        id={replaceModeId}
                        type="radio"
                        name="calcApplyMode"
                        checked={applyMode === "replace-owned"}
                        onChange={() => {
                          setApplyMode("replace-owned");
                          setReplaceConfirming(false);
                        }}
                      />
                      <span>
                        <span className={styles.modeLabel}>Reemplazar mis figuritas conseguidas</span>
                        <span className={styles.modeHelp}>
                          Se van a reemplazar tus figuritas conseguidas por el cálculo realizado. Tus repetidas se
                          conservan.
                        </span>
                      </span>
                    </label>
                    <label className={styles.modeRow} htmlFor={mergeModeId}>
                      <input
                        id={mergeModeId}
                        type="radio"
                        name="calcApplyMode"
                        checked={applyMode === "merge-owned"}
                        onChange={() => {
                          setApplyMode("merge-owned");
                          setReplaceConfirming(false);
                        }}
                      />
                      <span>
                        <span className={styles.modeLabel}>Combinar con mis figuritas actuales</span>
                        <span className={styles.modeHelp}>
                          Se van a agregar las figuritas calculadas a tu progreso actual sin borrar las que ya tenías.
                        </span>
                      </span>
                    </label>
                  </fieldset>

                  {replaceConfirming ? (
                    <div className={styles.confirm} role="alertdialog" aria-live="assertive">
                      <p className={styles.confirmText}>
                        ¿Seguro que querés reemplazar tus figuritas conseguidas por este cálculo? Tus repetidas se van a
                        conservar.
                      </p>
                      <div className={styles.confirmActions}>
                        <button type="button" className={styles.btnSecondary} onClick={cancelReplace}>
                          Cancelar
                        </button>
                        <button type="button" className={styles.btnDanger} onClick={handleApply}>
                          Sí, reemplazar
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleApply}
                    disabled={
                      !hydrated ||
                      !calculated?.ownedCodes?.length ||
                      (applyMode === "replace-owned" && replaceConfirming)
                    }
                  >
                    Aplicar progreso calculado
                  </button>
                </>
              ) : null}

              {errorBanner ? (
                <p className={styles.feedback} role="alert">
                  {errorBanner}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {copyFeedback ? (
        <div className={styles.toastAnchor} aria-live="polite" role="status">
          <p className={`${styles.toast} ${styles["toast--notice"]}`}>{copyFeedback}</p>
        </div>
      ) : null}

      {successToast ? (
        <div className={styles.toastAnchor} aria-live="polite" role="status">
          <p className={`${styles.toast} ${styles["toast--success"]}`}>{successToast}</p>
        </div>
      ) : null}
    </>
  );
}
