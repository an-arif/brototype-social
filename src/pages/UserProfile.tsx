import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useFollowStats, useIsFollowing, useToggleFollow, useUserPosts, useUserComplaints } from "@/hooks/useFollow";
import { Loader2, UserPlus, UserMinus, Edit } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { PostCard } from "@/components/PostCard";
import { ComplaintCard } from "@/components/ComplaintCard";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { useState } from "react";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnProfile = user?.id === id;
  
  const { data: profile, isLoading } = useProfile(id);
  const { data: followStats } = useFollowStats(id);
  const { data: isFollowing } = useIsFollowing(user?.id, id);
  const { data: posts } = useUserPosts(id);
  const { data: complaints } = useUserComplaints(id);
  const toggleFollow = useToggleFollow();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleFollow = async () => {
    if (!user || !id) return;
    await toggleFollow.mutateAsync({
      followerId: user.id,
      followingId: id,
      isFollowing: isFollowing || false,
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile</CardTitle>
            {isOwnProfile ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="gap-2"
                onClick={handleFollow}
                disabled={toggleFollow.isPending}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {profile.display_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold">{posts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold">{followStats?.followers || 0}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold">{followStats?.following || 0}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>

            {profile.bio && (
              <div className="pt-6 border-t border-border/50">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 mt-6">
            {posts && posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No posts yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="complaints" className="space-y-4 mt-6">
            {complaints && complaints.length > 0 ? (
              complaints.map((complaint) => <ComplaintCard key={complaint.id} complaint={complaint} />)
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No public complaints yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isOwnProfile && user && (
        <EditProfileDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} userId={user.id} />
      )}
    </MainLayout>
  );
}