import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Share, Repeat2, Linkedin, Bookmark, Trash2, Send, CornerDownRight, X } from 'lucide-react';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import OfficialBadge from './OfficialBadge';

interface FeedPostCardProps {
  post: any;
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  comments: any[];
  expandedComments: boolean;
  newComment: string;
  currentUserId?: string;
  isAdmin: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onRepost: () => void;
  onLinkedInShare: () => void;
  onDelete: () => void;
  onUserClick: (userId: string) => void;
  onCommentChange: (value: string) => void;
  onCommentSubmit: () => void;
  onReplySubmit: (parentCommentId: string, content: string) => void;
  onImageClick: (urls: string[], idx: number) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getRoleBadgeColor = (role: string | null) => {
  switch (role) {
    case 'startup':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'investor':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'mentor':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'advisor':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'student':
      return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
    case 'accelerator':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getRoleLabel = (role: string | null) => {
  if (!role) return null;
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export function FeedPostCard({
  post,
  isLiked,
  isBookmarked,
  likesCount,
  commentsCount,
  comments,
  expandedComments,
  newComment,
  currentUserId,
  isAdmin,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onRepost,
  onLinkedInShare,
  onDelete,
  onUserClick,
  onCommentChange,
  onCommentSubmit,
  onReplySubmit,
  onImageClick
}: FeedPostCardProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const buildCommentTree = (flat: any[]) => {
    const map = new Map<string, any>();
    flat.forEach(c => map.set(c.id, { ...c, replies: [] }));
    const roots: any[] = [];
    flat.forEach(c => {
      const node = map.get(c.id);
      if (c.parent_comment_id && map.has(c.parent_comment_id)) {
        map.get(c.parent_comment_id).replies.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: any; depth?: number }) => (
    <div className={depth > 0 ? 'ml-6 sm:ml-8 border-l border-white/10 pl-3 sm:pl-4 mt-2' : ''}>
      <div className="flex gap-2 sm:gap-3">
        <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
          {comment.profiles?.avatar_url ? (
            <AvatarImage src={comment.profiles.avatar_url} alt={comment.profiles.full_name || ''} />
          ) : null}
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[10px]">
            {comment.profiles?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-foreground truncate">
              {comment.profiles?.full_name || 'Anonymous'}
            </p>
            <span className="text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-xs text-foreground/80 break-words whitespace-pre-wrap">{comment.content}</p>
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="text-[11px] text-muted-foreground hover:text-primary transition-colors mt-1 flex items-center gap-1"
          >
            {replyTo === comment.id ? (
              <><X className="h-3 w-3" /> Cancel</>
            ) : (
              <><CornerDownRight className="h-3 w-3" /> Reply</>
            )}
          </button>

          {replyTo === comment.id && (
            <div className="flex gap-2 mt-2">
              <Input
                placeholder={`Reply to ${comment.profiles?.full_name || 'Anonymous'}...`}
                value={replyDraft}
                onChange={e => setReplyDraft(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter' && replyDraft.trim()) {
                    onReplySubmit(comment.id, replyDraft.trim());
                    setReplyDraft('');
                    setReplyTo(null);
                  }
                }}
                className="flex-1 text-xs bg-white/5 border-white/10 placeholder:text-muted-foreground/50 focus-visible:ring-primary h-8"
                autoFocus
              />
              <Button
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-foreground h-8 px-2.5"
                onClick={() => {
                  if (!replyDraft.trim()) return;
                  onReplySubmit(comment.id, replyDraft.trim());
                  setReplyDraft('');
                  setReplyTo(null);
                }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {comment.replies?.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply: any) => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="group/post relative">
      {/* Decorative prism glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[24px] blur-xl opacity-40 group-hover/post:opacity-80 transition duration-1000 group-hover/post:duration-200 pointer-events-none" />

      <Card className="relative bg-card/60 backdrop-blur-2xl border border-white/10 rounded-[22px] overflow-hidden shadow-2xl transition-all duration-300 hover:bg-card/70">
        {/* Top accent line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent p-[1.5px]">
                  <Avatar
                    className="h-full w-full rounded-full bg-card cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onUserClick(post.user_id)}
                  >
                    {post.profiles?.avatar_url ? (
                      <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.full_name || ''} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                      {post.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <OnlineStatusIndicator userId={post.user_id} size="sm" className="absolute bottom-0 right-0" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className="text-foreground font-semibold text-sm tracking-tight truncate cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onUserClick(post.user_id)}
                  >
                    {post.profiles?.full_name || 'Anonymous User'}
                  </h4>
                  {post.profiles?.is_official_mentor && <OfficialBadge size="sm" role={post.user_role || undefined} />}
                  {post.user_role && (
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${getRoleBadgeColor(post.user_role)}`}>
                      {getRoleLabel(post.user_role)}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground/70 text-[11px] uppercase tracking-widest font-medium truncate">
                  {post.company_name ? `@ ${post.company_name}` : ''}
                  {post.company_name ? ' • ' : ''}
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>

            {(currentUserId === post.user_id || isAdmin) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-white/5 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="tech-card border-0">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isAdmin && post.user_id !== currentUserId
                        ? 'You are deleting this post as an admin. This will permanently remove the post and all associated media.'
                        : 'This action cannot be undone. This will permanently delete your post.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words text-[15px]">
              {post.content}
            </p>

            {post.media_urls && post.media_urls.length > 0 && (
              <div className={`grid gap-2 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.media_urls.filter(Boolean).map((url: string, idx: number) => {
                  const isVideo =
                    url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov') || url?.includes('video');
                  return isVideo ? (
                    <video
                      key={idx}
                      src={url}
                      controls
                      className="w-full rounded-xl max-h-64 sm:max-h-96 object-cover border border-white/5"
                    />
                  ) : (
                    <div
                      key={idx}
                      className="relative cursor-pointer group/media overflow-hidden rounded-xl border border-white/5"
                      onClick={() => onImageClick(post.media_urls!, idx)}
                    >
                      <img
                        src={url}
                        alt={`Media ${idx + 1}`}
                        className="w-full max-h-64 sm:max-h-96 object-cover transition-transform duration-500 group-hover/media:scale-105"
                      />
                      {post.media_urls!.length > 1 && idx === 0 && (
                        <Badge className="absolute top-2 right-2 bg-black/60 text-white border-none text-xs">
                          1/{post.media_urls!.length}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={onLike} className="flex items-center gap-2 group/btn">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked ? 'bg-pink-500/20' : 'bg-white/5 group-hover/btn:bg-pink-500/20'
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      isLiked ? 'text-pink-500 fill-current' : 'text-muted-foreground group-hover/btn:text-pink-500'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isLiked ? 'text-pink-500' : 'text-muted-foreground group-hover/btn:text-foreground'
                  }`}
                >
                  {likesCount}
                </span>
              </button>

              <button onClick={onComment} className="flex items-center gap-2 group/btn">
                <div className="p-2 rounded-lg bg-white/5 group-hover/btn:bg-blue-500/20 transition-colors">
                  <MessageCircle className="h-4 w-4 text-muted-foreground group-hover/btn:text-blue-500 transition-colors" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover/btn:text-foreground transition-colors">
                  {commentsCount}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onShare}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 group/share"
              >
                <Share className="h-4 w-4 text-muted-foreground group-hover/share:text-foreground transition-colors" />
                <span className="text-xs font-bold text-muted-foreground group-hover/share:text-foreground hidden sm:inline transition-colors">
                  Share
                </span>
              </button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-[#0077B5]"
                onClick={onLinkedInShare}
                title="Share to LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 ${
                  isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
                onClick={onBookmark}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground"
                onClick={onRepost}
                title="Repost"
              >
                <Repeat2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Comments */}
          {(commentsCount > 0 || expandedComments || newComment) && (
            <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
              {!expandedComments && commentsCount > 0 && (
                <div className="space-y-3">
                  {(post.post_comments || []).slice(0, 2).map((comment: any) => (
                    <div key={comment.id} className="flex gap-2 sm:gap-3">
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                        {comment.profiles?.avatar_url ? (
                          <AvatarImage src={comment.profiles.avatar_url} alt={comment.profiles.full_name || ''} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[10px]">
                          {comment.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {comment.profiles?.full_name || 'Anonymous'}
                          </p>
                          <span className="text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-xs text-foreground/80 break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {commentsCount > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-primary"
                      onClick={onComment}
                    >
                      View all {commentsCount} comments
                    </Button>
                  )}
                </div>
              )}

              {expandedComments && (
                <div className="space-y-3">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2 sm:gap-3">
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                        {comment.profiles?.avatar_url ? (
                          <AvatarImage src={comment.profiles.avatar_url} alt={comment.profiles.full_name || ''} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[10px]">
                          {comment.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {comment.profiles?.full_name || 'Anonymous'}
                          </p>
                          <span className="text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-xs text-foreground/80 break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {commentsCount > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-primary"
                      onClick={onComment}
                    >
                      Show less
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder={commentsCount === 0 ? 'Be the first to comment...' : 'Write a comment...'}
                  value={newComment}
                  onChange={e => onCommentChange(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') onCommentSubmit();
                  }}
                  className="flex-1 text-sm bg-white/5 border-white/10 placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                />
                <Button onClick={onCommentSubmit} size="sm" className="bg-white/10 hover:bg-white/20 text-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
