import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, ShoppingBag, Lock } from "lucide-react";
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
import { API_BASE_URL, getImageUrl } from "@/lib/api";

import { cn } from "@/lib/utils";

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
        setIsSheetOpen(false);
        navigate("/checkout");
    };

    const getImageSrc = (url: string | null) => getImageUrl(url);

    return (
        <>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
                <SheetContent className="flex w-full flex-col sm:max-w-md bg-white border-l border-slate-50 p-0 overflow-hidden">
                    <SheetHeader className="px-8 pt-10 pb-6 border-b border-slate-50">
                        <SheetTitle className="flex items-center gap-3 text-2xl font-bold text-[#222222]">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            Your bag
                            <span className="text-slate-300 font-medium ml-1">({count})</span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
                        {items.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center px-6">
                                <div className="bg-slate-50 p-8 rounded-full mb-6 text-slate-200 shadow-inner">
                                    <ShoppingBag className="h-12 w-12" />
                                </div>
                                <h3 className="text-xl font-bold text-[#222222] mb-2">Your bag is empty</h3>
                                <p className="text-slate-500 mb-10 leading-relaxed font-normal">
                                    Looks like you haven't added any products to your cart yet.
                                </p>
                                <Button
                                    className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg hover:shadow-primary/20 transition-all font-bold"
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    Browse Shop
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex gap-5 group">
                                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-50 bg-slate-50 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                                            {getImageSrc((item.product as any).image_url || item.product.image) ? (
                                                <img
                                                    src={getImageSrc((item.product as any).image_url || item.product.image)!}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <ShoppingBag className="h-8 w-8 text-slate-200" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col py-0.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-base font-bold text-[#222222] leading-tight line-clamp-2 pr-4">{item.product.name}</h4>
                                                <p className="font-bold text-primary">R{item.product.price.toFixed(2)}</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                                {item.product.seller || "Standard Partner"}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-transparent focus-within:border-primary/20 transition-all">
                                                    <button
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary hover:shadow-sm transition-all text-slate-400"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" strokeWidth={3} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-black text-[#222222]">{item.quantity}</span>
                                                    <button
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary hover:shadow-sm transition-all text-slate-400"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" strokeWidth={3} />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="h-10 w-10 flex items-center justify-center rounded-xl text-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                    onClick={() => removeFromCart(item.product.id)}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="px-8 py-8 border-t border-slate-50 space-y-6 bg-slate-50/30">
                            <div className="space-y-3">
                                <div className="flex justify-between text-base font-medium text-slate-400 font-normal">
                                    <span>Subtotal</span>
                                    <span className="text-[#222222] font-bold">R{total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base font-medium text-slate-400 font-normal">
                                    <span>Estimated Tax</span>
                                    <span className="text-[#222222] font-bold">R0.00</span>
                                </div>
                                <div className="flex justify-between pt-3 text-xl font-bold text-[#222222] border-t border-slate-100">
                                    <span>Total</span>
                                    <span className="text-primary font-black">R{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full h-16 rounded-2xl bg-primary text-white font-bold text-xl shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-1 font-bold"
                                    onClick={handleCheckout}
                                >
                                    <Lock className="h-5 w-5 mr-2" strokeWidth={2.5} /> Checkout
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-colors font-bold"
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    Continue Shopping
                                </Button>
                            </div>
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
