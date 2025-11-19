import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Send, Settings } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = userRole?.role === "admin";

  useEffect(() => {
    const stored = localStorage.getItem("ai_chat_messages");
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("ai_chat_messages", JSON.stringify(messages));
  }, [messages]);

  const fetchApiKey = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "openai_api_key")
      .single();

    if (data) {
      setApiKey(data.setting_value);
    }
  };

  const updateApiKey = async () => {
    setIsUpdatingKey(true);
    const { error } = await supabase
      .from("admin_settings")
      .update({ setting_value: newApiKey, updated_by: user?.id })
      .eq("setting_key", "openai_api_key");

    setIsUpdatingKey(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setApiKey(newApiKey);
      setNewApiKey("");
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from OpenAI");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
        <Card className="glass-card h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Chat</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Chat with GPT for free</p>
            </div>
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update API Key</DialogTitle>
                    <DialogDescription>Change the OpenAI API key</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="api-key">New API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="mt-2"
                      />
                    </div>
                    <Button onClick={updateApiKey} disabled={isUpdatingKey}>
                      {isUpdatingKey ? "Updating..." : "Update Key"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    <p>Start a conversation with AI</p>
                  </div>
                )}
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading || !apiKey}
                />
                <Button type="submit" disabled={isLoading || !apiKey}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
