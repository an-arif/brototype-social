import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useMessages";
import { useMarkMessageNotificationsRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, MessageCircle } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);

  const { data: conversations, isLoading: conversationsLoading } = useConversations(user?.id);
  const { data: messages, isLoading: messagesLoading } = useMessages(user?.id, selectedPartnerId || undefined);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const markMessageNotifications = useMarkMessageNotificationsRead();

  // Mark all message notifications as read when entering Messages page
  useEffect(() => {
    if (user?.id) {
      markMessageNotifications.mutate(user.id);
    }
  }, [user?.id]);

  // Mark message notifications as read when selecting a conversation
  useEffect(() => {
    if (selectedPartnerId && user?.id) {
      markMessageNotifications.mutate(user.id);
    }
  }, [selectedPartnerId, user?.id]);

  const selectedConversation = conversations?.find((c: any) => c.partner.id === selectedPartnerId);

  // Smart auto-scroll: only scroll when NEW messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      const currentCount = messages.length;
      const hadNewMessage = currentCount > previousMessageCountRef.current;
      
      if (hadNewMessage && scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
      
      previousMessageCountRef.current = currentCount;
    }
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (!user?.id || !selectedPartnerId || !messages) return;

    const hasUnreadFromPartner = messages.some(
      (message: any) =>
        message.sender_id === selectedPartnerId &&
        message.receiver_id === user.id &&
        !message.read
    );

    if (hasUnreadFromPartner) {
      markRead.mutate({ userId: user.id, partnerId: selectedPartnerId });
      markMessageNotifications.mutate(user.id);
    }
  }, [messages, selectedPartnerId, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !user?.id || !selectedPartnerId) return;

    await sendMessage.mutateAsync({
      sender_id: user.id,
      receiver_id: selectedPartnerId,
      content: messageContent.trim(),
    });
    setMessageContent("");
    
    // Immediately scroll for sender
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="glass-card md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {conversationsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {conversations.map((conv: any) => (
                      <div
                        key={conv.partner.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                          selectedPartnerId === conv.partner.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setSelectedPartnerId(conv.partner.id)}
                      >
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage src={conv.partner.avatar_url || ""} />
                          <AvatarFallback>{conv.partner.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm truncate">{conv.partner.display_name}</span>
                            {conv.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage.content}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No conversations yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="glass-card md:col-span-2">
            {selectedPartnerId ? (
              <>
                <CardHeader className="border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-border">
                      <AvatarImage src={selectedConversation?.partner.avatar_url || ""} />
                      <AvatarFallback>{selectedConversation?.partner.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation?.partner.display_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">@{selectedConversation?.partner.username}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
                  <ScrollArea className="flex-1 p-4 max-h-[calc(100vh-20rem)]">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message: any) => {
                          const isOwn = message.sender_id === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                            >
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={message.sender.avatar_url || ""} />
                                <AvatarFallback>{message.sender.display_name[0]}</AvatarFallback>
                              </Avatar>
                              <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                                <div
                                  className={`rounded-lg px-4 py-2 ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-accent text-accent-foreground"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={scrollRef} />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                  </ScrollArea>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={sendMessage.isPending || !messageContent.trim()}>
                        {sendMessage.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
