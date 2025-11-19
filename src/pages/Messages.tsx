import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, useSendMessage, useMarkMessagesRead, useLoadMoreMessages } from "@/hooks/useMessages";
import { useMarkMessageNotificationsRead } from "@/hooks/useNotifications";
import { formatDistanceToNow, format, differenceInMinutes } from "date-fns";
import { Send, Loader2, MessageCircle } from "lucide-react";

// Helper to group messages
const groupMessages = (messages: any[]) => {
  const groups: any[] = [];
  let currentGroup: any = null;

  messages.forEach((message) => {
    const shouldStartNewGroup =
      !currentGroup ||
      currentGroup.senderId !== message.sender_id ||
      differenceInMinutes(new Date(message.created_at), new Date(currentGroup.lastMessageTime)) > 5;

    if (shouldStartNewGroup) {
      currentGroup = {
        senderId: message.sender_id,
        sender: message.sender,
        messages: [message],
        firstMessageTime: message.created_at,
        lastMessageTime: message.created_at,
      };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
      currentGroup.lastMessageTime = message.created_at;
    }
  });

  return groups;
};

export default function Messages() {
  const { user } = useAuth();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loadedCount, setLoadedCount] = useState(15);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);

  const { data: conversations, isLoading: conversationsLoading } = useConversations(user?.id);
  const { data: messagesData, isLoading: messagesLoading } = useMessages(user?.id, selectedPartnerId || undefined, loadedCount);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const markMessageNotifications = useMarkMessageNotificationsRead();
  const loadMoreMessages = useLoadMoreMessages();

  const messages = messagesData?.messages || [];
  const hasMore = messagesData?.hasMore || false;

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

  // Reset loaded count when conversation changes
  useEffect(() => {
    if (selectedPartnerId) {
      setLoadedCount(15);
      setAllMessages([]);
    }
  }, [selectedPartnerId]);

  // Update all messages when data changes
  useEffect(() => {
    if (messages) {
      setAllMessages(messages);
    }
  }, [messages]);

  // Smart auto-scroll: only scroll when NEW messages arrive
  useEffect(() => {
    if (allMessages && allMessages.length > 0) {
      const currentCount = allMessages.length;
      const hadNewMessage = currentCount > previousMessageCountRef.current;
      
      if (hadNewMessage && scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
      
      previousMessageCountRef.current = currentCount;
    }
  }, [allMessages]);

  // Handle scroll to load more
  const handleScroll = async (e: any) => {
    const target = e.target;
    if (target.scrollTop === 0 && hasMore && !isLoadingMoreRef.current && user?.id && selectedPartnerId) {
      isLoadingMoreRef.current = true;
      const previousScrollHeight = target.scrollHeight;
      
      const olderMessages = await loadMoreMessages.mutateAsync({
        userId: user.id,
        partnerId: selectedPartnerId,
        offset: loadedCount,
        limit: 15,
      });

      setAllMessages((prev) => [...olderMessages, ...prev]);
      setLoadedCount((prev) => prev + 15);
      
      // Restore scroll position
      setTimeout(() => {
        const newScrollHeight = target.scrollHeight;
        target.scrollTop = newScrollHeight - previousScrollHeight;
        isLoadingMoreRef.current = false;
      }, 100);
    }
  };

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (!user?.id || !selectedPartnerId || !allMessages) return;

    const hasUnreadFromPartner = allMessages.some(
      (message: any) =>
        message.sender_id === selectedPartnerId &&
        message.receiver_id === user.id &&
        !message.read
    );

    if (hasUnreadFromPartner) {
      markRead.mutate({ userId: user.id, partnerId: selectedPartnerId });
      markMessageNotifications.mutate(user.id);
    }
  }, [allMessages, selectedPartnerId, user?.id]);

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
                  <ScrollArea 
                    className="flex-1 p-4 max-h-[calc(100vh-20rem)]"
                    onScroll={handleScroll}
                  >
                    {hasMore && (
                      <div className="text-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadMoreMessages.isPending}
                          className="text-xs"
                        >
                          {loadMoreMessages.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            "Scroll up for more"
                          )}
                        </Button>
                      </div>
                    )}
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : allMessages && allMessages.length > 0 ? (
                      <div className="space-y-6">
                        {groupMessages(allMessages).map((group: any, groupIndex: number) => {
                          const isOwn = group.senderId === user?.id;
                          return (
                            <div key={groupIndex} className="space-y-1">
                              {/* First message in group with avatar and timestamp */}
                              <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                                <Avatar className="h-8 w-8 border border-border">
                                  <AvatarImage src={group.sender.avatar_url || ""} />
                                  <AvatarFallback>{group.sender.display_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%] space-y-1`}>
                                  {/* Show timestamp once for the group */}
                                  <span className="text-xs text-muted-foreground px-2">
                                    {format(new Date(group.firstMessageTime), "MMM d, h:mm a")}
                                  </span>
                                  
                                  {/* All messages in the group */}
                                  {group.messages.map((message: any) => (
                                    <div
                                      key={message.id}
                                      className={`rounded-lg px-4 py-2 ${
                                        isOwn
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-accent text-accent-foreground"
                                      }`}
                                    >
                                      <p className="text-sm">{message.content}</p>
                                    </div>
                                  ))}
                                </div>
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
