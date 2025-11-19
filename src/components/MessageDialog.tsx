import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSendMessage } from "@/hooks/useMessages";
import { useNavigate } from "react-router-dom";

interface MessageDialogProps {
  receiverId: string;
  receiverName: string;
}

export function MessageDialog({ receiverId, receiverName }: MessageDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const sendMessage = useSendMessage();
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!content.trim() || !user?.id) return;

    await sendMessage.mutateAsync({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    });
    
    setContent("");
    setOpen(false);
    navigate("/messages");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send message to {receiverName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Textarea
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMessage.isPending || !content.trim()}
              className="gap-2"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
