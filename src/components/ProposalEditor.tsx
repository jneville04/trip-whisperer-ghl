import { useState, useRef } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff, ImagePlus, X, ArrowUp, ArrowDown } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/RichTextEditor";
import type { ProposalData, ItineraryDay, Activity, SectionVisibility, FlightLeg, Accommodation, SectionKey } from "@/types/proposal";
import { createActivity, createDay, createPricingLine, createFlightLeg, createAccommodation, defaultSectionOrder } from "@/types/proposal";

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
    const f = [...(data.flights || [])];
    f[index] = { ...f[index], [field]: value };
    update("flights", f);
  };

  const updateAccommodation = (index: number, field: keyof Accommodation, value: string) => {
    const a = [...(data.accommodations || [])];
    a[index] = { ...a[index], [field]: value };
    update("accommodations", a);
  };

  const brand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };
  const vis = data.sectionVisibility || { hero: true, overview: true, flights: true, accommodations: true, itinerary: true, inclusions: true, pricing: true, essentials: true, terms: true, agent: true };
  const flights = data.flights || [];
  const accommodations = data.accommodations || [];
  const sectionOrder = data.sectionOrder || defaultSectionOrder;
  const travelers = data.travelers || [];
  const essentials = data.essentials || { visaRequirements: "", passportInfo: "", currency: "", language: "", timeZone: "", weatherInfo: "", packingTips: "", emergencyContacts: "" };
  const terms = data.terms || { cancellationPolicy: "", travelInsurance: "", bookingTerms: "", liability: "", showCancellation: true, showInsurance: true, showBookingTerms: true, showLiability: true };

  const sectionLabels: Record<SectionKey, string> = {
    overview: "🌍 Overview", flights: "✈️ Flights", accommodations: "🏨 Hotels",
    itinerary: "📋 Itinerary", inclusions: "✅ Included", pricing: "💰 Pricing",
    essentials: "🧳 Essentials", terms: "📄 Terms", agent: "🧑‍💼 Agent",
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newOrder = [...sectionOrder];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    [newOrder[index], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[index]];
    update("sectionOrder", newOrder);
  };

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
            <FieldLabel>Logo</FieldLabel>
            <ImageUploadField value={brand.logoUrl} onChange={(url) => update("brand", { ...brand, logoUrl: url })} placeholder="Paste logo URL" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Primary Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={brand.primaryColor || "#c2631a"} onChange={(e) => update("brand", { ...brand, primaryColor: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input value={brand.primaryColor} onChange={(e) => update("brand", { ...brand, primaryColor: e.target.value })} placeholder="#c2631a" className="h-8 text-sm flex-1" />
              </div>
            </div>
            <div>
              <FieldLabel>Secondary Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={brand.secondaryColor || "#337a8a"} onChange={(e) => update("brand", { ...brand, secondaryColor: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input value={brand.secondaryColor} onChange={(e) => update("brand", { ...brand, secondaryColor: e.target.value })} placeholder="#337a8a" className="h-8 text-sm flex-1" />
              </div>
            </div>
            <div>
              <FieldLabel>Accent Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={brand.accentColor || "#d4a824"} onChange={(e) => update("brand", { ...brand, accentColor: e.target.value })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input value={brand.accentColor} onChange={(e) => update("brand", { ...brand, accentColor: e.target.value })} placeholder="#d4a824" className="h-8 text-sm flex-1" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Leave blank to use defaults. Colors apply to the preview header, buttons, and accents.</p>
        </div>
      </CollapsibleSection>

      {/* Section Order */}
      <CollapsibleSection title="📐 Section Order" defaultOpen={false}>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">Drag sections up/down to reorder the proposal layout.</p>
          {sectionOrder.map((key, idx) => (
            <div key={key} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-background border border-border/30">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <span className="text-sm font-body flex-1">{sectionLabels[key]}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleSection(key as keyof typeof vis)}
                  className={`p-1 rounded transition-colors ${vis[key as keyof typeof vis] ? "text-primary hover:text-primary/70" : "text-muted-foreground/30 hover:text-muted-foreground"}`}
                >
                  {vis[key as keyof typeof vis] ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === sectionOrder.length - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

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
            <FieldLabel>Hero Image</FieldLabel>
            <ImageUploadField value={data.heroImageUrl} onChange={(url) => update("heroImageUrl", url)} placeholder="Paste hero image URL" />
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
            <RichTextEditor
              content={data.introText}
              onChange={(html) => update("introText", html)}
              placeholder="Write a compelling introduction for your client..."
              minHeight="150px"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Flights */}
      <CollapsibleSection title="✈️ Flights" sectionKey="flights" visible={vis.flights} onToggleVisible={() => toggleSection("flights")} defaultOpen={false}>
        <div className="space-y-4">
          {flights.map((flight, i) => (
            <div key={flight.id} className="border border-border/40 rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-semibold text-sm text-foreground">{flight.type === "departure" ? "🛫 Departure" : "🛬 Return"}</span>
                <Button variant="travel-ghost" size="icon" onClick={() => update("flights", flights.filter((_, idx) => idx !== i))} className="h-7 w-7 text-destructive/60 hover:text-destructive">
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
            <Button variant="travel-ghost" size="sm" onClick={() => update("flights", [...flights, createFlightLeg("departure")])} className="text-primary text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Departure
            </Button>
            <Button variant="travel-ghost" size="sm" onClick={() => update("flights", [...flights, createFlightLeg("return")])} className="text-primary text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Return
            </Button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Accommodations */}
      <CollapsibleSection title="🏨 Accommodations" sectionKey="accommodations" visible={vis.accommodations} onToggleVisible={() => toggleSection("accommodations")} defaultOpen={false}>
        <div className="space-y-4">
          {accommodations.map((acc, i) => {
            const accAmenities = acc.amenities || [];
            const accHighlights = acc.highlights || [];
            const accGallery = acc.galleryUrls || [];
            const updateAccField = (field: string, value: any) => {
              const a = [...(data.accommodations || [])];
              a[i] = { ...a[i], [field]: value };
              update("accommodations", a);
            };

            const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") => {
              const files = e.target.files;
              if (!files) return;
              Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const url = ev.target?.result as string;
                  if (target === "main") {
                    updateAccField("imageUrl", url);
                  } else {
                    updateAccField("galleryUrls", [...accGallery, url]);
                  }
                };
                reader.readAsDataURL(file);
              });
              e.target.value = "";
            };

            const removeGalleryImage = (idx: number) => {
              updateAccField("galleryUrls", accGallery.filter((_: string, j: number) => j !== idx));
            };

            

            return (
            <div key={acc.id} className="border border-border/40 rounded-lg bg-muted/20 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <span className="font-body font-semibold text-sm text-foreground">{acc.hotelName || `Hotel ${i + 1}`}</span>
                </div>
                <Button variant="travel-ghost" size="icon" onClick={() => update("accommodations", accommodations.filter((_, idx) => idx !== i))} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Tabbed Content */}
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent h-9 px-3">
                  <TabsTrigger value="general" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">General Info</TabsTrigger>
                  <TabsTrigger value="media" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Media</TabsTrigger>
                  <TabsTrigger value="details" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Details</TabsTrigger>
                </TabsList>

                {/* General Info Tab */}
                <TabsContent value="general" className="p-3 space-y-2 mt-0">
                  <div>
                    <FieldLabel>Hotel Name</FieldLabel>
                    <Input value={acc.hotelName} onChange={(e) => updateAccommodation(i, "hotelName", e.target.value)} placeholder="Four Seasons Hotel" className="h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Location</FieldLabel>
                      <Input value={acc.location} onChange={(e) => updateAccommodation(i, "location", e.target.value)} placeholder="Lisbon" className="h-8 text-xs" />
                    </div>
                    <div>
                      <FieldLabel>Room Type</FieldLabel>
                      <Input value={acc.roomType} onChange={(e) => updateAccommodation(i, "roomType", e.target.value)} placeholder="Superior Suite" className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <FieldLabel>Check-in</FieldLabel>
                      <Input value={acc.checkIn} onChange={(e) => updateAccommodation(i, "checkIn", e.target.value)} placeholder="Sep 15" className="h-8 text-xs" />
                    </div>
                    <div>
                      <FieldLabel>Check-out</FieldLabel>
                      <Input value={acc.checkOut} onChange={(e) => updateAccommodation(i, "checkOut", e.target.value)} placeholder="Sep 17" className="h-8 text-xs" />
                    </div>
                    <div>
                      <FieldLabel>Nights</FieldLabel>
                      <Input value={acc.nights} onChange={(e) => updateAccommodation(i, "nights", e.target.value)} placeholder="2" className="h-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Lodging Description</FieldLabel>
                    <RichTextEditor
                      content={acc.description}
                      onChange={(html) => updateAccommodation(i, "description", html)}
                      placeholder="Describe the hotel, its atmosphere, unique features..."
                      minHeight="150px"
                    />
                  </div>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="p-3 space-y-3 mt-0">
                  <div>
                    <FieldLabel>Displayed Photos</FieldLabel>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {/* Primary photo */}
                      {acc.imageUrl && (
                        <div className="relative col-span-2 row-span-2 aspect-[4/3] rounded-lg overflow-hidden border border-border/40 group">
                          <img src={acc.imageUrl} alt="Primary" className="w-full h-full object-cover" />
                          <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">Primary Photo</div>
                          <button onClick={() => updateAccField("imageUrl", "")} className="absolute top-1.5 right-1.5 bg-foreground/70 text-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {/* Gallery images */}
                      {accGallery.map((url: string, gi: number) => (
                        <div key={gi} className="relative aspect-square rounded-lg overflow-hidden border border-border/40 group">
                          <img src={url} alt={`Gallery ${gi + 1}`} className="w-full h-full object-cover" />
                          <button onClick={() => removeGalleryImage(gi)} className="absolute top-1 right-1 bg-foreground/70 text-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {/* Add photo button */}
                      <label className="aspect-square rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors">
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium">Add photos</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, acc.imageUrl ? "gallery" : "main")} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Or paste image URL</FieldLabel>
                    <div className="flex gap-1.5">
                      <Input placeholder="https://..." className="h-8 text-xs flex-1" onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (!val) return;
                          if (!acc.imageUrl) { updateAccField("imageUrl", val); }
                          else { updateAccField("galleryUrls", [...accGallery, val]); }
                          (e.target as HTMLInputElement).value = "";
                        }
                      }} />
                      <Button variant="travel" size="sm" className="h-8 text-xs" onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        const val = input.value.trim();
                        if (!val) return;
                        if (!acc.imageUrl) { updateAccField("imageUrl", val); }
                        else { updateAccField("galleryUrls", [...accGallery, val]); }
                        input.value = "";
                      }}>Add</Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="p-3 space-y-2 mt-0">
                  <div>
                    <FieldLabel>Highlights</FieldLabel>
                    <Textarea
                      value={accHighlights.join("\n")}
                      onChange={(e) => updateAccField("highlights", e.target.value.split("\n").filter(Boolean))}
                      placeholder="One highlight per line&#10;e.g. Tagus River panoramic views&#10;Walking distance to historic Alfama"
                      className="text-xs min-h-[80px] resize-y"
                    />
                  </div>
                  <div>
                    <FieldLabel>Amenities</FieldLabel>
                    <Textarea
                      value={accAmenities.join("\n")}
                      onChange={(e) => updateAccField("amenities", e.target.value.split("\n").filter(Boolean))}
                      placeholder="One amenity per line&#10;e.g. Spa & Wellness Center&#10;Rooftop Pool&#10;24h Room Service"
                      className="text-xs min-h-[80px] resize-y"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            );
          })}
          <Button variant="travel-ghost" size="sm" onClick={() => update("accommodations", [...accommodations, createAccommodation()])} className="text-primary text-xs h-7">
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
                  <div key={act.id} className="bg-background rounded-lg p-3 border border-border/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={act.type}
                          onChange={(e) => updateActivity(dayIdx, actIdx, "type", e.target.value)}
                          className="h-7 text-xs rounded-md border border-input bg-background px-1.5 font-body"
                        >
                          {activityTypes.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <Input value={act.time} onChange={(e) => updateActivity(dayIdx, actIdx, "time", e.target.value)} placeholder="2:00 PM" className="h-7 text-xs w-24" />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => {
                          if (actIdx === 0) return;
                          const acts = [...day.activities];
                          [acts[actIdx - 1], acts[actIdx]] = [acts[actIdx], acts[actIdx - 1]];
                          updateDay(dayIdx, { ...day, activities: acts });
                        }} disabled={actIdx === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => {
                          if (actIdx === day.activities.length - 1) return;
                          const acts = [...day.activities];
                          [acts[actIdx], acts[actIdx + 1]] = [acts[actIdx + 1], acts[actIdx]];
                          updateDay(dayIdx, { ...day, activities: acts });
                        }} disabled={actIdx === day.activities.length - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <Button variant="travel-ghost" size="icon" onClick={() => removeActivity(dayIdx, actIdx)} className="h-7 w-7 text-muted-foreground/40 hover:text-destructive" disabled={day.activities.length <= 1}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Input value={act.title} onChange={(e) => updateActivity(dayIdx, actIdx, "title", e.target.value)} placeholder="Activity name" className="h-8 text-sm font-medium" />
                    <Textarea value={act.description} onChange={(e) => updateActivity(dayIdx, actIdx, "description", e.target.value)} placeholder="Describe this activity in detail..." className="text-sm min-h-[60px] resize-y" />
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


      {/* Travelers */}
      <CollapsibleSection title="👥 Travelers" defaultOpen={false}>
        <div className="space-y-3">
          {travelers.map((t, i) => (
            <div key={t.id} className="border border-border/40 rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-semibold text-sm">Traveler {i + 1}</span>
                <Button variant="travel-ghost" size="icon" onClick={() => update("travelers", travelers.filter((_, idx) => idx !== i))} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <FieldLabel>Full Name</FieldLabel>
                  <Input value={t.fullName} onChange={(e) => { const tr = [...travelers]; tr[i] = { ...tr[i], fullName: e.target.value }; update("travelers", tr); }} className="h-8 text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <FieldLabel>Date of Birth</FieldLabel>
                  <Input value={t.dateOfBirth} onChange={(e) => { const tr = [...travelers]; tr[i] = { ...tr[i], dateOfBirth: e.target.value }; update("travelers", tr); }} className="h-8 text-sm" placeholder="MM/DD/YYYY" />
                </div>
                <div>
                  <FieldLabel>Passport #</FieldLabel>
                  <Input value={t.passportNumber} onChange={(e) => { const tr = [...travelers]; tr[i] = { ...tr[i], passportNumber: e.target.value }; update("travelers", tr); }} className="h-8 text-sm" placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Dietary Restrictions</FieldLabel>
                  <Input value={t.dietaryRestrictions} onChange={(e) => { const tr = [...travelers]; tr[i] = { ...tr[i], dietaryRestrictions: e.target.value }; update("travelers", tr); }} className="h-8 text-sm" placeholder="Vegetarian, allergies, etc." />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Special Requests</FieldLabel>
                  <Textarea value={t.specialRequests} onChange={(e) => { const tr = [...travelers]; tr[i] = { ...tr[i], specialRequests: e.target.value }; update("travelers", tr); }} className="text-sm min-h-[60px]" placeholder="Wheelchair access, celebration, etc." />
                </div>
              </div>
            </div>
          ))}
          <Button variant="travel-ghost" size="sm" onClick={() => update("travelers", [...travelers, { id: crypto.randomUUID(), fullName: "", passportNumber: "", dateOfBirth: "", dietaryRestrictions: "", specialRequests: "" }])} className="text-primary text-xs h-7">
            <Plus className="h-3 w-3 mr-1" /> Add Traveler
          </Button>
        </div>
      </CollapsibleSection>

      {/* Travel Essentials */}
      <CollapsibleSection title="🧳 Travel Essentials" defaultOpen={false} sectionKey="essentials" visible={vis.essentials} onToggleVisible={() => toggleSection("essentials")}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Visa Requirements</FieldLabel>
            <RichTextEditor content={essentials.visaRequirements} onChange={(html) => update("essentials", { ...essentials, visaRequirements: html })} placeholder="Visa requirements for this destination..." minHeight="80px" />
          </div>
          <div>
            <FieldLabel>Passport Info</FieldLabel>
            <Textarea value={essentials.passportInfo} onChange={(e) => update("essentials", { ...essentials, passportInfo: e.target.value })} className="text-sm min-h-[60px]" placeholder="Passport validity requirements..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Currency</FieldLabel>
              <Input value={essentials.currency} onChange={(e) => update("essentials", { ...essentials, currency: e.target.value })} className="h-8 text-sm" placeholder="EUR (€)" />
            </div>
            <div>
              <FieldLabel>Language</FieldLabel>
              <Input value={essentials.language} onChange={(e) => update("essentials", { ...essentials, language: e.target.value })} className="h-8 text-sm" placeholder="Portuguese" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Time Zone</FieldLabel>
              <Input value={essentials.timeZone} onChange={(e) => update("essentials", { ...essentials, timeZone: e.target.value })} className="h-8 text-sm" placeholder="GMT+1 (WEST)" />
            </div>
            <div>
              <FieldLabel>Weather</FieldLabel>
              <Input value={essentials.weatherInfo} onChange={(e) => update("essentials", { ...essentials, weatherInfo: e.target.value })} className="h-8 text-sm" placeholder="Warm, 22-28°C" />
            </div>
          </div>
          <div>
            <FieldLabel>Packing Tips</FieldLabel>
            <RichTextEditor content={essentials.packingTips} onChange={(html) => update("essentials", { ...essentials, packingTips: html })} placeholder="Comfortable walking shoes, sun protection, light layers..." minHeight="80px" />
          </div>
          <div>
            <FieldLabel>Emergency Contacts</FieldLabel>
            <Textarea value={essentials.emergencyContacts} onChange={(e) => update("essentials", { ...essentials, emergencyContacts: e.target.value })} className="text-sm min-h-[60px]" placeholder="Local emergency: 112&#10;Embassy: +351..." />
          </div>
        </div>
      </CollapsibleSection>

      {/* Terms & Conditions */}
      <CollapsibleSection title="📄 Terms & Conditions" defaultOpen={false} sectionKey="terms" visible={vis.terms} onToggleVisible={() => toggleSection("terms")}>
        <div className="space-y-3">
          {([
            { key: "showCancellation" as const, field: "cancellationPolicy" as const, label: "Cancellation Policy", placeholder: "Cancellation and refund policy details..." },
            { key: "showInsurance" as const, field: "travelInsurance" as const, label: "Travel Insurance", placeholder: "Travel insurance requirements..." },
            { key: "showBookingTerms" as const, field: "bookingTerms" as const, label: "Booking Terms", placeholder: "Payment schedule, deposit requirements..." },
            { key: "showLiability" as const, field: "liability" as const, label: "Liability", placeholder: "Agency liability disclaimers..." },
          ]).map(({ key, field, label, placeholder }) => (
            <div key={key} className={`border border-border/30 rounded-lg overflow-hidden ${terms[key] === false ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                <span className="text-sm font-body font-medium">{label}</span>
                <button
                  onClick={() => update("terms", { ...terms, [key]: !terms[key] })}
                  className={`p-1 rounded transition-colors ${terms[key] !== false ? "text-primary" : "text-muted-foreground/40"}`}
                >
                  {terms[key] !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
              {terms[key] !== false && (
                <div className="p-3">
                  <RichTextEditor content={terms[field]} onChange={(html) => update("terms", { ...terms, [field]: html })} placeholder={placeholder} minHeight="80px" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Notes */}
      <CollapsibleSection title="📝 Notes & Special Arrangements" defaultOpen={false}>
        <RichTextEditor content={data.notes || ""} onChange={(html) => update("notes", html)} placeholder="Honeymoon decorations, birthday cake at dinner, VIP transfers, special celebrations..." minHeight="120px" />
      </CollapsibleSection>

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
