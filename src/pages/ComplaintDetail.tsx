import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReplies, useCreateReply } from "@/hooks/useReplies";
import { useUpdateComplaint, useToggleUpvote, useUpvotes } from "@/hooks/useComplaints";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowBigUp, Pin, AlertCircle, Loader2, Send, CheckCircle, XCircle, Shield } from "lucide-react";

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const { data: userRole } = useUserRole(user?.id);
  const isAdmin = userRole?.role === "admin";

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select(`id, title, description, status, is_pinned, is_urgent, created_at, user_id, profiles:profiles!complaints_user_id_fkey(username, display_name, avatar_url)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: replies, isLoading: loadingReplies } = useReplies(undefined, id);
  const { data: upvotes } = useUpvotes(id);
  const createReply = useCreateReply();
  const updateComplaint = useUpdateComplaint();
  const toggleUpvote = useToggleUpvote();

  const isUpvoted = upvotes?.some((upvote) => upvote.user_id === user?.id) || false;
  const upvoteCount = upvotes?.length || 0;

  const handleReply = async (isOfficial = false) => {
    if (!replyContent.trim() || !user) return;
    await createReply.mutateAsync({ content: replyContent, user_id: user.id, complaint_id: id, is_official: isOfficial });
    setReplyContent("");
  };

  const handleUpvote = async () => {
    if (!user) return;
    await toggleUpvote.mutateAsync({ complaint_id: id!, user_id: user.id, isUpvoted });
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

  if (!complaint) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Complaint not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="glass-card">
          <CardHeader className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={complaint.profiles?.avatar_url || ""} />
                <AvatarFallback>{complaint.profiles?.display_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{complaint.profiles?.display_name}</span>
                  <span className="text-muted-foreground">@{complaint.profiles?.username}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
                  </span>
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
                  <Badge variant={complaint.status === "closed" ? "secondary" : "default"}>
                    {complaint.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-2xl font-bold">{complaint.title}</h1>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="gap-2 hover:text-primary" onClick={handleUpvote}>
                <ArrowBigUp className={`h-5 w-5 ${isUpvoted ? "fill-primary text-primary" : ""}`} />
                <span className="font-semibold">{upvoteCount}</span>
              </Button>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => updateComplaint.mutate({ id: id!, updates: { is_pinned: !complaint.is_pinned } })} className="gap-2">
                  <Pin className="h-4 w-4" />
                  {complaint.is_pinned ? "Unpin" : "Pin"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => updateComplaint.mutate({ id: id!, updates: { is_urgent: !complaint.is_urgent } })} className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {complaint.is_urgent ? "Remove Urgent" : "Mark Urgent"}
                </Button>
                {complaint.status !== "closed" && (
                  <Button variant="outline" size="sm" onClick={() => updateComplaint.mutate({ id: id!, updates: { status: "closed" } })} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Close
                  </Button>
                )}
                {complaint.status === "closed" && (
                  <Button variant="outline" size="sm" onClick={() => updateComplaint.mutate({ id: id!, updates: { status: "open" } })} className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Reopen
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <h2 className="text-xl font-semibold">Replies ({replies?.length || 0})</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea placeholder="Write a reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="min-h-[100px] bg-background/50 resize-none" />
              <div className="flex gap-2 justify-end">
                {isAdmin && (
                  <Button onClick={() => handleReply(true)} disabled={createReply.isPending} variant="outline" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Official Reply
                  </Button>
                )}
                <Button onClick={() => handleReply(false)} disabled={createReply.isPending} className="gap-2">
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
              <div className="space-y-4 pt-4">
                {replies.map((reply: any) => (
                  <div key={reply.id} className={`p-4 rounded-lg ${reply.is_official ? "bg-primary/10 border border-primary/20" : "bg-background/30"}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border-2 border-border">
                        <AvatarImage src={reply.profiles?.avatar_url || ""} />
                        <AvatarFallback>{reply.profiles?.display_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{reply.profiles?.display_name}</span>
                          {reply.is_official && (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Official
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed">{reply.content}</p>
                      </div>
                    </div>
                  </div>
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
