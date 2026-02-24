import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, ShoppingBag } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import LoginRequiredModal from "./LoginRequiredModal";
import { API_BASE_URL } from "@/lib/api";

const CartDrawer = ({ children }: { children: React.ReactNode }) => {
    const { items, removeFromCart, updateQuantity, total, count } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleCheckout = () => {
        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
            return;
        }
        // For now, if authenticated, we go to a checkout page (which we might need to create)
        // or just show a message. The user said "purchase will require signin".
        setIsSheetOpen(false);
        navigate("/checkout"); // We'll need to handle this route or logic
    };

    const getImageSrc = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        return `${API_BASE_URL}${url}`;
    };

    return (
        <>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
                <SheetContent className="flex w-full flex-col sm:max-w-md">
                    <SheetHeader className="px-1">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Your Cart ({count} {count === 1 ? 'item' : 'items'})
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-6">
                        {items.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                                <div className="bg-slate-100 p-6 rounded-full">
                                    <ShoppingBag className="h-12 w-12 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Your cart is empty</h3>
                                    <p className="text-slate-500">Looks like you haven't added anything yet.</p>
                                </div>
                                <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                                    Continue Shopping
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 px-1">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex gap-4">
                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-slate-50">
                                            {getImageSrc((item.product as any).image_url || item.product.image) ? (
                                                <img
                                                    src={getImageSrc((item.product as any).image_url || item.product.image)!}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-contain p-2"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <ShoppingBag className="h-8 w-8 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between text-sm font-medium">
                                                    <h4 className="line-clamp-1">{item.product.name}</h4>
                                                    <p className="ml-4 font-bold">R{item.product.price.toFixed(2)}</p>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                                                    {item.product.seller || "MzansiServe"}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center border rounded-md">
                                                    <button
                                                        className="p-1 hover:text-primary transition-colors"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                                                    <button
                                                        className="p-1 hover:text-primary transition-colors"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="font-medium text-sa-red hover:underline flex items-center gap-1 text-xs"
                                                    onClick={() => removeFromCart(item.product.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="border-t pt-6 space-y-4">
                            <div className="flex justify-between text-base font-bold">
                                <span>Subtotal</span>
                                <span>R{total.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Shipping and taxes calculated at checkout.
                            </p>
                            <SheetFooter className="flex-col sm:flex-col gap-3">
                                <Button className="w-full text-lg h-12 gap-2" onClick={handleCheckout}>
                                    <CreditCard className="h-5 w-5" /> Checkout
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => setIsSheetOpen(false)}>
                                    Continue Shopping
                                </Button>
                            </SheetFooter>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <LoginRequiredModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                title="Login to Checkout"
                description="You need to be logged in to complete your purchase. Secure your order by signing in or creating an account today."
            />
        </>
    );
};

export default CartDrawer;
