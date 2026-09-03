// Hero band for the /basic-plan simulation page.
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BasicPlanHero() {
  return (
    <section className="text-center space-y-4">
      <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        Internal Simulation — not published
      </Badge>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        Startup Factory Hub <span className="text-primary">Basic</span>
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        One membership that unlocks the whole ecosystem: feed, map, programs,
        events, investors, internships, volunteering, tech transfer and
        certified courses.
      </p>
    </section>
  );
}
