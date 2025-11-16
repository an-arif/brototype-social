import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Image, Send, Loader2 } from "lucide-react";
import { usePosts, useCreatePost } from "@/hooks/usePosts";
import { PostCard } from "@/components/PostCard";

export default function Home() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState("");
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;
    await createPost.mutateAsync({ content: postContent, user_id: user.id });
    setPostContent("");
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-in">
          <h1 className="text-3xl font-bold mb-2">Home Feed</h1>
          <p className="text-muted-foreground">What's happening in the Brototype community?</p>
        </div>

        <Card className="glass-card animate-in">
          <CardHeader>
            <CardTitle className="text-lg">Create Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[120px] bg-background/50 resize-none"
            />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-2">
                <Image className="h-4 w-4" />
                Add Image
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={createPost.isPending || !postContent.trim()}
                className="gap-2"
              >
                {createPost.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {createPost.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-xl">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
