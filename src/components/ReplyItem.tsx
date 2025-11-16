import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateReply } from "@/hooks/useReplies";
import { useToggleReplyLike, useReplyLikes } from "@/hooks/useReplyLikes";

interface ReplyItemProps {
  reply: any;
  postId?: string;
  complaintId?: string;
  level?: number;
}

export function ReplyItem({ reply, postId, complaintId, level = 0 }: ReplyItemProps) {
  const { user } = useAuth();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createReply = useCreateReply();
  const { data: likes } = useReplyLikes(reply.id);
  const toggleLike = useToggleReplyLike();

  const isLiked = likes?.some((like) => like.user_id === user?.id) || false;
  const likeCount = likes?.length || 0;

  const handleReply = async () => {
    if (!replyContent.trim() || !user) return;
    await createReply.mutateAsync({
      content: replyContent,
      user_id: user.id,
      post_id: postId,
      complaint_id: complaintId,
      parent_reply_id: reply.id,
    });
    setReplyContent("");
    setShowReplyBox(false);
  };

  const handleLike = async () => {
    if (!user) return;
    await toggleLike.mutateAsync({ reply_id: reply.id, user_id: user.id, isLiked });
  };

  return (
    <div className={`${level > 0 ? 'ml-12 mt-3' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={reply.profiles?.avatar_url || ""} />
          <AvatarFallback>{reply.profiles?.display_name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{reply.profiles?.display_name}</span>
            <span className="text-muted-foreground text-xs">@{reply.profiles?.username}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground">{reply.content}</p>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 px-2 hover:text-primary"
              onClick={handleLike}
            >
              <Heart className={`h-3 w-3 ${isLiked ? "fill-primary text-primary" : ""}`} />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>
            
            {level < 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7 px-2 hover:text-primary"
                onClick={() => setShowReplyBox(!showReplyBox)}
              >
                <MessageCircle className="h-3 w-3" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
          </div>

          {showReplyBox && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] bg-background/50 resize-none text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={createReply.isPending || !replyContent.trim()}
                  className="gap-2"
                >
                  {createReply.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Reply
                </Button>
              </div>
            </div>
          )}

          {reply.replies && reply.replies.length > 0 && (
            <div className="space-y-3 mt-3">
              {reply.replies.map((childReply: any) => (
                <ReplyItem
                  key={childReply.id}
                  reply={childReply}
                  postId={postId}
                  complaintId={complaintId}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}