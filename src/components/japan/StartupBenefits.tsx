import { motion } from "framer-motion";
import { Users, UserCheck, FileKey, BookOpen, Code, Building2, Brain, TrendingUp, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Mentors & Advisors",
    description: "A global pool of seasoned mentors and industry advisors available for virtual and in-person consultation. Access to domain experts in aerospace, AI, robotics, and deep tech sectors.",
  },
  {
    icon: UserCheck,
    title: "Human Capital",
    description: "Assistance in building the team and talent pipeline. Through partnerships with Lehigh, Princeton, Nasdaq Entrepreneur Center, UCF, and global universities for internships and recruiting.",
  },
  {
    icon: FileKey,
    title: "IP & Patents",
    description: "Structured exposure to a curated portfolio of intellectual property and technology assets for educational, scouting, and commercialization exploration. Strategic IP advisory services.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Resources",
    description: "On-demand access to educational content: startup playbooks, market research reports, legal templates, and technical tutorials curated by domain experts.",
  },
  {
    icon: Code,
    title: "Software Tools & Credits",
    description: "Free or discounted access to essential software tools and cloud services. Partnerships with major providers for development, analytics, and infrastructure needs.",
  },
  {
    icon: Building2,
    title: "Office & Coworking",
    description: "Physical workspace worldwide with membership for coworking areas, private offices, and meeting rooms across 5,600+ sites in 130+ countries.",
  },
  {
    icon: Brain,
    title: "AI-Powered Platform",
    description: "Proprietary software platform acts as the startup's cockpit with advanced AI agents for market research, pitch development, financial modeling, and milestone planning.",
  },
  {
    icon: TrendingUp,
    title: "Investor & Corporate Network",
    description: "Curated introductions to investors, corporate partners specialized in deep tech and aerospace. Priority access to demo days and investment opportunities.",
  },
];

const StartupBenefits = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-teal-400/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">STARTUP OFFERINGS</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Startup <span className="text-primary">Benefits</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Comprehensive support ecosystem for deep tech startups at every stage of their journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="group relative"
            >
              {/* Animated glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-teal-400/50 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              
              <div className="relative p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border group-hover:border-transparent transition-all h-full">
                {/* Number badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-teal-400/10 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-teal-400/20 transition-all">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>

                {/* Hover line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-3/4 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StartupBenefits;
