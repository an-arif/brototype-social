import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = (userId?: string) => {
  return useQuery({
    queryKey: ["userRole", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        // User might not have a role yet
        return { role: "user" };
      }
      return data;
    },
    enabled: !!userId,
  });
};
