import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, Trash2, Hash } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function PublicChat() {
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const { toast } = useToast();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelImage, setChannelImage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = userRole?.role === "admin";

  const { data: channels, refetch: refetchChannels } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["channel_messages", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];

      const { data, error } = await supabase
        .from("channel_messages")
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("channel_id", selectedChannelId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedChannelId,
  });

  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels]);

  useEffect(() => {
    if (!selectedChannelId) return;

    const channel = supabase
      .channel(`channel-messages-${selectedChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_messages",
          filter: `channel_id=eq.${selectedChannelId}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    const { error } = await supabase.from("channels").insert({
      name: channelName,
      description: channelDescription,
      image_url: channelImage || null,
      created_by: user.id,
    });

    setIsCreating(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Channel created successfully",
      });
      setChannelName("");
      setChannelDescription("");
      setChannelImage("");
      setOpen(false);
      refetchChannels();
    }
  };

  const deleteChannel = async (channelId: string) => {
    const { error } = await supabase.from("channels").delete().eq("id", channelId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Channel deleted successfully",
      });
      if (selectedChannelId === channelId) {
        setSelectedChannelId(null);
      }
      refetchChannels();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannelId || !user) return;

    const { error } = await supabase.from("channel_messages").insert({
      channel_id: selectedChannelId,
      user_id: user.id,
      content: messageInput,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMessageInput("");
    }
  };

  const selectedChannel = channels?.find((c) => c.id === selectedChannelId);

  return (
    <MainLayout>
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Channels Sidebar */}
        <Card className="glass-card w-64 flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Channels</h2>
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                    <DialogDescription>Create a new public chat channel</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createChannel} className="space-y-4">
                    <div>
                      <Label htmlFor="channel-name">Channel Name</Label>
                      <Input
                        id="channel-name"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="general"
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="channel-description">Description</Label>
                      <Textarea
                        id="channel-description"
                        value={channelDescription}
                        onChange={(e) => setChannelDescription(e.target.value)}
                        placeholder="Channel description"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="channel-image">Image URL (optional)</Label>
                      <Input
                        id="channel-image"
                        value={channelImage}
                        onChange={(e) => setChannelImage(e.target.value)}
                        placeholder="https://..."
                        className="mt-2"
                      />
                    </div>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Channel"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {channels?.map((channel) => (
                <div
                  key={channel.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    selectedChannelId === channel.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedChannelId(channel.id)}
                >
                  {channel.image_url ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={channel.image_url} />
                      <AvatarFallback>
                        <Hash className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                      <Hash className="h-4 w-4" />
                    </div>
                  )}
                  <span className="flex-1 text-sm font-medium">{channel.name}</span>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChannel(channel.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {!channels?.length && (
                <p className="text-center text-muted-foreground text-sm py-8">No channels yet</p>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="glass-card flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {selectedChannel.image_url ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChannel.image_url} />
                      <AvatarFallback>
                        <Hash className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                      <Hash className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold">{selectedChannel.name}</h2>
                    {selectedChannel.description && (
                      <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 py-4">
                    {messages?.map((message: any) => {
                      const isOwnMessage = message.user_id === user?.id;
                      return (
                        <div key={message.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.profiles?.avatar_url} />
                            <AvatarFallback>
                              {message.profiles?.display_name?.[0] || message.profiles?.username?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] min-w-0 ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                            <div className={`flex items-baseline gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                              <span className="font-semibold text-sm">
                                {message.profiles?.display_name || message.profiles?.username}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.created_at), "h:mm a")}
                              </span>
                            </div>
                            <div className={`mt-1 rounded-lg p-3 break-words ${
                              isOwnMessage 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!messages?.length && (
                      <p className="text-center text-muted-foreground py-8">No messages yet</p>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message #${selectedChannel.name}`}
                    />
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a channel to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
