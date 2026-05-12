"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FilterBar from "@/components/FilterBar/FilterBar";
import StickerGrid from "@/components/StickerGrid/StickerGrid";
import TeamSection from "@/components/TeamSection/TeamSection";
import EmptyState from "@/components/EmptyState/EmptyState";
import ImportExportPanel from "@/components/ImportExportPanel/ImportExportPanel";
import { applyStickerFilters } from "@/utils/stickerFilters";
import { groupFilteredAlbumStickers } from "@/utils/stickerSorting";
import { computeTeamStats } from "@/utils/albumStats";
import { FILTER_OWNERSHIP, SORT_MODES } from "@/data/albumConfig";
import { ALBUM_TEAM_ORDER } from "@/data/countryMeta";
import styles from "./AlbumSection.module.scss";

const DEFAULT_FILTERS = {
  query: "",
  ownership: FILTER_OWNERSHIP.ALL,
  sectionId: "all",
  teamCode: "all",
  sortMode: SORT_MODES.ALBUM,
};

function StickerSection({
  title,
  eyebrow,
  stickers,
  owned,
  duplicates,
  onToggle,
  onAddDuplicate,
  onDecreaseDuplicate,
  density = "comfortable",
}) {
  if (!stickers?.length) return null;
  return (
    <section className={styles.specialSection}>
      <header className={styles.specialHeader}>
        <p className={styles.specialEyebrow}>{eyebrow}</p>
        <h3 className={styles.specialTitle}>{title}</h3>
      </header>
      <StickerGrid
        stickers={stickers}
        owned={owned}
        duplicates={duplicates}
        onToggle={onToggle}
        onAddDuplicate={onAddDuplicate}
        onDecreaseDuplicate={onDecreaseDuplicate}
        density={density}
      />
    </section>
  );
}

export default function AlbumSection({
  album,
  progress,
  hydrated,
  onToggle,
  onAddDuplicate,
  onDecreaseDuplicate,
  onReplaceProgress,
  onResetProgress,
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const sectionRef = useRef(null);
  const skipQueryScrollRef = useRef(true);

  const { stickers = [], teams = [] } = album || {};

  const filtered = useMemo(
    () => (album ? applyStickerFilters(stickers, filters, progress) : []),
    [album, stickers, filters, progress],
  );

  const grouped = useMemo(
    () =>
      groupFilteredAlbumStickers(
        filtered,
        teams,
        filters.sortMode || SORT_MODES.ALBUM,
        ALBUM_TEAM_ORDER,
      ),
    [filtered, teams, filters.sortMode],
  );

  const filtersActive =
    filters.query.trim() !== "" ||
    filters.ownership !== FILTER_OWNERSHIP.ALL ||
    filters.sectionId !== "all" ||
    filters.teamCode !== "all" ||
    (filters.sortMode || SORT_MODES.ALBUM) !== SORT_MODES.ALBUM;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipQueryScrollRef.current) {
      skipQueryScrollRef.current = false;
      return;
    }
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    if (!narrow) return;
    const el = sectionRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [filters.query]);

  if (!album) {
    return (
      <section className={styles.section} aria-label="Mi álbum">
        <header className={styles.header}>
          <p className={styles.eyebrow}>Mi álbum</p>
          <h2 className={styles.title}>Cargando álbum…</h2>
        </header>
        <EmptyState
          title="Generando las 980 figuritas"
          description="Estamos preparando el álbum completo del Mundial 2026."
          icon="…"
        />
      </section>
    );
  }

  return (
    <section ref={sectionRef} className={styles.section} aria-label="Mi álbum">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Mi álbum</p>
        <h2 className={styles.title}>El álbum completo</h2>
        <p className={styles.subtitle}>
          {filtered.length} de {stickers.length} figuritas visibles · tocá una para alternar entre conseguida y faltante.
        </p>
      </header>

      <FilterBar filters={filters} onChange={setFilters} teams={teams} />

      <ImportExportPanel
        album={album}
        progress={progress}
        hydrated={hydrated}
        onResetProgress={onResetProgress}
        onReplaceProgress={onReplaceProgress}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No encontramos figuritas con esos filtros"
          description="Probá ajustar la búsqueda, cambiar la sección o quitar el filtro de selección."
          icon="?"
          action={
            filtersActive ? (
              <button
                type="button"
                className={styles.resetFilters}
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Limpiar filtros
              </button>
            ) : null
          }
        />
      ) : (
        <div className={styles.groups}>
          <StickerSection
            eyebrow="Sección"
            title="FWC"
            stickers={grouped.fwcStickers}
            owned={progress.owned}
            duplicates={progress.duplicates}
            onToggle={onToggle}
            onAddDuplicate={onAddDuplicate}
            onDecreaseDuplicate={onDecreaseDuplicate}
            density="compact"
          />
          {grouped.teamGroups.map(({ team, stickers: teamStickers }) => (
            <TeamSection
              key={team.code}
              team={team}
              stickers={teamStickers}
              owned={progress.owned}
              duplicates={progress.duplicates}
              stats={computeTeamStats(team, album, progress)}
              onToggle={onToggle}
              onAddDuplicate={onAddDuplicate}
              onDecreaseDuplicate={onDecreaseDuplicate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
