import { motion } from "framer-motion";
import { Cpu, Radio, MapPin, Wifi, Monitor } from "lucide-react";

const techStack = [
  { icon: Cpu, name: "ESP32 Microcontroller", description: "Dual-core processor handling real-time crash detection and communication." },
  { icon: Plug, name: "CAN Bus Interface", description: "MCP2515 module reading OBD-II vehicle data at high speed." },
  { icon: MapPin, name: "GPS Module", description: "NEO-6M GPS for precise accident location coordinates." },
  { icon: Radio, name: "GSM Module", description: "SIM800L for SMS alerts over cellular network — no WiFi needed." },
  { icon: Monitor, name: "Web & Mobile Dashboard", description: "Real-time monitoring, contact management, and crash history logs." },
];

import { Plug } from "lucide-react";

const TechnologySection = () => {
  return (
    <section id="technology" className="section-padding">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">Technology</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Engineered for <span className="text-gradient">Reliability</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Purpose-built hardware and software stack designed for mission-critical crash detection.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-start gap-5 bg-card-gradient border border-border/50 rounded-2xl p-6 shadow-card"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <tech.icon className="text-primary" size={22} />
              </div>
              <div>
                <h3 className="font-display font-semibold mb-1">{tech.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{tech.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
