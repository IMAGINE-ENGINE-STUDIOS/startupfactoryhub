import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Invitation = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  expires_at: string;
};

export default function InternActivate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) { setError("Missing token"); setLoading(false); return; }
      const { data, error } = await supabase
        .from("intern_invitations")
        .select("id, email, full_name, status, expires_at")
        .eq("invite_token", token)
        .maybeSingle();

      if (error || !data) {
        setError("This activation link is not valid.");
      } else if (data.status === "activated") {
        setError("This profile has already been activated. Please sign in.");
      } else if (new Date(data.expires_at) < new Date()) {
        setError("This activation link has expired. Please request a new one.");
      } else {
        setInvitation(data as Invitation);
        setFullName(data.full_name || "");
      }
      setLoading(false);
    })();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }

    setSubmitting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("activate-intern", {
        body: { token, password, full_name: fullName },
      });
      if (fnErr) throw fnErr;
      if ((data as any)?.error) throw new Error((data as any).error);

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });
      if (signInErr) throw signInErr;

      toast.success("Profile activated! Welcome to Startup Factory Hub.");
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err: any) {
      toast.error(err.message || "Failed to activate profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full tech-card border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Activation Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/auth")} className="w-full">Go to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="max-w-md w-full tech-card border-0">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <CardTitle>Activate Your Intern Profile</CardTitle>
          </div>
          <CardDescription>
            Welcome to Startup Factory Hub. Set a password to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={invitation!.email} disabled />
            </div>
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <Label htmlFor="pw2">Confirm password</Label>
              <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Activate Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
