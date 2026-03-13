import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Copy, Trash2, ExternalLink, LogOut, MapPin, Calendar, FileText } from "lucide-react";
import { defaultProposal, type ProposalData } from "@/types/proposal";

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
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProposals();
  }, []);

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

  const createProposal = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        title: "New Proposal",
        client_name: defaultProposal.clientName,
        destination: defaultProposal.destination,
        data: defaultProposal as any,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      navigate(`/editor/${(data as any).id}`);
    }
  };

  const duplicateProposal = async (proposal: ProposalRow) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await supabase
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filtered = proposals.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name.toLowerCase().includes(search.toLowerCase()) ||
      p.destination.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-secondary/10 text-secondary",
    approved: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">My Proposals</h1>
          <div className="flex items-center gap-3">
            <Button variant="travel" size="sm" onClick={createProposal}>
              <Plus className="h-4 w-4 mr-1" /> New Proposal
            </Button>
            <Button variant="travel-ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, destination, or title..."
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {search ? "No proposals found" : "No proposals yet"}
            </h3>
            <p className="text-muted-foreground font-body mb-6">
              {search ? "Try a different search term" : "Create your first travel proposal to get started."}
            </p>
            {!search && (
              <Button variant="travel" onClick={createProposal}>
                <Plus className="h-4 w-4 mr-1" /> Create First Proposal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((proposal) => (
              <div
                key={proposal.id}
                className="group bg-card border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/editor/${proposal.id}`)}
              >
                {/* Card header with destination image or gradient */}
                <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative flex items-end p-4">
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full ${statusColors[proposal.status] || statusColors.draft}`}>
                      {proposal.status}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground leading-tight line-clamp-2">
                    {proposal.title || "Untitled"}
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                    {proposal.destination && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {proposal.destination}
                      </span>
                    )}
                    {proposal.client_name && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {proposal.client_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
                    <Button
                      variant="travel-ghost"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyShareLink(proposal.share_id);
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> Share
                    </Button>
                    <Button
                      variant="travel-ghost"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateProposal(proposal);
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Duplicate
                    </Button>
                    <Button
                      variant="travel-ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProposal(proposal.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
