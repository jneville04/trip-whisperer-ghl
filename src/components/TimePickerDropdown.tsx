import { useState, useMemo, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerDropdownProps {
  value: string; // stored as "3:30 PM" format
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS = ["AM", "PM"] as const;

function parseTime(value: string): { hour: number; minute: number; period: string } {
  const m = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hour: 12, minute: 0, period: "AM" };
  return { hour: parseInt(m[1]), minute: parseInt(m[2]), period: m[3].toUpperCase() };
}

export default function TimePickerDropdown({ value, onChange, className }: TimePickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => parseTime(value), [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildTime = (h: number, m: number, p: string) =>
    `${h}:${String(m).padStart(2, "0")} ${p}`;

  const select = (h: number, m: number, p: string) => {
    onChange(buildTime(h, m, p));
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-7 w-full text-xs rounded-md border border-input bg-background px-2 font-body cursor-pointer hover:bg-accent/30 transition-colors text-left"
      >
        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Select time"}
        </span>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          <div className="flex">
            {/* Hours */}
            <div className="max-h-48 overflow-y-auto border-r border-border">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">Hr</div>
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`block w-full text-left px-3 py-1 text-xs font-body hover:bg-accent/50 transition-colors min-w-[40px] ${
                    parsed.hour === h ? "bg-primary/10 text-primary font-semibold" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(h, parsed.minute, parsed.period);
                  }}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
            {/* Minutes */}
            <div className="max-h-48 overflow-y-auto border-r border-border">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">Min</div>
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`block w-full text-left px-3 py-1 text-xs font-body hover:bg-accent/50 transition-colors min-w-[40px] ${
                    parsed.minute === m ? "bg-primary/10 text-primary font-semibold" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(parsed.hour, m, parsed.period);
                  }}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
            {/* AM/PM */}
            <div className="max-h-48 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">&nbsp;</div>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`block w-full text-left px-3 py-1 text-xs font-body hover:bg-accent/50 transition-colors min-w-[40px] ${
                    parsed.period === p ? "bg-primary/10 text-primary font-semibold" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(parsed.hour, parsed.minute, p);
                    setOpen(false);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
