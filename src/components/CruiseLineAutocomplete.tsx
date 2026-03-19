import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

// Cruise line → ship mapping
const CRUISE_DATA: Record<string, string[]> = {
  "Royal Caribbean": [
    "Symphony of the Seas", "Wonder of the Seas", "Icon of the Seas", "Utopia of the Seas",
    "Harmony of the Seas", "Allure of the Seas", "Oasis of the Seas", "Odyssey of the Seas",
    "Anthem of the Seas", "Quantum of the Seas", "Spectrum of the Seas", "Ovation of the Seas",
    "Navigator of the Seas", "Freedom of the Seas", "Liberty of the Seas", "Independence of the Seas",
    "Explorer of the Seas", "Voyager of the Seas", "Mariner of the Seas", "Adventure of the Seas",
    "Radiance of the Seas", "Brilliance of the Seas", "Serenade of the Seas", "Jewel of the Seas",
    "Grandeur of the Seas", "Enchantment of the Seas", "Vision of the Seas", "Rhapsody of the Seas",
  ],
  "Carnival Cruise Line": [
    "Carnival Jubilee", "Carnival Celebration", "Mardi Gras", "Carnival Venezia",
    "Carnival Firenze", "Carnival Panorama", "Carnival Radiance", "Carnival Luminosa",
    "Carnival Dream", "Carnival Magic", "Carnival Breeze", "Carnival Vista",
    "Carnival Horizon", "Carnival Sunrise", "Carnival Sunshine", "Carnival Liberty",
    "Carnival Freedom", "Carnival Glory", "Carnival Valor", "Carnival Legend",
    "Carnival Pride", "Carnival Spirit", "Carnival Miracle", "Carnival Conquest",
    "Carnival Elation", "Carnival Paradise",
  ],
  "Norwegian Cruise Line": [
    "Norwegian Aqua", "Norwegian Viva", "Norwegian Prima", "Norwegian Encore",
    "Norwegian Bliss", "Norwegian Joy", "Norwegian Escape", "Norwegian Getaway",
    "Norwegian Breakaway", "Norwegian Epic", "Norwegian Gem", "Norwegian Jade",
    "Norwegian Jewel", "Norwegian Pearl", "Norwegian Star", "Norwegian Sun",
    "Norwegian Dawn", "Norwegian Spirit", "Norwegian Sky",
  ],
  "MSC Cruises": [
    "MSC World America", "MSC World Europa", "MSC Euribia", "MSC Seascape",
    "MSC Seashore", "MSC Virtuosa", "MSC Bellissima", "MSC Grandiosa",
    "MSC Meraviglia", "MSC Seaside", "MSC Seaview", "MSC Preziosa",
    "MSC Divina", "MSC Fantasia", "MSC Splendida", "MSC Magnifica",
    "MSC Poesia", "MSC Orchestra", "MSC Musica", "MSC Opera", "MSC Lirica", "MSC Armonia",
  ],
  "Celebrity Cruises": [
    "Celebrity Ascent", "Celebrity Beyond", "Celebrity Apex", "Celebrity Edge",
    "Celebrity Equinox", "Celebrity Solstice", "Celebrity Eclipse", "Celebrity Silhouette",
    "Celebrity Reflection", "Celebrity Summit", "Celebrity Infinity", "Celebrity Constellation",
    "Celebrity Millennium", "Celebrity Xcel",
  ],
  "Princess Cruises": [
    "Sun Princess", "Star Princess", "Discovery Princess", "Enchanted Princess",
    "Sky Princess", "Majestic Princess", "Regal Princess", "Royal Princess",
    "Crown Princess", "Emerald Princess", "Ruby Princess", "Coral Princess",
    "Island Princess", "Diamond Princess", "Sapphire Princess", "Caribbean Princess",
    "Grand Princess",
  ],
  "Holland America Line": [
    "Rotterdam", "Koningsdam", "Nieuw Statendam", "Nieuw Amsterdam",
    "Eurodam", "Westerdam", "Oosterdam", "Zuiderdam",
    "Noordam", "Zaandam", "Volendam",
  ],
  "Disney Cruise Line": [
    "Disney Treasure", "Disney Wish", "Disney Fantasy", "Disney Dream",
    "Disney Wonder", "Disney Magic",
  ],
  "Viking Ocean Cruises": [
    "Viking Vela", "Viking Saturn", "Viking Neptune", "Viking Mars",
    "Viking Polaris", "Viking Expedition", "Viking Octantis",
    "Viking Star", "Viking Sea", "Viking Sky", "Viking Sun", "Viking Orion", "Viking Jupiter", "Viking Venus",
  ],
  "Cunard": [
    "Queen Anne", "Queen Mary 2", "Queen Victoria", "Queen Elizabeth",
  ],
  "Silversea": [
    "Silver Nova", "Silver Ray", "Silver Moon", "Silver Dawn",
    "Silver Muse", "Silver Spirit", "Silver Shadow", "Silver Whisper",
    "Silver Wind", "Silver Cloud", "Silver Origin", "Silver Endeavour", "Silver Explorer",
  ],
  "Regent Seven Seas": [
    "Seven Seas Grandeur", "Seven Seas Splendor", "Seven Seas Explorer",
    "Seven Seas Mariner", "Seven Seas Navigator", "Seven Seas Voyager",
  ],
  "Oceania Cruises": [
    "Vista", "Riviera", "Marina", "Nautica", "Regatta", "Insignia", "Sirena",
  ],
  "Windstar Cruises": [
    "Star Breeze", "Star Legend", "Star Pride", "Wind Surf", "Wind Star", "Wind Spirit",
  ],
};

const ALL_CRUISE_LINES = Object.keys(CRUISE_DATA);
const ALL_SHIPS = Object.entries(CRUISE_DATA).flatMap(([line, ships]) =>
  ships.map((s) => ({ ship: s, line }))
);

// Reverse lookup: ship name → cruise line
export function findCruiseLineForShip(shipName: string): string | undefined {
  if (!shipName) return undefined;
  const lower = shipName.toLowerCase();
  const match = ALL_SHIPS.find((s) => s.ship.toLowerCase() === lower);
  return match?.line;
}

interface CruiseLineAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CruiseLineAutocomplete({ value, onChange, placeholder, className }: CruiseLineAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
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
      const matches = ALL_CRUISE_LINES.filter((s) => s.toLowerCase().includes(lower)).slice(0, 8);
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setFiltered(ALL_CRUISE_LINES.slice(0, 8));
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          const lower = (value || "").toLowerCase();
          const matches = lower.length >= 1
            ? ALL_CRUISE_LINES.filter((s) => s.toLowerCase().includes(lower)).slice(0, 8)
            : ALL_CRUISE_LINES.slice(0, 8);
          setFiltered(matches);
          setOpen(matches.length > 0);
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
              onMouseDown={(e) => { e.preventDefault(); onChange(item); setOpen(false); }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ShipNameAutocompleteProps {
  value: string;
  onChange: (value: string, cruiseLine?: string) => void;
  cruiseLine?: string;
  placeholder?: string;
  className?: string;
}

export function ShipNameAutocomplete({ value, onChange, cruiseLine, placeholder, className }: ShipNameAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<{ ship: string; line: string }[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getPool = () => {
    if (cruiseLine && CRUISE_DATA[cruiseLine]) {
      return CRUISE_DATA[cruiseLine].map((s) => ({ ship: s, line: cruiseLine }));
    }
    return ALL_SHIPS;
  };

  const handleChange = (val: string) => {
    onChange(val);
    if (val.trim().length >= 1) {
      const lower = val.toLowerCase();
      const matches = getPool().filter((s) => s.ship.toLowerCase().includes(lower)).slice(0, 8);
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
          const lower = (value || "").toLowerCase();
          const pool = getPool();
          const matches = lower.length >= 1
            ? pool.filter((s) => s.ship.toLowerCase().includes(lower)).slice(0, 8)
            : pool.slice(0, 8);
          setFiltered(matches);
          setOpen(matches.length > 0);
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
                onChange(item.ship, item.line);
                setOpen(false);
              }}
            >
              <span>{item.ship}</span>
              {!cruiseLine && <span className="text-muted-foreground ml-1.5">· {item.line}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
