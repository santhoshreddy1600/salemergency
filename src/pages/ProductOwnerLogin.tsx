import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Cpu } from "lucide-react";

const ProductOwnerLogin = () => {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Product owners use deviceId@sal.local as their email
    const email = `${deviceId}@sal.local`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Invalid Device ID or password");
    } else {
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight">
            <span className="text-gradient">SAL</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mt-4">Product Owner Login</h1>
          <p className="text-muted-foreground mt-2">Sign in with your Device ID and password</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 rounded-xl border border-border bg-card p-8">
          <div className="space-y-2">
            <Label htmlFor="deviceId">Device ID</Label>
            <div className="relative">
              <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="deviceId"
                type="text"
                placeholder="Enter your Device ID"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            <LogIn className="mr-2 h-4 w-4" />
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Not a product owner?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in with Email
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ProductOwnerLogin;
