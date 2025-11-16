import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Events() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-in">
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">Stay updated with upcoming events and announcements</p>
        </div>

        <div className="grid gap-6">
          {/* Sample Event Card */}
          <Card className="glass-hover">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">No upcoming events</CardTitle>
                  <p className="text-sm text-muted-foreground">Events will be posted by admins</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Upcoming
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>TBA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>TBA</span>
                </div>
              </div>
              <p className="text-muted-foreground">
                Check back later for event announcements
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">0 interested</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
