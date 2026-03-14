import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Plane, Mail, Lock, User, Building2 } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    agencyName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;

        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("status")
            .eq("id", authData.user.id)
            .single();
          const status = (profile as any)?.status;
          if (status === "pending" || status === "rejected") {
            navigate("/dashboard");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.fullName,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { cssVars } = useAppSettings();
  const heroUrl = settings.login_hero_url || "";
  const heroPosition = settings.login_hero_position || "none";
  const buttonColor = settings.login_button_color || "";
  const hasHero = heroUrl && heroPosition !== "none";

  const brandVars: React.CSSProperties = cssVars as React.CSSProperties;

  const buttonStyle: React.CSSProperties = buttonColor
    ? { backgroundColor: buttonColor, borderColor: buttonColor }
    : {};

  const formContent = (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        {settings.logo_url ? (
          <img src={settings.logo_url} alt={settings.app_name} className="h-16 w-auto object-contain mx-auto mb-4" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plane className="h-8 w-8 text-primary" />
          </div>
        )}
        {(settings as any).admin_photo_url && (
          <img src={(settings as any).admin_photo_url} alt="Admin" className="h-20 w-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary/20" />
        )}
        <h1 className="font-display text-3xl font-bold text-foreground">
          {settings.app_name}
        </h1>
        <p className="text-muted-foreground font-body mt-2">
          {isLogin
            ? settings.login_message || settings.tagline
            : "Create your account to start building proposals"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Jane Smith"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
                Agency Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.agencyName}
                  onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                  placeholder="Your Travel Agency"
                  className="pl-10"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@agency.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="pl-10"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="travel"
          size="lg"
          className="w-full text-base py-6 h-auto"
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground font-body mt-6">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary font-medium hover:underline"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );

  if (hasHero && heroPosition === "top") {
    return (
      <div className="min-h-screen bg-background flex flex-col" style={brandVars}>
        <div className="h-56 sm:h-72 overflow-hidden relative">
          <img src={heroUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 -mt-10">
          {formContent}
        </div>
      </div>
    );
  }

  if (hasHero && (heroPosition === "left" || heroPosition === "right")) {
    return (
      <div className={`min-h-screen bg-background flex ${heroPosition === "right" ? "flex-row" : "flex-row-reverse"}`} style={brandVars}>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          {formContent}
        </div>
        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <img src={heroUrl} alt="" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-${heroPosition === "left" ? "l" : "r"} from-background/40 to-transparent`} />
        </div>
      </div>
    );
  }

  // Default: no hero
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" style={defaultVars}>
      {formContent}
    </div>
  );
}
