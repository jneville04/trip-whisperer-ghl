import { useState } from "react";
import { Plus, Link2, Users, Plane, Hotel, Ship, Car, MapPin, Utensils, Calendar, Sun, Ticket, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InlineTimePicker from "@/components/InlineTimePicker";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import AirlineAutocomplete from "@/components/AirlineAutocomplete";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import RichTextEditor from "@/components/RichTextEditor";
import type { Activity, ItineraryItemType, ItineraryItemSource, ItineraryItemStatus, ItineraryItemFields, FlightOption, Accommodation, CruiseShip, BusTrip, ProposalData } from "@/types/proposal";

/* ── constants ────────────────────────────────────── */

export const itemTypes: { value: ItineraryItemType; label: string; icon: typeof Plane }[] = [
  { value: "flight", label: "Flight", icon: Plane },
  { value: "hotel", label: "Hotel Stay", icon: Hotel },
  { value: "cruise", label: "Cruise", icon: Ship },
  { value: "transfer", label: "Transfer", icon: Car },
  { value: "activity", label: "Activity", icon: MapPin },
  { value: "excursion", label: "Excursion", icon: Ticket },
  { value: "dining", label: "Dining", icon: Utensils },
  { value: "event", label: "Event", icon: Calendar },
  { value: "free_time", label: "Free Time", icon: Sun },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block font-body">{children}</label>;
}

/* ── Source Selection Step ─────────────────────────── */

interface SourceSelectorProps {
  proposalData: ProposalData;
  onSelect: (source: ItineraryItemSource, linkedItem?: Activity) => void;
  onCancel: () => void;
  /** "proposal" shows Link from Proposal; "group-trip" shows Link from Group Trip */
  builderContext?: "proposal" | "group-trip";
  /** Section visibility from the parent builder – only visible+populated sections are linkable */
  sectionVisibility?: Record<string, boolean>;
}

export function SourceSelector({ proposalData, onSelect, onCancel, builderContext, sectionVisibility }: SourceSelectorProps) {
  const [step, setStep] = useState<"pick" | "proposal" | "group-trip">("pick");
  const vis = sectionVisibility || {};

  // Only show linkable proposal items from sections that are visible AND have data
  const hasFlights = vis.flights !== false && (proposalData.flightOptions?.length ?? 0) > 0;
  const hasAccommodations = vis.accommodations !== false && (proposalData.accommodations?.length ?? 0) > 0;
  const hasCruises = vis.cruiseShips !== false && (proposalData.cruiseShips?.length ?? 0) > 0;
  const hasProposalItems = hasFlights || hasAccommodations || hasCruises;

  const hasBusTrips = vis.busTrips !== false && (proposalData.busTrips?.length ?? 0) > 0;

  const showProposalOption = builderContext !== "group-trip";
  const showGroupTripOption = builderContext !== "proposal";

  if (step === "proposal") {
    return (
      <div className="border border-border/40 rounded-lg p-3 space-y-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider font-body">Link from Proposal</p>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep("pick")}>Back</Button>
        </div>
        {/* Flight options */}
        {(proposalData.flightOptions || []).map((fo) => {
          const firstLeg = fo.legs?.[0];
          const label = firstLeg ? `✈️ ${firstLeg.departureAirport || "?"} → ${firstLeg.arrivalAirport || "?"}` : "✈️ Flight";
          return (
            <button key={fo.id} className="w-full text-left px-3 py-2 rounded-md border border-border/30 hover:bg-accent/10 text-sm font-body transition-colors" onClick={() => {
              const item: Activity = {
                id: crypto.randomUUID(),
                type: "flight",
                source: "proposal",
                linkedId: fo.id,
                status: "included",
                time: firstLeg?.departureTime || "",
                title: label,
                description: "",
                fields: {
                  departureAirport: firstLeg?.departureAirport || "",
                  arrivalAirport: firstLeg?.arrivalAirport || "",
                  departureTime: firstLeg?.departureTime || "",
                  arrivalTime: firstLeg?.arrivalTime || "",
                  airline: firstLeg?.airline || "",
                  flightNumber: firstLeg?.flightNumber || "",
                },
                price: fo.price || "",
              };
              onSelect("proposal", item);
            }}>
              {label}
            </button>
          );
        })}
        {/* Accommodations */}
        {(proposalData.accommodations || []).map((acc) => (
          <button key={acc.id} className="w-full text-left px-3 py-2 rounded-md border border-border/30 hover:bg-accent/10 text-sm font-body transition-colors" onClick={() => {
            const item: Activity = {
              id: crypto.randomUUID(),
              type: "hotel",
              source: "proposal",
              linkedId: acc.id,
              status: "included",
              time: "",
              title: acc.hotelName || "Hotel Stay",
              description: "",
              fields: {
                hotelName: acc.hotelName || "",
                location: acc.location || "",
                numberOfNights: acc.nights || "",
                roomType: acc.roomType || "",
              },
              price: acc.price || "",
            };
            onSelect("proposal", item);
          }}>
            🏨 {acc.hotelName || "Hotel"}
          </button>
        ))}
        {/* Cruises */}
        {(proposalData.cruiseShips || []).map((cr) => (
          <button key={cr.id} className="w-full text-left px-3 py-2 rounded-md border border-border/30 hover:bg-accent/10 text-sm font-body transition-colors" onClick={() => {
            const item: Activity = {
              id: crypto.randomUUID(),
              type: "cruise",
              source: "proposal",
              linkedId: cr.id,
              status: "included",
              time: "",
              title: cr.shipName || "Cruise",
              description: "",
              fields: {
                cruiseName: cr.shipName || "",
                embarkationPort: cr.embarkationPort || "",
                duration: cr.nights || "",
              },
              price: cr.price || "",
            };
            onSelect("proposal", item);
          }}>
            🚢 {cr.shipName || "Cruise"}
          </button>
        ))}
        {!hasProposalItems && <p className="text-xs text-muted-foreground font-body py-2">No proposal items available to link.</p>}
      </div>
    );
  }

  if (step === "group-trip") {
    return (
      <div className="border border-border/40 rounded-lg p-3 space-y-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider font-body">Link from Group Trip</p>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep("pick")}>Back</Button>
        </div>
        {(proposalData.busTrips || []).map((bt) => (
          <button key={bt.id} className="w-full text-left px-3 py-2 rounded-md border border-border/30 hover:bg-accent/10 text-sm font-body transition-colors" onClick={() => {
            const item: Activity = {
              id: crypto.randomUUID(),
              type: "transfer",
              source: "group-trip",
              linkedId: bt.id,
              status: "included",
              time: bt.pickupTime || "",
              title: bt.routeName || `${bt.pickupLocation || "?"} → ${bt.dropoffLocation || "?"}`,
              description: "",
              fields: {
                pickupLocation: bt.pickupLocation || "",
                dropoffLocation: bt.dropoffLocation || "",
              },
              price: bt.price || "",
            };
            onSelect("group-trip", item);
          }}>
            🚌 {bt.routeName || `${bt.pickupLocation || "?"} → ${bt.dropoffLocation || "?"}`}
          </button>
        ))}
        {!hasBusTrips && <p className="text-xs text-muted-foreground font-body py-2">No group trip items available to link.</p>}
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-lg p-3 space-y-1.5 bg-muted/20">
      <p className="text-xs font-semibold text-primary uppercase tracking-wider font-body mb-2">Add Item Source</p>
      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border/30 hover:bg-accent/10 text-sm font-body transition-colors" onClick={() => onSelect("itinerary")}>
        <Plus className="h-3.5 w-3.5 text-primary" /> Add to Itinerary
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border/30 hover:bg-accent/10 text-sm font-body transition-colors" onClick={() => setStep("proposal")} disabled={!hasProposalItems}>
        <Link2 className="h-3.5 w-3.5 text-primary" /> Link from Proposal
        {!hasProposalItems && <span className="text-[10px] text-muted-foreground ml-auto">No items</span>}
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border/30 hover:bg-accent/10 text-sm font-body transition-colors" onClick={() => setStep("group-trip")} disabled={!hasBusTrips}>
        <Users className="h-3.5 w-3.5 text-primary" /> Link from Group Trip
        {!hasBusTrips && <span className="text-[10px] text-muted-foreground ml-auto">No items</span>}
      </button>
      <Button variant="ghost" size="sm" className="h-6 text-xs w-full mt-1" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

/* ── Type-specific Fields ─────────────────────────── */

interface TypeFieldsProps {
  type: ItineraryItemType;
  fields: ItineraryItemFields;
  onChange: (fields: ItineraryItemFields) => void;
  locked?: boolean;
  time: string;
  onTimeChange: (v: string) => void;
}

function TypeSpecificFields({ type, fields, onChange, locked, time, onTimeChange }: TypeFieldsProps) {
  const f = fields || {};
  const upd = (key: keyof ItineraryItemFields, val: string) => onChange({ ...f, [key]: val });

  const lockedWrap = (children: React.ReactNode) =>
    locked ? <div className="pointer-events-none opacity-70">{children}</div> : <>{children}</>;

  switch (type) {
    case "flight":
      return lockedWrap(
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Departure Airport</FieldLabel>
              <AirportAutocomplete value={f.departureAirport || ""} onChange={(v) => upd("departureAirport", v)} placeholder="e.g. JFK" />
            </div>
            <div>
              <FieldLabel>Arrival Airport</FieldLabel>
              <AirportAutocomplete value={f.arrivalAirport || ""} onChange={(v) => upd("arrivalAirport", v)} placeholder="e.g. LIS" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Departure Time</FieldLabel>
              <InlineTimePicker value={f.departureTime || ""} onChange={(v) => upd("departureTime", v)} />
            </div>
            <div>
              <FieldLabel>Arrival Time</FieldLabel>
              <InlineTimePicker value={f.arrivalTime || ""} onChange={(v) => upd("arrivalTime", v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Airline</FieldLabel>
              <AirlineAutocomplete value={f.airline || ""} onChange={(v) => upd("airline", v)} />
            </div>
            <div>
              <FieldLabel>Flight Number</FieldLabel>
              <Input value={f.flightNumber || ""} onChange={(e) => upd("flightNumber", e.target.value)} placeholder="e.g. TP 200" className="h-8 text-sm" disabled={locked} />
            </div>
          </div>
        </div>
      );

    case "hotel":
      return lockedWrap(
        <div className="space-y-2">
          <div>
            <FieldLabel>Hotel Name</FieldLabel>
            <Input value={f.hotelName || ""} onChange={(e) => upd("hotelName", e.target.value)} placeholder="Hotel name" className="h-8 text-sm" disabled={locked} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Check-in Time</FieldLabel>
              <InlineTimePicker value={f.checkInTime || ""} onChange={(v) => upd("checkInTime", v)} />
            </div>
            <div>
              <FieldLabel>Number of Nights</FieldLabel>
              <Input value={f.numberOfNights || ""} onChange={(e) => upd("numberOfNights", e.target.value)} placeholder="e.g. 3" className="h-8 text-sm" disabled={locked} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Location</FieldLabel>
              <LocationAutocomplete value={f.location || ""} onChange={(v) => upd("location", v)} placeholder="City" className="h-8 text-sm" />
            </div>
            <div>
              <FieldLabel>Room Type</FieldLabel>
              <Input value={f.roomType || ""} onChange={(e) => upd("roomType", e.target.value)} placeholder="e.g. Deluxe King" className="h-8 text-sm" disabled={locked} />
            </div>
          </div>
        </div>
      );

    case "cruise":
      return lockedWrap(
        <div className="space-y-2">
          <div>
            <FieldLabel>Cruise Name</FieldLabel>
            <Input value={f.cruiseName || ""} onChange={(e) => upd("cruiseName", e.target.value)} placeholder="Cruise name" className="h-8 text-sm" disabled={locked} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Embarkation Port</FieldLabel>
              <Input value={f.embarkationPort || ""} onChange={(e) => upd("embarkationPort", e.target.value)} placeholder="e.g. Miami" className="h-8 text-sm" disabled={locked} />
            </div>
            <div>
              <FieldLabel>Duration</FieldLabel>
              <Input value={f.duration || ""} onChange={(e) => upd("duration", e.target.value)} placeholder="e.g. 7 nights" className="h-8 text-sm" disabled={locked} />
            </div>
          </div>
        </div>
      );

    case "transfer":
      return lockedWrap(
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Pickup Location</FieldLabel>
              <LocationAutocomplete value={f.pickupLocation || ""} onChange={(v) => upd("pickupLocation", v)} placeholder="Pickup" className="h-8 text-sm" />
            </div>
            <div>
              <FieldLabel>Dropoff Location</FieldLabel>
              <LocationAutocomplete value={f.dropoffLocation || ""} onChange={(v) => upd("dropoffLocation", v)} placeholder="Dropoff" className="h-8 text-sm" />
            </div>
          </div>
          <div>
            <FieldLabel>Time</FieldLabel>
            <InlineTimePicker value={time} onChange={onTimeChange} />
          </div>
        </div>
      );

    case "free_time":
      return null;

    default:
      return lockedWrap(
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Time</FieldLabel>
              <InlineTimePicker value={time} onChange={onTimeChange} />
            </div>
            <div>
              <FieldLabel>Location</FieldLabel>
              <LocationAutocomplete value={f.location || ""} onChange={(v) => upd("location", v)} placeholder="Location" className="h-8 text-sm" />
            </div>
          </div>
        </div>
      );
  }
}

/* ── Item Card Preview ─────────────────────────────── */

export function ItemPreviewSummary({ item }: { item: Activity }) {
  const f = item.fields || {};
  const typeObj = itemTypes.find((t) => t.value === item.type) || itemTypes.find((t) => t.value === "activity")!;
  const Icon = typeObj.icon;

  const getPreview = (): string => {
    switch (item.type) {
      case "flight":
        return [f.departureAirport, f.arrivalAirport].filter(Boolean).join(" → ") || item.title || "Flight";
      case "hotel":
        return [f.hotelName, f.numberOfNights ? `${f.numberOfNights}N` : ""].filter(Boolean).join(" · ") || item.title || "Hotel";
      case "cruise":
        return [f.cruiseName, f.embarkationPort].filter(Boolean).join(" · ") || item.title || "Cruise";
      case "transfer":
        return [f.pickupLocation, f.dropoffLocation].filter(Boolean).join(" → ") || item.title || "Transfer";
      default:
        return item.title || typeObj.label;
    }
  };

  const timeStr = item.type === "flight" ? (f.departureTime || item.time) : item.time;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-xs font-semibold font-body truncate">{getPreview()}</span>
      {timeStr && <span className="text-[10px] text-muted-foreground font-body shrink-0">{timeStr}</span>}
      {item.source === "proposal" && (
        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">From Proposal</Badge>
      )}
      {item.source === "group-trip" && (
        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">From Group Trip</Badge>
      )}
      {item.status === "optional" && (
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 border-accent text-accent-foreground">Optional</Badge>
      )}
      {item.price && (
        <span className="text-[10px] text-primary font-semibold font-body shrink-0">${item.price}</span>
      )}
    </div>
  );
}

/* ── Full Item Edit Form ──────────────────────────── */

interface ItemFormProps {
  item: Activity;
  onChange: (updated: Activity) => void;
}

export function ItineraryItemEditForm({ item, onChange }: ItemFormProps) {
  const locked = item.source === "proposal" || item.source === "group-trip";
  const upd = (field: keyof Activity, value: any) => onChange({ ...item, [field]: value });

  return (
    <div className="space-y-3">
      {/* Type + Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={item.type}
          onChange={(e) => upd("type", e.target.value)}
          disabled={locked}
          className="h-7 text-xs rounded-md border border-input bg-background px-1.5 font-body shrink-0"
        >
          {itemTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => upd("status", item.status === "optional" ? "included" : "optional")}
            className={`h-6 px-2 rounded-full text-[10px] font-semibold font-body border transition-colors ${
              item.status === "optional"
                ? "bg-accent/10 border-accent/40 text-accent-foreground"
                : "bg-primary/5 border-primary/20 text-primary"
            }`}
          >
            {item.status === "optional" ? "Optional" : "Included"}
          </button>
        </div>
      </div>

      {/* Title (for non-flight/hotel/cruise types or as override) */}
      {!["flight", "hotel", "cruise"].includes(item.type) && (
        <div>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={item.title}
            onChange={(e) => upd("title", e.target.value)}
            placeholder="Item title"
            className="h-8 text-sm font-medium"
            disabled={locked}
          />
        </div>
      )}

      {/* Type-specific fields */}
      <TypeSpecificFields
        type={item.type}
        fields={item.fields || {}}
        onChange={(fields) => upd("fields", fields)}
        locked={locked}
        time={item.time}
        onTimeChange={(v) => upd("time", v)}
      />

      {/* Price */}
      <div>
        <FieldLabel>Price (optional)</FieldLabel>
        <div className="relative w-40">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input
            value={item.price || ""}
            onChange={(e) => upd("price", e.target.value)}
            placeholder="0.00"
            className="h-8 text-sm pl-6"
          />
        </div>
      </div>

      {/* Rich text description */}
      <div>
        <FieldLabel>Notes / Description</FieldLabel>
        <RichTextEditor
          content={item.description}
          onChange={(val) => upd("description", val)}
          placeholder="Add details, links, or notes..."
          minHeight="80px"
        />
      </div>
    </div>
  );
}
