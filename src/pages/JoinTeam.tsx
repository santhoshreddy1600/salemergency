import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, ArrowLeft } from "lucide-react";

const JoinTeam = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("beta_tester");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("members").insert({
      full_name: fullName,
      email,
      phone: phone || null,
      interest,
      message: message || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to submit. Please try again.");
    } else {
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Thank You!</h1>
          <p className="text-muted-foreground mb-8">Your application to join the SAL team has been received. We'll be in touch soon.</p>
          <Link to="/">
            <Button variant="hero">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight">
            <span className="text-gradient">SAL</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mt-4">Join SAL Team</h1>
          <p className="text-muted-foreground mt-2">Be part of the smart vehicle safety revolution</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-8">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest">I'm interested as *</Label>
            <select
              id="interest"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="beta_tester">Beta Tester</option>
              <option value="partner">Partner</option>
              <option value="investor">Investor</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            <Users className="mr-2 h-4 w-4" />
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default JoinTeam;
