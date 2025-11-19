import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useConversations = (userId?: string) => {
  return useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!userId) return [];

      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, username, display_name, avatar_url),
          receiver:receiver_id(id, username, display_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationsMap = new Map<string, any>();

      messages?.forEach((message: any) => {
        const partnerId =
          message.sender_id === userId ? message.receiver_id : message.sender_id;
        const partner =
          message.sender_id === userId ? message.receiver : message.sender;

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            partner,
            lastMessage: message,
            unreadCount: 0,
          });
        }

        if (message.receiver_id === userId && !message.read) {
          const conv = conversationsMap.get(partnerId);
          if (conv) {
            conv.unreadCount += 1;
          }
        }
      });

      return Array.from(conversationsMap.values()).sort(
        (a, b) =>
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
      );
    },
  });
};

export const useMessages = (userId?: string, partnerId?: string, limit: number = 15) => {
  return useQuery({
    queryKey: ["messages", userId, partnerId, limit],
    enabled: !!userId && !!partnerId,
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!userId || !partnerId) return { messages: [], hasMore: false, total: 0 };

      // Get total count
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
        );

      // Get latest messages
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, username, display_name, avatar_url),
          receiver:receiver_id(id, username, display_name, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return {
        messages: data?.reverse() || [],
        hasMore: (count || 0) > limit,
        total: count || 0,
      };
    },
  });
};

export const useLoadMoreMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      partnerId,
      offset,
      limit = 15,
    }: {
      userId: string;
      partnerId: string;
      offset: number;
      limit?: number;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, username, display_name, avatar_url),
          receiver:receiver_id(id, username, display_name, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data?.reverse() || [];
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sender_id,
      receiver_id,
      content,
    }: {
      sender_id: string;
      receiver_id: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({ sender_id, receiver_id, content })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.sender_id, variables.receiver_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.receiver_id, variables.sender_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.sender_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.receiver_id],
      });
      toast.success("Message sent");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });
};

export const useMarkMessagesRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      partnerId,
    }: {
      userId: string;
      partnerId: string;
    }) => {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", partnerId)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.userId, variables.partnerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.userId],
      });
    },
  });
};
