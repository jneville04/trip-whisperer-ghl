import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

const POPULAR_DESTINATIONS = [
  // Cities
  "Lisbon, Portugal", "Porto, Portugal", "Fátima, Portugal", "Algarve, Portugal",
  "Paris, France", "Nice, France", "Lyon, France", "Marseille, France",
  "Rome, Italy", "Florence, Italy", "Venice, Italy", "Milan, Italy", "Amalfi Coast, Italy",
  "Barcelona, Spain", "Madrid, Spain", "Seville, Spain", "Málaga, Spain",
  "London, England", "Edinburgh, Scotland", "Dublin, Ireland",
  "Amsterdam, Netherlands", "Brussels, Belgium", "Zurich, Switzerland",
  "Berlin, Germany", "Munich, Germany", "Vienna, Austria", "Prague, Czech Republic",
  "Budapest, Hungary", "Athens, Greece", "Santorini, Greece", "Mykonos, Greece",
  "Istanbul, Turkey", "Dubai, UAE", "Abu Dhabi, UAE",
  "Tokyo, Japan", "Kyoto, Japan", "Bangkok, Thailand", "Bali, Indonesia",
  "Cancún, Mexico", "Riviera Maya, Mexico", "Cabo San Lucas, Mexico",
  "New York, NY", "San Francisco, CA", "Los Angeles, CA", "Miami, FL",
  "Las Vegas, NV", "Honolulu, HI", "Maui, HI", "Orlando, FL",
  "Montego Bay, Jamaica", "Nassau, Bahamas", "Punta Cana, Dominican Republic",
  "Aruba", "St. Lucia", "Turks & Caicos",
  "Sydney, Australia", "Auckland, New Zealand",
  "Cape Town, South Africa", "Marrakech, Morocco", "Cairo, Egypt",
  // Airports
  "SFO – San Francisco", "LAX – Los Angeles", "JFK – New York", "ORD – Chicago",
  "MIA – Miami", "ATL – Atlanta", "DFW – Dallas", "SEA – Seattle",
  "BOS – Boston", "DEN – Denver", "LAS – Las Vegas", "HNL – Honolulu",
  "LIS – Lisbon", "OPO – Porto", "FAO – Faro",
  "CDG – Paris", "LHR – London Heathrow", "FCO – Rome", "BCN – Barcelona",
  "AMS – Amsterdam", "FRA – Frankfurt", "ZRH – Zurich", "MUC – Munich",
  "IST – Istanbul", "DXB – Dubai", "NRT – Tokyo Narita", "HND – Tokyo Haneda",
  "CUN – Cancún", "SJD – Cabo San Lucas",
  // Ports
  "Miami, FL (Port)", "Fort Lauderdale, FL (Port)", "Cape Canaveral, FL (Port)",
  "Galveston, TX (Port)", "New Orleans, LA (Port)", "San Juan, Puerto Rico (Port)",
  "Barcelona, Spain (Port)", "Civitavecchia (Rome), Italy (Port)",
  "Venice, Italy (Port)", "Southampton, England (Port)", "Piraeus (Athens), Greece (Port)",
  "Cozumel, Mexico (Port)", "Nassau, Bahamas (Port)", "St. Thomas, USVI (Port)",
  // Cruise Lines
  "Royal Caribbean", "Carnival Cruise Line", "Norwegian Cruise Line",
  "MSC Cruises", "Celebrity Cruises", "Princess Cruises",
  "Holland America Line", "Disney Cruise Line", "Viking Ocean Cruises",
];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  suggestions = POPULAR_DESTINATIONS,
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (val.trim().length >= 2) {
      const lower = val.toLowerCase();
      const matches = suggestions.filter((s) => s.toLowerCase().includes(lower)).slice(0, 8);
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
          if (value.trim().length >= 2) {
            const lower = value.toLowerCase();
            const matches = suggestions.filter((s) => s.toLowerCase().includes(lower)).slice(0, 8);
            setFiltered(matches);
            setOpen(matches.length > 0);
          }
        }}
        placeholder={placeholder}
        className={className || "h-8 text-xs"}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filtered.map((item, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs font-body hover:bg-accent/50 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { POPULAR_DESTINATIONS };
