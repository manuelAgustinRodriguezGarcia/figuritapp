"use client";

import { memo, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, X } from "lucide-react";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import FwcStickerVisual from "@/components/FwcStickerVisual/FwcStickerVisual";
import styles from "./StickerCard.module.scss";

const MOBILE_MQ = "(max-width: 1023px)";
const LONG_PRESS_MS = 520;
const DOUBLE_TAP_MS = 280;

function subscribeMobile(cb) {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function snapshotMobile() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function serverMobile() {
  return false;
}

function getSectionLabel(sticker) {
  switch (sticker.category) {
    case "fwc":
      return "FWC";
    case "team":
      return sticker.teamName || sticker.teamCode || "Selección";
    default:
      return "";
  }
}

function getFwcNumberLabel(sticker) {
  if (sticker.category === "fwc") return sticker.code.replace(/^FWC/, "");
  return "";
}

/** Pastilla bajo el nombre de sección (FWC sigue usando "Especial"). */
function getHeadPillLabel(sticker) {
  if (sticker.category === "team") {
    if (sticker.isSpecial) return "Escudo";
    if (sticker.number === 13) return "Equipo";
    return null;
  }
  if (sticker.isSpecial) return "Especial";
  return null;
}

function getTeamPlayerName(sticker) {
  if (sticker.category !== "team") return null;
  if (sticker.number === 1 || sticker.number === 13) return null;
  const name = sticker.playerName?.trim();
  return name || null;
}

function StickerCardComponent({
  sticker,
  owned,
  duplicateCount = 0,
  onToggle,
  onAddDuplicate,
  onDecreaseDuplicate,
}) {
  const clearTitleId = useId();
  const [clearOverlayOpen, setClearOverlayOpen] = useState(false);
  const isMobileLayout = useSyncExternalStore(subscribeMobile, snapshotMobile, serverMobile);

  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const singleTapTimerRef = useRef(null);
  const dupRef = useRef(duplicateCount);

  useEffect(() => {
    dupRef.current = duplicateCount;
  }, [duplicateCount]);

  const isOwned = !!owned;
  const sectionLabel = getSectionLabel(sticker);
  const fwcNumberLabel = getFwcNumberLabel(sticker);
  const headPillLabel = getHeadPillLabel(sticker);
  const teamPlayerName = getTeamPlayerName(sticker);

  const rootClasses = [
    styles.cardRoot,
    isOwned ? styles.owned : styles.missing,
    sticker.isSpecial ? styles.special : null,
    sticker.fwcArt === "gold" ? styles.fwcGold : null,
    sticker.category === "team" ? `teamColor--${sticker.teamCode}` : null,
    sticker.teamCode === "ARG" ? styles.teamArgentina : null,
  ]
    .filter(Boolean)
    .join(" ");

  const nameHint = teamPlayerName ? ` (${teamPlayerName})` : "";
  const showRepeatControls = isOwned && onAddDuplicate && onDecreaseDuplicate;
  const mobileOwnedGestures = isMobileLayout && isOwned && showRepeatControls;

  const accessibleLabel = mobileOwnedGestures
    ? `Figurita conseguida ${sticker.displayCode}${nameHint}. Tocá para sumar repetida; dos toques seguidos restan una si tenés repetidas. Mantené pulsado para borrar.`
    : isOwned
      ? `Marcar ${sticker.displayCode}${nameHint} como faltante`
      : `Marcar ${sticker.displayCode}${nameHint} como conseguida`;

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimerRef.current != null) {
      window.clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearLongPressTimer();
      clearSingleTapTimer();
    },
    [clearLongPressTimer, clearSingleTapTimer],
  );

  const needsClearConfirmDesktop = isOwned && duplicateCount > 0 && !isMobileLayout;

  useEffect(() => {
    if (!clearOverlayOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setClearOverlayOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearOverlayOpen]);

  const handleCardHitClick = useCallback(() => {
    if (!onToggle) return;
    if (needsClearConfirmDesktop) {
      setClearOverlayOpen(true);
      return;
    }
    onToggle(sticker.code);
  }, [needsClearConfirmDesktop, onToggle, sticker.code]);

  const handleMobileOwnedPointerDown = useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      longPressFiredRef.current = false;
      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = null;
        longPressFiredRef.current = true;
        clearSingleTapTimer();
        setClearOverlayOpen(true);
      }, LONG_PRESS_MS);
    },
    [clearLongPressTimer, clearSingleTapTimer],
  );

  const handleMobileOwnedPointerEnd = useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      clearLongPressTimer();
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        return;
      }
      if (singleTapTimerRef.current != null) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
        const d = dupRef.current;
        if (d > 0) onDecreaseDuplicate?.(sticker.code);
        else onAddDuplicate?.(sticker.code);
        return;
      }
      singleTapTimerRef.current = window.setTimeout(() => {
        singleTapTimerRef.current = null;
        onAddDuplicate?.(sticker.code);
      }, DOUBLE_TAP_MS);
    },
    [clearLongPressTimer, onAddDuplicate, onDecreaseDuplicate, sticker.code],
  );

  const handleMobileOwnedPointerCancel = useCallback(() => {
    clearLongPressTimer();
    clearSingleTapTimer();
    longPressFiredRef.current = false;
  }, [clearLongPressTimer, clearSingleTapTimer]);

  const handleAddDup = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onAddDuplicate?.(sticker.code);
    },
    [onAddDuplicate, sticker.code],
  );

  const handleDecDup = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDecreaseDuplicate?.(sticker.code);
    },
    [onDecreaseDuplicate, sticker.code],
  );

  const handleCancelClear = useCallback((e) => {
    e.stopPropagation();
    setClearOverlayOpen(false);
  }, []);

  const handleConfirmClear = useCallback(
    (e) => {
      e.stopPropagation();
      setClearOverlayOpen(false);
      onToggle?.(sticker.code);
    },
    [onToggle, sticker.code],
  );

  const handleClearBackdrop = useCallback(() => {
    setClearOverlayOpen(false);
  }, []);

  const cardHitClass = [
    styles.cardHit,
    sticker.category === "fwc" ? styles.cardHitFwc : "",
    mobileOwnedGestures ? styles.cardHitMobileOwned : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClasses}>
      <button
        type="button"
        className={cardHitClass}
        onClick={mobileOwnedGestures ? undefined : handleCardHitClick}
        onPointerDown={mobileOwnedGestures ? handleMobileOwnedPointerDown : undefined}
        onPointerUp={mobileOwnedGestures ? handleMobileOwnedPointerEnd : undefined}
        onPointerCancel={mobileOwnedGestures ? handleMobileOwnedPointerCancel : undefined}
        aria-pressed={isOwned}
        aria-label={accessibleLabel}
        title={accessibleLabel}
      >
        <span className={styles.head}>
          {sticker.category === "team" ? (
            <span className={styles.headTeamTitles}>
              <span className={styles.section}>{sectionLabel}</span>
              {headPillLabel ? <span className={styles.specialPill}>{headPillLabel}</span> : null}
            </span>
          ) : (
            <>
              <span className={styles.section}>{sectionLabel}</span>
              {headPillLabel ? <span className={styles.specialPill}>{headPillLabel}</span> : null}
            </>
          )}
        </span>

        {sticker.category === "team" ? (
          <span className={`${styles.body} ${styles.bodyTeam}`}>
            <span className={styles.teamBodyRow}>
              <FlagIcon flagCode={sticker.flagCode} label={sticker.teamName} size="lg" decorative />
              <span className={styles.numberCol}>
                <span className={`${styles.number} ${styles.numberStickerCode}`}>
                  {sticker.displayCode}
                </span>
              </span>
            </span>
            <span className={styles.playerNameSlot}>
              {teamPlayerName ? (
                <span className={styles.playerName}>{teamPlayerName}</span>
              ) : null}
            </span>
          </span>
        ) : sticker.category === "fwc" ? (
          <span className={styles.fwcCluster}>
            <span className={`${styles.body} ${styles.bodyFwc}`}>
              <FwcStickerVisual sticker={sticker} variant="card" isOwned={isOwned} />
              <span className={styles.number}>{fwcNumberLabel}</span>
            </span>
            <span className={`${styles.foot} ${styles.footFwc}`}>
              <span className={styles.code}>{sticker.displayCode}</span>
            </span>
          </span>
        ) : null}
      </button>

      {showRepeatControls ? (
        <div className={styles.repeatRow}>
          <button
            type="button"
            className={styles.repeatBtn}
            aria-label="Quitar una repetida"
            disabled={duplicateCount <= 0}
            onClick={handleDecDup}
          >
            −
          </button>
          <span
            className={`${styles.copyBadge} ${duplicateCount === 0 ? styles.copyBadgeEmpty : ""}`}
            aria-label={
              duplicateCount === 0
                ? "Sin repetidas"
                : duplicateCount === 1
                  ? "1 repetida"
                  : `${duplicateCount} repetidas`
            }
          >
            <Copy size={16} strokeWidth={2.25} className={styles.copyIcon} aria-hidden />
            <span className={styles.copyCount} aria-hidden>
              {duplicateCount}
            </span>
          </span>
          <button type="button" className={styles.repeatBtn} aria-label="Agregar una repetida" onClick={handleAddDup}>
            +
          </button>
        </div>
      ) : null}

      {clearOverlayOpen && isOwned ? (
        <div className={styles.clearOverlay} role="presentation" onClick={handleClearBackdrop}>
          <div
            className={styles.clearPanel}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={clearTitleId}
            onClick={(e) => e.stopPropagation()}
          >
            <p id={clearTitleId} className={styles.clearTitle}>
              Borrar
            </p>
            <div className={styles.clearActions}>
              <button
                type="button"
                className={`${styles.clearBtn} ${styles.clearBtnDismiss}`}
                aria-label="No borrar"
                onClick={handleCancelClear}
              >
                <X size={22} strokeWidth={2.25} aria-hidden />
              </button>
              <button
                type="button"
                className={`${styles.clearBtn} ${styles.clearBtnConfirm}`}
                aria-label="Borrar figurita y repetidas"
                onClick={handleConfirmClear}
              >
                <Check size={22} strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const StickerCard = memo(StickerCardComponent);
StickerCard.displayName = "StickerCard";
export default StickerCard;
