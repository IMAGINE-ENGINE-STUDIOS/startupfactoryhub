import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FileSignature, Upload, FilePlus2, ArrowDown } from "lucide-react";
import SignStudio from "./SignStudio";
import MatrixEffect from "@/components/MatrixEffect";

export default function SignHub() {
  const studioRef = useRef<HTMLElement | null>(null);

  const scrollToStudio = () =>
    studioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleUpload = () => {
    scrollToStudio();
    window.setTimeout(() => window.dispatchEvent(new Event("lightpaper-open-upload")), 750);
  };

  return (
    <div className="h-[100svh] overflow-y-auto snap-y snap-mandatory bg-background/80">
      {/* Epic header */}
      <header className="relative snap-start min-h-[100svh] flex flex-col overflow-hidden">
        <MatrixEffect position="absolute" opacity={0.22} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,hsl(var(--background)/0.85))]" />

        <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Sign</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 gap-8">
          <div className="space-y-4 max-w-3xl">
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-muted-foreground">
              Startup Factory Hub
            </p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Sign anything.
              <br />
              Beautifully.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Upload a document or create one with LightPaper, then collect legally
              binding signatures in seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <Button size="lg" className="flex-1 gap-2 h-12" onClick={handleUpload}>
              <Upload className="h-5 w-5" />
              Upload document
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 gap-2 h-12 tech-card border-0"
              onClick={scrollToStudio}
            >
              <FilePlus2 className="h-5 w-5" />
              Create document
            </Button>
          </div>

          <button
            onClick={scrollToStudio}
            className="text-muted-foreground hover:text-foreground transition-colors animate-bounce"
            aria-label="Go to studio"
          >
            <ArrowDown className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Studio locked below the header */}
      <section ref={studioRef} className="snap-start h-[100svh] overflow-hidden">
        <SignStudio embedded />
      </section>
    </div>
  );
}
