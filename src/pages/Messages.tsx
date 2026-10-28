// Messages — the member inbox surface.
//
// Conversations themselves live in the FloatingChat panel (its Messages tab
// lists the signed-in member's `conversations` and opens each thread from the
// `messages` table — the same tables every "Message" button writes to via the
// 'openFloatingChat' window event). This route makes that inbox findable:
// /messages (plus /inbox and /chat redirects) opens the panel on the
// conversation list, and /messages?user=<userId> opens one thread directly.
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Messages() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userId = params.get("user");

  const openInbox = () => {
    window.dispatchEvent(
      new CustomEvent("openFloatingChat", {
        detail: userId ? { userId } : {},
      })
    );
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth?redirect=/messages");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    openInbox();
    // FloatingChat is lazy-mounted at app level; retry once so the listener
    // is attached even on a cold load straight into /messages.
    const retry = setTimeout(openInbox, 800);
    return () => clearTimeout(retry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary">
            Startup Factory Hub
          </p>
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>

        <Card className="tech-card border-0 p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Your inbox
          </h2>
          <p className="text-sm text-muted-foreground">
            Every conversation you start from a member, mentor, investor or
            startup profile lives here. Your inbox opens in the chat panel —
            pick a conversation to read and reply, or start a new message from
            the list.
          </p>
          <Button onClick={openInbox} className="rounded-full">
            Open messages
          </Button>
        </Card>
      </div>
    </div>
  );
}
