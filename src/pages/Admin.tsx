import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, AlertCircle, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: userRole, isLoading: loadingRole } = useUserRole(user?.id);
  
  const { data: allComplaints, isLoading: loadingComplaints } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, profiles:profiles!complaints_user_id_fkey(username, display_name, avatar_url)")
        .eq("is_private", false)
        .order("created_at", { ascending: false});
      if (error) throw error;
      return data;
    },
  });

  const { data: allFeedback, isLoading: loadingFeedback } = useQuery({
    queryKey: ["all-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*, profiles:profiles!feedback_user_id_fkey(username, display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  
  const isAdmin = userRole?.role === "admin";

  if (loadingRole) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </MainLayout>
    );
  }

  const openComplaints = allComplaints?.filter((c) => c.status === "open") || [];
  const urgentComplaints = allComplaints?.filter((c) => c.is_urgent) || [];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-in">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage system and view feedbacks</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/users")}>
            Manage Users
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{openComplaints.length}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{urgentComplaints.length}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Feedbacks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allFeedback?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="feedbacks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 glass">
            <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
            <TabsTrigger value="urgent">Urgent Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="feedbacks" className="space-y-4 mt-6">
            {loadingFeedback ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allFeedback && allFeedback.length > 0 ? (
              <div className="space-y-4">
                {allFeedback.map((feedback: any) => (
                  <Card key={feedback.id} className="glass-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{feedback.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            by @{feedback.profiles?.username} · {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge>{feedback.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feedback.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-card rounded-xl">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No feedback submitted yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4 mt-6">
            {loadingComplaints ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : urgentComplaints.length > 0 ? (
              urgentComplaints.map((complaint: any) => (
                <Card key={complaint.id} className="glass-card cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/complaint/${complaint.id}`)}>
                  <CardHeader>
                    <CardTitle>{complaint.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">{complaint.description}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 glass-card rounded-xl">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No urgent complaints.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
