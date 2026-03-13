import { useRef, useState } from "react";
import { ImagePlus, Link, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  /** Show a small preview thumbnail */
  showPreview?: boolean;
  className?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  label,
  placeholder = "Paste image URL or upload",
  showPreview = true,
  className = "",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      onChange(trimmed);
      setUrlInput("");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {value ? (
        <div className="relative group">
          {showPreview && (
            <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border/40 bg-muted/20">
              <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" /> Replace
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs shadow-lg"
                    onClick={() => onChange("")}
                  >
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          )}
          {!showPreview && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate flex-1">{value.startsWith("data:") ? "Uploaded image" : value}</span>
              <Button variant="travel-ghost" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" /> Replace
              </Button>
              <button onClick={() => onChange("")} className="text-muted-foreground hover:text-destructive p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Toggle between upload and URL */}
          <div className="flex gap-1 bg-muted/40 p-0.5 rounded-md w-fit">
            <button
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                mode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="h-3 w-3" /> Upload
            </button>
            <button
              onClick={() => setMode("url")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                mode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link className="h-3 w-3" /> URL
            </button>
          </div>

          {mode === "upload" ? (
            <label className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-lg border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Click to upload from computer</span>
              <span className="text-[10px] text-muted-foreground/60">JPG, PNG, WebP</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="flex gap-1.5">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={placeholder}
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button variant="travel" size="sm" className="h-8 text-xs" onClick={handleUrlSubmit}>
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
