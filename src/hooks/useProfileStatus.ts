import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfileStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-status", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .single();
      return (data as any)?.status as string | null;
    },
    enabled: !!userId,
  });
}
