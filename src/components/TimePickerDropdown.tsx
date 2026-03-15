import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Clock, X } from "lucide-react";

interface TimePickerDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"] as const;

function parseTime(value: string): { hour: number; minute: number; period: string } {
  const m = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hour: 12, minute: 0, period: "AM" };
  return { hour: parseInt(m[1]), minute: parseInt(m[2]), period: m[3].toUpperCase() };
}

function autoFormatTime(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,4})(a|am|p|pm)?$/);
  if (!m) return null;
  const digits = m[1];
  const periodRaw = m[2] || "";
  const period = periodRaw.startsWith("p") ? "PM" : periodRaw.startsWith("a") ? "AM" : null;
  if (!period) return null;
  let hour: number, minute: number;
  if (digits.length <= 2) { hour = parseInt(digits); minute = 0; }
  else if (digits.length === 3) { hour = parseInt(digits[0]); minute = parseInt(digits.slice(1)); }
  else { hour = parseInt(digits.slice(0, 2)); minute = parseInt(digits.slice(2)); }
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

export default function TimePickerDropdown({ value, onChange, className }: TimePickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => parseTime(value), [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditMode(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        hourRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "center" });
        minuteRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "center" });
      }, 0);
    }
  }, [open]);

  const buildTime = (h: number, m: number, p: string) =>
    `${h}:${String(m).padStart(2, "0")} ${p}`;

  const select = useCallback((h: number, m: number, p: string) => {
    onChange(buildTime(h, m, p));
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      const formatted = autoFormatTime(inputValue);
      if (formatted) onChange(formatted);
    }
    setEditMode(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
    if (e.key === "Escape") setEditMode(false);
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Backspace" || e.key === "Delete") && value) {
      e.preventDefault();
      onChange("");
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      {editMode ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="e.g. 815a"
          className="h-8 w-full text-xs rounded-md border border-primary bg-background px-2 font-body outline-none ring-1 ring-primary/30"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          onDoubleClick={() => { setInputValue(""); setEditMode(true); }}
          onKeyDown={handleButtonKeyDown}
          className="flex items-center gap-1.5 h-8 w-full text-xs rounded-md border border-input bg-background px-2 font-body cursor-pointer hover:bg-accent/30 transition-colors text-left group"
          title="Click to pick, double-click to type (e.g. 815a)"
        >
          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className={`flex-1 truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
            {value || "Select time"}
          </span>
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="shrink-0 rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      )}
      {open && !editMode && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="flex">
            <div ref={hourRef} className="h-44 overflow-y-auto border-r border-border w-10 scrollbar-thin">
              <div className="px-1 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0 z-10 text-center">Hr</div>
              {HOURS.map((h) => (
                <button
                  key={h} type="button" data-selected={parsed.hour === h}
                  className={`block w-full text-center px-1 py-0.5 text-xs transition-colors ${
                    parsed.hour === h ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent/50"
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); select(h, parsed.minute, parsed.period); }}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div ref={minuteRef} className="h-44 overflow-y-auto border-r border-border w-10 scrollbar-thin">
              <div className="px-1 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0 z-10 text-center">Min</div>
              {MINUTES.map((m) => (
                <button
                  key={m} type="button" data-selected={parsed.minute === m}
                  className={`block w-full text-center px-1 py-0.5 text-xs transition-colors ${
                    parsed.minute === m ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent/50"
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); select(parsed.hour, m, parsed.period); }}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="w-10">
              <div className="px-1 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0 z-10 text-center">&nbsp;</div>
              {PERIODS.map((p) => (
                <button
                  key={p} type="button"
                  className={`block w-full text-center px-1 py-1 text-xs transition-colors ${
                    parsed.period === p ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent/50"
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); select(parsed.hour, parsed.minute, p); setOpen(false); }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border px-2 py-0.5 bg-muted/30">
            <p className="text-[9px] text-muted-foreground text-center">Double-click to type · e.g. 637a</p>
          </div>
        </div>
      )}
    </div>
  );
}
