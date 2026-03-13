import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  app_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_display: string;
  font_body: string;
  login_message: string | null;
  ghl_webhook_approve: string;
  ghl_webhook_revision: string;
}

const defaults: AppSettings = {
  app_name: "Proposal Builder",
  tagline: "Create beautiful travel proposals",
  logo_url: null,
  favicon_url: null,
  primary_color: "#0c7d69",
  secondary_color: "#e07a2f",
  accent_color: "#d4a853",
  font_display: "Playfair Display",
  font_body: "Inter",
  login_message: null,
};

function hexToHsl(hex: string): string | null {
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
}

export function useAppSettings() {
  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error || !data) return defaults;
      return data as unknown as AppSettings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const s = settings || defaults;

  const cssVars: Record<string, string> = {};
  const primaryHsl = hexToHsl(s.primary_color);
  const secondaryHsl = hexToHsl(s.secondary_color);
  const accentHsl = hexToHsl(s.accent_color);
  if (primaryHsl) cssVars["--primary"] = primaryHsl;
  if (secondaryHsl) cssVars["--secondary"] = secondaryHsl;
  if (accentHsl) cssVars["--accent"] = accentHsl;

  return { settings: s, cssVars };
}
