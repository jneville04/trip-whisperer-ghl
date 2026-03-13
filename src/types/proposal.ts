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
  imageUrls: string[];
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

export interface Traveler {
  id: string;
  fullName: string;
  passportNumber: string;
  dateOfBirth: string;
  dietaryRestrictions: string;
  specialRequests: string;
}

export interface TravelEssentials {
  visaRequirements: string;
  passportInfo: string;
  currency: string;
  language: string;
  timeZone: string;
  weatherInfo: string;
  packingTips: string;
  emergencyContacts: string;
}

export interface TermsAndConditions {
  cancellationPolicy: string;
  travelInsurance: string;
  bookingTerms: string;
  liability: string;
  showCancellation: boolean;
  showInsurance: boolean;
  showBookingTerms: boolean;
  showLiability: boolean;
}

export type SectionKey = "overview" | "flights" | "accommodations" | "itinerary" | "inclusions" | "pricing" | "essentials" | "terms" | "agent";

export interface SectionVisibility {
  hero: boolean;
  overview: boolean;
  flights: boolean;
  accommodations: boolean;
  itinerary: boolean;
  inclusions: boolean;
  pricing: boolean;
  essentials: boolean;
  terms: boolean;
  agent: boolean;
}

export const defaultSectionOrder: SectionKey[] = [
  "overview", "flights", "accommodations", "itinerary", "inclusions", "essentials", "terms", "pricing", "agent",
];

export interface ProposalData {
  destination: string;
  subtitle: string;
  heroImageUrl: string;
  heroImageUrls: string[];
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
  travelers: Traveler[];
  essentials: TravelEssentials;
  terms: TermsAndConditions;
  notes: string;
  agent: AgentInfo;
  brand: BrandSettings;
  sectionVisibility: SectionVisibility;
  sectionOrder: SectionKey[];
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
  imageUrls: [],
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
  galleryUrls: [],
  description: "",
  starRating: "",
  amenities: [],
  highlights: [],
});

export const defaultProposal: ProposalData = {
  destination: "Portugal",
  subtitle: "Lisbon · Nazaré · Fátima · Porto · Aveiro · Coimbra",
  heroImageUrl: "",
  heroImageUrls: [],
  travelDates: "Dec 8–16, 2026",
  travelerCount: "20 Travelers",
  destinationCount: "6 Destinations",
  clientName: "Portugal Tour Group",
  introText:
    "Experience the charm, culture, and coastal beauty of Portugal on an unforgettable journey from San Francisco to Lisbon and Porto. Step into a storybook of cobblestone streets, colorful tiles, and ocean breezes as you uncover the very best of Portugal. From the pastel rooftops of Lisbon to the rolling vineyards along the Douro River, every moment is designed to delight your senses and fill your passport with memories.",
  flights: [
    {
      id: crypto.randomUUID(),
      type: "departure",
      airline: "TAP Air Portugal",
      flightNumber: "",
      departureAirport: "SFO – San Francisco",
      arrivalAirport: "LIS – Lisbon",
      departureTime: "",
      arrivalTime: "",
      date: "December 8, 2026",
    },
    {
      id: crypto.randomUUID(),
      type: "return",
      airline: "TAP Air Portugal",
      flightNumber: "",
      departureAirport: "LIS – Lisbon",
      arrivalAirport: "SFO – San Francisco",
      departureTime: "",
      arrivalTime: "",
      date: "December 16, 2026",
    },
  ],
  accommodations: [
    {
      id: crypto.randomUUID(),
      hotelName: "Hotel Marquês de Pombal",
      location: "Lisbon",
      checkIn: "Dec 9, 2026",
      checkOut: "Dec 11, 2026",
      roomType: "Standard Room",
      nights: "2 Nights",
      imageUrl: "",
      galleryUrls: [],
      description: "Centrally located hotel in Lisbon, ideal for exploring the historic neighborhoods and tasting world-famous Pastel de Nata in Belém.",
      starRating: "4",
      amenities: ["Daily Breakfast", "Central Location", "Airport Transfer"],
      highlights: ["Walking distance to historic Lisbon", "Close to Belém pastries", "Comfortable base for city exploration"],
    },
    {
      id: crypto.randomUUID(),
      hotelName: "Hotel Santa Maria Fatima",
      location: "Fátima",
      checkIn: "Dec 11, 2026",
      checkOut: "Dec 12, 2026",
      roomType: "Standard Room",
      nights: "1 Night",
      imageUrl: "",
      galleryUrls: [],
      description: "Comfortable hotel near the Sanctuary of Our Lady of Fátima, one of the world's most revered pilgrimage sites.",
      starRating: "4",
      amenities: ["Daily Breakfast", "Near Sanctuary"],
      highlights: ["Steps from the Sanctuary of Fátima", "Peaceful and reflective atmosphere"],
    },
    {
      id: crypto.randomUUID(),
      hotelName: "Hotel Axis Porto",
      location: "Porto",
      checkIn: "Dec 12, 2026",
      checkOut: "Dec 14, 2026",
      roomType: "Standard Room",
      nights: "2 Nights",
      imageUrl: "",
      galleryUrls: [],
      description: "Modern hotel in Porto with easy access to the city's stunning scenery, soulful charm, and the famous Douro River.",
      starRating: "4",
      amenities: ["Daily Breakfast", "City Center", "Modern Facilities"],
      highlights: ["Explore Europe's most captivating city", "Close to Ribeira district and port wine cellars"],
    },
  ],
  days: [
    {
      id: crypto.randomUUID(),
      date: "December 8, 2026",
      title: "Flight from San Francisco",
      location: "San Francisco",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "", title: "Departure Flight from SFO", description: "Roundtrip flight departing from San Francisco to Lisbon", type: "transport" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 9, 2026",
      title: "Lisbon Arrival",
      location: "Lisbon",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "", title: "Arrival in Lisbon", description: "Private airport transfer to Hotel Marquês de Pombal", type: "transport" },
        { id: crypto.randomUUID(), time: "", title: "Hotel Check-In", description: "Hotel Marquês de Pombal — settle in and rest after your flight", type: "hotel" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 10, 2026",
      title: "Lisbon City Tour & Belém",
      location: "Lisbon · Belém",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "9:00 AM", title: "Lisbon City Tour", description: "Guided tour through historic neighborhoods — Alfama, Bairro Alto, and Chiado", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "12:00 PM", title: "Belém Pastries", description: "Taste the world-famous Pastel de Nata at Pastéis de Belém", type: "dining" },
        { id: crypto.randomUUID(), time: "2:00 PM", title: "Optional: Gastronomic & Cultural Tour", description: "4-hour deep dive into Lisbon's food scene and cultural landmarks", type: "activity" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 11, 2026",
      title: "Óbidos, Nazaré, Batalha & Fátima",
      location: "Óbidos · Nazaré · Batalha · Fátima",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "8:00 AM", title: "Depart Lisbon", description: "Travel from Lisbon heading north with stops along the way", type: "transport" },
        { id: crypto.randomUUID(), time: "9:30 AM", title: "Óbidos", description: "Explore the charming medieval walled town", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "11:30 AM", title: "Nazaré", description: "Visit this iconic fishing village where Atlantic waves can reach 100 feet high", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "2:00 PM", title: "Batalha Monastery", description: "Discover the breathtaking Monastery of Batalha, a Gothic UNESCO masterpiece", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "5:00 PM", title: "Fátima", description: "Visit the Sanctuary of Our Lady of Fátima", type: "sightseeing" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 12, 2026",
      title: "Aveiro & Porto",
      location: "Aveiro · Porto",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "9:00 AM", title: "Depart Fátima", description: "Travel from Fátima to Porto via Aveiro", type: "transport" },
        { id: crypto.randomUUID(), time: "11:00 AM", title: "Aveiro Canal Cruise", description: "Cruise the colorful canals of the 'Venice of Portugal'", type: "activity" },
        { id: crypto.randomUUID(), time: "3:00 PM", title: "Arrive in Porto", description: "Check in at Hotel Axis Porto", type: "hotel" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 13, 2026",
      title: "Explore Porto",
      location: "Porto",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "9:00 AM", title: "Porto City Tour", description: "Explore Europe's most captivating city — Ribeira district, São Bento Station azulejos, and more", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "2:00 PM", title: "Tuk Tuk Tour & Six Bridge Boat Ride", description: "See Porto from unique perspectives — by tuk tuk and by boat along the Douro", type: "activity" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 14, 2026",
      title: "Coimbra & Return to Lisbon",
      location: "Coimbra · Lisbon",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "8:00 AM", title: "Depart Porto", description: "Travel south with a stop in Coimbra", type: "transport" },
        { id: crypto.randomUUID(), time: "10:00 AM", title: "Coimbra Visit", description: "Explore one of Europe's oldest university cities", type: "sightseeing" },
        { id: crypto.randomUUID(), time: "4:00 PM", title: "Return to Lisbon", description: "Check in at Hotel Marquês de Pombal", type: "hotel" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 15, 2026",
      title: "Leisure Day in Lisbon",
      location: "Lisbon",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "", title: "Free Time to Explore", description: "Enjoy Lisbon at your own pace — shop, explore, or relax", type: "activity" },
        { id: crypto.randomUUID(), time: "", title: "Optional: Boat Tour", description: "2-hour boat tour along the Tagus River", type: "activity" },
        { id: crypto.randomUUID(), time: "", title: "Optional: Sintra, Cascais & Estoril", description: "Half-day tour to the fairytale town of Sintra, coastal Cascais, and the Estoril Coast", type: "sightseeing" },
      ],
    },
    {
      id: crypto.randomUUID(),
      date: "December 16, 2026",
      title: "Departure",
      location: "Lisbon",
      imageUrl: "",
      imageUrls: [],
      activities: [
        { id: crypto.randomUUID(), time: "", title: "Airport Transfer", description: "Private transfer to Lisbon Airport", type: "transport" },
        { id: crypto.randomUUID(), time: "", title: "Departure Flight", description: "Flight from Lisbon back to San Francisco", type: "transport" },
      ],
    },
  ],
  inclusions: [
    "Roundtrip airfare from San Francisco",
    "4-star handpicked hotels with daily breakfast",
    "Guided sightseeing and entrance fees",
    "Private airport transfers",
    "Comfortable ground transportation throughout Portugal",
    "Expert local tour guides",
    "Free time to explore at your own pace",
  ],
  pricing: [
    { id: crypto.randomUUID(), label: "Air & Hotel Package", amount: "Contact for pricing" },
  ],
  paymentTerms: "Deposit secures your booking — flexible payment options available.",
  validUntil: "",
  agent: {
    name: "Rikki Bradley",
    title: "Travel Advisor",
    phone: "916.821.8507",
    email: "rikki@bradleyandcotravel.com",
    website: "bradleyandcotravel.com",
    agencyName: "Bradley & CO Travel",
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
    essentials: true,
    terms: true,
    agent: true,
  },
  travelers: [],
  essentials: {
    visaRequirements: "",
    passportInfo: "Valid passport required with at least 6 months validity beyond travel dates.",
    currency: "Euro (€)",
    language: "Portuguese",
    timeZone: "WET (UTC+0)",
    weatherInfo: "December in Portugal: mild, 10-15°C (50-59°F). Pack layers and a rain jacket.",
    packingTips: "Comfortable walking shoes, layers, rain jacket, camera, travel adapter (Type F).",
    emergencyContacts: "",
  },
  terms: {
    cancellationPolicy: "",
    travelInsurance: "Comprehensive travel insurance is strongly recommended and can be arranged upon request.",
    bookingTerms: "",
    liability: "",
    showCancellation: true,
    showInsurance: true,
    showBookingTerms: true,
    showLiability: true,
  },
  notes: "",
  sectionOrder: [...defaultSectionOrder],
};
