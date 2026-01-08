import { motion } from "framer-motion";
import { Users, UserCheck, FileKey, BookOpen, Code, Building2, Brain, TrendingUp } from "lucide-react";

const benefits = [
  { icon: Users, title: "Mentors & Advisors", description: "Expert guidance from industry veterans" },
  { icon: UserCheck, title: "Human Capital", description: "Talent recruitment and team building support" },
  { icon: FileKey, title: "IP & Patents", description: "Intellectual property strategy and protection" },
  { icon: BookOpen, title: "Knowledge Resources", description: "Comprehensive educational content library" },
  { icon: Code, title: "Software Tools", description: "Premium tool credits and integrations" },
  { icon: Building2, title: "Office & Coworking", description: "Global workspace access at 5,600+ sites" },
  { icon: Brain, title: "AI Platform", description: "Full access to AI-powered tools and analytics" },
  { icon: TrendingUp, title: "Investor Network", description: "Direct connections to global investors" },
];

const StartupBenefits = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Startup <span className="text-primary">Benefits</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything startups need to succeed in the deep tech ecosystem
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="group relative"
            >
              {/* Glow */}
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 transition-all text-center h-full">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StartupBenefits;
