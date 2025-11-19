import { Home, AlertCircle, Calendar, User, Settings, LogOut, Bell, Shield, MessageCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

export function Sidebar() {
  const { signOut, user } = useAuth();
  const { data: notifications } = useNotifications(user?.id);
  const { data: userRole } = useUserRole(user?.id);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;
  const isAdmin = userRole?.role === "admin";

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: unreadCount },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: AlertCircle, label: "Complaints", path: "/complaints" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const adminItems = isAdmin ? [
    { icon: Shield, label: "Admin Panel", path: "/admin" },
  ] : [];

  console.log("User role check:", { userId: user?.id, userRole, isAdmin });

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-card border-r border-border/50 flex flex-col">
      <div className="p-6 border-b border-border/50">
        <img 
          src="https://website-main.blr1.cdn.digitaloceanspaces.com/assets/brototype_brother_logo.svg" 
          alt="Brototype" 
          className="h-10"
        />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-200 relative"
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <Badge className="ml-auto bg-primary text-primary-foreground">{item.badge}</Badge>
            )}
          </NavLink>
        ))}
        {adminItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-200 relative border-t border-border/30 mt-2 pt-4"
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-foreground/70 hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
