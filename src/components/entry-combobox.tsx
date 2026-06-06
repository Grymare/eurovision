"use client";

import { CountryFlag } from "@/components/country-flag";
import type { SerializedEntry } from "@/lib/party/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type EntryComboboxProps = {
  id?: string;
  value: string;
  onChange: (entryId: string) => void;
  entries: SerializedEntry[];
  disabledEntryIds?: Set<string>;
  placeholder?: string;
};

function filterEntries(entries: SerializedEntry[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return entries;
  }

  return entries.filter((entry) =>
    entry.name.toLocaleLowerCase().includes(normalized),
  );
}

export function EntryCombobox({
  id,
  value,
  onChange,
  entries,
  disabledEntryIds,
  placeholder = "Search country…",
}: EntryComboboxProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedEntry = entries.find((entry) => entry.id === value) ?? null;

  function isEntryDisabled(entryId: string) {
    return disabledEntryIds?.has(entryId) === true && entryId !== value;
  }

  const suggestions = filterEntries(entries, query).filter(
    (entry) => !isEntryDisabled(entry.id),
  );

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
  }

  function selectEntry(entryId: string) {
    if (isEntryDisabled(entryId)) {
      return;
    }

    onChange(entryId);
    closeMenu();
    inputRef.current?.blur();
  }

  function clearSelection(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setOpen(true);
    setActiveIndex(0);
  }

  function handleInputFocus() {
    setOpen(true);
    if (activeIndex < 0 && suggestions.length > 0) {
      setActiveIndex(0);
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!open) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "Enter":
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          event.preventDefault();
          selectEntry(suggestions[activeIndex].id);
        }
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      default:
        break;
    }
  }

  const displayValue = open ? query : (selectedEntry?.name ?? "");

  return (
    <div ref={containerRef} className="country-select">
      <div className="country-select__control">
        <div
          className={cn(
            "field-input country-select__trigger country-select__trigger--combobox min-h-11 w-full px-3 py-2.5",
            open && "border-gold-light/40",
          )}
        >
          {selectedEntry && !open ?
            <CountryFlag name={selectedEntry.name} flagEmoji={selectedEntry.flagEmoji} />
          : null}
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-autocomplete="list"
            value={displayValue}
            placeholder={selectedEntry ? selectedEntry.name : placeholder}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-foreground outline-none placeholder:text-muted/70"
          />
        </div>

        {selectedEntry ?
          <button
            type="button"
            className="country-select__clear"
            aria-label={`Clear ${selectedEntry.name}`}
            onClick={clearSelection}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        : null}
      </div>

      {open && suggestions.length > 0 ?
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Countries"
          className="country-select__menu"
        >
          {suggestions.map((entry, index) => {
            const isSelected = entry.id === value;
            const isActive = index === activeIndex;

            return (
              <li key={entry.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "country-select__option",
                    isSelected && "country-select__option--selected",
                    isActive && "country-select__option--active",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectEntry(entry.id)}
                >
                  <CountryFlag name={entry.name} flagEmoji={entry.flagEmoji} />
                  <span className="truncate">{entry.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      : null}

      {open && query.trim() && suggestions.length === 0 ?
        <p className="country-select__empty text-sm text-muted">No matching countries</p>
      : null}
    </div>
  );
}
