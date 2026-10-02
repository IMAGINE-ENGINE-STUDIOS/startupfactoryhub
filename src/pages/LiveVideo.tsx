import { useNavigate, useSearchParams } from "react-router-dom";
import LiveVideoRoom from "@/components/LiveVideoRoom";

export default function LiveVideo() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  return (
    <div className="h-screen w-full bg-background">
      <LiveVideoRoom room={params.get("room") || "main"} onLeave={() => navigate(-1)} />
    </div>
  );
}
