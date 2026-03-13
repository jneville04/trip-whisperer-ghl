import { motion } from "framer-motion";
import { MapPin, Calendar, Users, Star, Clock, Utensils, Hotel, Camera, Wine, Plane, ArrowRight, Check, Phone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/portugal-hero.jpg";
import sintraImg from "@/assets/portugal-sintra.jpg";
import portoImg from "@/assets/portugal-porto.jpg";
import algarveImg from "@/assets/portugal-algarve.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

interface DayActivity {
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  location: string;
  image: string;
  activities: DayActivity[];
}

const itinerary: ItineraryDay[] = [
  {
    day: 1,
    date: "September 15, 2026",
    title: "Arrival in Lisbon",
    location: "Lisbon",
    image: heroImg,
    activities: [
      { time: "2:00 PM", title: "Airport Transfer", description: "Private luxury transfer from Lisbon Airport to your boutique hotel in Alfama district", icon: <Plane className="h-4 w-4" /> },
      { time: "4:00 PM", title: "Hotel Check-In", description: "Four Seasons Hotel Ritz Lisbon — Superior Suite with Tagus River view", icon: <Hotel className="h-4 w-4" /> },
      { time: "5:30 PM", title: "Alfama Walking Tour", description: "Guided stroll through Lisbon's oldest neighborhood, Fado music origins & São Jorge Castle views", icon: <Camera className="h-4 w-4" /> },
      { time: "8:00 PM", title: "Welcome Dinner", description: "Belcanto — 2 Michelin star restaurant by Chef José Avillez, tasting menu with wine pairing", icon: <Utensils className="h-4 w-4" /> },
    ],
  },
  {
    day: 2,
    date: "September 16, 2026",
    title: "Sintra & Cascais",
    location: "Sintra · Cascais",
    image: sintraImg,
    activities: [
      { time: "9:00 AM", title: "Breakfast at Hotel", description: "Full Portuguese breakfast buffet with fresh pastéis de nata", icon: <Utensils className="h-4 w-4" /> },
      { time: "10:00 AM", title: "Pena Palace Tour", description: "Private guided tour of the colorful Romanticist castle perched above Sintra", icon: <Camera className="h-4 w-4" /> },
      { time: "1:00 PM", title: "Lunch in Sintra", description: "Incomum by Luís Santos — contemporary Portuguese cuisine in a historic setting", icon: <Utensils className="h-4 w-4" /> },
      { time: "3:00 PM", title: "Cascais Coastal Drive", description: "Scenic drive along the coast to Cascais, stops at Cabo da Roca (westernmost point of Europe)", icon: <Camera className="h-4 w-4" /> },
      { time: "7:30 PM", title: "Seafood Dinner", description: "O Pescador — fresh catch of the day overlooking Cascais marina", icon: <Utensils className="h-4 w-4" /> },
    ],
  },
  {
    day: 3,
    date: "September 17, 2026",
    title: "Porto & Douro Valley",
    location: "Porto",
    image: portoImg,
    activities: [
      { time: "8:00 AM", title: "Train to Porto", description: "First-class scenic train journey along the coast (approx. 2.5 hours)", icon: <Plane className="h-4 w-4" /> },
      { time: "11:00 AM", title: "Porto City Tour", description: "Ribeira district, São Bento Station azulejos, Livraria Lello bookshop", icon: <Camera className="h-4 w-4" /> },
      { time: "1:30 PM", title: "Lunch & Port Wine", description: "Wine tasting and lunch at Graham's Port Lodge with Douro views", icon: <Wine className="h-4 w-4" /> },
      { time: "4:00 PM", title: "Hotel Check-In", description: "The Yeatman Hotel — Luxury Wine Spa & Resort with panoramic river views", icon: <Hotel className="h-4 w-4" /> },
      { time: "8:00 PM", title: "Fine Dining", description: "The Yeatman Restaurant — 2 Michelin stars, seasonal tasting menu", icon: <Utensils className="h-4 w-4" /> },
    ],
  },
  {
    day: 4,
    date: "September 18, 2026",
    title: "Algarve Coast",
    location: "Lagos · Benagil",
    image: algarveImg,
    activities: [
      { time: "7:00 AM", title: "Flight to Faro", description: "Short domestic flight from Porto to Faro (approx. 1 hour)", icon: <Plane className="h-4 w-4" /> },
      { time: "10:00 AM", title: "Benagil Cave Tour", description: "Private boat tour to the famous Benagil sea cave and hidden beaches", icon: <Camera className="h-4 w-4" /> },
      { time: "1:00 PM", title: "Beach Lunch", description: "Fresh grilled fish at a cliffside restaurant in Lagos", icon: <Utensils className="h-4 w-4" /> },
      { time: "3:00 PM", title: "Ponta da Piedade", description: "Explore the dramatic golden cliffs and grottos by kayak", icon: <Camera className="h-4 w-4" /> },
      { time: "7:00 PM", title: "Farewell Dinner", description: "Bon Bon Restaurant — 1 Michelin star, celebrating Algarvian cuisine", icon: <Utensils className="h-4 w-4" /> },
    ],
  },
];

const inclusions = [
  "4 nights luxury accommodation",
  "All private airport & city transfers",
  "Daily breakfast at each hotel",
  "3 guided tours with local experts",
  "4 fine dining experiences (wine included)",
  "Port wine tasting experience",
  "Private Benagil cave boat tour",
  "Kayak excursion at Ponta da Piedade",
  "First-class train Lisbon → Porto",
  "Domestic flight Porto → Faro",
  "24/7 concierge support",
  "Travel insurance coordination",
];

export default function TravelProposal() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO ===== */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <img src={heroImg} alt="Lisbon, Portugal" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-foreground/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-primary-foreground/70 font-body text-sm tracking-[0.3em] uppercase mb-4"
          >
            Curated Travel Experience
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-primary-foreground leading-tight"
          >
            Portugal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-xl sm:text-2xl text-primary-foreground/80 mt-3 italic"
          >
            Lisbon · Sintra · Porto · Algarve
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex items-center gap-6 mt-10 text-primary-foreground/60 text-sm font-body"
          >
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Sep 15–19, 2026</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> 2 Travelers</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> 4 Destinations</span>
          </motion.div>
        </div>
        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-primary-foreground/50" />
          </div>
        </motion.div>
      </section>

      {/* ===== PREPARED FOR ===== */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">
            Prepared Exclusively For
          </motion.p>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="font-display text-4xl sm:text-5xl font-bold text-foreground">
            Michael & Sarah Johnson
          </motion.h2>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} className="w-16 h-0.5 bg-primary mx-auto mt-6 mb-8" />
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} className="text-muted-foreground leading-relaxed text-lg font-body">
            An unforgettable 5-day journey through Portugal's most enchanting destinations — from the
            cobblestone streets of Lisbon to the golden cliffs of the Algarve. This bespoke itinerary blends
            world-class dining, cultural immersion, and coastal adventure into the trip of a lifetime.
          </motion.p>
        </div>
      </section>

      {/* ===== ITINERARY ===== */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-16">
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Journey</p>
            <h2 className="font-display text-4xl font-bold text-foreground">Day-by-Day Itinerary</h2>
          </motion.div>

          <div className="space-y-16">
            {itinerary.map((day, dayIdx) => (
              <motion.div
                key={day.day}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={0}
                className="grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {/* Image */}
                <div className={`lg:col-span-2 ${dayIdx % 2 === 1 ? "lg:order-2" : ""}`}>
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
                    <img src={day.image} alt={day.title} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-body font-semibold">
                      Day {day.day}
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div className={`lg:col-span-3 ${dayIdx % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="mb-5">
                    <p className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {day.date}
                      <span className="mx-2">·</span>
                      <MapPin className="h-3.5 w-3.5" /> {day.location}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">{day.title}</h3>
                  </div>

                  <div className="space-y-0 relative">
                    {/* Timeline line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                    {day.activities.map((act, actIdx) => (
                      <div key={actIdx} className="flex gap-4 py-3 relative">
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-1.5 w-[15px] h-[15px] shrink-0 rounded-full border-2 border-primary bg-background" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-primary font-body flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {act.time}
                            </span>
                          </div>
                          <p className="font-body font-semibold text-foreground">{act.title}</p>
                          <p className="text-sm text-muted-foreground font-body mt-0.5">{act.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INCLUDED ===== */}
      <section className="py-20 bg-card">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-12">
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Everything Taken Care Of</p>
            <h2 className="font-display text-4xl font-bold text-foreground">What's Included</h2>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
            {inclusions.map((item, i) => (
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

      {/* ===== PRICING ===== */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Investment</p>
            <h2 className="font-display text-4xl font-bold text-foreground mb-8">Trip Pricing</h2>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="bg-card rounded-2xl border border-border/50 shadow-lg p-10">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-border/30 font-body">
                <span className="text-muted-foreground">Accommodation (4 nights)</span>
                <span className="font-semibold text-foreground">$4,200</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30 font-body">
                <span className="text-muted-foreground">Dining & Experiences</span>
                <span className="font-semibold text-foreground">$2,800</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30 font-body">
                <span className="text-muted-foreground">Transportation & Transfers</span>
                <span className="font-semibold text-foreground">$1,400</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30 font-body">
                <span className="text-muted-foreground">Guided Tours & Activities</span>
                <span className="font-semibold text-foreground">$950</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30 font-body">
                <span className="text-muted-foreground">Concierge & Planning Fee</span>
                <span className="font-semibold text-foreground">$650</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-display text-xl font-bold text-foreground">Total Per Couple</span>
              <span className="font-display text-3xl font-bold text-gradient-travel">$10,000</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-body">50% deposit required to confirm booking. Balance due 30 days prior to departure.</p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} className="mt-10">
            <Button variant="travel" size="lg" className="text-lg px-10 py-6 h-auto">
              Approve & Book This Trip <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4 font-body">
              This proposal is valid until August 15, 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="py-20 bg-card">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="font-display text-xl sm:text-2xl italic text-foreground leading-relaxed">
              "This was the most seamless travel experience we've ever had. Every detail was thought of —
              from the restaurant reservations to the hidden gems only locals know about. We can't wait to book our next trip!"
            </blockquote>
            <p className="mt-6 font-body text-muted-foreground">
              — David & Emily Carter, <span className="text-primary">Italy Trip 2025</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== AGENT FOOTER ===== */}
      <footer className="py-16 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Travel Advisor</p>
          <h3 className="font-display text-2xl font-bold text-foreground">Jessica Williams</h3>
          <p className="text-muted-foreground font-body mt-1">Luxury Travel Specialist · 12 Years Experience</p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm font-body text-muted-foreground">
            <a href="tel:+15551234567" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="h-4 w-4" /> (555) 123-4567
            </a>
            <a href="mailto:jessica@travelagency.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="h-4 w-4" /> jessica@travelagency.com
            </a>
            <a href="#" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Globe className="h-4 w-4" /> travelagency.com
            </a>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-10 font-body">
            © 2026 Luxury Travel Co. · All prices in USD · Subject to availability
          </p>
        </div>
      </footer>
    </div>
  );
}
