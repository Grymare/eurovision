"use client";

import { CountryFlag } from "@/components/country-flag";
import {
  filterCountryCatalog,
  findCountryCatalogEntry,
  type CountryCatalogEntry,
} from "@/lib/countries/catalog";
import { cn } from "@/lib/utils";
import { useEffect, useId, useRef, useState } from "react";

type CountryAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (entry: CountryCatalogEntry) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function CountryAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = "Search country…",
}: CountryAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = filterCountryCatalog(value);
  const selectedEntry = findCountryCatalogEntry(value);

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function pickEntry(entry: CountryCatalogEntry) {
    onChange(entry.name);
    onSelect?.(entry);
    closeMenu();
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
    onChange(event.target.value);
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
          pickEntry(suggestions[activeIndex]);
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

  return (
    <div ref={containerRef} className="country-select">
      <div className="country-select__control">
        <div
          className={cn(
            "field-input country-select__trigger country-select__trigger--combobox min-h-11 w-full px-3 py-2.5",
            open && "border-gold-light/40",
          )}
        >
          {selectedEntry ?
            <CountryFlag
              name={selectedEntry.name}
              flagEmoji={selectedEntry.flagEmoji}
              isoCode={selectedEntry.isoCode}
            />
          : null}
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-autocomplete="list"
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-foreground outline-none placeholder:text-muted/70"
          />
        </div>
      </div>

      {open && suggestions.length > 0 ?
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Country suggestions"
          className="country-select__menu"
        >
          {suggestions.map((entry, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={entry.isoCode} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={entry.name === value}
                  className={cn(
                    "country-select__option",
                    isActive && "country-select__option--active",
                    entry.name === value && "country-select__option--selected",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pickEntry(entry)}
                >
                  <CountryFlag
                    name={entry.name}
                    flagEmoji={entry.flagEmoji}
                    isoCode={entry.isoCode}
                  />
                  <span className="truncate">{entry.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      : null}
    </div>
  );
}
