import { useState, useRef, ReactNode } from "react";
import { uploadImage, uploadImages } from "@/lib/uploadImage";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ChevronRight, Eye, EyeOff, ImagePlus, X, ArrowUp, ArrowDown, Search, Upload } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import DatePickerField from "@/components/DatePickerField";
import TimePickerDropdown from "@/components/TimePickerDropdown";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import AddressFields, { type AddressData } from "@/components/AddressFields";
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
import AgentPricingFields from "@/components/AgentPricingFields";
import type { ProposalData, ItineraryDay, Activity, SectionVisibility, FlightLeg, FlightOption, Accommodation, CruiseShip, BusTrip, BusStop, SectionKey, CheckoutSettings, PaymentOption, LocationAddress } from "@/types/proposal";
import { createActivity, createDay, createPricingLine, createFlightLeg, createFlightOption, createAccommodation, createCruiseShip, createBusTrip, createBusStop, defaultSectionOrder, createDefaultCheckout } from "@/types/proposal";
import { normalizeHexInput } from "@/lib/brand";
import { useAgentSettings } from "@/hooks/useAgentSettings";
import { useAppSettings } from "@/hooks/useAppSettings";

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
  const { settings: agentSettings } = useAgentSettings();
  const { settings: appSettings } = useAppSettings();
  
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

  const updateActivity = (dayIndex: number, actIndex: number, field: keyof Activity, value: any) => {
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

  const updateFlightLeg = (optIndex: number, legIndex: number, field: keyof FlightLeg, value: string) => {
    const opts = [...(data.flightOptions || [])];
    const legs = [...opts[optIndex].legs];
    legs[legIndex] = { ...legs[legIndex], [field]: value };
    opts[optIndex] = { ...opts[optIndex], legs };
    update("flightOptions", opts);
  };

  const updateAccommodation = (index: number, field: keyof Accommodation, value: string) => {
    const a = [...(data.accommodations || [])];
    a[index] = { ...a[index], [field]: value };
    update("accommodations", a);
  };

  const brand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "", showAgencyNameWithLogo: true };
  const resolvedPrimaryColor = agentSettings.primary_color || appSettings.primary_color;
  const resolvedSecondaryColor = agentSettings.secondary_color || appSettings.secondary_color;
  const vis = data.sectionVisibility || { hero: true, overview: true, flights: true, accommodations: true, cruiseShips: true, busTrips: true, itinerary: true, inclusions: true, pricing: true, essentials: true, terms: true, agent: true };
  const flightOptions = data.flightOptions || [];
  const accommodations = data.accommodations || [];
  const cruiseShips = data.cruiseShips || [];
  const busTrips = data.busTrips || [];
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
    cruiseShips: "🚢 Cruise Ships", busTrips: "🚌 Bus Trips",
    itinerary: "📋 Itinerary", inclusions: "✅ Included", pricing: "💰 Pricing",
    essentials: "🧳 Essentials", terms: "📄 Terms", agent: "💼 Agent",
  };

  // Map each section key to its title for CollapsibleSection
  const sectionTitles: Record<SectionKey, string> = {
    overview: "✍️ Introduction",
    flights: "✈️ Flights",
    accommodations: "🏨 Accommodations",
    cruiseShips: "🚢 Cruise Ship & Cabin",
    busTrips: "🚌 Bus Trips",
    itinerary: "📅 Itinerary Days",
    inclusions: "✅ What's Included",
    pricing: "💰 Pricing",
    essentials: "🧳 Travel Essentials",
    terms: "📄 Terms & Conditions",
    agent: "💼 Agent Info",
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Proposal Builder</h2>
        <p className="text-sm text-muted-foreground font-body mt-1">Fill in the details below — preview updates live. Drag sections to reorder.</p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant={(data as any).proposalType !== "proposal" ? "travel" : "travel-outline"}
            className="text-xs h-7"
            onClick={() => update("proposalType" as any, "group_booking")}
          >
            📋 Group Booking
          </Button>
          <Button
            size="sm"
            variant={(data as any).proposalType === "proposal" ? "travel" : "travel-outline"}
            className="text-xs h-7"
            onClick={() => update("proposalType" as any, "proposal")}
          >
            📄 Proposal
          </Button>
        </div>
      </div>

      {/* Brand Settings — pulled from global Settings */}
      <Card className="border-border/50">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-display">🎨 Brand & Colors</CardTitle>
            <a href="/settings" target="_blank" className="text-xs text-primary hover:underline font-body">Edit in Settings →</a>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 text-xs font-body text-muted-foreground">
            {(resolvedPrimaryColor || brand.primaryColor) && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: brand.primaryColor || resolvedPrimaryColor || "#ccc" }} />
                Primary
              </div>
            )}
            {(resolvedSecondaryColor || brand.secondaryColor) && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: brand.secondaryColor || resolvedSecondaryColor || "#ccc" }} />
                Secondary
              </div>
            )}
            {agentSettings.logo_url && <span>✓ Logo set</span>}
            {!resolvedPrimaryColor && !brand.primaryColor && <span>Using platform defaults</span>}
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2">
              <div>
                <p className="text-sm font-body font-medium text-foreground">Override brand for this proposal</p>
                <p className="text-xs text-muted-foreground font-body">Set custom colors for this proposal only.</p>
              </div>
              <Switch
                checked={!!(brand.primaryColor || brand.secondaryColor || brand.accentColor)}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    update("brand", { ...brand, primaryColor: "", secondaryColor: "", accentColor: "" });
                  } else {
                    update("brand", { ...brand, primaryColor: resolvedPrimaryColor, secondaryColor: resolvedSecondaryColor, accentColor: resolvedSecondaryColor });
                  }
                }}
              />
            </div>
            {(brand.primaryColor || brand.secondaryColor || brand.accentColor) && (
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Primary</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={brand.primaryColor || resolvedPrimaryColor || "#C2631A"} onChange={(e) => update("brand", { ...brand, primaryColor: e.target.value.toUpperCase() })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                      <Input value={brand.primaryColor} onChange={(e) => update("brand", { ...brand, primaryColor: normalizeHexInput(e.target.value) })} placeholder={resolvedPrimaryColor || "#C2631A"} className="h-8 text-sm flex-1" maxLength={7} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Secondary</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={brand.secondaryColor || resolvedSecondaryColor || "#337A8A"} onChange={(e) => update("brand", { ...brand, secondaryColor: e.target.value.toUpperCase(), accentColor: e.target.value.toUpperCase() })} className="w-8 h-8 rounded border border-input cursor-pointer" />
                      <Input value={brand.secondaryColor} onChange={(e) => {
                        const next = normalizeHexInput(e.target.value);
                        update("brand", { ...brand, secondaryColor: next, accentColor: next || brand.accentColor });
                      }} placeholder={resolvedSecondaryColor || "#337A8A"} className="h-8 text-sm flex-1" maxLength={7} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CollapsibleSection title="🌍 Trip Overview" sectionKey="hero" visible={vis.hero} onToggleVisible={() => toggleSection("hero")}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Destination</FieldLabel>
              <LocationAutocomplete value={data.destination} onChange={(val) => update("destination", val)} placeholder="e.g. Portugal" />
            </div>
            <div>
              <FieldLabel>Subtitle</FieldLabel>
              <Input value={data.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="e.g. Lisbon · Porto · Algarve" />
            </div>
          </div>
          <div>
            <FieldLabel>Hero Media</FieldLabel>
            <div className="flex gap-2 mt-1 mb-2">
              <Button type="button" size="sm" variant={(!data.heroMediaType || data.heroMediaType === "photos") ? "default" : "outline"} className="text-xs h-7" onClick={() => update("heroMediaType", "photos")}>
                📷 Photos
              </Button>
              <Button type="button" size="sm" variant={data.heroMediaType === "video" ? "default" : "outline"} className="text-xs h-7" onClick={() => update("heroMediaType", "video")}>
                🎬 Video
              </Button>
            </div>
            {(!data.heroMediaType || data.heroMediaType === "photos") ? (
              <>
                <div className="mt-1.5">
                  <SortableImageGrid
                    primaryImage={data.heroImageUrl}
                    galleryImages={data.heroImageUrls || []}
                    onReorder={(primary, gallery) => {
                      onChange({ ...data, heroImageUrl: primary, heroImageUrls: gallery });
                    }}
                    onUpload={async (files) => {
                      const urls = await uploadImages(files);
                      urls.forEach((url) => {
                        if (!data.heroImageUrl) { update("heroImageUrl", url); }
                        else { update("heroImageUrls", [...(data.heroImageUrls || []), url]); }
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
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <Input placeholder="YouTube, Vimeo, or direct video URL..." className="h-7 text-xs flex-1" value={data.heroVideoUrl || ""} onChange={(e) => update("heroVideoUrl", e.target.value)} />
                  <label className="cursor-pointer">
                    <input type="file" accept="video/*,audio/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadImage(f);
                      update("heroVideoUrl", url);
                    }} />
                    <Button type="button" size="sm" variant="outline" className="text-xs h-7" asChild><span>Upload</span></Button>
                  </label>
                </div>
                {data.heroVideoUrl && (
                  <div>
                    <FieldLabel>Custom Thumbnail</FieldLabel>
                    <div className="flex gap-1.5 items-center mt-1">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const url = await uploadImage(f);
                          update("heroVideoThumbnailUrl", url);
                        }} />
                        <Button type="button" size="sm" variant="outline" className="text-xs h-7" asChild><span>Upload Thumbnail</span></Button>
                      </label>
                      {data.heroVideoThumbnailUrl && (
                        <div className="relative h-10 w-16 rounded overflow-hidden border">
                          <img src={data.heroVideoThumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          <button type="button" className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5" onClick={() => update("heroVideoThumbnailUrl", "")}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {data.heroVideoUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-body font-medium text-foreground">Autoplay</p>
                        <p className="text-xs text-muted-foreground font-body">Video plays automatically on load.</p>
                      </div>
                      <Switch
                        checked={!!data.heroAutoplay}
                        onCheckedChange={(checked) => update("heroAutoplay", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-body font-medium text-foreground">Muted</p>
                        <p className="text-xs text-muted-foreground font-body">Video starts muted (required for autoplay on most browsers).</p>
                      </div>
                      <Switch
                        checked={!!data.heroMuted}
                        onCheckedChange={(checked) => update("heroMuted" as any, checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
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
                          {flightOptions.map((opt, oi) => (
                            <div key={opt.id} className="border border-border/40 rounded-lg p-3 bg-muted/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-body font-semibold text-sm text-foreground">✈️ Option {oi + 1}</span>
                                <Button variant="travel-ghost" size="icon" onClick={() => update("flightOptions", flightOptions.filter((_, idx) => idx !== oi))} className="h-7 w-7 text-destructive/60 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              {opt.legs.map((leg, li) => (
                                <div key={leg.id} className="border border-border/30 rounded-md p-2.5 bg-background/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-body text-xs font-medium text-muted-foreground">{leg.type === "departure" ? "🛫 Departure" : "🛬 Return"}</span>
                                    <Button variant="travel-ghost" size="icon" onClick={() => {
                                      const opts = [...flightOptions];
                                      opts[oi] = { ...opts[oi], legs: opts[oi].legs.filter((_, idx) => idx !== li) };
                                      update("flightOptions", opts);
                                    }} className="h-6 w-6 text-destructive/60 hover:text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <FieldLabel>Airline</FieldLabel>
                                      <Input value={leg.airline} onChange={(e) => updateFlightLeg(oi, li, "airline", e.target.value)} placeholder="TAP Air Portugal" className="h-7 text-xs" />
                                    </div>
                                    <div>
                                      <FieldLabel>Flight #</FieldLabel>
                                      <Input value={leg.flightNumber} onChange={(e) => updateFlightLeg(oi, li, "flightNumber", e.target.value)} placeholder="TP 236" className="h-7 text-xs" />
                                    </div>
                                    <div>
                                      <FieldLabel>From</FieldLabel>
                                      <LocationAutocomplete value={leg.departureAirport} onChange={(val) => updateFlightLeg(oi, li, "departureAirport", val)} placeholder="SFO – San Francisco" className="h-7 text-xs" />
                                    </div>
                                    <div>
                                      <FieldLabel>To</FieldLabel>
                                      <LocationAutocomplete value={leg.arrivalAirport} onChange={(val) => updateFlightLeg(oi, li, "arrivalAirport", val)} placeholder="LIS – Lisbon" className="h-7 text-xs" />
                                    </div>
                                    <div>
                                      <FieldLabel>Date</FieldLabel>
                                      <DatePickerField value={leg.date} onChange={(val) => updateFlightLeg(oi, li, "date", val)} placeholder="Select date" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      <div>
                                        <FieldLabel>Depart</FieldLabel>
                                        <TimePickerDropdown value={leg.departureTime} onChange={(val) => updateFlightLeg(oi, li, "departureTime", val)} />
                                      </div>
                                      <div>
                                        <FieldLabel>Arrive</FieldLabel>
                                        <TimePickerDropdown value={leg.arrivalTime} onChange={(val) => updateFlightLeg(oi, li, "arrivalTime", val)} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <Button variant="travel-ghost" size="sm" onClick={() => {
                                  const opts = [...flightOptions];
                                  opts[oi] = { ...opts[oi], legs: [...opts[oi].legs, createFlightLeg("departure")] };
                                  update("flightOptions", opts);
                                }} className="text-primary text-xs h-7">
                                  <Plus className="h-3 w-3 mr-1" /> Departure Leg
                                </Button>
                                <Button variant="travel-ghost" size="sm" onClick={() => {
                                  const opts = [...flightOptions];
                                  opts[oi] = { ...opts[oi], legs: [...opts[oi].legs, createFlightLeg("return")] };
                                  update("flightOptions", opts);
                                }} className="text-primary text-xs h-7">
                                  <Plus className="h-3 w-3 mr-1" /> Return Leg
                                </Button>
                              </div>
                              {(data as any).proposalType === "proposal" && (
                                <div className="mt-1">
                                  <FieldLabel>Price (Proposal Option)</FieldLabel>
                                  <div className="relative w-32">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                                    <Input value={opt.price || ""} onChange={(e) => {
                                      const opts = [...flightOptions];
                                      opts[oi] = { ...opts[oi], price: e.target.value };
                                      update("flightOptions", opts);
                                    }} placeholder="0.00" className="h-7 text-xs pl-5" />
                                  </div>
                                </div>
                              )}
                              <AgentPricingFields
                                pricing={opt.agentPricing}
                                onChange={(ap) => { const opts = [...flightOptions]; opts[oi] = { ...opts[oi], agentPricing: ap }; update("flightOptions", opts); }}
                              />
                            </div>
                          ))}
                          <Button variant="travel-ghost" size="sm" onClick={() => update("flightOptions", [...flightOptions, createFlightOption()])} className="text-primary text-xs h-7">
                            <Plus className="h-3 w-3 mr-1" /> Add Flight Option
                          </Button>
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

                            const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") => {
                              const files = e.target.files;
                              if (!files) return;
                              const urls = await uploadImages(files);
                              urls.forEach((url) => {
                                if (target === "main") { updateAccField("imageUrl", url); }
                                else { updateAccField("galleryUrls", [...accGallery, url]); }
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
                                      {(data as any).proposalType === "proposal" && (
                                        <div className="mt-2">
                                          <FieldLabel>Price (Proposal Option)</FieldLabel>
                                          <div className="relative w-32">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                                            <Input value={acc.price || ""} onChange={(e) => updateAccField("price", e.target.value)} placeholder="0.00" className="h-8 text-xs pl-5" />
                                          </div>
                                        </div>
                                      )}
                                      <AgentPricingFields
                                        pricing={acc.agentPricing}
                                        onChange={(ap) => { const a = [...accommodations]; a[i] = { ...a[i], agentPricing: ap }; update("accommodations", a); }}
                                      />
                                      <div>
                                        <FieldLabel>Lodging Description</FieldLabel>
                                        <RichTextEditor content={acc.description} onChange={(html) => updateAccommodation(i, "description", html)} placeholder="Describe the hotel, its atmosphere, unique features..." minHeight="180px" />
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="media" className="p-3 space-y-3 mt-0">
                                      <div>
                                        <FieldLabel>Show in Proposal</FieldLabel>
                                        <div className="mt-1.5 flex gap-1.5">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={(acc.mediaType || "photos") === "photos" ? "travel" : "travel-outline"}
                                            className="h-7 text-xs"
                                            onClick={() => updateAccField("mediaType", "photos")}
                                          >
                                            Photos
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={(acc.mediaType || "photos") === "video" ? "travel" : "travel-outline"}
                                            className="h-7 text-xs"
                                            onClick={() => updateAccField("mediaType", "video")}
                                          >
                                            Video
                                          </Button>
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Photos & Video</FieldLabel>
                                        <div className="mt-1.5">
                                          <SortableImageGrid
                                            primaryImage={acc.imageUrl}
                                            galleryImages={accGallery}
                                            onReorder={(primary, gallery) => {
                                              const a = [...(data.accommodations || [])];
                                              a[i] = { ...a[i], imageUrl: primary, galleryUrls: gallery };
                                              update("accommodations", a);
                                            }}
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
                                      <div>
                                        <FieldLabel>Video (Upload or paste URL)</FieldLabel>
                                        <div className="flex gap-1.5">
                                          <Input value={acc.videoUrl || ""} onChange={(e) => updateAccField("videoUrl", e.target.value)} placeholder="https://youtube.com/... or upload" className="h-8 text-xs flex-1" />
                                          <Button variant="travel-outline" size="sm" className="h-8 text-xs" onClick={() => {
                                            const input = document.createElement("input");
                                            input.type = "file";
                                            input.accept = "video/*,audio/*";
                                            input.onchange = async (ev) => {
                                              const file = (ev.target as HTMLInputElement).files?.[0];
                                              if (!file) return;
                                              const url = await uploadImage(file);
                                              updateAccField("videoUrl", url);
                                            };
                                            input.click();
                                          }}>
                                            <Upload className="h-3 w-3 mr-1" /> Upload
                                          </Button>
                                        </div>
                                      </div>
                                      {acc.videoUrl && (
                                        <div>
                                          <FieldLabel>Video Thumbnail</FieldLabel>
                                          <div className="flex gap-1.5 items-center">
                                            {acc.videoThumbnailUrl && (
                                              <div className="relative w-16 h-10 rounded overflow-hidden border border-border/40 shrink-0">
                                                <img src={acc.videoThumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                                <button onClick={() => updateAccField("videoThumbnailUrl", "")} className="absolute top-0 right-0 bg-foreground/70 text-background rounded-full p-0.5"><X className="h-2.5 w-2.5" /></button>
                                              </div>
                                            )}
                                            <Button variant="travel-outline" size="sm" className="h-8 text-xs" onClick={() => {
                                              const input = document.createElement("input");
                                              input.type = "file";
                                              input.accept = "image/*";
                                              input.onchange = async (ev) => {
                                                const file = (ev.target as HTMLInputElement).files?.[0];
                                                if (!file) return;
                                                const url = await uploadImage(file);
                                                updateAccField("videoThumbnailUrl", url);
                                              };
                                              input.click();
                                            }}>
                                              <ImagePlus className="h-3 w-3 mr-1" /> {acc.videoThumbnailUrl ? "Replace" : "Upload Thumbnail"}
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </TabsContent>
                                    <TabsContent value="details" className="p-3 space-y-2 mt-0">
                                      <div>
                                        <FieldLabel>Highlights</FieldLabel>
                                        <Textarea value={accHighlights.join("\n")} onChange={(e) => updateAccField("highlights", e.target.value.split("\n"))} placeholder="One highlight per line&#10;e.g. Tagus River panoramic views&#10;Walking distance to historic Alfama" className="text-xs min-h-[120px] resize-y" />
                                      </div>
                                      <div>
                                        <FieldLabel>Amenities</FieldLabel>
                                        <Textarea value={accAmenities.join("\n")} onChange={(e) => updateAccField("amenities", e.target.value.split("\n"))} placeholder="One amenity per line&#10;e.g. Spa & Wellness Center&#10;Rooftop Pool&#10;24h Room Service" className="text-xs min-h-[120px] resize-y" />
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

                  case "cruiseShips":
                    return (
                      <CollapsibleSection title={sectionTitles.cruiseShips} sectionKey="cruiseShips" visible={vis.cruiseShips} onToggleVisible={() => toggleSection("cruiseShips")} defaultOpen={false} dragHandleProps={dragHandleProps}>
                        <div className="space-y-4">
                          {cruiseShips.map((ship, i) => {
                            const shipAmenities = ship.amenities || [];
                            const shipHighlights = ship.highlights || [];
                            const shipGallery = ship.galleryUrls || [];
                            const updateShipField = (field: string, value: any) => {
                              const s = [...(data.cruiseShips || [])];
                              s[i] = { ...s[i], [field]: value };
                              update("cruiseShips", s);
                            };

                            return (
                              <CollapsibleHotel key={ship.id} defaultOpen={i === 0} hotelName={ship.shipName || `Ship ${i + 1}`} location={ship.cruiseLine} onDelete={() => update("cruiseShips", cruiseShips.filter((_, idx) => idx !== i))}>
                                <div className="border-t border-border/30">
                                  <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent h-9 px-3">
                                      <TabsTrigger value="general" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Ship & Cabin</TabsTrigger>
                                      <TabsTrigger value="ports" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Ports & Dates</TabsTrigger>
                                      <TabsTrigger value="media" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Media</TabsTrigger>
                                      <TabsTrigger value="details" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Details</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="general" className="p-3 space-y-2 mt-0">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <FieldLabel>Ship Name</FieldLabel>
                                          <Input value={ship.shipName} onChange={(e) => updateShipField("shipName", e.target.value)} placeholder="Symphony of the Seas" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Cruise Line</FieldLabel>
                                          <Input value={ship.cruiseLine} onChange={(e) => updateShipField("cruiseLine", e.target.value)} placeholder="Royal Caribbean" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <FieldLabel>Cabin Type</FieldLabel>
                                          <Input value={ship.cabinType} onChange={(e) => updateShipField("cabinType", e.target.value)} placeholder="Balcony Suite" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Cabin #</FieldLabel>
                                          <Input value={ship.cabinNumber} onChange={(e) => updateShipField("cabinNumber", e.target.value)} placeholder="D-1234" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Deck</FieldLabel>
                                          <Input value={ship.deck} onChange={(e) => updateShipField("deck", e.target.value)} placeholder="Deck 9" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Description</FieldLabel>
                                        <RichTextEditor content={ship.description} onChange={(html) => updateShipField("description", html)} placeholder="Describe the ship, cabin features, onboard experience..." minHeight="150px" />
                                      </div>
                                      {(data as any).proposalType === "proposal" && (
                                        <div className="mt-2">
                                          <FieldLabel>Price (Proposal Option)</FieldLabel>
                                          <div className="relative w-32">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                                            <Input value={ship.price || ""} onChange={(e) => updateShipField("price", e.target.value)} placeholder="0.00" className="h-8 text-xs pl-5" />
                                          </div>
                                        </div>
                                      )}
                                      <AgentPricingFields
                                        pricing={ship.agentPricing}
                                        onChange={(ap) => { const s = [...cruiseShips]; s[i] = { ...s[i], agentPricing: ap }; update("cruiseShips", s); }}
                                      />
                                    </TabsContent>
                                    <TabsContent value="ports" className="p-3 space-y-2 mt-0">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <FieldLabel>Embarkation Port</FieldLabel>
                                          <Input value={ship.embarkationPort} onChange={(e) => updateShipField("embarkationPort", e.target.value)} placeholder="Miami, FL" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Disembarkation Port</FieldLabel>
                                          <Input value={ship.disembarkationPort} onChange={(e) => updateShipField("disembarkationPort", e.target.value)} placeholder="Miami, FL" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <FieldLabel>Embark Date</FieldLabel>
                                          <DatePickerField value={ship.embarkationDate} onChange={(val) => updateShipField("embarkationDate", val)} placeholder="Embark date" />
                                        </div>
                                        <div>
                                          <FieldLabel>Disembark Date</FieldLabel>
                                          <DatePickerField value={ship.disembarkationDate} onChange={(val) => updateShipField("disembarkationDate", val)} placeholder="Disembark date" />
                                        </div>
                                      </div>
                                      <div className="w-1/3">
                                        <FieldLabel>Nights</FieldLabel>
                                        <Input value={ship.nights} onChange={(e) => updateShipField("nights", e.target.value)} placeholder="7" className="h-8 text-xs" />
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="media" className="p-3 space-y-3 mt-0">
                                      <div>
                                        <FieldLabel>Show in Proposal</FieldLabel>
                                        <div className="mt-1.5 flex gap-1.5">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={(ship.mediaType || "photos") === "photos" ? "travel" : "travel-outline"}
                                            className="h-7 text-xs"
                                            onClick={() => updateShipField("mediaType", "photos")}
                                          >
                                            Photos
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={(ship.mediaType || "photos") === "video" ? "travel" : "travel-outline"}
                                            className="h-7 text-xs"
                                            onClick={() => updateShipField("mediaType", "video")}
                                          >
                                            Video
                                          </Button>
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Photos & Video</FieldLabel>
                                        <div className="mt-1.5">
                                          <SortableImageGrid
                                            primaryImage={ship.imageUrl}
                                            galleryImages={shipGallery}
                                            onReorder={(primary, gallery) => {
                                              const s = [...(data.cruiseShips || [])];
                                              s[i] = { ...s[i], imageUrl: primary, galleryUrls: gallery };
                                              update("cruiseShips", s);
                                            }}
                                            primaryAspectClass="aspect-[4/3]"
                                            onUpload={async (files) => {
                                              const urls = await uploadImages(files);
                                              urls.forEach((url) => {
                                                if (!ship.imageUrl) { updateShipField("imageUrl", url); }
                                                else { updateShipField("galleryUrls", [...shipGallery, url]); }
                                              });
                                            }}
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
                                              if (!ship.imageUrl) { updateShipField("imageUrl", val); }
                                              else { updateShipField("galleryUrls", [...shipGallery, val]); }
                                              (e.target as HTMLInputElement).value = "";
                                            }
                                          }} />
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Video (Upload or paste URL)</FieldLabel>
                                        <div className="flex gap-1.5">
                                          <Input value={ship.videoUrl || ""} onChange={(e) => updateShipField("videoUrl", e.target.value)} placeholder="https://youtube.com/... or upload" className="h-8 text-xs flex-1" />
                                          <Button variant="travel-outline" size="sm" className="h-8 text-xs" onClick={() => {
                                            const input = document.createElement("input");
                                            input.type = "file";
                                            input.accept = "video/*,audio/*";
                                            input.onchange = async (ev) => {
                                              const file = (ev.target as HTMLInputElement).files?.[0];
                                              if (!file) return;
                                              const url = await uploadImage(file);
                                              updateShipField("videoUrl", url);
                                            };
                                            input.click();
                                          }}>
                                            <Upload className="h-3 w-3 mr-1" /> Upload
                                          </Button>
                                        </div>
                                      </div>
                                      {ship.videoUrl && (
                                        <div>
                                          <FieldLabel>Video Thumbnail</FieldLabel>
                                          <div className="flex gap-1.5 items-center">
                                            {ship.videoThumbnailUrl && (
                                              <div className="relative w-16 h-10 rounded overflow-hidden border border-border/40 shrink-0">
                                                <img src={ship.videoThumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                                <button onClick={() => updateShipField("videoThumbnailUrl", "")} className="absolute top-0 right-0 bg-foreground/70 text-background rounded-full p-0.5"><X className="h-2.5 w-2.5" /></button>
                                              </div>
                                            )}
                                            <Button variant="travel-outline" size="sm" className="h-8 text-xs" onClick={() => {
                                              const input = document.createElement("input");
                                              input.type = "file";
                                              input.accept = "image/*";
                                              input.onchange = async (ev) => {
                                                const file = (ev.target as HTMLInputElement).files?.[0];
                                                if (!file) return;
                                                const url = await uploadImage(file);
                                                updateShipField("videoThumbnailUrl", url);
                                              };
                                              input.click();
                                            }}>
                                              <ImagePlus className="h-3 w-3 mr-1" /> {ship.videoThumbnailUrl ? "Replace" : "Upload Thumbnail"}
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </TabsContent>
                                    <TabsContent value="details" className="p-3 space-y-2 mt-0">
                                      <div>
                                        <FieldLabel>Highlights</FieldLabel>
                                        <Textarea value={shipHighlights.join("\n")} onChange={(e) => updateShipField("highlights", e.target.value.split("\n"))} placeholder="One highlight per line&#10;e.g. Private balcony with ocean views&#10;Specialty dining included" className="text-xs min-h-[120px] resize-y" />
                                      </div>
                                      <div>
                                        <FieldLabel>Ship Amenities</FieldLabel>
                                        <Textarea value={shipAmenities.join("\n")} onChange={(e) => updateShipField("amenities", e.target.value.split("\n"))} placeholder="One amenity per line&#10;e.g. Main Pool & Water Slides&#10;Broadway Shows&#10;Specialty Restaurants" className="text-xs min-h-[120px] resize-y" />
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </CollapsibleHotel>
                            );
                          })}
                          <Button variant="travel-ghost" size="sm" onClick={() => update("cruiseShips", [...cruiseShips, createCruiseShip()])} className="text-primary text-xs h-7">
                            <Plus className="h-3 w-3 mr-1" /> Add Ship
                          </Button>
                        </div>
                      </CollapsibleSection>
                    );


                  case "busTrips":
                    return (
                      <CollapsibleSection title={sectionTitles.busTrips} sectionKey="busTrips" visible={vis.busTrips} onToggleVisible={() => toggleSection("busTrips")} defaultOpen={false} dragHandleProps={dragHandleProps}>
                        <div className="space-y-4">
                          {busTrips.map((trip, i) => {
                            const tripAmenities = trip.amenities || [];
                            const tripHighlights = trip.highlights || [];
                            const tripGallery = trip.galleryUrls || [];
                            const tripStops = trip.stops || [];
                            const updateTripField = (field: string, value: any) => {
                              const t = [...(data.busTrips || [])];
                              t[i] = { ...t[i], [field]: value };
                              update("busTrips", t);
                            };

                            return (
                              <CollapsibleHotel key={trip.id} defaultOpen={i === 0} hotelName={trip.routeName || `Bus Trip ${i + 1}`} location={trip.busCompany} onDelete={() => update("busTrips", busTrips.filter((_, idx) => idx !== i))}>
                                <div className="border-t border-border/30">
                                  <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent h-9 px-3">
                                      <TabsTrigger value="general" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Route Info</TabsTrigger>
                                      <TabsTrigger value="schedule" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Schedule</TabsTrigger>
                                      <TabsTrigger value="stops" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Stops</TabsTrigger>
                                      <TabsTrigger value="media" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Media</TabsTrigger>
                                      <TabsTrigger value="details" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Details</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="general" className="p-3 space-y-2 mt-0">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <FieldLabel>Route Name</FieldLabel>
                                          <Input value={trip.routeName} onChange={(e) => updateTripField("routeName", e.target.value)} placeholder="Lisbon → Porto Express" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Bus Company</FieldLabel>
                                          <Input value={trip.busCompany} onChange={(e) => updateTripField("busCompany", e.target.value)} placeholder="FlixBus" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <FieldLabel>Bus Type</FieldLabel>
                                          <Input value={trip.busType} onChange={(e) => updateTripField("busType", e.target.value)} placeholder="Coach / Mini Bus" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Seat Type</FieldLabel>
                                          <Input value={trip.seatType} onChange={(e) => updateTripField("seatType", e.target.value)} placeholder="Reclining / Standard" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Duration</FieldLabel>
                                          <Input value={trip.duration} onChange={(e) => updateTripField("duration", e.target.value)} placeholder="3h 30m" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Description</FieldLabel>
                                        <RichTextEditor content={trip.description} onChange={(html) => updateTripField("description", html)} placeholder="Describe the bus journey, scenery, comfort..." minHeight="120px" />
                                      </div>
                                      {(data as any).proposalType === "proposal" && (
                                        <div className="mt-2">
                                          <FieldLabel>Price (Proposal Option)</FieldLabel>
                                          <div className="relative w-32">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                                            <Input value={trip.price || ""} onChange={(e) => updateTripField("price", e.target.value)} placeholder="0.00" className="h-8 text-xs pl-5" />
                                          </div>
                                        </div>
                                      )}
                                      <AgentPricingFields
                                        pricing={trip.agentPricing}
                                        onChange={(ap) => { const t = [...busTrips]; t[i] = { ...t[i], agentPricing: ap }; update("busTrips", t); }}
                                      />
                                    </TabsContent>
                                    <TabsContent value="schedule" className="p-3 space-y-2 mt-0">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <FieldLabel>Pickup Location</FieldLabel>
                                          <Input value={trip.pickupLocation} onChange={(e) => updateTripField("pickupLocation", e.target.value)} placeholder="Lisbon Central Bus Station" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Dropoff Location</FieldLabel>
                                          <Input value={trip.dropoffLocation} onChange={(e) => updateTripField("dropoffLocation", e.target.value)} placeholder="Porto Bus Terminal" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <FieldLabel>Pickup Date</FieldLabel>
                                          <DatePickerField value={trip.pickupDate} onChange={(val) => updateTripField("pickupDate", val)} placeholder="Pickup date" />
                                        </div>
                                        <div>
                                          <FieldLabel>Dropoff Date</FieldLabel>
                                          <DatePickerField value={trip.dropoffDate} onChange={(val) => updateTripField("dropoffDate", val)} placeholder="Dropoff date" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <FieldLabel>Pickup Time</FieldLabel>
                                          <Input value={trip.pickupTime} onChange={(e) => updateTripField("pickupTime", e.target.value)} placeholder="8:00 AM" className="h-8 text-xs" />
                                        </div>
                                        <div>
                                          <FieldLabel>Dropoff Time</FieldLabel>
                                          <Input value={trip.dropoffTime} onChange={(e) => updateTripField("dropoffTime", e.target.value)} placeholder="11:30 AM" className="h-8 text-xs" />
                                        </div>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="stops" className="p-3 space-y-2 mt-0">
                                      {tripStops.map((stop, si) => (
                                        <div key={stop.id} className="p-2 border border-border/30 rounded-lg space-y-1.5 relative">
                                          <button type="button" className="absolute top-1 right-1 text-destructive" onClick={() => {
                                            const s = tripStops.filter((_, idx) => idx !== si);
                                            updateTripField("stops", s);
                                          }}><X className="h-3 w-3" /></button>
                                          <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-3">
                                              <FieldLabel>Stop Location</FieldLabel>
                                              <Input value={stop.location} onChange={(e) => {
                                                const s = [...tripStops]; s[si] = { ...s[si], location: e.target.value }; updateTripField("stops", s);
                                              }} placeholder="Coimbra Bus Station" className="h-7 text-xs" />
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-3 gap-2">
                                            <div>
                                              <FieldLabel>Arrival</FieldLabel>
                                              <Input value={stop.arrivalTime} onChange={(e) => {
                                                const s = [...tripStops]; s[si] = { ...s[si], arrivalTime: e.target.value }; updateTripField("stops", s);
                                              }} placeholder="9:30 AM" className="h-7 text-xs" />
                                            </div>
                                            <div>
                                              <FieldLabel>Departure</FieldLabel>
                                              <Input value={stop.departureTime} onChange={(e) => {
                                                const s = [...tripStops]; s[si] = { ...s[si], departureTime: e.target.value }; updateTripField("stops", s);
                                              }} placeholder="9:45 AM" className="h-7 text-xs" />
                                            </div>
                                            <div>
                                              <FieldLabel>Notes</FieldLabel>
                                              <Input value={stop.notes} onChange={(e) => {
                                                const s = [...tripStops]; s[si] = { ...s[si], notes: e.target.value }; updateTripField("stops", s);
                                              }} placeholder="15 min rest stop" className="h-7 text-xs" />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <Button variant="travel-ghost" size="sm" onClick={() => updateTripField("stops", [...tripStops, createBusStop()])} className="text-primary text-xs h-7">
                                        <Plus className="h-3 w-3 mr-1" /> Add Stop
                                      </Button>
                                    </TabsContent>
                                    <TabsContent value="media" className="p-3 space-y-3 mt-0">
                                      <div>
                                        <FieldLabel>Show in Proposal</FieldLabel>
                                        <div className="mt-1.5 flex gap-1.5">
                                          <Button type="button" size="sm" variant={(trip.mediaType || "photos") === "photos" ? "travel" : "travel-outline"} className="h-7 text-xs" onClick={() => updateTripField("mediaType", "photos")}>Photos</Button>
                                          <Button type="button" size="sm" variant={(trip.mediaType || "photos") === "video" ? "travel" : "travel-outline"} className="h-7 text-xs" onClick={() => updateTripField("mediaType", "video")}>Video</Button>
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Photos</FieldLabel>
                                        <div className="mt-1.5">
                                          <SortableImageGrid
                                            primaryImage={trip.imageUrl}
                                            galleryImages={tripGallery}
                                            onReorder={(primary, gallery) => {
                                              const t = [...(data.busTrips || [])];
                                              t[i] = { ...t[i], imageUrl: primary, galleryUrls: gallery };
                                              update("busTrips", t);
                                            }}
                                            primaryAspectClass="aspect-[4/3]"
                                            onUpload={async (files) => {
                                              const urls = await uploadImages(files);
                                              urls.forEach((url) => {
                                                if (!trip.imageUrl) { updateTripField("imageUrl", url); }
                                                else { updateTripField("galleryUrls", [...tripGallery, url]); }
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <FieldLabel>Video (Upload or paste URL)</FieldLabel>
                                        <div className="flex gap-1.5">
                                          <Input value={trip.videoUrl || ""} onChange={(e) => updateTripField("videoUrl", e.target.value)} placeholder="https://youtube.com/... or upload" className="h-8 text-xs flex-1" />
                                          <Button variant="travel-outline" size="sm" className="h-8 text-xs" onClick={() => {
                                            const input = document.createElement("input");
                                            input.type = "file"; input.accept = "video/*,audio/*";
                                            input.onchange = async (ev) => {
                                              const file = (ev.target as HTMLInputElement).files?.[0]; if (!file) return;
                                              const url = await uploadImage(file); updateTripField("videoUrl", url);
                                            }; input.click();
                                          }}><Upload className="h-3 w-3 mr-1" /> Upload</Button>
                                        </div>
                                      </div>
                                      {trip.videoUrl && (
                                        <div>
                                          <FieldLabel>Video Thumbnail</FieldLabel>
                                          <div className="flex gap-1.5 items-center">
                                            {trip.videoThumbnailUrl && (
                                              <div className="relative w-16 h-10 rounded overflow-hidden border border-border/40 shrink-0">
                                                <img src={trip.videoThumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                                <button onClick={() => updateTripField("videoThumbnailUrl", "")} className="absolute top-0 right-0 bg-foreground/70 text-background rounded-full p-0.5"><X className="h-2.5 w-2.5" /></button>
                                              </div>
                                            )}
                                            <Button variant="travel-outline" size="sm" className="h-8 text-xs" onClick={() => {
                                              const input = document.createElement("input");
                                              input.type = "file"; input.accept = "image/*";
                                              input.onchange = async (ev) => {
                                                const file = (ev.target as HTMLInputElement).files?.[0]; if (!file) return;
                                                const url = await uploadImage(file); updateTripField("videoThumbnailUrl", url);
                                              }; input.click();
                                            }}><ImagePlus className="h-3 w-3 mr-1" /> {trip.videoThumbnailUrl ? "Replace" : "Upload Thumbnail"}</Button>
                                          </div>
                                        </div>
                                      )}
                                    </TabsContent>
                                    <TabsContent value="details" className="p-3 space-y-2 mt-0">
                                      <div>
                                        <FieldLabel>Highlights</FieldLabel>
                                        <Textarea value={tripHighlights.join("\n")} onChange={(e) => updateTripField("highlights", e.target.value.split("\n"))} placeholder="One highlight per line&#10;e.g. Scenic coastal route&#10;Rest stop at historic town" className="text-xs min-h-[120px] resize-y" />
                                      </div>
                                      <div>
                                        <FieldLabel>Bus Amenities</FieldLabel>
                                        <Textarea value={tripAmenities.join("\n")} onChange={(e) => updateTripField("amenities", e.target.value.split("\n"))} placeholder="One amenity per line&#10;e.g. WiFi&#10;Air Conditioning&#10;USB Charging&#10;Restroom" className="text-xs min-h-[120px] resize-y" />
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </CollapsibleHotel>
                            );
                          })}
                          <Button variant="travel-ghost" size="sm" onClick={() => update("busTrips", [...busTrips, createBusTrip()])} className="text-primary text-xs h-7">
                            <Plus className="h-3 w-3 mr-1" /> Add Bus Trip
                          </Button>
                        </div>
                      </CollapsibleSection>
                    );

                  case "itinerary":
                    return (
                      <CollapsibleSection title={sectionTitles.itinerary} sectionKey="itinerary" visible={vis.itinerary} onToggleVisible={() => toggleSection("itinerary")} dragHandleProps={dragHandleProps}>
                        <div className="space-y-6">
                          {data.days.map((day, dayIdx) => (
                            <CollapsibleHotel key={day.id} defaultOpen={dayIdx === 0} hotelName={`Day ${dayIdx + 1}${day.title ? `: ${day.title}` : ""}`} location={day.location} onDelete={() => removeDay(dayIdx)}>
                              <div className="p-4 space-y-3">
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
                                        <input
                                          type="time"
                                          value={(() => {
                                            const m = act.time?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                                            if (!m) return '';
                                            let h = parseInt(m[1]);
                                            const period = m[3].toUpperCase();
                                            if (period === 'AM' && h === 12) h = 0;
                                            else if (period === 'PM' && h !== 12) h += 12;
                                            return `${String(h).padStart(2, '0')}:${m[2]}`;
                                          })()}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) { updateActivity(dayIdx, actIdx, "time", ""); return; }
                                            const [hStr, mStr] = val.split(':');
                                            let h = parseInt(hStr);
                                            const period = h >= 12 ? 'PM' : 'AM';
                                            if (h === 0) h = 12;
                                            else if (h > 12) h -= 12;
                                            updateActivity(dayIdx, actIdx, "time", `${h}:${mStr} ${period}`);
                                          }}
                                          className="h-7 text-xs rounded-md border border-input bg-background px-1.5 font-body w-[120px]"
                                        />
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
                                    {/* Activity Images */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const input = document.createElement("input");
                                            input.type = "file";
                                            input.accept = "image/*";
                                            input.multiple = true;
                                            input.onchange = async (ev) => {
                                              const files = Array.from((ev.target as HTMLInputElement).files || []);
                                              if (!files.length) return;
                                              const urls = await uploadImages(files);
                                              const existing = act.imageUrls || [];
                                              updateActivity(dayIdx, actIdx, "imageUrls", [...existing, ...urls]);
                                            };
                                            input.click();
                                          }}
                                          className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                        >
                                          <ImagePlus className="h-3 w-3" /> Add Photos
                                        </button>
                                      </div>
                                      {act.imageUrls && act.imageUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                          {act.imageUrls.map((url, imgIdx) => (
                                            <div key={imgIdx} className="relative group/img w-14 h-14 rounded overflow-hidden border border-border/30">
                                              <img src={url} alt="" className="w-full h-full object-cover" />
                                              <button
                                                onClick={() => {
                                                  const newUrls = act.imageUrls!.filter((_, i) => i !== imgIdx);
                                                  updateActivity(dayIdx, actIdx, "imageUrls", newUrls);
                                                }}
                                                className="absolute top-0.5 right-0.5 bg-foreground/70 text-background rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Video */}
                                    <div>
                                      <FieldLabel>Video (Upload or paste URL)</FieldLabel>
                                      <div className="flex gap-1.5">
                                        <Input
                                          value={act.videoUrl || ""}
                                          onChange={(e) => updateActivity(dayIdx, actIdx, "videoUrl", e.target.value)}
                                          placeholder="https://youtube.com/... or upload"
                                          className="h-7 text-xs flex-1"
                                        />
                                        <Button variant="travel-outline" size="sm" className="h-7 text-xs" onClick={() => {
                                          const input = document.createElement("input");
                                          input.type = "file";
                                          input.accept = "video/*,audio/*";
                                          input.onchange = async (ev) => {
                                            const file = (ev.target as HTMLInputElement).files?.[0];
                                            if (!file) return;
                                            const url = await uploadImage(file);
                                            updateActivity(dayIdx, actIdx, "videoUrl", url);
                                          };
                                          input.click();
                                        }}>
                                          <Upload className="h-3 w-3 mr-1" /> Upload
                                        </Button>
                                      </div>
                                    </div>
                                    {act.videoUrl && (
                                      <div>
                                        <FieldLabel>Video Thumbnail</FieldLabel>
                                        <div className="flex gap-1.5 items-center">
                                          {act.videoThumbnailUrl && (
                                            <div className="relative w-16 h-10 rounded overflow-hidden border border-border/40 shrink-0">
                                              <img src={act.videoThumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                              <button onClick={() => updateActivity(dayIdx, actIdx, "videoThumbnailUrl", "")} className="absolute top-0 right-0 bg-foreground/70 text-background rounded-full p-0.5"><X className="h-2.5 w-2.5" /></button>
                                            </div>
                                          )}
                                          <Button variant="travel-outline" size="sm" className="h-7 text-xs" onClick={() => {
                                            const input = document.createElement("input");
                                            input.type = "file";
                                            input.accept = "image/*";
                                            input.onchange = async (ev) => {
                                              const file = (ev.target as HTMLInputElement).files?.[0];
                                              if (!file) return;
                                              const url = await uploadImage(file);
                                              updateActivity(dayIdx, actIdx, "videoThumbnailUrl", url);
                                            };
                                            input.click();
                                          }}>
                                            <ImagePlus className="h-3 w-3 mr-1" /> {act.videoThumbnailUrl ? "Replace" : "Upload Thumbnail"}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <Button variant="travel-ghost" size="sm" onClick={() => addActivity(dayIdx)} className="text-primary text-xs h-7">
                                  <Plus className="h-3 w-3 mr-1" /> Activity
                                </Button>
                              </div>
                              </div>
                            </CollapsibleHotel>
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
                              <div className="relative w-28">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                                <Input value={line.amount} onChange={(e) => { const p = [...data.pricing]; p[i] = { ...p[i], amount: e.target.value }; update("pricing", p); }} placeholder="0.00" className="h-8 text-sm pl-5" />
                              </div>
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
                            {(data as any).proposalType !== "proposal" && (
                              <div>
                                <FieldLabel>Book Now URL (Form or Checkout Page)</FieldLabel>
                                <Input value={data.bookingUrl || ""} onChange={(e) => update("bookingUrl", e.target.value)} placeholder="https://your-ghl-form-or-checkout.com" className="h-8 text-sm" />
                                <p className="text-[10px] text-muted-foreground mt-1">Paste your sign-up form or checkout page URL. Opens in a modal when clients click "Book Now".</p>
                              </div>
                            )}
                            {(data as any).proposalType === "proposal" && (
                              <>
                                <div>
                                  <FieldLabel>Approve Itinerary URL</FieldLabel>
                                  <Input value={data.approveUrl || ""} onChange={(e) => update("approveUrl", e.target.value)} placeholder="https://your-ghl-approve-form.com" className="h-8 text-sm" />
                                  <p className="text-[10px] text-muted-foreground mt-1">Optional. If set, "Approve Itinerary" opens this in a modal instead of the built-in form.</p>
                                </div>
                                <div>
                                  <FieldLabel>Request Revisions URL</FieldLabel>
                                  <Input value={data.revisionsUrl || ""} onChange={(e) => update("revisionsUrl", e.target.value)} placeholder="https://your-ghl-revisions-form.com" className="h-8 text-sm" />
                                  <p className="text-[10px] text-muted-foreground mt-1">Optional. If set, "Request Revisions" opens this in a modal instead of the built-in form.</p>
                                </div>
                              </>
                            )}
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
                    return null;

                  default:
                    return null;
                }
              }}
            </SortableSection>
          ))}
        </SortableContext>
      </DndContext>

      {/* Checkout Settings */}
      <CheckoutEditorSection data={data} onChange={onChange} />

      {/* Agent Financial Summary */}
      <AgentFinancialSummary data={data} />
    </div>
  );
}

function AgentFinancialSummary({ data }: { data: ProposalData }) {
  const [open, setOpen] = useState(false);
  const flightOptions = data.flightOptions || [];
  const accommodations = data.accommodations || [];
  const cruiseShips = data.cruiseShips || [];
  const busTrips = data.busTrips || [];

  // Collect all items with agent pricing
  const items: { label: string; category: string; cost: number; commission: number; markup: number; price: number }[] = [];

  const calcMarkup = (ap: { markupType: string; markupValue: string; cost: string }) => {
    const cost = parseFloat(ap.cost) || 0;
    const val = parseFloat(ap.markupValue) || 0;
    return ap.markupType === "percent" ? cost * (val / 100) : val;
  };

  flightOptions.forEach((opt, i) => {
    const ap = opt.agentPricing;
    const cost = parseFloat(ap?.cost || "0") || 0;
    const commission = parseFloat(ap?.commission || "0") || 0;
    const markup = ap ? calcMarkup(ap) : 0;
    const price = parseFloat(opt.price || "0") || 0;
    if (cost || commission || markup || price) {
      const depLeg = opt.legs.find(l => l.type === "departure");
      items.push({ label: depLeg?.airline || `Flight Option ${i + 1}`, category: "Flight", cost, commission, markup, price });
    }
  });

  accommodations.forEach((acc) => {
    const ap = acc.agentPricing;
    const cost = parseFloat(ap?.cost || "0") || 0;
    const commission = parseFloat(ap?.commission || "0") || 0;
    const markup = ap ? calcMarkup(ap) : 0;
    const price = parseFloat(acc.price || "0") || 0;
    if (cost || commission || markup || price) {
      items.push({ label: acc.hotelName || "Hotel", category: "Hotel", cost, commission, markup, price });
    }
  });

  cruiseShips.forEach((ship) => {
    const ap = ship.agentPricing;
    const cost = parseFloat(ap?.cost || "0") || 0;
    const commission = parseFloat(ap?.commission || "0") || 0;
    const markup = ap ? calcMarkup(ap) : 0;
    const price = parseFloat(ship.price || "0") || 0;
    if (cost || commission || markup || price) {
      items.push({ label: ship.shipName || "Cruise", category: "Cruise", cost, commission, markup, price });
    }
  });

  busTrips.forEach((trip) => {
    const ap = trip.agentPricing;
    const cost = parseFloat(ap?.cost || "0") || 0;
    const commission = parseFloat(ap?.commission || "0") || 0;
    const markup = ap ? calcMarkup(ap) : 0;
    const price = parseFloat(trip.price || "0") || 0;
    if (cost || commission || markup || price) {
      items.push({ label: trip.routeName || "Bus Trip", category: "Bus", cost, commission, markup, price });
    }
  });

  const totalCost = items.reduce((s, i) => s + i.cost, 0);
  const totalCommission = items.reduce((s, i) => s + i.commission, 0);
  const totalMarkup = items.reduce((s, i) => s + i.markup, 0);
  const totalPrice = items.reduce((s, i) => s + i.price, 0);
  const totalProfit = totalCommission + totalMarkup;
  const profitMargin = totalPrice > 0 ? (totalProfit / totalPrice) * 100 : 0;

  if (items.length === 0) return null;

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="border-accent/40 border-dashed bg-accent/5">
      <CardHeader className="py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <CardTitle className="text-sm font-display">Agent Financials</CardTitle>
            <span className="text-[10px] uppercase tracking-wider text-accent font-body font-semibold bg-accent/10 px-1.5 py-0.5 rounded">Agent Only</span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-1 text-xs font-body py-1.5 border-b border-border/20 last:border-0">
                <div className="col-span-2">
                  <span className="text-foreground font-medium">{item.label}</span>
                  <span className="text-muted-foreground/60 ml-1">({item.category})</span>
                </div>
                <div className="text-muted-foreground text-right">
                  {item.cost > 0 && <span>Cost ${fmt(item.cost)}</span>}
                </div>
                <div className="text-muted-foreground text-right">
                  {item.commission > 0 && <span>Comm ${fmt(item.commission)}</span>}
                </div>
                <div className="text-right">
                  {item.markup > 0 && <span className="text-accent">+${fmt(item.markup)}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-accent/30 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-body">
              <div className="bg-muted/30 rounded-md px-3 py-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Total Cost</p>
                <p className="font-semibold text-foreground">${fmt(totalCost)}</p>
              </div>
              <div className="bg-muted/30 rounded-md px-3 py-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Client Price</p>
                <p className="font-semibold text-foreground">${fmt(totalPrice)}</p>
              </div>
              <div className="bg-muted/30 rounded-md px-3 py-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Commission</p>
                <p className="font-semibold text-accent">${fmt(totalCommission)}</p>
              </div>
              <div className="bg-muted/30 rounded-md px-3 py-2">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Markup</p>
                <p className="font-semibold text-accent">${fmt(totalMarkup)}</p>
              </div>
            </div>
            <div className="bg-accent/10 rounded-md px-3 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-accent font-semibold font-body">Total Profit</p>
                <p className="text-lg font-display font-bold text-accent">${fmt(totalProfit)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">Margin</p>
                <p className="text-lg font-display font-bold text-foreground">{profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CheckoutEditorSection({ data, onChange }: { data: ProposalData; onChange: (d: ProposalData) => void }) {
  const [open, setOpen] = useState(false);
  const checkout = data.checkout || createDefaultCheckout();

  const updateCheckout = (partial: Partial<CheckoutSettings>) => {
    onChange({ ...data, checkout: { ...checkout, ...partial } });
  };

  const updatePaymentOption = (id: string, partial: Partial<PaymentOption>) => {
    const updated = checkout.paymentOptions.map((o) => o.id === id ? { ...o, ...partial } : o);
    updateCheckout({ paymentOptions: updated });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="py-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
          <CardTitle className="text-sm font-display flex items-center gap-2">
            💳 Checkout & Booking
          </CardTitle>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground font-body">Enable Checkout Page</label>
            <Switch checked={checkout.enabled} onCheckedChange={(v) => updateCheckout({ enabled: v })} />
          </div>

          {checkout.enabled && (
            <>
              <div>
                <FieldLabel>Headline</FieldLabel>
                <Input value={checkout.headline} onChange={(e) => updateCheckout({ headline: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <FieldLabel>Message</FieldLabel>
                <Textarea value={checkout.message} onChange={(e) => updateCheckout({ message: e.target.value })} rows={2} className="text-sm" />
              </div>

              <div className="space-y-3">
                <FieldLabel>Payment Options</FieldLabel>
                {checkout.paymentOptions.map((opt) => (
                  <div key={opt.id} className={`border rounded-lg p-3 space-y-2 ${opt.enabled ? "border-primary/30 bg-primary/5" : "border-border/50 opacity-60"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold font-body">{opt.type === "full" ? "💳 Pay in Full" : opt.type === "deposit" ? "💰 Deposit" : "📅 Installments"}</span>
                      <Switch checked={opt.enabled} onCheckedChange={(v) => updatePaymentOption(opt.id, { enabled: v })} />
                    </div>
                    {opt.enabled && (
                      <>
                        <Input value={opt.label} onChange={(e) => updatePaymentOption(opt.id, { label: e.target.value })} placeholder="Label" className="h-7 text-xs" />
                        <Input value={opt.description} onChange={(e) => updatePaymentOption(opt.id, { description: e.target.value })} placeholder="Description" className="h-7 text-xs" />
                        {opt.type === "deposit" && (
                          <div className="flex items-center gap-2">
                            <Input type="number" value={opt.depositPercent || ""} onChange={(e) => updatePaymentOption(opt.id, { depositPercent: parseInt(e.target.value) || 0 })} placeholder="30" className="h-7 text-xs w-20" />
                            <span className="text-xs text-muted-foreground">% deposit</span>
                          </div>
                        )}
                        {opt.type === "installments" && (
                          <div className="flex items-center gap-2">
                            <Input type="number" value={opt.installmentCount || ""} onChange={(e) => updatePaymentOption(opt.id, { installmentCount: parseInt(e.target.value) || 0 })} placeholder="3" className="h-7 text-xs w-20" />
                            <span className="text-xs text-muted-foreground">payments</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <FieldLabel>Custom Checkout Form URL (optional)</FieldLabel>
                <Input value={checkout.customFormUrl} onChange={(e) => updateCheckout({ customFormUrl: e.target.value })} placeholder="https://your-checkout-form.com" className="h-8 text-sm" />
                <p className="text-[10px] text-muted-foreground mt-1">If set, embeds this form instead of the built-in checkout.</p>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground font-body">Show Trip Summary</label>
                <Switch checked={checkout.showTripSummary} onCheckedChange={(v) => updateCheckout({ showTripSummary: v })} />
              </div>

              <div>
                <FieldLabel>Confirmation Message</FieldLabel>
                <Textarea value={checkout.confirmationMessage} onChange={(e) => updateCheckout({ confirmationMessage: e.target.value })} rows={2} className="text-sm" />
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
