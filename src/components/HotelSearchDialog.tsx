import { useState } from "react";
import { Search, Loader2, MapPin, Star, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { toast } from "sonner";

interface HotelResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

interface ParsedHotelData {
  hotelName: string;
  location: string;
  description: string;
  starRating: string;
  amenities: string[];
  highlights: string[];
  imageUrl: string;
}

interface HotelSearchDialogProps {
  onSelect: (data: ParsedHotelData) => void;
  children: React.ReactNode;
}

function parseHotelFromResult(result: HotelResult): ParsedHotelData {
  const markdown = result.markdown || "";
  
  // Extract amenities from common patterns
  const amenityPatterns = [
    /(?:amenities|facilities|features)[:\s]*\n((?:[-•*]\s*.+\n?)+)/gi,
    /(?:pool|spa|wifi|restaurant|bar|gym|fitness|parking|breakfast|concierge|room service)/gi,
  ];
  
  const amenities: string[] = [];
  const amenityMatch = markdown.match(amenityPatterns[1]);
  if (amenityMatch) {
    amenityMatch.forEach(a => {
      const cleaned = a.trim();
      if (!amenities.includes(cleaned)) amenities.push(cleaned);
    });
  }

  // Try to extract star rating
  const starMatch = markdown.match(/(\d)[- ]?star/i) || result.title.match(/(\d)[- ]?star/i);
  
  // Extract first image URL if present
  const imgMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);

  return {
    hotelName: result.title.replace(/\s*[-|–]\s*(?:Booking\.com|TripAdvisor|Hotels\.com|Expedia).*/i, "").trim(),
    location: "",
    description: result.description || "",
    starRating: starMatch ? starMatch[1] : "",
    amenities: amenities.length > 0 ? amenities : [],
    highlights: [],
    imageUrl: imgMatch ? imgMatch[1] : "",
  };
}

export default function HotelSearchDialog({ onSelect, children }: HotelSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);

    try {
      const searchQuery = `${query} hotel site:booking.com OR site:tripadvisor.com`;
      const response = await firecrawlApi.search(searchQuery, { limit: 6 });

      if (response.success && response.data) {
        setResults(response.data);
      } else if (response.success && Array.isArray((response as any).data)) {
        setResults((response as any).data);
      } else {
        // Handle different response shapes
        const items = (response as any)?.data || [];
        setResults(Array.isArray(items) ? items : []);
        if (!response.success) {
          toast.error(response.error || "Search failed");
        }
      }
    } catch (err) {
      console.error("Hotel search error:", err);
      toast.error("Failed to search hotels. Check your Firecrawl connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: HotelResult) => {
    const parsed = parseHotelFromResult(result);
    onSelect(parsed);
    setOpen(false);
    setQuery("");
    setResults([]);
    toast.success(`"${parsed.hotelName}" added to accommodations`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Search Hotels</DialogTitle>
          <p className="text-xs text-muted-foreground">Search Booking.com & TripAdvisor to auto-fill hotel details</p>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Four Seasons Lisbon"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} variant="travel" size="sm" className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching hotels...
          </div>
        )}

        {results.length > 0 && (
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {results.map((result, i) => {
                const parsed = parseHotelFromResult(result);
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left p-3 rounded-lg border border-border/40 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-body font-semibold text-sm truncate">{parsed.hotelName}</h4>
                        {parsed.starRating && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {Array.from({ length: parseInt(parsed.starRating) }).map((_, si) => (
                              <Star key={si} className="h-3 w-3 fill-travel-sunset text-travel-sunset" />
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{parsed.description}</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-muted-foreground/60 truncate">{result.url}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {!loading && results.length === 0 && query && (
          <p className="text-center text-sm text-muted-foreground py-6">No results yet. Press Enter or click search.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
