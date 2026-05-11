"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpen, GalleryHorizontalEnd, House, Info } from "lucide-react";
import styles from "./MainNav.module.scss";

const TABS = [
  { id: "home", label: "Inicio", Icon: House },
  { id: "album", label: "Mi álbum", Icon: BookOpen },
  { id: "repeated", label: "Repes", Icon: GalleryHorizontalEnd },
];

function TabList({ active, onChange, variant }) {
  const listRef = useRef(null);
  const buttonRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (variant !== "top") return;
    const listEl = listRef.current;
    const idx = TABS.findIndex((t) => t.id === active);
    const btn = buttonRefs.current[idx];
    if (!listEl || !btn || idx < 0) return;

    const listRect = listEl.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - listRect.left,
      width: btnRect.width,
    });
  }, [active, variant]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    if (variant !== "top") return undefined;
    const listEl = listRef.current;
    if (!listEl || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateIndicator);
      return () => window.removeEventListener("resize", updateIndicator);
    }
    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(listEl);
    window.addEventListener("resize", updateIndicator);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [variant, updateIndicator]);

  const tabItems = TABS.map((tab, index) => {
    const isActive = active === tab.id;
    const tabClass = variant === "bottom" ? styles.tabBottom : styles.tab;
    const activeClass = variant === "bottom" ? styles.tabBottomActive : styles.tabActive;
    const iconSize = variant === "bottom" ? 22 : 16;
    return (
      <li key={tab.id} className={styles.tabItem}>
        <button
          ref={(el) => {
            if (variant === "top") buttonRefs.current[index] = el;
          }}
          type="button"
          className={`${tabClass} ${isActive ? activeClass : ""}`}
          onClick={() => onChange?.(tab.id)}
          aria-current={isActive ? "page" : undefined}
        >
          <tab.Icon
            size={iconSize}
            strokeWidth={2}
            aria-hidden="true"
            className={styles.tabIcon}
          />
          <span className={styles.tabLabel}>{tab.label}</span>
        </button>
      </li>
    );
  });

  if (variant === "top") {
    return (
      <div ref={listRef} className={styles.tabListTopShell}>
        <span
          className={styles.tabIndicator}
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
          aria-hidden
        />
        <ul className={`${styles.tabList} ${styles.tabListTop}`}>{tabItems}</ul>
      </div>
    );
  }

  return <ul className={`${styles.tabList} ${styles.tabListBottom}`}>{tabItems}</ul>;
}

function AlbumGesturesSheet({ onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    const focusEl = () => {
      const el = panelRef.current?.querySelector("button");
      el?.focus();
    };
    queueMicrotask(focusEl);

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div className={styles.gesturesScrim} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.gesturesPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="album-gestures-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="album-gestures-title" className={styles.gesturesTitle}>
          Gestos en Mi álbum
        </h2>
        <ul className={styles.gesturesList}>
          <li>
            <strong>Tocá</strong> en una figurita <strong>faltante</strong> para marcarla como conseguida.
          </li>
          <li>
            <strong>Tocá</strong> en una figurita <strong>conseguida</strong>y sumá <strong>1 repetida</strong>.
          </li>
          <li>
            <strong>Tocá dos veces</strong> en una figurita repetida para restar <strong>1 repetida</strong> (Tenés que tener una o más repetidas cargadas).
          </li>
          <li>
            <strong>Mantener pulsado</strong> en una figurita conseguida: aparece al opción para <strong>borrar</strong> la figurita y sus repetidas.
          </li>
        </ul>
        <button type="button" className={styles.gesturesClose} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function MainNav({ active, onChange }) {
  const [gesturesOpen, setGesturesOpen] = useState(false);

  const handleTabChange = useCallback(
    (id) => {
      setGesturesOpen(false);
      onChange?.(id);
    },
    [onChange],
  );

  return (
    <>
      <header className={styles.nav} role="banner">
        <div className={styles.inner}>
          <a
            href="#"
            className={styles.brand}
            aria-label="FIGURITAPP - ir al inicio"
            onClick={(event) => {
              event.preventDefault();
              onChange?.("home");
            }}
          >
            <img
              src="/logo.png"
              alt=""
              className={styles.brandMark}
              aria-hidden="true"
              decoding="async"
            />
            <span className={styles.brandText}>
              FIGURIT<span className={styles.brandAccent}>APP</span>
            </span>
            <span className={styles.brandSub}>Mundial 2026</span>
          </a>

          <div className={styles.topCluster}>
            {active === "album" ? (
              <button
                type="button"
                className={styles.albumGesturesBtn}
                aria-label="Cómo funcionan los gestos en Mi álbum"
                aria-expanded={gesturesOpen}
                onClick={() => setGesturesOpen(true)}
              >
                <Info size={20} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
            <nav className={styles.tabsTop} aria-label="Secciones principales">
              <TabList active={active} onChange={handleTabChange} variant="top" />
            </nav>
          </div>
        </div>
      </header>

      {gesturesOpen ? <AlbumGesturesSheet onClose={() => setGesturesOpen(false)} /> : null}

      <nav className={styles.bottomNav} aria-label="Secciones principales (móvil)">
        <TabList active={active} onChange={handleTabChange} variant="bottom" />
      </nav>
    </>
  );
}
