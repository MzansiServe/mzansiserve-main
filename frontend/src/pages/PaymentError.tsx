import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, RefreshCw, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const PaymentError = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const errorType = params.get("error") || "payment_failed";

    const getErrorContent = () => {
        switch (errorType) {
            case "cancelled":
                return {
                    title: "Payment Cancelled",
                    description: "Your payment process was cancelled before completion. No funds have been deducted from your account.",
                };
            default:
                return {
                    title: "Payment Failed",
                    description: "We encountered an error while processing your payment. This could be due to insufficient funds, an expired card, or a temporary issue with the payment gateway.",
                };
        }
    };

    const content = getErrorContent();

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23E5E7EB\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

            <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-6 pt-20 relative z-10">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 text-center">
                        {/* Icon */}
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 border-2 border-red-100">
                            <AlertCircle className="h-10 w-10 text-red-500" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-3">{content.title}</h1>
                        <p className="text-slate-500 font-normal leading-relaxed mb-8">{content.description}</p>

                        <div className="grid gap-3 sm:grid-cols-2 mb-8">
                            <Button
                                onClick={() => navigate(-1)}
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-md shadow-primary/20 gap-2"
                            >
                                <RefreshCw className="h-4 w-4" /> Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate("/")}
                                className="w-full h-12 rounded-xl border-2 border-slate-200 text-slate-700 hover:border-slate-300 font-medium gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back to Home
                            </Button>
                        </div>

                        {/* Support */}
                        <div className="pt-6 border-t border-slate-100">
                            <p className="text-sm text-slate-400 font-normal mb-3">Need help with your transaction?</p>
                            <Button
                                variant="ghost"
                                className="text-primary hover:bg-primary/5 rounded-xl font-medium gap-2"
                            >
                                <MessageSquare className="h-4 w-4" /> Contact Support Team
                            </Button>
                        </div>

                        <p className="mt-6 text-[11px] text-slate-300 font-normal">
                            Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PaymentError;
