import { useState } from "react";
import { Search, Loader2, Star, ExternalLink, Check, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { toast } from "sonner";

interface HotelImage {
  alt: string;
  url: string;
}

interface HotelResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
  images: HotelImage[];
}

interface ParsedHotelData {
  hotelName: string;
  location: string;
  description: string;
  starRating: string;
  amenities: string[];
  highlights: string[];
  imageUrl: string;
  galleryUrls: string[];
}

interface HotelSearchDialogProps {
  onSelect: (data: ParsedHotelData) => void;
  children: React.ReactNode;
}

function parseHotelFromResult(result: HotelResult, selectedImages: string[]): ParsedHotelData {
  const markdown = result.markdown || "";

  // Extract amenities from common words
  const amenityKeywords = ["pool", "spa", "wifi", "restaurant", "bar", "gym", "fitness", "parking", "breakfast", "concierge", "room service", "beach", "golf", "tennis", "sauna", "jacuzzi", "terrace", "garden"];
  const amenities: string[] = [];
  for (const kw of amenityKeywords) {
    if (markdown.toLowerCase().includes(kw)) {
      amenities.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }

  // Try to extract star rating
  const starMatch = markdown.match(/(\d)[- ]?star/i) || result.title.match(/(\d)[- ]?star/i);

  // Clean hotel name
  const hotelName = result.title
    .replace(/\s*[-|–—]\s*(?:Booking\.com|TripAdvisor|Hotels\.com|Expedia|Trivago|Agoda|Official Site|Official Website).*/i, "")
    .replace(/\s*\|.*$/i, "")
    .trim();

  // Use selected images or fall back to first available
  const images = result.images || [];
  const primaryImage = selectedImages[0] || (images.length > 0 ? images[0].url : "");
  const gallery = selectedImages.length > 1 ? selectedImages.slice(1) : [];

  return {
    hotelName,
    location: "",
    description: result.description || "",
    starRating: starMatch ? starMatch[1] : "",
    amenities,
    highlights: [],
    imageUrl: primaryImage,
    galleryUrls: gallery,
  };
}

export default function HotelSearchDialog({ onSelect, children }: HotelSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<HotelResult | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setSelectedResult(null);
    setSelectedImages([]);

    try {
      const response = await firecrawlApi.search(query, { limit: 5 });

      if (response.success && response.data) {
        setResults(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error(response.error || "Search failed");
      }
    } catch (err) {
      console.error("Hotel search error:", err);
      toast.error("Failed to search hotels. Check your Firecrawl connection.");
    } finally {
      setLoading(false);
    }
  };

  const toggleImage = (url: string) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleConfirm = () => {
    if (!selectedResult) return;
    const parsed = parseHotelFromResult(selectedResult, selectedImages);
    onSelect(parsed);
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelectedResult(null);
    setSelectedImages([]);
    toast.success(`"${parsed.hotelName}" added with ${selectedImages.length} photo(s)`);
  };

  const handleBack = () => {
    setSelectedResult(null);
    setSelectedImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedResult(null); setSelectedImages([]); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {selectedResult ? "Select Photos" : "Search Hotels"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {selectedResult
              ? `Choose photos for ${selectedResult.title.replace(/\s*[-|–—]\s*(?:Booking|TripAdvisor|Hotels|Expedia).*/i, "").trim()}. Click to select, then confirm.`
              : "Search by hotel name to auto-fill details and photos"}
          </p>
        </DialogHeader>

        {!selectedResult ? (
          <>
            {/* Search input */}
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Four Seasons Lisbon, Secrets Montego Bay..."
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                autoFocus
              />
              <Button onClick={handleSearch} disabled={loading} variant="travel" size="sm" className="shrink-0 px-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Search</>}
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching hotels...
              </div>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="space-y-2 pr-2">
                  {results.map((result, i) => {
                    const cleanName = result.title
                      .replace(/\s*[-|–—]\s*(?:Booking\.com|TripAdvisor|Hotels\.com|Expedia|Trivago|Agoda|Official).*/i, "")
                      .replace(/\s*\|.*$/i, "")
                      .trim();
                    const starMatch = (result.markdown || "").match(/(\d)[- ]?star/i) || result.title.match(/(\d)[- ]?star/i);
                    const resultImages = result.images || [];
                    const previewImg = resultImages[0]?.url;

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedResult(result)}
                        className="w-full text-left flex gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-16 rounded-md overflow-hidden bg-muted/40 shrink-0 flex items-center justify-center">
                          {previewImg ? (
                            <img src={previewImg} alt={cleanName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <ImagePlus className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-body font-semibold text-sm truncate">{cleanName}</h4>
                          {starMatch && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: parseInt(starMatch[1]) }).map((_, si) => (
                                <Star key={si} className="h-3 w-3 fill-travel-sunset text-travel-sunset" />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {result.images?.length > 0 && (
                              <span className="text-[10px] text-primary font-medium">{result.images.length} photos available</span>
                            )}
                            <span className="text-[10px] text-muted-foreground/50 truncate">{result.url}</span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {!loading && results.length === 0 && query && (
              <p className="text-center text-sm text-muted-foreground py-8">Press Enter or click Search to find hotels.</p>
            )}
          </>
        ) : (
          <>
            {/* Photo selection view */}
            <div className="flex items-center justify-between">
              <Button variant="travel-ghost" size="sm" onClick={handleBack} className="text-xs">
                ← Back to results
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedImages.length} photo{selectedImages.length !== 1 ? "s" : ""} selected
              </span>
            </div>

            <ScrollArea className="flex-1 max-h-[50vh]">
              {selectedResult.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pr-2">
                  {selectedResult.images.map((img, i) => {
                    const isSelected = selectedImages.includes(img.url);
                    const isPrimary = selectedImages[0] === img.url;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleImage(img.url)}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? "border-primary shadow-md"
                            : "border-border/40 hover:border-primary/30"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.alt || `Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).closest('button')!.style.display = 'none';
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        )}
                        {isPrimary && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                            PRIMARY
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImagePlus className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No photos found for this hotel</p>
                  <p className="text-xs opacity-60 mt-1">You can still add the hotel and upload photos manually</p>
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button variant="travel-outline" size="sm" className="flex-1" onClick={() => {
                setSelectedImages([]);
                handleConfirm();
              }}>
                Add without photos
              </Button>
              <Button variant="travel" size="sm" className="flex-1" onClick={handleConfirm} disabled={selectedImages.length === 0}>
                Add with {selectedImages.length} photo{selectedImages.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
