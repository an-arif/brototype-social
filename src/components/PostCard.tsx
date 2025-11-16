import { Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useLikes } from "@/hooks/usePosts";
import { useNavigate } from "react-router-dom";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
}

export const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: likes } = useLikes(post.id);
  const toggleLike = useToggleLike();
  const [isLiking, setIsLiking] = useState(false);

  const isLiked = likes?.some((like) => like.user_id === user?.id) || false;
  const likeCount = likes?.length || 0;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLiking) return;
    setIsLiking(true);
    await toggleLike.mutateAsync({ post_id: post.id, user_id: user.id, isLiked });
    setIsLiking(false);
  };

  return (
    <Card className="glass-card glass-hover cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={post.profiles.avatar_url || ""} />
            <AvatarFallback>{post.profiles.display_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.profiles.display_name}</span>
              <span className="text-muted-foreground">@{post.profiles.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-foreground leading-relaxed">{post.content}</p>
            <div className="flex items-center gap-6 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:text-primary"
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-primary text-primary" : ""}`} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 hover:text-primary">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
