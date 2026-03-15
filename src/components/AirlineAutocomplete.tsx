import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export interface AirlineEntry {
  code: string;
  name: string;
}

const AIRLINES: AirlineEntry[] = [
  { code: "TP", name: "TAP Air Portugal" },
  { code: "DL", name: "Delta Air Lines" },
  { code: "AA", name: "American Airlines" },
  { code: "UA", name: "United Airlines" },
  { code: "WN", name: "Southwest Airlines" },
  { code: "B6", name: "JetBlue Airways" },
  { code: "AS", name: "Alaska Airlines" },
  { code: "NK", name: "Spirit Airlines" },
  { code: "F9", name: "Frontier Airlines" },
  { code: "HA", name: "Hawaiian Airlines" },
  { code: "SY", name: "Sun Country Airlines" },
  { code: "BA", name: "British Airways" },
  { code: "AF", name: "Air France" },
  { code: "LH", name: "Lufthansa" },
  { code: "KL", name: "KLM Royal Dutch Airlines" },
  { code: "IB", name: "Iberia" },
  { code: "AZ", name: "ITA Airways" },
  { code: "LX", name: "Swiss International Air Lines" },
  { code: "OS", name: "Austrian Airlines" },
  { code: "SK", name: "Scandinavian Airlines" },
  { code: "AY", name: "Finnair" },
  { code: "EI", name: "Aer Lingus" },
  { code: "LO", name: "LOT Polish Airlines" },
  { code: "OK", name: "Czech Airlines" },
  { code: "TK", name: "Turkish Airlines" },
  { code: "A3", name: "Aegean Airlines" },
  { code: "FR", name: "Ryanair" },
  { code: "U2", name: "easyJet" },
  { code: "W6", name: "Wizz Air" },
  { code: "VY", name: "Vueling" },
  { code: "EK", name: "Emirates" },
  { code: "QR", name: "Qatar Airways" },
  { code: "EY", name: "Etihad Airways" },
  { code: "SV", name: "Saudia" },
  { code: "RJ", name: "Royal Jordanian" },
  { code: "ET", name: "Ethiopian Airlines" },
  { code: "SA", name: "South African Airways" },
  { code: "AT", name: "Royal Air Maroc" },
  { code: "MS", name: "EgyptAir" },
  { code: "NH", name: "All Nippon Airways" },
  { code: "JL", name: "Japan Airlines" },
  { code: "OZ", name: "Asiana Airlines" },
  { code: "KE", name: "Korean Air" },
  { code: "SQ", name: "Singapore Airlines" },
  { code: "CX", name: "Cathay Pacific" },
  { code: "TG", name: "Thai Airways" },
  { code: "GA", name: "Garuda Indonesia" },
  { code: "MH", name: "Malaysia Airlines" },
  { code: "CI", name: "China Airlines" },
  { code: "BR", name: "EVA Air" },
  { code: "CA", name: "Air China" },
  { code: "MU", name: "China Eastern Airlines" },
  { code: "CZ", name: "China Southern Airlines" },
  { code: "AI", name: "Air India" },
  { code: "QF", name: "Qantas" },
  { code: "NZ", name: "Air New Zealand" },
  { code: "VA", name: "Virgin Australia" },
  { code: "AC", name: "Air Canada" },
  { code: "WS", name: "WestJet" },
  { code: "AM", name: "Aeroméxico" },
  { code: "CM", name: "Copa Airlines" },
  { code: "AV", name: "Avianca" },
  { code: "LA", name: "LATAM Airlines" },
  { code: "AR", name: "Aerolíneas Argentinas" },
  { code: "VS", name: "Virgin Atlantic" },
  { code: "FI", name: "Icelandair" },
  { code: "DY", name: "Norwegian Air Shuttle" },
  { code: "PC", name: "Pegasus Airlines" },
];

/** Find the airline code for a given airline name */
export function findAirlineCode(name: string): string {
  const airline = AIRLINES.find((a) => a.name.toLowerCase() === name.toLowerCase());
  return airline?.code || "";
}

interface AirlineAutocompleteProps {
  value: string;
  onChange: (value: string, airlineCode?: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AirlineAutocomplete({ value, onChange, placeholder = "Start typing airline...", className }: AirlineAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<AirlineEntry[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (val.trim().length >= 1) {
      const lower = val.toLowerCase();
      const matches = AIRLINES.filter(
        (a) => a.code.toLowerCase().includes(lower) || a.name.toLowerCase().includes(lower)
      ).slice(0, 8);
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= 1) handleChange(value);
        }}
        placeholder={placeholder}
        className={className || "h-8 text-xs"}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filtered.map((airline) => (
            <button
              key={airline.code}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs font-body hover:bg-accent/50 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(airline.name, airline.code);
                setOpen(false);
              }}
            >
              <span className="font-semibold">{airline.code}</span>
              <span className="text-muted-foreground"> — {airline.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
