/**
 * PlanBrochureOverlay — opens the Basic Plan or Investor Priority flipbook
 * brochures as a glass popup layered on top of the current page (no route
 * change). The brochures render in `embedded` mode: no <Navigation /> and no
 * "Back" button, since the overlay provides its own close affordance.
 *
 * Usage:
 *   const [plan, setPlan] = useState<PlanOverlayKind | null>(null);
 *   <PlanBrochureOverlay plan={plan} onClose={() => setPlan(null)} />
 */
import { Suspense, lazy, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

export type PlanOverlayKind = "basic" | "investor";

const BasicPlanBrochure = lazy(() => import("@/pages/BasicPlanBrochure"));
const InvestorPlanBrochure = lazy(() => import("@/pages/InvestorPlanBrochure"));

interface Props {
  plan: PlanOverlayKind | null;
  onClose: () => void;
}

const PlanBrochureOverlay = ({ plan, onClose }: Props) => {
  // Lock body scroll while the overlay is open; close on Escape.
  useEffect(() => {
    if (!plan) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [plan, onClose]);

  return createPortal(
    <AnimatePresence>
      {plan && (
        <motion.div
          key="plan-brochure-overlay"
          className="fixed inset-0 z-[95]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* dim layer */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          {/* close button */}
          <button
            onClick={onClose}
            aria-label="Close plan brochure"
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-full bg-card/90 border border-border/60 hover:border-primary/50 flex items-center justify-center shadow-xl transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {/* scrollable brochure surface */}
          <motion.div
            role="dialog"
            aria-label={plan === "basic" ? "Basic Plan brochure" : "Investor Priority brochure"}
            className="absolute inset-0 overflow-y-auto overscroll-contain"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              }
            >
              {plan === "basic" ? <BasicPlanBrochure embedded /> : <InvestorPlanBrochure embedded />}
            </Suspense>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PlanBrochureOverlay;
