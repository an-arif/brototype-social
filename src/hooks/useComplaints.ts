import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useComplaints = (type: "public" | "private", userId?: string) => {
  return useQuery({
    queryKey: ["complaints", type, userId],
    queryFn: async () => {
      let query = supabase.from("complaints").select(`id, title, description, status, is_pinned, is_urgent, created_at, user_id, assigned_to, profiles!inner(username, display_name, avatar_url)`).order("created_at", { ascending: false });
      if (type === "public") query = query.is("assigned_to", null);
      else if (type === "private" && userId) query = query.or(`user_id.eq.${userId},assigned_to.eq.${userId}`);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useCreateComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (complaint: { 
      title: string; 
      description: string; 
      user_id: string; 
      is_private?: boolean;
      severity?: string;
      category?: string;
    }) => {
      const { data, error } = await supabase
        .from("complaints")
        .insert({ 
          title: complaint.title, 
          description: complaint.description, 
          user_id: complaint.user_id, 
          status: "open",
          is_private: complaint.is_private || false,
          severity: complaint.severity || 'medium',
          category: complaint.category || 'other',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint submitted!");
    },
    onError: (error: any) => toast.error(error.message || "Failed to submit"),
  });
};

export const useToggleUpvote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ complaint_id, user_id, isUpvoted }: { complaint_id: string; user_id: string; isUpvoted: boolean }) => {
      if (isUpvoted) {
        const { error } = await supabase.from("complaint_upvotes").delete().eq("complaint_id", complaint_id).eq("user_id", user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("complaint_upvotes").insert({ complaint_id, user_id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["upvotes"] }),
  });
};

export const useUpvotes = (complaintId?: string) => {
  return useQuery({
    queryKey: ["upvotes", complaintId],
    queryFn: async () => {
      const query = supabase.from("complaint_upvotes").select("*");
      if (complaintId) query.eq("complaint_id", complaintId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase.from("complaints").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Updated!");
    },
  });
};
