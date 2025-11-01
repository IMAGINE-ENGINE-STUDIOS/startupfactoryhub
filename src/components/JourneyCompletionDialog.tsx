import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, Share2, Sparkles } from "lucide-react";

interface JourneyCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: () => void;
  totalSteps: number;
}

export default function JourneyCompletionDialog({
  open,
  onOpenChange,
  onShare,
  totalSteps
}: JourneyCompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Confetti Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{
                x: "50%",
                y: "50%",
                opacity: 1
              }}
              animate={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                opacity: 0,
                rotate: Math.random() * 360
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05
              }}
            >
              {["🎉", "✨", "🎊", "⭐", "🏆"][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </motion.div>

        <DialogHeader className="text-center space-y-4 relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mx-auto"
          >
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold">
            🎉 Congratulations!
          </DialogTitle>
          
          <DialogDescription className="text-base">
            You've completed all {totalSteps} steps of your startup journey! 
            This is a huge milestone - share your achievement with the community!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6 relative z-10">
          <Button
            onClick={onShare}
            className="w-full gap-2"
            size="lg"
          >
            <Share2 className="w-4 h-4" />
            Share with Community
          </Button>
          
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground relative z-10">
          <Sparkles className="w-4 h-4" />
          <span>Your achievement will be celebrated on the feed</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
