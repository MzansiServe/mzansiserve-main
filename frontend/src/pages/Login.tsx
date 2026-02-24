import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.jpeg";
import { apiFetch } from "@/lib/api";

interface GoogleCredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  const checkRoles = async (emailVal: string) => {
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return;
    try {
      const res = await apiFetch<{ roles: string[] }>(`/api/auth/roles-for-email?email=${encodeURIComponent(emailVal)}`);
      if (res.success && res.data.roles.length > 0) {
        setAvailableRoles(res.data.roles);
        // If current role is not in available roles, auto-select the first one
        if (!res.data.roles.includes(role)) {
          setRole(res.data.roles[0]);
        }
      } else {
        setAvailableRoles([]);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch("/api/auth/google-login", {
        method: "POST",
        data: {
          token: credentialResponse.credential,
          role: role
        }
      });

      if (result.success) {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        if (setUser) setUser(result.data.user);

        toast({ title: "Welcome!", description: "Logged in via Google successfully." });

        // Route based on role
        if (role === 'driver') navigate("/dashboard/driver");
        else if (role === 'professional') navigate("/dashboard/professional");
        else if (role === 'service-provider') navigate("/dashboard/provider");
        else navigate("/");
      } else {
        setError(result.error || "Google login failed");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during Google sign-in";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email"); return; }
    if (!password) { setError("Password is required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);

    try {
      const result = await login(email, password, role);
      if (result.success) {
        toast({ title: "Welcome back!", description: "You've been logged in successfully." });

        // Route based on role
        if (role === 'driver') {
          navigate("/dashboard/driver");
        } else if (role === 'professional') {
          navigate("/dashboard/professional");
        } else if (role === 'service-provider') {
          navigate("/dashboard/provider");
        } else {
          navigate("/");
        }

      } else {
        setError(result.error || "Login failed");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-[480px]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-10 shadow-xl transition-all duration-500 hover:shadow-2xl">
            {/* Header */}
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold text-[#222222] tracking-tighter">Welcome back</h1>
              <p className="mt-2 text-base text-[#717171] font-medium">Continue your Mzansi journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Login as</Label>
                  <select id="role" value={role} onChange={e => setRole(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#222222] focus:border-black transition-all outline-none">
                    <option value="client">Client</option>
                    <option value="driver">Driver</option>
                    <option value="professional">Professional</option>
                    <option value="service-provider">Service Provider</option>
                    <option value="agent">Agent / Affiliate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.co.za"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={(e) => checkRoles(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-slate-200 bg-white font-bold text-[#222222] focus-visible:ring-0 focus-visible:border-black transition-all"
                      autoComplete="email"
                    />
                  </div>
                  {availableRoles.length > 0 && (
                    <p className="text-[10px] text-primary font-bold uppercase tracking-tight mt-1 ml-1">
                      Found: {availableRoles.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</Label>
                    <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-12 h-12 rounded-xl border-slate-200 bg-white font-bold text-[#222222] focus-visible:ring-0 focus-visible:border-black transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#222222]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-bold text-rose-600 animate-in fade-in slide-in-from-top-1">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-14 rounded-xl bg-primary text-base font-bold text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Sign In"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>

            <div className="mt-8 flex items-center gap-4 text-slate-300">
              <div className="h-px flex-1 bg-slate-100"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Social Sign In</span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="mt-8 flex justify-center scale-105">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google sign-in was unsuccessful. Please try again.");
                }}
                useOneTap
                theme="outline"
                shape="pill"
                width="320px"
              />
            </div>

            <div className="mt-10 flex flex-col space-y-6 text-center">
              <p className="text-sm font-medium text-[#717171]">
                Don't have an account?{" "}
                <Link to="/register" className="font-bold text-[#222222] hover:underline underline-offset-4">
                  Create one free
                </Link>
              </p>
              <div className="pt-6 border-t border-slate-50">
                <Link to="/admin/login" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors">
                  System Administration
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
