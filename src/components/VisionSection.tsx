import { motion } from "framer-motion";
import { Heart, Timer, Globe } from "lucide-react";

const VisionSection = () => {
  return (
    <section id="vision" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">Our Vision</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Making Roads <span className="text-gradient">Safer</span> with Smart Technology
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
            Our mission is to drastically reduce emergency response times by equipping every vehicle 
            with intelligent crash detection. SAL bridges the gap between the moment of impact and 
            the arrival of help — saving lives through automation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Timer, stat: "70%", label: "Faster response time" },
            { icon: Heart, stat: "10K+", label: "Lives saved annually (goal)" },
            { icon: Globe, stat: "50+", label: "Countries targeted" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="bg-card-gradient border border-border/50 rounded-2xl p-8 shadow-card"
            >
              <item.icon className="text-primary mx-auto mb-4" size={28} />
              <p className="font-display text-3xl font-bold text-gradient mb-1">{item.stat}</p>
              <p className="text-muted-foreground text-sm">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisionSection;
