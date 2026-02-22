import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, Building, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMBERSHIP_TIERS } from "@/lib/membership-tiers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Star,
    target: "Entry-level founders",
    description: "Get started with basic access to the ecosystem",
    features: [
      "Limited platform access",
      "Self-paced access to limited resources",
      "Community forums",
      "Monthly newsletter",
    ],
    color: "from-gray-500 to-gray-600",
    popular: false,
  },
  {
    name: "Community",
    price: "$300",
    period: "/month",
    icon: Zap,
    target: "Early MVP-stage founders",
    description: "Digital access for growing startups",
    features: [
      "Full digital platform access",
      "Virtual events & workshops",
      "Community & mentor interactions",
      "Full resource library access",
      "AI tools (limited)",
    ],
    color: "from-blue-500 to-cyan-500",
    popular: false,
  },
  {
    name: "Self-Paced + Office",
    price: "$500",
    period: "/month",
    icon: Building,
    target: "Founders needing flexible workspace + virtual resources",
    description: "Adds local IWG coworking space access (1 country) to the community plan",
    features: [
      "All Community features",
      "Local coworking access (1 country)",
      "Mentor + event access",
      "Eligible for Accelerated Tier",
    ],
    color: "from-primary to-teal-400",
    popular: true,
  },
  {
    name: "Global Access",
    price: "$950",
    period: "/month",
    icon: Crown,
    target: "Globally distributed teams, traveling founders",
    description: "All platform features + unlimited global office access (130+ countries, 5,600+ sites)",
    features: [
      "All platform features",
      "Global private office access",
      "130+ countries, 5,600+ sites",
      "Eligible for Accelerated Tier",
    ],
    color: "from-purple-500 to-pink-500",
    popular: false,
  },
  {
    name: "Corporate",
    price: "$1,500",
    period: "/month",
    icon: Users,
    target: "Scale-ups or corporate venture units",
    description: "Designed for corporate innovation teams and growth-stage startups with teams across regions",
    features: [
      "All Global Access features",
      "Team dashboard & management",
      "Unlimited travel (11 countries)",
      "Global coworking access",
      "Soft Landing optional ($5,000)",
      "Accelerated Tier if eligible",
    ],
    color: "from-orange-500 to-red-500",
    popular: false,
  },
  {
    name: "In-Person Cohort",
    price: "No Fee",
    period: "selected startups",
    icon: Rocket,
    target: "Selected deep-tech startups",
    description: "Full accelerator experience",
    features: [
      "All platform features included",
      "Direct investor introductions",
      "Accelerated tier access",
      "Demo day participation",
      "Full mentor network access",
      "Priority deal flow visibility",
    ],
    color: "from-green-500 to-emerald-500",
    popular: false,
  },
];

const MembershipTiers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: typeof tiers[number]) => {
    if (tier.name === "Free" || tier.name === "In-Person Cohort") return;

    if (!user) {
      toast.info("Please sign in to subscribe");
      navigate("/auth");
      return;
    }

    const tierKey = tier.name === "Community" ? "community"
      : tier.name === "Self-Paced + Office" ? "self_paced_office"
      : tier.name === "Global Access" ? "global_access"
      : tier.name === "Corporate" ? "corporate"
      : null;

    if (!tierKey) return;

    const membershipTier = MEMBERSHIP_TIERS[tierKey];
    if (!membershipTier?.price_id) return;

    setLoadingTier(tier.name);
    try {
      const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
        body: { priceId: membershipTier.price_id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">MEMBERSHIP PLANS</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Membership <span className="text-primary">Tiers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Flexible plans designed for startups at every stage of their journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-teal-400 text-primary-foreground text-sm font-bold z-10 shadow-lg">
                  Recommended
                </div>
              )}
              
              {/* Glow for popular */}
              {tier.popular && (
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-teal-400 to-primary rounded-2xl opacity-30 blur-xl animate-pulse" />
              )}

              {/* Hover glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-teal-400/50 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
              
              <div className={`relative h-full p-6 rounded-2xl bg-card/90 backdrop-blur-xl border ${tier.popular ? 'border-primary' : 'border-border'} group-hover:border-transparent transition-all`}>
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <tier.icon className="w-7 h-7 text-white" />
                </div>

                {/* Header */}
                <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                <p className="text-xs text-primary font-medium mb-2">{tier.target}</p>
                
                {/* Price */}
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
                  className={`w-full ${tier.popular ? 'bg-gradient-to-r from-primary to-teal-400 hover:from-primary/90 hover:to-teal-400/90' : ''}`}
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(tier)}
                  disabled={loadingTier === tier.name || tier.name === "Free"}
                >
                  {loadingTier === tier.name ? "Loading..." : tier.name === "Free" ? "Current Plan" : tier.name === "In-Person Cohort" ? "Apply Now" : "Get Started"}
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
