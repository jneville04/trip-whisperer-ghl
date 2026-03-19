import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ExternalLink, MapPin, Calendar, Eye, Clock } from "lucide-react";
import { type ProposalData } from "@/types/proposal";
import { format } from "date-fns";

/** Captures a frame from a direct video URL or fetches Vimeo thumbnail */
function VideoFrameThumb({ videoUrl, vimeoId, alt }: { videoUrl: string; vimeoId?: string; alt: string }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (vimeoId) {
      fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`)
        .then((r) => r.json())
        .then((d) => { if (d.thumbnail_url) setThumb(d.thumbnail_url); })
        .catch(() => {});
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    video.src = videoUrl;

    const capture = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumb(canvas.toDataURL("image/jpeg", 0.8));
        }
      } catch {
        // CORS error — leave as null
      }
      video.remove();
    };

    video.addEventListener("loadeddata", () => { video.currentTime = 0.5; });
    video.addEventListener("seeked", capture);
    video.addEventListener("error", () => video.remove());
    video.load();
  }, [videoUrl, vimeoId]);

  if (thumb) {
    return <img src={thumb} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
  }
  return <div className="w-full h-full bg-muted animate-pulse" />;
}

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

          if (isVideo) {
            const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const vimeoMatch = !ytMatch && videoUrl.match(/vimeo\.com\/(\d+)/);
            const autoThumb = videoThumb
              || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null)
              || (vimeoMatch ? `vimeo:${vimeoMatch[1]}` : null);

            if (autoThumb && !autoThumb.startsWith("vimeo:")) {
              return <img src={autoThumb} alt={proposal.destination || "Proposal"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
            }
            // Vimeo or direct video — use VideoFrameThumb
            return <VideoFrameThumb videoUrl={videoUrl} vimeoId={vimeoMatch ? vimeoMatch[1] : undefined} alt={proposal.destination || "Proposal"} />;
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
        {/* Type + Status Badges */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/15 text-secondary-foreground">
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
