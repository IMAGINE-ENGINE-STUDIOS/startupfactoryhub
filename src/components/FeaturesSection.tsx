import { useState } from "react";
import { Brain, Users, MapPin, MessageSquare, Calendar, Target } from "lucide-react";
const features = [{
  icon: Brain,
  title: "AI-Generated Roadmaps",
  description: "Get personalized startup roadmaps powered by advanced AI, tailored to your industry and goals.",
  gradient: "from-cyan-500/20 via-blue-500/20 to-purple-500/20"
}, {
  icon: Users,
  title: "Instant Matching",
  description: "Connect with the perfect mentors, investors, and team members through our intelligent matching system.",
  gradient: "from-purple-500/20 via-pink-500/20 to-cyan-500/20"
}, {
  icon: MapPin,
  title: "Global Resources",
  description: "Access a comprehensive directory of labs, offices, grants, perks, and events worldwide.",
  gradient: "from-emerald-500/20 via-cyan-500/20 to-blue-500/20"
}, {
  icon: MessageSquare,
  title: "Real-Time Communication",
  description: "Seamless messaging and collaboration tools to keep your team and network connected.",
  gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
}, {
  icon: Calendar,
  title: "Event Management",
  description: "Discover and organize startup events, workshops, and networking opportunities.",
  gradient: "from-pink-500/20 via-rose-500/20 to-orange-500/20"
}, {
  icon: Target,
  title: "Actionable Milestones",
  description: "Transform any resource into clear, actionable steps with AI-powered recommendations.",
  gradient: "from-orange-500/20 via-amber-500/20 to-yellow-500/20"
}];
const FeaturesSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  return <section id="features" className="py-12 sm:py-20 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--ocean-border)) 1px, transparent 1px), 
                           linear-gradient(90deg, hsl(var(--ocean-border)) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }} />
      </div>

      
    </section>;
};
export default FeaturesSection;