import { useState } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  formatStr?: string;
}

const PARSE_FORMATS = [
  "MMM d, yyyy",
  "MMMM d, yyyy",
  "MMM d",
  "MMMM d",
  "yyyy-MM-dd",
  "MM/dd/yyyy",
];

function tryParseDate(value: string): Date | undefined {
  if (!value) return undefined;
  for (const fmt of PARSE_FORMATS) {
    try {
      const d = parse(value.trim(), fmt, new Date());
      if (!isNaN(d.getTime())) return d;
    } catch {}
  }
  // Try native Date parse as fallback
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  return undefined;
}

export default function DatePickerField({ value, onChange, placeholder = "Pick a date", className }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const parsed = tryParseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-8 text-xs",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {value || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "MMMM d, yyyy"));
            }
            setOpen(false);
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
