import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
  /** Custom thumbnail image URL — overrides default/auto thumbnail */
  thumbnailUrl?: string;
  /** If true, video autoplays on load */
  autoplay?: boolean;
  /** If true, video is muted */
  muted?: boolean;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}

function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|m4a|ogg|aac)(\?|$)/i.test(url);
}

function getEmbedInfo(url: string, autoplay = false, muted = false): { type: "youtube" | "vimeo" | "unknown"; embedUrl: string; autoThumbnailUrl?: string } | null {
  if (!url) return null;

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const params = [`rel=0`];
    if (autoplay) params.push('autoplay=1');
    if (muted) params.push('mute=1');
    if (autoplay) params.push('loop=1');
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?${params.join('&')}`,
      autoThumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const params = [];
    if (autoplay) params.push('autoplay=1');
    if (muted) params.push('muted=1');
    if (autoplay) params.push('loop=1');
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}${params.length ? '?' + params.join('&') : ''}`,
    };
  }

  return null;
}

export default function VideoEmbed({ url, title, className = "", thumbnailUrl, autoplay = false, muted = false }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(autoplay);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isDirect = isDirectVideoUrl(url);
  const isAudio = isAudioUrl(url);
  const info = !isDirect && !isAudio ? getEmbedInfo(url, autoplay) : null;

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

  // Audio file — no thumbnail needed
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

  // Determine the thumbnail to show
  const thumb = thumbnailUrl || (info?.autoThumbnailUrl);

  // If custom thumbnail is set, always use click-to-play pattern
  if (thumbnailUrl || isDirect) {
    return (
      <div ref={ref} className={`relative aspect-video rounded-xl overflow-hidden bg-muted ${className}`}>
        {!visible ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : !playing ? (
          <button onClick={() => setPlaying(true)} className="w-full h-full relative group cursor-pointer">
            {thumb ? (
              <img src={thumb} alt={title || "Video"} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-black/80 flex items-center justify-center">
                <span className="text-sm text-white/60 font-body">Video</span>
              </div>
            )}
            <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/25 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 text-primary-foreground ml-1" />
              </div>
            </div>
          </button>
        ) : isDirect ? (
          <video
            src={url}
            controls
            autoPlay
            muted={autoplay}
            loop={autoplay}
            className="w-full h-full object-contain bg-black"
            title={title || "Video"}
          />
        ) : info ? (
          <iframe
            src={info.embedUrl}
            title={title || "Video"}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : null}
      </div>
    );
  }

  // YouTube/Vimeo without custom thumbnail — show native embed with controls
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
