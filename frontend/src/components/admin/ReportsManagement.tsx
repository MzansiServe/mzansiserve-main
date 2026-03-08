import { useState, useEffect } from "react";
import { 
  ShieldAlert, CheckCircle2, XCircle, Search, 
  RefreshCw, MessageSquare, User, AlertCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const ReportsManagement = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/reports${filter !== 'all' ? `?status=${filter}` : ''}`);
      if (res.success) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    const notes = prompt("Enter admin notes (optional):");
    try {
      const res = await apiFetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        data: { status, admin_notes: notes }
      });
      if (res.success) {
        toast({ title: "Success", description: `Report marked as ${status}.` });
        fetchReports();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update report.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User & Service Reports</h2>
          <p className="text-sm text-slate-500">Monitor and resolve community issues</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-lg border-slate-200 text-sm font-bold bg-white"
          >
            <option value="pending">Pending Only</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Reports</option>
          </select>
          <Button variant="outline" size="icon" onClick={fetchReports}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                      report.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      report.status === 'resolved' ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-600"
                    )}>
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          report.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          report.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                        )}>
                          {report.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{report.id.slice(-8)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-none capitalize">
                        {report.reason.replace('_', ' ')}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {report.status === 'pending' && (
                      <Button 
                        size="sm"
                        className="bg-primary hover:bg-primary/90 font-bold"
                        onClick={() => handleUpdateStatus(report.id, 'investigating')}
                      >
                        Investigate
                      </Button>
                    )}
                    {report.status !== 'resolved' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-100 hover:bg-green-50 font-bold"
                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    {report.status !== 'dismissed' && (
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-600 font-bold"
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{report.description}"</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporter</p>
                    <p className="text-sm font-bold text-slate-900">{report.reporter_email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reported User</p>
                    <p className="text-sm font-bold text-slate-900">{report.reported_user_email || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Request</p>
                    <p className="text-sm font-bold text-slate-900">{report.service_request_id || "General"}</p>
                  </div>
                </div>

                {report.admin_notes && (
                  <div className="mt-6 pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Notes</p>
                    <p className="text-sm text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100">{report.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No reports found</h3>
            <p className="text-sm text-slate-500">Everything looks clear! No {filter} reports to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};
