import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReplies, useCreateReply } from "@/hooks/useReplies";
import { useToggleLike, useLikes } from "@/hooks/usePosts";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, Loader2, Send } from "lucide-react";
import { ReplyItem } from "@/components/ReplyItem";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`id, content, created_at, user_id, image_url, profiles:profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: replies, isLoading: loadingReplies } = useReplies(id);
  const { data: likes } = useLikes(id);
  const createReply = useCreateReply();
  const toggleLike = useToggleLike();

  const isLiked = likes?.some((like) => like.user_id === user?.id) || false;
  const likeCount = likes?.length || 0;

  const handleReply = async () => {
    if (!replyContent.trim() || !user) return;
    await createReply.mutateAsync({ content: replyContent, user_id: user.id, post_id: id });
    setReplyContent("");
  };

  const handleLike = async () => {
    if (!user) return;
    await toggleLike.mutateAsync({ post_id: id!, user_id: user.id, isLiked });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Post not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={post.profiles?.avatar_url || ""} />
                <AvatarFallback>{post.profiles?.display_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{post.profiles?.display_name}</span>
                  <span className="text-muted-foreground">@{post.profiles?.username}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post" 
                className="rounded-lg max-h-[500px] w-full object-cover"
              />
            )}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="gap-2 hover:text-primary" onClick={handleLike}>
                <Heart className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                <span className="font-semibold">{likeCount}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <h2 className="text-xl font-semibold">Replies ({replies?.length || 0})</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea placeholder="Write a reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="min-h-[100px] bg-background/50 resize-none" />
              <div className="flex justify-end">
                <Button onClick={handleReply} disabled={createReply.isPending} className="gap-2">
                  {createReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Reply
                </Button>
              </div>
            </div>

            {loadingReplies ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : replies && replies.length > 0 ? (
              <div className="space-y-6 pt-4">
                {replies.map((reply: any) => (
                  <ReplyItem key={reply.id} reply={reply} postId={id} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No replies yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
