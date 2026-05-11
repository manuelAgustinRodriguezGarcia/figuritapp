"use client";

import { useEffect, useMemo, useState } from "react";
import MainNav from "@/components/MainNav/MainNav";
import HomeSection from "@/components/HomeSection/HomeSection";
import AlbumSection from "@/components/AlbumSection/AlbumSection";
import RepeatedSection from "@/components/RepeatedSection/RepeatedSection";
import EmptyState from "@/components/EmptyState/EmptyState";
import { useAlbumProgress } from "@/hooks/useAlbumProgress";
import { computeAlbumStats } from "@/utils/albumStats";
import styles from "./AppShell.module.scss";

const SECTION_IDS = new Set(["home", "album", "repeated"]);

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("home");
  const [album, setAlbum] = useState(null);
  const [albumError, setAlbumError] = useState(null);
  const { progress, hydrated, ...progressActions } = useAlbumProgress();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/album", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAlbum(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setAlbumError(error.message || "Error desconocido");
      });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    if (!album) {
      return { total: 980, obtained: 0, missing: 980, specialTotal: 68, specialObtained: 0, repeatedUnique: 0, repeatedCopies: 0, percent: 0 };
    }
    return computeAlbumStats(album, progress);
  }, [album, progress]);

  const handleTabChange = (id) => {
    if (!SECTION_IDS.has(id)) return;
    setActiveTab(id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (albumError) {
    return (
      <div className={styles.shell}>
        <MainNav active={activeTab} onChange={handleTabChange} />
        <main className={styles.main}>
          <div className={styles.container}>
            <EmptyState
              title="No pudimos cargar el álbum"
              description={`Hubo un problema al obtener los datos del álbum. ${albumError}`}
              icon="!"
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <MainNav active={activeTab} onChange={handleTabChange} />
      <main className={styles.main}>
        <div className={styles.container}>
          {activeTab === "home" ? (
            <HomeSection
              album={album}
              stats={stats}
              hydrated={hydrated}
              onNavigate={handleTabChange}
            />
          ) : null}

          {activeTab === "album" ? (
            <AlbumSection
              album={album}
              progress={progress}
              hydrated={hydrated}
              onToggle={progressActions.toggleOwned}
              onAddDuplicate={progressActions.addDuplicate}
              onDecreaseDuplicate={progressActions.decreaseDuplicate}
              onReplaceProgress={progressActions.replaceProgress}
              onResetProgress={progressActions.resetProgress}
            />
          ) : null}

          {activeTab === "repeated" ? (
            <RepeatedSection
              album={album}
              progress={progress}
              hydrated={hydrated}
              onAddDuplicate={progressActions.addDuplicate}
              onDecreaseDuplicate={progressActions.decreaseDuplicate}
              onRemoveDuplicate={progressActions.removeDuplicate}
            />
          ) : null}
        </div>
      </main>
      {activeTab !== "album" ? (
        <footer className={styles.footer}>
          <div className={styles.footerContainer}>
            <p className={styles.footerCopy}>
              <span className={styles.footerBrand}>FIGURITAPP</span>
              <span className={styles.footerSub}>
                Tracker no oficial del álbum Panini FIFA World Cup 2026
              </span>
            </p>
            <p className={styles.footerCredit}>
              <span className={styles.footerCreditLead}>Desarrollado por </span>
              <a
                className={styles.footerCreditLink}
                href="https://www.linkedin.com/in/manuel-agustin-rodriguez-garcia/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Manu Rodriguez
              </a>
              <span className={styles.footerCreditLead}>.</span>
            </p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
