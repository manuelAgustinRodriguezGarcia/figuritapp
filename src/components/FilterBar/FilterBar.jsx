"use client";

import { useId, useRef, useState } from "react";
import { FILTER_OWNERSHIP, SORT_MODES } from "@/data/albumConfig";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import styles from "./FilterBar.module.scss";

const OWNERSHIP_OPTIONS = [
  { id: FILTER_OWNERSHIP.ALL,      label: "Todas",      ariaLabel: "Mostrar todas las figuritas" },
  { id: FILTER_OWNERSHIP.OWNED,    label: "Late",       ariaLabel: "Mostrar las figuritas conseguidas" },
  { id: FILTER_OWNERSHIP.MISSING,  label: "Nola",       ariaLabel: "Mostrar las figuritas faltantes" },
  { id: FILTER_OWNERSHIP.REPEATED, label: "Repetidas",  ariaLabel: "Mostrar las figuritas repetidas",   desktopOnly: true },
  { id: FILTER_OWNERSHIP.SPECIAL,  label: "Especiales", ariaLabel: "Mostrar las figuritas especiales",  desktopOnly: true },
];

const MOBILE_OWNERSHIP_OPTIONS = OWNERSHIP_OPTIONS.filter((o) => !o.desktopOnly);

const SORT_OPTIONS = [
  { id: SORT_MODES.ALBUM, label: "Album" },
  { id: SORT_MODES.AZ, label: "A-Z" },
  { id: SORT_MODES.ZA, label: "Z-A" },
];

function CustomDropdown({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  forceShowLabel = false,
  hideLabel = false,
  buttonAriaLabel,
}) {
  const [open, setOpen] = useState(false);
  const fieldRef = useRef(null);
  const selected = options.find((option) => option.id === value) || options[0];
  const labelId = `${id}-label`;
  const buttonId = `${id}-button`;
  const listboxId = `${id}-listbox`;
  const hasTextLabel = Boolean(String(label ?? "").trim());
  const showLabelSpan = !hideLabel && hasTextLabel;
  const labelledBy = showLabelSpan ? `${labelId} ${buttonId}` : undefined;

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
      className={`${styles.selectField} ${forceShowLabel ? styles.selectFieldForceLabel : ""}`}
      ref={fieldRef}
      onBlur={closeOnBlur}
      onKeyDown={handleKeyDown}
    >
      {showLabelSpan ? (
        <span id={labelId} className={styles.selectLabel}>{label}</span>
      ) : null}
      <button
        id={buttonId}
        type="button"
        className={`${styles.selectTrigger} ${open ? styles.selectTriggerOpen : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : buttonAriaLabel}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.selectTriggerMain}>
          {selected?.flagCode ? (
            <FlagIcon
              flagCode={selected.flagCode}
              label={selected.label}
              size="sm"
              decorative
              className={styles.selectTriggerFlag}
            />
          ) : null}
          <span className={styles.selectValue}>{selected?.label}</span>
        </span>
        <span className={styles.selectChevron} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={listboxId}
          className={styles.selectPopover}
          role="listbox"
          aria-labelledby={showLabelSpan ? labelId : undefined}
        >
          {options.map((option) => {
            const active = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                aria-label={option.ariaLabel}
                className={`${styles.selectOption} ${active ? styles.selectOptionActive : ""}`}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                {option.flagCode ? (
                  <FlagIcon
                    flagCode={option.flagCode}
                    label={option.label}
                    size="sm"
                    decorative
                    className={styles.selectOptionFlag}
                  />
                ) : null}
                <span className={styles.selectOptionLabel}>{option.label}</span>
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
  const teamId = useId();
  const mobileOwnershipId = useId();
  const mobileSortId = useId();
  const desktopOwnershipId = useId();
  const desktopSortId = useId();

  const update = (patch) => onChange?.({ ...filters, ...patch });
  const sortMode = filters.sortMode || SORT_MODES.ALBUM;
  const teamOptions = [
    { id: "all", label: "Todas las selecciones" },
    ...(teams || []).map((team) => ({
      id: team.code,
      label: `${team.code} — ${team.name}`,
      flagCode: team.flagCode,
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

      <div className={styles.mobileFilterSortRow}>
        <CustomDropdown
          id={mobileOwnershipId}
          label="Filtro"
          value={filters.ownership}
          options={MOBILE_OWNERSHIP_OPTIONS}
          onChange={(ownership) => update({ ownership })}
          forceShowLabel
        />
        <CustomDropdown
          id={mobileSortId}
          label="Orden"
          value={sortMode}
          options={SORT_OPTIONS}
          onChange={(sortModeValue) => update({ sortMode: sortModeValue })}
          forceShowLabel
        />
      </div>

      <div className={`${styles.selectRow} ${styles.selectRowDesktopOnly}`}>
        <CustomDropdown
          id={desktopOwnershipId}
          label="Estado"
          value={filters.ownership}
          options={OWNERSHIP_OPTIONS}
          onChange={(ownership) => update({ ownership })}
        />
        <CustomDropdown
          id={teamId}
          label="Selección"
          value={filters.teamCode}
          options={teamOptions}
          onChange={(teamCode) => update({ teamCode })}
        />
        <CustomDropdown
          id={desktopSortId}
          label="Orden"
          value={sortMode}
          options={SORT_OPTIONS}
          onChange={(sortModeValue) => update({ sortMode: sortModeValue })}
        />
      </div>
    </section>
  );
}
