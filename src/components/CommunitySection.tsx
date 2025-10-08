import { Button } from "@/components/ui/button";
import { Rocket, GraduationCap, DollarSign, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  return (
    <section id="community" className="py-12 sm:py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            <span className="text-foreground">Built for</span>{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Everyone
            </span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Whether you're a founder, mentor, investor, or student, our platform connects you with the right people at the right time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {userTypes.map((type, index) => (
            <div 
              key={index}
              className="glass-morphism p-6 sm:p-8 rounded-xl hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:space-x-6 space-y-4 sm:space-y-0">
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <type.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
                  </div>
                </div>
                
                <div className="flex-1 w-full">
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-ocean-primary transition-colors text-center sm:text-left">
                    {type.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed text-center sm:text-left">
                    {type.description}
                  </p>
                  
                  <ul className="space-y-2 mb-4 sm:mb-6">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-xs sm:text-sm text-muted-foreground justify-center sm:justify-start">
                        <div className="w-2 h-2 bg-ocean-primary rounded-full mr-2 sm:mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant="glass" 
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
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