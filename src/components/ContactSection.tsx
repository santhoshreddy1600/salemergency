import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", type: "beta", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! We'll be in touch soon.");
    setForm({ name: "", email: "", type: "beta", message: "" });
  };

  return (
    <section id="contact" className="section-padding">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">Get In Touch</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Join the <span className="text-gradient">SAL</span> Movement
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Whether you're an investor, partner, or early adopter — we'd love to hear from you.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-card-gradient border border-border/50 rounded-2xl p-5 sm:p-8 shadow-card space-y-4 sm:space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
                required
                className="bg-muted/50 border-border/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">I'm interested as a...</label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { value: "beta", label: "Beta Tester" },
                { value: "partner", label: "Partner" },
                { value: "investor", label: "Investor" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.value })}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                    form.type === opt.value
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us about your interest..."
              rows={4}
              className="bg-muted/50 border-border/50"
            />
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full">
            Send Message
          </Button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
