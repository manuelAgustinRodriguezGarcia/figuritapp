"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import {
  applyProgressImport,
  mergeParsedWithUnknownResolution,
  parseProgressShareText,
  previewProgressImport,
} from "@/utils/progressSharing";
import styles from "./ProgressImportPanel.module.scss";

function PreviewCard({ row, showDup }) {
  const nameLine =
    row.sticker?.category === "team" ? row.playerName || row.sectionTitle : row.sectionTitle;
  const place =
    row.sticker?.category === "team"
      ? row.teamName
      : row.sticker?.code === "FWC00"
        ? "Panini"
        : "FWC";
  return (
    <li className={styles.card}>
      <p className={styles.cardCode}>{row.displayCode}</p>
      {nameLine ? <p className={styles.cardLine}>{nameLine}</p> : null}
      <p className={styles.cardLine}>
        {place}
        {row.flagEmoji ? ` ${row.flagEmoji}` : ""}
        {row.isSpecial ? " · Especial" : ""}
      </p>
      {showDup && row.duplicateCount != null ? (
        <p className={styles.cardMeta}>Cantidad: ×{row.duplicateCount}</p>
      ) : null}
    </li>
  );
}

export default function ProgressImportPanel({
  albumStickers,
  currentProgress,
  hydrated,
  onReplaceProgress,
}) {
  const fieldId = useId();
  const mergeModeId = useId();
  const replaceModeId = useId();
  const unknownOwnedId = useId();
  const unknownRepesId = useId();
  const unknownLegendId = useId();
  const importRegionId = useId();

  const [text, setText] = useState("");
  const [parsedRaw, setParsedRaw] = useState(null);
  const [unknownChoice, setUnknownChoice] = useState(null);
  const [importMode, setImportMode] = useState("merge");
  const [replaceConfirming, setReplaceConfirming] = useState(false);
  const [applyStatus, setApplyStatus] = useState(null);
  const [previewDetailsOpen, setPreviewDetailsOpen] = useState(false);
  const [importFormExpanded, setImportFormExpanded] = useState(false);
  const previewDetailsId = useId();

  const resolvedParsed = useMemo(() => {
    if (!parsedRaw) return null;
    if (parsedRaw.unknownSection?.length) {
      if (!unknownChoice) return null;
      return mergeParsedWithUnknownResolution(parsedRaw, unknownChoice);
    }
    return parsedRaw;
  }, [parsedRaw, unknownChoice]);

  const preview = useMemo(() => {
    if (!resolvedParsed || !albumStickers?.length) return null;
    return previewProgressImport(resolvedParsed, currentProgress, albumStickers);
  }, [resolvedParsed, currentProgress, albumStickers]);

  const previewFiguritaCount = useMemo(() => {
    if (!preview) return 0;
    return (
      preview.ownedToAdd.length +
      preview.duplicatesToAdd.length +
      preview.duplicatesAlreadyPresent.length +
      preview.ownedAlreadyPresent.length +
      preview.unknownRows.length
    );
  }, [preview]);

  const previewOtherCount = useMemo(() => {
    if (!preview) return 0;
    return preview.invalid.length + preview.warnings.length;
  }, [preview]);

  const hasValidStickers =
    resolvedParsed &&
    (resolvedParsed.owned?.length > 0 || resolvedParsed.duplicates?.length > 0);

  const analyze = useCallback(() => {
    setApplyStatus(null);
    setUnknownChoice(null);
    setPreviewDetailsOpen(false);
    const p = parseProgressShareText(text, albumStickers || []);
    setParsedRaw(p);
  }, [text, albumStickers]);

  const clearAll = useCallback(() => {
    setText("");
    setParsedRaw(null);
    setUnknownChoice(null);
    setReplaceConfirming(false);
    setApplyStatus(null);
    setPreviewDetailsOpen(false);
  }, []);

  const applyImport = useCallback(() => {
    if (!resolvedParsed || !hydrated || !onReplaceProgress) return;
    if (importMode === "replace" && !replaceConfirming) {
      setReplaceConfirming(true);
      return;
    }
    const next = applyProgressImport(currentProgress, resolvedParsed, importMode);
    onReplaceProgress(next);
    setReplaceConfirming(false);
    setApplyStatus({ tone: "success", message: "Progreso importado correctamente." });
    setImportFormExpanded(false);
    setParsedRaw(null);
    setUnknownChoice(null);
    setText("");
  }, [
    resolvedParsed,
    hydrated,
    onReplaceProgress,
    currentProgress,
    importMode,
    replaceConfirming,
  ]);

  useEffect(() => {
    if (!importFormExpanded) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setImportFormExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [importFormExpanded]);

  const cancelReplace = useCallback(() => {
    setReplaceConfirming(false);
  }, []);

  const importFormBody = (
    <>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={fieldId}>
          Pegá tu lista acá
        </label>
        <textarea
          id={fieldId}
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!albumStickers?.length}
          autoComplete="off"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={analyze}
          disabled={!albumStickers?.length || !text.trim()}
        >
          Analizar lista
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={clearAll}
          disabled={!text && !parsedRaw}
        >
          Limpiar
        </button>
      </div>

      {parsedRaw?.unknownSection?.length ? (
        <div className={styles.unknownBox} role="group" aria-labelledby={unknownLegendId}>
          <p id={unknownLegendId} className={styles.unknownTitle}>
            Encontramos figuritas, pero no pudimos identificar si son conseguidas o repetidas.
          </p>
          <label className={styles.modeOption} htmlFor={unknownOwnedId}>
            <input
              id={unknownOwnedId}
              type="radio"
              name="unknownSection"
              checked={unknownChoice === "owned"}
              onChange={() => setUnknownChoice("owned")}
            />
            Importarlas como figuritas conseguidas
          </label>
          <label className={styles.modeOption} htmlFor={unknownRepesId}>
            <input
              id={unknownRepesId}
              type="radio"
              name="unknownSection"
              checked={unknownChoice === "repeated"}
              onChange={() => setUnknownChoice("repeated")}
            />
            Importarlas como figuritas repetidas
          </label>
        </div>
      ) : null}

      {parsedRaw && preview && !hasValidStickers ? (
        <p className={styles.hint} role="status" aria-live="polite">
          No encontramos figuritas válidas en el texto.
        </p>
      ) : null}

      {parsedRaw && preview?.invalid?.length ? (
        <p className={styles.hint} role="status">
          Algunas líneas no se pudieron interpretar.
        </p>
      ) : null}

      {parsedRaw && resolvedParsed && preview ? (
        <div className={styles.preview}>
          <button
            type="button"
            className={styles.previewDisclosure}
            onClick={() => setPreviewDetailsOpen((v) => !v)}
            aria-expanded={previewDetailsOpen}
            aria-controls={previewDetailsId}
          >
            <span className={styles.previewDisclosureText}>
              {previewDetailsOpen ? (
                "Ocultar lista del análisis"
              ) : (
                <>
                  <span className={styles.previewDisclosureCount}>{previewFiguritaCount}</span>
                  {previewFiguritaCount === 1 ? " figurita" : " figuritas"}
                  {previewOtherCount > 0 ? (
                    <span className={styles.previewDisclosureExtra}>
                      {` · +${previewOtherCount} ${previewOtherCount === 1 ? "aviso o sin reconocer" : "avisos o sin reconocer"}`}
                    </span>
                  ) : null}
                  <span className={styles.previewDisclosureHint}> · ver lista</span>
                </>
              )}
            </span>
            <ChevronDown
              size={20}
              strokeWidth={2}
              aria-hidden
              className={`${styles.previewDisclosureChevron} ${previewDetailsOpen ? styles.previewDisclosureChevronOpen : ""}`}
            />
          </button>

          <div
            id={previewDetailsId}
            className={styles.previewDetails}
            hidden={!previewDetailsOpen}
          >
            <section className={styles.previewSection}>
              <h5 className={styles.previewTitle}>Figuritas detectadas</h5>
              {preview.ownedToAdd.length === 0 ? (
                <p className={styles.emptyHint}>No hay figuritas nuevas en esta lista.</p>
              ) : (
                <ul className={styles.previewList}>
                  {preview.ownedToAdd.map((row) => (
                    <PreviewCard key={`add-${row.code}`} row={row} showDup={false} />
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.previewSection}>
              <h5 className={styles.previewTitle}>Repetidas detectadas</h5>
              {preview.duplicatesToAdd.length === 0 && preview.duplicatesAlreadyPresent.length === 0 ? (
                <p className={styles.emptyHint}>No hay repetidas en esta lista.</p>
              ) : (
                <ul className={styles.previewList}>
                  {[...preview.duplicatesToAdd, ...preview.duplicatesAlreadyPresent].map((row) => (
                    <PreviewCard key={`dup-${row.code}`} row={row} showDup />
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.previewSection}>
              <h5 className={styles.previewTitle}>Ya estaban en tu álbum</h5>
              {preview.ownedAlreadyPresent.length === 0 ? (
                <p className={styles.emptyHint}>Ninguna de estas figuritas ya estaba marcada.</p>
              ) : (
                <ul className={styles.previewList}>
                  {preview.ownedAlreadyPresent.map((row) => (
                    <PreviewCard key={`had-${row.code}`} row={row} showDup={false} />
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.previewSection}>
              <h5 className={styles.previewTitle}>No reconocidas</h5>
              {preview.invalid.length === 0 && preview.unknownRows.length === 0 ? (
                <p className={styles.emptyHint}>No hay líneas sin reconocer.</p>
              ) : (
                <ul className={styles.previewList}>
                  {preview.invalid.map((inv, i) => (
                    <li key={`inv-${i}`} className={styles.card}>
                      <p className={styles.cardCode}>{inv.value}</p>
                      <p className={styles.cardLine}>{inv.reason}</p>
                    </li>
                  ))}
                  {preview.unknownRows.map((row) => (
                    <li key={`un-${row.code}`} className={styles.card}>
                      <p className={styles.cardCode}>{row.displayCode}</p>
                      <p className={styles.cardLine}>Revisá el contexto de la lista.</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.previewSection}>
              <h5 className={styles.previewTitle}>Advertencias</h5>
              {preview.warnings.length === 0 ? (
                <p className={styles.emptyHint}>Sin advertencias.</p>
              ) : (
                <ul className={styles.previewList}>
                  {preview.warnings.map((w, i) => (
                    <li key={`w-${i}`} className={styles.card}>
                      <p className={styles.cardLine}>{w.reason}</p>
                      {w.sourceLine ? <p className={styles.cardMeta}>{w.sourceLine}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <fieldset className={styles.modes}>
            <legend className={styles.previewTitle}>Modo de importación</legend>
            <label className={styles.modeOption} htmlFor={mergeModeId}>
              <input
                id={mergeModeId}
                type="radio"
                name="importMode"
                checked={importMode === "merge"}
                onChange={() => {
                  setImportMode("merge");
                  setReplaceConfirming(false);
                }}
              />
              Combinar con mi progreso actual
            </label>
            <p className={styles.modeHelp}>
              Se van a agregar las figuritas detectadas sin borrar tu progreso actual.
            </p>
            <label className={styles.modeOption} htmlFor={replaceModeId}>
              <input
                id={replaceModeId}
                type="radio"
                name="importMode"
                checked={importMode === "replace"}
                onChange={() => setImportMode("replace")}
              />
              Reemplazar mi progreso actual
            </label>
            <p className={styles.modeHelp}>
              Se va a reemplazar tu progreso actual por la lista importada. Esta acción no se puede deshacer.
            </p>
          </fieldset>

          {replaceConfirming ? (
            <div className={styles.confirm} role="alertdialog" aria-live="assertive">
              <p className={styles.confirmText}>
                ¿Seguro que querés reemplazar tu progreso actual? Esta acción no se puede deshacer.
              </p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.secondaryBtn} onClick={cancelReplace}>
                  Cancelar
                </button>
                <button type="button" className={styles.dangerBtn} onClick={() => applyImport()}>
                  Sí, reemplazar
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={applyImport}
            disabled={
              !hydrated ||
              !hasValidStickers ||
              (parsedRaw?.unknownSection?.length > 0 && !unknownChoice)
            }
          >
            Aplicar importación
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className={styles.block}>
      <div className={styles.cardHead}>
        <span className={styles.cardIcon} aria-hidden>
          <Download size={22} strokeWidth={2} />
        </span>
        <h4 className={styles.cardTitle}>Importar progreso</h4>
      </div>
      <p className={styles.helper}>
        Pegá acá la lista de tu album y tus repes que te mandaron por WhatsApp para traer tu progreso.
      </p>
      <button
        type="button"
        className={`${importFormExpanded ? styles.secondaryBtn : styles.primaryBtn} ${styles.importToggleBtn}`}
        onClick={() => setImportFormExpanded((v) => !v)}
        aria-expanded={importFormExpanded}
        aria-controls={importRegionId}
      >
        {importFormExpanded ? (
          <>
            <ChevronUp size={20} strokeWidth={2} aria-hidden className={styles.importToggleIcon} />
            Ocultar importación
          </>
        ) : (
          <>
            <Download size={20} strokeWidth={2} aria-hidden className={styles.importToggleIcon} />
            Importar progreso
          </>
        )}
      </button>

      <div id={importRegionId} className={styles.importExpandRegion} hidden={!importFormExpanded}>
        {importFormBody}
      </div>

      {applyStatus?.tone === "success" ? (
        <p className={styles.success} role="status" aria-live="polite">
          {applyStatus.message}
        </p>
      ) : null}
    </div>
  );
}
