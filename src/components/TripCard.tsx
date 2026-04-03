import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Trash2, ExternalLink, MapPin, Calendar, Eye, Clock, MoreVertical, Pencil, RotateCcw, ArchiveRestore } from "lucide-react";
import { type TripSummaryRow } from "@/types/proposal";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-amber-100 text-amber-800" },
  published: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
  sent: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
  unpublished: { label: "Unpublished", className: "bg-slate-200 text-slate-700" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  revision_requested: { label: "Revision Requested", className: "bg-orange-100 text-orange-800" },
  reopened: { label: "Reopened", className: "bg-violet-100 text-violet-800" },
};

interface TripCardProps {
  trip: TripSummaryRow;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onReopen?: () => void;
  isArchived?: boolean;
  isTrashed?: boolean;
  onRestoreFromTrash?: () => void;
  onPermanentDelete?: () => void;
}

export default function TripCard({ trip, onOpen, onDuplicate, onDelete, onCopyLink, onArchive, onRestore, onReopen, isArchived, isTrashed, onRestoreFromTrash, onPermanentDelete }: TripCardProps) {
  const navigate = useNavigate();
  const heroImg = trip.hero_image_url || (trip.hero_image_urls?.length ? trip.hero_image_urls[0] : "");
  const tripType = trip.trip_type || "individual";
  const title = trip.trip_name || "Untitled";
  const clientName = trip.client_name || "";
  const destination = trip.destination || "";
  const sc = statusConfig[trip.status || "draft"] || statusConfig.draft;
  const isApproved = trip.status === "approved";
  const isDraft = trip.status === "draft";

  const formatCreatedAt = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return "";
    }
  };

  return (
    <div
      className="group bg-card border border-border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      {/* Image */}
      <div className="h-40 relative overflow-hidden flex-shrink-0">
        {(() => {
          const videoUrl = trip.hero_video_url;
          const videoThumb = trip.hero_video_thumbnail_url;
          const heroMediaType = trip.hero_media_type;
          const isVideo = heroMediaType === "video" && videoUrl;

          if (isVideo) {
            const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const vimeoMatch = !ytMatch && videoUrl.match(/vimeo\.com\/(\d+)/);
            const autoThumb = videoThumb
              || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null)
              || (vimeoMatch ? `vimeo:${vimeoMatch[1]}` : null);

            if (autoThumb && !autoThumb.startsWith("vimeo:")) {
              return <img src={autoThumb} alt={destination || "Trip"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
            }
            return <VideoFrameThumb videoUrl={videoUrl} vimeoId={vimeoMatch ? vimeoMatch[1] : undefined} alt={destination || "Trip"} />;
          }
          if (heroImg) {
            return <img src={heroImg} alt={destination || "Trip"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
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
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${tripType === "individual" || trip.proposal_type === "proposal" ? "bg-primary" : "bg-travel-ocean"}`}>
            {tripType === "group" || trip.proposal_type === "group_booking" ? "Group Trip" : "Proposal"}
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${sc.className}`}>
            {sc.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-semibold text-foreground leading-snug line-clamp-2">
          {clientName ? `${title} — ${clientName}` : title}
        </h3>

        {/* Meta */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground font-body leading-relaxed">
          {destination && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 flex-shrink-0" /> {destination}
            </span>
          )}
          {clientName && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 flex-shrink-0" /> {clientName}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 flex-shrink-0" /> Created {formatCreatedAt(trip.created_at)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
          <div className="flex items-center gap-1">
            {isTrashed ? (
              <>
                {onRestoreFromTrash && (
                  <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 font-medium" onClick={(e) => { e.stopPropagation(); onRestoreFromTrash(); }}>
                    <ArchiveRestore className="h-3 w-3 mr-1" /> Restore
                  </Button>
                )}
                {onPermanentDelete && (
                  <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 font-medium text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onPermanentDelete(); }}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete Forever
                  </Button>
                )}
              </>
            ) : (
              <Button variant="travel-ghost" size="sm" className="h-7 text-xs px-2 font-medium" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                {isApproved ? (
                  <><Eye className="h-3 w-3 mr-1" /> View Booking</>
                ) : (
                  <><Pencil className="h-3 w-3 mr-1" /> Edit Trip</>
                )}
              </Button>
            )}
          </div>
          {!isTrashed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="travel-ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  const fromSource = window.location.pathname === "/" ? "dashboard" : "trips";
                  navigate(`/view/${trip.public_slug}?preview=agent&from=${fromSource}`);
                }}>
                  <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                </DropdownMenuItem>
                {!isDraft && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink(); }}>
                    <ExternalLink className="h-3.5 w-3.5 mr-2" /> Share
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                </DropdownMenuItem>
                {isApproved && onReopen && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReopen(); }}>
                    <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reopen for Editing
                  </DropdownMenuItem>
                )}
                {isArchived && onRestore ? (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRestore(); }}>
                    <MapPin className="h-3.5 w-3.5 mr-2" /> Restore
                  </DropdownMenuItem>
                ) : onArchive ? (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                    <Clock className="h-3.5 w-3.5 mr-2" /> Archive
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
