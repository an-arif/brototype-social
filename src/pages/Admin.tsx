import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, AlertCircle, MessageSquare, Book, Flag, Users, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 glass">
            <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
            <TabsTrigger value="urgent">Urgent Complaints</TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <Book className="h-4 w-4" />
              Documentation
            </TabsTrigger>
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

          <TabsContent value="docs" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Admin Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-8">
                    {/* Overview Section */}
                    <section className="space-y-3">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        System Overview
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        This admin panel provides you with comprehensive tools to manage the community platform. 
                        You have elevated permissions to moderate content, manage users, and respond to complaints and feedback.
                      </p>
                    </section>

                    {/* Complaints Management */}
                    <section className="space-y-3 border-t border-border pt-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Managing Complaints
                      </h3>
                      <div className="space-y-4 text-muted-foreground">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Public vs Private Complaints</h4>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Public Complaints:</strong> Visible to all users. These appear in the community feed and can be upvoted by anyone.</li>
                            <li><strong>Private Complaints:</strong> Only visible to the complaint creator and admins. Use these for sensitive issues.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Admin Actions</h4>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Pin:</strong> Highlight important complaints at the top of the feed</li>
                            <li><strong>Mark Urgent:</strong> Flag complaints that require immediate attention</li>
                            <li><strong>Close/Reopen:</strong> Mark complaints as resolved or reopen them if needed</li>
                            <li><strong>Official Reply:</strong> Your replies will be marked with an "Official" badge</li>
                            <li><strong>Assign:</strong> Assign complaints to specific team members for handling</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Complaint Categories</h4>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Electricity:</strong> Power outages, electrical issues</li>
                            <li><strong>Network:</strong> Internet connectivity, Wi-Fi problems</li>
                            <li><strong>System:</strong> Platform bugs, technical glitches</li>
                            <li><strong>Staff:</strong> Staff-related concerns</li>
                            <li><strong>Other:</strong> General complaints</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Severity Levels</h4>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Critical:</strong> System-wide issues affecting all users</li>
                            <li><strong>High:</strong> Significant problems affecting many users</li>
                            <li><strong>Medium:</strong> Moderate issues with workarounds available</li>
                            <li><strong>Low:</strong> Minor inconveniences or feature requests</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Photo Attachments */}
                    <section className="space-y-3 border-t border-border pt-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Flag className="h-5 w-5 text-primary" />
                        Photo Attachments
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Users can now upload photos with their complaints for better documentation. All uploaded images are:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                        <li>Automatically stored in secure cloud storage</li>
                        <li>Viewable inline without requiring downloads</li>
                        <li>Accessible to admins and the complaint creator</li>
                        <li>Clickable to open in full size in a new tab</li>
                      </ul>
                    </section>

                    {/* User Management */}
                    <section className="space-y-3 border-t border-border pt-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        User Management
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Access the User Management page to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                        <li>View all registered users and their details</li>
                        <li>Suspend accounts for policy violations</li>
                        <li>Ban users permanently if necessary</li>
                        <li>Promote users to admin status</li>
                        <li>Monitor user activity and engagement</li>
                      </ul>
                      <p className="text-muted-foreground leading-relaxed mt-3">
                        <strong>Note:</strong> Always provide a clear reason when taking moderation actions. Suspended accounts can be set with an expiration date.
                      </p>
                    </section>

                    {/* Feedback Management */}
                    <section className="space-y-3 border-t border-border pt-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Feedback Management
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        The feedback system allows users to provide suggestions and general feedback. Review feedback regularly to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                        <li>Identify recurring themes and popular requests</li>
                        <li>Understand user satisfaction levels</li>
                        <li>Plan feature improvements and updates</li>
                        <li>Respond to constructive criticism</li>
                      </ul>
                    </section>

                    {/* Best Practices */}
                    <section className="space-y-3 border-t border-border pt-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        Best Practices
                      </h3>
                      <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
                        <li><strong>Respond Promptly:</strong> Try to reply to urgent complaints within 24 hours</li>
                        <li><strong>Be Professional:</strong> Maintain a respectful tone in all communications</li>
                        <li><strong>Document Actions:</strong> Leave clear notes when closing or assigning complaints</li>
                        <li><strong>Use Official Replies:</strong> Mark important admin responses as "Official"</li>
                        <li><strong>Monitor Trends:</strong> Check the "Trending" tab to see what issues are gaining attention</li>
                        <li><strong>Regular Reviews:</strong> Check the dashboard daily for new urgent items</li>
                      </ul>
                    </section>

                    {/* Quick Actions */}
                    <section className="space-y-3 border-t border-border pt-6 pb-4">
                      <h3 className="text-xl font-semibold">Quick Reference</h3>
                      <div className="grid gap-3">
                        <Card className="bg-background/50">
                          <CardContent className="p-4">
                            <p className="text-sm"><strong>Dashboard Stats:</strong> Shows open complaints, urgent items, and total feedback at a glance</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-background/50">
                          <CardContent className="p-4">
                            <p className="text-sm"><strong>Color Coding:</strong> Official replies have a blue background, urgent items show a red badge</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-background/50">
                          <CardContent className="p-4">
                            <p className="text-sm"><strong>Navigation:</strong> Click on any complaint card to view full details and manage it</p>
                          </CardContent>
                        </Card>
                      </div>
                    </section>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
