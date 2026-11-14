import { Link } from "react-router-dom";
import { ArrowLeft, CircuitBoard } from "lucide-react";
import PrototypeStudio from "@/components/PrototypeStudio";

/*
 * Prototype Studio — standalone page (founder, 2026-11-13): NOT in
 * the Tools tab and not linked anywhere in the product while it is
 * being built. Reachable only by its direct URL for testing, until
 * the founder says it is ready to join the Tools desk.
 */
export default function PrototypeStudioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold flex items-center gap-2">
          <CircuitBoard className="h-5 w-5 text-sky-400" /> Prototype Studio
        </h1>
        <span className="text-[11px] rounded-full border border-amber-500/50 text-amber-500 px-2 py-0.5">In build — not yet public</span>
      </header>
      <main className="flex-1 min-h-0 p-4 max-w-[1400px] w-full mx-auto">
        <PrototypeStudio />
      </main>
    </div>
  );
}
