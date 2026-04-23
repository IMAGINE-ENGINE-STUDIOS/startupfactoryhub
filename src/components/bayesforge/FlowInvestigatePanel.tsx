import FlowRoadmap from "./FlowRoadmap";
import type { FlowSessionApi } from "@/hooks/useFlowSession";
import { Compass } from "lucide-react";

interface Props {
  api: FlowSessionApi;
}

/**
 * The "Investigate" tab is now the gamified roadmap experience itself.
 * No chat bubbles, no chat bar — it's a quest map you build.
 */
export default function FlowInvestigatePanel({ api }: Props) {
  return (
    <div className="flex flex-col gap-3 animate-fade-in min-h-[520px]">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 blur-md opacity-60" />
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <Compass className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Build your investigation roadmap
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Place a marker, conquer the checkpoint, expand the path. Every milestone unlocks new intel.
          </p>
        </div>
      </div>

      <FlowRoadmap api={api} />
    </div>
  );
}
