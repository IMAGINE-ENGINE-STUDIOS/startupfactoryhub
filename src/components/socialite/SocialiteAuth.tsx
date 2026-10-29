/**
 * SocialiteAuth — SOCIALITE's own sign in / sign up screen. It uses the same
 * Startup Factory Hub account system: one account works on both sites.
 * SocialiteGate shows this when nobody is signed in, otherwise the app.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function SocialiteAuth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ first: "", last: "", email: "", pass: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg("");
    const email = f.email.trim().toLowerCase();
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: f.pass });
      if (error) setMsg("Email or password didn't match. New here? Create an account.");
    } else {
      if (f.pass.length < 8) { setMsg("Use at least 8 characters for the password."); setBusy(false); return; }
      const { data, error } = await supabase.auth.signUp({
        email, password: f.pass,
        options: { emailRedirectTo: `${window.location.origin}/socialite`, data: { first_name: f.first.trim(), last_name: f.last.trim() } },
      });
      if (error) setMsg(/registered/i.test(error.message) ? "You already have a Startup Factory Hub account — sign in with it." : error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then sign in here.");
    }
    setBusy(false);
  };

  const inp = "w-full bg-[#0f0f10] border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-zinc-100 outline-none focus:border-zinc-600";
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 grid place-items-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="text-[26px] font-semibold tracking-tight">SOCIALITE</div>
          <p className="text-[13px] text-zinc-500 mt-1">by Startup Factory Hub · your Startup Factory Hub account works here</p>
        </div>
        <div className="flex p-1 rounded-full bg-zinc-900 mb-5">
          {(["in", "up"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setMsg(""); }}
              className={`flex-1 py-2 rounded-full text-[12.5px] font-medium transition ${mode === m ? "bg-white text-black" : "text-zinc-400"}`}>
              {m === "in" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && (
            <div className="flex gap-2">
              <input required placeholder="First name" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} className={inp} />
              <input placeholder="Last name" value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} className={inp} />
            </div>
          )}
          <input required type="email" autoComplete="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} />
          <input required type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="Password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} className={inp} />
          {msg && <p className="text-[12px] text-zinc-400">{msg}</p>}
          <button disabled={busy} className="w-full py-2.5 rounded-full bg-white text-black text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Signed out → SocialiteAuth. Signed in → children (any Startup Factory Hub account). */
export function SocialiteGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0a0b] grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>;
  if (!user) return <SocialiteAuth />;
  return <>{children}</>;
}
