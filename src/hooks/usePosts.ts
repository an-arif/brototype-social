import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePosts = () => {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`id, content, created_at, user_id, image_url, profiles:profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, user_id }: { content: string; user_id: string }) => {
      const { data, error } = await supabase.from("posts").insert({ content, user_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created successfully!");
    },
    onError: (error: any) => toast.error(error.message || "Failed to create post"),
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ post_id, user_id, isLiked }: { post_id: string; user_id: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from("likes").delete().eq("post_id", post_id).eq("user_id", user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({ post_id, user_id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", "likes"] }),
  });
};

export const useLikes = (postId?: string) => {
  return useQuery({
    queryKey: ["likes", postId],
    queryFn: async () => {
      const query = supabase.from("likes").select("*");
      if (postId) query.eq("post_id", postId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
};
