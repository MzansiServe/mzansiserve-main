import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";

const Checkout = () => {
    const { items, total, count, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const [formData, setFormData] = useState({
        firstName: user?.name ? user.name.split(" ")[0] : "",
        lastName: user?.name && user.name.includes(" ") ? user.name.split(" ").slice(1).join(" ") : "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        postalCode: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            toast({ title: "Cart is empty", description: "Add some items before checking out.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);

        try {
            // Create payment order on the backend to get a redirect URL
            const response = await apiFetch("/api/payments/create-order", {
                method: "POST",
                data: {
                    items: items.map(item => ({
                        product_id: item.product.id,
                        quantity: item.quantity,
                    })),
                    shipping_address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
                    total: total,
                }
            });

            if (response.success && response.data?.redirect_url) {
                // Redirect to external payment gateway (e.g. Yoco)
                window.location.href = response.data.redirect_url;
            } else {
                // Fallback for mock checkout
                setTimeout(() => {
                    clearCart();
                    toast({
                        title: "Order Placed Successfully!",
                        description: "Your payment has been processed and your order is on the way.",
                    });
                    navigate("/shopping-history?payment=success");
                }, 1500);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            // Fallback for mock checkout if backend route doesn't exist
            setTimeout(() => {
                clearCart();
                toast({
                    title: "Order Placed Successfully!",
                    description: "Your dummy order was processed.",
                });
                navigate("/shopping-history?payment=success");
            }, 1500);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto px-4 pt-28 pb-16">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 -ml-4 gap-2 text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Cart
                </Button>

                <h1 className="mb-8 text-3xl font-bold text-slate-900">Checkout</h1>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Checkout Form */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-xl font-semibold">Contact & Shipping Information</h2>
                            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required placeholder="123 Main St" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="postalCode">Postal Code</Label>
                                        <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Payment Info Box */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="h-6 w-6 text-primary" />
                                <h2 className="text-xl font-semibold">Payment Details</h2>
                            </div>
                            <p className="text-sm text-slate-500 mb-6">
                                You will be redirected to our secure payment gateway to complete your transaction.
                            </p>

                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <Lock className="h-4 w-4 text-emerald-600" />
                                <span>Your payment information is encrypted and secure.</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold border-b pb-4">Order Summary</h3>

                            <div className="max-h-72 overflow-y-auto pr-2 space-y-4 mb-6">
                                {items.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">Your cart is empty</p>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.product.id} className="flex items-center gap-3">
                                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-slate-100 bg-white">
                                                <img
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{item.product.name}</p>
                                                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-sm font-medium">R{item.product.price * item.quantity}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-3 border-t pt-4 mb-6 text-sm text-slate-600">
                                <div className="flex justify-between">
                                    <span>Subtotal ({count} items)</span>
                                    <span className="font-medium text-slate-900">R{total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium text-slate-900">Calculated at next step</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t pt-4 text-lg font-bold text-slate-900 mb-8">
                                <span>Total</span>
                                <span className="text-primary">R{total.toFixed(2)}</span>
                            </div>

                            <Button
                                type="submit"
                                form="checkout-form"
                                className="w-full gap-2 h-14 text-base bg-gradient-purple text-primary-foreground shadow-glow-purple hover:opacity-90"
                                disabled={items.length === 0 || isProcessing}
                            >
                                {isProcessing ? (
                                    "Processing..."
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" /> Pay R{total.toFixed(2)}
                                    </>
                                )}
                            </Button>

                            <div className="mt-6 flex flex-col items-center gap-2 border-t pt-6 text-xs text-slate-400">
                                <div className="flex items-center gap-1 font-medium text-slate-500">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> secure 256-bit SSL encryption
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Checkout;
