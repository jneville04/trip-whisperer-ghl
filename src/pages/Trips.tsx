import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import ProposalFilters, { type FilterType, type SortType } from "@/components/ProposalFilters";
import TripCard from "@/components/TripCard";
import AppLayout from "@/components/AppLayout";
import { Search, FileText } from "lucide-react";
import { type ProposalData } from "@/types/proposal";
import DuplicateTripModal from "@/components/DuplicateTripModal";

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

export default function Trips() {
  const { user } = useAuth();
  const { data: isAdmin } = useAdminCheck(user?.id);
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [dupModal, setDupModal] = useState<{ open: boolean; proposal: ProposalRow | null }>({ open: false, proposal: null });

  useEffect(() => {
    loadProposals();
  }, []);

  const filtered = useMemo(() => {
    let result = proposals.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const proposalType = (p.data as any)?.proposalType || "group_booking";
      switch (filter) {
        case "proposals": return proposalType === "proposal";
        case "group_trips": return proposalType === "group_booking";
        case "drafts": return p.status === "draft";
        case "published": return ["published", "sent", "approved"].includes(p.status);
        default: return true;
      }
    });

    result.sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "az": return (a.title || "").localeCompare(b.title || "");
        case "za": return (b.title || "").localeCompare(a.title || "");
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [proposals, search, filter, sort]);

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

  const duplicateProposal = async (tripName: string, clientName: string, proposal: ProposalRow) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { error } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        title: tripName,
        client_name: clientName,
        destination: proposal.destination,
        status: "draft",
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
              {search || filter !== "all" ? "No trips found" : "No trips yet"}
            </h3>
            <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
              {search || filter !== "all" ? "Try a different search or filter" : "Click \"Create Trip\" above to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((proposal) => (
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
