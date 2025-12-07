import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGeoCheck } from "@/hooks/useGeoCheck";
import { ShieldX, Loader2 } from "lucide-react";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Complaints from "./pages/Complaints";
import ComplaintDetail from "./pages/ComplaintDetail";
import PostDetail from "./pages/PostDetail";
import Notifications from "./pages/Notifications";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import UserManagement from "./pages/UserManagement";
import Feedback from "./pages/Feedback";
import AIChat from "./pages/AIChat";
import PublicChat from "./pages/PublicChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { isChecking: geoChecking, isBlocked: geoBlocked } = useGeoCheck();

  const { data: accountStatusData, isLoading: statusLoading } = useQuery({
    queryKey: ["accountStatus", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("account_status, status_reason, status_until")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!user || !accountStatusData) return;
    const { account_status, status_reason } = accountStatusData as any;
    if (account_status && account_status !== "active") {
      let message = "Your account has been restricted.";
      if (account_status === "banned") message = "Your account has been banned.";
      else if (account_status === "suspended") message = "Your account has been suspended.";
      else if (account_status === "disabled") message = "Your account has been disabled.";
      if (status_reason) message += ` Reason: ${status_reason}`;
      toast.error(message);
      signOut();
    }
  }, [accountStatusData, user, signOut]);

  // Show loading while checking geo or auth
  if (loading || statusLoading || geoChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show blocked message for non-Indian users
  if (geoBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-destructive/10 via-background to-secondary/10">
        <div className="max-w-md w-full text-center space-y-6 animate-in">
          <ShieldX className="h-20 w-20 mx-auto text-destructive" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Access Restricted</h1>
            <p className="text-muted-foreground text-lg">
              Brototype Connect is only available for users in India.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
            <Route path="/complaint/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
            <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/public-chat" element={<ProtectedRoute><PublicChat /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
