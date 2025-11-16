import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useReplies = (postId?: string, complaintId?: string) => {
  return useQuery({
    queryKey: ["replies", postId, complaintId],
    queryFn: async () => {
      let query = supabase.from("replies").select(`id, content, created_at, user_id, is_official, profiles:profiles!replies_user_id_fkey(username, display_name, avatar_url)`).order("created_at", { ascending: true });
      if (postId) query = query.eq("post_id", postId);
      else if (complaintId) query = query.eq("complaint_id", complaintId);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!postId || !!complaintId,
  });
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reply: any) => {
      const { data, error } = await supabase.from("replies").insert(reply).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies"] });
      toast.success("Reply posted!");
    },
  });
};
