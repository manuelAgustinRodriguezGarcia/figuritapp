"use client";

import { useId, useRef, useState } from "react";
import {
  ArrowDown01,
  ArrowDown10,
  ArrowDownAZ,
  ArrowDownZA,
  Funnel,
} from "lucide-react";
import { FILTER_OWNERSHIP, SORT_MODES } from "@/data/albumConfig";
import FlagIcon from "@/components/FlagIcon/FlagIcon";
import styles from "./FilterBar.module.scss";

const OWNERSHIP_OPTIONS = [
  { id: FILTER_OWNERSHIP.ALL, label: "Todas", ariaLabel: "Mostrar todas las figuritas" },
  { id: FILTER_OWNERSHIP.OWNED, label: "Late", ariaLabel: "Mostrar las figuritas conseguidas" },
  { id: FILTER_OWNERSHIP.MISSING, label: "Nola", ariaLabel: "Mostrar las figuritas faltantes" },
  {
    id: FILTER_OWNERSHIP.REPEATED,
    label: "Repetidas",
    ariaLabel: "Mostrar las figuritas repetidas",
    desktopOnly: true,
  },
  {
    id: FILTER_OWNERSHIP.SPECIAL,
    label: "Especiales",
    ariaLabel: "Mostrar las figuritas especiales",
    desktopOnly: true,
  },
];

const MOBILE_OWNERSHIP_OPTIONS = OWNERSHIP_OPTIONS.filter((o) => !o.desktopOnly);

const SORT_OPTIONS = [
  { id: SORT_MODES.ALBUM, label: "Album 0-1", Icon: ArrowDown01 },
  { id: SORT_MODES.ALBUM_DESC, label: "Album 1-0", Icon: ArrowDown10 },
  { id: SORT_MODES.AZ, label: "A-Z", Icon: ArrowDownAZ },
  { id: SORT_MODES.ZA, label: "Z-A", Icon: ArrowDownZA },
];

function ownershipTriggerTone(ownership) {
  if (ownership === FILTER_OWNERSHIP.OWNED) return "owned";
  if (ownership === FILTER_OWNERSHIP.MISSING) return "missing";
  return "neutral";
}

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
  showOptionIcons = false,
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
  const SelectedIcon = selected?.Icon;

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
        <span id={labelId} className={styles.selectLabel}>
          {label}
        </span>
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
          {showOptionIcons && SelectedIcon ? (
            <SelectedIcon size={18} strokeWidth={2} aria-hidden className={styles.selectTriggerOptionIcon} />
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
            const OptionIcon = option.Icon;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                aria-label={option.ariaLabel || option.label}
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
                {showOptionIcons && OptionIcon ? (
                  <OptionIcon size={18} strokeWidth={2} aria-hidden className={styles.selectOptionIcon} />
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

function MobileIconSelect({
  id,
  popoverLabel,
  value,
  options,
  onChange,
  TriggerIcon,
  triggerTone = "neutral",
  triggerAriaLabel,
}) {
  const [open, setOpen] = useState(false);
  const fieldRef = useRef(null);
  const selected = options.find((option) => option.id === value) || options[0];
  const buttonId = `${id}-button`;
  const listboxId = `${id}-listbox`;
  const headingId = `${id}-heading`;
  const ActiveTriggerIcon = selected?.Icon || TriggerIcon;

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

  const triggerToneClass =
    triggerTone === "owned"
      ? styles.mobileIconTriggerOwned
      : triggerTone === "missing"
        ? styles.mobileIconTriggerMissing
        : styles.mobileIconTriggerNeutral;

  return (
    <div
      className={`${styles.selectField} ${styles.mobileIconField}`}
      ref={fieldRef}
      onBlur={closeOnBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        id={buttonId}
        type="button"
        className={`${styles.mobileIconTrigger} ${triggerToneClass} ${open ? styles.mobileIconTriggerOpen : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={triggerAriaLabel}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <ActiveTriggerIcon size={20} strokeWidth={2} aria-hidden className={styles.mobileIconTriggerGlyph} />
      </button>

      {open ? (
        <div id={listboxId} className={styles.selectPopover} role="listbox" aria-labelledby={headingId}>
          <p id={headingId} className={styles.selectPopoverHeading}>
            {popoverLabel}
          </p>
          <div className={styles.selectPopoverOptions}>
            {options.map((option) => {
              const active = option.id === value;
              const OptionIcon = option.Icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-label={option.ariaLabel || option.label}
                  className={`${styles.selectOption} ${active ? styles.selectOptionActive : ""}`}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  {OptionIcon ? (
                    <OptionIcon size={18} strokeWidth={2} aria-hidden className={styles.selectOptionIcon} />
                  ) : null}
                  <span className={styles.selectOptionLabel}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FilterBar({ filters, onChange, teams, variant = "album" }) {
  const isRepes = variant === "repes";
  const searchId = useId();
  const teamId = useId();
  const mobileOwnershipId = useId();
  const mobileSortId = useId();
  const desktopOwnershipId = useId();
  const desktopSortId = useId();

  const update = (patch) => onChange?.({ ...filters, ...patch });
  const sortMode = filters.sortMode || SORT_MODES.ALBUM;
  const ownershipTone = ownershipTriggerTone(filters.ownership);
  const selectedOwnership =
    MOBILE_OWNERSHIP_OPTIONS.find((o) => o.id === filters.ownership) || MOBILE_OWNERSHIP_OPTIONS[0];
  const selectedSort = SORT_OPTIONS.find((o) => o.id === sortMode) || SORT_OPTIONS[0];

  const teamOptions = [
    { id: "all", label: "Todas las selecciones" },
    ...(teams || []).map((team) => ({
      id: team.code,
      label: `${team.code} — ${team.name}`,
      flagCode: team.flagCode,
    })),
  ];

  const barClassName = [styles.bar, isRepes ? styles.barRepes : ""].filter(Boolean).join(" ");

  return (
    <section className={barClassName} aria-label={isRepes ? "Filtros de repetidas" : "Filtros del álbum"}>
      <div className={styles.searchRow}>
        <label htmlFor={searchId} className={styles.searchLabel}>
          Buscar
        </label>
        <div className={styles.searchPill}>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <input
            id={searchId}
            className={styles.searchInput}
            type="search"
            inputMode="search"
            placeholder="Messi, ARG 17, argentina"
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
        {!isRepes ? (
          <MobileIconSelect
            id={mobileOwnershipId}
            popoverLabel="Filtro"
            value={filters.ownership}
            options={MOBILE_OWNERSHIP_OPTIONS}
            onChange={(ownership) => update({ ownership })}
            TriggerIcon={Funnel}
            triggerTone={ownershipTone}
            triggerAriaLabel={`Filtro: ${selectedOwnership.label}`}
          />
        ) : null}
        <MobileIconSelect
          id={mobileSortId}
          popoverLabel="Orden"
          value={sortMode}
          options={SORT_OPTIONS}
          onChange={(sortModeValue) => update({ sortMode: sortModeValue })}
          TriggerIcon={ArrowDown01}
          triggerTone="neutral"
          triggerAriaLabel={`Orden: ${selectedSort.label}`}
        />
      </div>

      {isRepes ? (
        <div className={`${styles.selectRow} ${styles.repesSortRowDesktop}`}>
          <CustomDropdown
            id={desktopSortId}
            label="Orden"
            value={sortMode}
            options={SORT_OPTIONS}
            onChange={(sortModeValue) => update({ sortMode: sortModeValue })}
            showOptionIcons
          />
        </div>
      ) : (
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
            showOptionIcons
          />
        </div>
      )}
    </section>
  );
}
