import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Easing } from "framer-motion";
import { MapPin, Calendar, Users, Star, Clock, Utensils, Hotel, Camera, Wine, Plane, ArrowRight, Check, Phone, Mail, Globe, PlaneTakeoff, PlaneLanding, BedDouble, MessageSquare, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProposalData, Activity } from "@/types/proposal";
import heroFallback from "@/assets/portugal-hero.jpg";
import sintraFallback from "@/assets/portugal-sintra.jpg";
import portoFallback from "@/assets/portugal-porto.jpg";
import algarveFallback from "@/assets/portugal-algarve.jpg";

const fallbackImages = [heroFallback, sintraFallback, portoFallback, algarveFallback];

const easeOut: Easing = [0.25, 0.46, 0.45, 0.94];
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
  }),
};

function getActivityIcon(type: Activity["type"]) {
  switch (type) {
    case "transport": return <Plane className="h-4 w-4" />;
    case "hotel": return <Hotel className="h-4 w-4" />;
    case "dining": return <Utensils className="h-4 w-4" />;
    case "sightseeing": return <Camera className="h-4 w-4" />;
    case "activity": return <Wine className="h-4 w-4" />;
    default: return <Camera className="h-4 w-4" />;
  }
}

function hexToHsl(hex: string): string | null {
  if (!hex || !hex.startsWith("#")) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface Props {
  data: ProposalData;
}

export default function ProposalPreview({ data }: Props) {
  const navigate = useNavigate();
  const heroImage = data.heroImageUrl || heroFallback;
  const vis = data.sectionVisibility || { hero: true, overview: true, flights: true, accommodations: true, itinerary: true, inclusions: true, pricing: true, testimonial: true, agent: true };
  const brandData = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };
  const flights = data.flights || [];
  const accommodations = data.accommodations || [];
  const agent = data.agent || { name: "", title: "", phone: "", email: "", website: "", agencyName: "", logoUrl: "", photoUrl: "" };

  const brandStyles = useMemo(() => {
    const styles: Record<string, string> = {};
    if (brandData.primaryColor) {
      const hsl = hexToHsl(brandData.primaryColor);
      if (hsl) styles["--primary"] = hsl;
    }
    if (brandData.secondaryColor) {
      const hsl = hexToHsl(brandData.secondaryColor);
      if (hsl) styles["--secondary"] = hsl;
    }
    if (brandData.accentColor) {
      const hsl = hexToHsl(brandData.accentColor);
      if (hsl) styles["--accent"] = hsl;
    }
    return styles;
  }, [brandData]);

  const navItems = useMemo(() => {
    const items: { label: string; id: string }[] = [];
    if (vis.overview) items.push({ label: "Overview", id: "overview" });
    if (vis.flights) items.push({ label: "Flights", id: "flights" });
    if (vis.accommodations) items.push({ label: "Hotels", id: "accommodations" });
    if (vis.itinerary) items.push({ label: "Itinerary", id: "itinerary" });
    if (vis.inclusions) items.push({ label: "Included", id: "inclusions" });
    if (vis.pricing) items.push({ label: "Pricing", id: "pricing" });
    return items;
  }, [vis]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      {/* STICKY HEADER NAV */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            {brandData.logoUrl ? (
              <img src={brandData.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            ) : (
              <span className="font-display text-lg font-bold text-foreground">✈️ {agent.agencyName || "Travel Co."}</span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-3 py-1.5 text-sm font-body text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted/50"
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button variant="travel" size="sm" className="text-xs" onClick={() => navigate("/approve")}>
            Book Now
          </Button>
        </div>
      </nav>

      {/* HERO */}
      {vis.hero && (
        <section className="relative h-[80vh] min-h-[550px] overflow-hidden">
          <img src={heroImage} alt={data.destination} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="font-body text-sm tracking-[0.3em] uppercase mb-4">
              <span className="bg-background/20 backdrop-blur-sm text-primary-foreground px-4 py-1.5 rounded-full">Curated Travel Experience</span>
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-primary-foreground leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              {data.destination || "Your Destination"}
            </motion.h1>
            {data.subtitle && (
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="font-display text-xl sm:text-2xl text-primary-foreground mt-3 italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
                {data.subtitle}
              </motion.p>
            )}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }} className="flex items-center gap-4 mt-10">
              {data.travelDates && <span className="flex items-center gap-1.5 bg-background/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-sm font-body"><Calendar className="h-4 w-4" /> {data.travelDates}</span>}
              {data.travelerCount && <span className="flex items-center gap-1.5 bg-background/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-sm font-body"><Users className="h-4 w-4" /> {data.travelerCount}</span>}
              {data.destinationCount && <span className="flex items-center gap-1.5 bg-background/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-sm font-body"><MapPin className="h-4 w-4" /> {data.destinationCount}</span>}
            </motion.div>
          </div>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/50 flex justify-center pt-2">
              <div className="w-1 h-2 rounded-full bg-primary-foreground/70" />
            </div>
          </motion.div>
        </section>
      )}

      {/* PREPARED FOR */}
      {vis.overview && (
        <section id="overview" className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Prepared Exclusively For</motion.p>
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              {data.clientName || "Your Client"}
            </motion.h2>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} className="w-16 h-0.5 bg-primary mx-auto mt-6 mb-8" />
            {data.introText && (
              <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} className="text-muted-foreground leading-relaxed text-lg font-body">
                {data.introText}
              </motion.p>
            )}
          </div>
        </section>
      )}

      {/* FLIGHTS */}
      {vis.flights && flights.length > 0 && (
        <section id="flights" className="py-20 bg-card">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Flights</p>
              <h2 className="font-display text-4xl font-bold text-foreground">Air Travel</h2>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flights.map((flight) => (
                <div key={flight.id} className="bg-background rounded-2xl border border-border/50 shadow-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  <div className="flex items-center gap-2 mb-4">
                    {flight.type === "departure" ? <PlaneTakeoff className="h-5 w-5 text-primary" /> : <PlaneLanding className="h-5 w-5 text-primary" />}
                    <span className="font-body font-semibold text-foreground text-sm uppercase tracking-wide">{flight.type === "departure" ? "Departure" : "Return"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mb-3">{flight.date}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold text-foreground">{flight.departureAirport.split("–")[0]?.trim() || "—"}</p>
                      <p className="text-xs text-muted-foreground font-body">{flight.departureTime}</p>
                    </div>
                    <div className="flex-1 mx-4 flex items-center">
                      <div className="flex-1 border-t border-dashed border-border" />
                      <Plane className="h-4 w-4 text-primary mx-2" />
                      <div className="flex-1 border-t border-dashed border-border" />
                    </div>
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold text-foreground">{flight.arrivalAirport.split("–")[0]?.trim() || "—"}</p>
                      <p className="text-xs text-muted-foreground font-body">{flight.arrivalTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                    <span>{flight.airline}</span>
                    {flight.flightNumber && <span className="text-primary font-semibold">{flight.flightNumber}</span>}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ACCOMMODATIONS */}
      {vis.accommodations && accommodations.length > 0 && (
        <section id="accommodations" className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Where You'll Stay</p>
              <h2 className="font-display text-4xl font-bold text-foreground">Accommodations</h2>
            </motion.div>
            <div className="space-y-10">
              {accommodations.map((acc) => {
                const amenities = acc.amenities || [];
                const highlights = acc.highlights || [];
                const galleryUrls = acc.galleryUrls || [];
                return (
                  <motion.div key={acc.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
                    {/* Image gallery */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                      <div className="md:col-span-2 aspect-[16/9] md:aspect-auto overflow-hidden">
                        {acc.imageUrl ? (
                          <img src={acc.imageUrl} alt={acc.hotelName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full min-h-[200px] bg-muted flex items-center justify-center">
                            <BedDouble className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="hidden md:grid grid-rows-2 gap-1">
                        {galleryUrls.length > 0 ? galleryUrls.slice(0, 2).map((url, gi) => (
                          <div key={gi} className="overflow-hidden">
                            <img src={url} alt={`${acc.hotelName} ${gi + 2}`} className="w-full h-full object-cover" />
                          </div>
                        )) : (
                          <>
                            <div className="bg-muted flex items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/20" /></div>
                            <div className="bg-muted flex items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/20" /></div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-6 sm:p-8">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display text-2xl font-bold text-foreground">{acc.hotelName || "Hotel"}</h3>
                            {acc.starRating && (
                              <div className="flex items-center gap-0.5">
                                {[...Array(parseInt(acc.starRating) || 0)].map((_, si) => (
                                  <Star key={si} className="h-3.5 w-3.5 fill-accent text-accent" />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-body flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {acc.location}</p>
                        </div>
                        <BedDouble className="h-6 w-6 text-primary mt-1 shrink-0" />
                      </div>
                      {acc.roomType && <p className="font-body text-foreground font-semibold mt-3">{acc.roomType}</p>}
                      {acc.description && <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed">{acc.description}</p>}

                      {/* Highlights */}
                      {highlights.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-2">Highlights</p>
                          <div className="space-y-1.5">
                            {highlights.map((h, hi) => (
                              <div key={hi} className="flex items-center gap-2 text-sm font-body text-foreground">
                                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                                <span>{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {amenities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/30">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Amenities</p>
                          <div className="flex flex-wrap gap-2">
                            {amenities.map((a, ai) => (
                              <span key={ai} className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full border border-border/30">
                                <Check className="h-3 w-3 text-primary" /> {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/30 text-sm text-muted-foreground font-body">
                        {acc.checkIn && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Check-in: {acc.checkIn}</span>}
                        {acc.checkOut && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Check-out: {acc.checkOut}</span>}
                        {acc.nights && <span className="text-primary font-semibold">{acc.nights}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ITINERARY */}
      {vis.itinerary && data.days.length > 0 && (
        <section id="itinerary" className="pb-20 pt-20 bg-card">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-16">
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Journey</p>
              <h2 className="font-display text-4xl font-bold text-foreground">Day-by-Day Itinerary</h2>
            </motion.div>

            <div className="space-y-16">
              {data.days.map((day, dayIdx) => {
                const dayImage = day.imageUrl || fallbackImages[dayIdx % fallbackImages.length];
                return (
                  <motion.div key={day.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={0} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className={`lg:col-span-2 ${dayIdx % 2 === 1 ? "lg:order-2" : ""}`}>
                      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
                        <img src={dayImage} alt={day.title} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-body font-semibold">Day {dayIdx + 1}</div>
                      </div>
                    </div>
                    <div className={`lg:col-span-3 ${dayIdx % 2 === 1 ? "lg:order-1" : ""}`}>
                      <div className="mb-5">
                        <p className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                          {day.date && <><Calendar className="h-3.5 w-3.5" /> {day.date}</>}
                          {day.date && day.location && <span className="mx-2">·</span>}
                          {day.location && <><MapPin className="h-3.5 w-3.5" /> {day.location}</>}
                        </p>
                        <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">{day.title}</h3>
                      </div>
                      <div className="space-y-0 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                        {day.activities.map((act, actIdx) => (
                          <div key={act.id || actIdx} className="flex gap-4 py-3 relative">
                            <div className="relative z-10 mt-1.5 w-[15px] h-[15px] shrink-0 rounded-full border-2 border-primary bg-background" />
                            <div className="flex-1">
                              {act.time && (
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-primary font-body flex items-center gap-1"><Clock className="h-3 w-3" /> {act.time}</span>
                                </div>
                              )}
                              <p className="font-body font-semibold text-foreground">{act.title || "Untitled Activity"}</p>
                              {act.description && <p className="text-sm text-muted-foreground font-body mt-0.5">{act.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* INCLUSIONS */}
      {vis.inclusions && data.inclusions.filter(Boolean).length > 0 && (
        <section id="inclusions" className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Everything Taken Care Of</p>
              <h2 className="font-display text-4xl font-bold text-foreground">What's Included</h2>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
              {data.inclusions.filter(Boolean).map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-body text-foreground">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* PRICING */}
      {vis.pricing && data.pricing.length > 0 && (
        <section id="pricing" className="py-20 bg-card">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Investment</p>
              <h2 className="font-display text-4xl font-bold text-foreground mb-8">Trip Pricing</h2>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="bg-background rounded-2xl border border-border/50 shadow-lg p-10">
              <div className="space-y-4 mb-8">
                {data.pricing.map((line) => (
                  <div key={line.id} className="flex justify-between items-center py-2 border-b border-border/30 font-body">
                    <span className="text-muted-foreground">{line.label}</span>
                    <span className="font-semibold text-foreground">{line.amount}</span>
                  </div>
                ))}
              </div>
              {data.paymentTerms && <p className="text-xs text-muted-foreground mt-3 font-body">{data.paymentTerms}</p>}
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} className="mt-10">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="travel" size="lg" className="text-lg px-10 py-6 h-auto" onClick={() => navigate("/approve")}>
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Approve Itinerary
                </Button>
                <Button variant="travel-outline" size="lg" className="text-lg px-10 py-6 h-auto" onClick={() => navigate("/revisions")}>
                  <MessageSquare className="h-5 w-5 mr-2" /> Request Revisions
                </Button>
              </div>
              {data.validUntil && <p className="text-sm text-muted-foreground mt-4 font-body">This proposal is valid until {data.validUntil}</p>}
            </motion.div>
          </div>
        </section>
      )}

      {/* TESTIMONIAL */}
      {vis.testimonial && data.testimonialQuote && (
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-accent text-accent" />)}
              </div>
              <blockquote className="font-display text-xl sm:text-2xl italic text-foreground leading-relaxed">
                "{data.testimonialQuote}"
              </blockquote>
              <p className="mt-6 font-body text-muted-foreground">
                — {data.testimonialAuthor}{data.testimonialTrip && <>, <span className="text-primary">{data.testimonialTrip}</span></>}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* AGENT FOOTER */}
      {vis.agent && (
        <footer className="py-16 px-6 border-t border-border/50 bg-card">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Travel Advisor</p>
            <div className="flex flex-col items-center gap-4 mb-6">
              {agent.photoUrl && (
                <img src={agent.photoUrl} alt={agent.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
              )}
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground">{agent.name}</h3>
                <p className="text-muted-foreground font-body mt-0.5">{agent.title}</p>
                <p className="text-sm text-muted-foreground font-body">{agent.agencyName}</p>
              </div>
              {agent.logoUrl && (
                <img src={agent.logoUrl} alt={agent.agencyName} className="h-12 max-w-[160px] object-contain" />
              )}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm font-body text-muted-foreground flex-wrap mb-8">
              {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> {agent.phone}</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="h-4 w-4" /> {agent.email}</a>}
              {agent.website && <a href="#" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Globe className="h-4 w-4" /> {agent.website}</a>}
            </div>
            <Button variant="travel" size="lg" className="text-base px-8" onClick={() => navigate("/approve")}>
              Sign Up Today! <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground/60 mt-10 font-body">© 2026 {agent.agencyName} · All prices in USD · Subject to availability</p>
          </div>
        </footer>
      )}
    </div>
  );
}
