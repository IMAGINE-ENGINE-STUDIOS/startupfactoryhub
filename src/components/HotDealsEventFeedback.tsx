import { useEffect, useMemo, useState } from "react";
import { Star, MessageCircle, Send, CheckCircle2, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Category = "overall" | "pitches" | "production" | "community";

interface FeedbackRow {
  id: string;
  rating: number;
  comment: string | null;
  category: string;
  created_at: string;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "overall", label: "Overall" },
  { value: "pitches", label: "Pitches" },
  { value: "production", label: "Production" },
  { value: "community", label: "Community" },
];

const TOKEN_KEY = "hot_deals_feedback_token";
const SUBMITTED_KEY = "hot_deals_feedback_submitted";

const getOrCreateToken = (): string => {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
};

const getSubmittedSet = (): Set<Category> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SUBMITTED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as Category[]);
  } catch {
    return new Set();
  }
};

const persistSubmitted = (set: Set<Category>) => {
  localStorage.setItem(SUBMITTED_KEY, JSON.stringify(Array.from(set)));
};

const HotDealsEventFeedback = () => {
  const [category, setCategory] = useState<Category>("overall");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [submittedSet, setSubmittedSet] = useState<Set<Category>>(new Set());
  const token = useMemo(() => getOrCreateToken(), []);

  useEffect(() => {
    setSubmittedSet(getSubmittedSet());
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("hot_deals_event_feedback")
        .select("id, rating, comment, category, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (mounted && data) setFeedback(data as FeedbackRow[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("hot_deals_event_feedback_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hot_deals_event_feedback" },
        (payload) => {
          setFeedback((prev) => [payload.new as FeedbackRow, ...prev].slice(0, 500));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = feedback.filter((f) => f.category === category);
  const total = filtered.length;
  const avg = total > 0 ? filtered.reduce((s, f) => s + f.rating, 0) / total : 0;
  const recentComments = filtered.filter((f) => f.comment && f.comment.trim().length > 0).slice(0, 8);
  const alreadySubmitted = submittedSet.has(category);

  const handleSubmit = async () => {
    setError(null);
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating");
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from("hot_deals_event_feedback").insert({
      rating,
      comment: comment.trim() || null,
      category,
      session_token: token,
    });
    setSubmitting(false);
    if (insertError) {
      if (insertError.code === "23505") {
        const next = new Set(submittedSet);
        next.add(category);
        setSubmittedSet(next);
        persistSubmitted(next);
      } else {
        setError(insertError.message);
      }
      return;
    }
    const next = new Set(submittedSet);
    next.add(category);
    setSubmittedSet(next);
    persistSubmitted(next);
    setRating(0);
    setComment("");
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border-2 border-orange-500/40"
      style={{
        boxShadow: "0 0 40px rgba(249,115,22,0.1), inset 0 1px 0 rgba(249,115,22,0.05)",
      }}
    >
      <div className="bg-card/60 backdrop-blur-sm p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-orange-400/40"
            style={{
              background: "linear-gradient(135deg, hsl(25 95% 53% / 0.2), hsl(0 72% 51% / 0.1))",
            }}
          >
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-orange-400 font-futuristic tracking-wider uppercase">
              Rate the Experience
            </h3>
            <p className="text-xs text-muted-foreground font-futuristic tracking-wider mt-0.5">
              ANONYMOUS FEEDBACK · NO LOGIN REQUIRED
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-futuristic tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>{feedback.length} TOTAL</span>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={(v) => setCategory(v as Category)} className="mb-5">
          <TabsList className="bg-muted/30 border border-orange-500/20 grid grid-cols-2 sm:grid-cols-4 h-auto">
            {CATEGORIES.map((c) => (
              <TabsTrigger
                key={c.value}
                value={c.value}
                className="font-futuristic tracking-wider text-xs uppercase data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 data-[state=active]:shadow-none"
              >
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT: Submit form OR thanks */}
          <div
            className="rounded-xl border border-orange-500/20 p-4 sm:p-5"
            style={{
              background: "linear-gradient(135deg, hsl(25 95% 53% / 0.04), hsl(0 0% 0% / 0.2))",
            }}
          >
            {alreadySubmitted ? (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-3">
                <CheckCircle2 className="w-12 h-12 text-orange-400" />
                <p className="text-orange-400 font-futuristic tracking-wider font-black text-sm uppercase">
                  Thanks for your feedback
                </p>
                <p className="text-muted-foreground text-xs font-futuristic tracking-wider max-w-xs">
                  Your anonymous rating has been recorded for the {CATEGORIES.find((c) => c.value === category)?.label.toUpperCase()} category.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground font-futuristic tracking-wider mb-3 uppercase">
                  How was the {CATEGORIES.find((c) => c.value === category)?.label}?
                </p>

                {/* Stars */}
                <div className="flex items-center gap-1.5 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (hover || rating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            active ? "fill-orange-400 text-orange-400" : "text-muted-foreground/40"
                          }`}
                        />
                      </button>
                    );
                  })}
                  {rating > 0 && (
                    <span className="ml-2 text-orange-400 font-futuristic font-black text-lg">{rating}/5</span>
                  )}
                </div>

                {/* Comment */}
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground font-futuristic tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    OPTIONAL COMMENT
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share what worked or what could improve..."
                    maxLength={1000}
                    rows={3}
                    className="bg-background/60 border-orange-500/20 focus-visible:ring-orange-400/40 resize-none text-sm"
                  />
                  <div className="text-right text-[10px] text-muted-foreground/60 mt-1 font-mono">
                    {comment.length}/1000
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-futuristic tracking-wider mb-2">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="w-full py-2.5 rounded-lg font-futuristic font-black tracking-wider text-sm uppercase border-2 border-orange-400/40 text-orange-400 hover:bg-orange-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, hsl(25 95% 53% / 0.15), hsl(0 72% 51% / 0.05))",
                  }}
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting..." : "Submit Anonymous Rating"}
                </button>
              </>
            )}
          </div>

          {/* RIGHT: Aggregate */}
          <div
            className="rounded-xl border border-orange-500/20 p-4 sm:p-5"
            style={{
              background: "linear-gradient(135deg, hsl(0 0% 0% / 0.3), hsl(25 95% 53% / 0.04))",
            }}
          >
            <p className="text-xs text-muted-foreground font-futuristic tracking-wider mb-3 uppercase">
              Live Aggregate · {CATEGORIES.find((c) => c.value === category)?.label}
            </p>

            {total === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Star className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm font-futuristic tracking-wider">
                  Be the first to rate
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-3 mb-4">
                  <span
                    className="text-5xl font-black font-futuristic text-transparent bg-clip-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%), hsl(48 96% 53%))",
                    }}
                  >
                    {avg.toFixed(1)}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${
                            n <= Math.round(avg)
                              ? "fill-orange-400 text-orange-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground font-futuristic tracking-wider mt-1">
                      {total} {total === 1 ? "RATING" : "RATINGS"}
                    </span>
                  </div>
                </div>

                {/* Distribution bars */}
                <div className="space-y-1.5 mb-4">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = filtered.filter((f) => f.rating === star).length;
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-muted-foreground font-mono">{star}</span>
                        <Star className="w-3 h-3 text-orange-400/60" />
                        <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background:
                                "linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%), hsl(48 96% 53%))",
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-muted-foreground font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Recent comments */}
                {recentComments.length > 0 && (
                  <>
                    <p className="text-[10px] text-muted-foreground font-futuristic tracking-wider mb-2 uppercase flex items-center gap-1.5">
                      <MessageCircle className="w-3 h-3" /> Recent Anonymous Comments
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                      {recentComments.map((c) => (
                        <div
                          key={c.id}
                          className="text-xs p-2 rounded border border-orange-500/10 bg-background/40"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={`w-2.5 h-2.5 ${
                                  n <= c.rating
                                    ? "fill-orange-400 text-orange-400"
                                    : "text-muted-foreground/20"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-foreground/80 leading-relaxed">{c.comment}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotDealsEventFeedback;
