import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();

    const [userData, setUserData] = useState<any>(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const queryStatus = searchParams.get("status");
        if (token) {
            verifyEmail();
        } else if (queryStatus === "pending_payment") {
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                setUserData(JSON.parse(savedUser));
                setStatus("success");
                setLoading(false);
            } else {
                setLoading(false);
                setStatus("error");
                setErrorMsg("User session not found. Please login again.");
            }
        } else {
            setLoading(false);
            setStatus("error");
            setErrorMsg("Verification token is missing.");
        }
    }, [token, searchParams]);

    const verifyEmail = async () => {
        try {
            const result = await apiFetch("/api/auth/verify-email", {
                method: "POST",
                data: { token },
            });

            if (result.success) {
                setStatus("success");
                setUserData(result.data.user);
                // Store token for payment initiation
                if (result.data.token) {
                    localStorage.setItem("token", result.data.token);
                }
            } else {
                setStatus("error");
                setErrorMsg(typeof result.error === 'string' ? result.error : "Failed to verify email. The link may have expired.");
            }
        } catch (err) {
            setStatus("error");
            setErrorMsg("An unexpected error occurred during verification.");
        } finally {
            setLoading(false);
        }
    };

    const initiatePayment = async () => {
        setPaying(true);
        try {
            const result = await apiFetch("/api/auth/initiate-registration-payment", {
                method: "POST"
            });
            if (result.success && result.data.redirect_url) {
                window.location.href = result.data.redirect_url;
            } else {
                toast({
                    title: "Payment Error",
                    description: typeof result.error === 'string' ? result.error : "Could not initiate payment. Please try logging in.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "An expected error occurred.",
                variant: "destructive"
            });
        } finally {
            setPaying(false);
        }
    };

    return (
        <main className="min-h-screen bg-white font-sans flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[568px] border border-[#DDDDDD] rounded-xl shadow-[0_8px_28px_rgba(0,0,0,0.12)] overflow-hidden bg-white px-6 py-12 text-center"
            >
                <AnimatePresence mode="wait">
                    {status === "loading" && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-[#222222] mb-3">Verifying your email</h1>
                            <p className="text-[#717171]">This will only take a moment. Please stay on this page.</p>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#222222] mb-3">Email verified!</h1>
                            <p className="text-[#717171] mb-8 max-w-sm mx-auto">
                                {userData?.is_paid
                                    ? "Thank you for verifying your email address. Your account is fully active."
                                    : "Your email is verified! Final step: pay the R100 activation fee to complete your registration."}
                            </p>

                            {userData?.is_paid ? (
                                <Button
                                    className="w-full h-14 rounded-2xl font-bold bg-primary shadow-xl shadow-primary/10 text-base transition-all active:scale-[0.98]"
                                    onClick={() => navigate("/login")}
                                >
                                    Login to Dashboard
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <Button
                                        className="w-full h-14 rounded-2xl font-bold bg-primary shadow-xl shadow-primary/10 text-base transition-all active:scale-[0.98]"
                                        onClick={initiatePayment}
                                        disabled={paying}
                                    >
                                        {paying ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Redirecting...</>
                                        ) : (
                                            "Pay Registration Fee (R100)"
                                        )}
                                    </Button>
                                    <p className="text-xs text-slate-400">
                                        You can also <Link to="/login" className="text-primary hover:underline">login later</Link> to complete payment.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-10 h-10 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#222222] mb-3">Verification failed</h1>
                            <p className="text-[#717171] mb-8 max-w-sm mx-auto">{errorMsg}</p>
                            <div className="space-y-4">
                                <Button
                                    className="w-full h-14 rounded-2xl font-bold bg-primary shadow-xl shadow-primary/10 text-base transition-all active:scale-[0.98]"
                                    onClick={() => navigate("/login")}
                                >
                                    Login
                                </Button>
                                <div className="flex flex-col gap-2 pt-2">
                                    <Link
                                        to="/login?resend=true"
                                        className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                                    >
                                        Resend verification link
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Don't have an account? Register again
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </main>
    );
};

export default VerifyEmail;
