import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export function UsersSidebar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio")
        .order("created_at", { ascending: false });
      
      if (searchQuery.trim()) {
        query = query.or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      } else {
        query = query.limit(10);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const truncateBio = (bio: string | null) => {
    if (!bio) return "No bio yet";
    return bio.length > 60 ? bio.substring(0, 60) + "..." : bio;
  };

  return (
    <Card className="glass-card sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Community Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))
        ) : users && users.length > 0 ? (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback>{user.display_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{user.display_name}</div>
                <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {truncateBio(user.bio)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
        )}
      </CardContent>
    </Card>
  );
}