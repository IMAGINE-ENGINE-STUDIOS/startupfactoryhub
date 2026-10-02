import { useSearchParams } from "react-router-dom";
import LiveVideoRoom from "@/components/LiveVideoRoom";

export default function LiveVideo() {
  const [params] = useSearchParams();
  return <LiveVideoRoom room={params.get("room") || "main"} />;
}
