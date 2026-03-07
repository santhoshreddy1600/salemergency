import { motion } from "framer-motion";
import { CarFront, Cpu, MapPin, MessageSquare } from "lucide-react";

const steps = [
  {
    icon: CarFront,
    title: "Crash Detected",
    description: "Vehicle impact triggers speed drop, crash sensors, and airbag signals.",
  },
  {
    icon: Cpu,
    title: "CAN Bus Data Processed",
    description: "SAL reads and analyzes real-time OBD CAN bus data to confirm the crash event.",
  },
  {
    icon: MapPin,
    title: "GPS Location Captured",
    description: "The device captures precise GPS coordinates of the accident location.",
  },
  {
    icon: MessageSquare,
    title: "SMS Alert Sent",
    description: "Emergency SMS with GPS location is sent to family and emergency contacts via GSM.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Four Steps to Save a Life
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative text-center"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-border/50" />
              )}

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-card-gradient border border-border/50 shadow-card flex items-center justify-center mx-auto mb-5">
                  <step.icon className="text-primary" size={32} />
                </div>
                <span className="inline-block text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
                  Step {i + 1}
                </span>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
