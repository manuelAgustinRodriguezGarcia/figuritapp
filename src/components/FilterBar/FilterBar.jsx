"use client";

import { useId, useRef, useState } from "react";
import { FILTER_OWNERSHIP } from "@/data/albumConfig";
import styles from "./FilterBar.module.scss";

const OWNERSHIP_OPTIONS = [
  { id: FILTER_OWNERSHIP.ALL,      label: "Todas",      ariaLabel: "Mostrar todas las figuritas" },
  { id: FILTER_OWNERSHIP.OWNED,    label: "Late",       ariaLabel: "Mostrar las figuritas conseguidas" },
  { id: FILTER_OWNERSHIP.MISSING,  label: "Nola",       ariaLabel: "Mostrar las figuritas faltantes" },
  { id: FILTER_OWNERSHIP.REPEATED, label: "Repetidas",  ariaLabel: "Mostrar las figuritas repetidas",   desktopOnly: true },
  { id: FILTER_OWNERSHIP.SPECIAL,  label: "Especiales", ariaLabel: "Mostrar las figuritas especiales",  desktopOnly: true },
];

const SECTION_OPTIONS = [
  { id: "all", label: "Todas las secciones" },
  { id: "fwc", label: "FWC" },
  { id: "team", label: "Selecciones" },
];

function CustomDropdown({ id, label, value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const fieldRef = useRef(null);
  const selected = options.find((option) => option.id === value) || options[0];
  const labelId = `${id}-label`;
  const buttonId = `${id}-button`;
  const listboxId = `${id}-listbox`;

  function closeOnBlur(event) {
    if (!fieldRef.current?.contains(event.relatedTarget)) {
      setOpen(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      fieldRef.current?.querySelector("button")?.focus();
    }
  }

  return (
    <div
      className={styles.selectField}
      ref={fieldRef}
      onBlur={closeOnBlur}
      onKeyDown={handleKeyDown}
    >
      <span id={labelId} className={styles.selectLabel}>{label}</span>
      <button
        id={buttonId}
        type="button"
        className={`${styles.selectTrigger} ${open ? styles.selectTriggerOpen : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${buttonId}`}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.selectValue}>{selected?.label}</span>
        <span className={styles.selectChevron} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={listboxId}
          className={styles.selectPopover}
          role="listbox"
          aria-labelledby={labelId}
        >
          {options.map((option) => {
            const active = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`${styles.selectOption} ${active ? styles.selectOptionActive : ""}`}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function FilterBar({ filters, onChange, teams }) {
  const searchId = useId();
  const sectionId = useId();
  const teamId = useId();

  const update = (patch) => onChange?.({ ...filters, ...patch });
  const teamOptions = [
    { id: "all", label: "Todas las selecciones" },
    ...(teams || []).map((team) => ({
      id: team.code,
      label: `${team.code} — ${team.name}`,
    })),
  ];

  return (
    <section className={styles.bar} aria-label="Filtros del álbum">
      <div className={styles.searchRow}>
        <label htmlFor={searchId} className={styles.searchLabel}>
          Buscar figurita
        </label>
        <div className={styles.searchPill}>
          <span className={styles.searchIcon} aria-hidden="true">⌕</span>
          <input
            id={searchId}
            className={styles.searchInput}
            type="search"
            inputMode="search"
            placeholder="Buscar por código, país o sección"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
          {filters.query ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => update({ query: "" })}
              aria-label="Borrar búsqueda"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.chipRow} role="group" aria-label="Filtrar por estado">
        {OWNERSHIP_OPTIONS.map((option) => {
          const active = filters.ownership === option.id;
          const desktopOnlyClass = option.desktopOnly ? styles.chipDesktopOnly : "";
          let toneClass = "";
          if (option.id === FILTER_OWNERSHIP.OWNED) {
            toneClass = active ? styles.chipLateActive : styles.chipLate;
          } else if (option.id === FILTER_OWNERSHIP.MISSING) {
            toneClass = active ? styles.chipNolaActive : styles.chipNola;
          }
          const baseActiveClass =
            active && !toneClass ? styles.chipActive : "";
          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.chip} ${baseActiveClass} ${toneClass} ${desktopOnlyClass}`}
              aria-pressed={active}
              aria-label={option.ariaLabel}
              onClick={() => update({ ownership: option.id })}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className={`${styles.selectRow} ${styles.selectRowDesktopOnly}`}>
        <CustomDropdown
          id={sectionId}
          label="Sección"
          value={filters.sectionId}
          options={SECTION_OPTIONS}
          onChange={(sectionIdValue) => update({ sectionId: sectionIdValue })}
        />
        <CustomDropdown
          id={teamId}
          label="Selección"
          value={filters.teamCode}
          options={teamOptions}
          onChange={(teamCode) => update({ teamCode })}
        />
      </div>
    </section>
  );
}
