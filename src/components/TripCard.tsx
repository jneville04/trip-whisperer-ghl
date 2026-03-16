import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ExternalLink, MapPin, Calendar, Play, Eye, Clock } from "lucide-react";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  published: { label: "Published", className: "bg-primary/10 text-primary" },
  sent: { label: "Published", className: "bg-primary/10 text-primary" },
  unpublished: { label: "Unpublished", className: "bg-muted text-muted-foreground" },
  approved: { label: "Published", className: "bg-primary/10 text-primary" },
};

interface TripCardProps {
  proposal: ProposalRow;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}

export default function TripCard({ proposal, onOpen, onDuplicate, onDelete, onCopyLink }: TripCardProps) {
  const navigate = useNavigate();
  const heroImg = proposal.data?.heroImageUrl || (proposal.data?.heroImageUrls?.length ? proposal.data.heroImageUrls[0] : "");
  const proposalType = (proposal.data as any)?.proposalType || "group_booking";
  const sc = statusConfig[proposal.status] || statusConfig.draft;

  const formatUpdatedAt = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return "";
    }
  };

  return (
    <div
      className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      {/* Image */}
      <div className="h-40 relative overflow-hidden flex-shrink-0">
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
                  <div className="w-full h-full bg-muted" />
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
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground/30" />
            </div>
          );
        })()}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${proposalType === "proposal" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>
            {proposalType === "proposal" ? "Proposal" : "Group Trip"}
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${sc.className}`}>
            {sc.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-semibold text-foreground leading-snug line-clamp-2">
          {proposal.title || "Untitled"}
        </h3>

        {/* Meta */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground font-body leading-relaxed">
          {proposal.destination && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 flex-shrink-0" /> {proposal.destination}
            </span>
          )}
          {proposal.client_name && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 flex-shrink-0" /> {proposal.client_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 flex-shrink-0" /> Updated {formatUpdatedAt(proposal.updated_at)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1 pt-3 border-t border-border mt-1">
          <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 font-medium" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            Open
          </Button>
          <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 font-medium" onClick={(e) => { e.stopPropagation(); window.open(`/view/${proposal.share_id}`, "_blank"); }}>
            <Eye className="h-3 w-3 mr-1" /> Preview
          </Button>
          <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 font-medium" onClick={(e) => { e.stopPropagation(); onCopyLink(); }}>
            <ExternalLink className="h-3 w-3 mr-1" /> Share
          </Button>
          <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 font-medium" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            <Copy className="h-3 w-3 mr-1" /> Copy
          </Button>
          <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
