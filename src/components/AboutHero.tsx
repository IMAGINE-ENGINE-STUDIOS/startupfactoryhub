import { Rocket, Cpu, Zap, Target } from "lucide-react";

const AboutHero = () => {
  return (
    <section id="about" className="py-12 sm:py-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-cyan-500/20 rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-purple-500/30 rounded-full animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Deep Tech Accelerator</span>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              About Startup Factory Hub
            </span>
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
            Startup Factory Hub is an accelerator platform for <span className="text-foreground font-medium">deep tech startups</span>, 
            offering a unique technology to help your startups succeed through our proprietary 
            <span className="text-primary font-medium"> development acceleration algorithm</span>.
          </p>

          {/* Key Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Deep Tech Focus</h3>
              <p className="text-xs text-muted-foreground text-center">AI, Biotech, Quantum & more</p>
            </div>

            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-cyan-500" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Acceleration Algorithm</h3>
              <p className="text-xs text-muted-foreground text-center">Proprietary growth methodology</p>
            </div>

            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Success Driven</h3>
              <p className="text-xs text-muted-foreground text-center">Built for startup success</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
