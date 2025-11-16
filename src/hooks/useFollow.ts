import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFollowStats = (userId?: string) => {
  return useQuery({
    queryKey: ["followStats", userId],
    queryFn: async () => {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from("follows").select("id").eq("following_id", userId!),
        supabase.from("follows").select("id").eq("follower_id", userId!),
      ]);

      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;

      return {
        followers: followersRes.data?.length || 0,
        following: followingRes.data?.length || 0,
      };
    },
    enabled: !!userId,
  });
};

export const useIsFollowing = (followerId?: string, followingId?: string) => {
  return useQuery({
    queryKey: ["isFollowing", followerId, followingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", followerId!)
        .eq("following_id", followingId!)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!followerId && !!followingId,
  });
};

export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ followerId, followingId, isFollowing }: { 
      followerId: string; 
      followingId: string; 
      isFollowing: boolean 
    }) => {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", followerId)
          .eq("following_id", followingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["isFollowing", variables.followerId, variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ["followStats", variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ["followStats", variables.followerId] });
      toast.success(variables.isFollowing ? "Unfollowed user" : "Following user");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update follow status");
    },
  });
};

export const useUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: ["userPosts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`id, content, created_at, user_id, image_url, profiles:profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });
};

export const useUserComplaints = (userId?: string) => {
  return useQuery({
    queryKey: ["userComplaints", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          id, 
          title, 
          description, 
          status, 
          category, 
          created_at, 
          user_id, 
          is_private,
          profiles:profiles!complaints_user_id_fkey(username, display_name, avatar_url)
        `)
        .eq("user_id", userId!)
        .eq("is_private", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });
};