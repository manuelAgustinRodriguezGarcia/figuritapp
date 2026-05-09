"use client";

import { House, BookOpen, GalleryHorizontalEnd } from "lucide-react";
import styles from "./MainNav.module.scss";

const TABS = [
  { id: "home",     label: "Inicio",   Icon: House },
  { id: "album",    label: "Mi álbum", Icon: BookOpen },
  { id: "repeated", label: "Repes",    Icon: GalleryHorizontalEnd },
];

function TabList({ active, onChange, variant }) {
  const variantClass = variant === "bottom" ? styles.tabListBottom : styles.tabListTop;
  return (
    <ul className={`${styles.tabList} ${variantClass}`}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const tabClass = variant === "bottom" ? styles.tabBottom : styles.tab;
        const activeClass = variant === "bottom" ? styles.tabBottomActive : styles.tabActive;
        const iconSize = variant === "bottom" ? 22 : 16;
        return (
          <li key={tab.id} className={styles.tabItem}>
            <button
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
      })}
    </ul>
  );
}

export default function MainNav({ active, onChange }) {
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
            <span className={styles.brandMark} aria-hidden="true">★</span>
            <span className={styles.brandText}>
              FIGURIT<span className={styles.brandAccent}>APP</span>
            </span>
            <span className={styles.brandSub}>Mundial 2026</span>
          </a>

          <nav className={styles.tabsTop} aria-label="Secciones principales">
            <TabList active={active} onChange={onChange} variant="top" />
          </nav>
        </div>
      </header>

      <nav className={styles.bottomNav} aria-label="Secciones principales (móvil)">
        <TabList active={active} onChange={onChange} variant="bottom" />
      </nav>
    </>
  );
}
