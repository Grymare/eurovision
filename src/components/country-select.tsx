"use client";

import { CountryFlag } from "@/components/country-flag";
import type { SerializedEntry } from "@/lib/party/types";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type CountrySelectProps = {
  id?: string;
  value: string;
  onChange: (entryId: string) => void;
  entries: SerializedEntry[];
  disabledEntryIds?: Set<string>;
  placeholder?: string;
};

export function CountrySelect({
  id,
  value,
  onChange,
  entries,
  disabledEntryIds,
  placeholder = "Select country",
}: CountrySelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedEntry = entries.find((entry) => entry.id === value) ?? null;

  function isEntryDisabled(entryId: string) {
    return disabledEntryIds?.has(entryId) === true && entryId !== value;
  }

  function nextEnabledIndex(startIndex: number, direction: 1 | -1) {
    if (entries.length === 0) {
      return -1;
    }

    let index = startIndex;
    for (let step = 0; step < entries.length; step += 1) {
      index = (index + direction + entries.length) % entries.length;
      if (!isEntryDisabled(entries[index].id)) {
        return index;
      }
    }

    return -1;
  }

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function openMenu() {
    const selectedIndex = entries.findIndex((entry) => entry.id === value);
    if (selectedIndex >= 0 && !isEntryDisabled(entries[selectedIndex].id)) {
      setActiveIndex(selectedIndex);
      setOpen(true);
      return;
    }

    const firstEnabled = nextEnabledIndex(-1, 1);
    setActiveIndex(firstEnabled);
    setOpen(true);
  }

  function selectEntry(entryId: string) {
    if (isEntryDisabled(entryId)) {
      return;
    }

    onChange(entryId);
    closeMenu();
    triggerRef.current?.focus();
  }

  function clearSelection(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
    closeMenu();
    triggerRef.current?.focus();
  }

  function moveActiveIndex(direction: 1 | -1) {
    const startIndex = activeIndex >= 0 ? activeIndex : direction === 1 ? -1 : 0;
    const nextIndex = nextEnabledIndex(startIndex, direction);
    if (nextIndex >= 0) {
      setActiveIndex(nextIndex);
    }
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (!open) {
          openMenu();
          return;
        }
        moveActiveIndex(event.key === "ArrowDown" ? 1 : -1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) {
          openMenu();
          return;
        }
        if (activeIndex >= 0) {
          selectEntry(entries[activeIndex].id);
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
        <button
          ref={triggerRef}
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "field-input country-select__trigger min-h-11 w-full px-3 py-2.5",
            open && "border-gold-light/40",
          )}
        >
          <span className="country-select__value">
            {selectedEntry ?
              <>
                <CountryFlag
                  name={selectedEntry.name}
                  flagEmoji={selectedEntry.flagEmoji}
                />
                <span className="truncate">{selectedEntry.name}</span>
              </>
            : <span className="truncate text-muted/70">{placeholder}</span>}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "country-select__chevron h-4 w-4 shrink-0 text-foreground transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>

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

      {open ?
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Countries"
          className="country-select__menu"
        >
          {entries.map((entry, index) => {
            const isSelected = entry.id === value;
            const isActive = index === activeIndex;
            const isDisabled = isEntryDisabled(entry.id);

            return (
              <li key={entry.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                  disabled={isDisabled}
                  className={cn(
                    "country-select__option",
                    isSelected && "country-select__option--selected",
                    isActive && "country-select__option--active",
                  )}
                  onMouseEnter={() => {
                    if (!isDisabled) {
                      setActiveIndex(index);
                    }
                  }}
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
    </div>
  );
}
