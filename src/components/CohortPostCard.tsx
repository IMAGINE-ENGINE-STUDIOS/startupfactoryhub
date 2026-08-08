import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const cohortData = post.cohort_data;

  if (!cohortData) return null;

  const daysUntilDeadline = cohortData.deadline 
    ? differenceInDays(new Date(cohortData.deadline), new Date())
    : null;

  // A stored application_url is only trusted when it points at a genuine external
  // form. Links baked from an old preview/sandbox origin are dead, so they are
  // always rebuilt from the cohort id at display time.
  const isEphemeralHost = (host: string) =>
    host.endsWith('.lovableproject.com') ||
    host.endsWith('.sandbox.lovable.dev') ||
    host.startsWith('id-preview--');

  const internalPath = cohortData.cohort_id ? `/cohorts/${cohortData.cohort_id}/apply` : null;

  let externalUrl: string | null = null;
  if (cohortData.application_url) {
    try {
      const parsed = new URL(cohortData.application_url, window.location.origin);
      const isSameOrigin = parsed.origin === window.location.origin;
      if (!isSameOrigin && !isEphemeralHost(parsed.hostname)) {
        externalUrl = parsed.toString();
      }
    } catch {
      externalUrl = null;
    }
  }

  const hasApplicationTarget = Boolean(externalUrl || internalPath);
  const shareUrl = externalUrl || (internalPath ? `${window.location.origin}${internalPath}` : '');

  const copyApplicationLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Application link copied!' });
  };

  const openApplicationPage = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else if (internalPath) {
      navigate(internalPath);
    }
  };

  const handleApplyNow = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else if (cohortData.cohort_id) {
      setShowApplicationDialog(true);
    }
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
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 px-3 sm:px-4 py-2 border-b grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="min-w-0 truncate text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              New Accelerator Program - Apply Now!
            </span>
            <div className="pointer-events-none h-8 w-8 shrink-0 relative isolate overflow-visible">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: 'conic-gradient(from 0deg, transparent, #10b981, #06b6d4, transparent)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-500/40 blur-lg"
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center border border-white/10">
                <Rocket className="h-4 w-4 text-emerald-300" strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <CardContent className="p-5 relative">
            {/* Accelerator Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar 
                className="w-12 h-12 shrink-0 border-2 border-background cursor-pointer ring-2 ring-emerald-400"
                onClick={() => onUserClick?.(post.user_id)}
              >
                <AvatarImage src={cohortData.accelerator_logo || post.profiles?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  {cohortData.accelerator_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 
                  className="font-bold text-lg truncate hover:text-primary cursor-pointer"
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
            <div className="space-y-4">
              <div className="space-y-2">
                <h2
                  className={`text-xl font-bold text-foreground ${hasApplicationTarget ? 'cursor-pointer hover:text-emerald-500 transition-colors' : ''}`}
                  onClick={hasApplicationTarget ? openApplicationPage : undefined}
                >
                  {cohortData.name}
                </h2>

                {cohortData.description && (
                  <p className="text-muted-foreground line-clamp-3">{cohortData.description}</p>
                )}
              </div>

              {/* Key Details — fixed symmetric grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-stretch">
                {[
                  {
                    key: 'deadline',
                    icon: Clock,
                    label: 'Deadline',
                    value:
                      daysUntilDeadline !== null && daysUntilDeadline > 0
                        ? `${daysUntilDeadline} days left`
                        : cohortData.deadline
                          ? 'Closed'
                          : null,
                    tone: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                  },
                  {
                    key: 'funding',
                    icon: DollarSign,
                    label: 'Funding',
                    value: cohortData.funding ? `$${(cohortData.funding / 1000).toFixed(0)}K` : null,
                    tone: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                  },
                  {
                    key: 'equity',
                    icon: Percent,
                    label: 'Equity',
                    value: cohortData.equity ? `${cohortData.equity}%` : null,
                    tone: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                  },
                  {
                    key: 'fee',
                    icon: Users,
                    label: 'Program fee',
                    value:
                      cohortData.enrollment_fee && cohortData.enrollment_fee > 0
                        ? `$${(cohortData.enrollment_fee / 100).toLocaleString()}`
                        : null,
                    tone: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                  },
                ].map(({ key, icon: Icon, label, value, tone }) => (
                  <div
                    key={key}
                    className={`flex h-full flex-col justify-center gap-1 rounded-lg border px-3 py-2 ${
                      value ? tone : 'bg-muted/30 text-muted-foreground border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] uppercase tracking-wide opacity-80 truncate">{label}</span>
                    </div>
                    <span className="font-semibold text-sm truncate">{value || '—'}</span>
                  </div>
                ))}
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

              {/* Action Buttons — symmetric, equal width */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                  onClick={handleApplyNow}
                  disabled={!hasApplicationTarget}
                  title={hasApplicationTarget ? 'Apply to this program' : 'This program has no application form yet'}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-emerald-500/30 hover:border-emerald-500/50"
                  onClick={openApplicationPage}
                  disabled={!hasApplicationTarget}
                  title={hasApplicationTarget ? 'View the application page' : 'This program has no application page yet'}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Application Page
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyApplicationLink}
                  disabled={!shareUrl}
                  title="Copy application link"
                  className="w-full sm:w-10 border-emerald-500/30 hover:border-emerald-500/50"
                >
                  <Copy className="w-4 h-4" />
                </Button>
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
      </motion.div>

      <CohortApplicationDialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
        cohortData={cohortData}
      />
    </>
  );
};
