import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Easing } from "framer-motion";
import { MapPin, Calendar, Users, Clock, Utensils, Hotel, Camera, Wine, Plane, ArrowRight, Check, Phone, Mail, Globe, PlaneTakeoff, PlaneLanding, BedDouble, MessageSquare, CheckCircle2, Sparkles, Ship, Anchor, Bus } from "lucide-react";
import Lightbox from "@/components/Lightbox";
import BookingModal from "@/components/BookingModal";
import VideoEmbed from "@/components/VideoEmbed";
import { Button } from "@/components/ui/button";
import type { ProposalData, Activity, SectionKey } from "@/types/proposal";
import { defaultSectionOrder } from "@/types/proposal";
import { buildBrandCssVars } from "@/lib/brand";
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

interface Props {
  data: ProposalData;
  shareId?: string;
}

export default function ProposalPreview({ data, shareId }: Props) {
  const isGroupBooking = (data as any).proposalType !== "proposal";
  const navigate = useNavigate();
  const heroImage = data.heroImageUrl || heroFallback;
  const heroImages = data.heroImageUrls || [];
  const [lightboxImages, setLightboxImages] = useState<{ src: string; alt?: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingModalUrl, setBookingModalUrl] = useState("");
  const [bookingModalTitle, setBookingModalTitle] = useState("");

  const openLightbox = (images: { src: string; alt?: string }[], index: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Proposal-type selection state (radio per category)
  const [selectedFlight, setSelectedFlight] = useState<string>("");
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>("");
  const [selectedCruise, setSelectedCruise] = useState<string>("");
  const [selectedBusTrip, setSelectedBusTrip] = useState<string>("");
  const vis = data.sectionVisibility || { hero: true, overview: true, flights: true, accommodations: true, cruiseShips: true, busTrips: true, itinerary: true, inclusions: true, pricing: true, essentials: true, terms: true, agent: true };
  const brandData = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "", showAgencyNameWithLogo: true };
  const sectionOrder = data.sectionOrder || defaultSectionOrder;
  const flights = data.flights || [];
  const accommodations = data.accommodations || [];
  const cruiseShips = data.cruiseShips || [];
  const busTrips = data.busTrips || [];
  const agent = data.agent || { name: "", title: "", phone: "", email: "", website: "", agencyName: "", logoUrl: "", photoUrl: "" };
  const essentials = data.essentials || { visaRequirements: "", passportInfo: "", currency: "", language: "", timeZone: "", weatherInfo: "", packingTips: "", emergencyContacts: "" };
  const terms = data.terms || { cancellationPolicy: "", travelInsurance: "", bookingTerms: "", liability: "", showCancellation: true, showInsurance: true, showBookingTerms: true, showLiability: true };

  const brandStyles = useMemo(() => buildBrandCssVars(brandData), [brandData]);
  const showAgencyNameWithLogo = brandData.showAgencyNameWithLogo ?? true;

  const sectionLabels: Record<SectionKey, string> = {
    overview: "Overview", flights: "Flights", accommodations: "Hotels",
    cruiseShips: "Cruise", busTrips: "Bus",
    itinerary: "Itinerary", inclusions: "Included", pricing: "Pricing",
    essentials: "Essentials", terms: "Terms", agent: "Advisor",
  };

  const navItems = useMemo(() => {
    const hasContent: Record<string, boolean> = {
      overview: !!(data.introText),
      flights: flights.length > 0,
      accommodations: accommodations.length > 0,
      cruiseShips: cruiseShips.length > 0,
      busTrips: busTrips.length > 0,
      itinerary: (data.days || []).length > 0,
      inclusions: (data.inclusions || []).length > 0,
      pricing: (data.pricing || []).length > 0,
      essentials: !!(essentials.passportInfo || essentials.currency || essentials.weatherInfo || essentials.packingTips),
      terms: !!(terms.cancellationPolicy || terms.travelInsurance || terms.bookingTerms || terms.liability),
      agent: !!(agent.name),
    };
    return sectionOrder
      .filter((key) => key !== "agent" && vis[key] && hasContent[key])
      .map((key) => ({ label: sectionLabels[key], id: key }));
  }, [vis, sectionOrder, data, flights, accommodations, cruiseShips, busTrips, essentials, terms, agent]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const returnTo = window.location.pathname;

  const bookingUrl = data.bookingUrl || "";
  const approveUrl = data.approveUrl || "";
  const revisionsUrl = data.revisionsUrl || "";

  const openModal = useCallback((url: string, title: string) => {
    setBookingModalUrl(url);
    setBookingModalTitle(title);
    setBookingOpen(true);
  }, []);

  const goToApprove = useCallback(() => {
    const url = approveUrl || bookingUrl;
    if (url) {
      openModal(url, "Approve Itinerary");
    } else {
      navigate(`/approve${shareId ? `?share=${shareId}` : ""}`, { state: { brand: brandData, returnTo } });
    }
  }, [navigate, shareId, brandData, returnTo, bookingUrl, approveUrl, openModal]);

  const goToRevisions = useCallback(() => {
    if (revisionsUrl) {
      openModal(revisionsUrl, "Request Revisions");
    } else {
      navigate(`/revisions${shareId ? `?share=${shareId}` : ""}`, { state: { brand: brandData, returnTo } });
    }
  }, [navigate, shareId, brandData, returnTo, revisionsUrl, openModal]);

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      {/* STICKY HEADER NAV */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2 min-w-0">
            {brandData.logoUrl && (
              <img src={brandData.logoUrl} alt={`${agent.agencyName || "Agency"} logo`} className="h-8 max-w-[120px] object-contain shrink-0" />
            )}
            {(!brandData.logoUrl || showAgencyNameWithLogo) && (
              <span className="font-display text-lg font-bold text-foreground truncate">{agent.agencyName || "Travel Co."}</span>
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
          {isGroupBooking && bookingUrl && (
            <Button variant="travel" size="sm" className="text-xs" onClick={() => openModal(bookingUrl, "Book Now")}>
              Book Now
            </Button>
          )}
          {!isGroupBooking && (
            <Button variant="travel" size="sm" className="text-xs" onClick={goToApprove}>
              Approve
            </Button>
          )}
        </div>
      </nav>

      {/* HERO */}
      {vis.hero && (
        <section className="relative">
          {data.heroMediaType === "video" && data.heroVideoUrl ? (
            <div className={`${data.heroAutoplay ? '' : 'max-h-[500px]'} overflow-hidden`}>
              <VideoEmbed url={data.heroVideoUrl} title={data.destination} thumbnailUrl={data.heroVideoThumbnailUrl} className="rounded-none aspect-[21/9]" autoplay={!!data.heroAutoplay} muted={!!data.heroMuted} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 max-h-[500px] overflow-hidden">
              <div className="md:col-span-2 aspect-[16/9] md:aspect-auto md:h-[500px] overflow-hidden cursor-pointer relative group" onClick={() => {
                const allHeroImgs = [{ src: heroImage, alt: data.destination }, ...heroImages.map((u, i) => ({ src: u, alt: `${data.destination} ${i + 2}` }))];
                openLightbox(allHeroImgs, 0);
              }}>
                <img src={heroImage} alt={data.destination} className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:grid grid-rows-2 gap-1 h-[500px]">
                {heroImages.length > 0 ? heroImages.slice(0, 2).map((url, i) => (
                  <div key={i} className="overflow-hidden cursor-pointer relative group" onClick={() => {
                    const allHeroImgs = [{ src: heroImage, alt: data.destination }, ...heroImages.map((u, j) => ({ src: u, alt: `${data.destination} ${j + 2}` }))];
                    openLightbox(allHeroImgs, i + 1);
                  }}>
                    <img src={url} alt={`${data.destination} ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                )) : (
                  <>
                    <div className="bg-muted flex items-center justify-center"><Camera className="h-10 w-10 text-muted-foreground/20" /></div>
                    <div className="bg-muted flex items-center justify-center"><Camera className="h-10 w-10 text-muted-foreground/20" /></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Title section below images */}
          <div className="max-w-5xl mx-auto px-6 py-10 text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {data.destination || "Your Destination"}
            </motion.h1>
            {data.subtitle && (
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="font-display text-lg sm:text-xl text-muted-foreground mt-3 italic">
                {data.subtitle}
              </motion.p>
            )}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex items-center justify-center gap-4 mt-6 flex-wrap">
              {data.travelDates && <span className="flex items-center gap-1.5 bg-muted text-foreground px-4 py-2 rounded-full text-sm font-body"><Calendar className="h-4 w-4 text-primary" /> {data.travelDates}</span>}
              {data.travelerCount && <span className="flex items-center gap-1.5 bg-muted text-foreground px-4 py-2 rounded-full text-sm font-body"><Users className="h-4 w-4 text-primary" /> {data.travelerCount}</span>}
              {data.destinationCount && <span className="flex items-center gap-1.5 bg-muted text-foreground px-4 py-2 rounded-full text-sm font-body"><MapPin className="h-4 w-4 text-primary" /> {data.destinationCount}</span>}
            </motion.div>
          </div>
        </section>
      )}

      {/* DYNAMIC SECTIONS */}
      {sectionOrder.map((sectionKey) => {
        if (!vis[sectionKey]) return null;

        switch (sectionKey) {
          case "overview":
            return (
              <section key="overview" id="overview" className="py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                  <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Prepared Exclusively For</motion.p>
                  <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                    {data.clientName || "Your Client"}
                  </motion.h2>
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} className="w-16 h-0.5 bg-primary mx-auto mt-6 mb-8" />
                  {data.introText && (
                    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} className="text-muted-foreground leading-relaxed text-lg font-body prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: data.introText }} />
                  )}
                </div>
              </section>
            );

          case "flights":
            if (flights.length === 0) return null;
            return (
              <section key="flights" id="flights" className="py-20 bg-card">
                <div className="max-w-4xl mx-auto px-6">
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Flights</p>
                    <h2 className="font-display text-4xl font-bold text-foreground">Air Travel</h2>
                  </motion.div>
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {flights.map((flight) => {
                      const isSelected = selectedFlight === flight.id;
                      return (
                      <div
                        key={flight.id}
                        className={`bg-background rounded-2xl border-2 shadow-sm p-6 relative overflow-hidden transition-all ${
                          !isGroupBooking
                            ? isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/40"
                            : "border-border/50"
                        }`}
                      >
                        {!isGroupBooking && (
                          <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`} onClick={() => setSelectedFlight(isSelected ? "" : flight.id)}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        )}
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
                        {flight.price && (
                          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                            <span className="font-display text-xl font-bold text-foreground">${flight.price}</span>
                            {!isGroupBooking && (
                              <Button
                                variant={isSelected ? "travel" : "travel-outline"}
                                size="sm"
                                className="text-xs"
                                onClick={(e) => { e.stopPropagation(); setSelectedFlight(isSelected ? "" : flight.id); }}
                              >
                                {isSelected ? "✓ Selected" : "Select"}
                              </Button>
                            )}
                          </div>
                        )}
                        {!flight.price && !isGroupBooking && (
                          <div className="mt-4 pt-3 border-t border-border/30 flex justify-end">
                            <Button
                              variant={isSelected ? "travel" : "travel-outline"}
                              size="sm"
                              className="text-xs"
                              onClick={(e) => { e.stopPropagation(); setSelectedFlight(isSelected ? "" : flight.id); }}
                            >
                              {isSelected ? "✓ Selected" : "Select"}
                            </Button>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </motion.div>
                </div>
              </section>
            );

          case "accommodations":
            if (accommodations.length === 0) return null;
            return (
              <section key="accommodations" id="accommodations" className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Where You'll Stay</p>
                    <h2 className="font-display text-4xl font-bold text-foreground">Accommodations</h2>
                    {!isGroupBooking && accommodations.length > 1 && <p className="text-sm text-muted-foreground font-body mt-2">Select your preferred option</p>}
                  </motion.div>
                  <div className="space-y-10">
                    {accommodations.map((acc) => {
                      const isSelected = selectedAccommodation === acc.id;
                      const amenities = (acc.amenities || []).filter(Boolean);
                      const highlights = (acc.highlights || []).filter(Boolean);
                      const galleryUrls = acc.galleryUrls || [];
                      const allAccImages = [
                        ...(acc.imageUrl ? [{ src: acc.imageUrl, alt: acc.hotelName }] : []),
                        ...galleryUrls.map((url, gi) => ({ src: url, alt: `${acc.hotelName} ${gi + 2}` })),
                      ];
                      const showAccVideo = (acc.mediaType || "photos") === "video" && !!acc.videoUrl;
                      const showAccPhotos = !showAccVideo;
                      return (
                        <motion.div
                          key={acc.id}
                          variants={fadeUp}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          custom={0}
                          className={`bg-card rounded-2xl border-2 shadow-lg overflow-hidden transition-all ${
                            !isGroupBooking
                              ? isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/40 cursor-pointer"
                              : "border-border/50"
                          }`}
                          onClick={() => !isGroupBooking && setSelectedAccommodation(acc.id)}
                        >
                          {!isGroupBooking && accommodations.length > 1 && (
                            <div className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"}`}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                            </div>
                          )}
                          {showAccPhotos ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
                              {acc.imageUrl && (
                                <div className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => openLightbox(allAccImages, 0)}>
                                  <img src={acc.imageUrl} alt={acc.hotelName} className="w-full h-full object-cover" />
                                </div>
                              )}
                              {!acc.imageUrl && (
                                <div className="col-span-2 row-span-2 aspect-[4/3] bg-muted flex items-center justify-center">
                                  <BedDouble className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                              )}
                              {galleryUrls.slice(0, 6).map((url, gi) => (
                                <div key={gi} className="aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => openLightbox(allAccImages, gi + 1)}>
                                  <img src={url} alt={`${acc.hotelName} ${gi + 2}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {galleryUrls.length > 6 && (
                                <div className="aspect-[4/3] bg-muted/60 flex items-center justify-center cursor-pointer rounded-sm" onClick={() => openLightbox(allAccImages, 7)}>
                                  <span className="text-sm font-body font-semibold text-muted-foreground">+{galleryUrls.length - 6} more</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 sm:p-6 border-b border-border/30">
                              <VideoEmbed url={acc.videoUrl!} title={acc.hotelName} thumbnailUrl={acc.videoThumbnailUrl} className="w-full" />
                            </div>
                          )}
                          <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-display text-2xl font-bold text-foreground mb-1">{acc.hotelName || "Hotel"}</h3>
                                <p className="text-sm text-muted-foreground font-body flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {acc.location}</p>
                              </div>
                              <BedDouble className="h-6 w-6 text-primary mt-1 shrink-0" />
                            </div>
                            {acc.roomType && <p className="font-body text-foreground font-semibold mt-3">{acc.roomType}</p>}
                            {acc.description && <div className="text-sm text-muted-foreground font-body mt-2 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: acc.description }} />}
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
            );

          case "cruiseShips":
            if (cruiseShips.length === 0) return null;
            return (
              <section key="cruiseShips" id="cruiseShips" className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Vessel</p>
                    <h2 className="font-display text-4xl font-bold text-foreground">Cruise Ship & Cabin</h2>
                  </motion.div>
                  <div className="space-y-10">
                    {cruiseShips.map((ship) => {
                      const isSelected = selectedCruise === ship.id;
                      const amenities = (ship.amenities || []).filter(Boolean);
                      const highlights = (ship.highlights || []).filter(Boolean);
                      const galleryUrls = ship.galleryUrls || [];
                      const allShipImages = [
                        ...(ship.imageUrl ? [{ src: ship.imageUrl, alt: ship.shipName }] : []),
                        ...galleryUrls.map((url, gi) => ({ src: url, alt: `${ship.shipName} ${gi + 2}` })),
                      ];
                      const showShipVideo = (ship.mediaType || "photos") === "video" && !!ship.videoUrl;
                      const showShipPhotos = !showShipVideo;
                      return (
                        <motion.div
                          key={ship.id}
                          variants={fadeUp}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          custom={0}
                          className={`bg-card rounded-2xl border-2 shadow-lg overflow-hidden relative transition-all ${
                            !isGroupBooking
                              ? isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/40 cursor-pointer"
                              : "border-border/50"
                          }`}
                          onClick={() => !isGroupBooking && setSelectedCruise(ship.id)}
                        >
                          {!isGroupBooking && cruiseShips.length > 1 && (
                            <div className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"}`}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                            </div>
                          )}
                          {showShipPhotos ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
                              {ship.imageUrl && (
                                <div className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => openLightbox(allShipImages, 0)}>
                                  <img src={ship.imageUrl} alt={ship.shipName} className="w-full h-full object-cover" />
                                </div>
                              )}
                              {!ship.imageUrl && (
                                <div className="col-span-2 row-span-2 aspect-[4/3] bg-muted flex items-center justify-center">
                                  <Ship className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                              )}
                              {galleryUrls.slice(0, 6).map((url, gi) => (
                                <div key={gi} className="aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => openLightbox(allShipImages, gi + 1)}>
                                  <img src={url} alt={`${ship.shipName} ${gi + 2}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 sm:p-6 border-b border-border/30">
                              <VideoEmbed url={ship.videoUrl!} title={ship.shipName} thumbnailUrl={ship.videoThumbnailUrl} className="w-full" />
                            </div>
                          )}
                          <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-display text-2xl font-bold text-foreground mb-1">{ship.shipName || "Cruise Ship"}</h3>
                                <p className="text-sm text-muted-foreground font-body flex items-center gap-1"><Ship className="h-3.5 w-3.5" /> {ship.cruiseLine}</p>
                              </div>
                              <Anchor className="h-6 w-6 text-primary mt-1 shrink-0" />
                            </div>
                            {/* Cabin details */}
                            <div className="flex flex-wrap gap-3 mt-4">
                              {ship.cabinType && (
                                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-body font-semibold px-3 py-1.5 rounded-full">{ship.cabinType}</span>
                              )}
                              {ship.cabinNumber && (
                                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full">Cabin {ship.cabinNumber}</span>
                              )}
                              {ship.deck && (
                                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full">{ship.deck}</span>
                              )}
                            </div>
                            {ship.description && <div className="text-sm text-muted-foreground font-body mt-4 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: ship.description }} />}
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
                            {amenities.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/30">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Ship Amenities</p>
                                <div className="flex flex-wrap gap-2">
                                  {amenities.map((a, ai) => (
                                    <span key={ai} className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full border border-border/30">
                                      <Check className="h-3 w-3 text-primary" /> {a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/30 text-sm text-muted-foreground font-body flex-wrap">
                              {ship.embarkationPort && <span className="flex items-center gap-1.5"><Anchor className="h-3.5 w-3.5" /> Embark: {ship.embarkationPort}</span>}
                              {ship.embarkationDate && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {ship.embarkationDate}</span>}
                              {ship.disembarkationPort && <span className="flex items-center gap-1.5"><Anchor className="h-3.5 w-3.5" /> Disembark: {ship.disembarkationPort}</span>}
                              {ship.disembarkationDate && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {ship.disembarkationDate}</span>}
                              {ship.nights && <span className="text-primary font-semibold">{ship.nights} Nights</span>}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          case "busTrips":
            if (busTrips.length === 0) return null;
            return (
              <section key="busTrips" id="busTrips" className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Ground Transport</p>
                    <h2 className="font-display text-4xl font-bold text-foreground">Bus Trips</h2>
                  </motion.div>
                  <div className="space-y-10">
                    {busTrips.map((trip) => {
                      const isSelected = selectedBusTrip === trip.id;
                      const amenities = (trip.amenities || []).filter(Boolean);
                      const highlights = (trip.highlights || []).filter(Boolean);
                      const galleryUrls = trip.galleryUrls || [];
                      const stops = trip.stops || [];
                      const allTripImages = [
                        ...(trip.imageUrl ? [{ src: trip.imageUrl, alt: trip.routeName }] : []),
                        ...galleryUrls.map((url, gi) => ({ src: url, alt: `${trip.routeName} ${gi + 2}` })),
                      ];
                      const showVideo = (trip.mediaType || "photos") === "video" && !!trip.videoUrl;
                      return (
                        <motion.div
                          key={trip.id}
                          variants={fadeUp}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          custom={0}
                          className={`bg-card rounded-2xl border-2 shadow-lg overflow-hidden relative transition-all ${
                            !isGroupBooking
                              ? isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/40 cursor-pointer"
                              : "border-border/50"
                          }`}
                          onClick={() => !isGroupBooking && setSelectedBusTrip(trip.id)}
                        >
                          {!isGroupBooking && busTrips.length > 1 && (
                            <div className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"}`}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                            </div>
                          )}
                          {showVideo ? (
                            <div className="p-4 sm:p-6 border-b border-border/30">
                              <VideoEmbed url={trip.videoUrl!} title={trip.routeName} thumbnailUrl={trip.videoThumbnailUrl} className="w-full" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
                              {trip.imageUrl ? (
                                <div className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => openLightbox(allTripImages, 0)}>
                                  <img src={trip.imageUrl} alt={trip.routeName} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="col-span-2 row-span-2 aspect-[4/3] bg-muted flex items-center justify-center">
                                  <Bus className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                              )}
                              {galleryUrls.slice(0, 6).map((url, gi) => (
                                <div key={gi} className="aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => openLightbox(allTripImages, gi + 1)}>
                                  <img src={url} alt={`${trip.routeName} ${gi + 2}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-display text-2xl font-bold text-foreground mb-1">{trip.routeName || "Bus Trip"}</h3>
                                {trip.busCompany && <p className="text-sm text-muted-foreground font-body flex items-center gap-1"><Bus className="h-3.5 w-3.5" /> {trip.busCompany}</p>}
                              </div>
                              <Bus className="h-6 w-6 text-primary mt-1 shrink-0" />
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                              {trip.busType && <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-body font-semibold px-3 py-1.5 rounded-full">{trip.busType}</span>}
                              {trip.seatType && <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full">{trip.seatType}</span>}
                              {trip.duration && <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full"><Clock className="h-3 w-3" /> {trip.duration}</span>}
                            </div>
                            {trip.description && <div className="text-sm text-muted-foreground font-body mt-4 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: trip.description }} />}
                            {/* Stops timeline */}
                            {stops.length > 0 && (
                              <div className="mt-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Route Stops</p>
                                <div className="space-y-0 relative ml-3">
                                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-border" />
                                  {stops.map((stop, si) => (
                                    <div key={stop.id || si} className="relative pl-6 py-2">
                                      <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                                      <p className="text-sm font-body font-semibold text-foreground">{stop.location}</p>
                                      <div className="flex gap-3 text-xs text-muted-foreground font-body mt-0.5">
                                        {stop.arrivalTime && <span>Arrive: {stop.arrivalTime}</span>}
                                        {stop.departureTime && <span>Depart: {stop.departureTime}</span>}
                                      </div>
                                      {stop.notes && <p className="text-xs text-muted-foreground/80 font-body mt-0.5 italic">{stop.notes}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
                            {amenities.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/30">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Bus Amenities</p>
                                <div className="flex flex-wrap gap-2">
                                  {amenities.map((a, ai) => (
                                    <span key={ai} className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full border border-border/30">
                                      <Check className="h-3 w-3 text-primary" /> {a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/30 text-sm text-muted-foreground font-body flex-wrap">
                              {trip.pickupLocation && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Pickup: {trip.pickupLocation}</span>}
                              {trip.pickupDate && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {trip.pickupDate}</span>}
                              {trip.pickupTime && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {trip.pickupTime}</span>}
                            </div>
                            {(trip.dropoffLocation || trip.dropoffDate || trip.dropoffTime) && (
                              <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground font-body flex-wrap">
                                {trip.dropoffLocation && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Dropoff: {trip.dropoffLocation}</span>}
                                {trip.dropoffDate && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {trip.dropoffDate}</span>}
                                {trip.dropoffTime && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {trip.dropoffTime}</span>}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          case "itinerary":
            if (data.days.length === 0) return null;
            return (
              <section key="itinerary" id="itinerary" className="pb-20 pt-20 bg-card">
                <div className="max-w-5xl mx-auto px-6">
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-16">
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Journey</p>
                    <h2 className="font-display text-4xl font-bold text-foreground">Day-by-Day Itinerary</h2>
                  </motion.div>
                  <div className="space-y-16">
                    {data.days.map((day, dayIdx) => {
                      const isLastDay = dayIdx === data.days.length - 1;
                      return (
                        <motion.div key={day.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={0}>
                          <div className="mb-5 border-b border-border/40 pb-4">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-body font-semibold">Day {dayIdx + 1}</span>
                              {day.date && <span className="text-sm text-muted-foreground font-body flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {day.date}</span>}
                              {day.location && <span className="text-sm text-muted-foreground font-body flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {day.location}</span>}
                            </div>
                            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{day.title}</h3>
                          </div>
                          <div className="space-y-8">
                            {day.activities.map((act, actIdx) => {
                              const hasImages = act.imageUrls && act.imageUrls.length > 0;
                              const hasVideo = !!act.videoUrl;
                              return (
                                <div key={act.id || actIdx}>
                                  <div className={`flex flex-col ${hasImages || hasVideo ? 'sm:flex-row' : ''} gap-6`}>
                                    <div className="flex-1">
                                      <div className="flex items-start gap-3">
                                        <div className="relative z-10 mt-1.5 w-[13px] h-[13px] shrink-0 rounded-full border-2 border-primary bg-background" />
                                        <div className="flex-1">
                                          {act.time && (
                                            <span className="text-xs font-semibold text-primary font-body flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> {act.time}</span>
                                          )}
                                          <p className="font-display text-lg font-bold text-foreground">{act.title || "Untitled Activity"}</p>
                                          {act.description && <p className="text-sm text-muted-foreground font-body mt-1.5 leading-relaxed">{act.description}</p>}
                                        </div>
                                      </div>
                                    </div>
                                    {hasImages && (
                                      <div
                                        className="sm:w-[260px] md:w-[300px] h-[180px] sm:h-[200px] shrink-0 rounded-xl overflow-hidden cursor-pointer group relative"
                                        onClick={() => openLightbox(act.imageUrls!.map((u) => ({ src: u, alt: act.title })), 0)}
                                      >
                                        <img
                                          src={act.imageUrls![0]}
                                          alt={act.title || "Activity photo"}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {act.imageUrls!.length > 1 && (
                                          <div className="absolute bottom-2 right-2 bg-foreground/60 text-background text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                                            +{act.imageUrls!.length - 1} more
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {hasVideo && !hasImages && (
                                      <div className="sm:w-[260px] md:w-[300px] shrink-0">
                                        <VideoEmbed url={act.videoUrl!} title={act.title} thumbnailUrl={act.videoThumbnailUrl} className="rounded-xl" />
                                      </div>
                                    )}
                                  </div>
                                  {hasVideo && hasImages && (
                                    <div className="mt-4">
                                      <VideoEmbed url={act.videoUrl!} title={act.title} thumbnailUrl={act.videoThumbnailUrl} className="max-w-md" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {!isLastDay && (
                            <div className="mt-12 border-t border-border" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          case "inclusions":
            if (data.inclusions.filter(Boolean).length === 0) return null;
            return (
              <section key="inclusions" id="inclusions" className="py-20">
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
            );

          case "pricing":
            if (data.pricing.length === 0) return null;
            return (
              <section key="pricing" id="pricing" className="py-20 bg-card">
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
                      {isGroupBooking ? (
                        bookingUrl && (
                          <Button variant="travel" size="lg" className="text-lg px-10 py-6 h-auto" onClick={() => openModal(bookingUrl, "Book Now")}>
                            <CheckCircle2 className="h-5 w-5 mr-2" /> Book Now
                          </Button>
                        )
                      ) : (
                        <>
                          <Button variant="travel" size="lg" className="text-lg px-10 py-6 h-auto" onClick={goToApprove}>
                            <CheckCircle2 className="h-5 w-5 mr-2" /> Approve Itinerary
                          </Button>
                          <Button variant="travel-outline" size="lg" className="text-lg px-10 py-6 h-auto" onClick={goToRevisions}>
                            <MessageSquare className="h-5 w-5 mr-2" /> Request Revisions
                          </Button>
                        </>
                      )}
                    </div>
                    {data.validUntil && <p className="text-sm text-muted-foreground mt-4 font-body">This proposal is valid until {data.validUntil}</p>}
                  </motion.div>
                </div>
              </section>
            );

          case "essentials":
            return null;

          case "terms": {
            const hasTerms = terms.cancellationPolicy || terms.travelInsurance || terms.bookingTerms || terms.liability;
            if (!hasTerms) return null;
            return (
              <section key="terms" id="terms" className="py-20 bg-card">
                <div className="max-w-4xl mx-auto px-6">
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Important Information</p>
                    <h2 className="font-display text-4xl font-bold text-foreground">Terms & Conditions</h2>
                  </motion.div>
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="space-y-6">
                    {terms.showCancellation !== false && terms.cancellationPolicy && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Cancellation Policy</p>
                        <div className="prose prose-sm max-w-none text-foreground font-body" dangerouslySetInnerHTML={{ __html: terms.cancellationPolicy }} />
                      </div>
                    )}
                    {terms.showInsurance !== false && terms.travelInsurance && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Travel Insurance</p>
                        <div className="prose prose-sm max-w-none text-foreground font-body" dangerouslySetInnerHTML={{ __html: terms.travelInsurance }} />
                      </div>
                    )}
                    {terms.showBookingTerms !== false && terms.bookingTerms && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Booking Terms</p>
                        <div className="prose prose-sm max-w-none text-foreground font-body" dangerouslySetInnerHTML={{ __html: terms.bookingTerms }} />
                      </div>
                    )}
                    {terms.showLiability !== false && terms.liability && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">Liability</p>
                        <div className="prose prose-sm max-w-none text-foreground font-body" dangerouslySetInnerHTML={{ __html: terms.liability }} />
                      </div>
                    )}
                  </motion.div>
                </div>
              </section>
            );
          }

          case "agent":
            return (
              <footer key="agent" className="py-16 px-6 border-t border-border/50 bg-card">
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
                  {isGroupBooking ? (
                    bookingUrl && (
                      <Button variant="travel" size="lg" className="text-base px-8" onClick={() => openModal(bookingUrl, "Book Now")}>
                        Book Now <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )
                  ) : (
                    <Button variant="travel" size="lg" className="text-base px-8" onClick={goToApprove}>
                      Approve Itinerary <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-10 font-body">© 2026 {agent.agencyName} · All prices in USD · Subject to availability</p>
                </div>
              </footer>
            );

          default:
            return null;
        }
      })}

      {/* PROPOSAL SELECTION SUMMARY — only for Proposal type */}
      {!isGroupBooking && (
        <section id="selection-summary" className="py-20 bg-card border-t border-border/50">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-10">
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Selections</p>
              <h2 className="font-display text-4xl font-bold text-foreground">Trip Summary</h2>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="bg-background rounded-2xl border border-border/50 shadow-lg p-8">
              <div className="space-y-4 mb-6">
                {flights.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Flight</span>
                    </div>
                    <span className="font-body text-sm text-muted-foreground">
                      {selectedFlight ? (() => { const f = flights.find(f => f.id === selectedFlight); return <>{f?.airline} — {f?.departureAirport?.split("–")[0]?.trim()} → {f?.arrivalAirport?.split("–")[0]?.trim()}{f?.price ? <span className="ml-2 text-primary font-semibold">${f.price}</span> : null}</>; })() : <span className="text-destructive text-xs">Not selected</span>}
                    </span>
                  </div>
                )}
                {accommodations.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Accommodation</span>
                    </div>
                    <span className="font-body text-sm text-muted-foreground">
                      {selectedAccommodation ? (() => { const a = accommodations.find(a => a.id === selectedAccommodation); return <>{a?.hotelName || "Selected"}{a?.price ? <span className="ml-2 text-primary font-semibold">${a.price}</span> : null}</>; })() : <span className="text-destructive text-xs">Not selected</span>}
                    </span>
                  </div>
                )}
                {cruiseShips.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Cruise</span>
                    </div>
                    <span className="font-body text-sm text-muted-foreground">
                      {selectedCruise ? (() => { const s = cruiseShips.find(s => s.id === selectedCruise); return <>{s?.shipName || "Selected"}{s?.price ? <span className="ml-2 text-primary font-semibold">${s.price}</span> : null}</>; })() : <span className="text-destructive text-xs">Not selected</span>}
                    </span>
                  </div>
                )}
                {busTrips.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Bus Trip</span>
                    </div>
                    <span className="font-body text-sm text-muted-foreground">
                      {selectedBusTrip ? (() => { const b = busTrips.find(b => b.id === selectedBusTrip); return <>{b?.routeName || "Selected"}{b?.price ? <span className="ml-2 text-primary font-semibold">${b.price}</span> : null}</>; })() : <span className="text-destructive text-xs">Not selected</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing lines if available */}
              {data.pricing.length > 0 && (
                <div className="space-y-3 mb-6 pt-4 border-t border-border/30">
                  {data.pricing.map((line) => (
                    <div key={line.id} className="flex justify-between items-center font-body">
                      <span className="text-muted-foreground">{line.label}</span>
                      <span className="font-semibold text-foreground">{line.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button variant="travel" size="lg" className="text-lg px-10 py-6 h-auto" onClick={goToApprove}>
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Approve Itinerary
                </Button>
                <Button variant="travel-outline" size="lg" className="text-lg px-10 py-6 h-auto" onClick={goToRevisions}>
                  <MessageSquare className="h-5 w-5 mr-2" /> Request Revisions
                </Button>
              </div>
              {data.validUntil && <p className="text-sm text-muted-foreground mt-4 text-center font-body">This proposal is valid until {data.validUntil}</p>}
            </motion.div>
          </div>
        </section>
      )}

      <Lightbox images={lightboxImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} url={bookingModalUrl} agencyName={bookingModalTitle || agent.agencyName} />
    </div>
  );
}
