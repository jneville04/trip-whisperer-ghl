import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export interface AirportEntry {
  code: string;
  city: string;
  fullName: string;
}

const AIRPORTS: AirportEntry[] = [
  { code: "SFO", city: "San Francisco", fullName: "San Francisco International Airport" },
  { code: "LAX", city: "Los Angeles", fullName: "Los Angeles International Airport" },
  { code: "JFK", city: "New York", fullName: "John F Kennedy International Airport" },
  { code: "EWR", city: "Newark", fullName: "Newark Liberty International Airport" },
  { code: "ORD", city: "Chicago", fullName: "O'Hare International Airport" },
  { code: "MIA", city: "Miami", fullName: "Miami International Airport" },
  { code: "ATL", city: "Atlanta", fullName: "Hartsfield-Jackson Atlanta International Airport" },
  { code: "DFW", city: "Dallas", fullName: "Dallas/Fort Worth International Airport" },
  { code: "SEA", city: "Seattle", fullName: "Seattle-Tacoma International Airport" },
  { code: "BOS", city: "Boston", fullName: "Boston Logan International Airport" },
  { code: "DEN", city: "Denver", fullName: "Denver International Airport" },
  { code: "LAS", city: "Las Vegas", fullName: "Harry Reid International Airport" },
  { code: "HNL", city: "Honolulu", fullName: "Daniel K. Inouye International Airport" },
  { code: "OGG", city: "Maui", fullName: "Kahului Airport" },
  { code: "MCO", city: "Orlando", fullName: "Orlando International Airport" },
  { code: "IAD", city: "Washington DC", fullName: "Dulles International Airport" },
  { code: "DCA", city: "Washington DC", fullName: "Ronald Reagan National Airport" },
  { code: "PHX", city: "Phoenix", fullName: "Phoenix Sky Harbor International Airport" },
  { code: "MSP", city: "Minneapolis", fullName: "Minneapolis-Saint Paul International Airport" },
  { code: "DTW", city: "Detroit", fullName: "Detroit Metropolitan Wayne County Airport" },
  { code: "PHL", city: "Philadelphia", fullName: "Philadelphia International Airport" },
  { code: "CLT", city: "Charlotte", fullName: "Charlotte Douglas International Airport" },
  { code: "IAH", city: "Houston", fullName: "George Bush Intercontinental Airport" },
  { code: "SAN", city: "San Diego", fullName: "San Diego International Airport" },
  { code: "TPA", city: "Tampa", fullName: "Tampa International Airport" },
  { code: "BWI", city: "Baltimore", fullName: "Baltimore/Washington International Airport" },
  { code: "PDX", city: "Portland", fullName: "Portland International Airport" },
  { code: "SLC", city: "Salt Lake City", fullName: "Salt Lake City International Airport" },
  { code: "AUS", city: "Austin", fullName: "Austin-Bergstrom International Airport" },
  { code: "RDU", city: "Raleigh", fullName: "Raleigh-Durham International Airport" },
  { code: "BNA", city: "Nashville", fullName: "Nashville International Airport" },
  { code: "STL", city: "St. Louis", fullName: "St. Louis Lambert International Airport" },
  { code: "SJC", city: "San Jose", fullName: "San Jose International Airport" },
  { code: "OAK", city: "Oakland", fullName: "Oakland International Airport" },
  // Europe
  { code: "LIS", city: "Lisbon", fullName: "Lisbon Humberto Delgado Airport" },
  { code: "OPO", city: "Porto", fullName: "Francisco Sá Carneiro Airport" },
  { code: "FAO", city: "Faro", fullName: "Faro Airport" },
  { code: "CDG", city: "Paris", fullName: "Charles de Gaulle Airport" },
  { code: "ORY", city: "Paris", fullName: "Paris Orly Airport" },
  { code: "LHR", city: "London", fullName: "London Heathrow Airport" },
  { code: "LGW", city: "London", fullName: "London Gatwick Airport" },
  { code: "STN", city: "London", fullName: "London Stansted Airport" },
  { code: "FCO", city: "Rome", fullName: "Leonardo da Vinci–Fiumicino Airport" },
  { code: "MXP", city: "Milan", fullName: "Milan Malpensa Airport" },
  { code: "VCE", city: "Venice", fullName: "Venice Marco Polo Airport" },
  { code: "FLR", city: "Florence", fullName: "Florence Airport" },
  { code: "NAP", city: "Naples", fullName: "Naples International Airport" },
  { code: "BCN", city: "Barcelona", fullName: "Barcelona–El Prat Airport" },
  { code: "MAD", city: "Madrid", fullName: "Adolfo Suárez Madrid–Barajas Airport" },
  { code: "AGP", city: "Málaga", fullName: "Málaga–Costa del Sol Airport" },
  { code: "SVQ", city: "Seville", fullName: "Seville Airport" },
  { code: "AMS", city: "Amsterdam", fullName: "Amsterdam Schiphol Airport" },
  { code: "FRA", city: "Frankfurt", fullName: "Frankfurt Airport" },
  { code: "MUC", city: "Munich", fullName: "Munich Airport" },
  { code: "ZRH", city: "Zurich", fullName: "Zurich Airport" },
  { code: "GVA", city: "Geneva", fullName: "Geneva Airport" },
  { code: "VIE", city: "Vienna", fullName: "Vienna International Airport" },
  { code: "PRG", city: "Prague", fullName: "Václav Havel Airport Prague" },
  { code: "BUD", city: "Budapest", fullName: "Budapest Ferenc Liszt International Airport" },
  { code: "ATH", city: "Athens", fullName: "Athens International Airport" },
  { code: "JTR", city: "Santorini", fullName: "Santorini Airport" },
  { code: "JMK", city: "Mykonos", fullName: "Mykonos Airport" },
  { code: "DUB", city: "Dublin", fullName: "Dublin Airport" },
  { code: "EDI", city: "Edinburgh", fullName: "Edinburgh Airport" },
  { code: "CPH", city: "Copenhagen", fullName: "Copenhagen Airport" },
  { code: "ARN", city: "Stockholm", fullName: "Stockholm Arlanda Airport" },
  { code: "OSL", city: "Oslo", fullName: "Oslo Gardermoen Airport" },
  { code: "HEL", city: "Helsinki", fullName: "Helsinki-Vantaa Airport" },
  { code: "WAW", city: "Warsaw", fullName: "Warsaw Chopin Airport" },
  { code: "IST", city: "Istanbul", fullName: "Istanbul Airport" },
  { code: "BRU", city: "Brussels", fullName: "Brussels Airport" },
  // Middle East & Africa
  { code: "DXB", city: "Dubai", fullName: "Dubai International Airport" },
  { code: "AUH", city: "Abu Dhabi", fullName: "Abu Dhabi International Airport" },
  { code: "DOH", city: "Doha", fullName: "Hamad International Airport" },
  { code: "TLV", city: "Tel Aviv", fullName: "Ben Gurion Airport" },
  { code: "CMN", city: "Casablanca", fullName: "Mohammed V International Airport" },
  { code: "RAK", city: "Marrakech", fullName: "Marrakech Menara Airport" },
  { code: "CAI", city: "Cairo", fullName: "Cairo International Airport" },
  { code: "CPT", city: "Cape Town", fullName: "Cape Town International Airport" },
  { code: "JNB", city: "Johannesburg", fullName: "O.R. Tambo International Airport" },
  // Asia-Pacific
  { code: "NRT", city: "Tokyo", fullName: "Narita International Airport" },
  { code: "HND", city: "Tokyo", fullName: "Tokyo Haneda Airport" },
  { code: "KIX", city: "Osaka", fullName: "Kansai International Airport" },
  { code: "ICN", city: "Seoul", fullName: "Incheon International Airport" },
  { code: "PEK", city: "Beijing", fullName: "Beijing Capital International Airport" },
  { code: "PVG", city: "Shanghai", fullName: "Shanghai Pudong International Airport" },
  { code: "HKG", city: "Hong Kong", fullName: "Hong Kong International Airport" },
  { code: "SIN", city: "Singapore", fullName: "Singapore Changi Airport" },
  { code: "BKK", city: "Bangkok", fullName: "Suvarnabhumi Airport" },
  { code: "DPS", city: "Bali", fullName: "Ngurah Rai International Airport" },
  { code: "SYD", city: "Sydney", fullName: "Sydney Kingsford Smith Airport" },
  { code: "MEL", city: "Melbourne", fullName: "Melbourne Airport" },
  { code: "AKL", city: "Auckland", fullName: "Auckland Airport" },
  { code: "DEL", city: "New Delhi", fullName: "Indira Gandhi International Airport" },
  { code: "BOM", city: "Mumbai", fullName: "Chhatrapati Shivaji Maharaj International Airport" },
  // Latin America & Caribbean
  { code: "CUN", city: "Cancún", fullName: "Cancún International Airport" },
  { code: "SJD", city: "Cabo San Lucas", fullName: "Los Cabos International Airport" },
  { code: "MEX", city: "Mexico City", fullName: "Mexico City International Airport" },
  { code: "GRU", city: "São Paulo", fullName: "São Paulo/Guarulhos International Airport" },
  { code: "GIG", city: "Rio de Janeiro", fullName: "Rio de Janeiro/Galeão International Airport" },
  { code: "BOG", city: "Bogotá", fullName: "El Dorado International Airport" },
  { code: "LIM", city: "Lima", fullName: "Jorge Chávez International Airport" },
  { code: "SCL", city: "Santiago", fullName: "Arturo Merino Benítez International Airport" },
  { code: "EZE", city: "Buenos Aires", fullName: "Ministro Pistarini International Airport" },
  { code: "PTY", city: "Panama City", fullName: "Tocumen International Airport" },
  { code: "SJU", city: "San Juan", fullName: "Luis Muñoz Marín International Airport" },
  { code: "MBJ", city: "Montego Bay", fullName: "Sangster International Airport" },
  { code: "NAS", city: "Nassau", fullName: "Lynden Pindling International Airport" },
  { code: "PUJ", city: "Punta Cana", fullName: "Punta Cana International Airport" },
  { code: "AUA", city: "Aruba", fullName: "Queen Beatrix International Airport" },
  { code: "UVF", city: "St. Lucia", fullName: "Hewanorra International Airport" },
  { code: "PLS", city: "Turks & Caicos", fullName: "Providenciales International Airport" },
  // Canada
  { code: "YYZ", city: "Toronto", fullName: "Toronto Pearson International Airport" },
  { code: "YVR", city: "Vancouver", fullName: "Vancouver International Airport" },
  { code: "YUL", city: "Montréal", fullName: "Montréal-Trudeau International Airport" },
  { code: "YOW", city: "Ottawa", fullName: "Ottawa Macdonald-Cartier International Airport" },
  { code: "YYC", city: "Calgary", fullName: "Calgary International Airport" },
];

/** Parse stored value like "SFO — San Francisco" into code + city */
export function parseAirportValue(value: string): { code: string; city: string } {
  const m = value?.match(/^([A-Z]{3})\s*[—–-]\s*(.+)$/);
  if (m) return { code: m[1], city: m[2].trim() };
  return { code: "", city: value || "" };
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AirportAutocomplete({ value, onChange, placeholder = "SFO — San Francisco", className }: AirportAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<AirportEntry[]>([]);
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
      const matches = AIRPORTS.filter(
        (a) =>
          a.code.toLowerCase().includes(lower) ||
          a.city.toLowerCase().includes(lower) ||
          a.fullName.toLowerCase().includes(lower)
      ).slice(0, 8);
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setOpen(false);
    }
  };

  const selectAirport = (airport: AirportEntry) => {
    onChange(`${airport.code} — ${airport.city}`);
    setOpen(false);
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
          {filtered.map((airport) => (
            <button
              key={airport.code + airport.fullName}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs font-body hover:bg-accent/50 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                selectAirport(airport);
              }}
            >
              <span className="font-semibold">{airport.code}</span>
              <span className="text-muted-foreground"> — {airport.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
