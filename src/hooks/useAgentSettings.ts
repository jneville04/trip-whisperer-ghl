import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AgentSettings {
  id: string;
  user_id: string;
  // Brand
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  show_agency_name_with_logo: boolean;
  // Agent Info
  agent_name: string;
  agent_title: string;
  agent_phone: string;
  agent_email: string;
  agent_website: string;
  agency_name: string;
  agent_photo_url: string;
  agency_logo_url: string;
  // Booking
  default_booking_behavior: "stripe" | "payment_link" | "booking_form";
  default_payment_link: string;
  default_booking_form_url: string;
  default_checkout_url: string;
  // Integrations
  ghl_connected: boolean;
  ghl_location_id: string;
  ghl_access_token: string;
  ghl_webhook_url: string;
  stripe_connected: boolean;
  stripe_account_id: string;
}

const defaults: Omit<AgentSettings, "id" | "user_id"> = {
  primary_color: "",
  secondary_color: "",
  accent_color: "",
  logo_url: "",
  show_agency_name_with_logo: true,
  agent_name: "",
  agent_title: "",
  agent_phone: "",
  agent_email: "",
  agent_website: "",
  agency_name: "",
  agent_photo_url: "",
  agency_logo_url: "",
  default_booking_behavior: "stripe",
  default_payment_link: "",
  default_booking_form_url: "",
  default_checkout_url: "",
  ghl_connected: false,
  ghl_location_id: "",
  ghl_access_token: "",
  ghl_webhook_url: "",
  stripe_connected: false,
  stripe_account_id: "",
};

export function useAgentSettings() {
  const { user } = useAuth(false);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agent-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("agent_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { ...defaults, id: "", user_id: user.id } as AgentSettings;
      return data as unknown as AgentSettings;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<Omit<AgentSettings, "id" | "user_id">>) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("agent_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("agent_settings")
          .update({ ...updates, updated_at: new Date().toISOString() } as any)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agent_settings")
          .insert({ user_id: user.id, ...updates } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-settings", user?.id] });
    },
  });

  return {
    settings: query.data || ({ ...defaults, id: "", user_id: user?.id || "" } as AgentSettings),
    isLoading: query.isLoading,
    saveSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
