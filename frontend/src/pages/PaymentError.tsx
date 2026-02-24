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
            <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4 pt-20">
                <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-slate-100 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sa-red/10 text-sa-red animate-pulse-slow">
                        <AlertCircle className="h-10 w-10" />
                    </div>

                    <h1 className="mb-4 text-3xl font-bold text-slate-900">{content.title}</h1>
                    <p className="mb-8 text-slate-600 leading-relaxed">
                        {content.description}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Button
                            onClick={() => navigate(-1)}
                            className="w-full gap-2 h-12 bg-sa-blue hover:bg-sa-blue/90"
                        >
                            <RefreshCw className="h-4 w-4" /> Try Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/")}
                            className="w-full gap-2 h-12"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Button>
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <p className="text-sm text-slate-500 mb-4">
                            Need help with your transaction?
                        </p>
                        <Button variant="ghost" className="text-primary hover:bg-primary/5 gap-2">
                            <MessageSquare className="h-4 w-4" /> Contact Support Team
                        </Button>
                    </div>

                    <p className="mt-8 text-xs text-slate-400">
                        Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                </div>
            </div>
        </main>
    );
};

export default PaymentError;
