import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Package, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type OrderItem = {
    product_id: string;
    quantity: number;
};

type Order = {
    id: string;
    status: string;
    total: number;
    items: OrderItem[];
    placed_at: string;
};

const ShoppingHistory = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        // In a real scenario you would have a dedicated endpoint for fetching orders: /api/shop/orders
        // For now, we will simulate the order history or rely on a future endpoint.
        const fetchOrders = async () => {
            try {
                const response = await apiFetch("/api/shop/orders");
                if (response.success && response.data?.orders) {
                    setOrders(response.data.orders);
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment");

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'delivered':
                return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            case 'cancelled':
            case 'failed':
                return <XCircle className="h-5 w-5 text-sa-red" />;
            default:
                return <Clock className="h-5 w-5 text-amber-500" />;
        }
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
                <Link to="/shop">
                    <Button variant="ghost" className="mb-6 -ml-4 gap-2 text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" /> Back to Shop
                    </Button>
                </Link>

                {paymentStatus === 'success' && (
                    <div className="mb-8 rounded-xl bg-emerald-50 border border-emerald-100 p-6 flex flex-col items-center text-center">
                        <div className="bg-emerald-100 p-3 rounded-full mb-4">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Payment Successful!</h2>
                        <p className="text-emerald-600">
                            Your order has been placed and is now being processed. Thank you for shopping with MzansiServe.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-8">
                    <Package className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-slate-900">Shopping History</h1>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">Loading your orders...</div>
                ) : orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white border text-sm border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 mb-4 gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Order ID</p>
                                        <p className="font-semibold text-slate-900">{order.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Date</p>
                                        <p className="font-semibold text-slate-900">{new Date(order.placed_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Amount</p>
                                        <p className="font-bold text-primary">R{order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full font-medium">
                                        {getStatusIcon(order.status)}
                                        <span className="capitalize text-slate-700">{order.status}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-slate-700 mb-3">Items Ordered</h4>
                                    <ul className="space-y-2">
                                        {order.items.map((item, index) => (
                                            <li key={index} className="flex justify-between text-slate-600">
                                                <span>Product #{item.product_id} (x{item.quantity})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No orders found</h3>
                        <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                            You haven't placed any orders yet. Start shopping to see your history here.
                        </p>
                        <Link to="/shop">
                            <Button className="bg-gradient-purple text-primary-foreground">Browse Shop</Button>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
};

export default ShoppingHistory;
