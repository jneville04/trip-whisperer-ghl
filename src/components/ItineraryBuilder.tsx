import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MapPin, Clock, DollarSign, GripVertical, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  notes: string;
  cost: string;
}

export interface ItineraryDay {
  id: string;
  date: string;
  title: string;
  activities: Activity[];
}

const createActivity = (): Activity => ({
  id: crypto.randomUUID(),
  time: "",
  title: "",
  location: "",
  notes: "",
  cost: "",
});

const createDay = (dayNumber: number): ItineraryDay => ({
  id: crypto.randomUUID(),
  date: "",
  title: `Day ${dayNumber}`,
  activities: [createActivity()],
});

interface DayCardProps {
  day: ItineraryDay;
  dayIndex: number;
  onUpdate: (day: ItineraryDay) => void;
  onRemove: () => void;
}

function DayCard({ day, dayIndex, onUpdate, onRemove }: DayCardProps) {
  const updateActivity = (actIndex: number, field: keyof Activity, value: string) => {
    const updated = { ...day };
    updated.activities = [...day.activities];
    updated.activities[actIndex] = { ...updated.activities[actIndex], [field]: value };
    onUpdate(updated);
  };

  const addActivity = () => {
    onUpdate({ ...day, activities: [...day.activities, createActivity()] });
  };

  const removeActivity = (actIndex: number) => {
    if (day.activities.length <= 1) return;
    onUpdate({ ...day, activities: day.activities.filter((_, i) => i !== actIndex) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: dayIndex * 0.05 }}
    >
      <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
        {/* Day Header */}
        <div className="bg-primary/5 border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg">
              {dayIndex + 1}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input
                value={day.title}
                onChange={(e) => onUpdate({ ...day, title: e.target.value })}
                className="font-display text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-40"
                placeholder="Day Title"
              />
              <Input
                type="date"
                value={day.date}
                onChange={(e) => onUpdate({ ...day, date: e.target.value })}
                className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-muted-foreground w-36 text-sm"
              />
            </div>
          </div>
          <Button variant="travel-ghost" size="icon" onClick={onRemove} className="text-destructive/60 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-0">
          <AnimatePresence>
            {day.activities.map((activity, actIndex) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-border/30 last:border-b-0"
              >
                <div className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 text-muted-foreground/40">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Time */}
                      <div className="sm:col-span-2 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Input
                          type="time"
                          value={activity.time}
                          onChange={(e) => updateActivity(actIndex, "time", e.target.value)}
                          className="h-9 text-sm border-muted"
                        />
                      </div>
                      {/* Title */}
                      <div className="sm:col-span-3">
                        <Input
                          value={activity.title}
                          onChange={(e) => updateActivity(actIndex, "title", e.target.value)}
                          placeholder="Activity name"
                          className="h-9 text-sm border-muted font-medium"
                        />
                      </div>
                      {/* Location */}
                      <div className="sm:col-span-3 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-travel-ocean shrink-0" />
                        <Input
                          value={activity.location}
                          onChange={(e) => updateActivity(actIndex, "location", e.target.value)}
                          placeholder="Location"
                          className="h-9 text-sm border-muted"
                        />
                      </div>
                      {/* Notes */}
                      <div className="sm:col-span-2">
                        <Input
                          value={activity.notes}
                          onChange={(e) => updateActivity(actIndex, "notes", e.target.value)}
                          placeholder="Notes"
                          className="h-9 text-sm border-muted"
                        />
                      </div>
                      {/* Cost */}
                      <div className="sm:col-span-2 flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-travel-forest shrink-0" />
                        <Input
                          value={activity.cost}
                          onChange={(e) => updateActivity(actIndex, "cost", e.target.value)}
                          placeholder="Cost"
                          className="h-9 text-sm border-muted"
                        />
                      </div>
                    </div>
                    <Button
                      variant="travel-ghost"
                      size="icon"
                      onClick={() => removeActivity(actIndex)}
                      className="mt-0.5 h-8 w-8 text-muted-foreground/50 hover:text-destructive shrink-0"
                      disabled={day.activities.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Activity */}
          <div className="px-6 py-3 bg-muted/30">
            <Button variant="travel-ghost" size="sm" onClick={addActivity} className="text-primary">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ItineraryBuilder() {
  const [tripName, setTripName] = useState("");
  const [clientName, setClientName] = useState("");
  const [travelers, setTravelers] = useState("");
  const [days, setDays] = useState<ItineraryDay[]>([createDay(1)]);

  const addDay = () => {
    setDays([...days, createDay(days.length + 1)]);
  };

  const updateDay = (index: number, day: ItineraryDay) => {
    const updated = [...days];
    updated[index] = day;
    setDays(updated);
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    setDays(days.filter((_, i) => i !== index));
  };

  const totalCost = days.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, act) => {
      const num = parseFloat(act.cost);
      return daySum + (isNaN(num) ? 0 : num);
    }, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src="/hero-travel.jpg"
          alt="Travel destination"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 to-foreground/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plane className="h-6 w-6 text-primary-foreground" />
              <span className="text-primary-foreground/80 font-body text-sm tracking-widest uppercase">
                Travel Itinerary Builder
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-primary-foreground">
              Craft the Perfect Journey
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 pb-16">
        {/* Trip Info Card */}
        <Card className="mb-8 shadow-lg border-border/40">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Trip / Destination
                </label>
                <Input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="e.g. Bali Adventure 2026"
                  className="font-display text-lg border-muted"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Client Name
                </label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. John & Jane Smith"
                  className="border-muted"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Number of Travelers
                </label>
                <Input
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  placeholder="e.g. 2 Adults, 1 Child"
                  className="border-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Cards */}
        <div className="space-y-5">
          <AnimatePresence>
            {days.map((day, index) => (
              <DayCard
                key={day.id}
                day={day}
                dayIndex={index}
                onUpdate={(d) => updateDay(index, d)}
                onRemove={() => removeDay(index)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button variant="travel-outline" onClick={addDay} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Day
          </Button>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Total</p>
              <p className="font-display text-2xl font-bold text-foreground">
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button variant="travel" size="lg" onClick={() => window.print()}>
              Export Itinerary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
