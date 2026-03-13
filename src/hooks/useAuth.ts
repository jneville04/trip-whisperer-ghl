import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth(requireAuth = true) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .single();
      setProfileStatus((data as any)?.status ?? null);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchStatus(session.user.id);
      } else {
        setProfileStatus(null);
        if (requireAuth) navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchStatus(session.user.id);
      } else if (requireAuth) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requireAuth]);

  return { user, loading, profileStatus };
}
