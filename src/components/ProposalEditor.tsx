import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProposalData, ItineraryDay, Activity } from "@/types/proposal";
import { createActivity, createDay, createPricingLine } from "@/types/proposal";

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

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-border/50">
      <CardHeader className="cursor-pointer py-4" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display">{title}</CardTitle>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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

  const updateDay = (dayIndex: number, updated: ItineraryDay) => {
    const days = [...data.days];
    days[dayIndex] = updated;
    update("days", days);
  };

  const addDay = () => {
    update("days", [...data.days, createDay(data.days.length + 1)]);
  };

  const removeDay = (index: number) => {
    update("days", data.days.filter((_, i) => i !== index));
  };

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

  return (
    <div className="space-y-4 p-4 sm:p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Proposal Builder</h2>
        <p className="text-sm text-muted-foreground font-body mt-1">Fill in the details below — preview updates live on the right.</p>
      </div>

      {/* Trip Overview */}
      <CollapsibleSection title="🌍 Trip Overview">
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
      <CollapsibleSection title="👤 Client Details">
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

      {/* Days */}
      <CollapsibleSection title="📅 Itinerary Days">
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

              {/* Activities */}
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
      <CollapsibleSection title="✅ What's Included" defaultOpen={false}>
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
      <CollapsibleSection title="💰 Pricing" defaultOpen={false}>
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
      <CollapsibleSection title="⭐ Testimonial" defaultOpen={false}>
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
      <CollapsibleSection title="🧑‍💼 Agent Info" defaultOpen={false}>
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
        </div>
      </CollapsibleSection>
    </div>
  );
}
