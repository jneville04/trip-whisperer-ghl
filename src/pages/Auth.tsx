import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Plane, Mail, Lock, User, Building2 } from "lucide-react";

function RequiredAsterisk() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    agencyName: "",
  });

  const validateSignupFields = () => {
    const errors: Record<string, string> = {};
    if (!isLogin) {
      if (!form.fullName.trim()) errors.fullName = "Full name is required";
      if (!form.agencyName.trim()) errors.agencyName = "Agency name is required";
    }
    if (!form.email.trim()) errors.email = "Email is required";
    if (!form.password || form.password.length < 6) errors.password = "Password must be at least 6 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupFields()) return;
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
            navigate("/pending");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.fullName,
              agency_name: form.agencyName,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (
          signUpData.user &&
          signUpData.user.identities &&
          signUpData.user.identities.length === 0
        ) {
          toast({
            title: "Account already exists",
            description:
              "An account with this email already exists. Please sign in instead, or use the password recovery option.",
          });
          setLoading(false);
          return;
        }

        // Update agency_name on the profile
        if (signUpData.user && form.agencyName.trim()) {
          await supabase
            .from("profiles")
            .update({ agency_name: form.agencyName.trim() })
            .eq("id", signUpData.user.id);
        }

        // Notify admin in background
        try {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/notify-admin-signup`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": anonKey,
              },
              body: JSON.stringify({
                agentName: form.fullName,
                agentEmail: form.email,
              }),
            }
          );
        } catch {
          // Non-blocking
        }

        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });

        // Redirect to pending page after short delay so toast is visible
        setTimeout(() => {
          navigate("/pending");
        }, 1500);
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

  const inputClass = (field: string) =>
    `pl-10 ${fieldErrors[field] ? "border-destructive ring-destructive" : ""}`;

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
                Full Name <RequiredAsterisk />
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.fullName}
                  onChange={(e) => {
                    setForm({ ...form, fullName: e.target.value });
                    if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: "" }));
                  }}
                  placeholder="Jane Smith"
                  className={inputClass("fullName")}
                  required
                />
              </div>
              {fieldErrors.fullName && <p className="text-xs text-destructive mt-1">{fieldErrors.fullName}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
                Agency Name <RequiredAsterisk />
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.agencyName}
                  onChange={(e) => {
                    setForm({ ...form, agencyName: e.target.value });
                    if (fieldErrors.agencyName) setFieldErrors(prev => ({ ...prev, agencyName: "" }));
                  }}
                  placeholder="Your Travel Agency"
                  className={inputClass("agencyName")}
                  required
                />
              </div>
              {fieldErrors.agencyName && <p className="text-xs text-destructive mt-1">{fieldErrors.agencyName}</p>}
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
            Email Address {!isLogin && <RequiredAsterisk />}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
              }}
              placeholder="you@agency.com"
              className={inputClass("email")}
              required
            />
          </div>
          {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
            Password {!isLogin && <RequiredAsterisk />}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
              }}
              placeholder="••••••••"
              className={inputClass("password")}
              required
              minLength={6}
            />
          </div>
          {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
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
          onClick={() => { setIsLogin(!isLogin); setFieldErrors({}); }}
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" style={brandVars}>
      {formContent}
    </div>
  );
}
