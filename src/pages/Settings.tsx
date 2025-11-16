import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-in">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="post-notifications">Post Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone comments on your post
                </p>
              </div>
              <Switch id="post-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="complaint-notifications">Complaint Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates on complaints you've submitted
                </p>
              </div>
              <Switch id="complaint-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="event-notifications">Event Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about upcoming events
                </p>
              </div>
              <Switch id="event-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-profile">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your profile
                </p>
              </div>
              <Switch id="public-profile" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-email">Show Email</Label>
                <p className="text-sm text-muted-foreground">
                  Display your email on your profile
                </p>
              </div>
              <Switch id="show-email" />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
