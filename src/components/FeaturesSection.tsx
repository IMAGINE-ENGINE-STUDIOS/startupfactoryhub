import { Brain, Users, MapPin, MessageSquare, Calendar, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Generated Roadmaps",
    description: "Get personalized startup roadmaps powered by advanced AI, tailored to your industry and goals."
  },
  {
    icon: Users,
    title: "Instant Matching",
    description: "Connect with the perfect mentors, investors, and team members through our intelligent matching system."
  },
  {
    icon: MapPin,
    title: "Global Resources",
    description: "Access a comprehensive directory of labs, offices, grants, perks, and events worldwide."
  },
  {
    icon: MessageSquare,
    title: "Real-Time Communication",
    description: "Seamless messaging and collaboration tools to keep your team and network connected."
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Discover and organize startup events, workshops, and networking opportunities."
  },
  {
    icon: Target,
    title: "Actionable Milestones",
    description: "Transform any resource into clear, actionable steps with AI-powered recommendations."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to accelerate your startup journey, powered by cutting-edge AI technology.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-morphism p-8 rounded-xl hover:scale-105 transition-all duration-300 group"
            >
              <div className="hexagon-border w-16 h-16 mb-6 mx-auto">
                <div className="hexagon w-full h-full bg-ocean-surface flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-ocean-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-center group-hover:text-ocean-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground text-center leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;