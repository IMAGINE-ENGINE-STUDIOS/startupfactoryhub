import { useState } from "react";

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

const categoryColors: Record<string, string> = {
  market: "#8b5cf6",
  financial: "#10b981",
  environmental: "#f59e0b",
  technical: "#3b82f6",
  regulatory: "#ef4444",
};

export default function BayesForgeNetworkGraph({ nodes, edges }: Props) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  if (!nodes.length) return null;

  // Layout nodes in a circle
  const cx = 300, cy = 250, radius = 180;
  const positions = nodes.map((_, i) => ({
    x: cx + radius * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y: cy + radius * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
  }));

  const nodeMap = new Map(nodes.map((n, i) => [n.id, i]));

  return (
    <div className="space-y-4">
      <svg viewBox="0 0 600 500" className="w-full h-auto bg-background/50 rounded-xl border border-border/30">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" opacity="0.5" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const fromIdx = nodeMap.get(edge.from);
          const toIdx = nodeMap.get(edge.to);
          if (fromIdx === undefined || toIdx === undefined) return null;
          const from = positions[fromIdx];
          const to = positions[toIdx];
          const dx = to.x - from.x, dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / len, ny = dy / len;
          const r = 28;
          return (
            <g key={`edge-${i}`}>
              <line
                x1={from.x + nx * r} y1={from.y + ny * r}
                x2={to.x - nx * r} y2={to.y - ny * r}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.3 + edge.weight * 0.5}
                strokeWidth={1 + edge.weight * 2}
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 8}
                fill="hsl(var(--muted-foreground))"
                fontSize="9"
                textAnchor="middle"
                opacity="0.6"
              >
                {(edge.weight * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = positions[i];
          const color = categoryColors[node.category] || "#6b7280";
          const isSelected = selectedNode?.id === node.id;
          return (
            <g key={node.id} onClick={() => setSelectedNode(isSelected ? null : node)} className="cursor-pointer">
              <circle
                cx={pos.x} cy={pos.y} r={isSelected ? 30 : 24}
                fill={color}
                opacity={0.15 + node.probability * 0.6}
                stroke={color}
                strokeWidth={isSelected ? 3 : 1.5}
              />
              <circle cx={pos.x} cy={pos.y} r={4 + node.probability * 10} fill={color} opacity="0.8" />
              <text
                x={pos.x}
                y={pos.y + (i < nodes.length / 2 ? -32 : 38)}
                fill="hsl(var(--foreground))"
                fontSize="10"
                textAnchor="middle"
                fontWeight="500"
              >
                {node.label.length > 18 ? node.label.substring(0, 16) + "…" : node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(categoryColors).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{cat}</span>
          </div>
        ))}
      </div>

      {/* Node detail */}
      {selectedNode && (
        <div className="tech-card border-0 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[selectedNode.category] || "#6b7280" }} />
            <h4 className="font-semibold">{selectedNode.label}</h4>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{selectedNode.category}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{selectedNode.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Probability:</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${selectedNode.probability * 100}%` }} />
            </div>
            <span className="text-xs font-medium">{(selectedNode.probability * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
