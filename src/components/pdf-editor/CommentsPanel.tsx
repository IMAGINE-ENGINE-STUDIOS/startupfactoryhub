import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Check, X, Trash2, CornerDownRight } from 'lucide-react';
import { useComments, Comment, CommentReply } from '@/hooks/useComments';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface CommentsPanelProps {
  sessionId: string | null;
  currentPage: number;
}

export const CommentsPanel = ({ sessionId, currentPage }: CommentsPanelProps) => {
  const { comments, isLoading, addReply, toggleResolved, deleteComment } = useComments(sessionId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredComments = comments.filter(c => c.page_number === currentPage);

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    await addReply(commentId, replyText);
    setReplyText('');
    setReplyingTo(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-semibold">Comments</h3>
          <Badge variant="secondary" className="ml-auto">
            {filteredComments.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Page {currentPage}
        </p>
      </div>

      <ScrollArea className="flex-1">
        {filteredComments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments on this page</p>
            <p className="text-xs mt-1">Click on the PDF to add annotations</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className={`p-3 rounded-lg border ${comment.resolved ? 'bg-muted/50 opacity-75' : 'bg-background'}`}>
                  {/* Comment Header */}
                  <div className="flex items-start gap-2 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {comment.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {comment.user?.full_name || 'Unknown User'}
                        </p>
                        {comment.resolved && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>

                  {/* Comment Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <CornerDownRight className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleResolved(comment.id, !comment.resolved)}
                    >
                      {comment.resolved ? (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Reopen
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Resolve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {comment.replies.map((reply: CommentReply) => (
                      <div key={reply.id} className="p-2 rounded-lg bg-muted/50 border">
                        <div className="flex items-start gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {reply.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium truncate">
                                {reply.user?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <p className="text-xs mt-1 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="ml-8">
                    <div className="flex gap-2">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="min-h-[60px] text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(comment.id);
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim()}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
