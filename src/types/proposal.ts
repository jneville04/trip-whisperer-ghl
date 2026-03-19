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
  hidden?: boolean;
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

export type PricingDisplayMode = "hide" | "total" | "per_person" | "per_night";

export interface FlightOption {
  id: string;
  legs: FlightLeg[];
  price?: string;
  pricingDisplay?: PricingDisplayMode;
  agentPricing?: AgentPricing;
  hidden?: boolean;
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
  pricingDisplay?: PricingDisplayMode;
  agentPricing?: AgentPricing;
  hidden?: boolean;
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
  hidden?: boolean;
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
  formHeight: number;
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

export type SectionTitles = Partial<Record<SectionKey, { title?: string; subtitle?: string }>>;

export interface ProposalData {
  proposalType: ProposalType;
  tripName: string;
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
  startDate?: string;
  endDate?: string;
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
  sectionCustomTitles?: SectionTitles;
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

export const blankProposal: ProposalData = {
  proposalType: "proposal",
  tripName: "",
  destination: "",
  subtitle: "",
  heroImageUrl: "",
  heroImageUrls: [],
  travelDates: "",
  travelerCount: "",
  destinationCount: "",
  clientName: "",
  introText: "",
  flights: [],
  flightOptions: [],
  accommodations: [],
  cruiseShips: [],
  busTrips: [],
  days: [],
  inclusions: [],
  pricing: [],
  pricingOptions: [],
  paymentTerms: "",
  validUntil: "",
  agent: {
    name: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    agencyName: "",
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
    passportInfo: "",
    currency: "",
    language: "",
    timeZone: "",
    weatherInfo: "",
    packingTips: "",
    emergencyContacts: "",
  },
  terms: {
    cancellationPolicy: "",
    travelInsurance: "",
    bookingTerms: "",
    liability: "",
    showCancellation: true,
    showInsurance: true,
    showBookingTerms: true,
    showLiability: true,
  },
  notes: "",
  sectionOrder: [...defaultSectionOrder],
  sectionCustomTitles: {},
  checkout: createDefaultCheckout(),
};

// defaultProposal is kept as an alias for backward compatibility (used in editor merge logic)
export const defaultProposal: ProposalData = blankProposal;

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
    formHeight: 1200,
    showTripSummary: true,
    confirmationMessage: "Thank you for booking! Your travel advisor will send you a confirmation email with next steps shortly.",
  };
}
