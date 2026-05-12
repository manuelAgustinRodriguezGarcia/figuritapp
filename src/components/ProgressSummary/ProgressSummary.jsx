"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { formatMissingFiguritasShareText } from "@/utils/progressSharing";
import { formatRepeatedShareText } from "@/utils/repeatedSharing";
import styles from "./ProgressSummary.module.scss";

function AlbumGoldCard({ obtained, total, hydrated }) {
  const ratio = hydrated ? `${obtained}/${total}` : `0/${total}`;
  return (
    <div className={`${styles.stat} ${styles.statAlbumGold}`}>
      <span className={styles.statAlbumTitle}>Mi álbum</span>
      <span className={styles.statAlbumValue}>{ratio}</span>
      <span className={styles.statAlbumSublabel}>Conseguidas / total del álbum</span>
    </div>
  );
}

function StatBlock({ label, value, sublabel, tone, copyLabel, onCopy, disabled }) {
  const toneClass = tone === "missing" ? styles.statMissing : styles.statRepesGradient;

  return (
    <div className={`${styles.stat} ${styles.statWithSideCopy} ${toneClass}`}>
      <div className={styles.statCopyMain}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}</span>
        {sublabel ? <span className={styles.statSublabel}>{sublabel}</span> : null}
      </div>
      <button
        type="button"
        className={styles.statCopyBtnSide}
        onClick={onCopy}
        disabled={disabled}
        aria-label={copyLabel}
        title={copyLabel}
      >
        <Copy size={17} strokeWidth={2} aria-hidden className={styles.statCopyIcon} />
      </button>
    </div>
  );
}

export default function ProgressSummary({ album, stats, progress, hydrated }) {
  const [feedback, setFeedback] = useState(null);

  const stickers = useMemo(() => album?.stickers || [], [album]);
  const teams = useMemo(() => album?.teams || [], [album]);

  const missingShareText = useMemo(
    () => formatMissingFiguritasShareText(progress || {}, stickers, teams),
    [progress, stickers, teams],
  );

  const repeatedShareText = useMemo(
    () => formatRepeatedShareText(progress?.duplicates, stickers),
    [progress?.duplicates, stickers],
  );

  useEffect(() => {
    if (!feedback) return undefined;
    const t = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const copyMissing = useCallback(async () => {
    if (!hydrated) return;
    if (!missingShareText.trim()) {
      setFeedback({ tone: "neutral", message: "No tenés faltantes para compartir." });
      return;
    }
    try {
      await navigator.clipboard.writeText(missingShareText);
      setFeedback({ tone: "ok", message: "Lista de faltantes copiada." });
    } catch {
      setFeedback({ tone: "err", message: "No pudimos copiar. Probá de nuevo." });
    }
  }, [hydrated, missingShareText]);

  const copyRepeated = useCallback(async () => {
    if (!hydrated) return;
    if (!repeatedShareText.trim()) {
      setFeedback({ tone: "neutral", message: "Todavía no tenés repes cargadas para compartir." });
      return;
    }
    try {
      await navigator.clipboard.writeText(repeatedShareText);
      setFeedback({ tone: "ok", message: "Lista de repes copiada." });
    } catch {
      setFeedback({ tone: "err", message: "No pudimos copiar. Probá de nuevo." });
    }
  }, [hydrated, repeatedShareText]);

  const percent = hydrated ? stats.percent : 0;
  const obtained = hydrated ? stats.obtained : 0;
  const missing = hydrated ? stats.missing : stats.total;
  const repeated = hydrated ? stats.repeatedCopies : 0;
  const repeatedUnique = hydrated ? stats.repeatedUnique : 0;

  return (
    <section className={styles.summary} aria-label="Resumen del álbum">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Tu progreso</p>
        <h2 className={styles.title}>
          <span className={styles.percent}>{percent}%</span>
          <span className={styles.titleLabel}>completado</span>
        </h2>
        <p className={styles.subtitle}>
          {obtained} de {stats.total} figuritas conseguidas
        </p>
        <progress
          className={styles.progress}
          value={percent}
          max={100}
          aria-label="Porcentaje completado"
        />
        <span className={styles.progressReadout} aria-hidden="true">
          {percent}% / 100%
        </span>
      </header>

      <div className={styles.stats}>
        <div className={styles.statAlbumWrap}>
          <AlbumGoldCard obtained={obtained} total={stats.total} hydrated={hydrated} />
        </div>
        <StatBlock
          label="Faltantes"
          value={missing}
          sublabel="figuritas"
          tone="missing"
          copyLabel="Copiar lista de faltantes para WhatsApp"
          onCopy={copyMissing}
          disabled={!hydrated}
        />
        <StatBlock
          label="Repetidas"
          value={repeated}
          sublabel={`${repeatedUnique} únicas`}
          tone="repes"
          copyLabel="Copiar lista de repes para WhatsApp"
          onCopy={copyRepeated}
          disabled={!hydrated}
        />
      </div>

      {feedback ? (
        <p
          className={`${styles.copyFeedback} ${feedback.tone === "ok" ? styles.copyFeedbackOk : ""} ${feedback.tone === "err" ? styles.copyFeedbackErr : ""}`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
