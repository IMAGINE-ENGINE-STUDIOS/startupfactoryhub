import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Star,
    description: "Get started with basic access",
    features: ["Limited platform access", "Community forums", "Basic resources", "Monthly newsletter"],
    color: "from-gray-500 to-gray-600",
    popular: false,
  },
  {
    name: "Community",
    price: "$300",
    period: "/month",
    icon: Zap,
    description: "Digital access for growing startups",
    features: ["Full digital access", "Virtual events", "Mentor matching", "AI tools (limited)", "Online workshops"],
    color: "from-blue-500 to-cyan-500",
    popular: false,
  },
  {
    name: "Self-Paced + Office",
    price: "$500",
    period: "/month",
    icon: Building,
    description: "Physical presence with mentorship",
    features: ["Coworking access (Japan)", "1:1 mentorship", "Full AI platform", "Investor introductions", "Local events priority"],
    color: "from-primary to-teal-400",
    popular: true,
  },
  {
    name: "Global Access",
    price: "$950",
    period: "/month",
    icon: Crown,
    description: "Unlimited global workspace",
    features: ["5,600+ sites globally", "130+ countries access", "Priority mentor matching", "Full analytics suite", "Dedicated support"],
    color: "from-purple-500 to-pink-500",
    popular: false,
  },
  {
    name: "Corporate",
    price: "$1,500",
    period: "/month",
    icon: Building,
    description: "Enterprise team solution",
    features: ["Team dashboard", "Unlimited travel days", "Custom reporting", "API access", "White-label options"],
    color: "from-orange-500 to-red-500",
    popular: false,
  },
];

const MembershipTiers = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Membership <span className="text-primary">Tiers</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Flexible plans for startups at every stage
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group ${tier.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold z-10">
                  Most Popular
                </div>
              )}
              
              {/* Glow for popular */}
              {tier.popular && (
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-400 rounded-2xl opacity-30 blur-lg" />
              )}
              
              <div className={`relative h-full p-6 rounded-2xl bg-card border ${tier.popular ? 'border-primary' : 'border-border'} transition-all group-hover:border-primary/50`}>
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                  <tier.icon className="w-6 h-6 text-white" />
                </div>

                {/* Name & Price */}
                <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${tier.popular ? 'bg-primary hover:bg-primary/90' : 'bg-card border border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`}
                  variant={tier.popular ? "default" : "outline"}
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MembershipTiers;
