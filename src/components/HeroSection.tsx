import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import salDevice from "@/assets/sal-device.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center section-padding pt-24 sm:pt-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-primary/5 blur-[80px] sm:blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <p className="text-primary font-medium text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4">
            Smart Accident Link
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4 sm:mb-6">
            SAL – Smart Vehicle{" "}
            <span className="text-gradient">Accident Detection</span> System
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed">
            Automatic crash detection and instant emergency alerts for vehicles.
            Every second counts — SAL ensures help is on the way.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
            <Button variant="hero" size="lg" className="w-full sm:w-auto">
              See How It Works
            </Button>
            <Button variant="hero-outline" size="lg" className="w-full sm:w-auto">
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
              className="relative rounded-2xl w-full max-w-[280px] sm:max-w-md animate-float"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
