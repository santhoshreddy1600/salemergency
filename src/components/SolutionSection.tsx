import { motion } from "framer-motion";
import { Shield, Zap, Smartphone } from "lucide-react";

const SolutionSection = () => {
  return (
    <section id="solution" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">The Solution</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Instant, Automatic <span className="text-gradient">Emergency Response</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            SAL plugs directly into your vehicle's OBD port and continuously monitors crash signals. 
            When an accident is detected, it automatically sends your GPS location and emergency alerts 
            to your family and emergency contacts — no driver interaction needed.
          </p>
          <div className="space-y-5">
            {[
              { icon: Zap, text: "Detects accidents in under 100ms using CAN bus data" },
              { icon: Shield, text: "Sends SMS alerts automatically via GSM module" },
              { icon: Smartphone, text: "No app or phone required — fully standalone" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="text-primary" size={20} />
                </div>
                <p className="text-secondary-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex justify-center"
        >
          <div className="w-full max-w-sm aspect-square rounded-3xl bg-card-gradient border border-border/50 shadow-card flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Shield className="text-primary" size={40} />
              </div>
              <p className="font-display text-5xl font-bold text-gradient mb-2">&lt;3s</p>
              <p className="text-muted-foreground">From crash detection to alert sent</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
