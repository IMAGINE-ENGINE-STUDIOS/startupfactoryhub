import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, differenceInDays } from 'date-fns';
import { Rocket, Clock, Users, Heart, MessageCircle, Share, Bookmark, Copy, ExternalLink, Sparkles, Zap, Target } from 'lucide-react';
import { CohortApplicationDialog } from '@/components/accelerator/CohortApplicationDialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';


interface CohortData {
  cohort_id: string;
  name: string;
  description?: string;
  deadline?: string;
  enrollment_fee?: number;
  max_startups?: number;
  current_startups?: number;
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

  const isMvp = /mvp/i.test(cohortData.name || '') || /mvp/i.test(cohortData.accelerator_name || '') || /mvp/i.test(post.content || '');

  return (
    <>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Animated gradient glow border — stronger for MVP */}
        <div
          className={isMvp
            ? 'absolute -inset-0.5 rounded-lg opacity-100 blur bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 animate-pulse'
            : 'absolute -inset-0.5 rounded-lg opacity-75 blur bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
          }
        />
        {isMvp && (
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-cyan-500/30 blur-lg animate-pulse pointer-events-none" />
        )}

        <Card className={isMvp ? 'relative overflow-hidden border-2 border-fuchsia-400 tech-card' : 'relative overflow-hidden border-2 border-emerald-400 tech-card'}>
          {/* Celebration header badge */}
          <div
            className={isMvp
              ? 'px-3 sm:px-4 py-2 border-b grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-gradient-to-r from-violet-950/80 via-fuchsia-950/80 to-slate-950/80'
              : 'px-3 sm:px-4 py-2 border-b grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50'
            }
          >
            {isMvp ? (
              <>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-5 h-5 text-fuchsia-400" />
                </motion.div>
                <div className="min-w-0">
                  <span className="min-w-0 truncate text-xs sm:text-sm font-bold text-fuchsia-300 uppercase tracking-wide block">
                    MVP Development Program — Apply Now
                  </span>
                  <p className="text-[10px] text-fuchsia-200/70 truncate hidden sm:block">
                    Limited batch. Build your product in weeks.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="min-w-0 truncate text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  New Accelerator Program - Apply Now!
                </span>
              </>
            )}
            <div className="pointer-events-none h-8 w-8 shrink-0 relative isolate overflow-visible">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: isMvp ? 'conic-gradient(from 0deg, transparent, #d946ef, #22d3ee, transparent)' : 'conic-gradient(from 0deg, transparent, #10b981, #06b6d4, transparent)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className={isMvp ? 'absolute inset-0 rounded-full blur-lg bg-fuchsia-500/50' : 'absolute inset-0 rounded-full blur-lg bg-emerald-500/40'}
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center border border-white/10">
                {isMvp ? (
                  <Zap className="h-4 w-4 text-fuchsia-300" strokeWidth={2.2} />
                ) : (
                  <Rocket className="h-4 w-4 text-emerald-300" strokeWidth={2.2} />
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-5 relative">
            {/* MVP floating spotlight */}
            {isMvp && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-fuchsia-500/10 blur-3xl"
                  animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.1, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl"
                  animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.15, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            )}

            {/* Accelerator Info */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <Avatar 
                className={`w-12 h-12 shrink-0 border-2 border-background cursor-pointer ring-2 ${isMvp ? 'ring-fuchsia-400' : 'ring-emerald-400'}`}
                onClick={() => onUserClick?.(post.user_id)}
              >
                <AvatarImage src={cohortData.accelerator_logo || post.profiles?.avatar_url} />
                <AvatarFallback className={`text-white ${isMvp ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'}`}>
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
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <h2
                    className={`text-xl font-bold text-foreground ${hasApplicationTarget ? 'cursor-pointer hover:text-emerald-500 transition-colors' : ''} ${isMvp ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300' : ''}`}
                    onClick={hasApplicationTarget ? openApplicationPage : undefined}
                  >
                    {cohortData.name}
                  </h2>
                  {isMvp && (
                    <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 text-[10px] px-2 py-0.5 h-5 animate-pulse">
                      <Target className="w-3 h-3 mr-1" />
                      HIGH PRIORITY
                    </Badge>
                  )}
                </div>

                {cohortData.description && (
                  <p className="text-muted-foreground line-clamp-3">{cohortData.description}</p>
                )}
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-stretch">
                <StatTile
                  icon={Clock}
                  label="Deadline"
                  value={daysUntilDeadline !== null && daysUntilDeadline >= 0 ? `${daysUntilDeadline} days left` : cohortData.deadline ? format(new Date(cohortData.deadline), 'MMM d, yyyy') : null}
                  tone={isMvp ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}
                />
                <StatTile
                  icon={Users}
                  label="Spots left"
                  value={cohortData.max_startups && cohortData.current_startups !== undefined ? `${Math.max(0, cohortData.max_startups - cohortData.current_startups)} / ${cohortData.max_startups}` : null}
                  tone={isMvp ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}
                />
                <StatTile
                  icon={DollarIcon}
                  label="Program fee"
                  value={cohortData.enrollment_fee && cohortData.enrollment_fee > 0 ? `$${(cohortData.enrollment_fee / 100).toLocaleString()}` : null}
                  tone={isMvp ? 'bg-pink-500/15 text-pink-300 border-pink-500/30' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                />
              </div>

              {/* Industries */}
              {cohortData.industries && cohortData.industries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cohortData.industries.map((industry) => (
                    <Badge key={industry} variant="outline" className={isMvp ? 'bg-background/50 border-fuchsia-500/40 text-fuchsia-200' : 'bg-background/50 border-emerald-500/30'}>
                      {industry}
                    </Badge>
                  ))}
                </div>
              )}

              {/* MVP Urgency Banner */}
              {isMvp && (
                <MvpUrgencyBanner />
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <motion.div
                  className="contents"
                  whileHover={isMvp ? { scale: 1.02 } : undefined}
                  whileTap={isMvp ? { scale: 0.98 } : undefined}
                >
                  <Button 
                    className={`w-full min-w-0 px-3 shadow-lg ${
                      isMvp
                        ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 shadow-fuchsia-500/25 animate-pulse'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'
                    }`}
                    onClick={handleApplyNow}
                    disabled={!hasApplicationTarget}
                    title={hasApplicationTarget ? 'Apply to this program' : 'This program has no application form yet'}
                  >
                    {isMvp && <Sparkles className="w-4 h-4 mr-2 shrink-0" />}
                    {!isMvp && <Rocket className="w-4 h-4 mr-2 shrink-0" />}
                    <span className="truncate">{isMvp ? 'Apply to MVP Batch' : 'Apply Now'}</span>
                  </Button>
                </motion.div>
                <Button
                  variant="outline"
                  className={isMvp ? 'w-full min-w-0 px-3 border-fuchsia-500/40 hover:border-fuchsia-500/70 hover:bg-fuchsia-500/10' : 'w-full min-w-0 px-3 border-emerald-500/30 hover:border-emerald-500/50'}
                  onClick={openApplicationPage}
                  disabled={!hasApplicationTarget}
                  title={hasApplicationTarget ? 'View the application page' : 'This program has no application page yet'}
                >
                  <ExternalLink className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">View Application</span>
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyApplicationLink}
                  disabled={!shareUrl}
                  title="Copy application link"
                  className={isMvp ? 'w-full sm:w-10 border-fuchsia-500/40 hover:border-fuchsia-500/70 hover:bg-fuchsia-500/10' : 'w-full sm:w-10 border-emerald-500/30 hover:border-emerald-500/50'}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50 relative z-10">
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

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string | null; tone: string }) {
  return (
    <div className={`flex h-full min-w-0 flex-col justify-center gap-1 rounded-lg border px-2.5 py-2 ${value ? tone : 'bg-muted/30 text-muted-foreground border-border/50'}`}>
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] leading-tight uppercase tracking-wide opacity-80 break-words">{label}</span>
      </div>
      <span className="font-semibold text-sm leading-tight break-words">{value || '—'}</span>
    </div>
  );
}

function DollarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function PercentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="19" x2="5" y1="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function MvpUrgencyBanner() {
  const glow = {
    boxShadow: [
      '0 0 0 rgba(217,70,239,0)',
      '0 0 20px rgba(217,70,239,0.15)',
      '0 0 0 rgba(217,70,239,0)'
    ]
  };
  return (
    <motion.div
      className="rounded-lg border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/40 to-violet-950/40 p-3 flex items-center gap-3"
      animate={glow}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="h-10 w-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center shrink-0">
        <Rocket className="h-5 w-5 text-fuchsia-300" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fuchsia-200">This is where you apply to build your MVP</p>
        <p className="text-xs text-fuchsia-200/70 truncate">
          Join the batch, get mentorship, and launch in weeks.
        </p>
      </div>
    </motion.div>
  );
}
