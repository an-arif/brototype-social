import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Edit } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-in">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Profile</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">User</h2>
                <p className="text-muted-foreground">@{user?.email?.split('@')[0]}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">No bio added yet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
