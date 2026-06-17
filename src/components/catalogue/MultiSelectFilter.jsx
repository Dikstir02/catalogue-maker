import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Filter, ChevronDown, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function MultiSelectFilter({ label, allLabel, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const ref = useRef();
  const btnRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        !(e.target.closest && e.target.closest("[data-msf-dropdown]"))
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
    setOpen((o) => !o);
  };

  const toggle = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const defaultAllLabel = allLabel || `All ${label}s`;
  const displayLabel = selected.length === 0
    ? defaultAllLabel
    : selected.length === 1
    ? selected[0]
    : `${selected.length} ${label}s`;

  const dropdown = open ? createPortal(
    <div
      data-msf-dropdown
      style={dropdownStyle}
      className="bg-popover border border-border/50 rounded-md shadow-xl py-1 max-h-60 overflow-y-auto"
    >
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 cursor-pointer text-sm text-foreground">
          <Checkbox
            checked={selected.includes(opt)}
            onCheckedChange={() => toggle(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={ref} className="relative flex-1">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 h-11 px-3 rounded-md border border-border/50 bg-background/50 text-foreground text-sm hover:bg-background/70 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              className="text-xs text-muted-foreground hover:text-foreground px-1"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {dropdown}
    </div>
  );
}