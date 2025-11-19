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
        .eq("user_id", userId);

      if (error || !data || data.length === 0) {
        // User might not have a role yet
        return { role: "user" };
      }

      // Check if user has admin role
      const hasAdminRole = data.some((r: any) => r.role === "admin");
      return { role: hasAdminRole ? "admin" : data[0].role };
    },
    enabled: !!userId,
  });
};
