import { useState, useEffect } from "react";
import { 
  Settings, Search, RefreshCw, ChevronDown, 
  ChevronUp, Code, Globe, AlertCircle, CheckCircle2 
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const ApiLogsManagement = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/api-logs');
      if (res.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch API logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">External API Integration Logs</h2>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endpoint</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                          log.status_code >= 200 && log.status_code < 300 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                          {log.status_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span className="text-sm font-bold text-slate-700 capitalize">{log.provider}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs font-mono text-slate-500">{log.endpoint}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-slate-400">{log.method}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          {expandedLog === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Request Payload</p>
                              <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs overflow-x-auto max-h-[300px]">
                                {JSON.stringify(log.request_payload, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Response Payload</p>
                              <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs overflow-x-auto max-h-[300px]">
                                {JSON.stringify(log.response_payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    {loading ? "Loading logs..." : "No API logs found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
