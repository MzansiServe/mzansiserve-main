import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, MapPin, MessageSquare, Star, 
  AlertCircle, ChevronRight, Loader2, Package,
  History, CheckCircle2, ShieldAlert
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChatOverlay } from "@/components/ChatOverlay";
import { RatingModal } from "@/components/dashboards/RatingModal";
import { cn } from "@/lib/utils";

const MyBookings = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatJob, setChatJob] = useState<{ id: string, name: string } | null>(null);
  const [ratingJob, setRatingJob] = useState<{ id: string, name: string } | null>(null);
  const [reportingJob, setReportingJob] = useState<{ id: string, name: string } | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await apiFetch('/api/requests');
      if (res.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-blue-100 text-blue-700";
      case 'accepted': return "bg-emerald-100 text-emerald-700";
      case 'completed': return "bg-slate-100 text-slate-700";
      case 'cancelled': return "bg-red-100 text-red-700";
      case 'unpaid': return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getProviderName = (req: any) => {
    if (req.request_type === 'cab') return req.driver_name || "Assigned Driver";
    return req.details?.provider_name || req.details?.professional_name || "Service Provider";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-24 lg:px-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
            <p className="text-slate-500 mt-1">Track your service requests and rides</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBookings}>
              <History className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No bookings yet</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              You haven't made any service requests yet. Explore our marketplace to get started.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button onClick={() => window.location.href='/transport'}>Book a Ride</Button>
              <Button variant="outline" onClick={() => window.location.href='/services'}>Find Services</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", 
                        req.request_type === 'cab' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      )}>
                        {req.request_type === 'cab' ? <CheckCircle2 className="h-7 w-7" /> : <Package className="h-7 w-7" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(req.status))}>
                            {req.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{req.id.slice(-8)}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-none">
                          {req.request_type === 'cab' ? "Transport Ride" : req.details?.service_name || "Service Request"}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {req.status === 'accepted' && (
                        <Button 
                          variant="ghost" 
                          className="rounded-xl text-primary bg-primary/5 hover:bg-primary/10 font-bold h-11"
                          onClick={() => setChatJob({ id: req.id, name: getProviderName(req) })}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" /> Chat
                        </Button>
                      )}
                      
                      {req.status === 'completed' && !req.has_driver_rating && !req.has_professional_rating && !req.has_provider_rating && (
                        <Button 
                          className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-11"
                          onClick={() => setRatingJob({ id: req.id, name: getProviderName(req) })}
                        >
                          <Star className="h-4 w-4 mr-2" /> Rate
                        </Button>
                      )}

                      <Button 
                        variant="ghost" 
                        className="rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold h-11"
                        onClick={() => setReportingJob({ id: req.id, name: getProviderName(req) })}
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" /> Report
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</p>
                      <p className="font-bold text-slate-900">{getProviderName(req)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</p>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(req.scheduled_date).toLocaleDateString()} at {req.scheduled_time}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid</p>
                      <p className="text-xl font-bold text-primary">R{req.payment_amount?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium truncate">
                      {req.location_data?.location || req.location_data?.pickup || "Location specified in booking"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Overlay */}
      {chatJob && (
        <ChatOverlay
          requestId={chatJob.id}
          recipientName={chatJob.name}
          isOpen={!!chatJob}
          onClose={() => setChatJob(null)}
        />
      )}

      {/* Rating Modal */}
      {ratingJob && (
        <RatingModal
          isOpen={!!ratingJob}
          onClose={() => setRatingJob(null)}
          jobId={ratingJob.id}
          clientName={ratingJob.name}
          onSuccess={fetchBookings}
        />
      )}

      {/* Reporting UI placeholder - can be expanded into a modal */}
      {reportingJob && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Report Issue</h3>
                <button onClick={() => setReportingJob(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="h-6 w-6 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Reason</label>
                  <select id="reportReason" className="w-full h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="no_show">Provider No-Show</option>
                    <option value="unprofessional">Unprofessional Behavior</option>
                    <option value="poor_service">Poor Service Quality</option>
                    <option value="overcharged">Payment Issue / Overcharged</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Description</label>
                  <textarea 
                    id="reportDesc"
                    rows={4}
                    className="w-full rounded-xl border-slate-100 bg-slate-50 p-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Tell us more about what happened..."
                  ></textarea>
                </div>
                
                <Button 
                  className="w-full h-14 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-100"
                  onClick={async () => {
                    const reason = (document.getElementById('reportReason') as HTMLSelectElement).value;
                    const desc = (document.getElementById('reportDesc') as HTMLTextAreaElement).value;
                    if (!desc) { toast({ title: "Please provide a description", variant: "destructive" }); return; }
                    
                    try {
                      const res = await apiFetch('/api/reports', {
                        method: 'POST',
                        data: {
                          reason,
                          description: desc,
                          request_id: reportingJob.id
                        }
                      });
                      if (res.success) {
                        toast({ title: "Report Submitted", description: "Our team will investigate this issue." });
                        setReportingJob(null);
                      }
                    } catch (err) {
                      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" });
                    }
                  }}
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </main>
  );
};

// Placeholder for Lucide X icon if not imported
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default MyBookings;
