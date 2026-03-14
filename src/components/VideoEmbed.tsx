import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

function getEmbedInfo(url: string): { type: "youtube" | "vimeo" | "unknown"; embedUrl: string; thumbnailUrl?: string } | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  return null;
}

export default function VideoEmbed({ url, title, className = "" }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const info = getEmbedInfo(url);
  if (!info) return null;

  // Lazy load with IntersectionObserver
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative aspect-video rounded-xl overflow-hidden bg-muted ${className}`}>
      {!visible ? (
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : !playing ? (
        <button onClick={() => setPlaying(true)} className="w-full h-full relative group cursor-pointer">
          {info.thumbnailUrl ? (
            <img src={info.thumbnailUrl} alt={title || "Video"} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-sm text-muted-foreground font-body">{info.type === "vimeo" ? "Vimeo Video" : "Video"}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            </div>
          </div>
        </button>
      ) : (
        <iframe
          src={info.embedUrl}
          title={title || "Video"}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  );
}

export { getEmbedInfo };
