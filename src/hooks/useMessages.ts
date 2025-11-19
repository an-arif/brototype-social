import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export const useConversations = (userId?: string) => {
  const queryClient = useQueryClient();

  // Set up realtime subscription for conversations
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Invalidate conversations when any message changes
          queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get all messages where user is sender or receiver
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

      // Group messages by conversation partner
      const conversationsMap = new Map();
      
      messages?.forEach((message: any) => {
        const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        const partner = message.sender_id === userId ? message.receiver : message.sender;
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            partner,
            lastMessage: message,
            unreadCount: 0,
          });
        }
        
        // Count unread messages from partner
        if (message.receiver_id === userId && !message.read) {
          const conv = conversationsMap.get(partnerId);
          conv.unreadCount++;
        }
      });

      return Array.from(conversationsMap.values()).sort(
        (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );
    },
    enabled: !!userId,
  });
};

export const useMessages = (userId?: string, partnerId?: string) => {
  const queryClient = useQueryClient();

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!userId || !partnerId) return;

    const channel = supabase
      .channel(`messages-${userId}-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId}))`
        },
        () => {
          // Invalidate messages when a new message is sent/received
          queryClient.invalidateQueries({ queryKey: ["messages", userId, partnerId] });
          queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, partnerId, queryClient]);

  return useQuery({
    queryKey: ["messages", userId, partnerId],
    queryFn: async () => {
      if (!userId || !partnerId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, username, display_name, avatar_url),
          receiver:receiver_id(id, username, display_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!partnerId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sender_id, receiver_id, content }: { sender_id: string; receiver_id: string; content: string }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({ sender_id, receiver_id, content })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.sender_id, variables.receiver_id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", variables.sender_id] });
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
    mutationFn: async ({ userId, partnerId }: { userId: string; partnerId: string }) => {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", partnerId)
        .eq("read", false);
      
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.userId, variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", variables.userId] });
    },
  });
};
