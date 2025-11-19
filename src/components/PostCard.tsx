import { Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useLikes } from "@/hooks/usePosts";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminBadge } from "@/components/AdminBadge";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string | null;
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
  const { data: userRole } = useUserRole(post.user_id);

  const isLiked = likes?.some((like) => like.user_id === user?.id) || false;
  const likeCount = likes?.length || 0;
  const isPostFromAdmin = userRole?.role === "admin";

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
          <Avatar 
            className="h-12 w-12 border-2 border-border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${post.user_id}`);
            }}
          >
            <AvatarImage src={post.profiles.avatar_url || ""} />
            <AvatarFallback>{post.profiles.display_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="font-semibold cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${post.user_id}`);
                }}
              >
                {post.profiles.display_name}
              </span>
              <span className="text-muted-foreground">@{post.profiles.username}</span>
              {isPostFromAdmin && <AdminBadge />}
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-foreground leading-relaxed">{post.content}</p>
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post" 
                className="rounded-lg mt-3 max-h-[400px] w-full object-cover"
              />
            )}
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
