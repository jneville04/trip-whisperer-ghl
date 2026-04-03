import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ProposalFilters, { type FilterType, type SortType } from "@/components/ProposalFilters";
import TripCard from "@/components/TripCard";
import AppLayout from "@/components/AppLayout";
import { Search, FileText, Archive, Trash2 } from "lucide-react";
import { type ProposalData, type TripRow } from "@/types/proposal";
import DuplicateTripModal from "@/components/DuplicateTripModal";
import { Button } from "@/components/ui/button";

type ViewTab = "active" | "archived" | "trash";

export default function Trips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [viewTab, setViewTab] = useState<ViewTab>("active");
  const [dupModal, setDupModal] = useState<{ open: boolean; trip: TripRow | null }>({ open: false, trip: null });

  useEffect(() => {
    if (user) loadTrips();
  }, [user]);

  const filtered = useMemo(() => {
    let result = trips.filter((t) => {
      const row = t as any;
      // Tab filter
      if (viewTab === "active" && (row.archived_at || row.trashed_at)) return false;
      if (viewTab === "archived" && (!row.archived_at || row.trashed_at)) return false;
      if (viewTab === "trash" && !row.trashed_at) return false;

      const d = t.draft_data as ProposalData | null;
      const title = d?.tripName || "";
      const clientName = d?.clientName || "";
      const destination = d?.destination || "";
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        destination.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const tripType = t.trip_type || "individual";
      switch (filter) {
        case "proposals": return tripType === "individual";
        case "group_trips": return tripType === "group";
        case "drafts": return t.status === "draft";
        case "published": return ["published", "sent", "approved"].includes(t.status || "");
        default: return true;
      }
    });

    result.sort((a, b) => {
      const aTitle = (a.draft_data as any)?.tripName || "";
      const bTitle = (b.draft_data as any)?.tripName || "";
      switch (sort) {
        case "oldest": return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "az": return aTitle.localeCompare(bTitle);
        case "za": return bTitle.localeCompare(aTitle);
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return result;
  }, [trips, search, filter, sort, viewTab]);

  const loadTrips = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading trips", description: error.message, variant: "destructive" });
    } else {
      setTrips((data as any[]) || []);
    }
    setLoading(false);
  };

  const duplicateTrip = async (tripName: string, clientName: string, trip: TripRow) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const dupData = {
      ...(trip.draft_data as any),
      tripName,
      clientName,
    };

    const { error } = await supabase
      .from("trips")
      .insert({
        trip_type: trip.trip_type || "individual",
        status: "draft",
        draft_data: dupData as any,
        max_capacity: trip.max_capacity,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip duplicated" });
      loadTrips();
    }
  };

  // Soft delete — move to trash
  const trashTrip = async (id: string) => {
    const { error } = await supabase
      .from("trips")
      .update({ trashed_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip moved to Trash" });
      setTrips((prev) =>
        prev.map((t) => t.id === id ? { ...t, trashed_at: new Date().toISOString() } as any : t)
      );
    }
  };

  // Restore from trash
  const restoreFromTrash = async (id: string) => {
    const { error } = await supabase
      .from("trips")
      .update({ trashed_at: null } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip restored from Trash" });
      setTrips((prev) =>
        prev.map((t) => t.id === id ? { ...t, trashed_at: null } as any : t)
      );
    }
  };

  // Permanent delete
  const permanentDeleteTrip = async (id: string) => {
    if (!confirm("Permanently delete this trip? This cannot be undone.")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip permanently deleted" });
      setTrips((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const archiveTrip = async (id: string) => {
    const { error } = await supabase
      .from("trips")
      .update({ archived_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip archived" });
      setTrips((prev) =>
        prev.map((t) => t.id === id ? { ...t, archived_at: new Date().toISOString() } as any : t)
      );
    }
  };

  const restoreTrip = async (id: string) => {
    const { error } = await supabase
      .from("trips")
      .update({ archived_at: null } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip restored" });
      setTrips((prev) =>
        prev.map((t) => t.id === id ? { ...t, archived_at: null } as any : t)
      );
    }
  };

  const [reopening, setReopening] = useState<string | null>(null);

  const reopenTrip = async (id: string) => {
    if (reopening) return;
    setReopening(id);
    const { error } = await supabase
      .from("trips")
      .update({ status: "reopened" })
      .eq("id", id);
    setReopening(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposal reopened for editing" });
      setTrips((prev) =>
        prev.map((t) => t.id === id ? { ...t, status: "reopened" } : t)
      );
    }
  };

  const copyShareLink = (slug: string | null) => {
    if (!slug) return;
    const url = `${window.location.origin}/view/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this link with your client." });
  };

  const archivedCount = trips.filter((t) => (t as any).archived_at && !(t as any).trashed_at).length;
  const trashedCount = trips.filter((t) => (t as any).trashed_at).length;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={viewTab === "active" ? "travel" : "travel-ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setViewTab("active")}
          >
            Active
          </Button>
          <Button
            variant={viewTab === "archived" ? "travel" : "travel-ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setViewTab("archived")}
          >
            <Archive className="h-3 w-3 mr-1" /> Archived {archivedCount > 0 && `(${archivedCount})`}
          </Button>
          <Button
            variant={viewTab === "trash" ? "travel" : "travel-ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setViewTab("trash")}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Trash {trashedCount > 0 && `(${trashedCount})`}
          </Button>
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, destination, or title..."
              className="pl-10"
            />
          </div>
          <ProposalFilters filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {viewTab === "archived" ? "No archived trips" : viewTab === "trash" ? "Trash is empty" : search || filter !== "all" ? "No trips found" : "No trips yet"}
            </h3>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
              {viewTab === "archived" ? "Archived trips will appear here." : viewTab === "trash" ? "Deleted trips will appear here for recovery." : search || filter !== "all" ? "Try a different search or filter" : "Click \"Create Trip\" above to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isArchived={viewTab === "archived"}
                isTrashed={viewTab === "trash"}
                onOpen={() => navigate(`/editor/${trip.id}`)}
                onDuplicate={() => setDupModal({ open: true, trip })}
                onDelete={() => trashTrip(trip.id)}
                onCopyLink={() => copyShareLink(trip.public_slug)}
                onArchive={() => archiveTrip(trip.id)}
                onRestore={() => restoreTrip(trip.id)}
                onReopen={() => reopenTrip(trip.id)}
                onRestoreFromTrash={() => restoreFromTrash(trip.id)}
                onPermanentDelete={() => permanentDeleteTrip(trip.id)}
              />
            ))}
          </div>
        )}
        {dupModal.trip && (
          <DuplicateTripModal
            open={dupModal.open}
            onOpenChange={(open) => setDupModal((prev) => ({ ...prev, open }))}
            tripName={`${(dupModal.trip.draft_data as any)?.tripName || ""} (Copy)`}
            clientName={(dupModal.trip.draft_data as any)?.clientName || ""}
            onConfirm={(name, client) => duplicateTrip(name, client, dupModal.trip!)}
          />
        )}
      </div>
    </AppLayout>
  );
}
