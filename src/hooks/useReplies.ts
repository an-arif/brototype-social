import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useReplies = (postId?: string, complaintId?: string) => {
  return useQuery({
    queryKey: ["replies", postId, complaintId],
    queryFn: async () => {
      // First get all replies with parent relationship
      let query = supabase
        .from("replies")
        .select(`
          id, 
          content, 
          created_at, 
          user_id, 
          is_official, 
          parent_reply_id,
          profiles:profiles!replies_user_id_fkey(username, display_name, avatar_url)
        `)
        .order("created_at", { ascending: true });
      
      if (postId) query = query.eq("post_id", postId);
      else if (complaintId) query = query.eq("complaint_id", complaintId);
      
      const { data, error } = await query;
      if (error) throw error;

      // Build nested structure
      const repliesMap = new Map();
      const rootReplies: any[] = [];

      data?.forEach((reply: any) => {
        repliesMap.set(reply.id, { ...reply, replies: [] });
      });

      data?.forEach((reply: any) => {
        const replyWithChildren = repliesMap.get(reply.id);
        if (reply.parent_reply_id) {
          const parent = repliesMap.get(reply.parent_reply_id);
          if (parent) {
            parent.replies.push(replyWithChildren);
          }
        } else {
          rootReplies.push(replyWithChildren);
        }
      });

      return rootReplies;
    },
    enabled: !!postId || !!complaintId,
  });
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reply: any) => {
      // Check if user is admin and auto-flag as official
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", reply.user_id);
      
      const isAdmin = userRole?.some((r: any) => r.role === "admin");
      
      const { data, error } = await supabase
        .from("replies")
        .insert({ ...reply, is_official: isAdmin || reply.is_official })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies"] });
      toast.success("Reply posted!");
    },
  });
};
