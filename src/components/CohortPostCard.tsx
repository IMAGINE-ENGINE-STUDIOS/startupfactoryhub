import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, differenceInDays } from 'date-fns';
import { Rocket, Calendar, DollarSign, Percent, Clock, Users, Heart, MessageCircle, Share, Bookmark, Copy, ExternalLink } from 'lucide-react';
import { CohortApplicationDialog } from '@/components/accelerator/CohortApplicationDialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CohortData {
  cohort_id: string;
  name: string;
  description?: string;
  deadline?: string;
  funding?: number;
  equity?: number;
  enrollment_fee?: number;
  industries?: string[];
  accelerator_name?: string;
  accelerator_logo?: string;
  accelerator_id?: string;
  application_url?: string;
}

interface CohortPostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    cohort_data: CohortData;
    profiles?: {
      full_name: string;
      avatar_url?: string;
    } | null;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserClick?: (userId: string) => void;
}

export const CohortPostCard = ({
  post,
  isLiked,
  isBookmarked,
  likesCount,
  commentsCount,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onUserClick
}: CohortPostCardProps) => {
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const { toast } = useToast();
  const cohortData = post.cohort_data;

  if (!cohortData) return null;

  const daysUntilDeadline = cohortData.deadline 
    ? differenceInDays(new Date(cohortData.deadline), new Date())
    : null;

  const applicationUrl = cohortData.application_url || `${window.location.origin}/cohorts/${cohortData.cohort_id}/apply`;

  const copyApplicationLink = () => {
    navigator.clipboard.writeText(applicationUrl);
    toast({ title: 'Application link copied!' });
  };

  const openApplicationPage = () => {
    window.open(applicationUrl, '_blank');
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Gradient glow border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-lg opacity-75 blur" />
        
        <Card className="relative tech-card border-2 border-emerald-400 overflow-hidden">
          {/* Celebration header badge */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 px-4 py-2 border-b flex items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              🚀 New Accelerator Program - Apply Now!
            </span>
          </div>

          {/* Gradient Header */}
          <div className="h-20 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          </div>

          <CardContent className="p-5 -mt-8 relative">
            {/* Accelerator Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar 
                className="w-14 h-14 border-4 border-background cursor-pointer ring-2 ring-emerald-400"
                onClick={() => onUserClick?.(post.user_id)}
              >
                <AvatarImage src={cohortData.accelerator_logo || post.profiles?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  {cohortData.accelerator_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 
                  className="font-bold text-lg hover:text-primary cursor-pointer"
                  onClick={() => onUserClick?.(post.user_id)}
                >
                  {cohortData.accelerator_name || post.profiles?.full_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Posted {format(new Date(post.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Cohort Info */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">{cohortData.name}</h2>
              
              {cohortData.description && (
                <p className="text-muted-foreground">{cohortData.description}</p>
              )}

              {/* Key Details */}
              <div className="flex flex-wrap gap-3">
                {cohortData.deadline && daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{daysUntilDeadline} days left</span>
                  </div>
                )}
                {cohortData.funding && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">${(cohortData.funding / 1000).toFixed(0)}K</span>
                  </div>
                )}
                {cohortData.equity && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <Percent className="w-4 h-4" />
                    <span className="font-medium">{cohortData.equity}% equity</span>
                  </div>
                )}
                {cohortData.enrollment_fee && cohortData.enrollment_fee > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">${(cohortData.enrollment_fee / 100).toLocaleString()} fee</span>
                  </div>
                )}
              </div>

              {/* Industries */}
              {cohortData.industries && cohortData.industries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cohortData.industries.map((industry) => (
                    <Badge key={industry} variant="outline" className="bg-background/50 border-emerald-500/30">
                      {industry}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                  onClick={() => setShowApplicationDialog(true)}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyApplicationLink}
                    title="Copy application link"
                    className="border-emerald-500/30 hover:border-emerald-500/50"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={openApplicationPage}
                    title="Open application page"
                    className="border-emerald-500/30 hover:border-emerald-500/50"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLike}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {likesCount}
                </Button>
                <Button variant="ghost" size="sm" onClick={onComment}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {commentsCount}
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={onShare}>
                  <Share className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBookmark}
                  className={isBookmarked ? 'text-amber-500' : ''}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating rocket emoji */}
        <motion.div 
          className="absolute -top-6 -right-6 text-5xl pointer-events-none"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🚀
        </motion.div>
      </motion.div>

      <CohortApplicationDialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
        cohortData={cohortData}
      />
    </>
  );
};
