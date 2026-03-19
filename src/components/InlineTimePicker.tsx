import { useState, useRef, useEffect } from "react";
import { Clock, X } from "lucide-react";

interface InlineTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function parseTime(value: string): { hour: string; minute: string; period: "AM" | "PM" } {
  const m = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hour: "", minute: "", period: "AM" };
  return { hour: m[1], minute: m[2], period: m[3].toUpperCase() as "AM" | "PM" };
}

function formatTime(hour: string, minute: string, period: string): string {
  const h = parseInt(hour);
  const m = parseInt(minute);
  if (isNaN(h) || h < 1 || h > 12) return "";
  if (isNaN(m) || m < 0 || m > 59) return "";
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}

export default function InlineTimePicker({ value, onChange, className }: InlineTimePickerProps) {
  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);
  const minuteRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);

  // Sync from external value changes
  useEffect(() => {
    const p = parseTime(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const commit = (h: string, m: string, p: string) => {
    const formatted = formatTime(h, m, p);
    if (formatted && formatted !== value) {
      onChange(formatted);
    }
  };

  const handleHourChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setHour(digits);
    if (digits.length === 2 || parseInt(digits) > 1) {
      minuteRef.current?.focus();
      minuteRef.current?.select();
    }
  };

  const handleMinuteChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setMinute(digits);
  };

  const handleHourBlur = () => {
    let h = parseInt(hour);
    if (isNaN(h) || h < 1) { setHour(""); return; }
    if (h > 12) h = 12;
    const padded = String(h);
    setHour(padded);
    commit(padded, minute, period);
  };

  const handleMinuteBlur = () => {
    let m = parseInt(minute);
    if (isNaN(m)) { setMinute(""); return; }
    if (m > 59) m = 59;
    const padded = String(m).padStart(2, "0");
    setMinute(padded);
    commit(hour, padded, period);
  };

  const togglePeriod = (p: "AM" | "PM") => {
    setPeriod(p);
    commit(hour, minute, p);
  };

  const handleClear = () => {
    setHour("");
    setMinute("");
    setPeriod("AM");
    onChange("");
  };

  const hasValue = !!(hour && minute);

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <div className="flex items-center h-8 rounded-md border border-input bg-background px-1.5 gap-0.5">
        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
        <input
          ref={hourRef}
          type="text"
          inputMode="numeric"
          value={hour}
          onChange={(e) => handleHourChange(e.target.value)}
          onBlur={handleHourBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === ":" || e.key === "Tab") {
              if (e.key === ":") e.preventDefault();
              minuteRef.current?.focus();
              minuteRef.current?.select();
            }
          }}
          placeholder="hh"
          className="w-6 text-center text-xs bg-transparent outline-none font-body placeholder:text-muted-foreground/50"
          maxLength={2}
        />
        <span className="text-xs text-muted-foreground font-body">:</span>
        <input
          ref={minuteRef}
          type="text"
          inputMode="numeric"
          value={minute}
          onChange={(e) => handleMinuteChange(e.target.value)}
          onBlur={handleMinuteBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Backspace" && !minute) {
              hourRef.current?.focus();
            }
          }}
          placeholder="mm"
          className="w-6 text-center text-xs bg-transparent outline-none font-body placeholder:text-muted-foreground/50"
          maxLength={2}
        />
      </div>
      <div className="flex h-8 rounded-md border border-input overflow-hidden">
        <button
          type="button"
          onClick={() => togglePeriod("AM")}
          className={`px-1.5 text-[10px] font-semibold font-body transition-colors ${
            period === "AM"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-accent/50"
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => togglePeriod("PM")}
          className={`px-1.5 text-[10px] font-semibold font-body transition-colors ${
            period === "PM"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-accent/50"
          }`}
        >
          PM
        </button>
      </div>
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
