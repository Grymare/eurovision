"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type FieldSelectOption = {
  value: string;
  label: string;
};

type FieldSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
};

export function FieldSelect({
  id,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select…",
  ariaLabel = "Select option",
}: FieldSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
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

  function openMenu() {
    if (disabled) {
      return;
    }

    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function selectOption(nextValue: string) {
    onChange(nextValue);
    closeMenu();
    triggerRef.current?.focus();
  }

  function moveActiveIndex(direction: 1 | -1) {
    if (options.length === 0) {
      return;
    }

    const startIndex = activeIndex >= 0 ? activeIndex : direction === 1 ? -1 : 0;
    const nextIndex = (startIndex + direction + options.length) % options.length;
    setActiveIndex(nextIndex);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

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
          selectOption(options[activeIndex].value);
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
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label={ariaLabel}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "field-input country-select__trigger min-h-11 w-full px-3 py-2.5",
            open && "border-gold-light/40",
          )}
        >
          <span className="country-select__value">
            {selectedOption ?
              <span className="truncate">{selectedOption.label}</span>
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
      </div>

      {open ?
        <ul id={listboxId} role="listbox" aria-label={ariaLabel} className="country-select__menu">
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <li key={option.value} role="presentation">
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
                  onClick={() => selectOption(option.value)}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      : null}
    </div>
  );
}
