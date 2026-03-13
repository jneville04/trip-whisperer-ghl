import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ProposalData, ItineraryDay, Activity, SectionVisibility, FlightLeg, Accommodation } from "@/types/proposal";
import { createActivity, createDay, createPricingLine, createFlightLeg, createAccommodation } from "@/types/proposal";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

const activityTypes: { value: Activity["type"]; label: string }[] = [
  { value: "transport", label: "🚗 Transport" },
  { value: "hotel", label: "🏨 Hotel" },
  { value: "dining", label: "🍽️ Dining" },
  { value: "activity", label: "🎯 Activity" },
  { value: "sightseeing", label: "📸 Sightseeing" },
];

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  sectionKey,
  visible,
  onToggleVisible,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionKey?: keyof SectionVisibility;
  visible?: boolean;
  onToggleVisible?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className={`border-border/50 ${visible === false ? "opacity-50" : ""}`}>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setOpen(!open)}>
            <CardTitle className="text-base font-display">{title}</CardTitle>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
          {sectionKey && onToggleVisible && (
            <button
              onClick={onToggleVisible}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              title={visible ? "Hide section from preview" : "Show section in preview"}
            >
              {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block font-body">{children}</label>;
}

export default function ProposalEditor({ data, onChange }: Props) {
  const update = <K extends keyof ProposalData>(key: K, value: ProposalData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    update("sectionVisibility", { ...data.sectionVisibility, [key]: !data.sectionVisibility[key] });
  };

  const updateDay = (dayIndex: number, updated: ItineraryDay) => {
    const days = [...data.days];
    days[dayIndex] = updated;
    update("days", days);
  };

  const addDay = () => update("days", [...data.days, createDay(data.days.length + 1)]);
  const removeDay = (index: number) => update("days", data.days.filter((_, i) => i !== index));

  const updateActivity = (dayIndex: number, actIndex: number, field: keyof Activity, value: string) => {
    const day = { ...data.days[dayIndex] };
    day.activities = [...day.activities];
    day.activities[actIndex] = { ...day.activities[actIndex], [field]: value };
    updateDay(dayIndex, day);
  };

  const addActivity = (dayIndex: number) => {
    const day = { ...data.days[dayIndex] };
    day.activities = [...day.activities, createActivity()];
    updateDay(dayIndex, day);
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const day = { ...data.days[dayIndex] };
    day.activities = day.activities.filter((_, i) => i !== actIndex);
    updateDay(dayIndex, day);
  };

  const updateInclusion = (index: number, value: string) => {
    const inc = [...data.inclusions];
    inc[index] = value;
    update("inclusions", inc);
  };
  const addInclusion = () => update("inclusions", [...data.inclusions, ""]);
  const removeInclusion = (index: number) => update("inclusions", data.inclusions.filter((_, i) => i !== index));

  const updateFlight = (index: number, field: keyof FlightLeg, value: string) => {
    const flights = [...data.flights];
    flights[index] = { ...flights[index], [field]: value };
    update("flights", flights);
  };

  const updateAccommodation = (index: number, field: keyof Accommodation, value: string) => {
    const accs = [...data.accommodations];
    accs[index] = { ...accs[index], [field]: value };
    update("accommodations", accs);
  };

  const brand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };
  const vis = data.sectionVisibility || { hero: true, overview: true, flights: true, accommodations: true, itinerary: true, inclusions: true, pricing: true, testimonial: true, agent: true };
  const flights = data.flights || [];
  const accommodations = data.accommodations || [];

  return (
    <div className="space-y-4 p-4 sm:p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Proposal Builder</h2>
        <p className="text-sm text-muted-foreground font-body mt-1">Fill in the details below — preview updates live. Use the 👁 icon to show/hide sections.</p>
      </div>

      {/* Brand Settings */}
      <CollapsibleSection title="🎨 Brand & Colors" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Logo URL</FieldLabel>
            <Input value={data.brand.logoUrl} onChange={(e) => update("brand", { ...data.brand, logoUrl: e.target.value })} placeholder="Paste logo image URL" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Primary Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={data.brand.primaryColor || "#c2631a"} onChange={(e) => update("brand", { ...data.brand, primaryColor: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input value={data.brand.primaryColor} onChange={(e) => update("brand", { ...data.brand, primaryColor: e.target.value })} placeholder="#c2631a" className="h-8 text-sm flex-1" />
              </div>
            </div>
            <div>
              <FieldLabel>Secondary Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={data.brand.secondaryColor || "#337a8a"} onChange={(e) => update("brand", { ...data.brand, secondaryColor: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input value={data.brand.secondaryColor} onChange={(e) => update("brand", { ...data.brand, secondaryColor: e.target.value })} placeholder="#337a8a" className="h-8 text-sm flex-1" />
              </div>
            </div>
            <div>
              <FieldLabel>Accent Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={data.brand.accentColor || "#d4a824"} onChange={(e) => update("brand", { ...data.brand, accentColor: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input value={data.brand.accentColor} onChange={(e) => update("brand", { ...data.brand, accentColor: e.target.value })} placeholder="#d4a824" className="h-8 text-sm flex-1" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Leave blank to use defaults. Colors apply to the preview header, buttons, and accents.</p>
        </div>
      </CollapsibleSection>

      {/* Trip Overview */}
      <CollapsibleSection title="🌍 Trip Overview" sectionKey="hero" visible={vis.hero} onToggleVisible={() => toggleSection("hero")}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Destination</FieldLabel>
              <Input value={data.destination} onChange={(e) => update("destination", e.target.value)} placeholder="e.g. Portugal" />
            </div>
            <div>
              <FieldLabel>Subtitle</FieldLabel>
              <Input value={data.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="e.g. Lisbon · Porto · Algarve" />
            </div>
          </div>
          <div>
            <FieldLabel>Hero Image URL</FieldLabel>
            <Input value={data.heroImageUrl} onChange={(e) => update("heroImageUrl", e.target.value)} placeholder="Paste image URL" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Travel Dates</FieldLabel>
              <Input value={data.travelDates} onChange={(e) => update("travelDates", e.target.value)} placeholder="Sep 15–19, 2026" />
            </div>
            <div>
              <FieldLabel>Travelers</FieldLabel>
              <Input value={data.travelerCount} onChange={(e) => update("travelerCount", e.target.value)} placeholder="2 Travelers" />
            </div>
            <div>
              <FieldLabel>Destinations</FieldLabel>
              <Input value={data.destinationCount} onChange={(e) => update("destinationCount", e.target.value)} placeholder="4 Destinations" />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Client Info */}
      <CollapsibleSection title="👤 Client Details" sectionKey="overview" visible={vis.overview} onToggleVisible={() => toggleSection("overview")}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Client Name</FieldLabel>
            <Input value={data.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Michael & Sarah Johnson" />
          </div>
          <div>
            <FieldLabel>Introduction Text</FieldLabel>
            <textarea
              value={data.introText}
              onChange={(e) => update("introText", e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body"
              placeholder="Write a compelling introduction..."
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Flights */}
      <CollapsibleSection title="✈️ Flights" sectionKey="flights" visible={vis.flights} onToggleVisible={() => toggleSection("flights")} defaultOpen={false}>
        <div className="space-y-4">
          {data.flights.map((flight, i) => (
            <div key={flight.id} className="border border-border/40 rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-semibold text-sm text-foreground">{flight.type === "departure" ? "🛫 Departure" : "🛬 Return"}</span>
                <Button variant="travel-ghost" size="icon" onClick={() => update("flights", data.flights.filter((_, idx) => idx !== i))} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Airline</FieldLabel>
                  <Input value={flight.airline} onChange={(e) => updateFlight(i, "airline", e.target.value)} placeholder="TAP Air Portugal" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Flight #</FieldLabel>
                  <Input value={flight.flightNumber} onChange={(e) => updateFlight(i, "flightNumber", e.target.value)} placeholder="TP 236" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>From</FieldLabel>
                  <Input value={flight.departureAirport} onChange={(e) => updateFlight(i, "departureAirport", e.target.value)} placeholder="SFO – San Francisco" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>To</FieldLabel>
                  <Input value={flight.arrivalAirport} onChange={(e) => updateFlight(i, "arrivalAirport", e.target.value)} placeholder="LIS – Lisbon" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <Input value={flight.date} onChange={(e) => updateFlight(i, "date", e.target.value)} placeholder="Sep 14, 2026" className="h-7 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <FieldLabel>Depart</FieldLabel>
                    <Input value={flight.departureTime} onChange={(e) => updateFlight(i, "departureTime", e.target.value)} placeholder="6:30 PM" className="h-7 text-xs" />
                  </div>
                  <div>
                    <FieldLabel>Arrive</FieldLabel>
                    <Input value={flight.arrivalTime} onChange={(e) => updateFlight(i, "arrivalTime", e.target.value)} placeholder="1:00 PM" className="h-7 text-xs" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="travel-ghost" size="sm" onClick={() => update("flights", [...data.flights, createFlightLeg("departure")])} className="text-primary text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Departure
            </Button>
            <Button variant="travel-ghost" size="sm" onClick={() => update("flights", [...data.flights, createFlightLeg("return")])} className="text-primary text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Return
            </Button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Accommodations */}
      <CollapsibleSection title="🏨 Accommodations" sectionKey="accommodations" visible={vis.accommodations} onToggleVisible={() => toggleSection("accommodations")} defaultOpen={false}>
        <div className="space-y-4">
          {data.accommodations.map((acc, i) => (
            <div key={acc.id} className="border border-border/40 rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-semibold text-sm text-foreground">🏨 Hotel {i + 1}</span>
                <Button variant="travel-ghost" size="icon" onClick={() => update("accommodations", data.accommodations.filter((_, idx) => idx !== i))} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <FieldLabel>Hotel Name</FieldLabel>
                  <Input value={acc.hotelName} onChange={(e) => updateAccommodation(i, "hotelName", e.target.value)} placeholder="Four Seasons Hotel" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Location</FieldLabel>
                  <Input value={acc.location} onChange={(e) => updateAccommodation(i, "location", e.target.value)} placeholder="Lisbon" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Room Type</FieldLabel>
                  <Input value={acc.roomType} onChange={(e) => updateAccommodation(i, "roomType", e.target.value)} placeholder="Superior Suite" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Check-in</FieldLabel>
                  <Input value={acc.checkIn} onChange={(e) => updateAccommodation(i, "checkIn", e.target.value)} placeholder="Sep 15" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Check-out</FieldLabel>
                  <Input value={acc.checkOut} onChange={(e) => updateAccommodation(i, "checkOut", e.target.value)} placeholder="Sep 17" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Nights</FieldLabel>
                  <Input value={acc.nights} onChange={(e) => updateAccommodation(i, "nights", e.target.value)} placeholder="2 Nights" className="h-7 text-xs" />
                </div>
                <div>
                  <FieldLabel>Image URL</FieldLabel>
                  <Input value={acc.imageUrl} onChange={(e) => updateAccommodation(i, "imageUrl", e.target.value)} placeholder="Paste URL" className="h-7 text-xs" />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <Input value={acc.description} onChange={(e) => updateAccommodation(i, "description", e.target.value)} placeholder="Brief description..." className="h-7 text-xs" />
                </div>
              </div>
            </div>
          ))}
          <Button variant="travel-ghost" size="sm" onClick={() => update("accommodations", [...data.accommodations, createAccommodation()])} className="text-primary text-xs h-7">
            <Plus className="h-3 w-3 mr-1" /> Add Hotel
          </Button>
        </div>
      </CollapsibleSection>

      {/* Days */}
      <CollapsibleSection title="📅 Itinerary Days" sectionKey="itinerary" visible={vis.itinerary} onToggleVisible={() => toggleSection("itinerary")}>
        <div className="space-y-6">
          {data.days.map((day, dayIdx) => (
            <div key={day.id} className="border border-border/40 rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-foreground">Day {dayIdx + 1}</span>
                <Button variant="travel-ghost" size="icon" onClick={() => removeDay(dayIdx)} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <Input value={day.title} onChange={(e) => updateDay(dayIdx, { ...day, title: e.target.value })} placeholder="Arrival in Lisbon" className="h-8 text-sm" />
                </div>
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <Input value={day.date} onChange={(e) => updateDay(dayIdx, { ...day, date: e.target.value })} placeholder="September 15, 2026" className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <FieldLabel>Location</FieldLabel>
                  <Input value={day.location} onChange={(e) => updateDay(dayIdx, { ...day, location: e.target.value })} placeholder="Lisbon" className="h-8 text-sm" />
                </div>
                <div>
                  <FieldLabel>Image URL</FieldLabel>
                  <Input value={day.imageUrl} onChange={(e) => updateDay(dayIdx, { ...day, imageUrl: e.target.value })} placeholder="Paste image URL" className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel>Activities</FieldLabel>
                {day.activities.map((act, actIdx) => (
                  <div key={act.id} className="flex gap-2 items-start bg-background rounded-md p-2 border border-border/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-2 shrink-0" />
                    <div className="flex-1 grid grid-cols-12 gap-1.5">
                      <Input value={act.time} onChange={(e) => updateActivity(dayIdx, actIdx, "time", e.target.value)} placeholder="2:00 PM" className="h-7 text-xs col-span-3" />
                      <Input value={act.title} onChange={(e) => updateActivity(dayIdx, actIdx, "title", e.target.value)} placeholder="Activity name" className="h-7 text-xs col-span-4 font-medium" />
                      <select
                        value={act.type}
                        onChange={(e) => updateActivity(dayIdx, actIdx, "type", e.target.value)}
                        className="h-7 text-xs col-span-4 rounded-md border border-input bg-background px-1 font-body"
                      >
                        {activityTypes.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <Button variant="travel-ghost" size="icon" onClick={() => removeActivity(dayIdx, actIdx)} className="h-7 w-7 col-span-1 text-muted-foreground/40 hover:text-destructive" disabled={day.activities.length <= 1}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Input value={act.description} onChange={(e) => updateActivity(dayIdx, actIdx, "description", e.target.value)} placeholder="Description..." className="h-7 text-xs col-span-12" />
                    </div>
                  </div>
                ))}
                <Button variant="travel-ghost" size="sm" onClick={() => addActivity(dayIdx)} className="text-primary text-xs h-7">
                  <Plus className="h-3 w-3 mr-1" /> Activity
                </Button>
              </div>
            </div>
          ))}
          <Button variant="travel-outline" size="sm" onClick={addDay} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Add Day
          </Button>
        </div>
      </CollapsibleSection>

      {/* Inclusions */}
      <CollapsibleSection title="✅ What's Included" defaultOpen={false} sectionKey="inclusions" visible={vis.inclusions} onToggleVisible={() => toggleSection("inclusions")}>
        <div className="space-y-2">
          {data.inclusions.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input value={item} onChange={(e) => updateInclusion(i, e.target.value)} placeholder="Inclusion item" className="h-8 text-sm" />
              <Button variant="travel-ghost" size="icon" onClick={() => removeInclusion(i)} className="h-8 w-8 text-muted-foreground/40 hover:text-destructive shrink-0">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="travel-ghost" size="sm" onClick={addInclusion} className="text-primary text-xs h-7">
            <Plus className="h-3 w-3 mr-1" /> Add Inclusion
          </Button>
        </div>
      </CollapsibleSection>

      {/* Pricing */}
      <CollapsibleSection title="💰 Pricing" defaultOpen={false} sectionKey="pricing" visible={vis.pricing} onToggleVisible={() => toggleSection("pricing")}>
        <div className="space-y-2">
          {data.pricing.map((line, i) => (
            <div key={line.id} className="flex gap-2">
              <Input value={line.label} onChange={(e) => { const p = [...data.pricing]; p[i] = { ...p[i], label: e.target.value }; update("pricing", p); }} placeholder="Line item" className="h-8 text-sm flex-1" />
              <Input value={line.amount} onChange={(e) => { const p = [...data.pricing]; p[i] = { ...p[i], amount: e.target.value }; update("pricing", p); }} placeholder="$0" className="h-8 text-sm w-28" />
              <Button variant="travel-ghost" size="icon" onClick={() => update("pricing", data.pricing.filter((_, idx) => idx !== i))} className="h-8 w-8 text-muted-foreground/40 hover:text-destructive shrink-0">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="travel-ghost" size="sm" onClick={() => update("pricing", [...data.pricing, createPricingLine()])} className="text-primary text-xs h-7">
            <Plus className="h-3 w-3 mr-1" /> Add Line
          </Button>
          <div className="pt-2 space-y-2">
            <div>
              <FieldLabel>Payment Terms</FieldLabel>
              <Input value={data.paymentTerms} onChange={(e) => update("paymentTerms", e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <FieldLabel>Valid Until</FieldLabel>
              <Input value={data.validUntil} onChange={(e) => update("validUntil", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Testimonial */}
      <CollapsibleSection title="⭐ Testimonial" defaultOpen={false} sectionKey="testimonial" visible={vis.testimonial} onToggleVisible={() => toggleSection("testimonial")}>
        <div className="space-y-2">
          <div>
            <FieldLabel>Quote</FieldLabel>
            <textarea value={data.testimonialQuote} onChange={(e) => update("testimonialQuote", e.target.value)} rows={2} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Author</FieldLabel>
              <Input value={data.testimonialAuthor} onChange={(e) => update("testimonialAuthor", e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <FieldLabel>Trip</FieldLabel>
              <Input value={data.testimonialTrip} onChange={(e) => update("testimonialTrip", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Agent Info */}
      <CollapsibleSection title="🧑‍💼 Agent Info" defaultOpen={false} sectionKey="agent" visible={vis.agent} onToggleVisible={() => toggleSection("agent")}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Name</FieldLabel>
              <Input value={data.agent.name} onChange={(e) => update("agent", { ...data.agent, name: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <FieldLabel>Title</FieldLabel>
              <Input value={data.agent.title} onChange={(e) => update("agent", { ...data.agent, title: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Phone</FieldLabel>
              <Input value={data.agent.phone} onChange={(e) => update("agent", { ...data.agent, phone: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input value={data.agent.email} onChange={(e) => update("agent", { ...data.agent, email: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Website</FieldLabel>
              <Input value={data.agent.website} onChange={(e) => update("agent", { ...data.agent, website: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <FieldLabel>Agency Name</FieldLabel>
              <Input value={data.agent.agencyName} onChange={(e) => update("agent", { ...data.agent, agencyName: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Agent Photo URL</FieldLabel>
              <Input value={data.agent.photoUrl} onChange={(e) => update("agent", { ...data.agent, photoUrl: e.target.value })} className="h-8 text-sm" placeholder="Photo URL" />
            </div>
            <div>
              <FieldLabel>Agency Logo URL</FieldLabel>
              <Input value={data.agent.logoUrl} onChange={(e) => update("agent", { ...data.agent, logoUrl: e.target.value })} className="h-8 text-sm" placeholder="Logo URL" />
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
