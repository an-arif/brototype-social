import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { Bell, Heart, MessageCircle, UserPlus, AlertCircle, Calendar, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const iconMap: Record<string, any> = {
  like: Heart,
  reply: MessageCircle,
  follow: UserPlus,
  complaint: AlertCircle,
  event: Calendar,
};

export default function Notifications() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications(user?.id);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markRead.mutateAsync(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    if (user?.id) {
      markAllRead.mutate(user.id);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = iconMap[notification.type] || Bell;
              return (
                <Card
                  key={notification.id}
                  className={`glass-card cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    !notification.read ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${!notification.read ? "bg-primary/20" : "bg-background/50"}`}>
                        <Icon className={`h-5 w-5 ${!notification.read ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}