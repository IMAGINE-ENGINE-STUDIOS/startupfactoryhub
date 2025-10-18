import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  pageNum: number;
  text: string;
  x: number;
  y: number;
  author: string;
  timestamp: Date;
  resolved: boolean;
}

interface PDFCommentsPanelProps {
  comments: Comment[];
  currentPage: number;
  onAddComment: (text: string, x: number, y: number) => void;
  onDeleteComment: (id: string) => void;
  onResolveComment: (id: string) => void;
  onJumpToComment: (pageNum: number, x: number, y: number) => void;
}

export const PDFCommentsPanel = ({
  comments,
  currentPage,
  onAddComment,
  onDeleteComment,
  onResolveComment,
  onJumpToComment
}: PDFCommentsPanelProps) => {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const pageComments = comments.filter(c => c.pageNum === currentPage && !c.resolved);
  const allComments = comments.filter(c => !c.resolved);

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    // Add comment at center of current page
    onAddComment(newComment, 300, 400);
    setNewComment("");
    toast({
      title: "Success",
      description: "Comment added",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </h3>
      </div>

      <div className="p-4 border-b">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleAddComment} size="sm" className="w-full">
          Add Comment
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <div className="text-sm font-medium">
            Page {currentPage} ({pageComments.length})
          </div>
          {pageComments.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No comments on this page
            </div>
          )}
          {pageComments.map((comment) => (
            <Card key={comment.id} className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs text-muted-foreground">
                  {comment.author} • {comment.timestamp.toLocaleDateString()}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onResolveComment(comment.id)}
                    className="h-6 w-6 p-0"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteComment(comment.id)}
                    className="h-6 w-6 p-0 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-sm">{comment.text}</p>
            </Card>
          ))}

          {allComments.length > pageComments.length && (
            <>
              <Separator className="my-4" />
              <div className="text-sm font-medium">
                All Pages ({allComments.length - pageComments.length} more)
              </div>
              {allComments
                .filter(c => c.pageNum !== currentPage)
                .map((comment) => (
                  <Card
                    key={comment.id}
                    className="p-3 cursor-pointer hover:bg-accent"
                    onClick={() => onJumpToComment(comment.pageNum, comment.x, comment.y)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-muted-foreground">
                        Page {comment.pageNum} • {comment.author}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteComment(comment.id);
                        }}
                        className="h-6 w-6 p-0 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </Card>
                ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};