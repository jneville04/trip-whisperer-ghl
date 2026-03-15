export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "transport" | "hotel" | "dining" | "activity" | "sightseeing";
  imageUrls?: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
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

export interface PricingOption {
  id: string;
  name: string;
  totalPrice: string;
  deposit: string;
  paymentNote: string;
  finalPaymentDate: string;
  availabilityNote: string;
}

export interface AgentPricing {
  cost: string;
  commission: string;
  markupType: "flat" | "percent";
  markupValue: string;
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
  airlineCode?: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  price?: string;
  agentPricing?: AgentPricing;
}

export interface FlightOption {
  id: string;
  legs: FlightLeg[];
  price?: string;
  agentPricing?: AgentPricing;
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
  videoUrl?: string;
  videoThumbnailUrl?: string;
  mediaType?: "photos" | "video";
  price?: string;
  agentPricing?: AgentPricing;
}

export interface CruiseShip {
  id: string;
  shipName: string;
  cruiseLine: string;
  cabinType: string;
  cabinNumber: string;
  deck: string;
  embarkationPort: string;
  disembarkationPort: string;
  embarkationDate: string;
  disembarkationDate: string;
  nights: string;
  imageUrl: string;
  galleryUrls: string[];
  description: string;
  amenities: string[];
  highlights: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  mediaType?: "photos" | "video";
  price?: string;
  agentPricing?: AgentPricing;
}

export interface LocationAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface BusTrip {
  id: string;
  busCompany: string;
  routeName: string;
  pickupLocation: string;
  pickupAddress?: LocationAddress;
  pickupTime: string;
  pickupDate: string;
  dropoffLocation: string;
  dropoffAddress?: LocationAddress;
  dropoffTime: string;
  dropoffDate: string;
  duration: string;
  seatType: string;
  busType: string;
  description: string;
  amenities: string[];
  highlights: string[];
  imageUrl: string;
  galleryUrls: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  mediaType?: "photos" | "video";
  stops: BusStop[];
  price?: string;
  agentPricing?: AgentPricing;
}

export interface BusStop {
  id: string;
  location: string;
  locationAddress?: LocationAddress;
  arrivalTime: string;
  departureTime: string;
  notes: string;
}

export interface BrandSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  showAgencyNameWithLogo?: boolean;
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

export interface PaymentOption {
  id: string;
  type: "full" | "deposit" | "installments";
  label: string;
  description: string;
  depositPercent?: number;
  installmentCount?: number;
  enabled: boolean;
}

export interface CheckoutSettings {
  enabled: boolean;
  headline: string;
  message: string;
  paymentOptions: PaymentOption[];
  customFormUrl: string;
  showTripSummary: boolean;
  confirmationMessage: string;
}

export type SectionKey = "overview" | "flights" | "accommodations" | "cruiseShips" | "busTrips" | "itinerary" | "inclusions" | "pricing" | "essentials" | "terms" | "agent";

export interface SectionVisibility {
  hero: boolean;
  overview: boolean;
  flights: boolean;
  accommodations: boolean;
  cruiseShips: boolean;
  busTrips: boolean;
  itinerary: boolean;
  inclusions: boolean;
  pricing: boolean;
  essentials: boolean;
  terms: boolean;
  agent: boolean;
}

export const defaultSectionOrder: SectionKey[] = [
  "overview", "flights", "accommodations", "cruiseShips", "busTrips", "itinerary", "inclusions", "essentials", "terms", "pricing", "agent",
];

export type ProposalType = "group_booking" | "proposal";

export interface ProposalData {
  proposalType: ProposalType;
  destination: string;
  subtitle: string;
  bookingUrl?: string;
  approveUrl?: string;
  revisionsUrl?: string;
  heroImageUrl: string;
  heroImageUrls: string[];
  heroMediaType?: "photos" | "video";
  heroVideoUrl?: string;
  heroVideoThumbnailUrl?: string;
  heroAutoplay?: boolean;
  heroMuted?: boolean;
  travelDates: string;
  travelerCount: string;
  destinationCount: string;
  clientName: string;
  introText: string;
  days: ItineraryDay[];
  flights: FlightLeg[];
  flightOptions: FlightOption[];
  accommodations: Accommodation[];
  cruiseShips: CruiseShip[];
  busTrips: BusTrip[];
  inclusions: string[];
  pricing: PricingLine[];
  pricingOptions: PricingOption[];
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
  checkout?: CheckoutSettings;
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

export const createPricingOption = (): PricingOption => ({
  id: crypto.randomUUID(),
  name: "",
  totalPrice: "",
  deposit: "",
  paymentNote: "",
  finalPaymentDate: "",
  availabilityNote: "",
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

export const createFlightOption = (): FlightOption => ({
  id: crypto.randomUUID(),
  legs: [createFlightLeg("departure"), createFlightLeg("return")],
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
  mediaType: "photos",
});

export const createCruiseShip = (): CruiseShip => ({
  id: crypto.randomUUID(),
  shipName: "",
  cruiseLine: "",
  cabinType: "",
  cabinNumber: "",
  deck: "",
  embarkationPort: "",
  disembarkationPort: "",
  embarkationDate: "",
  disembarkationDate: "",
  nights: "",
  imageUrl: "",
  galleryUrls: [],
  description: "",
  amenities: [],
  highlights: [],
  mediaType: "photos",
});

export const createBusStop = (): BusStop => ({
  id: crypto.randomUUID(),
  location: "",
  arrivalTime: "",
  departureTime: "",
  notes: "",
});

export const createBusTrip = (): BusTrip => ({
  id: crypto.randomUUID(),
  busCompany: "",
  routeName: "",
  pickupLocation: "",
  pickupTime: "",
  pickupDate: "",
  dropoffLocation: "",
  dropoffTime: "",
  dropoffDate: "",
  duration: "",
  seatType: "",
  busType: "",
  description: "",
  amenities: [],
  highlights: [],
  imageUrl: "",
  galleryUrls: [],
  stops: [],
  mediaType: "photos",
});

export const defaultProposal: ProposalData = {
  proposalType: "group_booking",
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
  flights: [],
  flightOptions: [
    {
      id: crypto.randomUUID(),
      legs: [
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
    showAgencyNameWithLogo: true,
  },
  cruiseShips: [],
  busTrips: [],
  sectionVisibility: {
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
  checkout: createDefaultCheckout(),
};

export function createDefaultCheckout(): CheckoutSettings {
  return {
    enabled: false,
    headline: "Ready to Book Your Trip?",
    message: "Select your preferred payment option below and confirm your booking.",
    paymentOptions: [
      { id: crypto.randomUUID(), type: "full", label: "Pay in Full", description: "One-time payment for the full trip amount", enabled: true },
      { id: crypto.randomUUID(), type: "deposit", label: "Pay Deposit", description: "Secure your booking with a deposit", depositPercent: 30, enabled: false },
      { id: crypto.randomUUID(), type: "installments", label: "Payment Plan", description: "Split your payment into installments", installmentCount: 3, enabled: false },
    ],
    customFormUrl: "",
    showTripSummary: true,
    confirmationMessage: "Thank you for booking! Your travel advisor will send you a confirmation email with next steps shortly.",
  };
}
