import { Rocket, Cpu, Zap, Target } from "lucide-react";

const AboutHero = () => {
  return (
    <section id="about" className="py-10 sm:py-14 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Integrated layout */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left: Text content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Rocket className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Deep Tech Accelerator</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3">
                <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  About Startup Factory Hub
                </span>
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                An accelerator platform for <span className="text-foreground font-medium">deep tech startups</span>, 
                offering unique technology to help your startup succeed through our proprietary 
                <span className="text-primary font-medium"> development acceleration algorithm</span>.
              </p>
            </div>

            {/* Right: Key points in a connected flow */}
            <div className="flex flex-row lg:flex-col gap-3 sm:gap-4">
              {[
                { icon: Cpu, title: "Deep Tech", desc: "AI, Biotech, Quantum", color: "text-primary", bg: "bg-primary/10" },
                { icon: Zap, title: "Accelerate", desc: "Growth methodology", color: "text-cyan-500", bg: "bg-cyan-500/10" },
                { icon: Target, title: "Succeed", desc: "Built for success", color: "text-purple-500", bg: "bg-purple-500/10" },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="group flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:bg-card/50"
                >
                  <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold">{item.title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
