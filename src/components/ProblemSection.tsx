import { motion } from "framer-motion";
import { AlertTriangle, Clock, PhoneOff } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "Victims Can't Call for Help",
    description: "After a severe crash, drivers are often unconscious or trapped, unable to reach their phone or call emergency services.",
  },
  {
    icon: Clock,
    title: "Critical Minutes Lost",
    description: "The golden hour after an accident is crucial. Delayed emergency response dramatically reduces survival rates.",
  },
  {
    icon: PhoneOff,
    title: "No Automated Systems",
    description: "Most vehicles lack built-in crash notification systems, leaving accident victims dependent on bystanders for help.",
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" className="section-padding">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">The Problem</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            When Every Second Counts
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Thousands of accident victims lose their lives every year simply because help arrives too late.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-card-gradient border border-border/50 rounded-2xl p-8 shadow-card"
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-5">
                <problem.icon className="text-destructive" size={24} />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
