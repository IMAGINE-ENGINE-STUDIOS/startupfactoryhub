import { motion } from "framer-motion";
import { Building, Search, Palette, Users, BarChart3, Award, TrendingUp } from "lucide-react";

const benefits = [
  {
    number: "01",
    icon: Building,
    title: "Fully Operational Accelerator",
    description: "Turnkey accelerator presence in Japan with all infrastructure, tools, and operational support included.",
  },
  {
    number: "02",
    icon: Search,
    title: "Curated Deal Flow",
    description: "Priority access to vetted Japan-based deep tech startups with high growth potential.",
  },
  {
    number: "03",
    icon: Palette,
    title: "Program Customization",
    description: "Tailor program design, cohort structure, and focus areas to match your strategic objectives.",
  },
  {
    number: "04",
    icon: Users,
    title: "Direct Founder Access",
    description: "Exclusive networking with startup founders for investment, partnership, and acquisition opportunities.",
  },
  {
    number: "05",
    icon: BarChart3,
    title: "Market Intelligence",
    description: "Comprehensive reports on Japan's startup ecosystem, trends, and competitive landscape.",
  },
  {
    number: "06",
    icon: Award,
    title: "Brand Presence",
    description: "Prominent positioning in Japan's innovation ecosystem through events, media, and partnerships.",
  },
  {
    number: "07",
    icon: TrendingUp,
    title: "Future Upside",
    description: "Co-investment opportunities and potential equity participation in high-performing portfolio companies.",
  },
];

const PartnerBenefits = () => {
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
            Partner <span className="text-primary">Benefits</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Strategic advantages for our investment partner
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`group relative ${index === 6 ? 'md:col-span-2 lg:col-span-1' : ''}`}
            >
              {/* Number Badge */}
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm z-10">
                {benefit.number}
              </div>
              
              {/* Card */}
              <div className="relative h-full p-8 pt-10 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerBenefits;
