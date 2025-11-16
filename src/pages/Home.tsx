import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Image, Send } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error("Please write something to post");
      return;
    }

    setIsPosting(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user?.id,
        content: postContent,
      });

      if (error) throw error;

      toast.success("Post created successfully!");
      setPostContent("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-in">
          <h1 className="text-3xl font-bold mb-2">Home Feed</h1>
          <p className="text-muted-foreground">What's happening in the Brototype community?</p>
        </div>

        {/* Create Post Card */}
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
                disabled={isPosting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feed will be populated here */}
        <div className="text-center py-12 glass-card rounded-xl">
          <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
        </div>
      </div>
    </MainLayout>
  );
}
