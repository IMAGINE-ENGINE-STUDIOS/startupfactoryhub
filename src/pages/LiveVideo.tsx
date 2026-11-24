import { useSearchParams } from "react-router-dom";
import LiveVideoRoom from "@/components/LiveVideoRoom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";

// One-time capacity gate (founder directive, 2026-11-24): the Pitch Event II
// room shows a maximum-capacity screen to everyone; nobody enters the room.
// Membership is offered as the way to secure a spot at upcoming events.
// Remove this block after the event.
const CAPACITY_FULL_ROOMS = new Set(["evt-startup-factory-hub-mvs6fr-8f603aa0"]);

export default function LiveVideo() {
  const [params] = useSearchParams();
  const room = params.get("room") || "main";
  if (CAPACITY_FULL_ROOMS.has(room)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <MatrixBackground />
        <Card className="max-w-md w-full relative z-10">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">We Are at Maximum Capacity</h2>
            <p className="text-muted-foreground mb-2">
              This live room is full.{" "}
              <span className="font-semibold text-foreground">333 people registered</span>{" "}
              for a room capacity of{" "}
              <span className="font-semibold text-foreground">250</span>.
            </p>
            <p className="text-muted-foreground mb-6">
              To secure your spot at the next pitch events, become a member.
              Members get guaranteed access.
            </p>
            <a href="https://startupfactoryhub.com/MEMBERSHIP">
              <Button className="w-full">Join the Members Club — $50/month</Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              Startup Factory Hub · Pitch Event II — Tuesday, November 24, 2026
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <LiveVideoRoom room={room} />;
}
