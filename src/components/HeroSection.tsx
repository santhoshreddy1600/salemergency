import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import salDevice from "@/assets/sal-device.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center section-padding pt-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-4">
            Smart Accident Link
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            SAL – Smart Vehicle{" "}
            <span className="text-gradient">Accident Detection</span> System
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
            Automatic crash detection and instant emergency alerts for vehicles.
            Every second counts — SAL ensures help is on the way.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="hero" size="lg">
              See How It Works
            </Button>
            <Button variant="hero-outline" size="lg">
              Join Beta
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl animate-pulse-glow" />
            <img
              src={salDevice}
              alt="SAL Smart Accident Detection Device"
              className="relative rounded-2xl w-full max-w-md animate-float"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
