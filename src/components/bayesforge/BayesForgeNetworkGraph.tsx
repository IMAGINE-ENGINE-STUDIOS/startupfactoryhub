import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";

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

  const cx = 250, cy = 210, radius = 150;
  const positions = nodes.map((_, i) => ({
    x: cx + radius * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y: cy + radius * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
  }));

  const nodeMap = new Map(nodes.map((n, i) => [n.id, i]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Network Graph */}
      <Card className="tech-card border-0 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Bayesian Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <svg viewBox="0 0 500 420" className="w-full h-auto">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                </marker>
              </defs>

              {edges.map((edge, i) => {
                const fromIdx = nodeMap.get(edge.from);
                const toIdx = nodeMap.get(edge.to);
                if (fromIdx === undefined || toIdx === undefined) return null;
                const from = positions[fromIdx];
                const to = positions[toIdx];
                const dx = to.x - from.x, dy = to.y - from.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = dx / len, ny = dy / len;
                const r = 24;
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
                      y={(from.y + to.y) / 2 - 6}
                      fill="hsl(var(--muted-foreground))"
                      fontSize="8"
                      textAnchor="middle"
                      opacity="0.6"
                    >
                      {(edge.weight * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {nodes.map((node, i) => {
                const pos = positions[i];
                const color = categoryColors[node.category] || "#6b7280";
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g key={node.id} onClick={() => setSelectedNode(isSelected ? null : node)} className="cursor-pointer">
                    <circle
                      cx={pos.x} cy={pos.y} r={isSelected ? 26 : 20}
                      fill={color}
                      opacity={0.15 + node.probability * 0.6}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <circle cx={pos.x} cy={pos.y} r={3 + node.probability * 8} fill={color} opacity="0.8" />
                    <text
                      x={pos.x}
                      y={pos.y + (i < nodes.length / 2 ? -28 : 32)}
                      fill="hsl(var(--foreground))"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {node.label.length > 18 ? node.label.substring(0, 16) + "…" : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            {Object.entries(categoryColors).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{cat}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Node Detail Sidebar */}
      <div className="space-y-3">
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Node Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[selectedNode.category] || "#6b7280" }} />
                  <h4 className="font-semibold text-sm">{selectedNode.label}</h4>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize inline-block">{selectedNode.category}</span>
                <p className="text-xs text-muted-foreground">{selectedNode.description}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Probability</span>
                    <span className="font-medium">{(selectedNode.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${selectedNode.probability * 100}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Click a node in the graph to view its details.</p>
            )}
          </CardContent>
        </Card>

        {/* Node list */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All Nodes ({nodes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-48 overflow-auto">
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                className={`w-full text-left flex items-center gap-2 p-1.5 rounded text-xs hover:bg-muted/50 transition-colors ${selectedNode?.id === node.id ? "bg-muted" : ""}`}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColors[node.category] || "#6b7280" }} />
                <span className="truncate">{node.label}</span>
                <span className="ml-auto text-muted-foreground shrink-0">{(node.probability * 100).toFixed(0)}%</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
