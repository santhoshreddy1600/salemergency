import { motion } from "framer-motion";
import { ShieldCheck, Plug, MapPin, Radio, Database } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Automatic Accident Detection",
    description: "Monitors sudden speed drops, crash sensor data, and airbag deployment signals in real-time.",
  },
  {
    icon: Plug,
    title: "CAN Bus Integration via OBD",
    description: "Connects directly to any OBD-II port for seamless vehicle data access without modification.",
  },
  {
    icon: MapPin,
    title: "GPS Location Tracking",
    description: "Captures precise accident coordinates using integrated GPS module for accurate location sharing.",
  },
  {
    icon: Radio,
    title: "GSM Emergency Alerts",
    description: "Sends SMS alerts with location data to emergency contacts using built-in GSM connectivity.",
  },
  {
    icon: Database,
    title: "Crash Event Data Logging",
    description: "Records and stores crash event data for insurance claims, analysis, and legal documentation.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="section-padding relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[150px]" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">Features</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built for <span className="text-gradient">Safety</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every feature is designed to minimize response time and maximize safety in critical moments.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group bg-card-gradient border border-border/50 rounded-2xl p-7 shadow-card hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:shadow-glow transition-shadow">
                <feature.icon className="text-primary" size={24} />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
