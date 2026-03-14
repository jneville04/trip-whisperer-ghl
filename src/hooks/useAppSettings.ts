import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildBrandCssVars } from "@/lib/brand";

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
  ghl_form_approve: string;
  ghl_form_revision: string;
  admin_photo_url: string | null;
  login_hero_url: string;
  login_hero_position: string;
  login_button_color: string;
  helpdesk_email: string;
  helpdesk_phone: string;
  helpdesk_message: string;
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
  ghl_webhook_approve: "",
  ghl_webhook_revision: "",
  ghl_form_approve: "",
  ghl_form_revision: "",
  admin_photo_url: null,
  login_hero_url: "",
  login_hero_position: "none",
  login_button_color: "",
  helpdesk_email: "",
  helpdesk_phone: "",
  helpdesk_message: "",
};

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

  const cssVars = buildBrandCssVars({
    primaryColor: s.primary_color,
    secondaryColor: s.secondary_color,
    accentColor: s.accent_color,
  });

  return { settings: s, cssVars };
}
