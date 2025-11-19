import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useConversations = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages:conversations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: any) => {
          const message = payload.new as any;
          if (!message) return;

          if (message.sender_id === userId || message.receiver_id === userId) {
            queryClient.invalidateQueries({
              queryKey: ["conversations", userId],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    // Light polling fallback in case realtime is briefly unavailable
    refetchInterval: userId ? 20000 : false,
    refetchIntervalInBackground: true,
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

export const useMessages = (userId?: string, partnerId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !partnerId) return;

    const channel = supabase
      .channel(`messages:thread:${userId}:${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: any) => {
          const message = payload.new as any;
          if (!message) return;

          const isInConversation =
            (message.sender_id === userId && message.receiver_id === partnerId) ||
            (message.sender_id === partnerId && message.receiver_id === userId);

          if (isInConversation) {
            queryClient.invalidateQueries({
              queryKey: ["messages", userId, partnerId],
            });
            queryClient.invalidateQueries({
              queryKey: ["conversations", userId],
            });
            queryClient.invalidateQueries({
              queryKey: ["conversations", partnerId],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, partnerId, queryClient]);

  return useQuery({
    queryKey: ["messages", userId, partnerId],
    enabled: !!userId && !!partnerId,
    // Fallback polling in case realtime is temporarily unavailable
    refetchInterval: userId && partnerId ? 20000 : false,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      if (!userId || !partnerId) return [];

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
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
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
