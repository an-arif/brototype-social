import { MainLayout } from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/PostCard";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { UsersSidebar } from "@/components/UsersSidebar";

export default function Home() {
  const { data: posts, isLoading } = usePosts();

  return (
    <MainLayout>
      <div className="flex gap-6 max-w-7xl mx-auto">
        <div className="flex-1 max-w-2xl space-y-6">
          <div className="animate-in">
            <h1 className="text-3xl font-bold mb-2">Home Feed</h1>
            <p className="text-muted-foreground">What's happening in the Brototype community?</p>
          </div>

          <div className="animate-in">
            <CreatePostDialog />
          </div>

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

        <aside className="hidden lg:block w-80">
          <UsersSidebar />
        </aside>
      </div>
    </MainLayout>
  );
}
