import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}

function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|m4a|ogg|aac)(\?|$)/i.test(url);
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

  const isDirect = isDirectVideoUrl(url);
  const isAudio = isAudioUrl(url);
  const info = !isDirect && !isAudio ? getEmbedInfo(url) : null;

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

  // Direct video file
  if (isDirect) {
    return (
      <div ref={ref} className={`relative aspect-video rounded-xl overflow-hidden bg-muted ${className}`}>
        {visible ? (
          <video
            src={url}
            controls
            className="w-full h-full object-contain bg-black"
            preload="metadata"
            title={title || "Video"}
          />
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </div>
    );
  }

  // Audio file
  if (isAudio) {
    return (
      <div ref={ref} className={`rounded-xl overflow-hidden bg-muted p-4 ${className}`}>
        {visible ? (
          <audio src={url} controls className="w-full" preload="metadata" title={title || "Audio"} />
        ) : (
          <div className="w-full h-10 bg-muted animate-pulse rounded" />
        )}
      </div>
    );
  }

  // YouTube / Vimeo embed
  if (!info) return null;

  return (
    <div ref={ref} className={`relative aspect-video rounded-xl overflow-hidden bg-muted ${className}`}>
      {!visible ? (
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : (
        <iframe
          src={`${info.embedUrl.replace('autoplay=1', 'autoplay=0')}`}
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
