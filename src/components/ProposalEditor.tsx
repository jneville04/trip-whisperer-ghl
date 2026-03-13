import { useState, useRef, ReactNode } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ChevronRight, Eye, EyeOff, ImagePlus, X, ArrowUp, ArrowDown, Search } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import DatePickerField from "@/components/DatePickerField";
import ImageUploadField from "@/components/ImageUploadField";
import SortableImageGrid from "@/components/SortableImageGrid";
import HotelSearchDialog from "@/components/HotelSearchDialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/RichTextEditor";
import type { ProposalData, ItineraryDay, Activity, SectionVisibility, FlightLeg, Accommodation, SectionKey } from "@/types/proposal";
import { createActivity, createDay, createPricingLine, createFlightLeg, createAccommodation, defaultSectionOrder } from "@/types/proposal";
import { normalizeHexInput } from "@/lib/brand";

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
  defaultOpen = false,
  sectionKey,
  visible,
  onToggleVisible,
  dragHandleProps,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionKey?: keyof SectionVisibility;
  visible?: boolean;
  onToggleVisible?: () => void;
  dragHandleProps?: Record<string, any>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className={`border-border/50 ${visible === false ? "opacity-50" : ""}`}>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          {dragHandleProps && (
            <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-1 text-muted-foreground/40 hover:text-muted-foreground touch-none">
              <GripVertical className="h-4 w-4" />
            </button>
          )}
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

function SortableSection({ id, children }: { id: string; children: (dragHandleProps: Record<string, any>) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

function CollapsibleHotel({
  defaultOpen = false,
  hotelName,
  location,
  onDelete,
  children,
}: {
  defaultOpen?: boolean;
  hotelName: string;
  location?: string;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/40 rounded-lg bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
        <button className="flex items-center gap-2 flex-1 text-left" onClick={() => setOpen(!open)}>
          {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="font-body font-semibold text-sm text-foreground">{hotelName}</span>
          {location && <span className="text-xs text-muted-foreground">· {location}</span>}
        </button>
        <Button variant="travel-ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive/60 hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {open && children}
    </div>
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

  const brand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "", showAgencyNameWithLogo: true };
  const vis = data.sectionVisibility || { hero: true, overview: true, flights: true, accommodations: true, itinerary: true, inclusions: true, pricing: true, essentials: true, terms: true, agent: true };
  const flights = data.flights || [];
  const accommodations = data.accommodations || [];
  const sectionOrder = data.sectionOrder || defaultSectionOrder;
  const terms = data.terms || { cancellationPolicy: "", travelInsurance: "", bookingTerms: "", liability: "", showCancellation: true, showInsurance: true, showBookingTerms: true, showLiability: true };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as SectionKey);
      const newIndex = sectionOrder.indexOf(over.id as SectionKey);
      update("sectionOrder", arrayMove(sectionOrder, oldIndex, newIndex));
    }
  };

  const sectionLabels: Record<SectionKey, string> = {
    overview: "🌍 Overview", flights: "✈️ Flights", accommodations: "🏨 Hotels",
    itinerary: "📋 Itinerary", inclusions: "✅ Included", pricing: "💰 Pricing",
    essentials: "🧳 Essentials", terms: "📄 Terms", agent: "🧑‍💼 Agent",
  };

  // Map each section key to its title for CollapsibleSection
  const sectionTitles: Record<SectionKey, string> = {
    overview: "👤 Client Details",
    flights: "✈️ Flights",
    accommodations: "🏨 Accommodations",
    itinerary: "📅 Itinerary Days",
    inclusions: "✅ What's Included",
    pricing: "💰 Pricing",
    essentials: "🧳 Travel Essentials",
    terms: "📄 Terms & Conditions",
    agent: "🧑‍💼 Agent Info",
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Proposal Builder</h2>
        <p className="text-sm text-muted-foreground font-body mt-1">Fill in the details below — preview updates live. Drag sections to reorder.</p>
      </div>

      {/* Brand Settings */}
      <CollapsibleSection title="🎨 Brand & Colors" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Logo</FieldLabel>
            <ImageUploadField value={brand.logoUrl} onChange={(url) => update("brand", { ...brand, logoUrl: url })} placeholder="Paste logo URL" />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2">
            <div>
              <p className="text-sm font-body font-medium text-foreground">Show agency name with logo</p>
              <p className="text-xs text-muted-foreground font-body">Keeps both logo and agency name visible in top navigation.</p>
            </div>
            <Switch
              checked={brand.showAgencyNameWithLogo ?? true}
              onCheckedChange={(checked) => update("brand", { ...brand, showAgencyNameWithLogo: checked })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Primary Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={brand.primaryColor || "#C2631A"} onChange={(e) => update("brand", { ...brand, primaryColor: e.target.value.toUpperCase() })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input
                  value={brand.primaryColor}
                  onChange={(e) => update("brand", { ...brand, primaryColor: normalizeHexInput(e.target.value) })}
                  placeholder="#C2631A"
                  className="h-8 text-sm flex-1"
                  inputMode="text"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Secondary Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={brand.secondaryColor || "#337A8A"} onChange={(e) => update("brand", { ...brand, secondaryColor: e.target.value.toUpperCase() })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input
                  value={brand.secondaryColor}
                  onChange={(e) => update("brand", { ...brand, secondaryColor: normalizeHexInput(e.target.value) })}
                  placeholder="#337A8A"
                  className="h-8 text-sm flex-1"
                  inputMode="text"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Accent Color</FieldLabel>
              <div className="flex gap-2 items-center">
                <input type="color" value={brand.accentColor || "#D4A824"} onChange={(e) => update("brand", { ...brand, accentColor: e.target.value.toUpperCase() })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                <Input
                  value={brand.accentColor}
                  onChange={(e) => update("brand", { ...brand, accentColor: normalizeHexInput(e.target.value) })}
                  placeholder="#D4A824"
                  className="h-8 text-sm flex-1"
                  inputMode="text"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Use hex colors only (example: #1A2B3C). Leave blank to use defaults.</p>
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
            <FieldLabel>Hero Images</FieldLabel>
            <div className="mt-1.5">
              <SortableImageGrid
                primaryImage={data.heroImageUrl}
                galleryImages={data.heroImageUrls || []}
                onReorder={(primary, gallery) => {
                  onChange({ ...data, heroImageUrl: primary, heroImageUrls: gallery });
                }}
                onUpload={(files) => {
                  Array.from(files).forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string;
                      if (!data.heroImageUrl) { update("heroImageUrl", url); }
                      else { update("heroImageUrls", [...(data.heroImageUrls || []), url]); }
                    };
                    reader.readAsDataURL(file);
                  });
                }}
              />
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <Input placeholder="Paste image URL..." className="h-7 text-xs flex-1" onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (!val) return;
                  if (!data.heroImageUrl) { update("heroImageUrl", val); }
                  else { update("heroImageUrls", [...(data.heroImageUrls || []), val]); }
                  (e.target as HTMLInputElement).value = "";
                }
              }} />
            </div>
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          {sectionOrder.map((key) => (
            <SortableSection key={key} id={key}>
              {(dragHandleProps) => {
                switch (key) {
                  case "overview":
                    return (
                      <CollapsibleSection title={sectionTitles.overview} sectionKey="overview" visible={vis.overview} onToggleVisible={() => toggleSection("overview")} dragHandleProps={dragHandleProps}>
                        <div className="space-y-3">
                          <div>
                            <FieldLabel>Client Name</FieldLabel>
                            <Input value={data.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Michael & Sarah Johnson" />
                          </div>
                          <div>
                            <FieldLabel>Introduction Text</FieldLabel>
                            <RichTextEditor content={data.introText} onChange={(html) => update("introText", html)} placeholder="Write a compelling introduction for your client..." minHeight="200px" />
                          </div>
                        </div>
                      </CollapsibleSection>
                    );

                  case "flights":
                    return (
                      <CollapsibleSection title={sectionTitles.flights} sectionKey="flights" visible={vis.flights} onToggleVisible={() => toggleSection("flights")} defaultOpen={false} dragHandleProps={dragHandleProps}>
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
                                  <DatePickerField value={flight.date} onChange={(val) => updateFlight(i, "date", val)} placeholder="Select date" />
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
                    );

                  case "accommodations":
                    return (
                      <CollapsibleSection title={sectionTitles.accommodations} sectionKey="accommodations" visible={vis.accommodations} onToggleVisible={() => toggleSection("accommodations")} defaultOpen={false} dragHandleProps={dragHandleProps}>
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
                                  if (target === "main") { updateAccField("imageUrl", url); }
                                  else { updateAccField("galleryUrls", [...accGallery, url]); }
                                };
                                reader.readAsDataURL(file);
                              });
                              e.target.value = "";
                            };

                            const removeGalleryImage = (idx: number) => {
                              updateAccField("galleryUrls", accGallery.filter((_: string, j: number) => j !== idx));
                            };

                            return (
                              <CollapsibleHotel key={acc.id} defaultOpen={i === 0} hotelName={acc.hotelName || `Hotel ${i + 1}`} location={acc.location} onDelete={() => update("accommodations", accommodations.filter((_, idx) => idx !== i))}>
                                <div className="border-t border-border/30">
                                  <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent h-9 px-3">
                                      <TabsTrigger value="general" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">General Info</TabsTrigger>
                                      <TabsTrigger value="media" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Media</TabsTrigger>
                                      <TabsTrigger value="details" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Details</TabsTrigger>
                                    </TabsList>
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
                                          <DatePickerField value={acc.checkIn} onChange={(val) => updateAccommodation(i, "checkIn", val)} placeholder="Check-in" />
                                        </div>
                                        <div>
                                          <FieldLabel>Check-out</FieldLabel>
                                          <DatePickerField value={acc.checkOut} onChange={(val) => updateAccommodation(i, "checkOut", val)} placeholder="Check-out" />
                                        </div>
                                        <div>
                                          <FieldLabel>Nights</FieldLabel>
                                          <Input value={acc.nights} onChange={(e) => updateAccommodation(i, "nights", e.target.value)} placeholder="2" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Lodging Description</FieldLabel>
                                        <RichTextEditor content={acc.description} onChange={(html) => updateAccommodation(i, "description", html)} placeholder="Describe the hotel, its atmosphere, unique features..." minHeight="180px" />
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="media" className="p-3 space-y-3 mt-0">
                                      <div>
                                        <FieldLabel>Displayed Photos</FieldLabel>
                                        <div className="mt-1.5">
                                          <SortableImageGrid
                                            primaryImage={acc.imageUrl}
                                            galleryImages={accGallery}
                                            onPrimaryChange={(url) => updateAccField("imageUrl", url)}
                                            onGalleryChange={(urls) => updateAccField("galleryUrls", urls)}
                                            primaryAspectClass="aspect-[4/3]"
                                            onUpload={(files) => handleImageUpload({ target: { files, value: "" } } as any, acc.imageUrl ? "gallery" : "main")}
                                          />
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
                                    <TabsContent value="details" className="p-3 space-y-2 mt-0">
                                      <div>
                                        <FieldLabel>Highlights</FieldLabel>
                                        <Textarea value={accHighlights.join("\n")} onChange={(e) => updateAccField("highlights", e.target.value.split("\n").filter(Boolean))} placeholder="One highlight per line&#10;e.g. Tagus River panoramic views&#10;Walking distance to historic Alfama" className="text-xs min-h-[120px] resize-y" />
                                      </div>
                                      <div>
                                        <FieldLabel>Amenities</FieldLabel>
                                        <Textarea value={accAmenities.join("\n")} onChange={(e) => updateAccField("amenities", e.target.value.split("\n").filter(Boolean))} placeholder="One amenity per line&#10;e.g. Spa & Wellness Center&#10;Rooftop Pool&#10;24h Room Service" className="text-xs min-h-[120px] resize-y" />
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </CollapsibleHotel>
                            );
                          })}
                          <div className="flex gap-2">
                            <Button variant="travel-ghost" size="sm" onClick={() => update("accommodations", [...accommodations, createAccommodation()])} className="text-primary text-xs h-7">
                              <Plus className="h-3 w-3 mr-1" /> Add Hotel
                            </Button>
                            <HotelSearchDialog onSelect={(hotelData) => {
                              const newAcc = {
                                ...createAccommodation(),
                                hotelName: hotelData.hotelName,
                                location: hotelData.location,
                                description: hotelData.description,
                                starRating: hotelData.starRating,
                                amenities: hotelData.amenities,
                                highlights: hotelData.highlights,
                                imageUrl: hotelData.imageUrl,
                                galleryUrls: hotelData.galleryUrls || [],
                              };
                              update("accommodations", [...accommodations, newAcc]);
                            }}>
                              <Button variant="travel-outline" size="sm" className="text-xs h-7">
                                <Search className="h-3 w-3 mr-1" /> Search Hotels
                              </Button>
                            </HotelSearchDialog>
                          </div>
                        </div>
                      </CollapsibleSection>
                    );

                  case "itinerary":
                    return (
                      <CollapsibleSection title={sectionTitles.itinerary} sectionKey="itinerary" visible={vis.itinerary} onToggleVisible={() => toggleSection("itinerary")} dragHandleProps={dragHandleProps}>
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
                                  <DatePickerField value={day.date} onChange={(val) => updateDay(dayIdx, { ...day, date: val })} placeholder="Select date" />
                                </div>
                              </div>
                              <div className="mb-3">
                                <div className="mb-2">
                                  <FieldLabel>Location</FieldLabel>
                                  <Input value={day.location} onChange={(e) => updateDay(dayIdx, { ...day, location: e.target.value })} placeholder="Lisbon" className="h-8 text-sm" />
                                </div>
                                <div>
                                  <FieldLabel>Day Images</FieldLabel>
                                  <div className="mt-1.5">
                                    <SortableImageGrid
                                      primaryImage={day.imageUrl}
                                      galleryImages={day.imageUrls || []}
                                      onPrimaryChange={(url) => updateDay(dayIdx, { ...day, imageUrl: url })}
                                      onGalleryChange={(urls) => updateDay(dayIdx, { ...day, imageUrls: urls })}
                                      aspectClass="aspect-[4/3]"
                                      primaryAspectClass="aspect-[4/3]"
                                      primaryLarge={false}
                                      onUpload={(files) => {
                                        Array.from(files).forEach((file) => {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                            const url = ev.target?.result as string;
                                            if (!day.imageUrl) { updateDay(dayIdx, { ...day, imageUrl: url }); }
                                            else { updateDay(dayIdx, { ...day, imageUrls: [...(day.imageUrls || []), url] }); }
                                          };
                                          reader.readAsDataURL(file);
                                        });
                                      }}
                                    />
                                  </div>
                                  <div className="flex gap-1.5 mt-1.5">
                                    <Input placeholder="Paste image URL..." className="h-7 text-xs flex-1" onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (!val) return;
                                        if (!day.imageUrl) { updateDay(dayIdx, { ...day, imageUrl: val }); }
                                        else { updateDay(dayIdx, { ...day, imageUrls: [...(day.imageUrls || []), val] }); }
                                        (e.target as HTMLInputElement).value = "";
                                      }
                                    }} />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <FieldLabel>Activities</FieldLabel>
                                {day.activities.map((act, actIdx) => (
                                  <div key={act.id} className="bg-background rounded-lg p-3 border border-border/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <select value={act.type} onChange={(e) => updateActivity(dayIdx, actIdx, "type", e.target.value)} className="h-7 text-xs rounded-md border border-input bg-background px-1.5 font-body">
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
                                    <Textarea value={act.description} onChange={(e) => updateActivity(dayIdx, actIdx, "description", e.target.value)} placeholder="Describe this activity in detail..." className="text-sm min-h-[100px] resize-y" />
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
                    );

                  case "inclusions":
                    return (
                      <CollapsibleSection title={sectionTitles.inclusions} defaultOpen={false} sectionKey="inclusions" visible={vis.inclusions} onToggleVisible={() => toggleSection("inclusions")} dragHandleProps={dragHandleProps}>
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
                    );

                  case "pricing":
                    return (
                      <CollapsibleSection title={sectionTitles.pricing} defaultOpen={false} sectionKey="pricing" visible={vis.pricing} onToggleVisible={() => toggleSection("pricing")} dragHandleProps={dragHandleProps}>
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
                    );

                  case "essentials":
                    return (
                      <CollapsibleSection title={sectionTitles.essentials} defaultOpen={false} sectionKey="essentials" visible={vis.essentials} onToggleVisible={() => toggleSection("essentials")} dragHandleProps={dragHandleProps}>
                        <div className="space-y-2">
                          {([
                            { field: "visaRequirements" as const, label: "Visa Requirements", placeholder: "Visa requirements for destination..." },
                            { field: "passportInfo" as const, label: "Passport Info", placeholder: "Valid passport required..." },
                            { field: "currency" as const, label: "Currency", placeholder: "Euro (€)" },
                            { field: "language" as const, label: "Language", placeholder: "Portuguese" },
                            { field: "timeZone" as const, label: "Time Zone", placeholder: "WET (UTC+0)" },
                            { field: "weatherInfo" as const, label: "Weather Info", placeholder: "Expected weather conditions..." },
                            { field: "packingTips" as const, label: "Packing Tips", placeholder: "Comfortable walking shoes, layers..." },
                            { field: "emergencyContacts" as const, label: "Emergency Contacts", placeholder: "Local emergency numbers..." },
                          ]).map(({ field, label, placeholder }) => (
                            <div key={field}>
                              <FieldLabel>{label}</FieldLabel>
                              <Input value={data.essentials[field]} onChange={(e) => update("essentials", { ...data.essentials, [field]: e.target.value })} placeholder={placeholder} className="h-8 text-sm" />
                            </div>
                          ))}
                        </div>
                      </CollapsibleSection>
                    );

                  case "terms":
                    return (
                      <CollapsibleSection title={sectionTitles.terms} defaultOpen={false} sectionKey="terms" visible={vis.terms} onToggleVisible={() => toggleSection("terms")} dragHandleProps={dragHandleProps}>
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
                                <button onClick={() => update("terms", { ...terms, [key]: !terms[key] })} className={`p-1 rounded transition-colors ${terms[key] !== false ? "text-primary" : "text-muted-foreground/40"}`}>
                                  {terms[key] !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                              {terms[key] !== false && (
                                <div className="p-3">
                                  <RichTextEditor content={terms[field]} onChange={(html) => update("terms", { ...terms, [field]: html })} placeholder={placeholder} minHeight="120px" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleSection>
                    );

                  case "agent":
                    return (
                      <CollapsibleSection title={sectionTitles.agent} defaultOpen={false} sectionKey="agent" visible={vis.agent} onToggleVisible={() => toggleSection("agent")} dragHandleProps={dragHandleProps}>
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
                          <div>
                            <FieldLabel>Agent Photo</FieldLabel>
                            <ImageUploadField value={data.agent.photoUrl} onChange={(url) => update("agent", { ...data.agent, photoUrl: url })} placeholder="Agent photo URL" />
                          </div>
                          <div>
                            <FieldLabel>Agency Logo</FieldLabel>
                            <ImageUploadField value={data.agent.logoUrl} onChange={(url) => update("agent", { ...data.agent, logoUrl: url })} placeholder="Agency logo URL" />
                          </div>
                        </div>
                      </CollapsibleSection>
                    );

                  default:
                    return null;
                }
              }}
            </SortableSection>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
