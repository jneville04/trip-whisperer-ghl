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
import { MapPin, FileText } from "lucide-react";
import { type ProposalData } from "@/types/proposal";
import { format } from "date-fns";

interface ProposalRow {
  id: string;
  title: string;
  client_name: string;
  destination: string;
  status: string;
  share_id: string;
  data: ProposalData;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading, profileStatus } = useAuth();
  const { data: isAdmin } = useAdminCheck(user?.id);
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileStatus === "approved" || isAdmin) {
      loadProposals();
    }
  }, [profileStatus, isAdmin]);

  const loadProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading proposals", description: error.message, variant: "destructive" });
    } else {
      setProposals((data as any[]) || []);
    }
    setLoading(false);
  };

  const duplicateProposal = async (proposal: ProposalRow) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { error } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        title: `${proposal.title} (Copy)`,
        client_name: proposal.client_name,
        destination: proposal.destination,
        data: proposal.data as any,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposal duplicated" });
      loadProposals();
    }
  };

  const deleteProposal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposal deleted" });
      setProposals((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const copyShareLink = (shareId: string) => {
    const url = `${window.location.origin}/view/${shareId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this link with your client." });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
        ) : proposals.length === 0 ? (
          /* Welcome empty state */
          <div className="text-center py-20">
            <MapPin className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Welcome to {settings.app_name}
            </h2>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-1">
              Create and manage trip proposals for your clients.
            </p>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-8">
              Start by creating your first trip proposal or group itinerary.
            </p>
            <CreateTripMenu />
          </div>
        ) : (
          /* Dashboard with trip cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {proposals.map((proposal) => (
              <TripCard
                key={proposal.id}
                proposal={proposal}
                onOpen={() => navigate(`/editor/${proposal.id}`)}
                onDuplicate={() => duplicateProposal(proposal)}
                onDelete={() => deleteProposal(proposal.id)}
                onCopyLink={() => copyShareLink(proposal.share_id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
