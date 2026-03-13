import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProposalPreview from "@/components/ProposalPreview";
import { useBrandStyles } from "@/hooks/useBrandStyles";
import type { ProposalData } from "@/types/proposal";

export default function ClientView() {
  const { shareId } = useParams<{ shareId: string }>();
  const [data, setData] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId) return;
    loadProposal();
  }, [shareId]);

  const loadProposal = async () => {
    const { data: row, error: err } = await supabase
      .from("proposals")
      .select("data")
      .eq("share_id", shareId)
      .single();

    if (err || !row) {
      setError("Proposal not found or link has expired.");
    } else {
      setData((row as any).data as ProposalData);
    }
    setLoading(false);
  };

  // Build brand styles from proposal data
  const brandStyles: Record<string, string> = {};
  if (data?.brand) {
    const hexToHsl = (hex: string): string | null => {
      if (!hex || !hex.startsWith("#")) return null;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    if (data.brand.primaryColor) {
      const hsl = hexToHsl(data.brand.primaryColor);
      if (hsl) brandStyles["--primary"] = hsl;
    }
    if (data.brand.secondaryColor) {
      const hsl = hexToHsl(data.brand.secondaryColor);
      if (hsl) brandStyles["--secondary"] = hsl;
    }
    if (data.brand.accentColor) {
      const hsl = hexToHsl(data.brand.accentColor);
      if (hsl) brandStyles["--accent"] = hsl;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">
        Loading proposal...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Proposal Not Found</h1>
          <p className="text-muted-foreground font-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      <ProposalPreview data={data} shareId={shareId} />
    </div>
  );
}
