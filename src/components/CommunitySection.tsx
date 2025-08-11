import { Button } from "@/components/ui/button";
import { Rocket, GraduationCap, DollarSign, Lightbulb } from "lucide-react";

const userTypes = [
  {
    icon: Rocket,
    title: "Startups",
    description: "Build your dream company with AI-powered roadmaps and instant access to mentors and resources.",
    features: ["Personalized roadmaps", "Mentor matching", "Resource discovery", "Progress tracking"],
    color: "ocean-primary"
  },
  {
    icon: Lightbulb,
    title: "Mentors & Advisors",
    description: "Share your expertise and guide the next generation of entrepreneurs while building your network.",
    features: ["Find promising startups", "Share expertise", "Build network", "Track impact"],
    color: "ocean-secondary"
  },
  {
    icon: DollarSign,
    title: "Investors",
    description: "Discover high-potential startups and connect with founders at the perfect moment.",
    features: ["Deal flow pipeline", "Startup analytics", "Direct connections", "Portfolio tracking"],
    color: "accent"
  },
  {
    icon: GraduationCap,
    title: "Students",
    description: "Learn from real entrepreneurs, gain experience, and find internship opportunities.",
    features: ["Learning resources", "Internship matching", "Skill development", "Career guidance"],
    color: "primary"
  }
];

const CommunitySection = () => {
  return (
    <section id="community" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Built for</span>{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Everyone
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're a founder, mentor, investor, or student, our platform connects you with the right people at the right time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {userTypes.map((type, index) => (
            <div 
              key={index}
              className="glass-morphism p-8 rounded-xl hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <type.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-4 group-hover:text-ocean-primary transition-colors">
                    {type.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {type.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-ocean-primary rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button variant="glass" className="w-full">
                    Join as {type.title}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;