import { useState } from "react";
import { FileText, TrendingUp, Languages, Image, Workflow, FileEdit } from "lucide-react";
import AIAssistant from "./AIAssistant";
import MatrixBackground from "./MatrixBackground";
import { useNavigate } from "react-router-dom";

interface AIFeature {
  icon: any;
  title: string;
  description: string;
  color: string;
}

export default function AIAssistantPreview() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const features: AIFeature[] = [
    {
      icon: FileText,
      title: "Smart Summaries",
      description: "Automatically condense long content into key takeaways",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: TrendingUp,
      title: "Sentiment Analysis",
      description: "Understand feedback and communications at scale",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: Languages,
      title: "AI Translator",
      description: "Communicate globally with instant translations",
      color: "from-orange-500/20 to-red-500/20"
    },
    {
      icon: Image,
      title: "Document Analysis",
      description: "Extract insights from images and documents",
      color: "from-pink-500/20 to-rose-500/20"
    },
    {
      icon: Workflow,
      title: "Task Automation",
      description: "Automate workflows and repetitive tasks",
      color: "from-cyan-500/20 to-blue-500/20"
    },
    {
      icon: FileEdit,
      title: "LightPaper",
      description: "Create, edit, and sign documents and PDFs with ease",
      color: "from-blue-500/20 to-indigo-500/20"
    }
  ];

  return (
    <>
      <section className="py-12 sm:py-20 relative overflow-hidden">
        {/* Matrix background */}
        <MatrixBackground />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-90" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent animate-gradient">
                AI-Powered Tools
              </span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Enhance your workflow with intelligent automation and insights powered by cutting-edge AI technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => feature.title === "LightPaper" && navigate("/lightpaper")}
              >
                {/* Glow effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500`} />
                
                {/* Card */}
                <div className="relative glass-morphism p-6 sm:p-8 rounded-xl cursor-pointer transition-all duration-300 group-hover:translate-y-[-8px] h-full">
                  {/* Scan line */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700`} />
                  
                  {/* Icon with circular orbit */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6 mx-auto">
                    {/* Rotating ring */}
                    <div className={`absolute inset-0 rounded-full border-2 border-dashed border-ocean-primary/30 ${hoveredIndex === index ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
                      <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-ocean-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-ocean-secondary rounded-full -translate-x-1/2 translate-y-1/2" />
                    </div>
                    
                    {/* Icon container */}
                    <div className={`absolute inset-2 bg-gradient-to-br ${feature.color} backdrop-blur-sm rounded-full flex items-center justify-center border border-ocean-primary/20 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-ocean-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center group-hover:text-ocean-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Data stream effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ocean-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Corner accents */}
                  <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-ocean-primary/30 group-hover:border-ocean-primary transition-colors duration-300" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-ocean-primary/30 group-hover:border-ocean-primary transition-colors duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </>
  );
}