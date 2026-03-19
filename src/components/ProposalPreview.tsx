import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, parse } from "date-fns";
import { motion, type Easing, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  Utensils,
  Hotel,
  Camera,
  Wine,
  Plane,
  ArrowRight,
  Check,
  Phone,
  Mail,
  Globe,
  PlaneTakeoff,
  PlaneLanding,
  BedDouble,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Ship,
  Anchor,
  Bus,
  ChevronDown,
} from "lucide-react";
import Lightbox from "@/components/Lightbox";
import { parseAirportValue } from "@/components/AirportAutocomplete";
import BookingModal from "@/components/BookingModal";
import VideoEmbed from "@/components/VideoEmbed";
import { Button } from "@/components/ui/button";
import type { ProposalData, Activity, SectionKey } from "@/types/proposal";
import { defaultSectionOrder } from "@/types/proposal";
import { buildBrandCssVars } from "@/lib/brand";

const PARSE_FMTS = ["MMMM d, yyyy", "MMM d, yyyy", "yyyy-MM-dd", "MM/dd/yyyy"];
function tryParseDate(v: string): Date | undefined {
  if (!v) return undefined;
  for (const f of PARSE_FMTS) { try { const d = parse(v.trim(), f, new Date()); if (!isNaN(d.getTime())) return d; } catch {} }
  const d = new Date(v); return isNaN(d.getTime()) ? undefined : d;
}
function formatDateRange(startStr?: string, endStr?: string): string {
  const s = startStr ? tryParseDate(startStr) : undefined;
  const e = endStr ? tryParseDate(endStr) : undefined;
  if (s && e) return `${format(s, "MMM d")}–${format(e, "d, yyyy")}`;
  if (s) return format(s, "MMM d, yyyy");
  if (e) return format(e, "MMM d, yyyy");
  return "";
}

const fallbackImages: string[] = [];

const fmtCurrency = (val: string) => {
  const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return val;
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const easeOut: Easing = [0.25, 0.46, 0.45, 0.94];
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
  }),
};

function getActivityIcon(type: Activity["type"]) {
  switch (type) {
    case "transport":
      return <Plane className="h-4 w-4" />;
    case "hotel":
      return <Hotel className="h-4 w-4" />;
    case "dining":
      return <Utensils className="h-4 w-4" />;
    case "sightseeing":
      return <Camera className="h-4 w-4" />;
    case "activity":
      return <Wine className="h-4 w-4" />;
    default:
      return <Camera className="h-4 w-4" />;
  }
}

export type EditorSubPage = "checkout" | "approve" | "revisions";

interface Props {
  data: ProposalData;
  shareId?: string;
  isEditor?: boolean;
  onEditorSubPage?: (page: EditorSubPage) => void;
}

function ItinerarySection({
  data,
  fadeUp,
  openLightbox,
}: {
  data: ProposalData;
  fadeUp: any;
  openLightbox: (images: { src: string; alt?: string }[], index?: number) => void;
}) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    data.days.forEach((day, i) => {
      initial[day.id] = i === 0;
    });
    return initial;
  });

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  return (
    <section id="itinerary" className="pb-20 pt-20 bg-card">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">{data.sectionCustomTitles?.itinerary?.subtitle || "Your Journey"}</p>
          <h2 className="font-display text-4xl font-bold text-foreground">{data.sectionCustomTitles?.itinerary?.title || "Day-by-Day Itinerary"}</h2>
        </motion.div>
        <div className="space-y-4">
          {data.days.filter(d => !d.hidden).map((day, dayIdx) => {
            const isOpen = expandedDays[day.id] ?? false;
            return (
              <motion.div
                key={day.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={0}
              >
                <button
                  onClick={() => toggleDay(day.id)}
                  className="w-full flex items-center justify-between gap-3 pb-4 pt-2 border-b border-border/40 cursor-pointer group text-left"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-body font-semibold">
                        Day {dayIdx + 1}
                      </span>
                      {day.date && (
                        <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {day.date}
                        </span>
                      )}
                      {day.location && (
                        <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {day.location}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{day.title}</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-8 pt-6 pb-4">
                        {day.activities.map((act, actIdx) => {
                          const hasImages = act.imageUrls && act.imageUrls.length > 0;
                          const hasVideo = !!act.videoUrl;
                          return (
                            <div key={act.id || actIdx}>
                              <div className={`flex flex-col ${hasImages || hasVideo ? "sm:flex-row" : ""} gap-6`}>
                                <div className="flex-1">
                                  <div className="flex items-start gap-3">
                                    <div className="relative z-10 mt-1.5 w-[13px] h-[13px] shrink-0 rounded-full border-2 border-primary bg-background" />
                                    <div className="flex-1">
                                      {act.time && (
                                        <span className="text-xs font-semibold text-primary font-body flex items-center gap-1 mb-1">
                                          <Clock className="h-3 w-3" /> {act.time}
                                        </span>
                                      )}
                                      <p className="font-display text-lg font-bold text-foreground">
                                        {act.title || "Untitled Activity"}
                                      </p>
                                      {act.description && (
                                        <p className="text-sm text-muted-foreground font-body mt-1.5 leading-relaxed">
                                          {act.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {hasImages && (
                                  <div
                                    className="sm:w-[260px] md:w-[300px] h-[180px] sm:h-[200px] shrink-0 rounded-xl overflow-hidden cursor-pointer group relative"
                                    onClick={() =>
                                      openLightbox(
                                        act.imageUrls!.map((u) => ({ src: u, alt: act.title })),
                                        0,
                                      )
                                    }
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
                                    <VideoEmbed
                                      url={act.videoUrl!}
                                      title={act.title}
                                      thumbnailUrl={act.videoThumbnailUrl}
                                      className="rounded-xl"
                                    />
                                  </div>
                                )}
                              </div>
                              {hasVideo && hasImages && (
                                <div className="mt-4">
                                  <VideoEmbed
                                    url={act.videoUrl!}
                                    title={act.title}
                                    thumbnailUrl={act.videoThumbnailUrl}
                                    className="max-w-md"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function ProposalPreview({ data, shareId, isEditor, onEditorSubPage }: Props) {
  const isGroupBooking = (data as any).proposalType !== "proposal";
  const navigate = useNavigate();
  const heroImage = data.heroImageUrl || "";
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
  const [selectedPricingOption, setSelectedPricingOption] = useState<string>("");
  const vis = data.sectionVisibility || {
    hero: true,
    overview: true,
    flights: true,
    accommodations: true,
    cruiseShips: true,
    busTrips: true,
    itinerary: true,
    inclusions: true,
    pricing: true,
    essentials: true,
    terms: true,
    agent: true,
  };
  const brandData = data.brand || {
    primaryColor: "",
    secondaryColor: "",
    accentColor: "",
    logoUrl: "",
    showAgencyNameWithLogo: true,
  };
  const sectionOrder = data.sectionOrder || defaultSectionOrder;
  const ct = data.sectionCustomTitles || {};
  const flightOptions = (data.flightOptions || []).filter(o => !o.hidden);
  const accommodations = (data.accommodations || []).filter(a => !a.hidden);
  const accommodationsMode = ((data as any).accommodationsMode || "client_selects_one") as "informational_only" | "client_selects_one";
  const accommodationSelectionEnabled = !isGroupBooking && accommodationsMode === "client_selects_one";
  const effectiveSelectedAccommodation = accommodationSelectionEnabled ? selectedAccommodation : "";
  const cruiseShips = (data.cruiseShips || []).filter(s => !s.hidden);
  const busTrips = (data.busTrips || []).filter(t => !(t as any).hidden);
  const pricingOptions = data.pricingOptions || [];
  const agent = data.agent || {
    name: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    agencyName: "",
    logoUrl: "",
    photoUrl: "",
  };
  const essentials = data.essentials || {
    visaRequirements: "",
    passportInfo: "",
    currency: "",
    language: "",
    timeZone: "",
    weatherInfo: "",
    packingTips: "",
    emergencyContacts: "",
  };
  const terms = data.terms || {
    cancellationPolicy: "",
    travelInsurance: "",
    bookingTerms: "",
    liability: "",
    showCancellation: true,
    showInsurance: true,
    showBookingTerms: true,
    showLiability: true,
  };

  const brandStyles = useMemo(() => buildBrandCssVars(brandData), [brandData]);
  const showAgencyNameWithLogo = brandData.showAgencyNameWithLogo ?? true;

  const sectionLabels: Record<SectionKey, string> = {
    overview: "Overview",
    flights: "Flights",
    accommodations: "Hotels",
    cruiseShips: "Cruise",
    busTrips: "Bus",
    itinerary: "Itinerary",
    inclusions: "Included",
    pricing: "Pricing",
    essentials: "Essentials",
    terms: "Terms",
    agent: "Advisor",
  };

  const navItems = useMemo(() => {
    const hasContent: Record<string, boolean> = {
      overview: !!data.introText,
      flights: flightOptions.length > 0,
      accommodations: accommodations.length > 0,
      cruiseShips: cruiseShips.length > 0,
      busTrips: busTrips.length > 0,
      itinerary: (data.days || []).filter(d => !d.hidden).length > 0,
      inclusions: (data.inclusions || []).length > 0,
      pricing: (data.pricing || []).length > 0 || (data.pricingOptions || []).length > 0,
      essentials: !!(
        essentials.passportInfo ||
        essentials.currency ||
        essentials.weatherInfo ||
        essentials.packingTips
      ),
      terms: !!(terms.cancellationPolicy || terms.travelInsurance || terms.bookingTerms || terms.liability),
      agent: !!agent.name,
    };
    return sectionOrder
      .filter((key) => key !== "agent" && vis[key] && hasContent[key])
      .map((key) => ({ label: sectionLabels[key], id: key }));
  }, [vis, sectionOrder, data, flightOptions, accommodations, cruiseShips, busTrips, essentials, terms, agent]);

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

  const checkoutEnabled = data.checkout?.enabled;
  const goToCheckout = useCallback(() => {
    if (isEditor && onEditorSubPage) {
      onEditorSubPage("checkout");
      return;
    }
    const selectedOpt = pricingOptions.find((o) => o.id === selectedPricingOption) || null;
    navigate(`/checkout${shareId ? `?share=${shareId}` : ""}`, {
      state: {
        brand: brandData,
        returnTo,
        selectedPricingOption: selectedOpt,
        tripName: data.clientName || data.destination || "",
      },
    });
  }, [
    navigate,
    shareId,
    brandData,
    returnTo,
    pricingOptions,
    selectedPricingOption,
    data.clientName,
    data.destination,
    isEditor,
    onEditorSubPage,
  ]);

  const goToApprove = useCallback(() => {
    if (checkoutEnabled) {
      goToCheckout();
      return;
    }
    if (isEditor && onEditorSubPage) {
      onEditorSubPage("approve");
      return;
    }
    const url = approveUrl || bookingUrl;
    if (url) {
      openModal(url, "Approve Itinerary");
    } else {
      navigate(`/approve${shareId ? `?share=${shareId}` : ""}`, { state: { brand: brandData, returnTo } });
    }
  }, [
    navigate,
    shareId,
    brandData,
    returnTo,
    bookingUrl,
    approveUrl,
    openModal,
    checkoutEnabled,
    goToCheckout,
    isEditor,
    onEditorSubPage,
  ]);

  const goToRevisions = useCallback(() => {
    if (isEditor && onEditorSubPage) {
      onEditorSubPage("revisions");
      return;
    }
    if (revisionsUrl) {
      openModal(revisionsUrl, "Request Revisions");
    } else {
      navigate(`/revisions${shareId ? `?share=${shareId}` : ""}`, { state: { brand: brandData, returnTo } });
    }
  }, [navigate, shareId, brandData, returnTo, revisionsUrl, openModal, isEditor, onEditorSubPage]);

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      {/* STICKY HEADER NAV */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2 min-w-0">
            {brandData.logoUrl && (
              <img
                src={brandData.logoUrl}
                alt={`${agent.agencyName || "Agency"} logo`}
                className="h-8 max-w-[120px] object-contain shrink-0"
              />
            )}
            {(!brandData.logoUrl || showAgencyNameWithLogo) && (
              <span className="font-display text-lg font-bold text-foreground truncate">
                {agent.agencyName || "Travel Co."}
              </span>
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
          {isGroupBooking && (
            <Button
              variant="travel"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (checkoutEnabled) goToCheckout();
                else if (bookingUrl) openModal(bookingUrl, "Book Now");
              }}
            >
              Book Now
            </Button>
          )}
        </div>
      </nav>

      {/* HERO */}
      {vis.hero &&
        (() => {
          // Collect all hero media assets — modes are mutually exclusive
          const isVideo = data.heroMediaType === "video" && !!data.heroVideoUrl;
          const mainImg = data.heroImageUrl;
          const sideImgs = (data.heroImageUrls || []).filter(Boolean);
          // In video mode, only show the video — no side images from photos mode
          const allReal = isVideo
            ? [data.heroVideoUrl!]
            : ([mainImg, ...sideImgs].filter(Boolean) as string[]);
          const allHeroImgs = allReal.map((u, i) => ({
            src: u,
            alt: `${data.destination || "Hero"} ${i + 1}`,
            isVideo: isVideo && i === 0,
          }));
          const count = allReal.length;

          if (count === 0 && !isVideo) return null;

          const heroMediaBadge =
            count > 1 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(allHeroImgs, 0);
                }}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 md:hidden"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  color: "white",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 13,
                }}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{count}</span>
              </button>
            ) : null;

          const renderFirstAsset = (className: string, onClick?: () => void) => {
            if (isVideo) {
              return (
                <div className={className} style={{ position: "relative" }}>
                  <VideoEmbed
                    url={data.heroVideoUrl!}
                    title={data.destination}
                    thumbnailUrl={data.heroVideoThumbnailUrl}
                    className="!rounded-none !aspect-auto h-full w-full"
                    autoplay={!!data.heroAutoplay}
                    muted={!!data.heroMuted}
                  />
                </div>
              );
            }
            return (
              <div className={`${className} cursor-pointer`} onClick={onClick}>
                <img
                  src={allReal[0]}
                  alt={data.destination}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            );
          };

          return (
            <section className="w-full overflow-hidden">
              {/* ——— Mobile: main image only ——— */}
              <div className={`md:hidden relative overflow-hidden ${isVideo ? "" : "cursor-pointer"}`} onClick={isVideo ? undefined : () => openLightbox(allHeroImgs, 0)}>
                {isVideo ? (
                  <VideoEmbed
                    url={data.heroVideoUrl!}
                    title={data.destination}
                    thumbnailUrl={data.heroVideoThumbnailUrl}
                    className="!rounded-none !aspect-auto w-full"
                    autoplay={!!data.heroAutoplay}
                    muted={!!data.heroMuted}
                  />
                ) : (
                  <img
                    src={allReal[0]}
                    alt={data.destination}
                    className="w-full object-cover object-center"
                    style={{ height: "45vh" }}
                    loading="eager"
                    decoding="async"
                  />
                )}
                {!isVideo && heroMediaBadge}
              </div>

              {/* ——— Desktop: 1 large left + 2 stacked right ——— */}
              <div
                className="hidden md:grid overflow-hidden"
                style={{
                  gridTemplateColumns: count >= 3 ? "2fr 1fr" : count === 2 ? "1fr 1fr" : "1fr",
                  gap: 6,
                  height: "55vh",
                }}
              >
                {/* Main / left */}
                <div
                  className={`overflow-hidden ${isVideo ? "" : "cursor-pointer"}`}
                  style={{ minHeight: 0 }}
                  onClick={isVideo ? undefined : () => openLightbox(allHeroImgs, 0)}
                >
                  {isVideo ? (
                    <VideoEmbed
                      url={data.heroVideoUrl!}
                      title={data.destination}
                      thumbnailUrl={data.heroVideoThumbnailUrl}
                      className="!rounded-none !aspect-auto h-full w-full"
                      autoplay={!!data.heroAutoplay}
                      muted={!!data.heroMuted}
                    />
                  ) : (
                    <img
                      src={allReal[0]}
                      alt={data.destination}
                      className="w-full h-full object-cover object-center"
                      loading="eager"
                      decoding="async"
                    />
                  )}
                </div>

                {/* Right column: 2 stacked images, 50/50 split */}
                {count >= 2 && (
                  <div
                    className="overflow-hidden"
                    style={{
                      display: "grid",
                      gridTemplateRows: count >= 3 ? "1fr 1fr" : "1fr",
                      gap: 6,
                      minHeight: 0,
                    }}
                  >
                    {allReal.slice(1, 3).map((url, i) => (
                      <div
                        key={i}
                        className="overflow-hidden cursor-pointer"
                        style={{ minHeight: 0 }}
                        onClick={() => openLightbox(allHeroImgs, i + 1)}
                      >
                        <img
                          src={url}
                          alt={`${data.destination} ${i + 2}`}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })()}

      {/* Title section below hero */}
      {vis.hero && (
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
          >
            {(data as any).tripName || data.destination || "Your Destination"}
          </motion.h1>
          {data.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-lg sm:text-xl text-muted-foreground mt-3 italic"
            >
              {data.subtitle}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center gap-4 mt-6 flex-wrap"
          >
            {((data as any).startDate || (data as any).endDate) && (
              <span className="flex items-center gap-1.5 bg-muted text-foreground px-4 py-2 rounded-full text-sm font-body">
                <Calendar className="h-4 w-4 text-primary" /> {formatDateRange((data as any).startDate, (data as any).endDate)}
              </span>
            )}
            {data.travelerCount && (
              <span className="flex items-center gap-1.5 bg-muted text-foreground px-4 py-2 rounded-full text-sm font-body">
                <Users className="h-4 w-4 text-primary" /> {parseInt(data.travelerCount) === 1 ? "1 Traveler" : `${parseInt(data.travelerCount)} Travelers`}
              </span>
            )}
            {data.destination && (
              <span className="flex items-center gap-1.5 bg-muted text-foreground px-4 py-2 rounded-full text-sm font-body">
                <MapPin className="h-4 w-4 text-primary" /> {data.destination}
              </span>
            )}
          </motion.div>
        </div>
      )}

      {/* DYNAMIC SECTIONS */}
      {sectionOrder.map((sectionKey) => {
        if (!vis[sectionKey]) return null;

        switch (sectionKey) {
          case "overview":
            return (
              <section key="overview" id="overview" className="py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                  <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3"
                  >
                    Prepared Exclusively For
                  </motion.p>
                  <motion.h2
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={1}
                    className="font-display text-4xl sm:text-5xl font-bold text-foreground"
                  >
                    {data.clientName || "Your Client"}
                  </motion.h2>
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={2}
                    className="w-16 h-0.5 bg-primary mx-auto mt-6 mb-8"
                  />
                  {data.introText && (
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      custom={3}
                      className="text-muted-foreground leading-relaxed text-lg font-body prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: data.introText }}
                    />
                  )}
                </div>
              </section>
            );

          case "flights":
            if (flightOptions.length === 0) return null;
            return (
              <section key="flights" id="flights" className="py-20 bg-card">
                <div className="max-w-4xl mx-auto px-6">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center mb-12"
                  >
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                      {ct.flights?.subtitle || "Your Flights"}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-foreground">{ct.flights?.title || "Air Travel"}</h2>
                    {!isGroupBooking && flightOptions.length > 1 && (
                      <p className="text-sm text-muted-foreground font-body mt-2">Select your preferred option</p>
                    )}
                  </motion.div>
                  <div className="space-y-8">
                    {flightOptions.map((opt, optIdx) => {
                      const isSelected = selectedFlight === opt.id;
                      return (
                        <motion.div
                          key={opt.id}
                          variants={fadeUp}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          custom={optIdx}
                          className={`bg-background rounded-2xl border-2 shadow-sm relative overflow-hidden transition-all ${
                            !isGroupBooking
                              ? isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border/50 hover:border-primary/40 cursor-pointer"
                              : "border-border/50"
                          }`}
                          onClick={() => !isGroupBooking && setSelectedFlight(isSelected ? "" : opt.id)}
                        >
                          {/* Option header bar */}
                          {flightOptions.length > 1 && (
                            <div className="bg-primary/5 border-b border-border/30 px-6 py-3 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-body">
                                Option {optIdx + 1} of {flightOptions.length}
                              </span>
                              {opt.price && (
                                <span className="font-display text-lg font-bold text-foreground">
                                  ${opt.price}
                                  <span className="text-xs text-muted-foreground font-body ml-1">/ person</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Flight legs */}
                          <div className="divide-y divide-border/30">
                            {opt.legs.map((leg) => (
                              <div key={leg.id} className="px-6 py-5">
                                {/* Leg label + date row */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      {leg.type === "departure" ? (
                                        <PlaneTakeoff className="h-4 w-4 text-primary" />
                                      ) : (
                                        <PlaneLanding className="h-4 w-4 text-primary" />
                                      )}
                                    </div>
                                    <span className="font-body font-semibold text-foreground text-sm">
                                      {leg.type === "departure" ? "Departure" : "Return"}
                                    </span>
                                  </div>
                                  {leg.date && (
                                    <span className="text-xs text-muted-foreground font-body bg-muted/50 px-2.5 py-1 rounded-full">
                                      {leg.date}
                                    </span>
                                  )}
                                </div>

                                {/* Airport codes + flight path */}
                                <div className="flex items-center gap-4">
                                  {/* Origin */}
                                  <div className="flex-1">
                                    {(() => {
                                      const ap = parseAirportValue(leg.departureAirport);
                                      return (
                                        <>
                                          <p className="font-display text-3xl font-bold text-foreground leading-none">
                                            {ap.code || leg.departureAirport.slice(0, 3).toUpperCase() || "—"}
                                          </p>
                                          <p className="text-xs text-muted-foreground font-body mt-1 truncate">
                                            {ap.city || leg.departureAirport}
                                          </p>
                                        </>
                                      );
                                    })()}
                                    {leg.departureTime && (
                                      <p className="text-sm font-semibold text-foreground font-body mt-1">
                                        {leg.departureTime}
                                      </p>
                                    )}
                                  </div>

                                  {/* Flight path visual */}
                                  <div className="flex-1 flex flex-col items-center gap-1 min-w-[120px]">
                                    <div className="flex items-center w-full">
                                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                      <div className="flex-1 border-t-2 border-dashed border-primary/30 mx-1" />
                                      <Plane className="h-4 w-4 text-primary shrink-0 -rotate-0" />
                                      <div className="flex-1 border-t-2 border-dashed border-primary/30 mx-1" />
                                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                    </div>
                                    {(leg.airline || leg.flightNumber) && (
                                      <p className="text-[10px] text-muted-foreground font-body whitespace-nowrap">
                                        {leg.airline}
                                        {leg.flightNumber ? ` · ${leg.flightNumber}` : ""}
                                      </p>
                                    )}
                                  </div>

                                  {/* Destination */}
                                  <div className="flex-1 text-right">
                                    {(() => {
                                      const ap = parseAirportValue(leg.arrivalAirport);
                                      return (
                                        <>
                                          <p className="font-display text-3xl font-bold text-foreground leading-none">
                                            {ap.code || leg.arrivalAirport.slice(0, 3).toUpperCase() || "—"}
                                          </p>
                                          <p className="text-xs text-muted-foreground font-body mt-1 truncate">
                                            {ap.city || leg.arrivalAirport}
                                          </p>
                                        </>
                                      );
                                    })()}
                                    {leg.arrivalTime && (
                                      <p className="text-sm font-semibold text-foreground font-body mt-1">
                                        {leg.arrivalTime}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Footer: price (if single option) + selection */}
                          {(opt.price || !isGroupBooking) && (
                            <div className="bg-muted/30 border-t border-border/30 px-6 py-4 flex items-center justify-between">
                              {opt.price && flightOptions.length <= 1 && (
                                <span className="font-display text-xl font-bold text-foreground">
                                  ${opt.price}
                                  <span className="text-xs text-muted-foreground font-body ml-1">/ person</span>
                                </span>
                              )}
                              {(!opt.price || flightOptions.length > 1) && <span />}
                              {!isGroupBooking && (
                                <div className="flex items-center gap-2">
                                  {isSelected ? (
                                    <div className="flex items-center gap-1.5">
                                      <Button
                                        variant="travel"
                                        size="sm"
                                        className="text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Check className="h-3 w-3 mr-1" /> Option selected
                                      </Button>
                                      <Button
                                        variant="travel-ghost"
                                        size="sm"
                                        className="text-xs text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedFlight("");
                                        }}
                                      >
                                        Cancel ✕
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="travel-outline"
                                      size="sm"
                                      className="text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFlight(opt.id);
                                      }}
                                    >
                                      Select option
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          case "accommodations":
            if (accommodations.length === 0) return null;
            return (
              <section key="accommodations" id="accommodations" className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center mb-12"
                  >
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                      {ct.accommodations?.subtitle || "Where You'll Stay"}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-foreground">{ct.accommodations?.title || "Accommodations"}</h2>
                    {accommodationSelectionEnabled && accommodations.length > 1 && (
                      <p className="text-sm text-muted-foreground font-body mt-2">Select your preferred option</p>
                    )}
                  </motion.div>
                  <div className="space-y-10">
                    {accommodations.map((acc) => {
                      const isSelected = effectiveSelectedAccommodation === acc.id;
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
                            accommodationSelectionEnabled
                              ? isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border/50 hover:border-primary/40 cursor-pointer"
                              : "border-border/50"
                          }`}
                          onClick={() => {
                            if (accommodationSelectionEnabled) {
                              setSelectedAccommodation(isSelected ? "" : acc.id);
                            }
                          }}
                        >
                          {accommodationSelectionEnabled && accommodations.length > 1 && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="inline-block bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-[0.15em] font-body px-2.5 py-1 rounded-full">
                                Option {accommodations.indexOf(acc) + 1}
                              </span>
                            </div>
                          )}
                          {showAccPhotos && allAccImages.length > 0 ? (
                            <div className={allAccImages.length === 1 ? "" : "grid grid-cols-3 md:grid-cols-4 gap-1"}>
                              {allAccImages.length === 1 ? (
                                <div
                                  className="aspect-[21/9] overflow-hidden cursor-pointer"
                                  onClick={() => openLightbox(allAccImages, 0)}
                                >
                                  <img
                                    src={allAccImages[0].src}
                                    alt={acc.hotelName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div
                                    className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden cursor-pointer"
                                    onClick={() => openLightbox(allAccImages, 0)}
                                  >
                                    <img
                                      src={allAccImages[0].src}
                                      alt={acc.hotelName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {galleryUrls.slice(0, 6).map((url, gi) => (
                                    <div
                                      key={gi}
                                      className="aspect-[4/3] overflow-hidden cursor-pointer"
                                      onClick={() => openLightbox(allAccImages, gi + 1)}
                                    >
                                      <img
                                        src={url}
                                        alt={`${acc.hotelName} ${gi + 2}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                  {galleryUrls.length > 6 && (
                                    <div
                                      className="aspect-[4/3] bg-muted/60 flex items-center justify-center cursor-pointer rounded-sm"
                                      onClick={() => openLightbox(allAccImages, 7)}
                                    >
                                      <span className="text-sm font-body font-semibold text-muted-foreground">
                                        +{galleryUrls.length - 6} more
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 sm:p-6 border-b border-border/30">
                              <VideoEmbed
                                url={acc.videoUrl!}
                                title={acc.hotelName}
                                thumbnailUrl={acc.videoThumbnailUrl}
                                className="w-full"
                              />
                            </div>
                          )}
                          <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-display text-2xl font-bold text-foreground mb-1">
                                  {acc.hotelName || "Hotel"}
                                </h3>
                                <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" /> {acc.location}
                                </p>
                              </div>
                              <BedDouble className="h-6 w-6 text-primary mt-1 shrink-0" />
                            </div>
                            {acc.roomType && (
                              <p className="font-body text-foreground font-semibold mt-3">{acc.roomType}</p>
                            )}
                            {acc.description && (
                              <div
                                className="text-sm text-muted-foreground font-body mt-2 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: acc.description }}
                              />
                            )}
                            {highlights.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-2">
                                  Highlights
                                </p>
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
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                                  Amenities
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {amenities.map((a, ai) => (
                                    <span
                                      key={ai}
                                      className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full border border-border/30"
                                    >
                                      <Check className="h-3 w-3 text-primary" /> {a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/30 text-sm text-muted-foreground font-body">
                              {acc.checkIn && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" /> Check-in: {acc.checkIn}
                                </span>
                              )}
                              {acc.checkOut && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" /> Check-out: {acc.checkOut}
                                </span>
                              )}
                              {acc.nights && <span className="text-primary font-semibold">{acc.nights}</span>}
                            </div>
                            {(acc.price || !isGroupBooking) && (
                              <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                                {acc.price && (
                                  <span className="font-display text-xl font-bold text-foreground">${acc.price}</span>
                                )}
                                {!acc.price && <span />}
                                {accommodationSelectionEnabled && (
                                  <div className="flex items-center gap-2">
                                    {accommodations.length > 1 && (
                                      <span className="text-[10px] text-muted-foreground font-body">
                                        Option {accommodations.indexOf(acc) + 1} of {accommodations.length}
                                      </span>
                                    )}
                                    {isSelected ? (
                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          variant="travel"
                                          size="sm"
                                          className="text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Check className="h-3 w-3 mr-1" /> Option selected
                                        </Button>
                                        <Button
                                          variant="travel-ghost"
                                          size="sm"
                                          className="text-xs text-destructive hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAccommodation("");
                                          }}
                                        >
                                          Cancel ✕
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="travel-outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedAccommodation(acc.id);
                                        }}
                                      >
                                        Select option
                                      </Button>
                                    )}
                                  </div>
                                )}
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

          case "cruiseShips":
            if (cruiseShips.length === 0) return null;
            return (
              <section key="cruiseShips" id="cruiseShips" className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center mb-12"
                  >
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                      {ct.cruiseShips?.subtitle || "Your Vessel"}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-foreground">{ct.cruiseShips?.title || "Cruise Ship & Cabin"}</h2>
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
                              ? isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border/50 hover:border-primary/40 cursor-pointer"
                              : "border-border/50"
                          }`}
                          onClick={() => !isGroupBooking && setSelectedCruise(isSelected ? "" : ship.id)}
                        >
                          {!isGroupBooking && cruiseShips.length > 1 && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="inline-block bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-[0.15em] font-body px-2.5 py-1 rounded-full">
                                Option {cruiseShips.indexOf(ship) + 1}
                              </span>
                            </div>
                          )}
                          {showShipPhotos && allShipImages.length > 0 ? (
                            <div className={allShipImages.length === 1 ? "" : "grid grid-cols-3 md:grid-cols-4 gap-1"}>
                              {allShipImages.length === 1 ? (
                                <div
                                  className="aspect-[21/9] overflow-hidden cursor-pointer"
                                  onClick={() => openLightbox(allShipImages, 0)}
                                >
                                  <img
                                    src={allShipImages[0].src}
                                    alt={ship.shipName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div
                                    className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden cursor-pointer"
                                    onClick={() => openLightbox(allShipImages, 0)}
                                  >
                                    <img
                                      src={ship.imageUrl}
                                      alt={ship.shipName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {galleryUrls.slice(0, 6).map((url, gi) => (
                                    <div
                                      key={gi}
                                      className="aspect-[4/3] overflow-hidden cursor-pointer"
                                      onClick={() => openLightbox(allShipImages, gi + 1)}
                                    >
                                      <img
                                        src={url}
                                        alt={`${ship.shipName} ${gi + 2}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          ) : showShipPhotos ? null : (
                            <div className="p-4 sm:p-6 border-b border-border/30">
                              <VideoEmbed
                                url={ship.videoUrl!}
                                title={ship.shipName}
                                thumbnailUrl={ship.videoThumbnailUrl}
                                className="w-full"
                              />
                            </div>
                          )}
                          <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-display text-2xl font-bold text-foreground mb-1">
                                  {ship.shipName || "Cruise Ship"}
                                </h3>
                                <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                                  <Ship className="h-3.5 w-3.5" /> {ship.cruiseLine}
                                </p>
                              </div>
                              <Anchor className="h-6 w-6 text-primary mt-1 shrink-0" />
                            </div>
                            {/* Cabin details */}
                            <div className="flex flex-wrap gap-3 mt-4">
                              {ship.cabinType && (
                                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-body font-semibold px-3 py-1.5 rounded-full">
                                  {ship.cabinType}
                                </span>
                              )}
                              {ship.cabinNumber && (
                                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full">
                                  Cabin {ship.cabinNumber}
                                </span>
                              )}
                              {ship.deck && (
                                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full">
                                  {ship.deck}
                                </span>
                              )}
                            </div>
                            {ship.description && (
                              <div
                                className="text-sm text-muted-foreground font-body mt-4 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: ship.description }}
                              />
                            )}
                            {highlights.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-2">
                                  Highlights
                                </p>
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
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                                  Ship Amenities
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {amenities.map((a, ai) => (
                                    <span
                                      key={ai}
                                      className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full border border-border/30"
                                    >
                                      <Check className="h-3 w-3 text-primary" /> {a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mt-5 pt-4 border-t border-border/30 text-sm text-muted-foreground font-body">
                              {(ship.embarkationPort || ship.embarkationDate) && (
                                <div className="space-y-0.5">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">Embarkation</p>
                                  {ship.embarkationPort && (
                                    <span className="flex items-center gap-1.5">
                                      <Anchor className="h-3.5 w-3.5 text-primary/70" /> {ship.embarkationPort}
                                    </span>
                                  )}
                                  {ship.embarkationDate && (
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 text-primary/70" /> {ship.embarkationDate}
                                    </span>
                                  )}
                                </div>
                              )}
                              {(ship.disembarkationPort || ship.disembarkationDate) && (
                                <div className="space-y-0.5">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">Disembarkation</p>
                                  {ship.disembarkationPort && (
                                    <span className="flex items-center gap-1.5">
                                      <Anchor className="h-3.5 w-3.5 text-primary/70" /> {ship.disembarkationPort}
                                    </span>
                                  )}
                                  {ship.disembarkationDate && (
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 text-primary/70" /> {ship.disembarkationDate}
                                    </span>
                                  )}
                                </div>
                              )}
                              {ship.nights && (
                                <div className="space-y-0.5">
                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">Duration</p>
                                  <span className="text-primary font-semibold">{ship.nights} Nights</span>
                                </div>
                              )}
                            </div>
                            {(ship.price || !isGroupBooking) && (
                              <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                                {ship.price && (
                                  <span className="font-display text-xl font-bold text-foreground">${ship.price}</span>
                                )}
                                {!ship.price && <span />}
                                {!isGroupBooking && (
                                  <div className="flex items-center gap-2">
                                    {cruiseShips.length > 1 && (
                                      <span className="text-[10px] text-muted-foreground font-body">
                                        Option {cruiseShips.indexOf(ship) + 1} of {cruiseShips.length}
                                      </span>
                                    )}
                                    {isSelected ? (
                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          variant="travel"
                                          size="sm"
                                          className="text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Check className="h-3 w-3 mr-1" /> Option selected
                                        </Button>
                                        <Button
                                          variant="travel-ghost"
                                          size="sm"
                                          className="text-xs text-destructive hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCruise("");
                                          }}
                                        >
                                          Cancel ✕
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="travel-outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCruise(ship.id);
                                        }}
                                      >
                                        Select option
                                      </Button>
                                    )}
                                  </div>
                                )}
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

          case "busTrips":
            if (busTrips.length === 0) return null;
            return (
              <section key="busTrips" id="busTrips" className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center mb-12"
                  >
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                      {ct.busTrips?.subtitle || "Ground Transport"}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-foreground">{ct.busTrips?.title || "Bus Trips"}</h2>
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
                              ? isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border/50 hover:border-primary/40 cursor-pointer"
                              : "border-border/50"
                          }`}
                          onClick={() => !isGroupBooking && setSelectedBusTrip(isSelected ? "" : trip.id)}
                        >
                          {!isGroupBooking && busTrips.length > 1 && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="inline-block bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-[0.15em] font-body px-2.5 py-1 rounded-full">
                                Option {busTrips.indexOf(trip) + 1}
                              </span>
                            </div>
                          )}
                          {showVideo ? (
                            <div className="p-4 sm:p-6 border-b border-border/30">
                              <VideoEmbed
                                url={trip.videoUrl!}
                                title={trip.routeName}
                                thumbnailUrl={trip.videoThumbnailUrl}
                                className="w-full"
                              />
                            </div>
                          ) : allTripImages.length > 0 ? (
                            <div className={allTripImages.length === 1 ? "" : "grid grid-cols-3 md:grid-cols-4 gap-1"}>
                              {allTripImages.length === 1 ? (
                                <div
                                  className="aspect-[21/9] overflow-hidden cursor-pointer"
                                  onClick={() => openLightbox(allTripImages, 0)}
                                >
                                  <img
                                    src={allTripImages[0].src}
                                    alt={trip.routeName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div
                                    className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden cursor-pointer"
                                    onClick={() => openLightbox(allTripImages, 0)}
                                  >
                                    <img
                                      src={allTripImages[0].src}
                                      alt={trip.routeName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {galleryUrls.slice(0, 6).map((url, gi) => (
                                    <div
                                      key={gi}
                                      className="aspect-[4/3] overflow-hidden cursor-pointer"
                                      onClick={() => openLightbox(allTripImages, gi + 1)}
                                    >
                                      <img
                                        src={url}
                                        alt={`${trip.routeName} ${gi + 2}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          ) : null}
                          <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-display text-2xl font-bold text-foreground mb-1">
                                  {trip.routeName || "Bus Trip"}
                                </h3>
                                {trip.busCompany && (
                                  <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                                    <Bus className="h-3.5 w-3.5" /> {trip.busCompany}
                                  </p>
                                )}
                              </div>
                              <Bus className="h-6 w-6 text-primary mt-1 shrink-0" />
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                              {trip.busType && (
                                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-body font-semibold px-3 py-1.5 rounded-full">
                                  {trip.busType}
                                </span>
                              )}
                              {trip.seatType && (
                                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full">
                                  {trip.seatType}
                                </span>
                              )}
                              {trip.duration && (
                                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full">
                                  <Clock className="h-3 w-3" /> {trip.duration}
                                </span>
                              )}
                            </div>
                            {trip.description && (
                              <div
                                className="text-sm text-muted-foreground font-body mt-4 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: trip.description }}
                              />
                            )}
                            {/* Stops timeline */}
                            {stops.length > 0 && (
                              <div className="mt-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                                  Route Stops
                                </p>
                                <div className="space-y-0 relative ml-3">
                                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-border" />
                                  {stops.map((stop, si) => (
                                    <div key={stop.id || si} className="relative pl-6 py-2">
                                      <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                                      <p className="text-sm font-body font-semibold text-foreground">
                                        {stop.locationAddress
                                          ? [
                                              stop.locationAddress.name,
                                              stop.locationAddress.address,
                                              stop.locationAddress.city,
                                              [stop.locationAddress.state, stop.locationAddress.zip]
                                                .filter(Boolean)
                                                .join(" "),
                                            ]
                                              .filter(Boolean)
                                              .join(", ")
                                          : stop.location}
                                      </p>
                                      <div className="flex gap-3 text-xs text-muted-foreground font-body mt-0.5">
                                        {stop.arrivalTime && <span>Arrive: {stop.arrivalTime}</span>}
                                        {stop.departureTime && <span>Depart: {stop.departureTime}</span>}
                                      </div>
                                      {stop.notes && (
                                        <p className="text-xs text-muted-foreground/80 font-body mt-0.5 italic">
                                          {stop.notes}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {highlights.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-2">
                                  Highlights
                                </p>
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
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                                  Bus Amenities
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {amenities.map((a, ai) => (
                                    <span
                                      key={ai}
                                      className="inline-flex items-center gap-1.5 bg-muted/50 text-muted-foreground text-xs font-body px-3 py-1.5 rounded-full border border-border/30"
                                    >
                                      <Check className="h-3 w-3 text-primary" /> {a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/30 text-sm text-muted-foreground font-body flex-wrap">
                              {(trip.pickupAddress || trip.pickupLocation) && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" /> Pickup:{" "}
                                  {trip.pickupAddress
                                    ? [
                                        trip.pickupAddress.name,
                                        trip.pickupAddress.address,
                                        trip.pickupAddress.city,
                                        [trip.pickupAddress.state, trip.pickupAddress.zip].filter(Boolean).join(" "),
                                      ]
                                        .filter(Boolean)
                                        .join(", ")
                                    : trip.pickupLocation}
                                </span>
                              )}
                              {trip.pickupDate && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" /> {trip.pickupDate}
                                </span>
                              )}
                              {trip.pickupTime && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" /> {trip.pickupTime}
                                </span>
                              )}
                            </div>
                            {(trip.dropoffLocation || trip.dropoffAddress || trip.dropoffDate || trip.dropoffTime) && (
                              <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground font-body flex-wrap">
                                {(trip.dropoffAddress || trip.dropoffLocation) && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" /> Dropoff:{" "}
                                    {trip.dropoffAddress
                                      ? [
                                          trip.dropoffAddress.name,
                                          trip.dropoffAddress.address,
                                          trip.dropoffAddress.city,
                                          [trip.dropoffAddress.state, trip.dropoffAddress.zip]
                                            .filter(Boolean)
                                            .join(" "),
                                        ]
                                          .filter(Boolean)
                                          .join(", ")
                                      : trip.dropoffLocation}
                                  </span>
                                )}
                                {trip.dropoffDate && (
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" /> {trip.dropoffDate}
                                  </span>
                                )}
                                {trip.dropoffTime && (
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" /> {trip.dropoffTime}
                                  </span>
                                )}
                              </div>
                            )}
                            {(trip.price || !isGroupBooking) && (
                              <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                                {trip.price && (
                                  <span className="font-display text-xl font-bold text-foreground">${trip.price}</span>
                                )}
                                {!trip.price && <span />}
                                {!isGroupBooking && (
                                  <div className="flex items-center gap-2">
                                    {busTrips.length > 1 && (
                                      <span className="text-[10px] text-muted-foreground font-body">
                                        Option {busTrips.indexOf(trip) + 1} of {busTrips.length}
                                      </span>
                                    )}
                                    {isSelected ? (
                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          variant="travel"
                                          size="sm"
                                          className="text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Check className="h-3 w-3 mr-1" /> Option selected
                                        </Button>
                                        <Button
                                          variant="travel-ghost"
                                          size="sm"
                                          className="text-xs text-destructive hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBusTrip("");
                                          }}
                                        >
                                          Cancel ✕
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="travel-outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBusTrip(trip.id);
                                        }}
                                      >
                                        Select option
                                      </Button>
                                    )}
                                  </div>
                                )}
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
            if (data.days.filter(d => !d.hidden).length === 0) return null;
            return <ItinerarySection key="itinerary" data={data} fadeUp={fadeUp} openLightbox={openLightbox} />;

          case "inclusions":
            if (data.inclusions.filter(Boolean).length === 0) return null;
            return (
              <section key="inclusions" id="inclusions" className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center mb-12"
                  >
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                      {ct.inclusions?.subtitle || "Everything Taken Care Of"}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-foreground">{ct.inclusions?.title || "What's Included"}</h2>
                  </motion.div>
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={1}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4"
                  >
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
            // In proposal mode, pricing is merged into the selection summary below
            if (!isGroupBooking) return null;
            if (data.pricing.length === 0 && pricingOptions.length === 0) return null;
            return (
              <section key="pricing" id="pricing" className="py-20 bg-card">
                <div className="max-w-4xl mx-auto px-6">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center mb-12"
                  >
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                      {ct.pricing?.subtitle || "Investment"}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-foreground">{ct.pricing?.title || "Choose Your Package"}</h2>
                    {pricingOptions.length > 1 && (
                      <p className="text-muted-foreground font-body mt-2">Select the option that works best for you</p>
                    )}
                  </motion.div>

                  {/* Pricing Options Cards — large & prominent */}
                  {pricingOptions.length > 0 && (
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      custom={1}
                      className={`grid gap-6 mb-10 ${pricingOptions.length === 1 ? "max-w-lg mx-auto" : pricingOptions.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
                    >
                      {pricingOptions.map((opt) => {
                        const isSelected = selectedPricingOption === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedPricingOption(isSelected ? "" : opt.id)}
                            className={`relative bg-background rounded-2xl border-2 p-8 cursor-pointer transition-all text-left ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 shadow-xl scale-[1.02]"
                                : "border-border/50 hover:border-primary/40 hover:shadow-md"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-4 right-4 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                            <h3 className="font-display text-xl font-bold text-foreground mb-3">
                              {opt.name || "Untitled Option"}
                            </h3>
                            {opt.totalPrice && (
                              <p className="font-display text-3xl font-bold text-primary mb-4">
                                {fmtCurrency(opt.totalPrice)}
                              </p>
                            )}
                            <div className="space-y-2">
                              {opt.deposit && (
                                <p className="text-sm text-muted-foreground font-body">
                                  Deposit due today:{" "}
                                  <span className="font-semibold text-foreground">{fmtCurrency(opt.deposit)}</span>
                                </p>
                              )}
                              {opt.finalPaymentDate && (
                                <p className="text-sm text-muted-foreground font-body">
                                  Final payment due by {opt.finalPaymentDate}
                                </p>
                              )}
                              {opt.paymentNote && (
                                <p className="text-sm text-muted-foreground font-body italic mt-1">{opt.paymentNote}</p>
                              )}
                              {opt.availabilityNote && (
                                <p className="text-xs font-semibold text-accent font-body mt-3">
                                  {opt.availabilityNote}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Legacy pricing lines */}
                  {data.pricing.length > 0 && (
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      custom={2}
                      className="bg-background rounded-2xl border border-border/50 shadow-lg p-10 max-w-2xl mx-auto mb-10"
                    >
                      <div className="space-y-4">
                        {data.pricing.map((line) => (
                          <div
                            key={line.id}
                            className="flex justify-between items-center py-2 border-b border-border/30 font-body"
                          >
                            <span className="text-muted-foreground">{line.label}</span>
                            <span className="font-semibold text-foreground">{line.amount}</span>
                          </div>
                        ))}
                      </div>
                      {data.paymentTerms && (
                        <p className="text-xs text-muted-foreground mt-4 font-body">{data.paymentTerms}</p>
                      )}
                    </motion.div>
                  )}

                  {/* Book Now CTA for group trips — always visible */}
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={3}
                    className="text-center"
                  >
                    <Button
                      variant="travel"
                      size="lg"
                      className="text-lg px-12 py-6 h-auto"
                      onClick={() => {
                        if (checkoutEnabled) {
                          goToCheckout();
                        } else if (bookingUrl) {
                          openModal(bookingUrl, "Book Now");
                        }
                      }}
                    >
                      Book Now
                    </Button>
                    {data.validUntil && (
                      <p className="text-sm text-muted-foreground mt-4 font-body">
                        This proposal is valid until {data.validUntil}
                      </p>
                    )}
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
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center mb-12"
                  >
                    <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                      {ct.terms?.subtitle || "Important Information"}
                    </p>
                    <h2 className="font-display text-4xl font-bold text-foreground">{ct.terms?.title || "Terms & Conditions"}</h2>
                  </motion.div>
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={1}
                    className="space-y-6"
                  >
                    {terms.showCancellation !== false && terms.cancellationPolicy && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                          Cancellation Policy
                        </p>
                        <div
                          className="prose prose-sm max-w-none text-foreground font-body"
                          dangerouslySetInnerHTML={{ __html: terms.cancellationPolicy }}
                        />
                      </div>
                    )}
                    {terms.showInsurance !== false && terms.travelInsurance && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                          Travel Insurance
                        </p>
                        <div
                          className="prose prose-sm max-w-none text-foreground font-body"
                          dangerouslySetInnerHTML={{ __html: terms.travelInsurance }}
                        />
                      </div>
                    )}
                    {terms.showBookingTerms !== false && terms.bookingTerms && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                          Booking Terms
                        </p>
                        <div
                          className="prose prose-sm max-w-none text-foreground font-body"
                          dangerouslySetInnerHTML={{ __html: terms.bookingTerms }}
                        />
                      </div>
                    )}
                    {terms.showLiability !== false && terms.liability && (
                      <div className="bg-background rounded-xl border border-border/50 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body mb-3">
                          Liability
                        </p>
                        <div
                          className="prose prose-sm max-w-none text-foreground font-body"
                          dangerouslySetInnerHTML={{ __html: terms.liability }}
                        />
                      </div>
                    )}
                  </motion.div>
                </div>
              </section>
            );
          }

          case "agent":
            // For proposal mode, render footer after pricing summary below
            if (!isGroupBooking) return null;
            return (
              <footer key="agent" className="py-16 px-6 border-t border-border/50 bg-card">
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
                    {ct.agent?.subtitle || "Your Travel Advisor"}
                  </p>
                  <div className="flex flex-col items-center gap-4 mb-6">
                    {agent.photoUrl && (
                      <img
                        src={agent.photoUrl}
                        alt={agent.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                    )}
                    <div>
                      <h3 className="font-display text-2xl font-bold text-foreground">{agent.name}</h3>
                      <p className="text-muted-foreground font-body mt-0.5">{agent.title}</p>
                      <p className="text-sm text-muted-foreground font-body">{agent.agencyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm font-body text-muted-foreground flex-wrap">
                    {agent.phone && (
                      <a
                        href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4" /> {agent.phone}
                      </a>
                    )}
                    {agent.email && (
                      <a
                        href={`mailto:${agent.email}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4" /> {agent.email}
                      </a>
                    )}
                    {agent.website && (
                      <a
                        href={agent.website.startsWith("http") ? agent.website : `https://${agent.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4" /> {agent.website}
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-10 font-body">
                    © 2026 {agent.agencyName} · All prices in USD · Subject to availability
                  </p>
                </div>
              </footer>
            );

          default:
            return null;
        }
      })}

      {/* PROPOSAL SELECTION SUMMARY — only for Proposal type */}
      {!isGroupBooking && (
        <section id="pricing" className="py-20 bg-card border-t border-border/50">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="text-center mb-10"
            >
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Investment</p>
              <h2 className="font-display text-4xl font-bold text-foreground">Trip Pricing</h2>
            </motion.div>

            {/* Pricing Options Cards — large & prominent */}
            {pricingOptions.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={1}
                className={`grid gap-6 mb-10 ${pricingOptions.length === 1 ? "max-w-lg mx-auto" : pricingOptions.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
              >
                {pricingOptions.map((opt) => {
                  const isSelected = selectedPricingOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedPricingOption(isSelected ? "" : opt.id)}
                      className={`relative bg-background rounded-2xl border-2 p-8 cursor-pointer transition-all text-left ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 shadow-xl scale-[1.02]"
                          : "border-border/50 hover:border-primary/40 hover:shadow-md"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <h3 className="font-display text-xl font-bold text-foreground mb-3">
                        {opt.name || "Untitled Option"}
                      </h3>
                      {opt.totalPrice && (
                        <p className="font-display text-3xl font-bold text-primary mb-4">
                          {fmtCurrency(opt.totalPrice)}
                        </p>
                      )}
                      <div className="space-y-2">
                        {opt.deposit && (
                          <p className="text-sm text-muted-foreground font-body">
                            Deposit due today:{" "}
                            <span className="font-semibold text-foreground">{fmtCurrency(opt.deposit)}</span>
                          </p>
                        )}
                        {opt.finalPaymentDate && (
                          <p className="text-sm text-muted-foreground font-body">
                            Final payment due by {opt.finalPaymentDate}
                          </p>
                        )}
                        {opt.paymentNote && (
                          <p className="text-sm text-muted-foreground font-body italic mt-1">{opt.paymentNote}</p>
                        )}
                        {opt.availabilityNote && (
                          <p className="text-xs font-semibold text-accent font-body mt-3">{opt.availabilityNote}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="bg-background rounded-2xl border border-border/50 shadow-lg p-8"
            >
              {/* Selected items summary */}
              <div className="space-y-4 mb-6">
                {flightOptions.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Flight</span>
                    </div>
                    <span className="font-body text-sm">
                      {selectedFlight ? (
                        (() => {
                          const opt = flightOptions.find((o) => o.id === selectedFlight);
                          const dep = opt?.legs.find((l) => l.type === "departure");
                          return (
                            <span className="text-foreground">
                              {dep?.airline || "Selected"} — {dep?.departureAirport?.split("–")[0]?.trim()} →{" "}
                              {dep?.arrivalAirport?.split("–")[0]?.trim()}
                              {opt?.price ? (
                                <span className="ml-2 text-primary font-semibold">${opt.price}</span>
                              ) : null}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Not selected</span>
                      )}
                    </span>
                  </div>
                )}
                {accommodations.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Accommodation</span>
                    </div>
                    <span className="font-body text-sm">
                      {!accommodationSelectionEnabled ? (
                        <span className="text-muted-foreground italic text-xs">Informational only</span>
                      ) : effectiveSelectedAccommodation ? (
                        (() => {
                          const a = accommodations.find((a) => a.id === effectiveSelectedAccommodation);
                          return (
                            <span className="text-foreground">
                              {a?.hotelName || "Selected"}
                              {a?.price ? <span className="ml-2 text-primary font-semibold">${a.price}</span> : null}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Not selected</span>
                      )}
                    </span>
                  </div>
                )}
                {cruiseShips.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Cruise</span>
                    </div>
                    <span className="font-body text-sm">
                      {selectedCruise ? (
                        (() => {
                          const s = cruiseShips.find((s) => s.id === selectedCruise);
                          return (
                            <span className="text-foreground">
                              {s?.shipName || "Selected"}
                              {s?.price ? <span className="ml-2 text-primary font-semibold">${s.price}</span> : null}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Not selected</span>
                      )}
                    </span>
                  </div>
                )}
                {busTrips.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-primary" />
                      <span className="font-body text-foreground font-medium">Bus Trip</span>
                    </div>
                    <span className="font-body text-sm">
                      {selectedBusTrip ? (
                        (() => {
                          const b = busTrips.find((b) => b.id === selectedBusTrip);
                          return (
                            <span className="text-foreground">
                              {b?.routeName || "Selected"}
                              {b?.price ? <span className="ml-2 text-primary font-semibold">${b.price}</span> : null}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Not selected</span>
                      )}
                    </span>
                  </div>
                )}
                {/* Selected pricing option */}
                {selectedPricingOption &&
                  (() => {
                    const opt = pricingOptions.find((o) => o.id === selectedPricingOption);
                    if (!opt) return null;
                    return (
                      <div className="flex justify-between items-center py-3 border-b border-border/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="font-body text-foreground font-medium">{opt.name}</span>
                        </div>
                        <span className="font-body text-sm text-primary font-semibold">
                          {opt.totalPrice ? fmtCurrency(opt.totalPrice) : ""}
                        </span>
                      </div>
                    );
                  })()}
              </div>

              {/* Additional pricing lines */}
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

              {/* Dynamic Total */}
              {(() => {
                const selectedFlightPrice = selectedFlight
                  ? parseFloat(flightOptions.find((o) => o.id === selectedFlight)?.price || "0")
                  : 0;
                const selectedAccPrice = selectedAccommodation
                  ? parseFloat(accommodations.find((a) => a.id === selectedAccommodation)?.price || "0")
                  : 0;
                const selectedCruisePrice = selectedCruise
                  ? parseFloat(cruiseShips.find((s) => s.id === selectedCruise)?.price || "0")
                  : 0;
                const selectedBusPrice = selectedBusTrip
                  ? parseFloat(busTrips.find((b) => b.id === selectedBusTrip)?.price || "0")
                  : 0;
                const pricingLinesTotal = data.pricing.reduce(
                  (sum, line) => sum + (parseFloat(line.amount.replace(/[^0-9.-]/g, "")) || 0),
                  0,
                );
                const selectedOptionPrice = selectedPricingOption
                  ? parseFloat(
                      pricingOptions
                        .find((o) => o.id === selectedPricingOption)
                        ?.totalPrice?.replace(/[^0-9.-]/g, "") || "0",
                    )
                  : 0;
                const total =
                  selectedFlightPrice +
                  selectedAccPrice +
                  selectedCruisePrice +
                  selectedBusPrice +
                  pricingLinesTotal +
                  selectedOptionPrice;
                if (total > 0) {
                  return (
                    <div className="pt-4 border-t-2 border-primary/30 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="font-display text-xl font-bold text-foreground">Estimated Total</span>
                        <span className="font-display text-2xl font-bold text-primary">
                          ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {/* Show deposit from selected pricing option */}
                      {selectedPricingOption &&
                        (() => {
                          const opt = pricingOptions.find((o) => o.id === selectedPricingOption);
                          if (!opt?.deposit) return null;
                          return (
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-body text-sm text-muted-foreground">Deposit Due</span>
                              <span className="font-display text-lg font-bold text-accent">
                                {fmtCurrency(opt.deposit)}
                              </span>
                            </div>
                          );
                        })()}
                    </div>
                  );
                }
                return null;
              })()}

              {data.paymentTerms && <p className="text-xs text-muted-foreground mb-6 font-body">{data.paymentTerms}</p>}

              {/* Deposit info from checkout settings (legacy) */}
              {(() => {
                const checkout = data.checkout;
                if (!checkout?.enabled) return null;
                if (selectedPricingOption) return null; // pricing option deposit takes precedence
                const depositOpt = checkout.paymentOptions.find((o) => o.enabled && o.type === "deposit");
                if (!depositOpt || !depositOpt.depositPercent) return null;
                // depositPercent now stores dollar amount directly
                const depositAmount = depositOpt.depositPercent;
                return (
                  <div className="flex justify-between items-center pt-2 mb-4">
                    <span className="font-body text-sm text-muted-foreground">Deposit Due</span>
                    <span className="font-display text-lg font-bold text-accent">
                      ${depositAmount.toLocaleString()}
                    </span>
                  </div>
                );
              })()}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button variant="travel" size="lg" className="text-lg px-10 py-6 h-auto" onClick={goToApprove}>
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Approve Itinerary
                </Button>
                <Button
                  variant="travel-outline"
                  size="lg"
                  className="text-lg px-10 py-6 h-auto"
                  onClick={goToRevisions}
                >
                  <MessageSquare className="h-5 w-5 mr-2" /> Request Revisions
                </Button>
              </div>
              {data.validUntil && (
                <p className="text-sm text-muted-foreground mt-4 text-center font-body">
                  This proposal is valid until {data.validUntil}
                </p>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Travel Advisor Footer — for proposal mode, rendered after pricing summary */}
      {!isGroupBooking && agent.name && (
        <footer className="py-16 px-6 border-t border-border/50 bg-card">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
              {ct.agent?.subtitle || "Your Travel Advisor"}
            </p>
            <div className="flex flex-col items-center gap-4 mb-6">
              {agent.photoUrl && (
                <img
                  src={agent.photoUrl}
                  alt={agent.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                />
              )}
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground">{agent.name}</h3>
                <p className="text-muted-foreground font-body mt-0.5">{agent.title}</p>
                <p className="text-sm text-muted-foreground font-body">{agent.agencyName}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm font-body text-muted-foreground flex-wrap">
              {agent.phone && (
                <a
                  href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" /> {agent.phone}
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" /> {agent.email}
                </a>
              )}
              {agent.website && (
                <a
                  href={agent.website.startsWith("http") ? agent.website : `https://${agent.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" /> {agent.website}
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-10 font-body">
              © 2026 {agent.agencyName} · All prices in USD · Subject to availability
            </p>
          </div>
        </footer>
      )}

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        url={bookingModalUrl}
        agencyName={bookingModalTitle || agent.agencyName}
      />
    </div>
  );
}
