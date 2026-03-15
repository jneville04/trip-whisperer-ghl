import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAppSettings } from "@/hooks/useAppSettings";
import PendingApproval from "@/components/PendingApproval";
import CreateTripMenu from "@/components/CreateTripMenu";
import ProposalFilters, { type FilterType, type SortType } from "@/components/ProposalFilters";
import { Search, Copy, Trash2, ExternalLink, LogOut, MapPin, Calendar, FileText, Shield, Play, Settings, Eye } from "lucide-react";
import { type ProposalData } from "@/types/proposal";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");

  useEffect(() => {
    if (profileStatus === "approved" || isAdmin) {
      loadProposals();
    }
  }, [profileStatus, isAdmin]);

  // Filter + search + sort
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

  // Early return for pending/rejected — after all hooks
  if (!authLoading && profileStatus && profileStatus !== "approved" && !isAdmin) {
    return <PendingApproval status={profileStatus as "pending" | "rejected"} />;
  }

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-muted/80 backdrop-blur-sm", text: "text-muted-foreground", label: "Draft" },
    published: { bg: "bg-primary/90 backdrop-blur-sm", text: "text-primary-foreground", label: "Published" },
    sent: { bg: "bg-primary/90 backdrop-blur-sm", text: "text-primary-foreground", label: "Published" },
    unpublished: { bg: "bg-secondary/90 backdrop-blur-sm", text: "text-secondary-foreground", label: "Unpublished" },
    approved: { bg: "bg-primary/90 backdrop-blur-sm", text: "text-primary-foreground", label: "Published" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">{settings.app_name}</h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="travel-ghost" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4 mr-1" /> Admin
              </Button>
            )}
            <CreateTripMenu />
            <Button variant="travel-ghost" size="sm" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
            <Button variant="travel-ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Search + Filters */}
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
            <p className="text-muted-foreground font-body mb-6">
              {search || filter !== "all" ? "Try a different search or filter" : "Click \"Create Trip\" above to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((proposal) => {
              const heroImg = proposal.data?.heroImageUrl || (proposal.data?.heroImageUrls?.length ? proposal.data.heroImageUrls[0] : "");
              const proposalType = (proposal.data as any)?.proposalType || "group_booking";
              return (
                <div
                  key={proposal.id}
                  className="group bg-card border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/editor/${proposal.id}`)}
                >
                  <div className="h-36 relative overflow-hidden">
                    {(() => {
                      const videoUrl = (proposal.data as any)?.heroVideoUrl;
                      const videoThumb = (proposal.data as any)?.heroVideoThumbnailUrl;
                      const heroMediaType = (proposal.data as any)?.heroMediaType;
                      const isVideo = heroMediaType === "video" && videoUrl;

                      if (isVideo && videoThumb) {
                        return (
                          <div className="w-full h-full relative">
                            <img src={videoThumb} alt={proposal.destination || "Proposal"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center">
                                <Play className="h-4 w-4 text-background ml-0.5" />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (isVideo && !videoThumb) {
                        const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                        const autoThumb = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null;
                        return (
                          <div className="w-full h-full relative">
                            {autoThumb ? (
                              <img src={autoThumb} alt={proposal.destination || "Proposal"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center">
                                <Play className="h-4 w-4 text-background ml-0.5" />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (heroImg) {
                        return <img src={heroImg} alt={proposal.destination || "Proposal"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
                      }
                      return (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-primary/30" />
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${proposalType === "proposal" ? "bg-purple-600/90 text-white" : "bg-emerald-600/90 text-white"} backdrop-blur-sm`}>
                        {proposalType === "proposal" ? "Proposal" : "Group"}
                      </span>
                      {(() => {
                        const sc = statusConfig[proposal.status] || statusConfig.draft;
                        return (
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        );
                      })()}
                    </div>
                    <h3 className="absolute bottom-3 left-4 right-4 font-display text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
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

                    <div className="flex items-center gap-1 pt-2 border-t border-border/30">
                      <Button
                        variant="travel-ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={(e) => { e.stopPropagation(); navigate(`/editor/${proposal.id}`); }}
                      >
                        Open
                      </Button>
                      <Button
                        variant="travel-ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={(e) => { e.stopPropagation(); window.open(`/view/${proposal.share_id}`, "_blank"); }}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Preview
                      </Button>
                      <Button
                        variant="travel-ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={(e) => { e.stopPropagation(); copyShareLink(proposal.share_id); }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> Share
                      </Button>
                      <Button
                        variant="travel-ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={(e) => { e.stopPropagation(); duplicateProposal(proposal); }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Duplicate
                      </Button>
                      <Button
                        variant="travel-ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteProposal(proposal.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
