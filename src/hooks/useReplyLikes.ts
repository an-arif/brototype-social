import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useReplyLikes = (replyId?: string) => {
  return useQuery({
    queryKey: ["reply-likes", replyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("likes")
        .select("*")
        .eq("reply_id", replyId!);
      if (error) throw error;
      return data;
    },
    enabled: !!replyId,
  });
};

export const useToggleReplyLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reply_id, user_id, isLiked }: { reply_id: string; user_id: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from("likes").delete().eq("reply_id", reply_id).eq("user_id", user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({ reply_id, user_id });
        if (error) throw error;
      }
    },
    onMutate: async ({ reply_id, user_id, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["reply-likes", reply_id] });
      const previousLikes = queryClient.getQueryData(["reply-likes", reply_id]);
      
      queryClient.setQueryData(["reply-likes", reply_id], (old: any) => {
        if (isLiked) {
          return old?.filter((like: any) => like.user_id !== user_id) || [];
        } else {
          return [...(old || []), { reply_id, user_id, id: "temp-" + Date.now(), created_at: new Date().toISOString() }];
        }
      });
      
      return { previousLikes };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousLikes) {
        queryClient.setQueryData(["reply-likes", variables.reply_id], context.previousLikes);
      }
      toast.error("Failed to update like");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reply-likes", variables.reply_id] });
    },
  });
};