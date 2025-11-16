import { ArrowBigUp, MessageCircle, Pin, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleUpvote, useUpvotes } from "@/hooks/useComplaints";
import { useNavigate } from "react-router-dom";

interface ComplaintCardProps {
  complaint: {
    id: string;
    title: string;
    description: string;
    status: string;
    is_pinned: boolean;
    is_urgent: boolean;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
}

export const ComplaintCard = ({ complaint }: ComplaintCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: upvotes } = useUpvotes(complaint.id);
  const toggleUpvote = useToggleUpvote();
  const [isUpvoting, setIsUpvoting] = useState(false);

  const isUpvoted = upvotes?.some((upvote) => upvote.user_id === user?.id) || false;
  const upvoteCount = upvotes?.length || 0;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isUpvoting) return;
    setIsUpvoting(true);
    await toggleUpvote.mutateAsync({ complaint_id: complaint.id, user_id: user.id, isUpvoted });
    setIsUpvoting(false);
  };

  return (
    <Card
      className="glass-card glass-hover cursor-pointer"
      onClick={() => navigate(`/complaint/${complaint.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src={complaint.profiles.avatar_url || ""} />
              <AvatarFallback>{complaint.profiles.display_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{complaint.profiles.display_name}</span>
                <span className="text-muted-foreground text-sm">@{complaint.profiles.username}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {complaint.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
                {complaint.is_urgent && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </Badge>
                )}
                <Badge
                  variant={
                    complaint.status === "closed"
                      ? "secondary"
                      : complaint.status === "open"
                      ? "default"
                      : "outline"
                  }
                >
                  {complaint.status}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="font-semibold text-lg">{complaint.title}</h3>
        <p className="text-muted-foreground line-clamp-3">{complaint.description}</p>
        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:text-primary"
            onClick={handleUpvote}
            disabled={isUpvoting}
          >
            <ArrowBigUp className={`h-5 w-5 ${isUpvoted ? "fill-primary text-primary" : ""}`} />
            {upvoteCount > 0 && <span className="font-semibold">{upvoteCount}</span>}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 hover:text-primary">
            <MessageCircle className="h-4 w-4" />
            Reply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
