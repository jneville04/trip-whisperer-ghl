import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";

export type TrialState =
  | "active_subscription" // paid user or admin
  | "trial_no_banner"     // days 1-7
  | "trial_soft_banner"   // days 8-13
  | "trial_last_day"      // day 14
  | "trial_expired";      // past day 14

interface TrialStatus {
  state: TrialState;
  daysRemaining: number;
  trialEndsAt: Date | null;
  subscriptionStatus: string;
}

export function useTrialStatus(userId: string | undefined) {
  const { data: isAdmin } = useAdminCheck(userId);

  const query = useQuery({
    queryKey: ["trial-status", userId],
    queryFn: async (): Promise<TrialStatus> => {
      if (!userId) {
        return { state: "trial_no_banner", daysRemaining: 14, trialEndsAt: null, subscriptionStatus: "trialing" };
      }

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at, created_at")
        .eq("id", userId)
        .single();

      const profile = data as any;
      const subscriptionStatus = profile?.subscription_status || "trialing";

      if (subscriptionStatus === "active") {
        return { state: "active_subscription", daysRemaining: 0, trialEndsAt: null, subscriptionStatus };
      }

      const trialEnd = profile?.trial_ends_at
        ? new Date(profile.trial_ends_at)
        : profile?.created_at
          ? new Date(new Date(profile.created_at).getTime() + 14 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const now = new Date();
      const msRemaining = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

      let state: TrialState;
      if (daysRemaining <= 0) {
        state = "trial_expired";
      } else if (daysRemaining === 1) {
        state = "trial_last_day";
      } else if (daysRemaining <= 7) {
        state = "trial_soft_banner";
      } else {
        state = "trial_no_banner";
      }

      return { state, daysRemaining, trialEndsAt: trialEnd, subscriptionStatus };
    },
    enabled: !!userId,
  });

  // Admin override — always active
  if (isAdmin) {
    return {
      ...query,
      data: {
        state: "active_subscription" as TrialState,
        daysRemaining: 0,
        trialEndsAt: null,
        subscriptionStatus: "active",
      },
    };
  }

  return query;
}
