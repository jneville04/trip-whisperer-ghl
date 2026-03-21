import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAppSettings } from "@/hooks/useAppSettings";
import AppLayout from "@/components/AppLayout";
import TripCard from "@/components/TripCard";
import CreateTripMenu from "@/components/CreateTripMenu";
import { MapPin } from "lucide-react";
import { type ProposalData, type TripRow } from "@/types/proposal";
import DuplicateTripModal from "@/components/DuplicateTripModal";

export default function Dashboard() {
  const { user, loading: authLoading, profileStatus } = useAuth();
  const { data: isAdmin } = useAdminCheck(user?.id);
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [dupModal, setDupModal] = useState<{ open: boolean; trip: TripRow | null }>({ open: false, trip: null });

  useEffect(() => {
    if (profileStatus === "approved" || isAdmin) {
      loadTrips();
    }
  }, [profileStatus, isAdmin]);

  useEffect(() => {
    if (!user) return;
    const metaName = user.user_metadata?.full_name;
    if (metaName) {
      setFirstName(metaName.split(" ")[0]);
    } else {
      supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data }) => {
        const name = (data as any)?.full_name;
        if (name) setFirstName(name.split(" ")[0]);
      });
    }
  }, [user]);

  const loadTrips = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .is("archived_at", null)
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

  const deleteTrip = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip deleted" });
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
      setTrips((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const [reopening, setReopening] = useState<string | null>(null);

  const reopenTrip = async (id: string) => {
    if (reopening) return;
    setReopening(id);
    const { error } = await supabase.from("trips").update({ status: "reopened" }).eq("id", id);
    setReopening(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposal reopened for editing" });
      setTrips((prev) => prev.map((t) => t.id === id ? { ...t, status: "reopened" } : t));
    }
  };

  const copyShareLink = (slug: string | null) => {
    if (!slug) return;
    const url = `${window.location.origin}/view/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this link with your client." });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h2>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-8">
              Create a proposal or group trip page and start building your next trip.
            </p>
            <CreateTripMenu />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onOpen={() => navigate(`/editor/${trip.id}`)}
                onDuplicate={() => setDupModal({ open: true, trip })}
                onDelete={() => deleteTrip(trip.id)}
                onCopyLink={() => copyShareLink(trip.public_slug)}
                onArchive={() => archiveTrip(trip.id)}
                onReopen={() => reopenTrip(trip.id)}
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
