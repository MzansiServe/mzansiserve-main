import { useState, useEffect, useRef } from "react";
import { Send, X, MessageSquare, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface ChatOverlayProps {
  requestId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatOverlay = ({ requestId, recipientName, isOpen, onClose }: ChatOverlayProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await apiFetch(`/api/chat/${requestId}`);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, requestId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await apiFetch(`/api/chat/${requestId}`, {
        method: "POST",
        data: { message: newMessage }
      });
      if (res.success) {
        setMessages([...messages, res.data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[100] w-[350px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">{recipientName}</p>
                <p className="text-[10px] text-white/70 mt-1">Live Chat</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400">No messages yet. Send a message to start the conversation.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                      isMe ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 h-10 text-sm bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sending} className="h-10 w-10 shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
