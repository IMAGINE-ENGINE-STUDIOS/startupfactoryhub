/**
 * Section-level Matrix Effect layer (positive words of wisdom raining down).
 * Kept as its own component so every existing page keeps working unchanged.
 */
import MatrixEffect from "@/components/MatrixEffect";

export default function MatrixBackground() {
  return <MatrixEffect position="absolute" opacity={0.18} />;
}
