import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Trash2, Image as ImageIcon, MessageSquare, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Image generation states
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSize, setImageSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  const [imageQuality, setImageQuality] = useState<"standard" | "hd">("standard");

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

  useEffect(() => {
    const stored = localStorage.getItem("ai_generated_images");
    if (stored) setGeneratedImages(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("ai_generated_images", JSON.stringify(generatedImages));
  }, [generatedImages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("ai_chat_messages");
    toast.success("Chat cleared!");
  };

  const clearImages = () => {
    setGeneratedImages([]);
    localStorage.removeItem("ai_generated_images");
    toast.success("Images cleared!");
  };

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;

    setIsGenerating(true);
    try {
      const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-image-gen`;
      
      const response = await fetch(IMAGE_GEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: imagePrompt,
          size: imageSize,
          quality: imageQuality
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      
      if (imageUrl) {
        setGeneratedImages(prev => [imageUrl, ...prev]);
        toast.success("Image generated successfully!");
        setImagePrompt("");
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    try {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `dall-e-image-${index + 1}-${Date.now()}.png`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download started!");
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
      toast.info("Image opened in new tab - right-click to save");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response from AI');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages([...updatedMessages, { role: "assistant", content: assistantContent }]);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
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
            <CardTitle>AI Tools</CardTitle>
            <p className="text-sm text-muted-foreground">Chat assistant and image generation</p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full grid grid-cols-2 bg-secondary/50 glass mb-4">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="image" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image Generation
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col mt-0 data-[state=active]:flex data-[state=inactive]:hidden overflow-hidden h-full">
                <div className="flex items-center justify-between px-2 pb-2">
                  <p className="text-sm text-muted-foreground">Powered by GPT-5</p>
                  <Button variant="outline" size="sm" onClick={clearChat} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <ScrollArea className="flex-1 px-2 h-full">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Start a conversation with the AI assistant</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, i) => (
                        <div
                          key={i}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-4 break-words ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.role === "assistant" ? (
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-lg p-4 bg-muted">
                            <div className="flex gap-1 items-center">
                              <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={scrollRef} />
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={sendMessage} className="p-2 border-t border-border/50 mt-auto">
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
              </TabsContent>

              <TabsContent value="image" className="flex-1 flex flex-col mt-0 data-[state=active]:flex data-[state=inactive]:hidden overflow-hidden h-full">
                <div className="flex items-center justify-between px-2 pb-2">
                  <p className="text-sm text-muted-foreground">Powered by DALL-E 3</p>
                  <Button variant="outline" size="sm" onClick={clearImages} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>

                <ScrollArea className="flex-1 px-2 h-full">
                  {generatedImages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Generate images with AI</p>
                      <p className="text-xs mt-2">Describe what you want to create</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                      {generatedImages.map((imageUrl, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-border bg-background/50">
                          <img 
                            src={imageUrl} 
                            alt={`Generated ${i + 1}`}
                            className="w-full h-auto"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                            onClick={() => downloadImage(imageUrl, i)}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={generateImage} className="p-2 border-t border-border/50 space-y-3 mt-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Size</label>
                      <Select value={imageSize} onValueChange={(value: any) => setImageSize(value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                          <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                          <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Quality</label>
                      <Select value={imageQuality} onValueChange={(value: any) => setImageQuality(value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="hd">HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      disabled={isGenerating}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isGenerating || !imagePrompt.trim()}>
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
