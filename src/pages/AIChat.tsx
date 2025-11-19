import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Settings, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ai_chat_messages");
    const storedKey = localStorage.getItem("openai_api_key");
    if (stored) setMessages(JSON.parse(stored));
    if (storedKey) {
      setApiKey(storedKey);
      setTempApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("ai_chat_messages", JSON.stringify(messages));
  }, [messages]);

  const saveApiKey = () => {
    localStorage.setItem("openai_api_key", tempApiKey);
    setApiKey(tempApiKey);
    setShowSettings(false);
    toast.success("API key saved!");
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("ai_chat_messages");
    toast.success("Chat cleared!");
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (!apiKey) {
      toast.error("Please set your OpenAI API key in settings");
      setShowSettings(true);
      return;
    }

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
      toast.error(error.message || "Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
        <Card className="glass-card h-full flex flex-col">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Chat Assistant
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Chat with AI powered by OpenAI
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={clearChat}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>OpenAI API Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>OpenAI API Key</Label>
                        <Input
                          type="password"
                          value={tempApiKey}
                          onChange={(e) => setTempApiKey(e.target.value)}
                          placeholder="sk-..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Your API key is stored locally in your browser
                        </p>
                      </div>
                      <Button onClick={saveApiKey} className="w-full">
                        Save API Key
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Start a conversation with the AI assistant</p>
                  {!apiKey && (
                    <p className="text-sm mt-2">
                      Click the settings icon to add your OpenAI API key
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            <form onSubmit={sendMessage} className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
