"use client";

import { useId, useMemo, useRef, useState } from "react";
import styles from "./ImportExportPanel.module.scss";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function buildValidStickerCodeSet(album) {
  const set = new Set();
  for (const s of album?.stickers || []) set.add(s.code);
  return set;
}

function validateImportedPayload(payload, album) {
  if (!isPlainObject(payload)) {
    return { ok: false, message: "El archivo no tiene un formato válido." };
  }
  if (!isPlainObject(payload.owned)) {
    return { ok: false, message: "El campo \"owned\" debe ser un objeto." };
  }
  if (!isPlainObject(payload.duplicates)) {
    return { ok: false, message: "El campo \"duplicates\" debe ser un objeto." };
  }

  const validCodes = buildValidStickerCodeSet(album);

  const cleanOwned = {};
  let invalidOwned = 0;
  for (const [code, value] of Object.entries(payload.owned)) {
    if (validCodes.has(code) && value === true) cleanOwned[code] = true;
    else if (!validCodes.has(code)) invalidOwned += 1;
  }

  const cleanDuplicates = {};
  let invalidDuplicates = 0;
  for (const [code, value] of Object.entries(payload.duplicates)) {
    const num = Number(value);
    if (validCodes.has(code) && Number.isInteger(num) && num > 0) {
      cleanDuplicates[code] = num;
      cleanOwned[code] = true;
    } else {
      invalidDuplicates += 1;
    }
  }

  return {
    ok: true,
    cleaned: { owned: cleanOwned, duplicates: cleanDuplicates, updatedAt: payload.updatedAt },
    invalidOwned,
    invalidDuplicates,
  };
}

export default function ImportExportPanel({
  album,
  hydrated,
  onResetProgress,
  onReplaceProgress,
  exportSnapshot,
}) {
  const fileInputRef = useRef(null);
  const fileFieldId = useId();
  const [feedback, setFeedback] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const exportFilename = useMemo(() => {
    const date = new Date().toISOString().slice(0, 10);
    return `figuritapp-progreso-${date}.json`;
  }, []);

  function handleExport() {
    if (!hydrated) return;
    try {
      const snapshot = exportSnapshot ? exportSnapshot() : null;
      const payload = JSON.stringify(snapshot ?? {}, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ tone: "success", message: "Progreso exportado correctamente." });
    } catch {
      setFeedback({ tone: "error", message: "No pudimos exportar el progreso." });
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const result = validateImportedPayload(parsed, album);
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.message });
          return;
        }
        onReplaceProgress?.(result.cleaned);
        const ignoredParts = [];
        if (result.invalidOwned > 0) ignoredParts.push(`${result.invalidOwned} códigos en "owned"`);
        if (result.invalidDuplicates > 0) ignoredParts.push(`${result.invalidDuplicates} entradas en "duplicates"`);
        const ignoredMessage = ignoredParts.length > 0 ? ` Se ignoraron ${ignoredParts.join(" y ")}.` : "";
        setFeedback({ tone: "success", message: `Progreso importado correctamente.${ignoredMessage}` });
      } catch {
        setFeedback({ tone: "error", message: "El archivo no es un JSON válido." });
      }
    };
    reader.onerror = () => {
      setFeedback({ tone: "error", message: "No pudimos leer el archivo." });
    };
    reader.readAsText(file);
  }

  function handleReset() {
    setConfirmingReset(true);
    setFeedback(null);
  }

  function confirmReset() {
    onResetProgress?.();
    setConfirmingReset(false);
    setFeedback({ tone: "success", message: "Reiniciamos tu progreso." });
  }

  function cancelReset() {
    setConfirmingReset(false);
  }

  return (
    <section className={styles.panel} aria-label="Importar, exportar y reiniciar progreso">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Tu progreso</p>
        <h3 className={styles.title}>Exportar, importar o reiniciar</h3>
        <p className={styles.subtitle}>
          Llevá tu progreso a otro dispositivo, restaurá una copia o empezá desde cero.
        </p>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={handleExport}
          disabled={!hydrated}
        >
          Exportar progreso
        </button>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={handleImportClick}
          disabled={!album}
        >
          Importar progreso
        </button>
        <button
          type="button"
          className={styles.dangerAction}
          onClick={handleReset}
          disabled={!hydrated}
        >
          Reiniciar progreso
        </button>
        <input
          ref={fileInputRef}
          id={fileFieldId}
          type="file"
          accept="application/json,.json"
          className={styles.hiddenInput}
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {confirmingReset ? (
        <div className={styles.confirm} role="alertdialog" aria-live="assertive">
          <p className={styles.confirmText}>
            ¿Seguro que querés reiniciar tu progreso? Esta acción no se puede deshacer.
          </p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.secondaryAction} onClick={cancelReset}>
              Cancelar
            </button>
            <button type="button" className={styles.dangerAction} onClick={confirmReset}>
              Sí, reiniciar
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`${styles.feedback} ${feedback.tone === "error" ? styles.feedbackError : styles.feedbackSuccess}`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
