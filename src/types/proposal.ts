export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "transport" | "hotel" | "dining" | "activity" | "sightseeing";
}

export interface ItineraryDay {
  id: string;
  date: string;
  title: string;
  location: string;
  imageUrl: string;
  activities: Activity[];
}

export interface PricingLine {
  id: string;
  label: string;
  amount: string;
}

export interface AgentInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  agencyName: string;
  logoUrl: string;
  photoUrl: string;
}

export interface FlightLeg {
  id: string;
  type: "departure" | "return";
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
}

export interface Accommodation {
  id: string;
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  nights: string;
  imageUrl: string;
  galleryUrls: string[];
  description: string;
  starRating: string;
  amenities: string[];
  highlights: string[];
}

export interface BrandSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
}

export interface SectionVisibility {
  hero: boolean;
  overview: boolean;
  flights: boolean;
  accommodations: boolean;
  itinerary: boolean;
  inclusions: boolean;
  pricing: boolean;
  testimonial: boolean;
  agent: boolean;
}

export interface ProposalData {
  destination: string;
  subtitle: string;
  heroImageUrl: string;
  travelDates: string;
  travelerCount: string;
  destinationCount: string;
  clientName: string;
  introText: string;
  days: ItineraryDay[];
  flights: FlightLeg[];
  accommodations: Accommodation[];
  inclusions: string[];
  pricing: PricingLine[];
  paymentTerms: string;
  validUntil: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialTrip: string;
  agent: AgentInfo;
  brand: BrandSettings;
  sectionVisibility: SectionVisibility;
}

export const createActivity = (type: Activity["type"] = "activity"): Activity => ({
  id: crypto.randomUUID(),
  time: "",
  title: "",
  description: "",
  type,
});

export const createDay = (dayNumber: number): ItineraryDay => ({
  id: crypto.randomUUID(),
  date: "",
  title: `Day ${dayNumber}`,
  location: "",
  imageUrl: "",
  activities: [createActivity()],
});

export const createPricingLine = (): PricingLine => ({
  id: crypto.randomUUID(),
  label: "",
  amount: "",
});

export const createFlightLeg = (type: FlightLeg["type"] = "departure"): FlightLeg => ({
  id: crypto.randomUUID(),
  type,
  airline: "",
  flightNumber: "",
  departureAirport: "",
  arrivalAirport: "",
  departureTime: "",
  arrivalTime: "",
  date: "",
});

export const createAccommodation = (): Accommodation => ({
  id: crypto.randomUUID(),
  hotelName: "",
  location: "",
  checkIn: "",
  checkOut: "",
  roomType: "",
  nights: "",
  imageUrl: "",
  description: "",
});

export const defaultProposal: ProposalData = {
  destination: "Portugal",
  subtitle: "Lisbon · Sintra · Porto · Algarve",
  heroImageUrl: "",
  travelDates: "Sep 15–19, 2026",
  travelerCount: "2 Travelers",
  destinationCount: "4 Destinations",
  clientName: "Michael & Sarah Johnson",
  introText:
    "An unforgettable 5-day journey through Portugal's most enchanting destinations — from the cobblestone streets of Lisbon to the golden cliffs of the Algarve. This bespoke itinerary blends world-class dining, cultural immersion, and coastal adventure into the trip of a lifetime.",
  flights: [
    {
      id: crypto.randomUUID(),
      type: "departure",
      airline: "TAP Air Portugal",
      flightNumber: "TP 236",
      departureAirport: "SFO – San Francisco",
      arrivalAirport: "LIS – Lisbon",
      departureTime: "6:30 PM",
      arrivalTime: "1:00 PM +1",
      date: "September 14, 2026",
    },
    {
      id: crypto.randomUUID(),
      type: "return",
      airline: "TAP Air Portugal",
      flightNumber: "TP 237",
      departureAirport: "LIS – Lisbon",
      arrivalAirport: "SFO – San Francisco",
      departureTime: "10:00 AM",
      arrivalTime: "1:30 PM",
      date: "September 19, 2026",
    },
  ],
  accommodations: [
    {
      id: crypto.randomUUID(),
      hotelName: "Four Seasons Hotel Ritz Lisbon",
      location: "Lisbon",
      checkIn: "Sep 15, 2026",
      checkOut: "Sep 17, 2026",
      roomType: "Superior Suite – Tagus River View",
      nights: "2 Nights",
      imageUrl: "",
      description: "Iconic luxury hotel overlooking Eduardo VII Park with world-class spa and dining.",
    },
    {
      id: crypto.randomUUID(),
      hotelName: "The Yeatman Hotel",
      location: "Porto",
      checkIn: "Sep 17, 2026",
      checkOut: "Sep 18, 2026",
      roomType: "Deluxe Room – Douro River View",
      nights: "1 Night",
      imageUrl: "",
      description: "Award-winning wine spa & resort with panoramic views of Porto and the Douro River.",
    },
  ],
  days: [
    {
      id: crypto.randomUUID(),
      date: "September 15, 2026",
      title: "Arrival in Lisbon",
      location: "Lisbon",
      imageUrl: "",
      activities: [
        { id: crypto.randomUUID(), time: "2:00 PM", title: "Airport Transfer", description: "Private luxury transfer from Lisbon Airport to your boutique hotel in Alfama district", type: "transport" },
        { id: crypto.randomUUID(), time: "4:00 PM", title: "Hotel Check-In", description: "Four Seasons Hotel Ritz Lisbon — Superior Suite with Tagus River view", type: "hotel" },
        { id: crypto.randomUUID(), time: "5:30 PM", title: "Alfama Walking Tour", description: "Guided stroll through Lisbon's oldest neighborhood, Fado music origins & São Jorge Castle views", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "8:00 PM", title: "Welcome Dinner", description: "Belcanto — 2 Michelin star restaurant by Chef José Avillez, tasting menu with wine pairing", type: "dining" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "September 16, 2026",
      title: "Sintra & Cascais",
      location: "Sintra · Cascais",
      imageUrl: "",
      activities: [
        { id: crypto.randomUUID(), time: "9:00 AM", title: "Breakfast at Hotel", description: "Full Portuguese breakfast buffet with fresh pastéis de nata", type: "dining" },
        { id: crypto.randomUUID(), time: "10:00 AM", title: "Pena Palace Tour", description: "Private guided tour of the colorful Romanticist castle perched above Sintra", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "1:00 PM", title: "Lunch in Sintra", description: "Incomum by Luís Santos — contemporary Portuguese cuisine in a historic setting", type: "dining" },
        { id: crypto.randomUUID(), time: "3:00 PM", title: "Cascais Coastal Drive", description: "Scenic drive along the coast to Cascais, stops at Cabo da Roca", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "7:30 PM", title: "Seafood Dinner", description: "O Pescador — fresh catch of the day overlooking Cascais marina", type: "dining" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "September 17, 2026",
      title: "Porto & Douro Valley",
      location: "Porto",
      imageUrl: "",
      activities: [
        { id: crypto.randomUUID(), time: "8:00 AM", title: "Train to Porto", description: "First-class scenic train journey along the coast (approx. 2.5 hours)", type: "transport" },
        { id: crypto.randomUUID(), time: "11:00 AM", title: "Porto City Tour", description: "Ribeira district, São Bento Station azulejos, Livraria Lello bookshop", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "1:30 PM", title: "Lunch & Port Wine", description: "Wine tasting and lunch at Graham's Port Lodge with Douro views", type: "dining" },
        { id: crypto.randomUUID(), time: "4:00 PM", title: "Hotel Check-In", description: "The Yeatman Hotel — Luxury Wine Spa & Resort", type: "hotel" },
        { id: crypto.randomUUID(), time: "8:00 PM", title: "Fine Dining", description: "The Yeatman Restaurant — 2 Michelin stars, seasonal tasting menu", type: "dining" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "September 18, 2026",
      title: "Algarve Coast",
      location: "Lagos · Benagil",
      imageUrl: "",
      activities: [
        { id: crypto.randomUUID(), time: "7:00 AM", title: "Flight to Faro", description: "Short domestic flight from Porto to Faro", type: "transport" },
        { id: crypto.randomUUID(), time: "10:00 AM", title: "Benagil Cave Tour", description: "Private boat tour to the famous Benagil sea cave and hidden beaches", type: "activity" },
        { id: crypto.randomUUID(), time: "1:00 PM", title: "Beach Lunch", description: "Fresh grilled fish at a cliffside restaurant in Lagos", type: "dining" },
        { id: crypto.randomUUID(), time: "3:00 PM", title: "Ponta da Piedade", description: "Explore the dramatic golden cliffs and grottos by kayak", type: "activity" },
        { id: crypto.randomUUID(), time: "7:00 PM", title: "Farewell Dinner", description: "Bon Bon Restaurant — 1 Michelin star, Algarvian cuisine", type: "dining" },
      ],
    },
  ],
  inclusions: [
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
  ],
  pricing: [
    { id: crypto.randomUUID(), label: "Accommodation (4 nights)", amount: "$4,200" },
    { id: crypto.randomUUID(), label: "Dining & Experiences", amount: "$2,800" },
    { id: crypto.randomUUID(), label: "Transportation & Transfers", amount: "$1,400" },
    { id: crypto.randomUUID(), label: "Guided Tours & Activities", amount: "$950" },
    { id: crypto.randomUUID(), label: "Concierge & Planning Fee", amount: "$650" },
  ],
  paymentTerms: "50% deposit required to confirm booking. Balance due 30 days prior to departure.",
  validUntil: "August 15, 2026",
  testimonialQuote:
    "This was the most seamless travel experience we've ever had. Every detail was thought of — from the restaurant reservations to the hidden gems only locals know about.",
  testimonialAuthor: "David & Emily Carter",
  testimonialTrip: "Italy Trip 2025",
  agent: {
    name: "Jessica Williams",
    title: "Luxury Travel Specialist · 12 Years Experience",
    phone: "(555) 123-4567",
    email: "jessica@travelagency.com",
    website: "travelagency.com",
    agencyName: "Luxury Travel Co.",
    logoUrl: "",
    photoUrl: "",
  },
  brand: {
    primaryColor: "",
    secondaryColor: "",
    accentColor: "",
    logoUrl: "",
  },
  sectionVisibility: {
    hero: true,
    overview: true,
    flights: true,
    accommodations: true,
    itinerary: true,
    inclusions: true,
    pricing: true,
    testimonial: true,
    agent: true,
  },
};
