import { useMemo, useState } from "react";
import {
  Network as NetworkIcon,
  Sparkles,
  Filter,
  ArrowRight,
  Activity,
  Info,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  label: string;
  category: string;
  probability: number;
  description: string;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
  relationship: string;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
}

// OLED-vibrant category palette — HSL strings for glow + solid usage
const CATEGORY_META: Record<
  string,
  { hex: string; glow: string; tw: string; label: string }
> = {
  market: {
    hex: "#a855f7",
    glow: "263 90% 65%",
    tw: "from-violet-500 to-fuchsia-500",
    label: "Market",
  },
  financial: {
    hex: "#10d9a3",
    glow: "160 85% 50%",
    tw: "from-emerald-400 to-teal-500",
    label: "Financial",
  },
  environmental: {
    hex: "#fbbf24",
    glow: "42 95% 55%",
    tw: "from-amber-400 to-orange-500",
    label: "Environmental",
  },
  technical: {
    hex: "#38bdf8",
    glow: "200 95% 60%",
    tw: "from-cyan-400 to-sky-500",
    label: "Technical",
  },
  regulatory: {
    hex: "#fb7185",
    glow: "350 90% 65%",
    tw: "from-rose-400 to-pink-500",
    label: "Regulatory",
  },
};

const metaFor = (cat: string) =>
  CATEGORY_META[cat] ?? {
    hex: "#94a3b8",
    glow: "215 20% 65%",
    tw: "from-slate-400 to-slate-500",
    label: cat,
  };

export default function BayesForgeNetworkGraph({ nodes, edges }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);

  if (!nodes.length) return null;

  const W = 640;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.36;

  // Position by category cluster (slight offset per category, plus circular layout)
  const positions = useMemo(() => {
    return nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      // Larger probability = pulled slightly inward (more important = central)
      const r = radius * (1 - n.probability * 0.18);
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
  }, [nodes]);

  const nodeMap = new Map(nodes.map((n, i) => [n.id, i]));

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const activeId = hoverId ?? selectedId;

  const isEdgeActive = (e: Edge) =>
    activeId !== null && (e.from === activeId || e.to === activeId);

  const isNodeDimmed = (n: Node) => {
    if (filterCat && n.category !== filterCat) return true;
    if (!activeId) return false;
    if (n.id === activeId) return false;
    const connected = edges.some(
      (e) =>
        (e.from === activeId && e.to === n.id) ||
        (e.to === activeId && e.from === n.id),
    );
    return !connected;
  };

  // Connection counts for the right rail
  const connCount = (id: string) =>
    edges.filter((e) => e.from === id || e.to === id).length;

  const categoriesPresent = Array.from(new Set(nodes.map((n) => n.category)));

  // Connections of selected
  const selectedIncoming = selectedNode
    ? edges.filter((e) => e.to === selectedNode.id)
    : [];
  const selectedOutgoing = selectedNode
    ? edges.filter((e) => e.from === selectedNode.id)
    : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 animate-fade-in">
      {/* ============ GRAPH PANEL ============ */}
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_-15px_hsl(var(--primary)/0.4)]">
        {/* HUD top */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-background/40">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 blur-md opacity-60 animate-pulse" />
              <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                <NetworkIcon className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Bayesian Network
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {nodes.length} variables · {edges.length} dependencies
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={() => setFilterCat(null)}
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border transition-all",
                !filterCat
                  ? "bg-white/10 border-white/30 text-foreground"
                  : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20",
              )}
            >
              <Filter className="inline h-3 w-3 mr-1" />
              All
            </button>
            {categoriesPresent.map((cat) => {
              const m = metaFor(cat);
              const active = filterCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(active ? null : cat)}
                  className={cn(
                    "text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border transition-all flex items-center gap-1.5",
                    active
                      ? "border-white/30 text-foreground"
                      : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20",
                  )}
                  style={
                    active
                      ? { boxShadow: `0 0 14px -4px hsl(${m.glow})` }
                      : undefined
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: m.hex }}
                  />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Graph */}
        <div className="relative p-3 sm:p-5">
          {/* Backdrop grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,hsl(var(--primary)/0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.4)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto relative"
            style={{ maxHeight: 520 }}
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="10"
                markerHeight="8"
                refX="10"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 10 4, 0 8" fill="hsl(var(--foreground))" opacity="0.55" />
              </marker>
              <marker
                id="arrow-active"
                markerWidth="12"
                markerHeight="10"
                refX="12"
                refY="5"
                orient="auto"
              >
                <polygon points="0 0, 12 5, 0 10" fill="hsl(263 90% 65%)" />
              </marker>
              <radialGradient id="nodeBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* EDGES */}
            {edges.map((edge, i) => {
              const fromIdx = nodeMap.get(edge.from);
              const toIdx = nodeMap.get(edge.to);
              if (fromIdx === undefined || toIdx === undefined) return null;
              const from = positions[fromIdx];
              const to = positions[toIdx];
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const nx = dx / len;
              const ny = dy / len;
              const r = 28;
              const active = isEdgeActive(edge);
              const dimmed = !!activeId && !active;

              // Curved path for less overlap
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const offset = 24;
              const px = -ny * offset;
              const py = nx * offset;
              const cpx = mx + px;
              const cpy = my + py;
              const sx = from.x + nx * r;
              const sy = from.y + ny * r;
              const ex = to.x - nx * r;
              const ey = to.y - ny * r;

              return (
                <g
                  key={`edge-${i}`}
                  opacity={dimmed ? 0.12 : 1}
                  className="transition-opacity duration-300"
                >
                  <path
                    d={`M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`}
                    fill="none"
                    stroke={active ? "hsl(263 90% 65%)" : "hsl(var(--foreground))"}
                    strokeOpacity={active ? 0.9 : 0.25 + edge.weight * 0.35}
                    strokeWidth={active ? 2.2 : 0.8 + edge.weight * 1.6}
                    markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
                    style={
                      active
                        ? { filter: "drop-shadow(0 0 6px hsl(263 90% 65%))" }
                        : undefined
                    }
                  />
                  {active && (
                    <text
                      x={cpx}
                      y={cpy - 4}
                      fill="hsl(263 90% 80%)"
                      fontSize="9"
                      textAnchor="middle"
                      style={{ filter: "drop-shadow(0 0 4px hsl(263 90% 60%))" }}
                    >
                      {(edge.weight * 100).toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}

            {/* NODES */}
            {nodes.map((node, i) => {
              const pos = positions[i];
              const m = metaFor(node.category);
              const isSelected = selectedId === node.id;
              const isHover = hoverId === node.id;
              const isActive = isSelected || isHover;
              const dimmed = isNodeDimmed(node);
              const baseR = 18 + node.probability * 14;
              const r = isActive ? baseR + 4 : baseR;

              return (
                <g
                  key={node.id}
                  onClick={() =>
                    setSelectedId(isSelected ? null : node.id)
                  }
                  onMouseEnter={() => setHoverId(node.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="cursor-pointer transition-all duration-200"
                  opacity={dimmed ? 0.25 : 1}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                >
                  {/* Glow halo */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 14}
                    fill={m.hex}
                    opacity={isActive ? 0.35 : 0.12}
                    style={{ filter: `blur(10px)` }}
                  />
                  {/* Outer ring */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={m.hex}
                    fillOpacity={0.18}
                    stroke={m.hex}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    style={
                      isActive
                        ? { filter: `drop-shadow(0 0 10px ${m.hex})` }
                        : undefined
                    }
                  />
                  {/* Inner core scaled by probability */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={4 + node.probability * 10}
                    fill={m.hex}
                    opacity={0.95}
                  />
                  {/* Sheen */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill="url(#nodeBg)"
                  />
                  {/* Probability text inside */}
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    fill="white"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                    style={{ pointerEvents: "none" }}
                  >
                    {(node.probability * 100).toFixed(0)}%
                  </text>
                  {/* Label */}
                  <text
                    x={pos.x}
                    y={pos.y + r + 14}
                    fill="hsl(var(--foreground))"
                    fontSize="10.5"
                    textAnchor="middle"
                    fontWeight="600"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.label.length > 22
                      ? node.label.substring(0, 20) + "…"
                      : node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hint */}
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <Info className="h-3 w-3" />
            Hover or click a node to explore its dependencies
          </div>
        </div>
      </div>

      {/* ============ DETAIL RAIL ============ */}
      <div className="space-y-3">
        {/* Selected node detail */}
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Node Inspector
            </span>
          </div>
          <div className="p-4">
            {selectedNode ? (
              (() => {
                const m = metaFor(selectedNode.category);
                return (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider text-white bg-gradient-to-r",
                            m.tw,
                          )}
                        >
                          {m.label}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ID: {selectedNode.id}
                        </span>
                      </div>
                      <h3 className="text-base font-bold leading-tight">
                        {selectedNode.label}
                      </h3>
                    </div>

                    {/* Probability gauge */}
                    <div>
                      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        <span>Prior probability</span>
                        <span
                          className="font-bold text-sm"
                          style={{ color: m.hex }}
                        >
                          {(selectedNode.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                            m.tw,
                          )}
                          style={{
                            width: `${selectedNode.probability * 100}%`,
                            boxShadow: `0 0 12px hsl(${m.glow})`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedNode.description}
                    </p>

                    {/* Connections */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <GitBranch className="h-3 w-3" />
                        Dependencies ({selectedIncoming.length + selectedOutgoing.length})
                      </div>
                      <div className="space-y-1.5">
                        {selectedIncoming.map((e, idx) => {
                          const src = nodes.find((n) => n.id === e.from);
                          if (!src) return null;
                          const sm = metaFor(src.category);
                          return (
                            <button
                              key={`in-${idx}`}
                              onClick={() => setSelectedId(src.id)}
                              className="w-full flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-background/40 hover:bg-background/60 hover:border-white/15 transition text-left"
                            >
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ background: sm.hex }}
                              />
                              <span className="text-xs truncate flex-1">
                                {src.label}
                              </span>
                              <ArrowRight className="h-3 w-3 text-violet-300" />
                              <span className="text-[10px] font-mono text-violet-300">
                                {(e.weight * 100).toFixed(0)}%
                              </span>
                            </button>
                          );
                        })}
                        {selectedOutgoing.map((e, idx) => {
                          const tgt = nodes.find((n) => n.id === e.to);
                          if (!tgt) return null;
                          const tm = metaFor(tgt.category);
                          return (
                            <button
                              key={`out-${idx}`}
                              onClick={() => setSelectedId(tgt.id)}
                              className="w-full flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-background/40 hover:bg-background/60 hover:border-white/15 transition text-left"
                            >
                              <ArrowRight className="h-3 w-3 text-cyan-300 shrink-0" />
                              <span className="text-xs truncate flex-1">
                                {tgt.label}
                              </span>
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ background: tm.hex }}
                              />
                              <span className="text-[10px] font-mono text-cyan-300">
                                {(e.weight * 100).toFixed(0)}%
                              </span>
                            </button>
                          );
                        })}
                        {selectedIncoming.length + selectedOutgoing.length === 0 && (
                          <p className="text-[11px] italic text-muted-foreground/70">
                            No connections.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-6 space-y-2">
                <Activity className="h-7 w-7 mx-auto text-violet-400/60" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select a node to inspect its probability, category, dependencies and reasoning.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Variable list */}
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              All Variables
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {nodes.length}
            </span>
          </div>
          <div className="p-2 max-h-64 overflow-auto space-y-1">
            {nodes
              .slice()
              .sort((a, b) => b.probability - a.probability)
              .map((n) => {
                const m = metaFor(n.category);
                const isSel = selectedId === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedId(isSel ? null : n.id)}
                    onMouseEnter={() => setHoverId(n.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className={cn(
                      "w-full text-left flex items-center gap-2 p-2 rounded-lg border transition-all text-xs",
                      isSel
                        ? "border-white/25 bg-white/5"
                        : "border-white/5 bg-background/30 hover:bg-background/60 hover:border-white/15",
                    )}
                    style={
                      isSel
                        ? { boxShadow: `0 0 14px -4px hsl(${m.glow})` }
                        : undefined
                    }
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        background: m.hex,
                        boxShadow: `0 0 6px ${m.hex}`,
                      }}
                    />
                    <span className="flex-1 truncate">{n.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {connCount(n.id)}↔
                    </span>
                    <span
                      className="text-[10px] font-mono font-bold tabular-nums"
                      style={{ color: m.hex }}
                    >
                      {(n.probability * 100).toFixed(0)}%
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
