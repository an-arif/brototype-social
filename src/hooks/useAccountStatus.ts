import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateAccountStatusParams {
  userId: string;
  status: "active" | "banned" | "suspended" | "disabled";
  reason?: string;
  until?: Date;
}

export const useUpdateAccountStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status, reason, until }: UpdateAccountStatusParams) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const updates: any = {
        account_status: status,
        status_reason: reason,
        status_until: until?.toISOString(),
        status_updated_at: new Date().toISOString(),
        status_updated_by: currentUser.user?.id,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Account status updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update account status");
    },
  });
};
