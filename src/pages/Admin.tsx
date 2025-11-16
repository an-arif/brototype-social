import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useComplaints } from "@/hooks/useComplaints";
import { ComplaintCard } from "@/components/ComplaintCard";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { user } = useAuth();
  const { data: userRole, isLoading: loadingRole } = useUserRole(user?.id);
  const { data: allComplaints, isLoading: loadingComplaints } = useComplaints("public");
  const { data: privateComplaints, isLoading: loadingPrivate } = useComplaints("private");
  
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
        <div className="flex items-center gap-3 animate-in">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage complaints and system</p>
          </div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Private</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{privateComplaints?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="urgent" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 glass">
            <TabsTrigger value="urgent">Urgent</TabsTrigger>
            <TabsTrigger value="open">All Open</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
          </TabsList>

          <TabsContent value="urgent" className="space-y-4 mt-6">
            {loadingComplaints ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : urgentComplaints.length > 0 ? (
              urgentComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))
            ) : (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-muted-foreground">No urgent complaints</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="open" className="space-y-4 mt-6">
            {loadingComplaints ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : openComplaints.length > 0 ? (
              openComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))
            ) : (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-muted-foreground">No open complaints</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="private" className="space-y-4 mt-6">
            {loadingPrivate ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : privateComplaints && privateComplaints.length > 0 ? (
              privateComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))
            ) : (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-muted-foreground">No private complaints</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
