import { useMemo } from "react";

interface TimePickerDropdownProps {
  value: string; // stored as "3:30 PM" format
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS = ["AM", "PM"] as const;

function parseTime(value: string): { hour: string; minute: string; period: string } {
  const m = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hour: "", minute: "", period: "AM" };
  return { hour: m[1], minute: m[2], period: m[3].toUpperCase() };
}

export default function TimePickerDropdown({ value, onChange, className }: TimePickerDropdownProps) {
  const { hour, minute, period } = useMemo(() => parseTime(value), [value]);

  const buildTime = (h: string, m: string, p: string) => {
    if (!h || !m) return "";
    return `${h}:${m} ${p}`;
  };

  const selectClass = "h-7 text-xs rounded-md border border-input bg-background px-1 font-body appearance-none cursor-pointer";

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <select
        value={hour}
        onChange={(e) => onChange(buildTime(e.target.value, minute || "00", period || "AM"))}
        className={`${selectClass} w-[52px]`}
      >
        <option value="">HH</option>
        {HOURS.map((h) => (
          <option key={h} value={String(h)}>{h}</option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">:</span>
      <select
        value={minute}
        onChange={(e) => onChange(buildTime(hour || "12", e.target.value, period || "AM"))}
        className={`${selectClass} w-[52px]`}
      >
        <option value="">MM</option>
        {MINUTES.map((m) => (
          <option key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => onChange(buildTime(hour || "12", minute || "00", e.target.value))}
        className={`${selectClass} w-[54px]`}
      >
        {PERIODS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}
