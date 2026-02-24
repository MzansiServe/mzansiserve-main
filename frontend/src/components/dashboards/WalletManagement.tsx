import { useState, useEffect } from "react";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Download,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Transaction {
    id: string;
    transaction_type: 'top-up' | 'payment' | 'withdrawal' | 'credit' | 'debit';
    amount: number;
    status: string;
    created_at: string;
    description: string;
}

interface WalletManagementProps {
    balance: number;
    transactions: Transaction[];
    role: 'driver' | 'professional' | 'service-provider';
    onWithdrawalRequested: () => void;
}

export const WalletManagement = ({ balance, transactions, role, onWithdrawalRequested }: WalletManagementProps) => {
    const { toast } = useToast();
    const [withdrawalAmount, setWithdrawalAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleWithdrawalRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawalAmount);

        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
            return;
        }

        if (amount > balance) {
            toast({ title: "Insufficient balance", description: `Your current balance is R${balance.toFixed(2)}.`, variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch('/api/dashboard/wallet/withdrawal-request', {
                method: 'POST',
                data: { amount }
            });

            if (res.success) {
                toast({ title: "Request Submitted", description: `Your withdrawal request for R${amount.toFixed(2)} is being processed.` });
                setWithdrawalAmount("");
                onWithdrawalRequested();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to submit request", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const themeColor = role === 'driver' ? 'text-[#1e88e5]' : 'text-[#5e35b1]';
    const themeBg = role === 'driver' ? 'bg-[#e3f2fd]' : 'bg-[#ede7f6]';
    const themeButton = role === 'driver' ? 'bg-[#1e88e5] hover:bg-[#1565c0]' : 'bg-[#5e35b1] hover:bg-[#4527a0]';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet Summary & Withdrawal Form */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm relative overflow-hidden">
                    {/* Decorative background */}
                    <div className={cn("absolute -right-10 -bottom-10 h-40 w-40 rounded-full opacity-10", role === 'driver' ? 'bg-[#1e88e5]' : 'bg-[#5e35b1]')} />

                    <div className="relative z-10">
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-6", themeBg, themeColor)}>
                            <Wallet className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-[#697586] uppercase tracking-[0.2em] mb-1">Available Balance</p>
                        <h2 className="text-4xl font-black text-[#121926] tracking-tight">
                            R{balance.toFixed(2)}
                        </h2>
                        <div className="mt-8 pt-8 border-t border-dashed border-gray-100">
                            <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-xs font-black text-[#697586] uppercase tracking-widest ml-1">Withdrawal Amount</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#121926]">R</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={withdrawalAmount}
                                            onChange={(e) => setWithdrawalAmount(e.target.value)}
                                            className="pl-8 h-12 rounded-xl border-gray-100 bg-slate-50 font-bold text-lg"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className={cn("w-full h-12 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]", themeButton)}
                                    disabled={isSubmitting || balance <= 0}
                                >
                                    Request Withdrawal
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="bg-[#121926] rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#697586] mb-4">Earnings Info</h4>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Withdrawal requests are processed within <span className="text-white font-bold">24-48 hours</span>. Standard bank transfer fees may apply.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="lg:col-span-2">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
                    <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", themeBg, themeColor)}>
                                <History className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-[#121926]">Transaction History</h2>
                        </div>
                        <button className="text-xs font-bold text-[#1e88e5] hover:underline flex items-center gap-1">
                            <Download className="h-3 w-3" /> Export CSV
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-[#f8fafc]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-[#697586] uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-[#697586] uppercase tracking-widest">Details</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-[#697586] uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-[#697586] uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-[#697586] uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-[#f8fafc] transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs",
                                                    tx.transaction_type === 'credit' || tx.transaction_type === 'payment' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                )}>
                                                    {tx.transaction_type === 'credit' || tx.transaction_type === 'payment' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#121926] capitalize">
                                                    {tx.transaction_type.replace('-', ' ')}
                                                </p>
                                                <p className="text-xs text-[#697586] whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                    {tx.description || `Transaction #${tx.id.slice(-6)}`}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#697586] font-medium font-mono">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <p className={cn(
                                                    "text-sm font-black tracking-tight",
                                                    tx.transaction_type === 'credit' || tx.transaction_type === 'payment' ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {tx.transaction_type === 'credit' || tx.transaction_type === 'payment' ? "+" : "-"} R{tx.amount.toFixed(2)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={cn(
                                                    "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border",
                                                    tx.status === 'completed' ? "bg-green-50 text-green-700 border-green-100" :
                                                        tx.status === 'pending' ? "bg-orange-50 text-orange-700 border-orange-100" :
                                                            "bg-red-50 text-red-700 border-red-100"
                                                )}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[#697586]">
                                            <div className="flex flex-col items-center">
                                                <History className="h-8 w-8 text-slate-200 mb-2" />
                                                <span className="text-sm italic">No recent transactions.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
