/**
 * Zenite CRM — FilterPillButton
 *
 * Reusable pill-shaped filter trigger button following HTZ design system.
 * Used in filter bars, date pickers, and other filter contexts.
 *
 * Features:
 * - Pill shape (rounded-[500px])
 * - Compact (36px) and regular (44px) height variants
 * - Custom left icon slot
 * - Uppercase 10px bold label
 * - Clear (X) button when value is active, caret when idle
 * - HTZ palette colours
 */

import { CaretDown, X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

export interface FilterPillButtonProps {
  /** Left icon element */
  icon: ReactNode;
  /** Display label (value or placeholder) */
  label: string;
  /** Whether the dropdown is open (controls caret rotation) */
  open?: boolean;
  /** Main click handler (toggle dropdown) */
  onClick: () => void;
  /** If provided together with hasValue, shows a clear (X) button */
  onClear?: () => void;
  /** Whether there is an active selected value */
  hasValue?: boolean;
  /** Compact mode — 36px height instead of 44px */
  compact?: boolean;
  /** Filter-bar mode — 34px height (matches FilterDropdownPill) */
  filterBar?: boolean;
  /** Additional className for the outer button */
  className?: string;
}

export function FilterPillButton({
  icon,
  label,
  open = false,
  onClick,
  onClear,
  hasValue = false,
  compact = false,
  filterBar = false,
  className = "",
}: FilterPillButtonProps) {
  const heightClass = filterBar
    ? "h-[34px] px-[16px] rounded-[500px]"
    : compact
      ? "h-[36px] px-[14px] rounded-[500px]"
      : "h-[44px] px-[18px] rounded-[500px]";

  const colorClass = hasValue
    ? "bg-[#07abde] text-white hover:bg-[#07abde]"
    : "bg-[#f6f7f9] text-[#28415c] hover:bg-[#dcf0ff]";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-[8px] transition-colors cursor-pointer group/trigger ${heightClass} ${colorClass} ${className}`}
    >
      {icon}
      <span
        className={`shrink-0 text-left uppercase whitespace-nowrap ${hasValue ? "text-white" : "text-[#28415c]"}`}
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0, ...fontFeature }}
      >
        {label}
      </span>
      {hasValue && onClear ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className={`flex items-center justify-center size-[18px] rounded-full transition-colors cursor-pointer ${
            hasValue
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-[#dde3ec] text-[#4e6987] hover:bg-[#c8cfdb]"
          }`}
        >
          <X size={10} weight="bold" />
        </button>
      ) : (
        <CaretDown
          size={12}
          weight="bold"
          className={`transition-transform ${open ? "rotate-180" : ""} ${hasValue ? "text-white" : "text-[#28415c]"}`}
        />
      )}
    </button>
  );
}