import { useState, useEffect } from "react";
import { 
  MessageSquare, User, Clock, Search, 
  RefreshCw, MessageCircle, ArrowRight
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const GlobalChatsManagement = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/chats');
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch global chats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Chat Monitor</h2>
          <p className="text-sm text-slate-500">Live feed of all user communications</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchChats}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh Feed
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{msg.sender_name}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Request #{msg.request_id.slice(-8)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="pl-11 relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100 rounded-full" />
                  <p className="text-sm text-slate-600 bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm group-hover:shadow-md transition-shadow">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="italic">No chat activity recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
